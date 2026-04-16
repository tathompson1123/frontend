import { useState, useEffect } from 'react';
import { User, Lock, Bell, Check, AlertCircle, Eye, EyeOff, Save, Trash2 } from 'lucide-react';

export default function Settings({ user, apiUrl, authFetch, onUserUpdate, onDirtyChange, saveRef }) {
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

  // Delete account state — 3 confirmation steps
  const [deleteStep, setDeleteStep] = useState(0); // 0=none, 1=first, 2=second, 3=type phrase
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setAccountForm({
        businessName: user.businessName || '',
        email: user.email || ''
      });
    }
  }, [user]);

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
        if (onDirtyChange) onDirtyChange(false);
        if (onUserUpdate) onUserUpdate({ ...user, ...accountForm });
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

  // Wire up saveRef for parent "Save & Leave" and cleanup
  useEffect(() => {
    if (saveRef) saveRef.current = () => handleSaveAccount({ preventDefault: () => {} });
    return () => { if (saveRef) saveRef.current = null; };
  });
  useEffect(() => {
    return () => { if (onDirtyChange) onDirtyChange(false); };
  }, []);

  const markDirty = () => { if (onDirtyChange) onDirtyChange(true); };

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

  const handleDeleteAccount = async () => {
    if (deletePhrase !== 'DELETE MY ACCOUNT') return;
    setDeleting(true);
    try {
      const response = await authFetch(`${apiUrl}/api/user/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmPhrase: 'DELETE MY ACCOUNT' })
      });
      if (response.ok) {
        localStorage.removeItem('token');
        window.location.href = '/';
      } else {
        const data = await response.json().catch(() => ({}));
        showMessage('error', data.error || 'Failed to delete account');
        setDeleteStep(0);
      }
    } catch (err) {
      console.error('Delete account error:', err);
      showMessage('error', 'Failed to delete account');
      setDeleteStep(0);
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          {/* Mobile dropdown */}
          <div className="md:hidden mb-4 px-4 pt-4">
            <select
              value={activeTab}
              onChange={e => setActiveTab(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg font-semibold text-gray-800 shadow-sm"
            >
              <option value="account">Account</option>
              <option value="security">Security</option>
              <option value="notifications">Notifications</option>
            </select>
          </div>
          {/* Desktop tabs */}
          <nav className="hidden md:flex -mb-px">
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
          {activeTab === 'account' && (
            <form onSubmit={handleSaveAccount} className="max-w-xl space-y-6" onInput={markDirty} onChange={markDirty}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name</label>
                <input type="text" value={accountForm.businessName}
                  onChange={(e) => setAccountForm({ ...accountForm, businessName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
                  placeholder="Your business name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input type="email" value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
                  placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Plan</label>
                <div className="flex items-center gap-3">
                  <input type="text" value={user?.plan || 'No plan selected'} disabled
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 capitalize" />
                  <a href="#billing" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('navigate-to-view', { detail: { view: 'billing' } })); }}
                    className="px-4 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors">
                    {user?.plan ? 'Upgrade' : 'Choose Plan'}
                  </a>
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="max-w-xl space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
              {[
                { key: 'current', label: 'Current Password', field: 'currentPassword', placeholder: 'Enter current password' },
                { key: 'new', label: 'New Password', field: 'newPassword', placeholder: 'Enter new password (min 8 characters)' },
                { key: 'confirm', label: 'Confirm New Password', field: 'confirmPassword', placeholder: 'Confirm new password' }
              ].map(({ key, label, field, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
                  <div className="relative">
                    <input
                      type={showPasswords[key] ? 'text' : 'password'}
                      value={passwordForm[field]}
                      onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none transition-colors ${
                        key === 'confirm' && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-amber-500'
                      }`}
                      placeholder={placeholder}
                      required
                      minLength={key === 'new' ? 8 : undefined}
                    />
                    <button type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, [key]: !showPasswords[key] })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPasswords[key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {key === 'confirm' && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>
              ))}
              <div className="pt-4">
                <button type="submit"
                  disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Lock className="w-4 h-4" />
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-xl space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { key: 'emailLeads', label: 'New Lead Emails', desc: 'Get notified when a new lead comes in' },
                  { key: 'emailBookings', label: 'New Booking Emails', desc: 'Get notified when a customer books' },
                  { key: 'emailReviews', label: 'Review Alerts', desc: 'Get notified when you receive a new review' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-sm text-gray-600">{desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={notifications[key]}
                        onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                        className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                ))}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-60">
                  <div>
                    <p className="font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-600">Receive SMS for urgent leads</p>
                    <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Coming Soon</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-not-allowed">
                    <input type="checkbox" checked={false} disabled className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
                  </label>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">Note: Notification preferences are saved automatically.</p>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone — 3-step delete confirmation */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-red-600">Danger Zone</h3>
              <p className="text-[11px] text-gray-500">Permanently delete your account and all data.</p>
            </div>

            {deleteStep === 0 && (
              <button onClick={() => setDeleteStep(1)}
                className="px-3 py-1.5 text-[11px] border border-red-200 text-red-500 rounded-md hover:bg-red-50 transition-colors font-medium">
                Delete Account
              </button>
            )}
          </div>

          {/* Step 1 */}
          {deleteStep === 1 && (
            <div className="mt-3 p-2.5 bg-red-50 rounded-lg border border-red-100">
              <p className="text-[11px] text-red-700 mb-2">This will permanently delete all your data including websites, bookings, customers, and leads.</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setDeleteStep(2)}
                  className="px-2.5 py-1 text-[10px] bg-red-500 text-white rounded font-semibold hover:bg-red-600">
                  I understand, continue
                </button>
                <button onClick={() => setDeleteStep(0)}
                  className="px-2.5 py-1 text-[10px] bg-gray-100 text-gray-600 rounded font-medium hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {deleteStep === 2 && (
            <div className="mt-3 p-2.5 bg-red-50 rounded-lg border border-red-200">
              <p className="text-[11px] text-red-800 font-semibold mb-2">Are you absolutely sure? This cannot be undone.</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setDeleteStep(3)}
                  className="px-2.5 py-1 text-[10px] bg-red-600 text-white rounded font-semibold hover:bg-red-700">
                  Yes, I want to delete everything
                </button>
                <button onClick={() => setDeleteStep(0)}
                  className="px-2.5 py-1 text-[10px] bg-gray-100 text-gray-600 rounded font-medium hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — type confirmation phrase */}
          {deleteStep === 3 && (
            <div className="mt-3 p-2.5 bg-red-100 rounded-lg border border-red-300">
              <p className="text-[11px] text-red-900 font-semibold mb-1.5">Type <span className="font-mono bg-red-200 px-1 rounded">DELETE MY ACCOUNT</span> to confirm:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={deletePhrase}
                  onChange={(e) => setDeletePhrase(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="flex-1 px-2.5 py-1.5 text-[11px] border border-red-300 rounded bg-white text-red-900 font-mono outline-none focus:border-red-500"
                  autoFocus
                />
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletePhrase !== 'DELETE MY ACCOUNT' || deleting}
                  className="px-2.5 py-1.5 text-[10px] bg-red-700 text-white rounded font-semibold hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
                <button onClick={() => { setDeleteStep(0); setDeletePhrase(''); }}
                  className="px-2.5 py-1.5 text-[10px] bg-gray-100 text-gray-600 rounded font-medium hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
