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
  const [hoveredElement, setHoveredElement] = useState(null);
  const [editingText, setEditingText] = useState(null);
  const iframeRef = useRef(null);
  
  // Drag state
  const dragState = useRef({
    isDragging: false,
    element: null,
    startX: 0,
    startY: 0,
    elementStartX: 0,
    elementStartY: 0
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
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;

        // Inject styles
        const style = doc.createElement('style');
        style.textContent = `
          * { box-sizing: border-box; }
          .ve-hover { outline: 2px dashed #3b82f6 !important; outline-offset: 2px; }
          .ve-selected { outline: 3px solid #8b5cf6 !important; outline-offset: 2px; cursor: move !important; }
          .ve-dragging { opacity: 0.7 !important; z-index: 999999 !important; }
          [contenteditable="true"] { outline: 2px solid #10b981 !important; user-select: text !important; }
        `;
        doc.head.appendChild(style);

        // Disable all links and buttons
        doc.querySelectorAll('a, button, form').forEach(el => {
          el.addEventListener('click', (e) => e.preventDefault(), true);
          el.addEventListener('submit', (e) => e.preventDefault(), true);
        });

        // Click to select
        doc.body.addEventListener('click', (e) => {
          if (editingText) return;
          e.preventDefault();
          e.stopPropagation();
          handleSelect(e.target, doc);
        }, true);

        // Double-click to edit text
        doc.body.addEventListener('dblclick', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isTextElement(e.target)) {
            handleTextEdit(e.target);
          }
        }, true);

        // Mouse down to start drag
        doc.body.addEventListener('mousedown', (e) => {
          if (editingText) return;
          const element = e.target;
          
          if (selectedElements.includes(element)) {
            e.preventDefault();
            startDrag(element, e, iframe);
          }
        }, true);

        // Hover effects
        doc.body.addEventListener('mouseover', (e) => {
          if (!dragState.current.isDragging && !editingText) {
            e.target.classList.add('ve-hover');
          }
        });

        doc.body.addEventListener('mouseout', (e) => {
          e.target.classList.remove('ve-hover');
        });

      } catch (err) {
        console.error('Setup error:', err);
      }
    };
  };

  const startDrag = (element, e, iframe) => {
    const rect = element.getBoundingClientRect();
    const iframeRect = iframe.getBoundingClientRect();

    // Convert to absolute positioning if needed
    if (element.style.position !== 'absolute') {
      const computedLeft = rect.left - iframeRect.left;
      const computedTop = rect.top - iframeRect.top;
      
      element.style.position = 'absolute';
      element.style.left = `${computedLeft}px`;
      element.style.top = `${computedTop}px`;
      element.style.margin = '0';
    }

    dragState.current = {
      isDragging: true,
      element: element,
      startX: e.clientX,
      startY: e.clientY,
      elementStartX: parseInt(element.style.left) || 0,
      elementStartY: parseInt(element.style.top) || 0
    };

    element.classList.add('ve-dragging');

    // Add global listeners
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (e) => {
    if (!dragState.current.isDragging) return;

    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;

    const newX = dragState.current.elementStartX + dx;
    const newY = dragState.current.elementStartY + dy;

    dragState.current.element.style.left = `${newX}px`;
    dragState.current.element.style.top = `${newY}px`;
  };

  const handleDragEnd = () => {
    if (!dragState.current.isDragging) return;

    dragState.current.element.classList.remove('ve-dragging');
    dragState.current.isDragging = false;

    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);

    notifyUpdate();
  };

  const handleSelect = (element, doc) => {
    // Clear previous selections
    selectedElements.forEach(el => el.classList.remove('ve-selected'));
    
    // Select new element
    element.classList.add('ve-selected');
    setSelectedElements([element]);
    loadElementProperties(element);
  };

  const handleTextEdit = (element) => {
    element.setAttribute('contenteditable', 'true');
    element.focus();
    setEditingText(element);

    // Select text
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    const onBlur = () => {
      element.removeAttribute('contenteditable');
      setEditingText(null);
      notifyUpdate();
    };

    element.addEventListener('blur', onBlur, { once: true });
  };

  const isTextElement = (element) => {
    return ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'BUTTON', 'LI', 'DIV'].includes(element.tagName);
  };

  const loadElementProperties = (element) => {
    const computed = window.getComputedStyle(element);
    setElementProps({
      width: element.style.width || computed.width,
      height: element.style.height || computed.height,
      fontSize: computed.fontSize,
      color: rgbToHex(computed.color),
      backgroundColor: rgbToHex(computed.backgroundColor),
      fontWeight: computed.fontWeight,
      textAlign: computed.textAlign,
      padding: computed.padding,
      margin: computed.margin
    });
  };

  const updateElementProperty = (property, value) => {
    selectedElements.forEach(element => {
      element.style[property] = value;
    });
    setElementProps(prev => ({ ...prev, [property]: value }));
    notifyUpdate();
  };

  const deleteSelected = () => {
    selectedElements.forEach(element => element.remove());
    setSelectedElements([]);
    notifyUpdate();
  };

  const duplicateSelected = () => {
    selectedElements.forEach(element => {
      const clone = element.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.left = `${parseInt(element.style.left || 0) + 20}px`;
      clone.style.top = `${parseInt(element.style.top || 0) + 20}px`;
      element.parentNode.appendChild(clone);
    });
    notifyUpdate();
  };

  const notifyUpdate = () => {
    if (iframeRef.current?.contentDocument) {
      const html = iframeRef.current.contentDocument.documentElement.outerHTML;
      onUpdate(html);
    }
  };

  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
    const result = rgb.match(/\d+/g);
    if (!result) return '#000000';
    return '#' + result.slice(0, 3).map(x => {
      const hex = parseInt(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  return (
    <div className="w-full h-full flex">
      <div className="flex-1 relative bg-gray-100">
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          className="w-full h-full border-none"
          title="Visual Editor"
        />
      </div>

      {(selectedElements.length > 0 || editingText) && (
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto shadow-xl">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-900">Properties</h3>
              <div className="flex gap-1">
                <button onClick={duplicateSelected} className="p-1.5 hover:bg-white rounded">
                  <Copy className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={deleteSelected} className="p-1.5 hover:bg-white rounded">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Move className="w-4 h-4" /> Layout
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600">Width</label>
                  <input
                    type="text"
                    value={elementProps.width}
                    onChange={(e) => updateElementProperty('width', e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Height</label>
                  <input
                    type="text"
                    value={elementProps.height}
                    onChange={(e) => updateElementProperty('height', e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
              </div>
            </div>

            {selectedElements.length === 1 && isTextElement(selectedElements[0]) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Type className="w-4 h-4" /> Typography
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-600">Font Size</label>
                    <input
                      type="text"
                      value={elementProps.fontSize}
                      onChange={(e) => updateElementProperty('fontSize', e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateElementProperty('fontWeight', elementProps.fontWeight === 'bold' ? 'normal' : 'bold')}
                      className={`flex-1 px-2 py-1 text-sm border rounded ${elementProps.fontWeight === 'bold' || elementProps.fontWeight === '700' ? 'bg-purple-100 border-purple-600' : ''}`}
                    >
                      <Bold className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => updateElementProperty('fontStyle', 'italic')}
                      className="flex-1 px-2 py-1 text-sm border rounded"
                    >
                      <Italic className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateElementProperty('textAlign', 'left')}
                      className={`flex-1 px-2 py-1 text-sm border rounded ${elementProps.textAlign === 'left' ? 'bg-purple-100 border-purple-600' : ''}`}
                    >
                      <AlignLeft className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => updateElementProperty('textAlign', 'center')}
                      className={`flex-1 px-2 py-1 text-sm border rounded ${elementProps.textAlign === 'center' ? 'bg-purple-100 border-purple-600' : ''}`}
                    >
                      <AlignCenter className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => updateElementProperty('textAlign', 'right')}
                      className={`flex-1 px-2 py-1 text-sm border rounded ${elementProps.textAlign === 'right' ? 'bg-purple-100 border-purple-600' : ''}`}
                    >
                      <AlignRight className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Palette className="w-4 h-4" /> Colors
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600">Text Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={elementProps.color}
                      onChange={(e) => updateElementProperty('color', e.target.value)}
                      className="w-12 h-8 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={elementProps.color}
                      onChange={(e) => updateElementProperty('color', e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Background</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={elementProps.backgroundColor}
                      onChange={(e) => updateElementProperty('backgroundColor', e.target.value)}
                      className="w-12 h-8 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={elementProps.backgroundColor}
                      onChange={(e) => updateElementProperty('backgroundColor', e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Spacing</h4>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600">Padding</label>
                  <input
                    type="text"
                    value={elementProps.padding}
                    onChange={(e) => updateElementProperty('padding', e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Margin</label>
                  <input
                    type="text"
                    value={elementProps.margin}
                    onChange={(e) => updateElementProperty('margin', e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
