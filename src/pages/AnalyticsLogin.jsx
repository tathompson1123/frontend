import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AnalyticsLogin() {
  // Invited team members sign in with their own email; the shared master password
  // is still accepted so nobody is locked out before team accounts exist.
  const [mode, setMode] = useState('team');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/analytics/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'team' ? { email, password } : { password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        return;
      }
      sessionStorage.setItem('analyticsToken', data.token);
      if (data.member) sessionStorage.setItem('analyticsMember', JSON.stringify(data.member));
      navigate('/analytics');
    } catch {
      setError('Connection error — check your network');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-blue-600 bg-clip-text text-transparent">
              SORCE
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Internal Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Signups, revenue and discovery calls</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
        >
          {mode === 'team' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@sorceintegrations.com"
                autoFocus
                required
                className="w-full border-2 border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {mode === 'team' ? 'Password' : 'Master password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'team' ? 'Your password' : 'Shared access password'}
                autoFocus={mode === 'master'}
                required
                className="w-full border-2 border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2.5 pr-11 text-sm focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || (mode === 'team' && !email)}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all text-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={() => { setMode(m => (m === 'team' ? 'master' : 'team')); setError(''); }}
            className="w-full mt-4 text-xs font-medium text-gray-500 hover:text-gray-800 transition"
          >
            {mode === 'team' ? 'Use the master password instead' : 'Sign in with your own account'}
          </button>
        </form>
      </div>
    </div>
  );
}
