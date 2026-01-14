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
  const [editingText, setEditingText] = useState(null);
  const iframeRef = useRef(null);
  const dragDataRef = useRef(null);
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

    iframe.onload = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const style = doc.createElement('style');
      style.textContent = `
        * { box-sizing: border-box; }
        body { position: relative; min-height: 100vh; }
        .selected { 
          outline: 3px solid #8b5cf6 !important; 
          outline-offset: 2px;
        }
        .hover { 
          outline: 2px dashed #3b82f6 !important; 
          outline-offset: 2px; 
        }
        .dragging {
          opacity: 0.7 !important;
          cursor: grabbing !important;
        }
      `;
      doc.head.appendChild(style);

      // Prevent default link/button behavior
      doc.querySelectorAll('a, button').forEach(el => {
        el.onclick = e => e.preventDefault();
      });

      let isDragging = false;
      let clickedElement = null;

      // MOUSEDOWN - Start potential drag
      doc.onmousedown = (e) => {
        const el = e.target;
        
        // Ignore structural elements
        if (['BODY', 'HTML', 'MAIN', 'HEADER', 'FOOTER', 'SECTION', 'NAV'].includes(el.tagName)) {
          return;
        }

        clickedElement = el;
        isDragging = false;

        // If element is ALREADY selected, prepare for drag
        if (el.classList.contains('selected')) {
          e.preventDefault();
          
          const iframeRect = iframe.getBoundingClientRect();
          
          // Get all selected elements positions
          const elementsData = selectedElements.map(elem => {
            // Make sure element is positioned
            if (!elem.style.position || elem.style.position === 'static') {
              const rect = elem.getBoundingClientRect();
              const parentRect = elem.offsetParent?.getBoundingClientRect() || doc.body.getBoundingClientRect();
              
              elem.style.position = 'absolute';
              elem.style.left = (rect.left - parentRect.left) + 'px';
              elem.style.top = (rect.top - parentRect.top) + 'px';
              elem.style.width = rect.width + 'px';
            }
            
            return {
              el: elem,
              startLeft: parseFloat(elem.style.left) || 0,
              startTop: parseFloat(elem.style.top) || 0
            };
          });
          
          dragDataRef.current = {
            elements: elementsData,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            hasMoved: false
          };
        }
      };

      // MOUSEMOVE - Perform drag
      doc.onmousemove = (e) => {
        if (!dragDataRef.current) return;
        
        const dx = e.clientX - dragDataRef.current.startMouseX;
        const dy = e.clientY - dragDataRef.current.startMouseY;
        
        // Threshold to start drag
        if (!dragDataRef.current.hasMoved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
          dragDataRef.current.hasMoved = true;
          isDragging = true;
          dragDataRef.current.elements.forEach(data => {
            data.el.classList.add('dragging');
          });
        }
        
        if (dragDataRef.current.hasMoved) {
          dragDataRef.current.elements.forEach(data => {
            data.el.style.left = (data.startLeft + dx) + 'px';
            data.el.style.top = (data.startTop + dy) + 'px';
          });
        }
      };

      // MOUSEUP - Select or finish drag
      doc.onmouseup = (e) => {
        const el = e.target;
        
        // If we were dragging, save and stop
        if (isDragging) {
          dragDataRef.current.elements.forEach(data => {
            data.el.classList.remove('dragging');
          });
          notifyUpdateDebounced();
          dragDataRef.current = null;
          isDragging = false;
          clickedElement = null;
          return;
        }
        
        // If we had dragData but didn't move, it was just a click on selected element
        if (dragDataRef.current && !dragDataRef.current.hasMoved) {
          dragDataRef.current = null;
          clickedElement = null;
          return;
        }
        
        // Otherwise, handle selection
        if (['BODY', 'HTML', 'MAIN', 'HEADER', 'FOOTER', 'SECTION', 'NAV'].includes(el.tagName)) {
          doc.querySelectorAll('.selected').forEach(sel => sel.classList.remove('selected'));
          setSelectedElements([]);
          return;
        }
        
        // Multi-select with shift
        if (e.shiftKey) {
          if (el.classList.contains('selected')) {
            el.classList.remove('selected');
            setSelectedElements(prev => prev.filter(elem => elem !== el));
          } else {
            el.classList.add('selected');
            setSelectedElements(prev => [...prev, el]);
          }
        } else {
          // Single select
          doc.querySelectorAll('.selected').forEach(sel => sel.classList.remove('selected'));
          el.classList.add('selected');
          setSelectedElements([el]);
          loadProps(el);
        }
        
        clickedElement = null;
      };

      // Double-click to edit text
      doc.ondblclick = (e) => {
        e.preventDefault();
        const el = e.target;
        
        if (['H1','H2','H3','H4','H5','H6','P','SPAN','A','BUTTON','DIV','LI'].includes(el.tagName)) {
          el.contentEditable = 'true';
          el.focus();
          
          const range = doc.createRange();
          range.selectNodeContents(el);
          const sel = doc.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          
          setEditingText(el);
          
          el.onblur = () => {
            el.contentEditable = 'false';
            setEditingText(null);
            notifyUpdateDebounced();
          };
        }
      };

      // Hover effects
      doc.onmouseover = (e) => {
        if (!isDragging && !['BODY', 'HTML', 'MAIN', 'HEADER', 'FOOTER', 'SECTION', 'NAV'].includes(e.target.tagName)) {
          e.target.classList.add('hover');
        }
      };
      
      doc.onmouseout = (e) => {
        e.target.classList.remove('hover');
      };
    };
  }, [htmlContent, selectedElements]);

  const notifyUpdateDebounced = () => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      if (iframeRef.current?.contentDocument) {
        const html = iframeRef.current.contentDocument.documentElement.outerHTML;
        // Clean up editor classes
        const cleanedHTML = html
          .replace(/class="([^"]*)selected([^"]*)"/g, (match, before, after) => {
            const cleaned = (before + after).replace(/\s+hover/g, '').replace(/\s+dragging/g, '').replace(/\s+/g, ' ').trim();
            return cleaned ? `class="${cleaned}"` : '';
          })
          .replace(/\s+class=""\s*/g, ' ');
        onUpdate(cleanedHTML);
      }
    }, 500);
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
    notifyUpdateDebounced();
  };

  const deleteEl = () => {
    if (!confirm('Delete selected element(s)?')) return;
    selectedElements.forEach(el => el.remove());
    setSelectedElements([]);
    notifyUpdateDebounced();
  };

  const duplicate = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    
    selectedElements.forEach(el => {
      const clone = el.cloneNode(true);
      clone.classList.remove('selected', 'hover', 'dragging');
      
      // Offset the duplicate
      if (clone.style.position === 'absolute') {
        clone.style.left = (parseFloat(clone.style.left) + 20) + 'px';
        clone.style.top = (parseFloat(clone.style.top) + 20) + 'px';
      }
      
      el.parentNode.insertBefore(clone, el.nextSibling);
    });
    notifyUpdateDebounced();
  };

  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return '#ffffff';
    const m = rgb.match(/\d+/g);
    if (!m) return '#000000';
    return '#' + m.slice(0,3).map(x => ('0' + parseInt(x).toString(16)).slice(-2)).join('');
  };

  return (
    <div className="w-full h-full flex relative">
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
              {selectedElements.length === 1 ? 'Properties' : `${selectedElements.length} Selected`}
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
