// ============================================
// FORM WIDGET
// ============================================
export default function FormWidget({ widget, isEditing }) {
  const content = widget.content || {};
  const fields = content.fields || [];

  return (
    <form
      className="space-y-4 p-6 bg-white rounded-lg shadow-sm border border-gray-200"
      onSubmit={(e) => e.preventDefault()}
    >
      {fields.map((field) => (
        <div key={field.id}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {field.type === 'textarea' ? (
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500"
              rows={4}
              placeholder={field.placeholder}
              disabled={isEditing}
            />
          ) : field.type === 'select' ? (
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500"
              disabled={isEditing}
            >
              <option value="">Select...</option>
              {field.options?.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type || 'text'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500"
              placeholder={field.placeholder}
              disabled={isEditing}
            />
          )}
        </div>
      ))}
      
      <button
        type="submit"
        className="w-full py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition"
        disabled={isEditing}
      >
        {content.submitText || 'Submit'}
      </button>
    </form>
  );
}
