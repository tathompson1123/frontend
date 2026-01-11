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
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const iframeRef = useRef(null);

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

  // Setup iframe
  useEffect(() => {
    if (!iframeRef.current) return;
    
    const iframe = iframeRef.current;
    
    iframe.onload = () => {
      try {
        const doc = iframe.contentDocument;
        
        // Inject styles
        const style = doc.createElement('style');
        style.textContent = `
          * { box-sizing: border-box; }
          .visual-editor-hover {
            outline: 2px dashed #3b82f6 !important;
            outline-offset: 2px;
            cursor: pointer !important;
          }
          .visual-editor-selected {
            outline: 3px solid #8b5cf6 !important;
            outline-offset: 2px;
            cursor: move !important;
          }
          .visual-editor-dragging {
            opacity: 0.6 !important;
            cursor: move !important;
            z-index: 99999 !important;
          }
          [contenteditable="true"] {
            user-select: text !important;
            outline: 2px solid #10b981 !important;
            cursor: text !important;
          }
        `;
        doc.head.appendChild(style);

        // Add event listeners
        doc.body.addEventListener('click', handleClick, true);
        doc.body.addEventListener('dblclick', handleDoubleClick, true);
        doc.body.addEventListener('mousedown', handleMouseDown, true);
        doc.body.addEventListener('mouseover', handleMouseOver);
        doc.body.addEventListener('mouseout', handleMouseOut);

        // Disable all interactive elements
        doc.querySelectorAll('a, button, form').forEach(el => {
          el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
          }, true);
          el.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
          }, true);
        });

      } catch (err) {
        console.error('Setup error:', err);
      }
    };
  }, [htmlContent]);

  // Global mouse handlers for dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!draggedElement || !dragStart || !iframeRef.current) return;

      const iframe = iframeRef.current;
      const iframeRect = iframe.getBoundingClientRect();
      
      const x = e.clientX - iframeRect.left - dragStart.offsetX;
      const y = e.clientY - iframeRect.top - dragStart.offsetY;

      draggedElement.style.position = 'absolute';
      draggedElement.style.left = `${x}px`;
      draggedElement.style.top = `${y}px`;
      draggedElement.style.margin = '0';
    };

    const handleMouseUp = () => {
      if (draggedElement) {
        draggedElement.classList.remove('visual-editor-dragging');
        setDraggedElement(null);
        setDragStart(null);
        notifyUpdate();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedElement, dragStart]);

  const handleClick = (e) => {
    if (editingText) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    const element = e.target;
    clearSelection();
    selectElement(element);
    loadElementProperties(element);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    const element = e.target;
    if (isTextElement(element)) {
      enableTextEdit(element);
    }
  };

  const handleMouseDown = (e) => {
    if (editingText) return;

    const element = e.target;
    
    if (selectedElements.includes(element)) {
      e.preventDefault();
      e.stopPropagation();

      const iframe = iframeRef.current;
      const iframeRect = iframe.getBoundingClientRect();
      const rect = element.getBoundingClientRect();

      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      setDragStart({ offsetX, offsetY });
      setDraggedElement(element);
      element.classList.add('visual-editor-dragging');
    }
  };

  const handleMouseOver = (e) => {
    if (!draggedElement && !editingText) {
      e.target.classList.add('visual-editor-hover');
      setHoveredElement(e.target);
    }
  };

  const handleMouseOut = (e) => {
    e.target.classList.remove('visual-editor-hover');
    if (hoveredElement === e.target) {
      setHoveredElement(null);
    }
  };

  const selectElement = (element) => {
    element.classList.add('visual-editor-selected');
    setSelectedElements([element]);
  };

  const clearSelection = () => {
    selectedElements.forEach(el => {
      el.classList.remove('visual-editor-selected');
    });
    setSelectedElements([]);
  };

  const isTextElement = (element) => {
    return ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'BUTTON', 'LI', 'DIV'].includes(element.tagName);
  };

  const enableTextEdit = (element) => {
    element.setAttribute('contenteditable', 'true');
    element.focus();
    setEditingText(element);

    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    const handleBlur = () => {
      element.removeAttribute('contenteditable');
      setEditingText(null);
      notifyUpdate();
    };

    element.addEventListener('blur', handleBlur, { once: true });
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
              <h3 className="font-bold text-gray-900">Element Properties</h3>
              <div className="flex gap-1">
                <button onClick={duplicateSelected} className="p-1.5 hover:bg-white rounded" title="Duplicate">
                  <Copy className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={deleteSelected} className="p-1.5 hover:bg-white rounded" title="Delete">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
            {selectedElements.length === 1 && (
              <p className="text-xs text-gray-600">
                {selectedElements[0].tagName.toLowerCase()}
              </p>
            )}
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
