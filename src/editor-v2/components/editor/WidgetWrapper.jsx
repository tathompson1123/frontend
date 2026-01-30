import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import WidgetRenderer from './WidgetRenderer';

// ============================================
// WIDGET WRAPPER COMPONENT
// Handles selection, dragging, and rendering
// ============================================
export default function WidgetWrapper({
  widget,
  sectionId,
  rowId,
  columnId,
  isSelected,
  devicePreview,
  onSelect,
  onUpdate,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    data: {
      isWidget: true,
      widget,
      path: { sectionId, rowId, columnId },
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Selection/Hover Border */}
      <div
        className={`absolute inset-0 pointer-events-none rounded transition-all ${
          isSelected
            ? 'ring-2 ring-purple-500'
            : 'ring-0 group-hover:ring-2 group-hover:ring-blue-300'
        }`}
      />

      {/* Widget Toolbar */}
      <div
        className={`absolute -top-8 left-0 flex items-center gap-1 transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 bg-white rounded shadow border border-gray-200 cursor-grab hover:bg-gray-50"
          title="Drag to reorder"
        >
          <GripVertical className="w-3 h-3 text-gray-500" />
        </button>

        {/* Widget Type Label */}
        <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded">
          {widget.type}
        </span>
      </div>

      {/* Widget Content */}
      <div className="relative">
        <WidgetRenderer
          widget={widget}
          devicePreview={devicePreview}
          isEditing={isSelected}
          onUpdate={onUpdate}
        />
      </div>
    </div>
  );
}
