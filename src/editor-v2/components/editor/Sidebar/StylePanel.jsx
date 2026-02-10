import { useState } from 'react';
import { Trash2, Copy, ChevronDown, ChevronRight } from 'lucide-react';

// ============================================
// STYLE PANEL
// Edit styles for selected element
// ============================================
export default function StylePanel({
  selectedElement,
  pageData,
  onUpdateWidget,
  onUpdateSection,
  onDeleteWidget,
  onDuplicateWidget,
}) {
  if (!selectedElement) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="mb-2">No element selected</p>
        <p className="text-sm">Click on an element to edit its styles</p>
      </div>
    );
  }

  // Find the selected element data
  const getSelectedData = () => {
    if (selectedElement.type === 'section') {
      return pageData.sections.find((s) => s.id === selectedElement.id);
    }
    if (selectedElement.type === 'widget') {
      const { sectionId, rowId, columnId } = selectedElement.path;
      const section = pageData.sections.find((s) => s.id === sectionId);
      const row = section?.rows.find((r) => r.id === rowId);
      const column = row?.columns.find((c) => c.id === columnId);
      return column?.widgets.find((w) => w.id === selectedElement.id);
    }
    return null;
  };

  const data = getSelectedData();

  if (!data) {
    return (
      <div className="p-4 text-center text-gray-500">
        Element not found
      </div>
    );
  }

  if (selectedElement.type === 'section') {
    return (
      <SectionStylePanel
        section={data}
        onUpdate={(updates) => onUpdateSection(data.id, updates)}
      />
    );
  }

  if (selectedElement.type === 'widget') {
    return (
      <WidgetStylePanel
        widget={data}
        path={selectedElement.path}
        onUpdate={(updates) => {
          const { sectionId, rowId, columnId } = selectedElement.path;
          onUpdateWidget(sectionId, rowId, columnId, data.id, updates);
        }}
        onDelete={() => {
          const { sectionId, rowId, columnId } = selectedElement.path;
          onDeleteWidget(sectionId, rowId, columnId, data.id);
        }}
        onDuplicate={() => {
          const { sectionId, rowId, columnId } = selectedElement.path;
          onDuplicateWidget(sectionId, rowId, columnId, data.id);
        }}
      />
    );
  }

  return null;
}

// ============================================
// SECTION STYLE PANEL
// ============================================
function SectionStylePanel({ section, onUpdate }) {
  const [openSections, setOpenSections] = useState(['background', 'spacing']);

  const toggleSection = (name) => {
    setOpenSections((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const updateBackground = (key, value) => {
    onUpdate({
      background: { ...section.background, [key]: value },
    });
  };

  const updateStyle = (key, value) => {
    onUpdate({
      style: { ...section.style, [key]: value },
    });
  };

  return (
    <div className="divide-y divide-gray-200">
      {/* Background */}
      <CollapsibleSection
        title="Background"
        isOpen={openSections.includes('background')}
        onToggle={() => toggleSection('background')}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select
              value={section.background?.type || 'color'}
              onChange={(e) => updateBackground('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="color">Solid Color</option>
              <option value="gradient">Gradient</option>
              <option value="image">Image</option>
            </select>
          </div>

          {section.background?.type === 'color' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={section.background?.value || '#ffffff'}
                  onChange={(e) => updateBackground('value', e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={section.background?.value || '#ffffff'}
                  onChange={(e) => updateBackground('value', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          {section.background?.type === 'gradient' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Gradient</label>
              <input
                type="text"
                value={section.background?.value || ''}
                onChange={(e) => updateBackground('value', e.target.value)}
                placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}

          {section.background?.type === 'image' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
              <input
                type="text"
                value={section.background?.value || ''}
                onChange={(e) => updateBackground('value', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Overlay</label>
            <input
              type="text"
              value={section.background?.overlay || ''}
              onChange={(e) => updateBackground('overlay', e.target.value)}
              placeholder="rgba(0,0,0,0.5)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Spacing */}
      <CollapsibleSection
        title="Spacing"
        isOpen={openSections.includes('spacing')}
        onToggle={() => toggleSection('spacing')}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Padding Top</label>
            <input
              type="text"
              value={section.style?.paddingTop || '60px'}
              onChange={(e) => updateStyle('paddingTop', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Padding Bottom</label>
            <input
              type="text"
              value={section.style?.paddingBottom || '60px'}
              onChange={(e) => updateStyle('paddingBottom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Padding Left</label>
            <input
              type="text"
              value={section.style?.paddingLeft || '20px'}
              onChange={(e) => updateStyle('paddingLeft', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Padding Right</label>
            <input
              type="text"
              value={section.style?.paddingRight || '20px'}
              onChange={(e) => updateStyle('paddingRight', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

// ============================================
// WIDGET STYLE PANEL
// ============================================
function WidgetStylePanel({ widget, onUpdate, onDelete, onDuplicate }) {
  const [openSections, setOpenSections] = useState(['content', 'typography']);

  const toggleSection = (name) => {
    setOpenSections((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const updateContent = (key, value) => {
    onUpdate({
      content: { ...widget.content, [key]: value },
    });
  };

  const updateStyle = (key, value) => {
    onUpdate({
      style: { ...widget.style, [key]: value },
    });
  };

  return (
    <div className="divide-y divide-gray-200">
      {/* Actions */}
      <div className="p-4 flex gap-2">
        <button
          onClick={onDuplicate}
          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Duplicate
        </button>
        <button
          onClick={() => {
            if (confirm('Delete this widget?')) onDelete();
          }}
          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Content (text-specific) */}
      {widget.type === 'text' && (
        <CollapsibleSection
          title="Content"
          isOpen={openSections.includes('content')}
          onToggle={() => toggleSection('content')}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tag</label>
              <select
                value={widget.content?.tag || 'p'}
                onChange={(e) => updateContent('tag', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
                <option value="h4">Heading 4</option>
                <option value="p">Paragraph</option>
                <option value="span">Span</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Alignment</label>
              <div className="flex gap-2">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    onClick={() => updateContent('alignment', align)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm capitalize ${
                      widget.content?.alignment === align
                        ? 'bg-amber-100 text-amber-700 border-2 border-amber-500'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Typography */}
      {['text', 'button'].includes(widget.type) && (
        <CollapsibleSection
          title="Typography"
          isOpen={openSections.includes('typography')}
          onToggle={() => toggleSection('typography')}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
              <input
                type="text"
                value={widget.style?.fontSize || '16px'}
                onChange={(e) => updateStyle('fontSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Font Weight</label>
              <select
                value={widget.style?.fontWeight || 'normal'}
                onChange={(e) => updateStyle('fontWeight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="normal">Normal</option>
                <option value="500">Medium</option>
                <option value="600">Semi Bold</option>
                <option value="bold">Bold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={widget.style?.color || '#1f2937'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={widget.style?.color || '#1f2937'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Button Specific */}
      {widget.type === 'button' && (
        <CollapsibleSection
          title="Button Style"
          isOpen={openSections.includes('button')}
          onToggle={() => toggleSection('button')}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Style</label>
              <select
                value={widget.content?.style || 'primary'}
                onChange={(e) => updateContent('style', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="outline">Outline</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
              <select
                value={widget.content?.size || 'medium'}
                onChange={(e) => updateContent('size', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Link</label>
              <input
                type="text"
                value={widget.content?.link || '#'}
                onChange={(e) => updateContent('link', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Background</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={widget.style?.backgroundColor || '#8b5cf6'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={widget.style?.backgroundColor || '#8b5cf6'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

// ============================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================
function CollapsibleSection({ title, isOpen, onToggle, children }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <span className="font-medium text-sm text-gray-900">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
