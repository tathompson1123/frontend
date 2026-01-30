// ============================================
// ICON WIDGET
// ============================================
export default function IconWidget({ widget }) {
  const content = widget.content || {};
  
  // Simple emoji-based icons for now
  // In production, use a proper icon library like Lucide
  const icons = {
    star: '⭐',
    heart: '❤️',
    check: '✅',
    arrow: '➡️',
    phone: '📞',
    email: '📧',
    location: '📍',
    clock: '🕐',
    calendar: '📅',
    user: '👤',
    settings: '⚙️',
    home: '🏠',
    search: '🔍',
    cart: '🛒',
    dollar: '💰',
    shield: '🛡️',
    lightning: '⚡',
    trophy: '🏆',
    thumbsup: '👍',
    fire: '🔥',
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <span
        style={{
          fontSize: content.size || '48px',
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        {icons[content.icon] || '⭐'}
      </span>
    </div>
  );
}
