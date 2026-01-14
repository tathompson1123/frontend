import { useState, useEffect, useRef } from 'react';
import { 
  Move, 
  Type, 
  Palette, 
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic
} from 'lucide-react';

export default function VisualEditor({ htmlContent, onUpdate, currentPage }) {
  const [selectedElements, setSelectedElements] = useState([]);
  const [guides, setGuides] = useState({ vertical: [], horizontal: [] });
  const iframeRef = useRef(null);
  const dragStateRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const eventHandlersRef = useRef(null);
  const isMouseDownRef = useRef(false); // Use ref instead of local variable
  const dragStartedRef = useRef(false); // Use ref instead of local variable

  const [elementProps, setElementProps] = useState({
    width: '',
    height: '',
    fontSize: '',
    color: '',
    backgroundColor: '',
    fontWeight: '',
    textAlign: '',
    padding: '',
    margin: ''
  });

  // Clear selection when page changes
  useEffect(() => {
    setSelectedElements([]);
    setGuides({ vertical: [], horizontal: [] });
    dragStateRef.current = null;
  }, [currentPage]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      console.log('❌ No iframe ref');
      return;
    }

    console.log('🔄 Setting up editor for page:', currentPage);

    const initEditor = () => {
      const doc = iframe.contentDocument;
      if (!doc) {
        console.log('❌ No contentDocument');
        return;
      }
      
      if (!doc.body) {
        console.log('❌ No body yet, waiting...');
        setTimeout(initEditor, 100);
        return;
      }
      
      // CRITICAL: Wait for actual content, not just empty body
      if (!doc.body.children || doc.body.children.length === 0) {
        console.log('⏳ Body is empty, waiting for content...');
        setTimeout(initEditor, 100);
        return;
      }

      console.log('✅ Initializing editor on body with', doc.body.children.length, 'children');

      // Remove old event listeners if they exist
      if (eventHandlersRef.current) {
        console.log('🧹 Cleaning up old handlers');
        const { doc: oldDoc, handlers } = eventHandlersRef.current;
        try {
          oldDoc.removeEventListener('mousedown', handlers.mousedown);
          oldDoc.removeEventListener('mousemove', handlers.mousemove);
          oldDoc.removeEventListener('mouseup', handlers.mouseup);
          oldDoc.removeEventListener('mouseover', handlers.mouseover);
          oldDoc.removeEventListener('mouseout', handlers.mouseout);
          oldDoc.removeEventListener('dblclick', handlers.dblclick);
        } catch (e) {
          console.log('Cleanup error (ok):', e.message);
        }
      }

      // Inject styles
      let style = doc.getElementById('editor-styles');
      if (!style) {
        style = doc.createElement('style');
        style.id = 'editor-styles';
        doc.head.appendChild(style);
      }
      
      style.textContent = `
        * { 
          box-sizing: border-box;
        }
        body { 
          position: relative !important;
          min-height: 100vh;
        }
        .editor-selected { 
          outline: 3px solid #8b5cf6 !important; 
          outline-offset: 2px !important;
          cursor: grab !important;
        }
        .editor-selected:active {
          cursor: grabbing !important;
        }
        .editor-hover { 
          outline: 2px dashed #3b82f6 !important; 
          outline-offset: 2px !important;
        }
        .editor-dragging {
          opacity: 0.8 !important;
          cursor: grabbing !important;
        }
      `;

      // Disable all links, buttons, and form submissions
      const preventDefaultActions = (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      doc.addEventListener('click', preventDefaultActions, true);
      doc.addEventListener('submit', preventDefaultActions, true);
      
      // Also prevent navigation on links
      doc.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', preventDefaultActions, true);
      });
      
      doc.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', preventDefaultActions, true);
      });

      // Setup event handlers
      const handleMouseDown = (e) => {
        const target = e.target;
        
        console.log('═══════════════════════════════════════');
        console.log('🟢 MOUSEDOWN EVENT');
        console.log('Target:', target.tagName, target.className);
        console.log('State BEFORE:');
        console.log('  - isMouseDown:', isMouseDownRef.current);
        console.log('  - dragStarted:', dragStartedRef.current);
        console.log('  - dragStateRef.current:', dragStateRef.current);
        console.log('  - Has editor-selected class:', target.classList.contains('editor-selected'));
        console.log('  - Currently selected elements:', doc.querySelectorAll('.editor-selected').length);
        
        // Ignore structural elements
        if (['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(target.tagName)) {
          console.log('❌ IGNORING - Structural element');
          console.log('═══════════════════════════════════════');
          return;
        }

        // ALWAYS prevent default for all clicks in editor mode
        e.preventDefault();
        e.stopPropagation();
        
        isMouseDownRef.current = true;
        dragStartedRef.current = false;
        
        console.log('State AFTER setting isMouseDown = true:');
        console.log('  - isMouseDown:', isMouseDownRef.current);
        console.log('  - dragStarted:', dragStartedRef.current);

        // If clicking on already selected element, prepare to drag
        if (target.classList.contains('editor-selected')) {
          console.log('✅ PREPARING TO DRAG (element already selected)');
          const iframeRect = iframe.getBoundingClientRect();
          const currentlySelected = Array.from(doc.querySelectorAll('.editor-selected'));
          console.log('  - Found', currentlySelected.length, 'selected elements');
          
          const elementsData = currentlySelected.map(elem => {
            prepareElementForDrag(elem, doc);
            const rect = elem.getBoundingClientRect();
            
            return {
              el: elem,
              startLeft: parseFloat(elem.style.left) || 0,
              startTop: parseFloat(elem.style.top) || 0,
              width: rect.width,
              height: rect.height
            };
          });
          
          dragStateRef.current = {
            elements: elementsData,
            startX: e.clientX,
            startY: e.clientY,
            moved: false,
            iframeRect: iframeRect
          };
          
          console.log('  - Created dragStateRef with', elementsData.length, 'elements');
        } else {
          // Clicking on new element
          console.log('✅ PREPARING TO SELECT (new element)');
          dragStateRef.current = {
            clickedElement: target,
            startX: e.clientX,
            startY: e.clientY,
            moved: false
          };
          console.log('  - Stored clickedElement for selection on mouseup');
        }
        
        console.log('Final dragStateRef.current:', dragStateRef.current);
        console.log('═══════════════════════════════════════');
      };

      const handleMouseMove = (e) => {
        if (!isMouseDownRef.current || !dragStateRef.current) {
          // Too noisy, only log if we expected to be dragging
          if (isMouseDownRef.current && !dragStateRef.current) {
            console.log('⚠️ MOUSEMOVE - isMouseDown true but no dragStateRef');
          }
          return;
        }

        const dx = e.clientX - dragStateRef.current.startX;
        const dy = e.clientY - dragStateRef.current.startY;
        
        // Only start drag if moved more than 5px
        if (!dragStartedRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
          console.log('───────────────────────────────────────');
          console.log('🔄 STARTING DRAG (moved >5px)');
          console.log('  - dx:', dx, 'dy:', dy);
          console.log('  - dragStateRef.current.elements:', dragStateRef.current.elements?.length);
          
          dragStartedRef.current = true;
          dragStateRef.current.moved = true;
          
          if (dragStateRef.current.elements) {
            dragStateRef.current.elements.forEach(data => {
              data.el.classList.add('editor-dragging');
            });
            console.log('  - Added editor-dragging class to', dragStateRef.current.elements.length, 'elements');
          }
          console.log('───────────────────────────────────────');
        }
        
        // Perform drag with snapping (only log when actually dragging)
        if (dragStartedRef.current && dragStateRef.current.elements) {
          const firstElement = dragStateRef.current.elements[0];
          
          let newLeft = firstElement.startLeft + dx;
          let newTop = firstElement.startTop + dy;
          
          const elemCenterX = newLeft + firstElement.width / 2;
          const elemCenterY = newTop + firstElement.height / 2;
          
          const snapThreshold = 10; // Slightly larger threshold for easier snapping
          const detectedGuides = { vertical: [], horizontal: [] };
          
          const iframeRect = dragStateRef.current.iframeRect;
          
          // Find parent section/container
          const draggingElement = firstElement.el;
          let parentSection = draggingElement.closest('section, header, footer, main, article, aside, div[class*="container"], div[class*="section"]');
          
          if (!parentSection) {
            parentSection = doc.body;
          }
          
          // Get parent section dimensions
          const parentRect = parentSection.getBoundingClientRect();
          const parentLeft = parentRect.left - iframeRect.left;
          const parentTop = parentRect.top - iframeRect.top;
          const parentCenterX = parentLeft + parentRect.width / 2;
          const parentCenterY = parentTop + parentRect.height / 2;
          
          // SNAP TO PARENT SECTION CENTER (Horizontal)
          if (Math.abs(elemCenterX - parentCenterX) < snapThreshold) {
            newLeft = parentCenterX - firstElement.width / 2;
            detectedGuides.vertical.push({ 
              x: parentCenterX, 
              type: 'center', 
              label: 'Section Center' 
            });
          }
          
          // SNAP TO PARENT SECTION CENTER (Vertical)
          if (Math.abs(elemCenterY - parentCenterY) < snapThreshold) {
            newTop = parentCenterY - firstElement.height / 2;
            detectedGuides.horizontal.push({ 
              y: parentCenterY, 
              type: 'center', 
              label: 'Section Center' 
            });
          }
          
          // SNAP TO OTHER ELEMENTS (Center to Center only)
          const siblingElements = Array.from(parentSection.querySelectorAll('*')).filter(el => 
            !dragStateRef.current.elements.some(data => data.el === el) &&
            !['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK', 'SECTION', 'HEADER', 'FOOTER', 'MAIN', 'ARTICLE', 'ASIDE'].includes(el.tagName) &&
            el.offsetParent !== null &&
            el.getBoundingClientRect().width > 20 &&
            el.getBoundingClientRect().height > 20 &&
            parentSection.contains(el)
          );
          
          siblingElements.forEach(other => {
            const otherRect = other.getBoundingClientRect();
            const otherCenterX = (otherRect.left - iframeRect.left) + otherRect.width / 2;
            const otherCenterY = (otherRect.top - iframeRect.top) + otherRect.height / 2;
            
            // Snap center to center (horizontal)
            if (Math.abs(elemCenterX - otherCenterX) < snapThreshold) {
              newLeft = otherCenterX - firstElement.width / 2;
              if (!detectedGuides.vertical.some(g => g.x === otherCenterX)) {
                detectedGuides.vertical.push({ 
                  x: otherCenterX, 
                  type: 'center', 
                  label: 'Element Center' 
                });
              }
            }
            
            // Snap center to center (vertical)
            if (Math.abs(elemCenterY - otherCenterY) < snapThreshold) {
              newTop = otherCenterY - firstElement.height / 2;
              if (!detectedGuides.horizontal.some(g => g.y === otherCenterY)) {
                detectedGuides.horizontal.push({ 
                  y: otherCenterY, 
                  type: 'center', 
                  label: 'Element Center' 
                });
              }
            }
          });
          
          // Limit to 1 guide per direction for cleaner UI
          setGuides({ 
            vertical: detectedGuides.vertical.slice(0, 1),
            horizontal: detectedGuides.horizontal.slice(0, 1) 
          });
          
          const deltaX = newLeft - firstElement.startLeft;
          const deltaY = newTop - firstElement.startTop;
          
          dragStateRef.current.elements.forEach(data => {
            data.el.style.left = (data.startLeft + deltaX) + 'px';
            data.el.style.top = (data.startTop + deltaY) + 'px';
          });
        }
      };

      const handleMouseUp = (e) => {
        console.log('═══════════════════════════════════════');
        console.log('🔵 MOUSEUP EVENT');
        console.log('State at mouseup:');
        console.log('  - isMouseDown:', isMouseDownRef.current);
        console.log('  - dragStarted:', dragStartedRef.current);
        console.log('  - dragStateRef.current:', dragStateRef.current);
        console.log('  - dragStateRef.current?.moved:', dragStateRef.current?.moved);
        
        if (!isMouseDownRef.current) {
          console.log('❌ ABORT - isMouseDown is false (event already handled or never started)');
          console.log('═══════════════════════════════════════');
          return;
        }
        
        isMouseDownRef.current = false;
        console.log('Set isMouseDown = false');
        
        // If we were dragging, save and cleanup
        if (dragStartedRef.current && dragStateRef.current?.elements) {
          console.log('✅ FINISHING DRAG');
          console.log('  - Removing editor-dragging class from', dragStateRef.current.elements.length, 'elements');
          
          dragStateRef.current.elements.forEach(data => {
            data.el.classList.remove('editor-dragging');
            console.log('    - Cleaned up:', data.el.tagName);
          });
          
          setGuides({ vertical: [], horizontal: [] });
          saveChanges();
          dragStateRef.current = null;
          dragStartedRef.current = false;
          
          console.log('✅ DRAG COMPLETE - All state reset');
          console.log('═══════════════════════════════════════');
          return;
        }
        
        // If we didn't drag, handle selection
        if (dragStateRef.current && !dragStateRef.current.moved) {
          console.log('✅ HANDLING SELECTION (no drag occurred)');
          const target = dragStateRef.current.clickedElement || e.target;
          
          console.log('  - Target to select:', target.tagName, target.className);
          
          if (['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(target.tagName)) {
            console.log('  - Clearing selection (structural element)');
            doc.querySelectorAll('.editor-selected').forEach(el => {
              el.classList.remove('editor-selected');
            });
            setSelectedElements([]);
            dragStateRef.current = null;
            dragStartedRef.current = false;
            console.log('═══════════════════════════════════════');
            return;
          }
          
          // Multi-select with shift
          if (e.shiftKey) {
            console.log('  - MULTI-SELECT MODE (Shift held)');
            if (target.classList.contains('editor-selected')) {
              console.log('    - Deselecting element');
              target.classList.remove('editor-selected');
              const newSelected = Array.from(doc.querySelectorAll('.editor-selected'));
              console.log('    - Now', newSelected.length, 'elements selected');
              setSelectedElements(newSelected);
            } else {
              console.log('    - Adding to selection');
              target.classList.add('editor-selected');
              const newSelected = Array.from(doc.querySelectorAll('.editor-selected'));
              console.log('    - Now', newSelected.length, 'elements selected');
              setSelectedElements(newSelected);
            }
          } else {
            // Single select
            console.log('  - SINGLE SELECT MODE');
            const previouslySelected = doc.querySelectorAll('.editor-selected');
            console.log('    - Clearing', previouslySelected.length, 'previously selected elements');
            
            previouslySelected.forEach(el => {
              el.classList.remove('editor-selected');
              console.log('      - Removed from:', el.tagName);
            });
            
            target.classList.add('editor-selected');
            console.log('    - ✅ Added editor-selected to:', target.tagName);
            console.log('    - Class list now:', target.className);
            
            setSelectedElements([target]);
            loadProps(target);
            console.log('    - Updated React state with 1 element');
          }
        } else if (!dragStateRef.current) {
          console.log('⚠️ No dragStateRef - this shouldn\'t happen');
        } else if (dragStateRef.current.moved) {
          console.log('⚠️ dragStateRef.moved is true but dragStarted is false - inconsistent state');
        }
        
        dragStateRef.current = null;
        dragStartedRef.current = false;
        
        console.log('✅ SELECTION COMPLETE - State reset');
        console.log('Final state:');
        console.log('  - isMouseDown:', isMouseDownRef.current);
        console.log('  - dragStarted:', dragStartedRef.current);
        console.log('  - dragStateRef.current:', dragStateRef.current);
        console.log('  - Elements with .editor-selected:', doc.querySelectorAll('.editor-selected').length);
        console.log('═══════════════════════════════════════');
      };

      const handleMouseOver = (e) => {
        if (isMouseDownRef.current || dragStartedRef.current) return;
        
        const target = e.target;
        if (!['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(target.tagName)) {
          target.classList.add('editor-hover');
        }
      };

      const handleMouseOut = (e) => {
        e.target.classList.remove('editor-hover');
      };

      const handleDoubleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const target = e.target;
        
        if (['H1','H2','H3','H4','H5','H6','P','SPAN','A','BUTTON','DIV','LI'].includes(target.tagName)) {
          target.contentEditable = 'true';
          target.focus();
          
          const range = doc.createRange();
          range.selectNodeContents(target);
          const sel = doc.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          
          const handleBlur = () => {
            target.contentEditable = 'false';
            target.removeEventListener('blur', handleBlur);
            saveChanges();
          };
          
          target.addEventListener('blur', handleBlur);
        }
      };

      // Attach event listeners
      doc.addEventListener('mousedown', handleMouseDown);
      doc.addEventListener('mousemove', handleMouseMove);
      doc.addEventListener('mouseup', handleMouseUp);
      doc.addEventListener('mouseover', handleMouseOver);
      doc.addEventListener('mouseout', handleMouseOut);
      doc.addEventListener('dblclick', handleDoubleClick);

      console.log('✅ Event listeners attached');
      console.log('   - mousedown:', !!handleMouseDown);
      console.log('   - mousemove:', !!handleMouseMove);
      console.log('   - mouseup:', !!handleMouseUp);

      // Store handlers for cleanup
      eventHandlersRef.current = {
        doc,
        handlers: {
          mousedown: handleMouseDown,
          mousemove: handleMouseMove,
          mouseup: handleMouseUp,
          mouseover: handleMouseOver,
          mouseout: handleMouseOut,
          dblclick: handleDoubleClick
        }
      };
      
      // Test that events work
      console.log('🧪 Testing event system...');
      doc.body.addEventListener('click', () => console.log('✅ Click event works!'), { once: true });
    };

    // Try multiple initialization strategies
    if (iframe.contentDocument?.readyState === 'complete') {
      console.log('📄 Document already complete');
      initEditor();
    } else {
      console.log('⏳ Waiting for iframe load...');
      iframe.onload = () => {
        console.log('✅ Iframe loaded');
        initEditor();
      };
      
      // Backup: try after a short delay
      setTimeout(() => {
        if (!eventHandlersRef.current) {
          console.log('⚠️ Handlers not attached, retrying...');
          initEditor();
        }
      }, 500);
    }

    return () => {
      // Cleanup on unmount
      if (eventHandlersRef.current) {
        const { doc, handlers } = eventHandlersRef.current;
        try {
          doc.removeEventListener('mousedown', handlers.mousedown);
          doc.removeEventListener('mousemove', handlers.mousemove);
          doc.removeEventListener('mouseup', handlers.mouseup);
          doc.removeEventListener('mouseover', handlers.mouseover);
          doc.removeEventListener('mouseout', handlers.mouseout);
          doc.removeEventListener('dblclick', handlers.dblclick);
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    };
  }, [currentPage]); // ONLY depend on currentPage, NOT htmlContent!

  const prepareElementForDrag = (elem, doc) => {
    const computed = window.getComputedStyle(elem);
    
    if (computed.position === 'static' || computed.position === 'relative' || !elem.style.position) {
      const rect = elem.getBoundingClientRect();
      const parentRect = elem.offsetParent?.getBoundingClientRect() || doc.body.getBoundingClientRect();
      
      const width = rect.width;
      const height = rect.height;
      
      elem.style.position = 'absolute';
      elem.style.left = (rect.left - parentRect.left) + 'px';
      elem.style.top = (rect.top - parentRect.top) + 'px';
      elem.style.width = width + 'px';
      elem.style.height = height + 'px';
      elem.style.margin = '0';
    }
  };

  const saveChanges = () => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    
    updateTimeoutRef.current = setTimeout(() => {
      if (iframeRef.current?.contentDocument) {
        const html = iframeRef.current.contentDocument.documentElement.outerHTML;
        
        const cleanedHTML = html
          .replace(/\s*class="([^"]*)"/g, (match, classes) => {
            const cleaned = classes
              .replace(/\s*editor-selected\s*/g, ' ')
              .replace(/\s*editor-hover\s*/g, ' ')
              .replace(/\s*editor-dragging\s*/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            return cleaned ? ` class="${cleaned}"` : '';
          })
          .replace(/\s+class=""\s*/g, ' ');
        
        onUpdate(cleanedHTML);
      }
    }, 300);
  };

  const loadProps = (el) => {
    const s = window.getComputedStyle(el);
    setElementProps({
      width: el.style.width || s.width,
      height: el.style.height || s.height,
      fontSize: s.fontSize,
      color: rgbToHex(s.color),
      backgroundColor: rgbToHex(s.backgroundColor),
      fontWeight: s.fontWeight,
      textAlign: s.textAlign,
      padding: s.padding,
      margin: s.margin
    });
  };

  const updateProp = (prop, val) => {
    selectedElements.forEach(el => el.style[prop] = val);
    setElementProps(p => ({ ...p, [prop]: val }));
    saveChanges();
  };

  const deleteEl = () => {
    if (!confirm('Delete selected element(s)?')) return;
    selectedElements.forEach(el => el.remove());
    setSelectedElements([]);
    saveChanges();
  };

  const duplicate = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    
    selectedElements.forEach(el => {
      const clone = el.cloneNode(true);
      clone.classList.remove('editor-selected', 'editor-hover', 'editor-dragging');
      
      if (clone.style.position === 'absolute') {
        clone.style.left = (parseFloat(clone.style.left || 0) + 20) + 'px';
        clone.style.top = (parseFloat(clone.style.top || 0) + 20) + 'px';
      }
      
      el.parentNode.insertBefore(clone, el.nextSibling);
    });
    saveChanges();
  };

  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return '#ffffff';
    const m = rgb.match(/\d+/g);
    if (!m) return '#000000';
    return '#' + m.slice(0,3).map(x => ('0' + parseInt(x).toString(16)).slice(-2)).join('');
  };

  return (
    <div className="w-full h-full flex relative">
      {/* Help Banner */}
      <div className="absolute top-4 left-4 z-50 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
        💡 Click to select • Drag to move (auto-snap) • Double-click to edit • Shift+Click for multi-select
      </div>

      <div className="flex-1 relative">
        <iframe 
          ref={iframeRef} 
          srcDoc={htmlContent} 
          className="w-full h-full border-none"
          title="Visual Editor"
        />
        
        {/* Snap Guide Lines - Only Center Alignment */}
        {guides.vertical.map((guide, i) => (
          <div 
            key={`v-${i}`}
            className="absolute pointer-events-none z-50"
            style={{ 
              left: `${guide.x}px`,
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: '#ef4444',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)'
            }}
          >
            <div className="absolute top-4 left-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold shadow-lg whitespace-nowrap">
              {guide.label}
            </div>
          </div>
        ))}
        
        {guides.horizontal.map((guide, i) => (
          <div 
            key={`h-${i}`}
            className="absolute pointer-events-none z-50"
            style={{ 
              top: `${guide.y}px`,
              left: 0,
              right: 0,
              height: '2px',
              backgroundColor: '#ef4444',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)'
            }}
          >
            <div className="absolute left-4 top-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold shadow-lg whitespace-nowrap">
              {guide.label}
            </div>
          </div>
        ))}
      </div>

      {selectedElements.length > 0 && (
        <div className="w-72 bg-white border-l overflow-y-auto flex-shrink-0">
          <div className="p-3 border-b bg-purple-50 flex justify-between items-center">
            <span className="font-bold text-sm">
              {selectedElements.length === 1 ? `${selectedElements[0].tagName}` : `${selectedElements.length} Selected`}
            </span>
            <div className="flex gap-1">
              <button 
                onClick={duplicate} 
                className="p-1.5 hover:bg-white rounded transition" 
                title="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                onClick={deleteEl} 
                className="p-1.5 hover:bg-white rounded transition" 
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-3">
            <div>
              <label className="text-xs font-bold block mb-1">Width</label>
              <input 
                type="text" 
                value={elementProps.width} 
                onChange={(e) => updateProp('width', e.target.value)} 
                className="w-full px-2 py-1 border rounded text-sm" 
                placeholder="auto" 
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Height</label>
              <input 
                type="text" 
                value={elementProps.height} 
                onChange={(e) => updateProp('height', e.target.value)} 
                className="w-full px-2 py-1 border rounded text-sm" 
                placeholder="auto" 
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Font Size</label>
              <input 
                type="text" 
                value={elementProps.fontSize} 
                onChange={(e) => updateProp('fontSize', e.target.value)} 
                className="w-full px-2 py-1 border rounded text-sm" 
              />
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => updateProp('fontWeight', elementProps.fontWeight === 'bold' || elementProps.fontWeight === '700' ? 'normal' : 'bold')} 
                className={`flex-1 p-2 border rounded transition ${elementProps.fontWeight === 'bold' || elementProps.fontWeight === '700' ? 'bg-purple-100' : 'hover:bg-gray-50'}`}
              >
                <Bold className="w-4 h-4 mx-auto" />
              </button>
              <button 
                onClick={() => updateProp('fontStyle', elementProps.fontStyle === 'italic' ? 'normal' : 'italic')} 
                className="flex-1 p-2 border rounded hover:bg-gray-50 transition"
              >
                <Italic className="w-4 h-4 mx-auto" />
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => updateProp('textAlign', 'left')} 
                className={`flex-1 p-2 border rounded transition ${elementProps.textAlign === 'left' ? 'bg-purple-100' : 'hover:bg-gray-50'}`}
              >
                <AlignLeft className="w-4 h-4 mx-auto" />
              </button>
              <button 
                onClick={() => updateProp('textAlign', 'center')} 
                className={`flex-1 p-2 border rounded transition ${elementProps.textAlign === 'center' ? 'bg-purple-100' : 'hover:bg-gray-50'}`}
              >
                <AlignCenter className="w-4 h-4 mx-auto" />
              </button>
              <button 
                onClick={() => updateProp('textAlign', 'right')} 
                className={`flex-1 p-2 border rounded transition ${elementProps.textAlign === 'right' ? 'bg-purple-100' : 'hover:bg-gray-50'}`}
              >
                <AlignRight className="w-4 h-4 mx-auto" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Text Color</label>
              <input 
                type="color" 
                value={elementProps.color} 
                onChange={(e) => updateProp('color', e.target.value)} 
                className="w-full h-10 cursor-pointer rounded" 
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Background Color</label>
              <input 
                type="color" 
                value={elementProps.backgroundColor} 
                onChange={(e) => updateProp('backgroundColor', e.target.value)} 
                className="w-full h-10 cursor-pointer rounded" 
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Padding</label>
              <input 
                type="text" 
                value={elementProps.padding} 
                onChange={(e) => updateProp('padding', e.target.value)} 
                className="w-full px-2 py-1 border rounded text-sm" 
                placeholder="0px" 
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Margin</label>
              <input 
                type="text" 
                value={elementProps.margin} 
                onChange={(e) => updateProp('margin', e.target.value)} 
                className="w-full px-2 py-1 border rounded text-sm" 
                placeholder="0px" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
