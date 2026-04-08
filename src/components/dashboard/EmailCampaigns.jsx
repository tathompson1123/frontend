import { useState, useEffect, useRef } from 'react';
import {
  Mail, Send, CheckCircle, AlertCircle, Loader, Sparkles,
  Settings, Users, Clock, ChevronDown, ChevronUp, FlaskConical,
  History, X, Zap,
} from 'lucide-react';

// ── Settings Modal ───────────────────────────────────────────
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  return { value: i, label: `${h}:00 ${i < 12 ? 'AM' : 'PM'}` };
});

function SettingsModal({ config, onSave, onClose }) {
  const [local, setLocal] = useState({
    from_name: config.from_name || '',
    from_email: config.from_email || '',
    send_day: config.send_day || 'monday',
    send_hour: config.send_hour ?? 9,
    enabled: config.enabled ?? true,
    auto_send: config.auto_send ?? false,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(local);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">Campaign Settings</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">From Name</label>
            <input
              type="text"
              value={local.from_name}
              onChange={e => setLocal(p => ({ ...p, from_name: e.target.value }))}
              placeholder="Your Business Name"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Reply-To Email</label>
            <input
              type="email"
              value={local.from_email}
              onChange={e => setLocal(p => ({ ...p, from_email: e.target.value }))}
              placeholder="hello@yourbusiness.com"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Send Day</label>
              <select
                value={local.send_day}
                onChange={e => setLocal(p => ({ ...p, send_day: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Time (UTC)</label>
              <select
                value={local.send_hour}
                onChange={e => setLocal(p => ({ ...p, send_hour: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
          </div>
          {/* Weekly generation mode */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <p className="text-xs font-semibold text-gray-600">Weekly Campaign Mode</p>
            <button
              onClick={() => setLocal(p => ({ ...p, enabled: true, auto_send: false }))}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${local.enabled && !local.auto_send ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className={`text-sm font-bold ${local.enabled && !local.auto_send ? 'text-blue-700' : 'text-gray-800'}`}>Manual Approval</p>
              <p className="text-xs text-gray-500 mt-0.5">SORCE prepares a campaign every week. You review and approve before it sends.</p>
            </button>
            <button
              onClick={() => setLocal(p => ({ ...p, enabled: true, auto_send: true }))}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${local.enabled && local.auto_send ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className={`text-sm font-bold ${local.enabled && local.auto_send ? 'text-purple-700' : 'text-gray-800'}`}>Fully Automated</p>
              <p className="text-xs text-gray-500 mt-0.5">SORCE generates and sends automatically every week. No action needed from you.</p>
            </button>
            <button
              onClick={() => setLocal(p => ({ ...p, enabled: false, auto_send: false }))}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${!local.enabled ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className={`text-sm font-bold ${!local.enabled ? 'text-gray-700' : 'text-gray-600'}`}>Off</p>
              <p className="text-xs text-gray-500 mt-0.5">Pause weekly campaigns entirely.</p>
            </button>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-5 w-full py-2.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 disabled:opacity-60 transition-all"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

// ── Annotation ink colors ────────────────────────────────────
const ANNOTATION_INKS = [
  { color: '#2563eb', light: '#dbeafe' }, // blue
  { color: '#7c3aed', light: '#ede9fe' }, // purple
  { color: '#d97706', light: '#fef3c7' }, // amber
  { color: '#059669', light: '#d1fae5' }, // green
  { color: '#dc2626', light: '#fee2e2' }, // red
];

// ── Annotation note card ─────────────────────────────────────
function AnnotationCard({ a, i, side }) {
  const ink = ANNOTATION_INKS[i % ANNOTATION_INKS.length];
  // Arrow points toward the email (right for left-side notes, left for right-side notes)
  const arrowSide = side === 'left' ? 'right' : 'left';
  return (
    <div className="relative" style={{ marginBottom: '10px' }}>
      {/* Card */}
      <div
        className="relative rounded-lg px-3 py-2.5 shadow-sm"
        style={{ backgroundColor: ink.light, border: `1px solid ${ink.color}30` }}
      >
        {/* Ruled lines */}
        <div
          className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden"
          style={{
            backgroundImage: `repeating-linear-gradient(transparent, transparent 22px, ${ink.color}15 23px)`,
            backgroundPosition: '0 10px',
          }}
        />
        {/* Label */}
        <span
          className="relative block font-sans uppercase tracking-widest mb-0.5"
          style={{ fontSize: '0.6rem', fontWeight: 700, color: ink.color, opacity: 0.55 }}
        >
          {a.label}
        </span>
        {/* Note text */}
        <p
          className="relative leading-snug"
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: '1rem',
            fontWeight: 600,
            color: ink.color,
            lineHeight: '1.45',
          }}
        >
          {a.note}
        </p>
        {/* Arrow pointing toward email */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            [arrowSide === 'right' ? 'right' : 'left']: -9,
            width: 0,
            height: 0,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            [arrowSide === 'right' ? 'borderLeft' : 'borderRight']: `9px solid ${ink.color}40`,
          }}
        />
      </div>
    </div>
  );
}

// ── Email preview + side annotations ────────────────────────
function EmailPreview({ html, annotations }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:16px;background:#f3f4f6;font-family:Arial,sans-serif}*{box-sizing:border-box}</style></head><body>${html}</body></html>`);
    doc.close();
    const resize = () => {
      try { iframe.style.height = doc.body.scrollHeight + 32 + 'px'; } catch {}
    };
    setTimeout(resize, 100);
  }, [html]);

  const hasAnnotations = annotations && annotations.length > 0;
  const leftWithIdx = hasAnnotations ? annotations.map((a, i) => ({ a, i })).filter((_, i) => i % 2 === 0) : [];
  const rightWithIdx = hasAnnotations ? annotations.map((a, i) => ({ a, i })).filter((_, i) => i % 2 === 1) : [];

  return (
    <div className="bg-gray-100 py-4 px-3">
      {/* "Why it works" label — only shown when there are annotations */}
      {hasAnnotations && (
        <div className="flex items-center gap-1 mb-3 px-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Why it works</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Left annotations — sit in the grey space to the left of the email */}
        {hasAnnotations && (
          <div className="w-36 flex-shrink-0 space-y-2">
            {leftWithIdx.map(({ a, i }) => (
              <AnnotationCard key={i} a={a} i={i} side="left" />
            ))}
          </div>
        )}

        {/* Email iframe */}
        <div className="flex-1">
          <iframe
            ref={iframeRef}
            title="Email Preview"
            className="w-full rounded-xl border border-gray-200 bg-white"
            style={{ minHeight: 400 }}
          />
        </div>

        {/* Right annotations — sit in the grey space to the right of the email */}
        {hasAnnotations && (
          <div className="w-36 flex-shrink-0 space-y-2">
            {rightWithIdx.map(({ a, i }) => (
              <AnnotationCard key={i} a={a} i={i} side="right" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Past Campaigns ────────────────────────────────────────────
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
          <span className="text-sm font-semibold text-gray-700">Past Campaigns</span>
          <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{sent.length}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="divide-y divide-gray-100 bg-white border-t border-gray-100">
          {sent.slice(0, 10).map(c => (
            <div key={c.id} className="flex items-center gap-3 px-5 py-3">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{c.subject}</p>
                <p className="text-xs text-gray-400">
                  {new Date(c.sent_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {c.recipient_count ? ` · ${c.recipient_count} recipients` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function EmailCampaigns({ apiUrl, authFetch, user }) {
  const [campaign, setCampaign] = useState(null);  // current draft
  const [draftId, setDraftId] = useState(null);
  const [config, setConfig] = useState({ from_name: '', from_email: '', send_day: 'monday', send_hour: 9, enabled: true, auto_send: false, cta_link: '' });
  const [ctaLink, setCtaLink] = useState('');
  const [savingCtaLink, setSavingCtaLink] = useState(false);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  // Loading states
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [refining, setRefining] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Feedback input
  const [feedback, setFeedback] = useState('');
  const feedbackRef = useRef(null);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load everything on mount
  useEffect(() => {
    Promise.all([
      authFetch(`${apiUrl}/api/email-campaigns/config`).then(r => r.json()).catch(() => ({})),
      authFetch(`${apiUrl}/api/email-campaigns/history`).then(r => r.json()).catch(() => ({})),
      authFetch(`${apiUrl}/api/email-campaigns/stats`).then(r => r.json()).catch(() => ({})),
      authFetch(`${apiUrl}/api/business-info`).then(r => r.json()).catch(() => ({})),
    ]).then(([configData, histData, statsData, bizData]) => {
      const savedConfig = configData.config || {};
      const bizInfo = bizData.businessInfo || {};
      setConfig({
        enabled: false, send_day: 'monday', send_hour: 9,
        ...savedConfig,
        from_name: savedConfig.from_name || user?.business_name || '',
        from_email: savedConfig.from_email || bizInfo.email || user?.email || '',
      auto_send: savedConfig.auto_send ?? false,
      cta_link: savedConfig.cta_link || '',
      });
      setCtaLink(savedConfig.cta_link || '');
      if (histData.campaigns) setHistory(histData.campaigns);
      if (statsData.subscriberCount !== undefined) setStats(statsData);
    });

    // Fetch or auto-generate this week's campaign
    authFetch(`${apiUrl}/api/email-campaigns/current-draft`)
      .then(r => r.json())
      .then(data => {
        if (data.campaign) {
          setCampaign(data.campaign);
          setDraftId(data.campaign.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDraft(false));
  }, []);

  const saveCtaLink = async () => {
    setSavingCtaLink(true);
    try {
      const merged = { ...config, cta_link: ctaLink };
      setConfig(merged);
      await authFetch(`${apiUrl}/api/email-campaigns/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      showToast('Button link saved — applies to future campaigns');
    } finally {
      setSavingCtaLink(false);
    }
  };

  const saveSettings = async (newConfig) => {
    const merged = { ...config, ...newConfig };
    setConfig(merged);
    await authFetch(`${apiUrl}/api/email-campaigns/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    });
    // Refresh stats
    authFetch(`${apiUrl}/api/email-campaigns/stats`).then(r => r.json()).then(d => {
      if (d.subscriberCount !== undefined) setStats(d);
    }).catch(() => {});
    showToast('Settings saved');
  };

  const handleRefine = async () => {
    if (!feedback.trim() || !draftId) return;
    setRefining(true);
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, feedback: feedback.trim() }),
      });
      const data = await r.json();
      if (data.success) {
        setCampaign(data.campaign);
        setFeedback('');
        showToast('Campaign updated');
      } else {
        showToast(data.error || 'Failed to update', 'error');
      }
    } finally {
      setRefining(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      // Delete current draft then fetch a new one
      if (draftId) {
        await authFetch(`${apiUrl}/api/email-campaigns/drafts/${draftId}`, { method: 'DELETE' }).catch(() => {});
      }
      const r = await authFetch(`${apiUrl}/api/email-campaigns/current-draft`);
      const data = await r.json();
      if (data.campaign) {
        setCampaign(data.campaign);
        setDraftId(data.campaign.id);
        showToast('Fresh campaign generated');
      }
    } finally {
      setRegenerating(false);
    }
  };

  const handleTestSend = async () => {
    if (!config.from_email) { showToast('Add a reply-to email in Settings first', 'error'); return; }
    setSendingTest(true);
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId }),
      });
      const data = await r.json();
      if (data.success) showToast(`Test sent to ${data.sentTo}`);
      else showToast(data.error || 'Test failed', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const handleApprove = async () => {
    if (!config.from_email) { showToast('Add a reply-to email in Settings first', 'error'); return; }
    const count = stats?.subscriberCount ?? 'your';
    if (!confirm(`Send this campaign to ${count} customers now?`)) return;
    setSending(true);
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/send-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId }),
      });
      const data = await r.json();
      if (data.success) {
        showToast(`Sent to ${data.sent} customers`);
        setCampaign(null);
        setDraftId(null);
        // Refresh history
        authFetch(`${apiUrl}/api/email-campaigns/history`).then(r => r.json()).then(d => {
          if (d.campaigns) setHistory(d.campaigns);
        }).catch(() => {});
      } else {
        showToast(data.error || 'Send failed', 'error');
      }
    } finally {
      setSending(false);
    }
  };

  const sendDay = config.send_day
    ? config.send_day.charAt(0).toUpperCase() + config.send_day.slice(1)
    : 'Monday';

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: 'calc(100vh - 112px)' }}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal config={config} onSave={saveSettings} onClose={() => setShowSettings(false)} />
      )}

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Email Marketing</h2>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {stats && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {stats.subscriberCount} subscribers
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Every {sendDay}
                  </span>
                  {config.enabled && config.auto_send ? (
                    <span className="flex items-center gap-1 text-purple-600 font-semibold">
                      <Zap className="w-3 h-3" />
                      Fully automated
                    </span>
                  ) : config.enabled ? (
                    <span className="flex items-center gap-1 text-blue-600 font-semibold">
                      <CheckCircle className="w-3 h-3" />
                      Approval required
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* This Week's Campaign */}
          {loadingDraft ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Loader className="w-7 h-7 text-blue-500 animate-spin" />
              </div>
              <p className="font-semibold text-gray-700">SORCE is preparing this week's campaign…</p>
              <p className="text-sm text-gray-400 mt-1">Crafting a fresh offer for your customers</p>
            </div>
          ) : campaign ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Campaign meta bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">This Week's Campaign</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{campaign.subject}</p>
                  {campaign.previewText && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{campaign.previewText}</p>
                  )}
                </div>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  title="Generate a completely new campaign"
                  className="flex-shrink-0 ml-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-all"
                >
                  {regenerating ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Regenerate
                </button>
              </div>

              {/* Email preview — annotations live in the grey space around the iframe */}
              <EmailPreview
                html={campaign.bodyHtml || campaign.body_html || ''}
                annotations={campaign.annotations}
              />

              {/* CTA Button link */}
              <div className="px-5 pb-3 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Button link URL <span className="font-normal text-gray-400">(saved for all future campaigns)</span></p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={ctaLink}
                    onChange={e => setCtaLink(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveCtaLink(); }}
                    placeholder="https://yourbusiness.com/book"
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
                  />
                  <button
                    onClick={saveCtaLink}
                    disabled={savingCtaLink}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all flex-shrink-0"
                  >
                    {savingCtaLink ? <Loader className="w-4 h-4 animate-spin" /> : 'Save'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-5 pb-5">
                <button
                  onClick={handleTestSend}
                  disabled={sendingTest}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all"
                >
                  {sendingTest ? <Loader className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                  {sendingTest ? 'Sending…' : 'Send Test to Me'}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm shadow-green-200"
                >
                  {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending…' : `Approve & Send to ${stats?.subscriberCount ?? 'All'} Customers`}
                </button>
              </div>
            </div>
          ) : (
            /* No campaign — just sent or none */
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <p className="font-semibold text-gray-700">Campaign sent!</p>
              <p className="text-sm text-gray-400 mt-1 mb-5">Next week's campaign will appear here automatically.</p>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all mx-auto"
              >
                {regenerating ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {regenerating ? 'Generating…' : 'Generate Now'}
              </button>
            </div>
          )}

          {/* Past campaigns */}
          <PastCampaigns history={history} />

        </div>
      </div>

      {/* Ask SORCE — pinned at bottom, always visible while scrolling the email */}
      {campaign && (
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_-6px_24px_rgba(59,130,246,0.25)]">
          <div className="max-w-2xl mx-auto w-full px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <p className="text-xs font-bold text-blue-100 uppercase tracking-wider">Ask SORCE to change something</p>
            </div>
            <div className="flex gap-2">
              <input
                ref={feedbackRef}
                type="text"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefine(); } }}
                placeholder='e.g. "Make the offer 20% off" or "Add more urgency"'
                disabled={refining}
                className="flex-1 border-0 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-white/50 outline-none disabled:opacity-60 bg-white/15 text-white placeholder-blue-200"
              />
              <button
                onClick={handleRefine}
                disabled={refining || !feedback.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-50 disabled:opacity-50 transition-all flex-shrink-0 shadow-sm"
              >
                {refining ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {refining ? 'Updating…' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
