import { useState, useEffect } from 'react';
import { Copy, Check, Code, MessageCircle, Calendar, Mail, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export default function EmbedCode({ apiUrl, authFetch }) {
  const [siteKey, setSiteKey] = useState('');
  const [settings, setSettings] = useState({
    chatEnabled: false,
    bookingEnabled: false,
    bookingStyle: 'chat',
    leadFormEnabled: false,
    leadFormTitle: 'Get a Free Quote',
    leadFormFields: ['name', 'email', 'phone', 'message'],
    bookingButtonText: 'Book Online',
    themeColor: '#d97706',
    position: 'bottom-right'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [keyRes, settingsRes] = await Promise.all([
        authFetch(`${apiUrl}/api/embed/site-key`),
        authFetch(`${apiUrl}/api/embed/settings`)
      ]);
      const keyData = await keyRes.json();
      const settingsData = await settingsRes.json();

      setSiteKey(keyData.siteKey || '');
      if (settingsData.settings) {
        const s = settingsData.settings;
        setSettings({
          chatEnabled: s.chat_enabled || false,
          bookingEnabled: s.booking_enabled || false,
          bookingStyle: s.booking_style || 'chat',
          leadFormEnabled: s.lead_form_enabled || false,
          leadFormTitle: s.lead_form_title || 'Get a Free Quote',
          leadFormFields: s.lead_form_fields || ['name', 'email', 'phone', 'message'],
          bookingButtonText: s.booking_button_text || 'Book Online',
          themeColor: s.theme_color || '#d97706',
          position: s.position || 'bottom-right'
        });
      }
    } catch (err) {
      console.error('Failed to load embed settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`${apiUrl}/api/embed/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const embedCode = `<script src="${apiUrl}/embed.js" data-site-key="${siteKey}" async></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleField = (field) => {
    const fields = [...settings.leadFormFields];
    const idx = fields.indexOf(field);
    if (idx >= 0) fields.splice(idx, 1);
    else fields.push(field);
    setSettings({ ...settings, leadFormFields: fields });
  };

  const enabledCount = [settings.chatEnabled, settings.bookingEnabled, settings.leadFormEnabled].filter(Boolean).length;

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
            <Code className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Embed SORCE on Your Website</h3>
            <p className="text-sm text-gray-600">Add chat, booking, and lead capture to any website with one line of code</p>
          </div>
        </div>
      </div>

      {/* Embed Code Block */}
      <div className="bg-gray-900 rounded-xl p-5 relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 font-mono">Your Embed Code</span>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition"
          >
            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Code</>}
          </button>
        </div>
        <code className="text-green-400 text-sm font-mono break-all leading-relaxed">
          {embedCode}
        </code>
        {enabledCount === 0 && (
          <p className="text-yellow-400 text-xs mt-3">Enable at least one widget below, then save to activate the embed.</p>
        )}
      </div>

      {/* Widget Toggles */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {/* Chat Agent */}
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">AI Chat Agent</h4>
                <p className="text-sm text-gray-500">Chat bubble that handles customer questions and captures leads</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.chatEnabled}
                onChange={e => setSettings({ ...settings, chatEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-checked:bg-amber-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
          {settings.chatEnabled && (
            <p className="text-xs text-gray-400 mt-2 ml-12">Configure your agent in the AI Agents tab for full customization.</p>
          )}
        </div>

        {/* Book Online */}
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Book Online</h4>
                <p className="text-sm text-gray-500">Let customers book appointments directly from your website</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.bookingEnabled}
                onChange={e => setSettings({ ...settings, bookingEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-checked:bg-green-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
          {settings.bookingEnabled && (
            <div className="mt-4 ml-12 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Booking Style</label>
                <div className="flex gap-3">
                  <label className={`flex-1 p-3 border-2 rounded-lg cursor-pointer text-center text-sm font-medium transition ${settings.bookingStyle === 'chat' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <input type="radio" name="bookingStyle" value="chat" checked={settings.bookingStyle === 'chat'} onChange={() => setSettings({ ...settings, bookingStyle: 'chat' })} className="sr-only" />
                    Chat-Based
                  </label>
                  <label className={`flex-1 p-3 border-2 rounded-lg cursor-pointer text-center text-sm font-medium transition ${settings.bookingStyle === 'form' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <input type="radio" name="bookingStyle" value="form" checked={settings.bookingStyle === 'form'} onChange={() => setSettings({ ...settings, bookingStyle: 'form' })} className="sr-only" />
                    Booking Form
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {settings.bookingStyle === 'chat'
                    ? 'The AI chat agent will guide customers through booking conversationally.'
                    : 'A form with service picker, date/time selector, and contact fields.'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                <input
                  type="text"
                  value={settings.bookingButtonText}
                  onChange={e => setSettings({ ...settings, bookingButtonText: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-green-500 focus:outline-none"
                  placeholder="Book Online"
                />
              </div>
            </div>
          )}
        </div>

        {/* Lead Form */}
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Lead Capture Form</h4>
                <p className="text-sm text-gray-500">Contact form that creates leads in your dashboard</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.leadFormEnabled}
                onChange={e => setSettings({ ...settings, leadFormEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-checked:bg-blue-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
          {settings.leadFormEnabled && (
            <div className="mt-4 ml-12 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Form Title</label>
                <input
                  type="text"
                  value={settings.leadFormTitle}
                  onChange={e => setSettings({ ...settings, leadFormTitle: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Get a Free Quote"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Form Fields</label>
                <div className="flex flex-wrap gap-2">
                  {['name', 'email', 'phone', 'service', 'message'].map(field => (
                    <button
                      key={field}
                      onClick={() => toggleField(field)}
                      disabled={field === 'name' || field === 'email'}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        settings.leadFormFields.includes(field)
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      } ${(field === 'name' || field === 'email') ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                      {(field === 'name' || field === 'email') && ' *'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">Name and email are always required.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Theme & Position */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h4 className="font-semibold text-gray-900 mb-4">Appearance</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.themeColor}
                onChange={e => setSettings({ ...settings, themeColor: e.target.value })}
                className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={settings.themeColor}
                onChange={e => setSettings({ ...settings, themeColor: e.target.value })}
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Widget Position</label>
            <select
              value={settings.position}
              onChange={e => setSettings({ ...settings, position: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Embed Settings'}
        </button>
        {saveSuccess && (
          <span className="text-green-600 font-medium flex items-center gap-1">
            <Check className="w-4 h-4" /> Settings saved!
          </span>
        )}
      </div>

      {/* Setup Guide */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition"
        >
          <div>
            <h4 className="font-semibold text-gray-900">Platform Setup Guide</h4>
            <p className="text-sm text-gray-500">How to add the embed code to your website platform</p>
          </div>
          {showGuide ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        {showGuide && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
            <div>
              <h5 className="font-semibold text-gray-800 mb-1">Wix</h5>
              <p className="text-sm text-gray-600">Settings &rarr; Custom Code &rarr; Add Code &rarr; Paste the embed code &rarr; Set to load on all pages in the Body (end) section.</p>
            </div>
            <div>
              <h5 className="font-semibold text-gray-800 mb-1">Squarespace</h5>
              <p className="text-sm text-gray-600">Settings &rarr; Developer Tools &rarr; Code Injection &rarr; Paste in the Footer section.</p>
            </div>
            <div>
              <h5 className="font-semibold text-gray-800 mb-1">WordPress</h5>
              <p className="text-sm text-gray-600">Install the "Insert Headers and Footers" plugin &rarr; Settings &rarr; Paste in the Footer Scripts section. Or add directly to your theme's footer.php.</p>
            </div>
            <div>
              <h5 className="font-semibold text-gray-800 mb-1">Shopify</h5>
              <p className="text-sm text-gray-600">Online Store &rarr; Themes &rarr; Edit Code &rarr; Open theme.liquid &rarr; Paste before the closing &lt;/body&gt; tag.</p>
            </div>
            <div>
              <h5 className="font-semibold text-gray-800 mb-1">Any HTML Site</h5>
              <p className="text-sm text-gray-600">Paste the embed code just before the closing &lt;/body&gt; tag in your HTML file.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
