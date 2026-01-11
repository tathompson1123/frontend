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
  const [guides, setGuides] = useState({ vertical: [], horizontal: [] });
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
        .hover { outline: 2px dashed #3b82f6 !important; outline-offset: 2px; cursor: pointer !important; }
        .guide-line { 
          position: fixed; 
          background: #ef4444; 
          z-index: 999998;
          pointer-events: none;
        }
        .guide-v { width: 1px; height: 100%; top: 0; }
        .guide-h { height: 1px; width: 100%; left: 0; }
      `;
      doc.head.appendChild(style);

      doc.querySelectorAll('a, button').forEach(el => {
        el.onclick = e => e.preventDefault();
      });

      // Mousedown = prepare drag
      doc.onmousedown = (e) => {
        const el = e.target;
        
        // Don't drag body, html, or large containers
        if (['BODY', 'HTML', 'MAIN', 'HEADER', 'FOOTER', 'SECTION', 'NAV'].includes(el.tagName)) {
          return;
        }

        e.preventDefault();

        const rect = el.getBoundingClientRect();
        const iframeRect = iframe.getBoundingClientRect();

        let currentLeft = parseInt(el.style.left) || 0;
        let currentTop = parseInt(el.style.top) || 0;
        
        if (el.style.position !== 'absolute') {
          currentLeft = rect.left - iframeRect.left;
          currentTop = rect.top - iframeRect.top;
        }

        dragData.current = {
          el: el,
          moved: false,
          startX: e.clientX,
          startY: e.clientY,
          elStartX: currentLeft,
          elStartY: currentTop,
          width: rect.width,
          height: rect.height,
          iframe: iframe,
          mouseOffsetX: (e.clientX - iframeRect.left) - currentLeft,
          mouseOffsetY: (e.clientY - iframeRect.top) - currentTop
        };
      };

      // Click = select (only if didn't drag)
      doc.onclick = (e) => {
        if (dragData.current?.moved) {
          dragData.current = null;
          return;
        }

        e.preventDefault();
        
        // Don't select body/html
        if (['BODY', 'HTML', 'MAIN', 'HEADER', 'FOOTER', 'SECTION', 'NAV'].includes(e.target.tagName)) {
          return;
        }
        
        doc.querySelectorAll('.selected').forEach(sel => sel.classList.remove('selected'));
        e.target.classList.add('selected');
        setSelectedElements([e.target]);
        loadProps(e.target);
        dragData.current = null;
      };

      // Double click = edit
      doc.ondblclick = (e) => {
        e.preventDefault();
        if (['H1','H2','H3','H4','H5','H6','P','SPAN','A','BUTTON','DIV','LI'].includes(e.target.tagName)) {
          e.target.contentEditable = 'true';
          e.target.focus();
          
          const range = doc.createRange();
          range.selectNodeContents(e.target);
          const sel = doc.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          
          setEditingText(e.target);
          e.target.onblur = () => {
            e.target.contentEditable = 'false';
            setEditingText(null);
            save();
          };
        }
      };

      doc.onmousemove = handleMove;
      doc.onmouseup = handleUp;
      doc.onmouseover = (e) => {
        if (!dragData.current?.moved && !['BODY', 'HTML', 'MAIN', 'HEADER', 'FOOTER', 'SECTION', 'NAV'].includes(e.target.tagName)) {
          e.target.classList.add('hover');
        }
      };
      doc.onmouseout = (e) => e.target.classList.remove('hover');
    };
  }, [htmlContent]);

  const handleMove = (e) => {
    if (!dragData.current) return;

    const dx = e.clientX - dragData.current.startX;
    const dy = e.clientY - dragData.current.startY;

    if (!dragData.current.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      dragData.current.moved = true;
      const el = dragData.current.el;
      
      // Select element when drag starts
      const doc = el.ownerDocument;
      doc.querySelectorAll('.selected').forEach(sel => sel.classList.remove('selected'));
      el.classList.add('selected');
      setSelectedElements([el]);
      loadProps(el);
      
      el.style.position = 'absolute';
      el.style.left = dragData.current.elStartX + 'px';
      el.style.top = dragData.current.elStartY + 'px';
      el.style.width = dragData.current.width + 'px';
      el.style.margin = '0';
      el.style.opacity = '0.6';
    }

    if (dragData.current.moved) {
      const iframe = dragData.current.iframe;
      const iframeRect = iframe.getBoundingClientRect();
      const doc = iframe.contentDocument;
      
      // Calculate new position
      const mouseXInIframe = e.clientX - iframeRect.left;
      const mouseYInIframe = e.clientY - iframeRect.top;
      
      let newX = mouseXInIframe - dragData.current.mouseOffsetX;
      let newY = mouseYInIframe - dragData.current.mouseOffsetY;
      
      // Snap threshold
      const snapThreshold = 5;
      const detectedGuides = { vertical: [], horizontal: [] };
      
      // Page center guide
      const pageWidth = doc.body.scrollWidth;
      const pageHeight = doc.body.scrollHeight;
      const pageCenterX = pageWidth / 2;
      const pageCenterY = pageHeight / 2;
      
      const elCenterX = newX + dragData.current.width / 2;
      const elCenterY = newY + dragData.current.height / 2;
      const elRight = newX + dragData.current.width;
      const elBottom = newY + dragData.current.height;
      
      // Snap to page center
      if (Math.abs(elCenterX - pageCenterX) < snapThreshold) {
        newX = pageCenterX - dragData.current.width / 2;
        detectedGuides.vertical.push(pageCenterX);
      }
      
      if (Math.abs(elCenterY - pageCenterY) < snapThreshold) {
        newY = pageCenterY - dragData.current.height / 2;
        detectedGuides.horizontal.push(pageCenterY);
      }
      
      // Snap to other elements
      const allElements = Array.from(doc.querySelectorAll('*')).filter(el => 
        el !== dragData.current.el && 
        !['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(el.tagName) &&
        el.offsetParent !== null
      );
      
      allElements.forEach(other => {
        const otherRect = other.getBoundingClientRect();
        const otherX = otherRect.left - iframeRect.left;
        const otherY = otherRect.top - iframeRect.top;
        const otherCenterX = otherX + otherRect.width / 2;
        const otherCenterY = otherY + otherRect.height / 2;
        const otherRight = otherX + otherRect.width;
        const otherBottom = otherY + otherRect.height;
        
        // Vertical alignment guides
        if (Math.abs(newX - otherX) < snapThreshold) {
          newX = otherX;
          detectedGuides.vertical.push(otherX);
        } else if (Math.abs(elCenterX - otherCenterX) < snapThreshold) {
          newX = otherCenterX - dragData.current.width / 2;
          detectedGuides.vertical.push(otherCenterX);
        } else if (Math.abs(elRight - otherRight) < snapThreshold) {
          newX = otherRight - dragData.current.width;
          detectedGuides.vertical.push(otherRight);
        }
        
        // Horizontal alignment guides
        if (Math.abs(newY - otherY) < snapThreshold) {
          newY = otherY;
          detectedGuides.horizontal.push(otherY);
        } else if (Math.abs(elCenterY - otherCenterY) < snapThreshold) {
          newY = otherCenterY - dragData.current.height / 2;
          detectedGuides.horizontal.push(otherCenterY);
        } else if (Math.abs(elBottom - otherBottom) < snapThreshold) {
          newY = otherBottom - dragData.current.height;
          detectedGuides.horizontal.push(otherBottom);
        }
      });
      
      setGuides(detectedGuides);
      
      dragData.current.el.style.left = newX + 'px';
      dragData.current.el.style.top = newY + 'px';
    }
  };

  const handleUp = () => {
    if (dragData.current?.moved) {
      dragData.current.el.style.opacity = '1';
      setGuides({ vertical: [], horizontal: [] });
      save();
    }
    setTimeout(() => {
      dragData.current = null;
    }, 0);
  };

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
      c.style.position = 'absolute';
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
    <div className="w-full h-full flex relative">
      <div className="flex-1 relative">
        <iframe ref={iframeRef} srcDoc={htmlContent} className="w-full h-full border-none" />
        
        {/* Alignment Guides */}
        {guides.vertical.map((x, i) => (
          <div key={`v-${i}`} className="absolute w-px h-full bg-red-500 pointer-events-none z-50" style={{ left: `${x}px` }} />
        ))}
        {guides.horizontal.map((y, i) => (
          <div key={`h-${i}`} className="absolute w-full h-px bg-red-500 pointer-events-none z-50" style={{ top: `${y}px` }} />
        ))}
      </div>

      {selectedElements.length > 0 && (
        <div className="w-72 bg-white border-l overflow-y-auto flex-shrink-0">
          <div className="p-3 border-b bg-purple-50 flex justify-between">
            <span className="font-bold">Properties</span>
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
              <input type="text" value={elementProps.width} onChange={(e) => updateProp('width', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="auto" />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Height</label>
              <input type="text" value={elementProps.height} onChange={(e) => updateProp('height', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="auto" />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Font Size</label>
              <input type="text" value={elementProps.fontSize} onChange={(e) => updateProp('fontSize', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => updateProp('fontWeight', elementProps.fontWeight === 'bold' || elementProps.fontWeight === '700' ? 'normal' : 'bold')} className={`flex-1 p-2 border rounded ${elementProps.fontWeight === 'bold' || elementProps.fontWeight === '700' ? 'bg-purple-100' : ''}`}>
                <Bold className="w-4 h-4 mx-auto" />
              </button>
              <button onClick={() => updateProp('fontStyle', elementProps.fontStyle === 'italic' ? 'normal' : 'italic')} className="flex-1 p-2 border rounded">
                <Italic className="w-4 h-4 mx-auto" />
              </button>
            </div>

            <div className="flex gap-2">
              <button onClick={() => updateProp('textAlign', 'left')} className={`flex-1 p-2 border rounded ${elementProps.textAlign === 'left' ? 'bg-purple-100' : ''}`}>
                <AlignLeft className="w-4 h-4 mx-auto" />
              </button>
              <button onClick={() => updateProp('textAlign', 'center')} className={`flex-1 p-2 border rounded ${elementProps.textAlign === 'center' ? 'bg-purple-100' : ''}`}>
                <AlignCenter className="w-4 h-4 mx-auto" />
              </button>
              <button onClick={() => updateProp('textAlign', 'right')} className={`flex-1 p-2 border rounded ${elementProps.textAlign === 'right' ? 'bg-purple-100' : ''}`}>
                <AlignRight className="w-4 h-4 mx-auto" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Text Color</label>
              <input type="color" value={elementProps.color} onChange={(e) => updateProp('color', e.target.value)} className="w-full h-10 cursor-pointer rounded" />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Background Color</label>
              <input type="color" value={elementProps.backgroundColor} onChange={(e) => updateProp('backgroundColor', e.target.value)} className="w-full h-10 cursor-pointer rounded" />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Padding</label>
              <input type="text" value={elementProps.padding} onChange={(e) => updateProp('padding', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="0px" />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Margin</label>
              <input type="text" value={elementProps.margin} onChange={(e) => updateProp('margin', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="0px" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
