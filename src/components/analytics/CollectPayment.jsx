import { useState, useEffect, useMemo, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  CreditCard, X, Loader2, Check, Send, Link as LinkIcon, Search, Copy, AlertTriangle,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// Vite only exposes VITE_-prefixed vars to the browser, so a plain STRIPE_PUBLIC_KEY
// on the backend host won't reach here. Accept either of the usual names.
const STRIPE_PK =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_STRIPE_PUBLIC_KEY;

const PLANS = [
  { id: 'pro',   label: 'Pro',   price: 99.95 },
  { id: 'scale', label: 'Scale', price: 175.95 },
  { id: 'basic', label: 'Basic', price: 29.95 },
  { id: '',      label: 'No plan — offer only', price: 0 },
];

let stripePromise;
const getStripe = () => {
  if (!stripePromise && STRIPE_PK) stripePromise = loadStripe(STRIPE_PK);
  return stripePromise;
};

export default function CollectPayment({ token, onClose, onDone, prefill }) {
  const [target, setTarget] = useState(null);        // existing user, if matched
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [manual, setManual] = useState({
    name: prefill?.name || '', email: prefill?.email || '', phone: prefill?.phone || '',
  });
  // Opened from a discovery call, so we already know who they are — but still look
  // them up, in case they've since signed up and have a Stripe customer already.
  useEffect(() => {
    if (!prefill?.email) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/internal-billing/search?q=${encodeURIComponent(prefill.email)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const match = (data.users || []).find(
          u => u.email?.toLowerCase() === prefill.email.toLowerCase()
        );
        if (match) setTarget(match);
      } catch { /* fall back to the manual details */ }
    })();
  }, [prefill?.email, token]);

  const [plan, setPlan] = useState('pro');
  const [trialDays, setTrialDays] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [offerDescription, setOfferDescription] = useState('');

  const [method, setMethod] = useState('link');       // 'link' | 'card'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(null);
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token]
  );

  // Customer search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/internal-billing/search?q=${encodeURIComponent(query)}`, {
          headers: authHeaders,
        });
        const data = await res.json();
        setResults(data.users || []);
      } catch { /* ignore */ }
    }, 250);
    return () => clearTimeout(t);
  }, [query, authHeaders]);

  const payload = () => ({
    userId: target?.id || null,
    email: target?.email || manual.email,
    name: target?.business_name || manual.name,
    plan,
    trialDays: trialDays || null,
    offerAmount: offerAmount ? Number(offerAmount) : 0,
    offerDescription,
  });

  const valid = (target || (manual.email.trim() && manual.name.trim())) && (plan || offerAmount);

  const createLink = async () => {
    setBusy(true); setError(''); setLinkUrl('');
    try {
      const res = await fetch(`${API_URL}/api/internal-billing/checkout-link`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({
          ...payload(),
          send: { sms: sendSms, email: sendEmail, phone: manual.phone || undefined },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create the link');
      setLinkUrl(data.url);
      const sent = [data.delivery?.smsSent && 'text', data.delivery?.emailSent && 'email'].filter(Boolean);
      if (sent.length) setDone(`Link sent by ${sent.join(' and ')}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Collect payment</h3>
            <p className="text-sm text-gray-500">Card on file in Stripe, then charge</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Who */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Who's paying</label>
            {target ? (
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{target.business_name || target.email}</p>
                  <p className="text-xs text-gray-500 truncate">{target.email}</p>
                </div>
                <button onClick={() => { setTarget(null); setQuery(''); }} className="text-xs font-semibold text-amber-700 hover:text-amber-900">
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search existing accounts by business or email"
                    className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
                {results.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                    {results.map(u => (
                      <button
                        key={u.id}
                        onClick={() => { setTarget(u); setResults([]); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition"
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">{u.business_name || '—'}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2 mb-2">Or enter them manually if they haven't signed up yet:</p>
                <div className="grid sm:grid-cols-3 gap-2">
                  <input
                    value={manual.name} onChange={e => setManual(m => ({ ...m, name: e.target.value }))}
                    placeholder="Business name"
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                  />
                  <input
                    type="email" value={manual.email} onChange={e => setManual(m => ({ ...m, email: e.target.value }))}
                    placeholder="Email"
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                  />
                  <input
                    type="tel" value={manual.phone} onChange={e => setManual(m => ({ ...m, phone: e.target.value }))}
                    placeholder="Phone (for the link)"
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Plan */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Recurring plan</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLANS.map(p => (
                <button
                  key={p.id || 'none'}
                  onClick={() => setPlan(p.id)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition ${
                    plan === p.id ? 'border-amber-600 bg-amber-50 text-amber-800' : 'border-gray-200 text-gray-600 hover:border-amber-300'
                  }`}
                >
                  {p.label}
                  {p.price > 0 && <span className="block text-[11px] font-normal text-gray-500">${p.price}/mo</span>}
                </button>
              ))}
            </div>
            {plan && (
              <input
                type="number" min="0" value={trialDays} onChange={e => setTrialDays(e.target.value)}
                placeholder="Free trial days (optional)"
                className="mt-2 w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
              />
            )}
          </div>

          {/* Front end offer */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Front end offer <span className="font-normal text-gray-400">(one-off, optional)</span>
            </label>
            <div className="grid sm:grid-cols-[1fr_130px] gap-2">
              <input
                value={offerDescription} onChange={e => setOfferDescription(e.target.value)}
                placeholder="e.g. Website build + setup"
                className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number" min="0" step="0.01" value={offerAmount}
                  onChange={e => setOfferAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Charged once alongside the first subscription payment, and shown on the Stripe
              invoice under exactly the name you type here.
            </p>
          </div>

          {/* How to capture */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">How are you taking the card?</label>
            <div className="grid sm:grid-cols-2 gap-2">
              <button
                onClick={() => setMethod('link')}
                className={`p-3 rounded-lg border-2 text-left transition ${
                  method === 'link' ? 'border-amber-600 bg-amber-50' : 'border-gray-200 hover:border-amber-300'
                }`}
              >
                <span className="flex items-center gap-2 font-semibold text-sm text-gray-900">
                  <LinkIcon className="w-4 h-4" /> Send them a link
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">They enter the card themselves</span>
              </button>
              <button
                onClick={() => setMethod('card')}
                className={`p-3 rounded-lg border-2 text-left transition ${
                  method === 'card' ? 'border-amber-600 bg-amber-50' : 'border-gray-200 hover:border-amber-300'
                }`}
              >
                <span className="flex items-center gap-2 font-semibold text-sm text-gray-900">
                  <CreditCard className="w-4 h-4" /> Enter it here
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">Key it in while on the call</span>
              </button>
            </div>
          </div>

          {method === 'card' && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Card details go straight from this browser to Stripe and never touch our servers.
                Taking card numbers by phone still widens your PCI scope though — don't write them
                down anywhere, and prefer the link when you can.
              </p>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
          {done && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-center gap-2"><Check className="w-4 h-4" />{done}</div>}

          {linkUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-900 mb-1.5">Payment link</p>
              <div className="flex gap-2">
                <input readOnly value={linkUrl} className="flex-1 px-2 py-1.5 text-xs bg-white border border-blue-200 rounded font-mono truncate" />
                <button
                  onClick={() => { navigator.clipboard.writeText(linkUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="px-2.5 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}

          {method === 'link' ? (
            <>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)}
                         className="rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
                  <span className="text-gray-700">Email it</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={sendSms} onChange={e => setSendSms(e.target.checked)}
                         className="rounded border-gray-300 text-amber-600 focus:ring-amber-400" />
                  <span className="text-gray-700">Text it</span>
                </label>
              </div>
              <button
                onClick={createLink}
                disabled={busy || !valid}
                className="w-full py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Send className="w-4 h-4" /> Create &amp; send payment link</>}
              </button>
            </>
          ) : (
            <CardOnFileForm
              authHeaders={authHeaders}
              payload={payload}
              valid={valid}
              onError={setError}
              onSuccess={(msg) => { setDone(msg); onDone?.(); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Stripe Elements card entry. Mounted imperatively via @stripe/stripe-js so we
// don't pull in another React wrapper package just for one form.
function CardOnFileForm({ authHeaders, payload, valid, onError, onSuccess }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!STRIPE_PK) { onError('VITE_STRIPE_PUBLISHABLE_KEY is not set — card entry is unavailable.'); return; }
      const stripe = await getStripe();
      if (cancelled || !stripe || !mountRef.current) return;
      const elements = stripe.elements();
      const card = elements.create('card', {
        style: { base: { fontSize: '15px', color: '#111827', '::placeholder': { color: '#9ca3af' } } },
      });
      card.mount(mountRef.current);
      stateRef.current = { stripe, card };
      setReady(true);
    })();
    return () => { cancelled = true; stateRef.current.card?.unmount?.(); };
  }, [onError]);

  const submit = async () => {
    const { stripe, card } = stateRef.current;
    if (!stripe || !card) return;
    setBusy(true);
    onError('');
    try {
      const body = payload();
      const intentRes = await fetch(`${API_URL}/api/internal-billing/setup-intent`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify(body),
      });
      const intent = await intentRes.json();
      if (!intentRes.ok) throw new Error(intent.error || 'Could not start card capture');

      const confirmed = await stripe.confirmCardSetup(intent.clientSecret, {
        payment_method: { card },
      });
      if (confirmed.error) throw new Error(confirmed.error.message);

      const subRes = await fetch(`${API_URL}/api/internal-billing/subscribe`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({
          ...body,
          customerId: intent.customerId,
          userId: intent.userId ?? body.userId,
          paymentMethodId: confirmed.setupIntent.payment_method,
        }),
      });
      const sub = await subRes.json();
      if (!subRes.ok) throw new Error(sub.error || 'Card saved, but the charge failed');

      card.clear();
      onSuccess(sub.subscriptionId ? 'Card on file and subscription started' : 'Card on file and charged');
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="px-3 py-3 border-2 border-gray-200 rounded-lg focus-within:border-amber-500">
        <div ref={mountRef} />
      </div>
      <button
        onClick={submit}
        disabled={busy || !ready || !valid}
        className="w-full py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Charging...</> : <><CreditCard className="w-4 h-4" /> Save card &amp; charge</>}
      </button>
    </>
  );
}
