// ============================================
// TESTIMONIAL WIDGET
// ============================================
export default function TestimonialWidget({ widget, isEditing, onUpdate }) {
  const content = widget.content || {};

  // Star rating
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      {/* Rating */}
      {content.rating && (
        <div className="text-xl mb-3">
          {renderStars(content.rating)}
        </div>
      )}

      {/* Quote */}
      <blockquote className="text-gray-700 text-lg italic mb-4">
        "{content.quote || 'Customer testimonial goes here...'}"
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3">
        {content.avatar ? (
          <img
            src={content.avatar}
            alt={content.author}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 font-bold text-lg">
              {(content.author || 'A')[0].toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900">
            {content.author || 'Customer Name'}
          </p>
          {content.role && (
            <p className="text-sm text-gray-500">{content.role}</p>
          )}
        </div>
      </div>
    </div>
  );
}
