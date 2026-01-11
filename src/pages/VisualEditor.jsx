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
  const dragData = useRef(null);

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
        .selected { outline: 3px solid #8b5cf6 !important; outline-offset: 2px; cursor: move !important; }
        .hover { outline: 2px dashed #3b82f6 !important; outline-offset: 2px; }
      `;
      doc.head.appendChild(style);

      doc.querySelectorAll('a, button').forEach(el => {
        el.onclick = e => e.preventDefault();
      });

      // Click = select only
      doc.onclick = (e) => {
        if (dragData.current?.moved) {
          dragData.current = null;
          return;
        }

        e.preventDefault();
        doc.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        e.target.classList.add('selected');
        setSelectedElements([e.target]);
        loadProps(e.target);
      };

      // Double click = edit
      doc.ondblclick = (e) => {
        e.preventDefault();
        if (['H1','H2','H3','H4','H5','H6','P','SPAN','A','BUTTON','DIV'].includes(e.target.tagName)) {
          e.target.contentEditable = 'true';
          e.target.focus();
          setEditingText(e.target);
          e.target.onblur = () => {
            e.target.contentEditable = 'false';
            setEditingText(null);
            save();
          };
        }
      };

      // Mousedown on selected = prepare drag
    const handleMove = (e) => {
  if (!dragData.current) return;

  const dx = e.clientX - dragData.current.startX;
  const dy = e.clientY - dragData.current.startY;

  // Start dragging after 3px movement
  if (!dragData.current.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
    dragData.current.moved = true;
    const el = dragData.current.el;
    el.style.position = 'absolute';
    el.style.left = dragData.current.elStartX + 'px';
    el.style.top = dragData.current.elStartY + 'px';
    el.style.width = dragData.current.width + 'px';
    el.style.margin = '0';
    el.style.opacity = '0.6';
  }

  // Move element - keep mouse at same relative position
  if (dragData.current.moved) {
    const iframe = dragData.current.iframe;
    const iframeRect = iframe.getBoundingClientRect();
    
    const mouseXInIframe = e.clientX - iframeRect.left;
    const mouseYInIframe = e.clientY - iframeRect.top;
    
    // Position element so mouse stays at same offset
    const newX = mouseXInIframe - dragData.current.offsetX;
    const newY = mouseYInIframe - dragData.current.offsetY;
    
    dragData.current.el.style.left = newX + 'px';
    dragData.current.el.style.top = newY + 'px';
  }
};

      // IMPORTANT: Add mousemove and mouseup to iframe doc too
      doc.onmousemove = handleMove;
      doc.onmouseup = handleUp;

      doc.onmouseover = (e) => e.target.classList.add('hover');
      doc.onmouseout = (e) => e.target.classList.remove('hover');
    };
  }, [htmlContent]);

 const handleMove = (e) => {
  if (!dragData.current) return;

  const dx = e.clientX - dragData.current.startX;
  const dy = e.clientY - dragData.current.startY;

  // Start dragging after 3px movement
  if (!dragData.current.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
    dragData.current.moved = true;
    const el = dragData.current.el;
    el.style.position = 'absolute';
    el.style.left = dragData.current.elStartX + 'px';
    el.style.top = dragData.current.elStartY + 'px';
    el.style.width = dragData.current.width + 'px';
    el.style.margin = '0';
    el.style.opacity = '0.6';
  }

  // Move element
  if (dragData.current.moved) {
    const newX = dragData.current.elStartX + dx;
    const newY = dragData.current.elStartY + dy;
    
    dragData.current.el.style.left = newX + 'px';
    dragData.current.el.style.top = newY + 'px';
  }
};
  const handleUp = () => {
    if (dragData.current?.moved) {
      dragData.current.el.style.opacity = '1';
      save();
    }
    setTimeout(() => {
      dragData.current = null;
    }, 0);
  };

  // Also add to window for when mouse leaves iframe
  useEffect(() => {
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
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
      c.classList.remove('selected');
      c.style.left = (parseInt(el.style.left || 0) + 20) + 'px';
      c.style.top = (parseInt(el.style.top || 0) + 20) + 'px';
      el.parentNode.appendChild(c);
    });
    save();
  };

  const save = () => {
    if (iframeRef.current?.contentDocument) {
      onUpdate(iframeRef.current.contentDocument.documentElement.outerHTML);
    }
  };

  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
    const m = rgb.match(/\d+/g);
    if (!m) return '#000000';
    return '#' + m.slice(0,3).map(x => ('0' + parseInt(x).toString(16)).slice(-2)).join('');
  };

  return (
    <div className="w-full h-full flex">
      <iframe ref={iframeRef} srcDoc={htmlContent} className="flex-1 border-none" />

      {selectedElements.length > 0 && (
        <div className="w-72 bg-white border-l overflow-y-auto">
          <div className="p-3 border-b bg-purple-50 flex justify-between">
            <span className="font-bold">Properties</span>
            <div className="flex gap-1">
              <button onClick={duplicate} className="p-1 hover:bg-white rounded"><Copy className="w-4 h-4" /></button>
              <button onClick={deleteEl} className="p-1 hover:bg-white rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>
            </div>
          </div>

          <div className="p-3 space-y-3">
            <div>
              <label className="text-xs font-bold block mb-1">Width</label>
              <input type="text" value={elementProps.width} onChange={(e) => updateProp('width', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Height</label>
              <input type="text" value={elementProps.height} onChange={(e) => updateProp('height', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Font Size</label>
              <input type="text" value={elementProps.fontSize} onChange={(e) => updateProp('fontSize', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateProp('fontWeight', elementProps.fontWeight === 'bold' ? 'normal' : 'bold')} className={`flex-1 p-2 border rounded ${elementProps.fontWeight === 'bold' || elementProps.fontWeight === '700' ? 'bg-purple-100' : ''}`}>
                <Bold className="w-4 h-4 mx-auto" />
              </button>
              <button onClick={() => updateProp('fontStyle', 'italic')} className="flex-1 p-2 border rounded">
                <Italic className="w-4 h-4 mx-auto" />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => updateProp('textAlign', 'left')} className={`flex-1 p-2 border rounded ${elementProps.textAlign === 'left' ? 'bg-purple-100' : ''}`}><AlignLeft className="w-4 h-4 mx-auto" /></button>
              <button onClick={() => updateProp('textAlign', 'center')} className={`flex-1 p-2 border rounded ${elementProps.textAlign === 'center' ? 'bg-purple-100' : ''}`}><AlignCenter className="w-4 h-4 mx-auto" /></button>
              <button onClick={() => updateProp('textAlign', 'right')} className={`flex-1 p-2 border rounded ${elementProps.textAlign === 'right' ? 'bg-purple-100' : ''}`}><AlignRight className="w-4 h-4 mx-auto" /></button>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Text Color</label>
              <input type="color" value={elementProps.color} onChange={(e) => updateProp('color', e.target.value)} className="w-full h-10 cursor-pointer" />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Background</label>
              <input type="color" value={elementProps.backgroundColor} onChange={(e) => updateProp('backgroundColor', e.target.value)} className="w-full h-10 cursor-pointer" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
