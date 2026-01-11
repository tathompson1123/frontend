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
  const isDraggingRef = useRef(false);
  const dragElementRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

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

      // Add styles
      const style = doc.createElement('style');
      style.textContent = `
        * { box-sizing: border-box; }
        body { position: relative; min-height: 100vh; }
        .selected { outline: 3px solid #8b5cf6 !important; outline-offset: 2px; }
        .hover { outline: 2px dashed #3b82f6 !important; outline-offset: 2px; }
        .dragging { opacity: 0.5; cursor: move !important; }
      `;
      doc.head.appendChild(style);

      // Disable links/buttons
      doc.querySelectorAll('a, button').forEach(el => {
        el.onclick = (e) => e.preventDefault();
      });

      // Click to select
      doc.body.onclick = (e) => {
        if (isDraggingRef.current) return;
        e.stopPropagation();
        
        // Clear old selection
        doc.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        
        // Select new
        e.target.classList.add('selected');
        setSelectedElements([e.target]);
        loadProps(e.target);
      };

      // Double-click to edit
      doc.body.ondblclick = (e) => {
        e.stopPropagation();
        const el = e.target;
        if (['H1','H2','H3','H4','H5','H6','P','SPAN','A','BUTTON','DIV'].includes(el.tagName)) {
          el.contentEditable = 'true';
          el.focus();
          setEditingText(el);
          
          el.onblur = () => {
            el.contentEditable = 'false';
            setEditingText(null);
            saveChanges();
          };
        }
      };

      // Mousedown to start drag
      doc.body.onmousedown = (e) => {
        if (!e.target.classList.contains('selected')) return;
        
        e.preventDefault();
        const el = e.target;
        const rect = el.getBoundingClientRect();
        
        // Make absolute if not already
        if (el.style.position !== 'absolute') {
          const parent = el.parentElement;
          const parentRect = parent.getBoundingClientRect();
          
          el.style.position = 'absolute';
          el.style.left = (rect.left - parentRect.left) + 'px';
          el.style.top = (rect.top - parentRect.top) + 'px';
          el.style.width = rect.width + 'px';
          el.style.margin = '0';
        }
        
        isDraggingRef.current = true;
        dragElementRef.current = el;
        dragOffsetRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        
        el.classList.add('dragging');
      };

      // Hover effects
      doc.body.onmouseover = (e) => {
        if (!isDraggingRef.current) {
          e.target.classList.add('hover');
        }
      };

      doc.body.onmouseout = (e) => {
        e.target.classList.remove('hover');
      };
    };
  }, [htmlContent]);

  // Global mouse handlers
  useEffect(() => {
    const handleMove = (e) => {
      if (!isDraggingRef.current || !dragElementRef.current) return;
      
      const iframe = iframeRef.current;
      const iframeRect = iframe.getBoundingClientRect();
      const el = dragElementRef.current;
      const parent = el.parentElement;
      const parentRect = parent.getBoundingClientRect();
      
      // Calculate position relative to parent
      const x = e.clientX - iframeRect.left - dragOffsetRef.current.x - (parentRect.left - iframeRect.left);
      const y = e.clientY - iframeRect.top - dragOffsetRef.current.y - (parentRect.top - iframeRect.top);
      
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    };

    const handleUp = () => {
      if (isDraggingRef.current && dragElementRef.current) {
        dragElementRef.current.classList.remove('dragging');
        isDraggingRef.current = false;
        dragElementRef.current = null;
        saveChanges();
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  const loadProps = (el) => {
    const computed = window.getComputedStyle(el);
    setElementProps({
      width: el.style.width || computed.width,
      height: el.style.height || computed.height,
      fontSize: computed.fontSize,
      color: rgbToHex(computed.color),
      backgroundColor: rgbToHex(computed.backgroundColor),
      fontWeight: computed.fontWeight,
      textAlign: computed.textAlign,
      padding: computed.padding,
      margin: computed.margin
    });
  };

  const updateProp = (prop, value) => {
    selectedElements.forEach(el => {
      el.style[prop] = value;
    });
    setElementProps(prev => ({ ...prev, [prop]: value }));
    saveChanges();
  };

  const deleteSelected = () => {
    selectedElements.forEach(el => el.remove());
    setSelectedElements([]);
    saveChanges();
  };

  const duplicateSelected = () => {
    selectedElements.forEach(el => {
      const clone = el.cloneNode(true);
      clone.classList.remove('selected');
      clone.style.left = (parseInt(el.style.left || 0) + 20) + 'px';
      clone.style.top = (parseInt(el.style.top || 0) + 20) + 'px';
      el.parentNode.appendChild(clone);
    });
    saveChanges();
  };

  const saveChanges = () => {
    if (iframeRef.current?.contentDocument) {
      onUpdate(iframeRef.current.contentDocument.documentElement.outerHTML);
    }
  };

  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
    const match = rgb.match(/\d+/g);
    if (!match) return '#000000';
    return '#' + match.slice(0,3).map(x => {
      const hex = parseInt(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  return (
    <div className="w-full h-full flex">
      <div className="flex-1">
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          className="w-full h-full border-none"
        />
      </div>

      {selectedElements.length > 0 && (
        <div className="w-80 bg-white border-l overflow-y-auto">
          <div className="p-4 border-b bg-purple-50">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Properties</h3>
              <div className="flex gap-1">
                <button onClick={duplicateSelected} className="p-1 hover:bg-white rounded">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={deleteSelected} className="p-1 hover:bg-white rounded">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-2">Width</label>
              <input
                type="text"
                value={elementProps.width}
                onChange={(e) => updateProp('width', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2">Height</label>
              <input
                type="text"
                value={elementProps.height}
                onChange={(e) => updateProp('height', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2">Font Size</label>
              <input
                type="text"
                value={elementProps.fontSize}
                onChange={(e) => updateProp('fontSize', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2">Text Color</label>
              <input
                type="color"
                value={elementProps.color}
                onChange={(e) => updateProp('color', e.target.value)}
                className="w-full h-10 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2">Background</label>
              <input
                type="color"
                value={elementProps.backgroundColor}
                onChange={(e) => updateProp('backgroundColor', e.target.value)}
                className="w-full h-10 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
