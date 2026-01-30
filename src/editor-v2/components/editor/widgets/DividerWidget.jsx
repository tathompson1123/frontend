// ============================================
// DIVIDER WIDGET
// ============================================
export default function DividerWidget({ widget }) {
  const content = widget.content || {};

  return (
    <hr
      style={{
        width: content.width || '100%',
        borderStyle: content.style || 'solid',
        borderColor: content.color || '#e5e7eb',
        borderWidth: `${content.thickness || '1px'} 0 0 0`,
        margin: '16px auto',
      }}
    />
  );
}
