export default function Settings({ user }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Account Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name</label>
            <input
              type="text"
              value={user.businessName || ''}
              disabled
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Plan</label>
            <input
              type="text"
              value={user.plan || 'free'}
              disabled
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 capitalize"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
