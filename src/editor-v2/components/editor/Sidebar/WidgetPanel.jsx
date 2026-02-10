import { useDraggable } from '@dnd-kit/core';
import { WIDGET_CATALOG } from '../../../utils/schema';

// ============================================
// WIDGET PANEL
// Sidebar panel with draggable widgets
// ============================================
export default function WidgetPanel() {
  return (
    <div className="p-4">
      <p className="text-sm text-gray-500 mb-4">
        Drag widgets onto your page
      </p>
      
      <div className="grid grid-cols-2 gap-2">
        {WIDGET_CATALOG.map((item) => (
          <DraggableWidget key={item.type} item={item} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// DRAGGABLE WIDGET ITEM
// ============================================
function DraggableWidget({ item }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new-widget-${item.type}`,
    data: {
      isNew: true,
      widgetType: item.type,
      name: item.name,
      icon: item.icon,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:border-amber-400 hover:shadow-md transition ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div className="text-2xl mb-1 text-center">{item.icon}</div>
      <p className="text-xs font-medium text-gray-700 text-center truncate">
        {item.name}
      </p>
    </div>
  );
}
