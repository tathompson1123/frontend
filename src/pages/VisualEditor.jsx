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
  
  // Simple drag state
  const dragRef = useRef({
    active: false,
    element: null,
    startMouseX: 0,
    startMouseY: 0,
    startElementX: 0,
    startElementY: 0
  });

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
    setupIframe();
  }, [htmlContent]);

  const setupIframe = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    iframe.onload = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      // Inject CSS
      const style = doc.createElement('style');
      style.textContent = `
        * { box-sizing: border-box; }
        body { position: relative; min-height: 100vh; }
        .ve-selected { 
          outline: 3px solid #8b5cf6 !important; 
          outline-offset: 2px;
          cursor: move !important;
        }
        .ve-hover { 
          outline: 2px dashed #3b82f6 !important; 
          outline-offset: 2px; 
        }
        .ve-dragging { 
          opacity: 0.6 !important;
          z-index: 99999 !important;
        }
      `;
      doc.head.appendChild(style);

      // Prevent default behaviors
      doc.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('click', e => e.preventDefault(), true);
      });

      // Click to select
      doc.addEventListener('click', (e) => {
        if (dragRef.current.active) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Clear previous
        doc.querySelectorAll('.ve-selected').forEach(el => {
          el.classList.remove('ve-selected');
        });
        
        // Select clicked
        e.target.classList.add('ve-selected');
        setSelectedElements([e.target]);
        loadProps(e.target);
      }, true);

      // Double-click to edit
      doc.addEventListener('dblclick', (e) => {
        e.preventDefault();
        const el = e.target;
        const textTags = ['H1','H2','H3','H4','H5','H6','P','SPAN','A','BUTTON','DIV','LI'];
        
        if (textTags.includes(el.tagName)) {
          el.contentEditable = 'true';
          el.focus();
          
          // Select all text
          const range = doc.createRange();
          range.selectNodeContents(el);
          const sel = doc.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          
          setEditingText(el);
          
          const blur = () => {
            el.contentEditable = 'false';
            setEditingText(null);
            save();
          };
          el.addEventListener('blur', blur, { once: true });
        }
      }, true);

      // Start drag
      doc.addEventListener('mousedown', (e) => {
        if (!e.target.classList.contains('ve-selected')) return;
        if (editingText) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const el = e.target;
        const rect = el.getBoundingClientRect();
        const iframeRect = iframe.getBoundingClientRect();
        
        // Convert to absolute positioning
        if (el.style.position !== 'absolute') {
          el.style.position = 'absolute';
          el.style.left = (rect.left - iframeRect.left) + 'px';
          el.style.top = (rect.top - iframeRect.top) + 'px';
          el.style.width = rect.width + 'px';
          el.style.margin = '0';
        }
        
        dragRef.current = {
          active: true,
          element: el,
          startMouseX: e.clientX,
          startMouseY: e.clientY,
          startElementX: parseInt(el.style.left) || 0,
          startElementY: parseInt(el.style.top) || 0
        };
        
        el.classList.add('ve-dragging');
      }, true);

      // Hover effects
      doc.addEventListener('mouseover', (e) => {
        if (!dragRef.current.active) {
          e.target.classList.add('ve-hover');
        }
      });
      
      doc.addEventListener('mouseout', (e) => {
        e.target.classList.remove('ve-hover');
      });
    };
  };

  // Global mouse move
  useEffect(() => {
    const move = (e) => {
      if (!dragRef.current.active || !dragRef.current.element) return;
      
      requestAnimationFrame(() => {
        const dx = e.clientX - dragRef.current.startMouseX;
        const dy = e.clientY - dragRef.current.startMouseY;
        
        const newX = dragRef.current.startElementX + dx;
        const newY = dragRef.current.startElementY + dy;
        
        dragRef.current.element.style.left = newX + 'px';
        dragRef.current.element.style.top = newY + 'px';
      });
    };

    const up = () => {
      if (dragRef.current.active) {
        if (dragRef.current.element) {
          dragRef.current.element.classList.remove('ve-dragging');
        }
        dragRef.current.active = false;
        save();
      }
    };

    window.addEventListener('mousemove', move, { passive: true });
    window.addEventListener('mouseup', up);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, []);

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
    save();
  };

  const deleteEl = () => {
    selectedElements.forEach(el => el.remove());
    setSelectedElements([]);
    save();
  };

  const duplicate = () => {
    selectedElements.forEach(el => {
      const c = el.cloneNode(true);
      c.classList.remove('ve-selected');
      c.style.left = (parseInt(el.style.left || 0) + 20) + 'px';
      c.style.top = (parseInt(el.style.top || 0) + 20) + 'px';
      el.parentNode.appendChild(c);
    });
    save();
  };

  const save = () => {
    if (iframeRef.current?.contentDocument) {
      const html = iframeRef.current.contentDocument.documentElement.outerHTML;
      onUpdate(html);
    }
  };

  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
    const m = rgb.match(/\d+/g);
    if (!m) return '#000000';
    return '#' + m.slice(0,3).map(x => {
      const h = parseInt(x).toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('');
  };

  return (
    <div className="w-full h-full flex">
      <iframe
        ref={iframeRef}
        srcDoc={htmlContent}
        className="flex-1 border-none bg-white"
      />

      {selectedElements.length > 0 && (
        <div className="w-72 bg-white border-l overflow-y-auto flex-shrink-0">
          <div className="p-3 border-b bg-purple-50 flex justify-between items-center">
            <span className="font-bold text-sm">Properties</span>
            <div className="flex gap-1">
              <button onClick={duplicate} className="p-1 hover:bg-white rounded" title="Duplicate">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={deleteEl} className="p-1 hover:bg-white rounded" title="Delete">
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
                onClick={() => updateProp('fontWeight', elementProps.fontWeight === 'bold' ? 'normal' : 'bold')}
                className={`flex-1 p-2 border rounded ${elementProps.fontWeight === 'bold' || elementProps.fontWeight === '700' ? 'bg-purple-100' : ''}`}
              >
                <Bold className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => updateProp('fontStyle', elementProps.fontStyle === 'italic' ? 'normal' : 'italic')}
                className="flex-1 p-2 border rounded"
              >
                <Italic className="w-4 h-4 mx-auto" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => updateProp('textAlign', 'left')}
                className={`flex-1 p-2 border rounded ${elementProps.textAlign === 'left' ? 'bg-purple-100' : ''}`}
              >
                <AlignLeft className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => updateProp('textAlign', 'center')}
                className={`flex-1 p-2 border rounded ${elementProps.textAlign === 'center' ? 'bg-purple-100' : ''}`}
              >
                <AlignCenter className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => updateProp('textAlign', 'right')}
                className={`flex-1 p-2 border rounded ${elementProps.textAlign === 'right' ? 'bg-purple-100' : ''}`}
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
              <label className="text-xs font-bold block mb-1">Background</label>
              <input
                type="color"
                value={elementProps.backgroundColor}
                onChange={(e) => updateProp('backgroundColor', e.target.value)}
                className="w-full h-10 cursor-pointer rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
