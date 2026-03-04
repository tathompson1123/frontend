import { useState, useEffect, useRef } from 'react';
import { Mail, Send, Eye, Calendar, Clock, Users, CheckCircle, AlertCircle, Loader, Sparkles, BookmarkPlus, ChevronDown, Trash2, BookOpen } from 'lucide-react';
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

function OfferDetailsPanel({ focus, offerDetails, onChange }) {
  const prompts = OFFER_PROMPTS[focus] || OFFER_PROMPTS.seasonal;
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <p className="text-xs font-semibold text-purple-700">Tailor this campaign</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{prompts[0]}</label>
        <input
          type="text"
          value={offerDetails.offer}
          onChange={e => onChange({ ...offerDetails, offer: e.target.value })}
          placeholder="e.g. 20% off spring deep clean"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{prompts[1]}</label>
        <input
          type="text"
          value={offerDetails.message}
          onChange={e => onChange({ ...offerDetails, message: e.target.value })}
          placeholder="e.g. Spring refresh — your home deserves it"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{prompts[2]}</label>
        <input
          type="text"
          value={offerDetails.emotion}
          onChange={e => onChange({ ...offerDetails, emotion: e.target.value })}
          placeholder="e.g. Excitement and FOMO"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">CTA link URL <span className="text-gray-400 font-normal">(where the button goes)</span></label>
        <input
          type="url"
          value={offerDetails.ctaLink}
          onChange={e => onChange({ ...offerDetails, ctaLink: e.target.value })}
          placeholder="https://yourbusiness.com/book"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
        />
      </div>
    </div>
  );
}

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
        {/* Load preset dropdown */}
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

        {/* Save current as preset */}
        <button
          onClick={() => { setShowSaveForm(!showSaveForm); setOpen(false); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
        >
          <BookmarkPlus className="w-4 h-4 text-gray-400" />
          Save
        </button>
      </div>

      {/* Dropdown: saved presets list */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
          {presets.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400 text-center">No saved presets yet</p>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {presets.map(p => (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                  <button
                    onClick={() => { onLoad(p); setOpen(false); }}
                    className="flex-1 text-left text-sm font-medium text-gray-800 hover:text-blue-600"
                  >
                    {p.name}
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </button>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save form */}
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
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);
  // preview shape: { subject, previewText, blocks, bodyHtml, bodyText }
  const [preview, setPreview] = useState(null);
  const [editedBlocks, setEditedBlocks] = useState([]);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedPreviewText, setEditedPreviewText] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    Promise.all([
      authFetch(`${apiUrl}/api/email-campaigns/config`).then(r => r.json()),
      authFetch(`${apiUrl}/api/email-campaigns/history`).then(r => r.json()),
      authFetch(`${apiUrl}/api/email-campaigns/presets`).then(r => r.json()),
    ]).then(([configData, histData, presetsData]) => {
      if (configData.config) setConfig(prev => ({ ...prev, ...configData.config }));
      if (histData.campaigns) setHistory(histData.campaigns);
      if (presetsData.presets) setPresets(presetsData.presets);
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
    if (r.ok) {
      setPresets(prev => prev.filter(p => p.id !== id));
    } else {
      showToast('Failed to delete preset', 'error');
    }
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
    setPreview(null);
    setEditedBlocks([]);
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerDetails }),
      });
      const data = await r.json();
      if (data.campaign) {
        setPreview(data.campaign);
        setEditedBlocks(data.campaign.blocks || []);
        setEditedSubject(data.campaign.subject);
        setEditedPreviewText(data.campaign.previewText);
      } else {
        showToast(data.error || 'Failed to generate preview', 'error');
      }
    } finally {
      setPreviewing(false);
    }
  };

  const sendNow = async () => {
    if (!config.from_email) {
      showToast('Set your From Email before sending', 'error');
      return;
    }
    if (!confirm('This will send the email to all your past customers right now. Continue?')) return;
    setSendingNow(true);
    try {
      const bodyHtml = editedBlocks.length ? emailBlocksToHtml(editedBlocks) : (preview?.bodyHtml || '');
      const body = preview
        ? { usePreview: { subject: editedSubject, previewText: editedPreviewText, bodyHtml, bodyText: preview.bodyText } }
        : {};
      const r = await authFetch(`${apiUrl}/api/email-campaigns/send-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (data.success) {
        showToast(`Sent to ${data.sent} customers — "${data.subject}"`);
        const h = await authFetch(`${apiUrl}/api/email-campaigns/history`).then(r => r.json());
        if (h.campaigns) setHistory(h.campaigns);
        setPreview(null);
        setEditedBlocks([]);
      } else {
        showToast(data.error || 'Send failed', 'error');
      }
    } finally {
      setSendingNow(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Email Marketing</h2>
            <p className="text-blue-100 text-sm">AI generates irresistible weekly offers, sent automatically to past customers</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-blue-100">
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{history.length > 0 ? `${history[0]?.recipient_count || 0} sent last campaign` : 'No campaigns yet'}</span>
          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Runs every {config.send_day}</span>
        </div>
      </div>

      {/* Main: Build (left half) | Editor (right half) — one window view */}
      <div className="grid lg:grid-cols-2 gap-6" style={{ minHeight: '85vh' }}>

        {/* LEFT HALF: Build the campaign */}
        <div className="flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '85vh' }}>

          {/* Presets */}
          <CampaignPresets
            presets={presets}
            onLoad={loadPreset}
            onDelete={deletePreset}
            onSave={savePreset}
            currentConfig={config}
            currentOfferDetails={offerDetails}
          />

          {/* Autopilot + From (compact row) */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Autopilot Mode</h3>
                <p className="text-xs text-gray-500">Auto-send every week</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={config.enabled}
                  onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                  className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Name</label>
                <input type="text" value={config.from_name} onChange={e => setConfig({ ...config, from_name: e.target.value })}
                  placeholder="Your Business Name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Email</label>
                <input type="email" value={config.from_email} onChange={e => setConfig({ ...config, from_email: e.target.value })}
                  placeholder="hello@yourbusiness.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" /> Send Day
                </label>
                <select value={config.send_day} onChange={e => setConfig({ ...config, send_day: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" /> Time (UTC)
                </label>
                <select value={config.send_hour} onChange={e => setConfig({ ...config, send_hour: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Tone + Focus side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Email Tone</label>
              <div className="space-y-1.5">
                {TONES.map(t => (
                  <button key={t.value} onClick={() => setConfig({ ...config, tone: t.value })}
                    className={`w-full p-2 rounded-lg border-2 text-left transition-all ${config.tone === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className={`text-xs font-semibold ${config.tone === t.value ? 'text-blue-700' : 'text-gray-800'}`}>{t.label}</p>
                    <p className="text-[10px] text-gray-500 leading-tight">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Campaign Focus</label>
              <div className="space-y-1.5">
                {FOCUSES.map(f => (
                  <button key={f.value} onClick={() => setConfig({ ...config, focus: f.value })}
                    className={`w-full p-2 rounded-lg border-2 text-left transition-all ${config.focus === f.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className={`text-xs font-semibold ${config.focus === f.value ? 'text-purple-700' : 'text-gray-800'}`}>{f.label}</p>
                    <p className="text-[10px] text-gray-500 leading-tight">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Offer Details */}
          <OfferDetailsPanel
            focus={config.focus}
            offerDetails={offerDetails}
            onChange={setOfferDetails}
          />

          {/* Generate & Send */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 disabled:opacity-60 transition-all text-center">
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
              <button onClick={generatePreview} disabled={previewing}
                className="flex-1 py-2.5 border-2 border-blue-500 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 disabled:opacity-60 flex items-center justify-center gap-1.5">
                {previewing ? <Loader className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                {previewing ? 'Generating…' : 'Generate'}
              </button>
            </div>
            <button onClick={sendNow} disabled={sendingNow}
              className="w-full py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {sendingNow ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sendingNow ? 'Sending…' : preview ? 'Send This Email to All Customers' : 'Send Now to All Customers'}
            </button>
          </div>
        </div>

        {/* RIGHT HALF: Email Block Editor */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col" style={{ minHeight: '85vh' }}>
          {preview ? (
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
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
              {previewing ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
                    <Loader className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                  <p className="font-semibold text-gray-700">Generating your campaign…</p>
                  <p className="text-sm text-gray-400 max-w-xs">AI is crafting your email with the offer details you provided.</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                    <Mail className="w-8 h-8 text-blue-300" />
                  </div>
                  <p className="font-semibold text-gray-700">Email editor appears here</p>
                  <p className="text-sm text-gray-400 mt-1 max-w-xs">Fill in your offer details on the left, then click Generate to build your email.</p>
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    {[['🎨', 'Visual blocks'], ['✏️', 'Inline editing'], ['🔀', 'Drag & drop']].map(([icon, label]) => (
                      <div key={label} className="text-xs text-gray-300">
                        <div className="text-2xl mb-1">{icon}</div>
                        {label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Campaign History */}
      {history.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Campaign History</h3>
          <div className="space-y-2">
            {history.map(c => (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === 'sent' ? 'bg-green-500' : c.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.subject}</p>
                  <p className="text-xs text-gray-400">
                    {c.sent_at ? new Date(c.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                    {c.recipient_count > 0 && ` · ${c.recipient_count} recipients`}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.status === 'sent' ? 'bg-green-100 text-green-700' : c.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
