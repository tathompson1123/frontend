import { useState, useEffect } from 'react';
import { Copy, Check, Code, MessageCircle, Calendar, Mail, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, Eye, Plus, X, FileText } from 'lucide-react';

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
    submitButtonText: 'Submit',
    formRules: [],
    themeColor: '#d97706',
    position: 'bottom-right'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewRuleIdx, setPreviewRuleIdx] = useState(-1); // -1 = default form

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
          submitButtonText: s.submit_button_text || 'Submit',
          formRules: s.form_rules || [],
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

  const addPageRule = () => {
    const rules = [...settings.formRules, {
      urlPattern: '/',
      formTitle: 'Get a Free Quote',
      formFields: ['name', 'email', 'phone', 'message'],
      submitButtonText: 'Submit'
    }];
    setSettings({ ...settings, formRules: rules });
    setPreviewRuleIdx(rules.length - 1);
  };

  const removePageRule = (idx) => {
    const rules = settings.formRules.filter((_, i) => i !== idx);
    setSettings({ ...settings, formRules: rules });
    if (previewRuleIdx === idx) setPreviewRuleIdx(-1);
    else if (previewRuleIdx > idx) setPreviewRuleIdx(previewRuleIdx - 1);
  };

  const updatePageRule = (idx, key, value) => {
    const rules = [...settings.formRules];
    rules[idx] = { ...rules[idx], [key]: value };
    setSettings({ ...settings, formRules: rules });
  };

  const toggleRuleField = (idx, field) => {
    const rule = settings.formRules[idx];
    const fields = [...(rule.formFields || ['name', 'email', 'phone', 'message'])];
    const fidx = fields.indexOf(field);
    if (fidx >= 0) fields.splice(fidx, 1);
    else fields.push(field);
    updatePageRule(idx, 'formFields', fields);
  };

  // Get the form config being previewed
  const previewConfig = previewRuleIdx >= 0 && settings.formRules[previewRuleIdx]
    ? {
        title: settings.formRules[previewRuleIdx].formTitle || 'Get a Free Quote',
        fields: settings.formRules[previewRuleIdx].formFields || ['name', 'email', 'phone', 'message'],
        submitText: settings.formRules[previewRuleIdx].submitButtonText || 'Submit'
      }
    : {
        title: settings.leadFormTitle || 'Get a Free Quote',
        fields: settings.leadFormFields || ['name', 'email', 'phone', 'message'],
        submitText: settings.submitButtonText || 'Submit'
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
                <p className="text-sm text-gray-500">Replaces existing contact forms on your website</p>
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
            <div className="mt-4 space-y-4">
              {/* Warning Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 mb-1">How this works</p>
                    <ul className="text-amber-700 space-y-1">
                      <li>Your existing contact forms stay <strong>exactly as they are</strong> — we just listen for submissions in the background.</li>
                      <li>When a visitor submits your form, their info is automatically forwarded to your SORCE dashboard as a new lead.</li>
                      <li>If no forms are detected on your page, a floating lead capture button will appear instead.</li>
                      <li>All captured leads trigger <strong>SMS follow-up</strong> automatically if your Lead Form Agent is enabled.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Webhook URL */}
              {siteKey && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                    Webhook URL — for Wix, Squarespace, WordPress, Zapier
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    If the embed script can't detect your forms, use this webhook instead. Point your form platform's webhook to this URL and we'll receive submissions directly — 100% reliable.
                  </p>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 truncate select-all">
                      {apiUrl}/api/webhooks/form/{siteKey}
                    </code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${apiUrl}/api/webhooks/form/${siteKey}`); }}
                      className="px-3 py-2 bg-gray-700 text-white text-xs rounded hover:bg-gray-800 whitespace-nowrap flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <details className="mt-3">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">Platform setup instructions ▸</summary>
                    <div className="mt-2 space-y-2 text-xs text-gray-600">
                      <p><strong>Wix:</strong> Automations → Create Automation → Form Submitted → Webhook → paste URL above. Map fields to JSON keys: <code>name</code>, <code>email</code>, <code>phone</code>, <code>message</code>.</p>
                      <p><strong>Squarespace:</strong> Settings → Advanced → Code Injection — or use Squarespace Automations with webhook action.</p>
                      <p><strong>WordPress/Contact Form 7:</strong> Install "CF7 to Webhook" plugin, paste URL above.</p>
                      <p><strong>Zapier/Make:</strong> Add a Webhook step after your form trigger. POST to the URL with JSON body containing <code>name</code>, <code>email</code>, <code>phone</code>.</p>
                      <p className="bg-blue-50 p-2 rounded"><strong>Expected JSON:</strong> <code>{'{"name":"John","email":"j@j.com","phone":"5551234567","message":"optional"}'}</code></p>
                    </div>
                  </details>
                </div>
              )}

              {/* Default Form Settings */}
              <div className="ml-12 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Default Form (all pages)</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Form Title</label>
                  <input
                    type="text"
                    value={settings.leadFormTitle}
                    onChange={e => { setSettings({ ...settings, leadFormTitle: e.target.value }); setPreviewRuleIdx(-1); }}
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
                        onClick={() => { toggleField(field); setPreviewRuleIdx(-1); }}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submit Button Text</label>
                  <input
                    type="text"
                    value={settings.submitButtonText}
                    onChange={e => { setSettings({ ...settings, submitButtonText: e.target.value }); setPreviewRuleIdx(-1); }}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Submit"
                  />
                </div>
              </div>

              {/* Page Rules */}
              <div className="ml-12 space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Page Rules</span>
                    <p className="text-xs text-gray-400">Override the default form for specific pages</p>
                  </div>
                  <button
                    onClick={addPageRule}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Rule
                  </button>
                </div>

                {settings.formRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 space-y-3 cursor-pointer transition ${
                      previewRuleIdx === idx ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200'
                    }`}
                    onClick={() => setPreviewRuleIdx(idx)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {rule.urlPattern || '/'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removePageRule(idx); }}
                        className="p-1 text-gray-400 hover:text-red-500 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">URL Path (e.g. /contact, /services)</label>
                      <input
                        type="text"
                        value={rule.urlPattern}
                        onChange={e => updatePageRule(idx, 'urlPattern', e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg text-sm font-mono focus:border-blue-500 focus:outline-none"
                        placeholder="/contact"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Form Title</label>
                      <input
                        type="text"
                        value={rule.formTitle}
                        onChange={e => updatePageRule(idx, 'formTitle', e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="Contact Us"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fields</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['name', 'email', 'phone', 'service', 'message'].map(field => (
                          <button
                            key={field}
                            onClick={(e) => { e.stopPropagation(); toggleRuleField(idx, field); }}
                            disabled={field === 'name' || field === 'email'}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition ${
                              (rule.formFields || []).includes(field)
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-gray-100 text-gray-400 border border-gray-200'
                            } ${(field === 'name' || field === 'email') ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {field.charAt(0).toUpperCase() + field.slice(1)}
                            {(field === 'name' || field === 'email') && '*'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Submit Button Text</label>
                      <input
                        type="text"
                        value={rule.submitButtonText}
                        onChange={e => updatePageRule(idx, 'submitButtonText', e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="w-full px-3 py-1.5 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="Submit"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Form Preview */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Form Preview</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {previewRuleIdx >= 0 && settings.formRules[previewRuleIdx]
                      ? `Page: ${settings.formRules[previewRuleIdx].urlPattern || '/'}`
                      : 'Default (all pages)'}
                  </span>
                </div>
                <div className="p-6 bg-white">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{previewConfig.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">Fill out the form and we'll get back to you shortly.</p>
                    <div className="space-y-3">
                      {previewConfig.fields.includes('name') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input type="text" placeholder="Your name" disabled className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400" />
                        </div>
                      )}
                      {previewConfig.fields.includes('email') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input type="email" placeholder="your@email.com" disabled className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400" />
                        </div>
                      )}
                      {previewConfig.fields.includes('phone') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input type="tel" placeholder="(555) 123-4567" disabled className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400" />
                        </div>
                      )}
                      {previewConfig.fields.includes('service') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Service Interested In</label>
                          <input type="text" placeholder="What service are you looking for?" disabled className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400" />
                        </div>
                      )}
                      {previewConfig.fields.includes('message') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                          <textarea rows="3" placeholder="Tell us about what you need..." disabled className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 resize-none" />
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <input type="checkbox" disabled className="mt-1" />
                        <span className="text-xs text-gray-400">I consent to receiving SMS messages about my inquiry</span>
                      </div>
                      <button
                        disabled
                        className="w-full py-3 rounded-lg text-white font-semibold text-sm"
                        style={{ backgroundColor: settings.themeColor }}
                      >
                        {previewConfig.submitText}
                      </button>
                    </div>
                  </div>
                </div>
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
