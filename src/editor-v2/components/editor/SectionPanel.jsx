import { useDraggable } from '@dnd-kit/core';
import { SECTION_TEMPLATES } from '../../../utils/schema';

// ============================================
// SECTION PANEL
// Pre-built section templates
// ============================================
export default function SectionPanel({ onAddSection }) {
  const templates = Object.entries(SECTION_TEMPLATES);

  return (
    <div className="p-4">
      <p className="text-sm text-gray-500 mb-4">
        Add pre-built sections to your page
      </p>
      
      <div className="space-y-2">
        {templates.map(([key, template]) => (
          <SectionTemplateItem
            key={key}
            templateKey={key}
            template={template}
            onAdd={() => onAddSection(key)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// SECTION TEMPLATE ITEM
// ============================================
function SectionTemplateItem({ templateKey, template, onAdd }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new-section-${templateKey}`,
    data: {
      isNewSection: true,
      template: templateKey,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onAdd}
      className={`p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-purple-400 hover:shadow-md transition flex items-center gap-3 ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <span className="text-2xl">{template.icon}</span>
      <div>
        <p className="font-medium text-gray-900">{template.name}</p>
        <p className="text-xs text-gray-500">Click to add or drag</p>
      </div>
    </div>
  );
}
