import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AnalyticsAcceptInvite() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [invite, setInvite] = useState(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) { setError('This link is missing its invite code.'); setChecking(false); return; }
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/discovery/team/invite-info/${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'This invite link is invalid or has expired');
        setInvite(data.invite);
      } catch (err) {
        setError(err.message);
      } finally {
        setChecking(false);
      }
    })();
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('The two passwords do not match'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/discovery/team/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not set your password');
      sessionStorage.setItem('analyticsToken', data.token);
      navigate('/analytics', { replace: true });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-blue-600 bg-clip-text text-transparent">
            SORCE
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {checking ? (
            <div className="flex justify-center py-8"><Loader2 className="w-7 h-7 animate-spin text-amber-600" /></div>
          ) : !invite ? (
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 mb-2">This invite isn't valid</h1>
              <p className="text-sm text-gray-500 mb-6">{error || 'It may have expired, or already been used.'}</p>
              <button
                onClick={() => navigate('/analytics/login')}
                className="text-sm font-semibold text-amber-600 hover:text-amber-700"
              >
                Go to login
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Welcome, {invite.name.split(' ')[0]}
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Set a password for <strong className="text-gray-700">{invite.email}</strong> to get into the SORCE dashboard.
              </p>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</> : 'Set password & sign in'}
                </button>
              </form>

              <p className="text-xs text-gray-400 mt-5 flex items-center gap-1.5 justify-center">
                <ShieldCheck className="w-3.5 h-3.5" /> Only you will know this password
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
