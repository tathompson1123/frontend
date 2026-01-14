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
  const iframeRef = useRef(null);
  const dragStateRef = useRef(null);
  const updateTimeoutRef = useRef(null);

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

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const initEditor = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

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

      // Disable all links and buttons
      doc.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' || e.target.closest('a')) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);

      setupEventListeners(doc);
    };

    if (iframe.contentDocument?.readyState === 'complete') {
      initEditor();
    } else {
      iframe.onload = initEditor;
    }

  }, [htmlContent]);

  const setupEventListeners = (doc) => {
    let isMouseDown = false;
    let dragStarted = false;

    const handleMouseDown = (e) => {
      const target = e.target;
      
      // Ignore structural elements
      if (['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(target.tagName)) {
        return;
      }

      // Prevent default ONLY for our drag operation
      e.preventDefault();
      e.stopPropagation();
      
      isMouseDown = true;
      dragStarted = false;

      // If clicking on already selected element, prepare to drag
      if (target.classList.contains('editor-selected')) {
        const iframeRect = iframeRef.current.getBoundingClientRect();
        
        // Convert all selected elements to absolutely positioned
        const elementsData = selectedElements.map(elem => {
          prepareElementForDrag(elem, doc);
          
          return {
            el: elem,
            startLeft: parseFloat(elem.style.left) || 0,
            startTop: parseFloat(elem.style.top) || 0
          };
        });
        
        dragStateRef.current = {
          elements: elementsData,
          startX: e.clientX,
          startY: e.clientY,
          moved: false
        };
      } else {
        // Clicking on new element - will select on mouseup
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
        
        // Add dragging class
        if (dragStateRef.current.elements) {
          dragStateRef.current.elements.forEach(data => {
            data.el.classList.add('editor-dragging');
          });
        }
      }
      
      // Perform drag
      if (dragStarted && dragStateRef.current.elements) {
        dragStateRef.current.elements.forEach(data => {
          const newLeft = data.startLeft + dx;
          const newTop = data.startTop + dy;
          
          data.el.style.left = newLeft + 'px';
          data.el.style.top = newTop + 'px';
        });
      }
    };

    const handleMouseUp = (e) => {
      if (!isMouseDown) return;
      
      isMouseDown = false;
      
      // If we were dragging, save and cleanup
      if (dragStarted && dragStateRef.current?.elements) {
        dragStateRef.current.elements.forEach(data => {
          data.el.classList.remove('editor-dragging');
        });
        
        saveChanges();
        dragStateRef.current = null;
        return;
      }
      
      // If we didn't drag, handle selection
      if (dragStateRef.current && !dragStateRef.current.moved) {
        const target = dragStateRef.current.clickedElement || e.target;
        
        if (['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(target.tagName)) {
          clearSelection(doc);
          dragStateRef.current = null;
          return;
        }
        
        // Multi-select with shift
        if (e.shiftKey) {
          if (target.classList.contains('editor-selected')) {
            target.classList.remove('editor-selected');
            setSelectedElements(prev => prev.filter(el => el !== target));
          } else {
            target.classList.add('editor-selected');
            setSelectedElements(prev => [...prev, target]);
          }
        } else {
          // Single select
          clearSelection(doc);
          target.classList.add('editor-selected');
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
        
        target.addEventListener('blur', function handleBlur() {
          target.contentEditable = 'false';
          target.removeEventListener('blur', handleBlur);
          saveChanges();
        }, { once: true });
      }
    };

    // Attach event listeners
    doc.addEventListener('mousedown', handleMouseDown);
    doc.addEventListener('mousemove', handleMouseMove);
    doc.addEventListener('mouseup', handleMouseUp);
    doc.addEventListener('mouseover', handleMouseOver);
    doc.addEventListener('mouseout', handleMouseOut);
    doc.addEventListener('dblclick', handleDoubleClick);
  };

  const prepareElementForDrag = (elem, doc) => {
    // If element is not positioned, convert it
    const computed = window.getComputedStyle(elem);
    
    if (computed.position === 'static' || computed.position === 'relative' || !elem.style.position) {
      const rect = elem.getBoundingClientRect();
      const parentRect = elem.offsetParent?.getBoundingClientRect() || doc.body.getBoundingClientRect();
      
      // Store original dimensions
      const width = rect.width;
      const height = rect.height;
      
      // Convert to absolute positioning
      elem.style.position = 'absolute';
      elem.style.left = (rect.left - parentRect.left) + 'px';
      elem.style.top = (rect.top - parentRect.top) + 'px';
      elem.style.width = width + 'px';
      elem.style.height = height + 'px';
      elem.style.margin = '0';
    }
  };

  const clearSelection = (doc) => {
    doc.querySelectorAll('.editor-selected').forEach(el => {
      el.classList.remove('editor-selected');
    });
    setSelectedElements([]);
  };

  const saveChanges = () => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    
    updateTimeoutRef.current = setTimeout(() => {
      if (iframeRef.current?.contentDocument) {
        const html = iframeRef.current.contentDocument.documentElement.outerHTML;
        
        // Clean up editor classes
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
      
      // Offset the duplicate
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
        💡 Click to select • Drag to move • Double-click to edit text • Shift+Click for multi-select
      </div>

      <div className="flex-1 relative">
        <iframe 
          ref={iframeRef} 
          srcDoc={htmlContent} 
          className="w-full h-full border-none"
          title="Visual Editor"
        />
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
