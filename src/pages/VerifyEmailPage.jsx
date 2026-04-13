import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function authFetch(path, opts = {}) {
  const token = localStorage.getItem('token');
  return fetch(`${apiUrl}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
  });
}

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const email = user.email || '';

  // If no token, redirect to home
  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/', { replace: true });
    // If already verified, skip to onboarding
    if (user.email_verified) navigate('/onboarding', { replace: true });
  }, []);

  const fullCode = code.join('');

  const handleDigit = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    setError('');
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (next.every(d => d) ) verify(next.join(''));
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      setError('');
      verify(pasted);
    }
  };

  const verify = async (codeStr) => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ code: codeStr }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedUser = { ...user, email_verified: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        navigate('/onboarding', { replace: true });
      } else {
        setError(data.error || 'Invalid code. Please try again.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError('');
    try {
      await authFetch('/api/auth/resend-verification', { method: 'POST' });
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-gray-500">
            We sent a 6-digit code to<br />
            <span className="font-semibold text-gray-800">{email}</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">It can take up to a minute to arrive.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Code inputs */}
          <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={el => inputRefs.current[idx] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleDigit(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                autoFocus={idx === 0}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all ${
                  error
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : digit
                    ? 'border-amber-400 bg-amber-50 text-gray-900'
                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-amber-400 focus:bg-white'
                }`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Success resent */}
          {resent && (
            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              New code sent! Check your inbox.
            </div>
          )}

          {/* Loading */}
          {loading && (
            <p className="text-center text-sm text-gray-400 mb-4">Verifying…</p>
          )}

          <p className="text-center text-sm text-gray-500">
            Didn't receive it?{' '}
            <button
              onClick={resend}
              disabled={resending}
              className="text-amber-600 font-semibold hover:underline disabled:opacity-50 inline-flex items-center gap-1"
            >
              {resending && <RefreshCw className="w-3 h-3 animate-spin" />}
              Resend code
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Check your spam folder if you don't see it within a minute.
        </p>
      </div>
    </div>
  );
}
