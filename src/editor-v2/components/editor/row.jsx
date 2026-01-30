import Column from './Column';

// ============================================
// ROW COMPONENT
// ============================================
export default function Row({
  row,
  sectionId,
  rowIndex,
  selectedElement,
  devicePreview,
  onSelectWidget,
  onUpdateWidget,
}) {
  const getRowStyle = () => {
    const baseStyle = row.style || {};
    
    return {
      display: 'flex',
      flexWrap: devicePreview === 'mobile' ? 'wrap' : 'nowrap',
      gap: baseStyle.gap || '24px',
      maxWidth: baseStyle.maxWidth || '1200px',
      margin: baseStyle.margin || '0 auto',
      padding: baseStyle.padding || '20px 0',
    };
  };

  return (
    <div style={getRowStyle()}>
      {row.columns?.map((column, colIndex) => (
        <Column
          key={column.id}
          column={column}
          sectionId={sectionId}
          rowId={row.id}
          columnIndex={colIndex}
          totalColumns={row.columns.length}
          selectedElement={selectedElement}
          devicePreview={devicePreview}
          onSelectWidget={onSelectWidget}
          onUpdateWidget={onUpdateWidget}
        />
      ))}
    </div>
  );
}
