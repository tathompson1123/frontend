import { useState, useEffect, useRef } from 'react';
import { Mail, Send, Eye, Calendar, Clock, Users, CheckCircle, AlertCircle, Loader, Edit3, X, Monitor, Smartphone, Code } from 'lucide-react';

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

function EmailClientMock({ fromName, fromEmail, subject, previewText, bodyHtml, editingPreview, editedBodyHtml, onBodyChange, onSubjectChange, onPreviewTextChange, editedSubject, editedPreviewText }) {
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [showSource, setShowSource] = useState(false);
  const iframeRef = useRef(null);
  const mobileIframeRef = useRef(null);

  const initials = (fromName || 'YB').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarColor = '#4f46e5';

  const resizeIframe = (ref) => {
    if (!ref.current) return;
    try {
      const doc = ref.current.contentDocument || ref.current.contentWindow?.document;
      if (doc && doc.body) {
        ref.current.style.height = (doc.body.scrollHeight + 32) + 'px';
      }
    } catch (e) {}
  };

  const htmlToRender = editingPreview ? editedBodyHtml : bodyHtml;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-1 bg-gray-200 rounded-lg p-0.5">
          <button
            onClick={() => { setViewMode('desktop'); setShowSource(false); }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'desktop' && !showSource ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Monitor className="w-3 h-3" /> Desktop
          </button>
          <button
            onClick={() => { setViewMode('mobile'); setShowSource(false); }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'mobile' && !showSource ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Smartphone className="w-3 h-3" /> Mobile
          </button>
          <button
            onClick={() => setShowSource(!showSource)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${showSource ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Code className="w-3 h-3" /> HTML
          </button>
        </div>
        <span className="text-xs text-gray-400 font-medium">Preview</span>
      </div>

      {showSource ? (
        /* HTML Source Editor */
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 flex-shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-gray-400 text-xs ml-2">email.html — Edit HTML</span>
          </div>
          <div className="flex-1 bg-gray-900 p-1">
            <textarea
              value={editedBodyHtml}
              onChange={e => onBodyChange(e.target.value)}
              className="w-full h-full min-h-72 p-4 text-xs font-mono bg-gray-900 text-green-300 border-0 focus:outline-none resize-none leading-relaxed"
              placeholder="Email HTML body…"
              rows={24}
              spellCheck={false}
            />
          </div>
        </div>
      ) : (
        /* Email Client View */
        <div className="flex-1 overflow-y-auto bg-gray-100" style={{ minHeight: 0 }}>
          <div className={`mx-auto ${viewMode === 'mobile' ? 'py-6 flex justify-center' : 'py-4 px-4'}`}>
            {viewMode === 'desktop' ? (
              /* Desktop email client chrome */
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 max-w-[640px] mx-auto">
                {/* Email client top bar */}
                <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: avatarColor }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-semibold text-sm text-gray-900">{fromName || 'Your Business'}</span>
                          {fromEmail && <span className="text-xs text-gray-400 ml-1.5">&lt;{fromEmail}&gt;</span>}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">Just now</span>
                      </div>
                      {/* Subject as editable or display */}
                      {editingPreview ? (
                        <div className="mt-1.5 space-y-1">
                          <input
                            type="text"
                            value={editedSubject}
                            onChange={e => onSubjectChange(e.target.value)}
                            className="w-full text-sm font-semibold border border-blue-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-blue-50"
                            placeholder="Subject line"
                          />
                          <input
                            type="text"
                            value={editedPreviewText}
                            onChange={e => onPreviewTextChange(e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-blue-400 focus:outline-none text-gray-500"
                            placeholder="Preview text (shown in inbox)"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">{subject}</p>
                          {previewText && <p className="text-xs text-gray-400 mt-0.5 truncate">{previewText}</p>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {/* Email body rendered in iframe */}
                <div className="bg-white overflow-hidden">
                  <iframe
                    ref={iframeRef}
                    srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{margin:0;padding:0;background:#ffffff}</style></head><body>${htmlToRender}</body></html>`}
                    title="Email Preview Desktop"
                    sandbox="allow-same-origin"
                    style={{ width: '100%', border: 'none', display: 'block', minHeight: '200px' }}
                    scrolling="no"
                    onLoad={() => resizeIframe(iframeRef)}
                  />
                </div>
              </div>
            ) : (
              /* Mobile phone frame */
              <div className="relative" style={{ width: 320 }}>
                <div className="bg-gray-900 rounded-[44px] p-3 shadow-2xl ring-1 ring-black/20">
                  {/* Notch */}
                  <div className="bg-gray-900 h-6 flex items-center justify-center mb-1 relative">
                    <div className="w-20 h-4 bg-black rounded-full absolute top-1" />
                    <div className="flex items-center justify-between w-full px-5 absolute">
                      <span className="text-white text-[10px] font-semibold">9:41</span>
                      <div className="flex gap-1 items-center">
                        <div className="w-3 h-2 border border-white rounded-sm opacity-70" />
                        <div className="w-1 h-1.5 bg-white rounded-sm opacity-70" />
                      </div>
                    </div>
                  </div>
                  {/* Phone screen */}
                  <div className="bg-white rounded-[28px] overflow-hidden" style={{ height: 580 }}>
                    {/* Mail app top bar */}
                    <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                          style={{ background: avatarColor }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[11px] text-gray-900 leading-tight">{fromName || 'Your Business'}</p>
                          <p className="text-[10px] text-gray-800 font-medium truncate leading-tight mt-0.5">{subject}</p>
                          <p className="text-[10px] text-gray-400 truncate leading-tight">{previewText}</p>
                        </div>
                      </div>
                    </div>
                    {/* Mobile email body iframe */}
                    <div style={{ height: 'calc(100% - 64px)', overflow: 'auto' }}>
                      <iframe
                        ref={mobileIframeRef}
                        srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;background:#ffffff}</style></head><body>${htmlToRender}</body></html>`}
                        title="Email Preview Mobile"
                        sandbox="allow-same-origin"
                        style={{ width: '100%', border: 'none', display: 'block', minHeight: '400px' }}
                        scrolling="no"
                        onLoad={() => resizeIframe(mobileIframeRef)}
                      />
                    </div>
                  </div>
                  {/* Home bar */}
                  <div className="flex justify-center py-2">
                    <div className="w-24 h-1 bg-gray-600 rounded-full" />
                  </div>
                </div>
              </div>
            )}
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
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);
  const [preview, setPreview] = useState(null);
  const [editingPreview, setEditingPreview] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedPreviewText, setEditedPreviewText] = useState('');
  const [editedBodyHtml, setEditedBodyHtml] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    Promise.all([
      authFetch(`${apiUrl}/api/email-campaigns/config`).then(r => r.json()),
      authFetch(`${apiUrl}/api/email-campaigns/history`).then(r => r.json()),
    ]).then(([configData, histData]) => {
      if (configData.config) setConfig(prev => ({ ...prev, ...configData.config }));
      if (histData.campaigns) setHistory(histData.campaigns);
    }).finally(() => setLoading(false));
  }, []);

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
    setEditingPreview(false);
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/preview`, { method: 'POST' });
      const data = await r.json();
      if (data.campaign) {
        setPreview(data.campaign);
        setEditedSubject(data.campaign.subject);
        setEditedPreviewText(data.campaign.previewText);
        setEditedBodyHtml(data.campaign.bodyHtml);
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
      const body = preview
        ? { usePreview: { subject: editedSubject, previewText: editedPreviewText, bodyHtml: editedBodyHtml, bodyText: preview.bodyText } }
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

      {/* Main split: Settings left, Preview right */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* LEFT: Settings */}
        <div className="space-y-4">
          {/* Autopilot toggle */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Autopilot Mode</h3>
                <p className="text-sm text-gray-500">Automatically send a campaign every week</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          </div>

          {/* Settings form */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Campaign Settings</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" /> Send Day
                </label>
                <select value={config.send_day} onChange={e => setConfig({ ...config, send_day: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" /> Time (UTC)
                </label>
                <select value={config.send_hour} onChange={e => setConfig({ ...config, send_hour: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Name</label>
                <input type="text" value={config.from_name} onChange={e => setConfig({ ...config, from_name: e.target.value })}
                  placeholder="Your Business Name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Email</label>
                <input type="email" value={config.from_email} onChange={e => setConfig({ ...config, from_email: e.target.value })}
                  placeholder="hello@yourbusiness.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <p className="text-xs text-gray-400 mt-0.5">Must be verified in SendGrid</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email Tone</label>
              <div className="grid grid-cols-3 gap-2">
                {TONES.map(t => (
                  <button key={t.value} onClick={() => setConfig({ ...config, tone: t.value })}
                    className={`p-2.5 rounded-lg border-2 text-left transition-all ${config.tone === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className={`text-xs font-semibold ${config.tone === t.value ? 'text-blue-700' : 'text-gray-800'}`}>{t.label}</p>
                    <p className="text-xs text-gray-500 leading-tight">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Campaign Focus</label>
              <div className="grid grid-cols-2 gap-2">
                {FOCUSES.map(f => (
                  <button key={f.value} onClick={() => setConfig({ ...config, focus: f.value })}
                    className={`p-2.5 rounded-lg border-2 text-left transition-all ${config.focus === f.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className={`text-xs font-semibold ${config.focus === f.value ? 'text-purple-700' : 'text-gray-800'}`}>{f.label}</p>
                    <p className="text-xs text-gray-500 leading-tight">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={save} disabled={saving}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 transition-all">
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>

          {/* Generate & Send */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Generate & Send</h3>
            <button onClick={generatePreview} disabled={previewing}
              className="w-full py-2.5 border-2 border-blue-500 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 disabled:opacity-60 flex items-center justify-center gap-2">
              {previewing ? <Loader className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              {previewing ? 'Generating…' : 'Generate Email Preview'}
            </button>
            {preview && (
              <button
                onClick={() => setEditingPreview(!editingPreview)}
                className={`w-full py-2.5 border-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${editingPreview ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                <Edit3 className="w-4 h-4" />
                {editingPreview ? 'Stop Editing' : 'Edit Email'}
              </button>
            )}
            <button onClick={sendNow} disabled={sendingNow}
              className="w-full py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {sendingNow ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sendingNow ? 'Sending…' : preview ? 'Send This Email to All Customers' : 'Send Now to All Customers'}
            </button>
          </div>
        </div>

        {/* RIGHT: Preview Panel */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ minHeight: '560px' }}>
          {preview ? (
            <div className="flex flex-col" style={{ minHeight: '560px' }}>
              <EmailClientMock
                fromName={config.from_name}
                fromEmail={config.from_email}
                subject={editedSubject}
                previewText={editedPreviewText}
                bodyHtml={preview.bodyHtml}
                editingPreview={editingPreview}
                editedBodyHtml={editedBodyHtml}
                editedSubject={editedSubject}
                editedPreviewText={editedPreviewText}
                onBodyChange={setEditedBodyHtml}
                onSubjectChange={setEditedSubject}
                onPreviewTextChange={setEditedPreviewText}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center" style={{ minHeight: '560px' }}>
              {previewing ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
                    <Loader className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                  <p className="font-semibold text-gray-700">Generating your campaign…</p>
                  <p className="text-sm text-gray-400 max-w-xs">AI is writing a high-converting email with hero image, offer, and urgency.</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                    <Mail className="w-8 h-8 text-blue-300" />
                  </div>
                  <p className="font-semibold text-gray-700">Email preview will appear here</p>
                  <p className="text-sm text-gray-400 mt-1 max-w-xs">Click "Generate Email Preview" to see your AI-generated campaign. Preview it on desktop or mobile, edit if needed, then send.</p>
                  <div className="mt-6 flex items-center gap-6 text-xs text-gray-300">
                    <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> Desktop view</span>
                    <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> Mobile view</span>
                    <span className="flex items-center gap-1"><Code className="w-3 h-3" /> HTML editor</span>
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
