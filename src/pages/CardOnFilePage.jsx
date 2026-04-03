import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const apiUrl = import.meta.env.VITE_API_URL || 'https://sorcenew-backend-production.up.railway.app';

export default function CardOnFilePage() {
  const { token } = useParams();
  const [pageData, setPageData] = useState(null);
  const [error, setError] = useState(null);
  const [card, setCard] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [payments, setPayments] = useState(null);

  // Fetch page data from backend
  useEffect(() => {
    fetch(`${apiUrl}/api/public/card-on-file/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setPageData(data);
      })
      .catch(() => setError('Failed to load page. Please try again.'));
  }, [token]);

  // Load Square Web Payments SDK once we have app credentials
  useEffect(() => {
    if (!pageData) return;
    const existingScript = document.getElementById('square-web-sdk');
    if (existingScript) { setSdkReady(true); return; }

    const script = document.createElement('script');
    script.id = 'square-web-sdk';
    script.src = pageData.squareEnvironment === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js';
    script.onload = () => setSdkReady(true);
    script.onerror = () => setError('Failed to load payment SDK. Please refresh.');
    document.head.appendChild(script);
  }, [pageData]);

  // Initialize Square card form once SDK is ready
  useEffect(() => {
    if (!sdkReady || !pageData || card) return;

    async function initSquare() {
      try {
        const paymentsInstance = window.Square.payments(
          pageData.squareAppId,
          pageData.squareEnvironment === 'production' ? undefined : 'sandbox'
        );
        setPayments(paymentsInstance);
        const cardInstance = await paymentsInstance.card();
        await cardInstance.attach('#card-container');
        setCard(cardInstance);
      } catch (e) {
        setError('Could not initialize card form. Please refresh and try again.');
      }
    }
    initSquare();
  }, [sdkReady, pageData]);

  const handleSubmit = async () => {
    if (!card || saving) return;
    setSaving(true);
    try {
      const result = await card.tokenize();
      if (result.status !== 'OK') {
        alert('Card error: ' + (result.errors?.[0]?.message || 'Please check your card details.'));
        setSaving(false);
        return;
      }
      const resp = await fetch(`${apiUrl}/api/public/card-on-file/${token}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: result.token }),
      });
      const data = await resp.json();
      if (data.success) {
        setSaved(true);
      } else {
        alert(data.error || 'Failed to save card. Please try again.');
        setSaving(false);
      }
    } catch {
      alert('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ ...styles.header, background: '#dc2626' }}>
            <h1 style={styles.headerTitle}>Link Unavailable</h1>
          </div>
          <div style={styles.body}>
            <p style={styles.bodyText}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ ...styles.header, background: '#16a34a' }}>
            <h1 style={styles.headerTitle}>You're All Set! ✓</h1>
          </div>
          <div style={styles.body}>
            <p style={styles.bodyText}>Your card has been securely saved on file.</p>
            <p style={styles.bodyText}>Your appointment is now fully confirmed. We look forward to seeing you!</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div style={styles.page}>
        <div style={{ color: '#6b7280', fontSize: 16 }}>Loading...</div>
      </div>
    );
  }

  const bookingDateStr = pageData.bookingDate
    ? new Date(pageData.bookingDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>One Last Step</h1>
          <p style={styles.headerSub}>{pageData.businessName}</p>
        </div>
        <div style={styles.body}>
          <p style={styles.bodyText}>
            Hi {pageData.customerName}, your appointment{bookingDateStr ? ` on ${bookingDateStr}` : ''} is almost confirmed!
          </p>
          <div style={styles.notice}>
            <strong>Card on file — cancellation policy</strong>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#374151' }}>
              We will <strong>not</strong> charge your card. It is kept on file only in the event of a no-show or late cancellation.
            </p>
          </div>
          <div id="card-container" style={styles.cardContainer} />
          {!sdkReady && <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center' }}>Loading secure card form...</p>}
          <button
            onClick={handleSubmit}
            disabled={!card || saving}
            style={{ ...styles.btn, opacity: (!card || saving) ? 0.6 : 1 }}
          >
            {saving ? 'Saving...' : 'Save Card Securely'}
          </button>
          <p style={styles.secure}>🔒 Secured by Square. Your card details are never stored on our servers.</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    maxWidth: 480,
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    background: '#1d4ed8',
    padding: '2rem',
    textAlign: 'center',
  },
  headerTitle: {
    color: '#fff',
    margin: 0,
    fontSize: '1.5rem',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.85)',
    margin: '6px 0 0',
    fontSize: 15,
  },
  body: {
    padding: '2rem',
  },
  bodyText: {
    fontSize: 15,
    color: '#374151',
    margin: '0 0 16px',
  },
  notice: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 20,
    fontSize: 14,
    color: '#1e40af',
  },
  cardContainer: {
    minHeight: 90,
    marginBottom: 16,
  },
  btn: {
    width: '100%',
    background: '#1d4ed8',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '14px',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 12,
  },
  secure: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
    margin: 0,
  },
};
