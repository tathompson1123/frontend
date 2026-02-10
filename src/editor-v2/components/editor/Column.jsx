
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import WidgetWrapper from './WidgetWrapper';

// ============================================
// COLUMN COMPONENT
// ============================================
export default function Column({
  column,
  sectionId,
  rowId,
  columnIndex,
  totalColumns,
  selectedElement,
  devicePreview,
  onSelectWidget,
  onUpdateWidget,
}) {
  // Calculate column width based on device
  const getColumnWidth = () => {
    if (devicePreview === 'mobile') {
      return '100%';
    }
    return column.width || `${100 / totalColumns}%`;
  };

  const getColumnStyle = () => {
    const baseStyle = column.style || {};
    
    return {
      width: getColumnWidth(),
      minWidth: devicePreview === 'mobile' ? '100%' : 'auto',
      padding: baseStyle.padding || '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: baseStyle.horizontalAlign || 'stretch',
      justifyContent: baseStyle.verticalAlign || 'flex-start',
    };
  };

  return (
    <div style={getColumnStyle()} className="relative">
      {/* Widget list with drop zones */}
      <SortableContext
        items={column.widgets?.map((w) => w.id) || []}
        strategy={verticalListSortingStrategy}
      >
        {column.widgets?.length > 0 ? (
          column.widgets.map((widget, widgetIndex) => (
            <div key={widget.id}>
              {/* Drop zone above widget */}
              <DropZone
                sectionId={sectionId}
                rowId={rowId}
                columnId={column.id}
                index={widgetIndex}
              />
              
              {/* Widget */}
              <WidgetWrapper
                widget={widget}
                sectionId={sectionId}
                rowId={rowId}
                columnId={column.id}
                isSelected={
                  selectedElement?.type === 'widget' &&
                  selectedElement?.id === widget.id
                }
                devicePreview={devicePreview}
                onSelect={() =>
                  onSelectWidget(widget.id, { sectionId, rowId, columnId: column.id })
                }
                onUpdate={(updates) =>
                  onUpdateWidget(sectionId, rowId, column.id, widget.id, updates)
                }
              />
              
              {/* Drop zone after last widget */}
              {widgetIndex === column.widgets.length - 1 && (
                <DropZone
                  sectionId={sectionId}
                  rowId={rowId}
                  columnId={column.id}
                  index={widgetIndex + 1}
                />
              )}
            </div>
          ))
        ) : (
          // Empty column drop zone
          <EmptyColumnDropZone
            sectionId={sectionId}
            rowId={rowId}
            columnId={column.id}
          />
        )}
      </SortableContext>
    </div>
  );
}

// ============================================
// DROP ZONE COMPONENT
// ============================================
function DropZone({ sectionId, rowId, columnId, index }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `dropzone-${sectionId}-${rowId}-${columnId}-${index}`,
    data: {
      accepts: 'widget',
      sectionId,
      rowId,
      columnId,
      index,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-2 my-1 rounded transition-all ${
        isOver
          ? 'bg-amber-400 h-16 border-2 border-dashed border-amber-600'
          : 'bg-transparent hover:bg-gray-200'
      }`}
    />
  );
}

// ============================================
// EMPTY COLUMN DROP ZONE
// ============================================
function EmptyColumnDropZone({ sectionId, rowId, columnId }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `empty-${sectionId}-${rowId}-${columnId}`,
    data: {
      accepts: 'widget',
      sectionId,
      rowId,
      columnId,
      index: 0,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] border-2 border-dashed rounded-lg flex items-center justify-center transition-all ${
        isOver
          ? 'border-amber-500 bg-amber-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      }`}
    >
      <p className="text-gray-400 text-sm">
        {isOver ? 'Drop widget here' : 'Drag a widget here'}
      </p>
    </div>
  );
}
