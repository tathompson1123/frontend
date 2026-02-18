import { useState, useEffect } from 'react';
import { Mail, Send, Eye, Calendar, Clock, Users, CheckCircle, AlertCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [showPreviewHtml, setShowPreviewHtml] = useState(false);
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
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/preview`, { method: 'POST' });
      const data = await r.json();
      if (data.campaign) setPreview(data.campaign);
      else showToast(data.error || 'Failed to generate preview', 'error');
    } finally {
      setPreviewing(false);
    }
  };

  const sendNow = async () => {
    if (!config.from_email) {
      showToast('Set your From Email before sending', 'error');
      return;
    }
    if (!confirm('This will send the AI-generated email to all your past customers right now. Continue?')) return;
    setSendingNow(true);
    try {
      const r = await authFetch(`${apiUrl}/api/email-campaigns/send-now`, { method: 'POST' });
      const data = await r.json();
      if (data.success) {
        showToast(`✅ Sent to ${data.sent} customers — "${data.subject}"`);
        // Refresh history
        const h = await authFetch(`${apiUrl}/api/email-campaigns/history`).then(r => r.json());
        if (h.campaigns) setHistory(h.campaigns);
      } else {
        showToast(data.error || 'Send failed', 'error');
      }
    } finally {
      setSendingNow(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
            <p className="text-blue-100 text-sm">Claude generates irresistible weekly offers, sent automatically to past customers</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-blue-100">
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{history.length > 0 ? `${history[0]?.recipient_count || 0} sent last campaign` : 'No campaigns yet'}</span>
          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Runs every {config.send_day}</span>
        </div>
      </div>

      {/* Enable toggle */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Autopilot Mode</h3>
            <p className="text-sm text-gray-500">Automatically generate and send a campaign every week</p>
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

      {/* Config */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
        <h3 className="font-semibold text-gray-900">Campaign Settings</h3>

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" /> Send Day
            </label>
            <select
              value={config.send_day}
              onChange={e => setConfig({ ...config, send_day: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" /> Send Time (UTC)
            </label>
            <select
              value={config.send_hour}
              onChange={e => setConfig({ ...config, send_hour: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
        </div>

        {/* Sender */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">From Name</label>
            <input
              type="text"
              value={config.from_name}
              onChange={e => setConfig({ ...config, from_name: e.target.value })}
              placeholder="Your Business Name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">From Email</label>
            <input
              type="email"
              value={config.from_email}
              onChange={e => setConfig({ ...config, from_email: e.target.value })}
              placeholder="hello@yourbusiness.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Must be verified in SendGrid</p>
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Tone</label>
          <div className="grid grid-cols-3 gap-2">
            {TONES.map(t => (
              <button
                key={t.value}
                onClick={() => setConfig({ ...config, tone: t.value })}
                className={`p-3 rounded-lg border-2 text-left transition-all ${config.tone === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <p className={`text-sm font-semibold ${config.tone === t.value ? 'text-blue-700' : 'text-gray-800'}`}>{t.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Focus */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Focus</label>
          <div className="grid grid-cols-2 gap-2">
            {FOCUSES.map(f => (
              <button
                key={f.value}
                onClick={() => setConfig({ ...config, focus: f.value })}
                className={`p-3 rounded-lg border-2 text-left transition-all ${config.focus === f.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <p className={`text-sm font-semibold ${config.focus === f.value ? 'text-purple-700' : 'text-gray-800'}`}>{f.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 transition-all"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {/* Preview + Send Now */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">Test Your Campaign</h3>
        <div className="flex gap-3">
          <button
            onClick={generatePreview}
            disabled={previewing}
            className="flex-1 py-2.5 border-2 border-blue-500 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {previewing ? <Loader className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            {previewing ? 'Generating…' : 'Preview This Week\'s Email'}
          </button>
          <button
            onClick={sendNow}
            disabled={sendingNow}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {sendingNow ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sendingNow ? 'Sending…' : 'Send Now to All Customers'}
          </button>
        </div>

        {preview && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">SUBJECT LINE</p>
                <p className="font-semibold text-gray-900">{preview.subject}</p>
                <p className="text-xs text-gray-400 mt-0.5">{preview.previewText}</p>
              </div>
              <button
                onClick={() => setShowPreviewHtml(!showPreviewHtml)}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                {showPreviewHtml ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showPreviewHtml ? 'Hide' : 'Preview'}
              </button>
            </div>
            {showPreviewHtml && (
              <div
                className="p-4 text-sm max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: preview.bodyHtml }}
              />
            )}
          </div>
        )}
      </div>

      {/* History */}
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
