// ============================================
// SPACER WIDGET
// ============================================
export default function SpacerWidget({ widget, devicePreview, isEditing }) {
  const content = widget.content || {};
  
  const height = devicePreview === 'mobile' 
    ? (content.mobileHeight || content.height || '20px')
    : (content.height || '40px');

  return (
    <div
      style={{ height }}
      className={`w-full ${isEditing ? 'bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center' : ''}`}
    >
      {isEditing && (
        <span className="text-xs text-gray-400">Spacer: {height}</span>
      )}
    </div>
  );
}
