import { useState, useEffect } from 'react';
import { User, Lock, Bell, MessageSquare, Check, AlertCircle, Eye, EyeOff, Save } from 'lucide-react';

export default function Settings({ user, apiUrl, authFetch, onUserUpdate }) {
  const [activeTab, setActiveTab] = useState('account');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Account form state
  const [accountForm, setAccountForm] = useState({
    businessName: '',
    email: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailLeads: true,
    emailBookings: true,
    emailReviews: false,
    smsLeads: false
  });

  // Status update templates
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(null);

  useEffect(() => {
    if (user) {
      setAccountForm({
        businessName: user.businessName || '',
        email: user.email || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchTemplates();
    }
  }, [activeTab]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await authFetch(`${apiUrl}/api/status-templates`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSaveTemplate = async (status, messageTemplate, enabled) => {
    setSavingTemplate(status);
    try {
      const res = await authFetch(`${apiUrl}/api/status-templates/${status}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageTemplate, enabled })
      });
      if (res.ok) {
        showMessage('success', 'Template saved');
      } else {
        showMessage('error', 'Failed to save template');
      }
    } catch (err) {
      showMessage('error', 'Failed to save template');
    } finally {
      setSavingTemplate(null);
    }
  };

  const updateTemplate = (status, field, value) => {
    setTemplates(prev => prev.map(t =>
      t.status === status ? { ...t, [field]: value } : t
    ));
  };

  const templateLabels = {
    in_progress: { label: 'Job Started', desc: 'Sent when an employee starts a job' },
    completed: { label: 'Job Completed', desc: 'Sent when an employee completes a job' },
    no_show: { label: 'No Show', desc: 'Sent when a customer is marked as no-show' },
    progress_update: { label: 'Progress Update', desc: 'Sent with photo/video updates during a job (Pro)' },
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await authFetch(`${apiUrl}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 'Profile updated successfully');
        if (onUserUpdate) {
          onUserUpdate({ ...user, ...accountForm });
        }
      } else {
        showMessage('error', data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }

    setSaving(true);

    try {
      const response = await authFetch(`${apiUrl}/api/user/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 'Password changed successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showMessage('error', data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showMessage('error', 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'messages', label: 'Customer Messages', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-amber-600 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-8">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <form onSubmit={handleSaveAccount} className="max-w-xl space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={accountForm.businessName}
                  onChange={(e) => setAccountForm({ ...accountForm, businessName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
                  placeholder="Your business name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Plan
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={user?.plan || 'No plan selected'}
                    disabled
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 capitalize"
                  />
                  <a
                    href="#billing"
                    onClick={(e) => {
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent('navigate-to-view', { detail: { view: 'billing' } }));
                    }}
                    className="px-4 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
                  >
                    {user?.plan ? 'Upgrade' : 'Choose Plan'}
                  </a>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="max-w-xl space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
                    placeholder="Enter new password (min 8 characters)"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none transition-colors ${
                      passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-amber-500'
                    }`}
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="max-w-xl space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">New Lead Emails</p>
                    <p className="text-sm text-gray-600">Get notified when a new lead comes in</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailLeads}
                      onChange={(e) => setNotifications({ ...notifications, emailLeads: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">New Booking Emails</p>
                    <p className="text-sm text-gray-600">Get notified when a customer books</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailBookings}
                      onChange={(e) => setNotifications({ ...notifications, emailBookings: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Review Alerts</p>
                    <p className="text-sm text-gray-600">Get notified when you receive a new review</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailReviews}
                      onChange={(e) => setNotifications({ ...notifications, emailReviews: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-60">
                  <div>
                    <p className="font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-600">Receive SMS for urgent leads</p>
                    <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Coming Soon</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked={false}
                      disabled
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
                  </label>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                Note: Notification preferences are saved automatically. Full email notification support coming soon.
              </p>
            </div>
          )}

          {/* Customer Messages Tab */}
          {activeTab === 'messages' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Customer Update Messages</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Configure the messages your employees send to customers when updating booking status.
                  These messages open in the employee's native SMS app with the text pre-filled.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 mb-2">Available variables:</p>
                <div className="flex flex-wrap gap-2">
                  {['{{customerFirstName}}', '{{employeeFirstName}}', '{{businessName}}', '{{serviceName}}'].map(v => (
                    <code key={v} className="text-xs bg-white px-2 py-1 rounded border border-amber-200 text-amber-700">{v}</code>
                  ))}
                </div>
              </div>

              {loadingTemplates ? (
                <div className="text-center py-8 text-gray-500">Loading templates...</div>
              ) : (
                <div className="space-y-4">
                  {templates.map(t => {
                    const info = templateLabels[t.status] || { label: t.status, desc: '' };
                    return (
                      <div key={t.status} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{info.label}</h4>
                            <p className="text-xs text-gray-500">{info.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={t.enabled}
                              onChange={(e) => updateTemplate(t.status, 'enabled', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                          </label>
                        </div>
                        <textarea
                          value={t.message_template}
                          onChange={(e) => updateTemplate(t.status, 'message_template', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors text-sm resize-none"
                          placeholder="Message template..."
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleSaveTemplate(t.status, t.message_template, t.enabled)}
                            disabled={savingTemplate === t.status}
                            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            {savingTemplate === t.status ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
            onClick={() => alert('Please contact support to delete your account.')}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
