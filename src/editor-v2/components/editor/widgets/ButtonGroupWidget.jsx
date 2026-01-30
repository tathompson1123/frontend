// ============================================
// BUTTON GROUP WIDGET
// ============================================
export default function ButtonGroupWidget({ widget, devicePreview, isEditing, onUpdate }) {
  const content = widget.content || {};
  const buttons = content.buttons || [];

  const getButtonStyle = (btn) => {
    const base = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: '600',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: 'none',
    };

    switch (btn.style) {
      case 'primary':
        return { ...base, backgroundColor: '#8b5cf6', color: '#ffffff' };
      case 'secondary':
        return { ...base, backgroundColor: '#1f2937', color: '#ffffff' };
      case 'outline':
        return { ...base, backgroundColor: 'transparent', color: '#8b5cf6', border: '2px solid #8b5cf6' };
      default:
        return { ...base, backgroundColor: '#8b5cf6', color: '#ffffff' };
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: content.gap || '16px',
        justifyContent: content.alignment || 'center',
      }}
    >
      {buttons.map((btn, index) => (
        <button
          key={btn.id || index}
          style={getButtonStyle(btn)}
          onClick={(e) => e.preventDefault()}
        >
          {btn.text}
        </button>
      ))}
    </div>
  );
}
