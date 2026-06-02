import { useState, useEffect } from 'react';
import {
  MessageSquare, Send, CheckCircle, AlertCircle, Loader, Sparkles,
  Users, History, ChevronDown, ChevronUp, FlaskConical, Phone, ShieldCheck,
} from 'lucide-react';
import OakameLoader from '../OakameLoader';

const STOP_FOOTER = 'Reply STOP to unsubscribe';
const SMS_MAX_LENGTH = 320;

// ── Past Campaigns ───────────────────────────────────────────
function PastCampaigns({ history }) {
  const [open, setOpen] = useState(false);
  const sent = history.filter(c => c.status === 'sent');
  if (sent.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <History className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Past Texts</span>
          <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{sent.length}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="divide-y divide-gray-100 bg-white border-t border-gray-100">
          {sent.slice(0, 10).map(c => (
            <div key={c.id} className="flex items-start gap-3 px-5 py-3">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 line-clamp-2">{c.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(c.sent_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {c.recipient_count ? ` · ${c.recipient_count} sent` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Phone preview bubble ─────────────────────────────────────
function PhonePreview({ message }) {
  const preview = (message || '').replace(/\{first_name\}/gi, 'Alex').replace(/\{name\}/gi, 'Alex').trim();
  const withFooter = /\bstop\b/i.test(preview)
    ? preview
    : `${preview}${preview ? '\n\n' : ''}${STOP_FOOTER}`;
  return (
    <div className="bg-gray-100 rounded-2xl p-5 flex justify-center">
      <div className="w-full max-w-xs">
        <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 border border-gray-200">
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
            {withFooter || <span className="text-gray-400">Your message preview appears here…</span>}
          </p>
        </div>
        <p className="text-[11px] text-gray-400 mt-2 text-center">Delivered · just now</p>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function SmsCampaigns({ apiUrl, authFetch, user }) {
  const [message, setMessage] = useState('');
  const [offerBrief, setOfferBrief] = useState('');
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [testPhone, setTestPhone] = useState('');

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadStats = () =>
    authFetch(`${apiUrl}/api/sms-campaigns/stats`).then(r => r.json()).then(d => {
      if (d.subscriberCount !== undefined) setStats(d);
    }).catch(() => {});

  useEffect(() => {
    Promise.all([
      authFetch(`${apiUrl}/api/sms-campaigns/stats`).then(r => r.json()).catch(() => ({})),
      authFetch(`${apiUrl}/api/sms-campaigns/history`).then(r => r.json()).catch(() => ({})),
    ]).then(([statsData, histData]) => {
      if (statsData.subscriberCount !== undefined) setStats(statsData);
      if (histData.campaigns) setHistory(histData.campaigns);
    }).finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await authFetch(`${apiUrl}/api/sms-campaigns/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer: offerBrief.trim() }),
      });
      const data = await r.json();
      if (data.success && data.message) {
        setMessage(data.message);
        showToast('Offer drafted — edit it however you like');
      } else {
        showToast(data.error || 'Could not generate a message', 'error');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleTestSend = async () => {
    if (!message.trim()) { showToast('Write a message first', 'error'); return; }
    if (!testPhone.trim()) { showToast('Enter a phone number to send the test to', 'error'); return; }
    setSendingTest(true);
    try {
      const r = await authFetch(`${apiUrl}/api/sms-campaigns/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), toPhone: testPhone.trim() }),
      });
      const data = await r.json();
      if (data.success) showToast(`Test sent to ${data.sentTo}`);
      else showToast(data.error || 'Test failed', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) { showToast('Write a message first', 'error'); return; }
    if (!stats?.hasPhoneNumber) { showToast('No SMS number is provisioned for your account yet', 'error'); return; }
    const count = stats?.subscriberCount ?? 'your';
    if (!confirm(`Text this offer to ${count} contacts now?`)) return;
    setSending(true);
    try {
      const r = await authFetch(`${apiUrl}/api/sms-campaigns/send-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = await r.json();
      if (data.success) {
        showToast(`Sent to ${data.sent} contacts`);
        setMessage('');
        setOfferBrief('');
        authFetch(`${apiUrl}/api/sms-campaigns/history`).then(r => r.json()).then(d => {
          if (d.campaigns) setHistory(d.campaigns);
        }).catch(() => {});
        loadStats();
      } else {
        showToast(data.error || 'Send failed', 'error');
      }
    } finally {
      setSending(false);
    }
  };

  const charCount = message.length;
  const overLimit = charCount > SMS_MAX_LENGTH;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-12 text-center mt-6">
        <div className="flex justify-center mb-5"><OakameLoader size="lg" color="#10b981" /></div>
        <p className="font-semibold text-gray-700">Loading your SMS campaign…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">SMS Marketing</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {stats && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {stats.subscriberCount} reachable contacts
                </span>
              )}
              {stats?.fromNumber && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {stats.fromNumber}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 pb-6 space-y-5">

        {/* No-number warning */}
        {stats && !stats.hasPhoneNumber && (
          <div className="flex items-start gap-2 text-amber-800 text-sm bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>You don't have an SMS number provisioned yet. Set up your business phone number to send texts.</span>
          </div>
        )}

        {/* Composer card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Offer Text</p>
          </div>

          <div className="p-5 space-y-4">
            {/* AI generate */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Describe your offer (optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={offerBrief}
                  onChange={e => setOfferBrief(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); }}
                  placeholder='e.g. "20% off any service this week"'
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-all flex-shrink-0"
                >
                  {generating ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generating ? 'Writing…' : 'Draft with AI'}
                </button>
              </div>
            </div>

            {/* Message editor */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
                placeholder="Write your text message here… Use {name} to insert the contact's first name."
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none resize-none ${overLimit ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-green-500'}`}
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[11px] text-gray-400">
                  Use <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> for the first name. "{STOP_FOOTER}" is added automatically.
                </p>
                <span className={`text-[11px] font-medium ${overLimit ? 'text-red-500' : 'text-gray-400'}`}>{charCount}/{SMS_MAX_LENGTH}</span>
              </div>
            </div>

            {/* Live preview */}
            <PhonePreview message={message} />
          </div>

          {/* Test + send */}
          <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Send a test to your phone</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                />
                <button
                  onClick={handleTestSend}
                  disabled={sendingTest}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all flex-shrink-0"
                >
                  {sendingTest ? <Loader className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                  {sendingTest ? 'Sending…' : 'Test'}
                </button>
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={sending || overLimit || !message.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm shadow-green-200"
            >
              {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending…' : `Send to ${stats?.subscriberCount ?? 'All'} Contacts`}
            </button>
          </div>
        </div>

        {/* Compliance note */}
        <div className="flex items-start gap-2 text-gray-500 text-xs bg-white border border-gray-200 rounded-xl px-4 py-3">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
          <span>
            Every text automatically includes "{STOP_FOOTER}". Contacts who reply STOP are unsubscribed instantly and won't get future texts — the AI lead agent never replies to them.
          </span>
        </div>

        {/* History */}
        <PastCampaigns history={history} />
      </div>
    </div>
  );
}
