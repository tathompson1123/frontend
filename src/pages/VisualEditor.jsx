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

      console.log('✅ Initializing editor on:', doc.body);

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
      let isMouseDown = false;
      let dragStarted = false;

      const handleMouseDown = (e) => {
        const target = e.target;
        
        console.log('MouseDown on:', target.tagName, target.className);
        
        // Ignore structural elements
        if (['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(target.tagName)) {
          console.log('Ignoring structural element');
          return;
        }

        // ALWAYS prevent default for all clicks in editor mode
        e.preventDefault();
        e.stopPropagation();
        
        isMouseDown = true;
        dragStarted = false;

        // If clicking on already selected element, prepare to drag
        if (target.classList.contains('editor-selected')) {
          console.log('Clicking on selected element - preparing drag');
          const iframeRect = iframe.getBoundingClientRect();
          const currentlySelected = Array.from(doc.querySelectorAll('.editor-selected'));
          
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
        } else {
          // Clicking on new element
          console.log('Clicking on new element - will select');
          dragStateRef.current = {
            clickedElement: target,
            startX: e.clientX,
            startY: e.clientY,
            moved: false
          };
        }
      };

      const handleMouseMove = (e) => {
        if (!isMouseDown || !dragStateRef.current) return;

        const dx = e.clientX - dragStateRef.current.startX;
        const dy = e.clientY - dragStateRef.current.startY;
        
        // Only start drag if moved more than 5px
        if (!dragStarted && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
          dragStarted = true;
          dragStateRef.current.moved = true;
          
          if (dragStateRef.current.elements) {
            dragStateRef.current.elements.forEach(data => {
              data.el.classList.add('editor-dragging');
            });
          }
        }
        
        // Perform drag with snapping
        if (dragStarted && dragStateRef.current.elements) {
          const firstElement = dragStateRef.current.elements[0];
          
          let newLeft = firstElement.startLeft + dx;
          let newTop = firstElement.startTop + dy;
          
          const elemCenterX = newLeft + firstElement.width / 2;
          const elemCenterY = newTop + firstElement.height / 2;
          const elemRight = newLeft + firstElement.width;
          const elemBottom = newTop + firstElement.height;
          
          const allElements = Array.from(doc.querySelectorAll('*')).filter(el => 
            !dragStateRef.current.elements.some(data => data.el === el) &&
            !['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(el.tagName) &&
            el.offsetParent !== null &&
            el.getBoundingClientRect().width > 10 &&
            el.getBoundingClientRect().height > 10
          );
          
          const snapThreshold = 8;
          const detectedGuides = { vertical: [], horizontal: [] };
          
          const iframeRect = dragStateRef.current.iframeRect;
          const pageWidth = doc.body.scrollWidth;
          const pageHeight = doc.body.scrollHeight;
          const pageCenterX = pageWidth / 2;
          const pageCenterY = pageHeight / 2;
          
          // SNAP TO PAGE CENTER
          if (Math.abs(elemCenterX - pageCenterX) < snapThreshold) {
            newLeft = pageCenterX - firstElement.width / 2;
            detectedGuides.vertical.push({ x: pageCenterX, type: 'center', label: 'Page Center' });
          }
          
          if (Math.abs(elemCenterY - pageCenterY) < snapThreshold) {
            newTop = pageCenterY - firstElement.height / 2;
            detectedGuides.horizontal.push({ y: pageCenterY, type: 'center', label: 'Page Center' });
          }
          
          // SNAP TO OTHER ELEMENTS
          allElements.forEach(other => {
            const otherRect = other.getBoundingClientRect();
            const otherLeft = otherRect.left - iframeRect.left;
            const otherTop = otherRect.top - iframeRect.top;
            const otherRight = otherLeft + otherRect.width;
            const otherBottom = otherTop + otherRect.height;
            const otherCenterX = otherLeft + otherRect.width / 2;
            const otherCenterY = otherTop + otherRect.height / 2;
            
            // Vertical snapping
            if (Math.abs(elemCenterX - otherCenterX) < snapThreshold) {
              newLeft = otherCenterX - firstElement.width / 2;
              detectedGuides.vertical.push({ x: otherCenterX, type: 'center', label: 'Center' });
            }
            if (Math.abs(newLeft - otherLeft) < snapThreshold) {
              newLeft = otherLeft;
              detectedGuides.vertical.push({ x: otherLeft, type: 'edge', label: 'Left Edge' });
            }
            if (Math.abs(newLeft - otherRight) < snapThreshold) {
              newLeft = otherRight;
              detectedGuides.vertical.push({ x: otherRight, type: 'edge', label: 'Right Edge' });
            }
            if (Math.abs(elemRight - otherLeft) < snapThreshold) {
              newLeft = otherLeft - firstElement.width;
              detectedGuides.vertical.push({ x: otherLeft, type: 'edge', label: 'Left Edge' });
            }
            if (Math.abs(elemRight - otherRight) < snapThreshold) {
              newLeft = otherRight - firstElement.width;
              detectedGuides.vertical.push({ x: otherRight, type: 'edge', label: 'Right Edge' });
            }
            
            // Horizontal snapping
            if (Math.abs(elemCenterY - otherCenterY) < snapThreshold) {
              newTop = otherCenterY - firstElement.height / 2;
              detectedGuides.horizontal.push({ y: otherCenterY, type: 'center', label: 'Center' });
            }
            if (Math.abs(newTop - otherTop) < snapThreshold) {
              newTop = otherTop;
              detectedGuides.horizontal.push({ y: otherTop, type: 'edge', label: 'Top Edge' });
            }
            if (Math.abs(newTop - otherBottom) < snapThreshold) {
              newTop = otherBottom;
              detectedGuides.horizontal.push({ y: otherBottom, type: 'edge', label: 'Bottom Edge' });
            }
            if (Math.abs(elemBottom - otherTop) < snapThreshold) {
              newTop = otherTop - firstElement.height;
              detectedGuides.horizontal.push({ y: otherTop, type: 'edge', label: 'Top Edge' });
            }
            if (Math.abs(elemBottom - otherBottom) < snapThreshold) {
              newTop = otherBottom - firstElement.height;
              detectedGuides.horizontal.push({ y: otherBottom, type: 'edge', label: 'Bottom Edge' });
            }
          });
          
          // Remove duplicates
          const uniqueVertical = [];
          const seenX = new Set();
          detectedGuides.vertical.forEach(guide => {
            if (!seenX.has(guide.x)) {
              seenX.add(guide.x);
              uniqueVertical.push(guide);
            }
          });
          
          const uniqueHorizontal = [];
          const seenY = new Set();
          detectedGuides.horizontal.forEach(guide => {
            if (!seenY.has(guide.y)) {
              seenY.add(guide.y);
              uniqueHorizontal.push(guide);
            }
          });
          
          setGuides({ 
            vertical: uniqueVertical.slice(0, 3),
            horizontal: uniqueHorizontal.slice(0, 3) 
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
        if (!isMouseDown) {
          console.log('MouseUp but isMouseDown is false');
          return;
        }
        
        console.log('MouseUp - dragStarted:', dragStarted, 'moved:', dragStateRef.current?.moved);
        
        isMouseDown = false;
        
        // If we were dragging, save and cleanup
        if (dragStarted && dragStateRef.current?.elements) {
          console.log('Finishing drag');
          dragStateRef.current.elements.forEach(data => {
            data.el.classList.remove('editor-dragging');
          });
          
          setGuides({ vertical: [], horizontal: [] });
          saveChanges();
          dragStateRef.current = null;
          return;
        }
        
        // If we didn't drag, handle selection
        if (dragStateRef.current && !dragStateRef.current.moved) {
          const target = dragStateRef.current.clickedElement || e.target;
          
          console.log('Selecting element:', target.tagName);
          
          if (['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(target.tagName)) {
            console.log('Clearing selection - clicked on structural element');
            // Clear selection
            doc.querySelectorAll('.editor-selected').forEach(el => {
              el.classList.remove('editor-selected');
            });
            setSelectedElements([]);
            dragStateRef.current = null;
            return;
          }
          
          // Multi-select with shift
          if (e.shiftKey) {
            console.log('Multi-select with shift');
            if (target.classList.contains('editor-selected')) {
              target.classList.remove('editor-selected');
              const newSelected = Array.from(doc.querySelectorAll('.editor-selected'));
              setSelectedElements(newSelected);
            } else {
              target.classList.add('editor-selected');
              const newSelected = Array.from(doc.querySelectorAll('.editor-selected'));
              setSelectedElements(newSelected);
            }
          } else {
            // Single select
            console.log('Single select');
            doc.querySelectorAll('.editor-selected').forEach(el => {
              el.classList.remove('editor-selected');
            });
            target.classList.add('editor-selected');
            console.log('Added editor-selected class to:', target.tagName);
            setSelectedElements([target]);
            loadProps(target);
          }
        }
        
        dragStateRef.current = null;
      };

      const handleMouseOver = (e) => {
        if (isMouseDown || dragStarted) return;
        
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
  }, [htmlContent]);

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
        
        {/* Snap Guide Lines */}
        {guides.vertical.map((guide, i) => (
          <div 
            key={`v-${i}`}
            className="absolute pointer-events-none z-50"
            style={{ 
              left: `${guide.x}px`,
              top: 0,
              bottom: 0,
              width: '1px',
              backgroundColor: guide.type === 'center' ? '#ef4444' : '#3b82f6',
              boxShadow: '0 0 4px rgba(0,0,0,0.3)'
            }}
          >
            <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded text-xs font-bold text-gray-700 shadow-lg whitespace-nowrap">
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
              height: '1px',
              backgroundColor: guide.type === 'center' ? '#ef4444' : '#3b82f6',
              boxShadow: '0 0 4px rgba(0,0,0,0.3)'
            }}
          >
            <div className="absolute left-2 top-2 bg-white px-2 py-1 rounded text-xs font-bold text-gray-700 shadow-lg whitespace-nowrap">
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
