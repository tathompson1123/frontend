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
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
}, []);
  
  useEffect(() => {
  if (iframeRef.current) {
    setupIframe();
  }
}, [htmlContent]);

useEffect(() => {
  // Add global mouse listeners
  const handleGlobalMouseMove = (e) => {
    if (draggedElement) {
      e.preventDefault();
      
      const iframe = iframeRef.current;
      if (!iframe) return;
      
      const iframeRect = iframe.getBoundingClientRect();
      
      // Calculate new position relative to iframe
      const newX = e.clientX - iframeRect.left - dragOffset.x;
      const newY = e.clientY - iframeRect.top - dragOffset.y;
      
      // Update all selected elements
      selectedElements.forEach(element => {
        element.style.position = 'absolute';
        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
      });
    }
  };

  const handleGlobalMouseUp = (e) => {
    if (draggedElement) {
      draggedElement.classList.remove('visual-editor-dragging');
      setDraggedElement(null);
      document.body.style.userSelect = '';
      notifyUpdate();
    }
    
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionBox(null);
      selectionStartRef.current = null;
    }
  };

  window.addEventListener('mousemove', handleGlobalMouseMove);
  window.addEventListener('mouseup', handleGlobalMouseUp);
  
  return () => {
    window.removeEventListener('mousemove', handleGlobalMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);
  };
}, [draggedElement, isSelecting, selectedElements, dragOffset]);

const setupIframe = () => {
  const iframe = iframeRef.current;
  if (!iframe || !iframe.contentWindow) return;

  iframe.onload = () => {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Inject visual editor styles
      const style = doc.createElement('style');
      style.textContent = `
        * {
          box-sizing: border-box;
        }
        .visual-editor-hover {
          outline: 2px dashed #3b82f6 !important;
          outline-offset: 2px;
          cursor: pointer;
        }
        .visual-editor-selected {
          outline: 3px solid #8b5cf6 !important;
          outline-offset: 2px;
          cursor: move !important;
        }
        .visual-editor-dragging {
          opacity: 0.8;
          cursor: move !important;
          z-index: 10000;
        }
        [contenteditable="true"] {
          user-select: text !important;
          outline: 2px solid #10b981 !important;
          cursor: text !important;
        }
      `;
      doc.head.appendChild(style);

      // Add event listeners
      doc.addEventListener('click', handleElementClick, true);
      doc.addEventListener('mousedown', handleMouseDown, true);
      doc.addEventListener('mouseover', handleMouseOver, true);
      doc.addEventListener('mouseout', handleMouseOut, true);

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
  const element = e.target;
  
  // Start selection box if clicking on empty space
  if (element.tagName === 'BODY' || element.tagName === 'HTML') {
    setIsSelecting(true);
    const iframe = iframeRef.current;
    const iframeRect = iframe.getBoundingClientRect();
    selectionStartRef.current = { 
      x: e.clientX - iframeRect.left, 
      y: e.clientY - iframeRect.top 
    };
    return;
  }

  // Start dragging if clicking on selected element
  if (selectedElements.includes(element)) {
    e.preventDefault();
    e.stopPropagation();
    
    setDraggedElement(element);
    
    // Get current position
    const rect = element.getBoundingClientRect();
    const iframe = iframeRef.current;
    const iframeRect = iframe.getBoundingClientRect();
    
    // Calculate offset from mouse to element (relative to iframe)
    const elementLeft = rect.left - iframeRect.left;
    const elementTop = rect.top - iframeRect.top;
    const mouseX = e.clientX - iframeRect.left;
    const mouseY = e.clientY - iframeRect.top;
    
    setDragOffset({
      x: mouseX - elementLeft,
      y: mouseY - elementTop
    });
    
    // Make element absolutely positioned if it isn't already
    if (element.style.position !== 'absolute' && element.style.position !== 'fixed') {
      element.style.position = 'absolute';
      element.style.left = `${elementLeft}px`;
      element.style.top = `${elementTop}px`;
      element.style.margin = '0';
    }
    
    element.classList.add('visual-editor-dragging');
    
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
  }
};

const handleMouseOver = (e) => {
  if (!isSelecting && !draggedElement && !editingText) {
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
  
const handleMouseMove = (e) => {
  // Update selection box
  if (isSelecting && selectionStartRef.current) {
    const iframe = iframeRef.current;
    const iframeRect = iframe.getBoundingClientRect();
    
    const box = {
      left: Math.min(e.clientX, selectionStartRef.current.x) - iframeRect.left,
      top: Math.min(e.clientY, selectionStartRef.current.y) - iframeRect.top,
      width: Math.abs(e.clientX - selectionStartRef.current.x),
      height: Math.abs(e.clientY - selectionStartRef.current.y)
    };
    setSelectionBox(box);
    
    // Find elements within selection box
    const doc = iframe.contentDocument;
    const elements = Array.from(doc.querySelectorAll('body *'));
    const selected = [];
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const elLeft = rect.left - iframeRect.left;
      const elTop = rect.top - iframeRect.top;
      const elRight = elLeft + rect.width;
      const elBottom = elTop + rect.height;
      
      if (
        elLeft >= box.left &&
        elRight <= box.left + box.width &&
        elTop >= box.top &&
        elBottom <= box.top + box.height &&
        rect.width > 0 && rect.height > 0
      ) {
        selected.push(el);
      }
    });
    
    // Clear previous selection
    clearSelection();
    
    // Select new elements
    selected.forEach(el => {
      el.classList.add('visual-editor-selected');
    });
    setSelectedElements(selected);
    
    return;
  }

  // Drag element
  if (draggedElement) {
    e.preventDefault();
    
    const iframe = iframeRef.current;
    const iframeRect = iframe.getBoundingClientRect();
    
    // Calculate new position relative to iframe
    const newX = e.clientX - iframeRect.left - dragOffset.x;
    const newY = e.clientY - iframeRect.top - dragOffset.y;
    
    // Update all selected elements
    selectedElements.forEach(element => {
      element.style.position = 'absolute';
      element.style.left = `${newX}px`;
      element.style.top = `${newY}px`;
    });
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
    document.body.style.userSelect = '';
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
    <div className="w-full h-full flex">
      {/* Preview Area - Centered */}
      <div className="flex-1 relative bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden" style={{ 
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%'
        }}>
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            className="w-full h-full border-none"
            title="Visual Editor Preview"
          />
        </div>
        
        {/* Selection Box Overlay */}
        {selectionBox && (
          <div
            className="absolute border-2 border-purple-500 bg-purple-500 bg-opacity-10 pointer-events-none"
            style={{
              left: `${selectionBox.left}px`,
              top: `${selectionBox.top}px`,
              width: `${selectionBox.width}px`,
              height: `${selectionBox.height}px`
            }}
          />
        )}
      </div>

      {/* Properties Panel - Only show when elements selected */}
      {selectedElements.length > 0 && (
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto shadow-xl">
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
                      onClick={() => updateElementProperty('fontWeight', elementProps.fontWeight === 'bold' ? 'normal' : 'bold')}
                      className={`flex-1 px-2 py-1 text-sm border rounded ${
                        elementProps.fontWeight === 'bold' || elementProps.fontWeight === '700' ? 'bg-purple-100 border-purple-600' : ''
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
