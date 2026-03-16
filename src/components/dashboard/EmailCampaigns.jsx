import { useState, useEffect, useRef } from 'react';
import { Mail, Send, Calendar, Clock, CheckCircle, AlertCircle, Loader, Sparkles, BookmarkPlus, ChevronDown, Trash2, BookOpen, FlaskConical, FileText, Shield } from 'lucide-react';
import EmailBlockEditor from './email/EmailBlockEditor';
import { emailBlocksToHtml } from '../../utils/emailBlocks';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return { value: i, label: `${h}:00 ${ampm}` };
});

const TONES = [
  { value: 'friendly', label: 'Friendly', desc: 'Warm and conversational' },
  { value: 'professional', label: 'Professional', desc: 'Polished and authoritative' },
  { value: 'urgent', label: 'Urgent', desc: 'Time-sensitive, action-driven' },
];

const FOCUSES = [
  { value: 'seasonal', label: 'Seasonal Offer', desc: 'Tied to the current month or upcoming holidays' },
  { value: 'upsell', label: 'Upsell / Bundle', desc: 'Upgrade existing customers to a higher-value service' },
  { value: 'referral', label: 'Referral Bonus', desc: 'Reward loyal customers for sending friends' },
  { value: 'winback', label: 'Win-Back', desc: 'Re-engage customers who haven\'t booked in a while' },
];

const OFFER_PROMPTS = {
  seasonal:     ['What\'s the seasonal offer?', 'What\'s the message angle?', 'What emotion should it elicit?'],
  upsell:       ['What\'s the upsell or bundle?', 'What\'s the value proposition?', 'What emotion should it elicit?'],
  referral:     ['What\'s the referral reward?', 'What\'s the loyalty message?', 'What emotion should it elicit?'],
  winback:      ['What\'s the win-back incentive?', 'What\'s the "we miss you" angle?', 'What emotion should it elicit?'],
};


function CampaignPresets({ presets, onLoad, onDelete, onSave, currentConfig, currentOfferDetails }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSave = async () => {
    if (!nameInput.trim()) return;
    setSaving(true);
    await onSave(nameInput.trim());
    setNameInput('');
    setShowSaveForm(false);
    setSaving(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex gap-2">
        <button
          onClick={() => { setOpen(!open); setShowSaveForm(false); }}
          className="flex-1 flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
        >
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-gray-400" />
            {presets.length > 0 ? 'Load a preset' : 'No saved presets'}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={() => { setShowSaveForm(!showSaveForm); setOpen(false); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
        >
          <BookmarkPlus className="w-4 h-4 text-gray-400" />
          Save
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
          {presets.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400 text-center">No saved presets yet</p>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {presets.map(p => (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                  <button onClick={() => { onLoad(p); setOpen(false); }} className="flex-1 text-left text-sm font-medium text-gray-800 hover:text-blue-600">
                    {p.name}
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </button>
                  <button onClick={() => onDelete(p.id)} className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showSaveForm && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 p-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">Save current settings as preset</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSaveForm(false); }}
              placeholder="Preset name (e.g. Spring Seasonal)"
              autoFocus
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button onClick={handleSave} disabled={saving || !nameInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? '…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmailCampaigns({ apiUrl, authFetch, user }) {
  const [config, setConfig] = useState({
    enabled: false,
    send_day: 'monday',
    send_hour: 9,
    from_name: '',
    from_email: '',
    tone: 'friendly',
    focus: 'seasonal',
  });
  const [offerDetails, setOfferDetails] = useState({ offer: '', message: '', emotion: '', ctaLink: '' });
  const [presets, setPresets] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [editedBlocks, setEditedBlocks] = useState([]);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedPreviewText, setEditedPreviewText] = useState('');
  const [editedBodyText, setEditedBodyText] = useState('');
  const [toast, setToast] = useState(null);
  const [sgStatus, setSgStatus] = useState('loading');
  const [sgLoading, setSgLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSendGridVerify = async () => {
    setSgLoading(true);
    try {
      const res = await authFetch(`${apiUrl}/api/user/sendgrid/verify`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'pending') {
        setSgStatus('pending');
        showToast('Verification email sent! Check your inbox.');
      } else {
        showToast(data.error || 'Verification failed', 'error');
      }
    } catch { showToast('Failed to send verification', 'error'); }
    setSgLoading(false);
  };

  const handleCheckSgStatus = async () => {
    setSgLoading(true);
    try {
      const res = await authFetch(`${apiUrl}/api/user/sendgrid/status`);
      const data = await res.json();
      setSgStatus(data.status);
      if (data.status === 'verified') showToast('Email verified!');
      else if (data.status === 'pending') showToast('Still pending — check your inbox');
    } catch {}
    setSgLoading(false);
  };

  useEffect(() => {
    authFetch(`${apiUrl}/api/user/sendgrid/status`).then(r => r.json()).then(d => setSgStatus(d.status)).catch(() => setSgStatus('unknown'));
    Promise.all([
      authFetch(`${apiUrl}/api/email-campaigns/config`).then(r => r.json()),
      authFetch(`${apiUrl}/api/email-campaigns/history`).then(r => r.json()),
      authFetch(`${apiUrl}/api/email-campaigns/presets`).then(r => r.json()),
      authFetch(`${apiUrl}/api/email-campaigns/drafts`).then(r => r.json()),
    ]).then(([configData, histData, presetsData, draftsData]) => {
      if (configData.config) setConfig(prev => ({ ...prev, ...configData.config }));
      if (histData.campaigns) setHistory(histData.campaigns);
      if (presetsData.presets) setPresets(presetsData.presets);
      if (draftsData.drafts) setDrafts(draftsData.drafts);
    }).finally(() => setLoading(false));
  }, []);

  const savePreset = async (name) => {
    const settings = { config, offerDetails };
    const r = await authFetch(`${apiUrl}/api/email-campaigns/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, settings }),
    });
    const data = await r.json();
    if (data.preset) {
      setPresets(prev => [data.preset, ...prev]);
      showToast(`Preset "${name}" saved!`);
    } else {
      showToast(data.error || 'Failed to save preset', 'error');
    }
  };

  const loadPreset = (preset) => {
    const s = preset.settings || {};
    if (s.config) setConfig(prev => ({ ...prev, ...s.config }));
    if (s.offerDetails) setOfferDetails(s.offerDetails);
    showToast(`Loaded preset "${preset.name}"`);
  };

  const deletePreset = async (id) => {
    const r = await authFetch(`${apiUrl}/api/email-campaigns/presets/${id}`, { method: 'DELETE' });
    if (r.ok) setPresets(prev => prev.filter(p => p.id !== id));
    else showToast('Failed to delete preset', 'error');
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (r.ok) showToast('Campaign settings saved!');
      else showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const generatePreview = async () => {
    setPreviewing(true);
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerDetails }),
      });
      const data = await r.json();
      if (data.campaign) {
        setEditedBlocks(data.campaign.blocks || []);
        setEditedSubject(data.campaign.subject);
        setEditedPreviewText(data.campaign.previewText);
        setEditedBodyText(data.campaign.bodyText || '');
        setCurrentDraftId(data.draftId);
        setDrafts(prev => [{
          id: data.draftId,
          subject: data.campaign.subject,
          preview_text: data.campaign.previewText,
          created_at: new Date().toISOString(),
        }, ...prev]);
      } else {
        showToast(data.error || 'Failed to generate campaign', 'error');
      }
    } finally {
      setPreviewing(false);
    }
  };

  const loadDraft = (draft) => {
    setEditedBlocks(draft.blocks || []);
    setEditedSubject(draft.subject || '');
    setEditedPreviewText(draft.preview_text || '');
    setEditedBodyText(draft.body_text || '');
    setCurrentDraftId(draft.id);
  };

  const deleteDraft = async (id) => {
    const r = await authFetch(`${apiUrl}/api/email-campaigns/drafts/${id}`, { method: 'DELETE' });
    if (r.ok) setDrafts(prev => prev.filter(d => d.id !== id));
    else showToast('Failed to delete draft', 'error');
  };

  const saveDraft = async () => {
    if (!currentDraftId) return;
    setSavingDraft(true);
    try {
      const bodyHtml = emailBlocksToHtml(editedBlocks);
      const r = await authFetch(`${apiUrl}/api/email-campaigns/drafts/${currentDraftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: editedSubject,
          previewText: editedPreviewText,
          bodyHtml,
          bodyText: editedBodyText,
          blocks: editedBlocks,
        }),
      });
      const data = await r.json();
      if (data.success) {
        setDrafts(prev => prev.map(d => d.id === currentDraftId ? { ...d, subject: editedSubject } : d));
        showToast('Draft saved!');
      } else {
        showToast(data.error || 'Failed to save draft', 'error');
      }
    } finally {
      setSavingDraft(false);
    }
  };

  const testSend = async () => {
    if (!config.from_email) {
      showToast('Set your From Email in settings first', 'error');
      return;
    }
    setTestSending(true);
    try {
      const bodyHtml = emailBlocksToHtml(editedBlocks);
      const r = await authFetch(`${apiUrl}/api/email-campaigns/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: editedSubject,
          bodyHtml,
          bodyText: editedBodyText,
          blocks: editedBlocks,
        }),
      });
      const data = await r.json();
      if (data.success) showToast(`Test sent to ${data.sentTo}`);
      else showToast(data.error || 'Test send failed', 'error');
    } finally {
      setTestSending(false);
    }
  };

  const sendNow = async () => {
    if (!config.from_email) {
      showToast('Set your From Email in settings first', 'error');
      return;
    }
    if (!confirm('This will send the email to all your past customers right now. Continue?')) return;
    setSendingNow(true);
    try {
      const bodyHtml = emailBlocksToHtml(editedBlocks);
      const r = await authFetch(`${apiUrl}/api/email-campaigns/send-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: currentDraftId,
          usePreview: {
            subject: editedSubject,
            previewText: editedPreviewText,
            bodyHtml,
            bodyText: editedBodyText,
            blocks: editedBlocks,
          },
        }),
      });
      const data = await r.json();
      if (data.success) {
        showToast(`Sent to ${data.sent} customers — "${data.subject}"`);
        setDrafts(prev => prev.filter(d => d.id !== currentDraftId));
        const h = await authFetch(`${apiUrl}/api/email-campaigns/history`).then(r => r.json());
        if (h.campaigns) setHistory(h.campaigns);
        setCurrentDraftId(null);
        setEditedBlocks([]);
        setEditedSubject('');
        setEditedPreviewText('');
      } else {
        showToast(data.error || 'Send failed', 'error');
      }
    } finally {
      setSendingNow(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-blue-600" /></div>;

  const hasPreview = editedBlocks.length > 0;
  const prompts = OFFER_PROMPTS[config.focus] || OFFER_PROMPTS.seasonal;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <Mail className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white">AI Email Marketing</h2>
          <p className="text-xs text-blue-100">
            {history.filter(c => c.status !== 'draft').length > 0
              ? `${history.filter(c => c.status !== 'draft')[0]?.recipient_count || 0} sent last campaign · autopilot every ${config.send_day}`
              : `Autopilot every ${config.send_day}`}
          </p>
        </div>
        <CampaignPresets
          presets={presets}
          onLoad={loadPreset}
          onDelete={deletePreset}
          onSave={savePreset}
          currentConfig={config}
          currentOfferDetails={offerDetails}
        />
      </div>

      {/* Split: Left config | Right editor */}
      <div className="flex-1 overflow-hidden grid grid-cols-2 gap-0">

        {/* LEFT: Config */}
        <div className="overflow-y-auto border-r border-gray-200 p-4 space-y-3 bg-white">

          {/* Settings */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-semibold text-gray-800">Autopilot Mode</span>
                <p className="text-xs text-gray-500">Auto-send every week</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={config.enabled}
                  onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                  className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From Name</label>
                <input type="text" value={config.from_name} onChange={e => setConfig({ ...config, from_name: e.target.value })}
                  placeholder="Business Name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From Email</label>
                <input type="email" value={config.from_email} onChange={e => setConfig({ ...config, from_email: e.target.value })}
                  placeholder="hello@business.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            {/* SendGrid email verification status */}
            <div className="mb-3">
              {sgStatus === 'verified' ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 text-xs font-semibold">Email verified</span>
                  <span className="text-xs text-green-500 ml-auto">Campaigns will send from your business email</span>
                </div>
              ) : sgStatus === 'pending' ? (
                <button onClick={handleCheckSgStatus} disabled={sgLoading} className="w-full flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-semibold hover:bg-amber-100 transition disabled:opacity-50">
                  <Mail className="w-4 h-4" />
                  <span>{sgLoading ? 'Checking...' : 'Verification pending — click to re-check'}</span>
                </button>
              ) : sgStatus !== 'unconfigured' && sgStatus !== 'loading' ? (
                <button onClick={handleSendGridVerify} disabled={sgLoading} className="w-full flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs font-semibold hover:bg-blue-100 transition disabled:opacity-50">
                  <Mail className="w-4 h-4" />
                  <span>{sgLoading ? 'Sending...' : 'Verify your email to send campaigns from your address'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-xs">{sgStatus === 'loading' ? 'Loading...' : 'Email verification not available'}</span>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">Verify your email so campaigns are sent from your business address instead of a generic sender. This improves deliverability and trust.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Send Day</label>
                <select value={config.send_day} onChange={e => setConfig({ ...config, send_day: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Time (UTC)</label>
                <select value={config.send_hour} onChange={e => setConfig({ ...config, send_hour: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </div>
            </div>
            <button onClick={save} disabled={saving}
              className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 transition-all">
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>

          {/* Tone — horizontal pills */}
          <div className="border border-gray-200 rounded-xl p-4">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Email Tone</label>
            <div className="flex gap-2">
              {TONES.map(t => (
                <button key={t.value} onClick={() => setConfig({ ...config, tone: t.value })}
                  className={`flex-1 py-2 rounded-lg border-2 text-center transition-all ${config.tone === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className={`text-sm font-semibold ${config.tone === t.value ? 'text-blue-700' : 'text-gray-700'}`}>{t.label}</p>
                  <p className="text-xs text-gray-400 leading-tight hidden sm:block">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Focus — 2×2 grid */}
          <div className="border border-gray-200 rounded-xl p-4">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Campaign Focus</label>
            <div className="grid grid-cols-2 gap-2">
              {FOCUSES.map(f => (
                <button key={f.value} onClick={() => setConfig({ ...config, focus: f.value })}
                  className={`px-3 py-2.5 rounded-lg border-2 text-left transition-all ${config.focus === f.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className={`text-sm font-semibold leading-tight ${config.focus === f.value ? 'text-purple-700' : 'text-gray-800'}`}>{f.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Offer details */}
          <div className="border border-purple-200 bg-purple-50 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <p className="text-sm font-semibold text-purple-700">Tailor this campaign</p>
            </div>
            {[
              { key: 'offer', label: prompts[0], placeholder: 'e.g. 20% off spring deep clean', type: 'text' },
              { key: 'message', label: prompts[1], placeholder: 'e.g. Spring refresh — your home deserves it', type: 'text' },
              { key: 'emotion', label: prompts[2], placeholder: 'e.g. Excitement and FOMO', type: 'text' },
              { key: 'ctaLink', label: 'CTA link URL', placeholder: 'https://yourbusiness.com/book', type: 'url' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input type={type} value={offerDetails[key]}
                  onChange={e => setOfferDetails({ ...offerDetails, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none" />
              </div>
            ))}
          </div>

          {/* Generate button */}
          <button onClick={generatePreview} disabled={previewing}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-base hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all">
            {previewing ? <><Loader className="w-5 h-5 animate-spin" /> Generating…</> : <><Sparkles className="w-5 h-5" /> Generate</>}
          </button>

          {/* Drafts */}
          {drafts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Drafts
                <span className="bg-gray-200 text-gray-600 rounded-full px-1.5 text-[10px]">{drafts.length}</span>
              </p>
              <div className="space-y-1.5">
                {drafts.map(d => (
                  <div key={d.id} className={`flex items-center gap-2 border rounded-lg px-3 py-2 transition-all cursor-pointer ${d.id === currentDraftId ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div className="flex-1 min-w-0" onClick={() => loadDraft(d)}>
                      <p className="text-sm font-medium text-gray-800 truncate">{d.subject || 'Untitled'}</p>
                      <p className="text-xs text-gray-400">{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <button onClick={() => deleteDraft(d.id)} className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Editor */}
        <div className="flex flex-col overflow-hidden bg-gray-50">
          {hasPreview ? (
            <>
              {/* Action bar */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200 flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">{editedSubject || 'Untitled'}</p>
                </div>
                <button onClick={saveDraft} disabled={savingDraft || !currentDraftId}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all">
                  {savingDraft ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  Save Draft
                </button>
                <button onClick={testSend} disabled={testSending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-300 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-all">
                  {testSending ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
                  Test Send
                </button>
                <button onClick={sendNow} disabled={sendingNow}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all">
                  {sendingNow ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {sendingNow ? 'Sending…' : 'Send to All'}
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <EmailBlockEditor
                  blocks={editedBlocks}
                  onChange={setEditedBlocks}
                  subject={editedSubject}
                  previewText={editedPreviewText}
                  onSubjectChange={setEditedSubject}
                  onPreviewTextChange={setEditedPreviewText}
                  fromName={config.from_name}
                  fromEmail={config.from_email}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
              {previewing ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
                    <Loader className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                  <p className="font-semibold text-gray-700">Generating your campaign…</p>
                  <p className="text-sm text-gray-400">AI is crafting your email.</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                    <Mail className="w-8 h-8 text-blue-300" />
                  </div>
                  <p className="font-semibold text-gray-700">Email editor appears here</p>
                  <p className="text-sm text-gray-400 mt-1 max-w-xs">Fill in your offer details on the left, then click Generate.</p>
                  <div className="mt-6 flex gap-6 text-center">
                    {[['🎨', 'Visual blocks'], ['✏️', 'Inline editing'], ['🔀', 'Drag & drop']].map(([icon, label]) => (
                      <div key={label} className="text-xs text-gray-300">
                        <div className="text-2xl mb-1">{icon}</div>{label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
