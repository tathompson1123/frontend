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
