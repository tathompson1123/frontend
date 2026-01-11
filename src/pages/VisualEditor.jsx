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
  const [selectionBox, setSelectionBox] = useState(null);
  const iframeRef = useRef(null);
  const dragData = useRef(null);
  const selectionData = useRef(null);
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
        .selected { outline: 3px solid #8b5cf6 !important; outline-offset: 2px; cursor: move !important; }
        .hover { outline: 2px dashed #3b82f6 !important; outline-offset: 2px; cursor: pointer !important; }
      `;
      doc.head.appendChild(style);

      doc.querySelectorAll('a, button').forEach(el => {
        el.onclick = e => e.preventDefault();
      });

      // Mousedown = prepare drag or selection
      doc.onmousedown = (e) => {
        const el = e.target;
        
        if (['BODY', 'HTML'].includes(el.tagName)) {
          e.preventDefault();
          const iframeRect = iframe.getBoundingClientRect();
          selectionData.current = {
            startX: e.clientX - iframeRect.left,
            startY: e.clientY - iframeRect.top,
            iframe: iframe
          };
          return;
        }

        if (['MAIN', 'HEADER', 'FOOTER', 'SECTION', 'NAV'].includes(el.tagName)) {
          return;
        }

        e.preventDefault();

        const iframeRect = iframe.getBoundingClientRect();
        const rect = el.getBoundingClientRect();

        if (el.classList.contains('selected')) {
          const elementsData = selectedElements.map(elem => {
            const elemRect = elem.getBoundingClientRect();
            return {
              el: elem,
              startLeft: elemRect.left - iframeRect.left,
              startTop: elemRect.top - iframeRect.top,
              width: elemRect.width,
              height: elemRect.height
            };
          });
          
          const firstRect = selectedElements[0].getBoundingClientRect();
          
          dragData.current = {
            elements: elementsData,
            moved: false,
            startMouseX: e.clientX - iframeRect.left,
            startMouseY: e.clientY - iframeRect.top,
            clickOffsetX: (e.clientX - iframeRect.left) - (firstRect.left - iframeRect.left),
            clickOffsetY: (e.clientY - iframeRect.top) - (firstRect.top - iframeRect.top),
            iframe: iframe
          };
          return;
        }

        // Single element
        dragData.current = {
          elements: [{
            el: el,
            startLeft: rect.left - iframeRect.left,
            startTop: rect.top - iframeRect.top,
            width: rect.width,
            height: rect.height
          }],
          moved: false,
          startMouseX: e.clientX - iframeRect.left,
          startMouseY: e.clientY - iframeRect.top,
          clickOffsetX: (e.clientX - iframeRect.left) - (rect.left - iframeRect.left),
          clickOffsetY: (e.clientY - iframeRect.top) - (rect.top - iframeRect.top),
          iframe: iframe
        };
      };

      doc.onclick = (e) => {
        if (dragData.current?.moved || selectionData.current) {
          dragData.current = null;
          selectionData.current = null;
          return;
        }

        e.preventDefault();
        
        if (['BODY', 'HTML', 'MAIN', 'HEADER', 'FOOTER', 'SECTION', 'NAV'].includes(e.target.tagName)) {
          return;
        }
        
        if (!e.shiftKey) {
          doc.querySelectorAll('.selected').forEach(sel => sel.classList.remove('selected'));
          e.target.classList.add('selected');
          setSelectedElements([e.target]);
          loadProps(e.target);
        } else {
          if (e.target.classList.contains('selected')) {
            e.target.classList.remove('selected');
            setSelectedElements(prev => prev.filter(el => el !== e.target));
          } else {
            e.target.classList.add('selected');
            setSelectedElements(prev => [...prev, e.target]);
          }
        }
        
        dragData.current = null;
      };

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
            notifyUpdateDebounced();
          };
        }
      };

      doc.onmousemove = handleMove;
      doc.onmouseup = handleUp;
      doc.onmouseover = (e) => {
        if (!dragData.current?.moved && !selectionData.current && !['BODY', 'HTML', 'MAIN', 'HEADER', 'FOOTER', 'SECTION', 'NAV'].includes(e.target.tagName)) {
          e.target.classList.add('hover');
        }
      };
      doc.onmouseout = (e) => e.target.classList.remove('hover');
    };
  }, [htmlContent, selectedElements]);

  const handleMove = (e) => {
    if (selectionData.current) {
      const iframe = selectionData.current.iframe;
      const iframeRect = iframe.getBoundingClientRect();
      const doc = iframe.contentDocument;
      
      const currentX = e.clientX - iframeRect.left;
      const currentY = e.clientY - iframeRect.top;
      
      const boxLeft = Math.min(selectionData.current.startX, currentX);
      const boxTop = Math.min(selectionData.current.startY, currentY);
      const boxWidth = Math.abs(currentX - selectionData.current.startX);
      const boxHeight = Math.abs(currentY - selectionData.current.startY);
      
      setSelectionBox({ left: boxLeft, top: boxTop, width: boxWidth, height: boxHeight });
      
      const allElements = Array.from(doc.querySelectorAll('*')).filter(el => 
        !['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK', 'MAIN', 'HEADER', 'FOOTER', 'SECTION', 'NAV'].includes(el.tagName) &&
        el.offsetParent !== null
      );
      
      allElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const elLeft = rect.left - iframeRect.left;
        const elTop = rect.top - iframeRect.top;
        
        if (elLeft >= boxLeft && elLeft + rect.width <= boxLeft + boxWidth && 
            elTop >= boxTop && elTop + rect.height <= boxTop + boxHeight) {
          el.classList.add('selected');
        } else {
          el.classList.remove('selected');
        }
      });
      
      return;
    }

    if (!dragData.current) return;

    const iframeRect = dragData.current.iframe.getBoundingClientRect();
    const mouseX = e.clientX - iframeRect.left;
    const mouseY = e.clientY - iframeRect.top;
    
    const dx = mouseX - dragData.current.startMouseX;
    const dy = mouseY - dragData.current.startMouseY;

    if (!dragData.current.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      dragData.current.moved = true;
      
      dragData.current.elements.forEach(data => {
        const el = data.el;
        if (!el.classList.contains('selected')) {
          el.ownerDocument.querySelectorAll('.selected').forEach(sel => sel.classList.remove('selected'));
          el.classList.add('selected');
          setSelectedElements([el]);
          loadProps(el);
        }
        
        el.style.position = 'absolute';
        el.style.left = data.startLeft + 'px';
        el.style.top = data.startTop + 'px';
        el.style.width = data.width + 'px';
        el.style.margin = '0';
        el.style.opacity = '0.6';
      });
    }

    if (dragData.current.moved) {
      const doc = dragData.current.iframe.contentDocument;
      
      // Calculate new position (mouse minus click offset)
      let newX = mouseX - dragData.current.clickOffsetX;
      let newY = mouseY - dragData.current.clickOffsetY;
      
      const snapThreshold = 5;
      const detectedGuides = { vertical: [], horizontal: [] };
      
      const pageWidth = doc.body.scrollWidth;
      const pageHeight = doc.body.scrollHeight;
      const pageCenterX = pageWidth / 2;
      const pageCenterY = pageHeight / 2;
      
      const firstEl = dragData.current.elements[0];
      const elCenterX = newX + firstEl.width / 2;
      const elCenterY = newY + firstEl.height / 2;
      
      if (Math.abs(elCenterX - pageCenterX) < 20) {
        detectedGuides.vertical.push(pageCenterX);
      }
      if (Math.abs(elCenterY - pageCenterY) < 20) {
        detectedGuides.horizontal.push(pageCenterY);
      }
      
      if (Math.abs(elCenterX - pageCenterX) < snapThreshold) {
        newX = pageCenterX - firstEl.width / 2;
      }
      if (Math.abs(elCenterY - pageCenterY) < snapThreshold) {
        newY = pageCenterY - firstEl.height / 2;
      }
      
      const allElements = Array.from(doc.querySelectorAll('*')).filter(el => 
        !dragData.current.elements.some(data => data.el === el) &&
        !['BODY', 'HTML', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'].includes(el.tagName) &&
        el.offsetParent !== null
      );
      
      allElements.forEach(other => {
        const otherRect = other.getBoundingClientRect();
        const iframeRect = dragData.current.iframe.getBoundingClientRect();
        const otherX = otherRect.left - iframeRect.left;
        const otherY = otherRect.top - iframeRect.top;
        const otherCenterX = otherX + otherRect.width / 2;
        const otherCenterY = otherY + otherRect.height / 2;
        
        if (Math.abs(elCenterX - otherCenterX) < snapThreshold) {
          newX = otherCenterX - firstEl.width / 2;
          detectedGuides.vertical.push(otherCenterX);
        }
        
        if (Math.abs(elCenterY - otherCenterY) < snapThreshold) {
          newY = otherCenterY - firstEl.height / 2;
          detectedGuides.horizontal.push(otherCenterY);
        }
      });
      
      setGuides(detectedGuides);
      
      const deltaX = newX - firstEl.startLeft;
      const deltaY = newY - firstEl.startTop;
      
      dragData.current.elements.forEach(data => {
        data.el.style.left = (data.startLeft + deltaX) + 'px';
        data.el.style.top = (data.startTop + deltaY) + 'px';
      });
    }
  };

  const handleUp = () => {
    if (selectionData.current) {
      const doc = selectionData.current.iframe.contentDocument;
      const selected = Array.from(doc.querySelectorAll('.selected'));
      setSelectedElements(selected);
      if (selected.length === 1) loadProps(selected[0]);
      selectionData.current = null;
      setSelectionBox(null);
    }
    
    if (dragData.current?.moved) {
      dragData.current.elements.forEach(data => data.el.style.opacity = '1');
      setGuides({ vertical: [], horizontal: [] });
      notifyUpdateDebounced();
    }
    setTimeout(() => { dragData.current = null; }, 0);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [selectedElements]);

  const notifyUpdateDebounced = () => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      if (iframeRef.current?.contentDocument) {
        onUpdate(iframeRef.current.contentDocument.documentElement.outerHTML);
      }
    }, 800);
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
    selectedElements.forEach(el => el.remove());
    setSelectedElements([]);
    notifyUpdateDebounced();
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
    notifyUpdateDebounced();
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
        
        {selectionBox && (
          <div className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-none z-50"
            style={{ left: `${selectionBox.left}px`, top: `${selectionBox.top}px`, width: `${selectionBox.width}px`, height: `${selectionBox.height}px` }} />
        )}
        
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
            <span className="font-bold text-sm">{selectedElements.length === 1 ? 'Properties' : `${selectedElements.length} Selected`}</span>
            <div className="flex gap-1">
              <button onClick={duplicate} className="p-1 hover:bg-white rounded" title="Duplicate"><Copy className="w-4 h-4" /></button>
              <button onClick={deleteEl} className="p-1 hover:bg-white rounded" title="Delete"><Trash2 className="w-4 h-4 text-red-600" /></button>
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
              <button onClick={() => updateProp('textAlign', 'left')} className={`flex-1 p-2 border rounded ${elementProps.textAlign === 'left' ? 'bg-purple-100' : ''}`}><AlignLeft className="w-4 h-4 mx-auto" /></button>
              <button onClick={() => updateProp('textAlign', 'center')} className={`flex-1 p-2 border rounded ${elementProps.textAlign === 'center' ? 'bg-purple-100' : ''}`}><AlignCenter className="w-4 h-4 mx-auto" /></button>
              <button onClick={() => updateProp('textAlign', 'right')} className={`flex-1 p-2 border rounded ${elementProps.textAlign === 'right' ? 'bg-purple-100' : ''}`}><AlignRight className="w-4 h-4 mx-auto" /></button>
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
