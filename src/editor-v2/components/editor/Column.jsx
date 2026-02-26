
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
  isDraggingWidget,
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
    <div
      style={getColumnStyle()}
      className={`relative transition-all duration-150 rounded-lg ${
        isDraggingWidget
          ? 'outline outline-2 outline-dashed outline-blue-300 outline-offset-2 bg-blue-50/30'
          : ''
      }`}
    >
      {/* Column label shown during drag */}
      {isDraggingWidget && totalColumns > 1 && (
        <div className="absolute -top-5 left-0 right-0 flex justify-center pointer-events-none z-10">
          <span className="text-[10px] font-medium text-blue-500 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            {columnIndex === 0 ? 'Left' : columnIndex === totalColumns - 1 ? 'Right' : 'Center'}
          </span>
        </div>
      )}

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
                isDraggingWidget={isDraggingWidget}
                position="above"
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
                  isDraggingWidget={isDraggingWidget}
                  position="below"
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
            isDraggingWidget={isDraggingWidget}
          />
        )}
      </SortableContext>
    </div>
  );
}

// ============================================
// DROP ZONE COMPONENT
// ============================================
function DropZone({ sectionId, rowId, columnId, index, isDraggingWidget, position }) {
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

  if (!isDraggingWidget) {
    // Invisible strip when not dragging — still droppable
    return (
      <div
        ref={setNodeRef}
        className="h-2 my-0.5 rounded transition-all hover:bg-gray-200"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`transition-all rounded my-1 flex items-center justify-center ${
        isOver
          ? 'h-14 bg-amber-50 border-2 border-dashed border-amber-500'
          : 'h-5 bg-blue-50 border border-dashed border-blue-300'
      }`}
    >
      {isOver ? (
        <span className="text-amber-600 text-xs font-semibold">Drop here</span>
      ) : (
        <span className="text-blue-300 text-[10px]">
          {position === 'above' ? '↑ above' : '↓ below'}
        </span>
      )}
    </div>
  );
}

// ============================================
// EMPTY COLUMN DROP ZONE
// ============================================
function EmptyColumnDropZone({ sectionId, rowId, columnId, isDraggingWidget }) {
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
      className={`min-h-[80px] border-2 border-dashed rounded-lg flex items-center justify-center transition-all ${
        isOver
          ? 'border-amber-500 bg-amber-50'
          : isDraggingWidget
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      }`}
    >
      <p className={`text-sm font-medium ${
        isOver
          ? 'text-amber-600'
          : isDraggingWidget
          ? 'text-blue-500'
          : 'text-gray-400'
      }`}>
        {isOver ? 'Drop widget here' : isDraggingWidget ? '+ Drop here' : 'Drag a widget here'}
      </p>
    </div>
  );
}
