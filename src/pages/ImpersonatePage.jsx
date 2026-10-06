import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Landing page for a SORCE rep opening a prospect's account from /analytics. The
// login arrives in the URL hash (never sent to a server), is moved into storage, and
// the hash is wiped straight away so the token doesn't linger in history.
export default function ImpersonatePage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const token = params.get('token');
      const user = JSON.parse(params.get('user') || 'null');
      window.history.replaceState(null, '', window.location.pathname);
      if (!token || !user) { setError('This link is missing its login. Open the account again from the call.'); return; }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('impersonating', user.businessName || user.email);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Could not open that account. Open it again from the call.');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">
      {error || 'Opening account…'}
    </div>
  );
}
