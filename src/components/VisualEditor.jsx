import { useState, useEffect, useRef } from 'react';
import { 
  Move, 
  Type, 
  Image as ImageIcon, 
  Palette, 
  Trash2,
  Copy,
  Layers,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from 'lucide-react';

export default function VisualEditor({ htmlContent, onUpdate, currentPage }) {
  const [selectedElements, setSelectedElements] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null);
  const [editingText, setEditingText] = useState(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const iframeRef = useRef(null);
  const selectionStartRef = useRef(null);

  // Element property state
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
    if (iframeRef.current) {
      setupIframe();
    }
  }, [htmlContent]);

  const setupIframe = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    iframe.onload = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        
        // Inject visual editor styles
        const style = doc.createElement('style');
        style.textContent = `
          .visual-editor-hover {
            outline: 2px dashed #3b82f6 !important;
            outline-offset: 2px;
            cursor: pointer;
          }
          .visual-editor-selected {
            outline: 3px solid #8b5cf6 !important;
            outline-offset: 2px;
            position: relative;
          }
          .visual-editor-selection-box {
            position: fixed;
            border: 2px solid #8b5cf6;
            background: rgba(139, 92, 246, 0.1);
            pointer-events: none;
            z-index: 9999;
          }
          .visual-editor-dragging {
            opacity: 0.6;
            cursor: move !important;
          }
          * {
            user-select: none;
          }
          [contenteditable="true"] {
            user-select: text;
            outline: 2px solid #10b981 !important;
          }
        `;
        doc.head.appendChild(style);

        // Make all text elements editable on click
        doc.body.addEventListener('click', handleElementClick);
        doc.body.addEventListener('mousedown', handleMouseDown);
        doc.body.addEventListener('mousemove', handleMouseMove);
        doc.body.addEventListener('mouseup', handleMouseUp);
        doc.body.addEventListener('mouseover', handleMouseOver);
        doc.body.addEventListener('mouseout', handleMouseOut);

        // Prevent default link behavior
        doc.querySelectorAll('a').forEach(link => {
          link.addEventListener('click', (e) => e.preventDefault());
        });

      } catch (err) {
        console.error('Could not setup visual editor:', err);
      }
    };
  };

  const handleElementClick = (e) => {
    e.stopPropagation();
    const element = e.target;
    
    // If clicking on already selected element, enable text editing
    if (selectedElements.includes(element) && isTextElement(element)) {
      enableTextEdit(element);
      return;
    }

    // Select element
    if (!e.shiftKey && !e.ctrlKey) {
      clearSelection();
    }
    
    selectElement(element);
    loadElementProperties(element);
  };

  const handleMouseDown = (e) => {
    // Start selection box if clicking on empty space
    if (e.target.tagName === 'BODY' || e.target.tagName === 'HTML') {
      setIsSelecting(true);
      selectionStartRef.current = { x: e.clientX, y: e.clientY };
    }

    // Start dragging if clicking on selected element
    if (selectedElements.includes(e.target)) {
      setDraggedElement(e.target);
      const rect = e.target.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      e.target.classList.add('visual-editor-dragging');
    }
  };

  const handleMouseMove = (e) => {
    // Update selection box
    if (isSelecting && selectionStartRef.current) {
      const box = {
        left: Math.min(e.clientX, selectionStartRef.current.x),
        top: Math.min(e.clientY, selectionStartRef.current.y),
        width: Math.abs(e.clientX - selectionStartRef.current.x),
        height: Math.abs(e.clientY - selectionStartRef.current.y)
      };
      setSelectionBox(box);
      
      // Find elements within selection box
      const doc = iframeRef.current.contentDocument;
      const elements = doc.querySelectorAll('*');
      const selected = [];
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (
          rect.left >= box.left &&
          rect.right <= box.left + box.width &&
          rect.top >= box.top &&
          rect.bottom <= box.top + box.height
        ) {
          selected.push(el);
        }
      });
      
      setSelectedElements(selected);
    }

    // Drag element
    if (draggedElement) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      draggedElement.style.position = 'absolute';
      draggedElement.style.left = `${newX}px`;
      draggedElement.style.top = `${newY}px`;
    }
  };

  const handleMouseUp = (e) => {
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionBox(null);
      selectionStartRef.current = null;
    }

    if (draggedElement) {
      draggedElement.classList.remove('visual-editor-dragging');
      setDraggedElement(null);
      notifyUpdate();
    }
  };

  const handleMouseOver = (e) => {
    if (!isSelecting && !draggedElement) {
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
    setSelectedElements(prev => [...prev, element]);
  };

  const clearSelection = () => {
    selectedElements.forEach(el => {
      el.classList.remove('visual-editor-selected');
    });
    setSelectedElements([]);
  };

  const isTextElement = (element) => {
    return ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'BUTTON', 'LI'].includes(element.tagName);
  };

  const enableTextEdit = (element) => {
    element.setAttribute('contenteditable', 'true');
    element.focus();
    setEditingText(element);

    element.addEventListener('blur', () => {
      element.removeAttribute('contenteditable');
      setEditingText(null);
      notifyUpdate();
    }, { once: true });
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
    selectedElements.forEach(element => {
      element.remove();
    });
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
    if (iframeRef.current && iframeRef.current.contentDocument) {
      const doc = iframeRef.current.contentDocument;
      const html = doc.documentElement.outerHTML;
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
    <div className="h-full flex">
      {/* Preview Area */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          className="w-full h-full border-none"
          title="Visual Editor Preview"
        />
        
        {/* Selection Box Overlay */}
        {selectionBox && (
          <div
            className="visual-editor-selection-box"
            style={{
              left: `${selectionBox.left}px`,
              top: `${selectionBox.top}px`,
              width: `${selectionBox.width}px`,
              height: `${selectionBox.height}px`
            }}
          />
        )}
      </div>

      {/* Properties Panel */}
      {selectedElements.length > 0 && (
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-900">
                {selectedElements.length === 1 ? 'Element Properties' : `${selectedElements.length} Elements Selected`}
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={duplicateSelected}
                  className="p-1.5 hover:bg-white rounded"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={deleteSelected}
                  className="p-1.5 hover:bg-white rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
            {selectedElements.length === 1 && (
              <p className="text-xs text-gray-600">
                {selectedElements[0].tagName.toLowerCase()}
                {selectedElements[0].className && ` .${selectedElements[0].className.split(' ')[0]}`}
              </p>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* Layout */}
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
                    placeholder="auto"
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Height</label>
                  <input
                    type="text"
                    value={elementProps.height}
                    onChange={(e) => updateElementProperty('height', e.target.value)}
                    placeholder="auto"
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Typography */}
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
                      onClick={() => updateElementProperty('fontWeight', 'bold')}
                      className={`flex-1 px-2 py-1 text-sm border rounded ${
                        elementProps.fontWeight === 'bold' ? 'bg-purple-100 border-purple-600' : ''
                      }`}
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
                      className={`flex-1 px-2 py-1 text-sm border rounded ${
                        elementProps.textAlign === 'left' ? 'bg-purple-100 border-purple-600' : ''
                      }`}
                    >
                      <AlignLeft className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => updateElementProperty('textAlign', 'center')}
                      className={`flex-1 px-2 py-1 text-sm border rounded ${
                        elementProps.textAlign === 'center' ? 'bg-purple-100 border-purple-600' : ''
                      }`}
                    >
                      <AlignCenter className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => updateElementProperty('textAlign', 'right')}
                      className={`flex-1 px-2 py-1 text-sm border rounded ${
                        elementProps.textAlign === 'right' ? 'bg-purple-100 border-purple-600' : ''
                      }`}
                    >
                      <AlignRight className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Colors */}
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

            {/* Spacing */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Spacing</h4>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600">Padding</label>
                  <input
                    type="text"
                    value={elementProps.padding}
                    onChange={(e) => updateElementProperty('padding', e.target.value)}
                    placeholder="0px"
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Margin</label>
                  <input
                    type="text"
                    value={elementProps.margin}
                    onChange={(e) => updateElementProperty('margin', e.target.value)}
                    placeholder="0px"
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
