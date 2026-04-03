import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Invalid unsubscribe link — no token found.');
      return;
    }

    fetch(`${API_URL}/api/email-campaigns/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setEmail(data.email || '');
          setStatus('success');
        } else {
          setErrorMsg(data.error || 'Failed to unsubscribe.');
          setStatus('error');
        }
      })
      .catch(() => {
        setErrorMsg('Connection error. Please try again.');
        setStatus('error');
      });
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '40px 32px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f3f4f6', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={28} color="#9ca3af" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Processing…</h1>
            <p style={{ color: '#6b7280', fontSize: 15 }}>Please wait while we update your preferences.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={34} color="#16a34a" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 10 }}>You're unsubscribed</h1>
            {email && (
              <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 8 }}>
                <strong style={{ color: '#374151' }}>{email}</strong> has been removed from future email campaigns.
              </p>
            )}
            <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 12 }}>
              You won't receive any more marketing emails from this business. Transactional emails (booking confirmations, receipts) may still be sent.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={34} color="#dc2626" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 10 }}>Link expired or invalid</h1>
            <p style={{ color: '#6b7280', fontSize: 15 }}>{errorMsg}</p>
            <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 12 }}>
              If you're still receiving emails you don't want, reply to any campaign email and ask to be removed.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
