import { useState, useEffect } from 'react';
import { Copy, Check, Code, MessageCircle, Calendar, Mail, ChevronRight, ChevronLeft, ExternalLink, Bot, FileText, Settings, Sparkles, Plus, X, Eye, AlertTriangle } from 'lucide-react';

const PLATFORMS = [
  { id: 'wix', name: 'Wix', color: 'bg-blue-600', letter: 'W' },
  { id: 'squarespace', name: 'Squarespace', color: 'bg-black', letter: 'S' },
  { id: 'wordpress', name: 'WordPress', color: 'bg-blue-800', letter: 'WP' },
  { id: 'shopify', name: 'Shopify', color: 'bg-green-700', letter: 'S' },
  { id: 'webflow', name: 'Webflow', color: 'bg-blue-500', letter: 'Wf' },
  { id: 'godaddy', name: 'GoDaddy', color: 'bg-orange-500', letter: 'G' },
  { id: 'weebly', name: 'Weebly', color: 'bg-indigo-600', letter: 'W' },
  { id: 'html', name: 'Any HTML Site', color: 'bg-gray-800', letter: '</>' },
];

// Use '__PASTE__' as a marker — rendered specially with inline code + copy button
const PLATFORM_STEPS = {
  wix: {
    note: 'Use Settings, not the Editor -- this ensures it loads on every page.',
    steps: [
      'Go to your <strong>Wix Dashboard</strong> (not the Editor)',
      'Click <strong>Settings</strong> in the left sidebar',
      'Click <strong>Custom Code</strong> under Advanced',
      'Click <strong>"+ Add Code"</strong> in the <strong>Body - end</strong> section',
      '__PASTE__',
      'Name it <strong>"SORCE Embed"</strong>',
      'Set <strong>Code Type:</strong> "Essential"',
      'Set <strong>Pages:</strong> "All pages"',
      'Click <strong>Apply</strong>',
    ],
    tip: 'Requires a Wix Premium plan. On free plans, use the Editor: Add (+) > Embed Code > Embed HTML.',
  },
  squarespace: {
    steps: [
      'Go to <strong>Settings</strong> > <strong>Developer Tools</strong> > <strong>Code Injection</strong>',
      'Scroll to the <strong>Footer</strong> section',
      '__PASTE__',
      'Click <strong>Save</strong>',
    ],
    tip: 'Code Injection requires a Business plan or higher.',
  },
  wordpress: {
    steps: [
      'Install the <strong>"WPCode"</strong> plugin (free) from Plugins > Add New',
      'Go to <strong>Code Snippets</strong> > <strong>Header & Footer</strong>',
      '__PASTE__',
      'Click <strong>Save Changes</strong>',
    ],
    tip: 'Alternative: Appearance > Theme File Editor > footer.php > paste before </body>.',
  },
  shopify: {
    steps: [
      'Go to <strong>Online Store</strong> > <strong>Themes</strong>',
      'Click <strong>Actions</strong> > <strong>Edit Code</strong>',
      'Open <strong>theme.liquid</strong> in the Layout folder',
      '__PASTE__',
      'Click <strong>Save</strong>',
    ],
  },
  webflow: {
    steps: [
      'Open your project in the Webflow Designer',
      'Go to <strong>Project Settings</strong> > <strong>Custom Code</strong>',
      '__PASTE__',
      'Click <strong>Save Changes</strong> > <strong>Publish</strong>',
    ],
  },
  godaddy: {
    steps: [
      'Open your site in the GoDaddy Editor',
      'Click <strong>Add Section</strong> > <strong>HTML</strong>',
      '__PASTE__',
      'Move the block to the bottom of your page',
      'Click <strong>Publish</strong>',
    ],
  },
  weebly: {
    steps: [
      'Go to <strong>Settings</strong> > <strong>SEO</strong>',
      'Scroll to <strong>Footer Code</strong>',
      '__PASTE__',
      'Click <strong>Save</strong> > <strong>Publish</strong>',
    ],
  },
  html: {
    steps: [
      'Open your HTML file in a code editor',
      'Find the closing <code>&lt;/body&gt;</code> tag',
      '__PASTE__',
      'Save and upload to your hosting',
    ],
  },
};

export default function EmbedCode({ apiUrl, authFetch, setCurrentView }) {
  const [siteKey, setSiteKey] = useState('');
  const DEFAULT_FIELDS = [
    { id: 'name',    label: 'Name',                placeholder: 'Your name',                      required: true },
    { id: 'email',   label: 'Email',               placeholder: 'your@email.com',                 required: true },
    { id: 'phone',   label: 'Phone',               placeholder: '(555) 123-4567',                 required: false },
    { id: 'message', label: 'Message',             placeholder: 'Tell us about what you need...', required: false },
  ];
  const ALL_FIELD_DEFAULTS = {
    name:    { label: 'Name',                placeholder: 'Your name',                      required: true },
    email:   { label: 'Email',               placeholder: 'your@email.com',                 required: true },
    phone:   { label: 'Phone',               placeholder: '(555) 123-4567',                 required: false },
    service: { label: 'Service Interested In', placeholder: 'What service are you looking for?', required: false },
    message: { label: 'Message',             placeholder: 'Tell us about what you need...', required: false },
  };
  // Normalize loaded fields: convert string array → object array
  const normalizeFields = (raw) => {
    if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_FIELDS;
    return raw.map(f => {
      if (typeof f === 'string') {
        const d = ALL_FIELD_DEFAULTS[f] || { label: f, placeholder: '', required: false };
        return { id: f, label: d.label, placeholder: d.placeholder, required: d.required };
      }
      return f;
    });
  };

  const [settings, setSettings] = useState({
    chatEnabled: false,
    bookingEnabled: false,
    bookingStyle: 'chat',
    leadFormEnabled: false,
    leadFormTitle: 'Get a Free Quote',
    leadFormDescription: "Fill out the form and we'll get back to you shortly.",
    leadFormFields: DEFAULT_FIELDS,
    bookingButtonText: 'Book Online',
    submitButtonText: 'Submit',
    formRules: [],
    themeColor: '#d97706',
    position: 'bottom-right'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [previewRuleIdx, setPreviewRuleIdx] = useState(-1);

  const addPageRule = () => {
    const rules = [...settings.formRules, { urlPattern: '/', formTitle: 'Get a Free Quote', formFields: settings.leadFormFields.map(f => f.id), submitButtonText: 'Submit' }];
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
    const fields = [...(rule.formFields || settings.leadFormFields.map(f => f.id))];
    const fidx = fields.indexOf(field);
    if (fidx >= 0) { if (field !== 'name' && field !== 'email') fields.splice(fidx, 1); }
    else fields.push(field);
    updatePageRule(idx, 'formFields', fields);
  };
  // For preview: resolve fields as objects using global settings
  const resolvePreviewFields = (fieldIds) => {
    return fieldIds.map(id => {
      const f = settings.leadFormFields.find(x => x.id === id);
      return f || { id, label: ALL_FIELD_DEFAULTS[id]?.label || id, placeholder: ALL_FIELD_DEFAULTS[id]?.placeholder || '' };
    });
  };
  const previewConfig = previewRuleIdx >= 0 && settings.formRules[previewRuleIdx]
    ? { title: settings.formRules[previewRuleIdx].formTitle || 'Get a Free Quote', fields: resolvePreviewFields(settings.formRules[previewRuleIdx].formFields || settings.leadFormFields.map(f => f.id)), submitText: settings.formRules[previewRuleIdx].submitButtonText || 'Submit' }
    : { title: settings.leadFormTitle || 'Get a Free Quote', fields: settings.leadFormFields, submitText: settings.submitButtonText || 'Submit' };

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
          leadFormDescription: s.lead_form_description || "Fill out the form and we'll get back to you shortly.",
          leadFormFields: normalizeFields(s.lead_form_fields),
          bookingButtonText: s.booking_button_text || 'Book Online',
          submitButtonText: s.submit_button_text || 'Submit',
          formRules: s.form_rules || [],
          themeColor: s.theme_color || '#d97706',
          position: s.position || 'bottom-right'
        });
        // If they already have settings saved, skip to configure step
        if (s.chat_enabled || s.booking_enabled || s.lead_form_enabled) {
          setStep(4);
        }
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

  const embedBaseUrl = import.meta.env.VITE_EMBED_URL || import.meta.env.VITE_PRODUCTION_BACKEND_URL || 'https://backend-production-ab50.up.railway.app';
  const embedCode = `<script src="${embedBaseUrl}/embed.js" data-site-key="${siteKey}" async></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" /></div>;

  const STEPS = [
    { label: 'Get Started' },
    { label: 'Choose Host' },
    { label: 'Install Code' },
    { label: 'Enable Features' },
    { label: 'Configure' },
  ];

  const enabledCount = [settings.chatEnabled, settings.bookingEnabled, settings.leadFormEnabled].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header - centered */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-3 shadow-lg shadow-amber-200">
          <Code className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Embed SORCE on Your Website</h2>
        <p className="text-gray-500 mt-1">Add AI chat, online booking, and lead capture to any website</p>
      </div>

      {/* Step Progress Bar */}
      <div className="flex items-center justify-center gap-1 px-4">
        {STEPS.map((s, i) => {
          // step 5 is a sub-view of step 4, so treat activeStep as 4 for progress bar
          const activeStep = Math.min(step, 4);
          const isActive = i === activeStep;
          const isCompleted = i < activeStep;
          const isClickable = i <= activeStep;
          return (
          <div key={i} className="flex items-center gap-1">
            <button
              onClick={() => { if (isClickable) setStep(i); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-amber-600 text-white shadow-md'
                  : isCompleted
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isActive ? 'bg-white/20 text-white' : isCompleted ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {isCompleted ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className={`w-3.5 h-3.5 ${isCompleted ? 'text-amber-400' : 'text-gray-300'}`} />
            )}
          </div>);
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

        {/* Step 0: Get Started */}
        {step === 0 && (
          <div className="p-8 text-center">
            <div className="max-w-lg mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Install SORCE On Your Website</h3>
              <p className="text-gray-500 mb-6">In just a few steps, you'll have AI-powered chat, online booking, and smart lead capture running on your existing website.</p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <MessageCircle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-800">AI Chat Agent</p>
                  <p className="text-xs text-gray-500 mt-1">Answers questions & captures leads 24/7</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-800">Online Booking</p>
                  <p className="text-xs text-gray-500 mt-1">Connects to your "Book Now" buttons</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <Mail className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-800">Lead Capture</p>
                  <p className="text-xs text-gray-500 mt-1">Replaces forms & triggers SMS follow-up</p>
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                className="px-8 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition shadow-md shadow-amber-200 inline-flex items-center gap-2"
              >
                Get Started <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Choose Your Website Host */}
        {step === 1 && (
          <div className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Choose Your Website Host</h3>
              <p className="text-gray-500 mt-1">Select the platform your website is built on</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPlatform(p.id); setStep(2); }}
                  className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all hover:shadow-md ${
                    selectedPlatform === p.id
                      ? 'border-amber-500 bg-amber-50 shadow-md'
                      : 'border-gray-200 hover:border-amber-300 bg-white'
                  }`}
                >
                  <span className={`w-10 h-10 ${p.color} text-white rounded-lg flex items-center justify-center text-sm font-bold`}>
                    {p.letter}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{p.name}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-8 max-w-2xl mx-auto">
              <button onClick={() => setStep(0)} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Follow These Steps */}
        {step === 2 && selectedPlatform && (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className={`w-8 h-8 ${PLATFORMS.find(p => p.id === selectedPlatform)?.color} text-white rounded-lg flex items-center justify-center text-xs font-bold`}>
                  {PLATFORMS.find(p => p.id === selectedPlatform)?.letter}
                </span>
                <h3 className="text-xl font-bold text-gray-900">
                  Follow These Steps on {PLATFORMS.find(p => p.id === selectedPlatform)?.name}
                </h3>
              </div>
              <p className="text-gray-500 mt-1">Navigate to the custom code area in your {PLATFORMS.find(p => p.id === selectedPlatform)?.name} dashboard</p>
            </div>
            <div className="max-w-lg mx-auto">
              {PLATFORM_STEPS[selectedPlatform]?.note && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800 font-medium">
                  {PLATFORM_STEPS[selectedPlatform].note}
                </div>
              )}
              <ol className="space-y-3">
                {PLATFORM_STEPS[selectedPlatform]?.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      {i + 1}
                    </span>
                    {s === '__PASTE__' ? (
                      <div className="flex-1 pt-0.5">
                        <span className="text-gray-700 text-sm font-medium">Paste this line of code in the code box:</span>
                        <div className="bg-gray-900 rounded-lg px-3 py-2 mt-2 flex items-center gap-2">
                          <code className="text-green-400 text-[11px] font-mono break-all flex-1 leading-snug">{embedCode}</code>
                          <button
                            onClick={copyToClipboard}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap flex-shrink-0 ${
                              copied ? 'bg-green-500 text-white' : 'bg-amber-600 text-white hover:bg-amber-700'
                            }`}
                          >
                            {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-700 text-sm leading-relaxed pt-1" dangerouslySetInnerHTML={{ __html: s }} />
                    )}
                  </li>
                ))}
              </ol>
              {PLATFORM_STEPS[selectedPlatform]?.tip && (
                <p className="text-xs text-gray-400 mt-4 bg-gray-50 rounded-lg p-3">
                  {PLATFORM_STEPS[selectedPlatform].tip}
                </p>
              )}
            </div>
            <div className="flex justify-between mt-8 max-w-lg mx-auto">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Change Host
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition inline-flex items-center gap-2 text-sm"
              >
                Code is Installed <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Enable Features */}
        {step === 3 && (
          <div className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Enable Features on Your Website</h3>
              <p className="text-gray-500 mt-1">Turn on the widgets you want active, then save</p>
            </div>

            {/* Widget Toggles */}
            <div className="max-w-xl mx-auto space-y-3 mb-6">
              {/* Chat Agent Toggle */}
              <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition ${settings.chatEnabled ? 'border-amber-400 bg-amber-50/50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${settings.chatEnabled ? 'bg-amber-500' : 'bg-gray-100'}`}>
                    <MessageCircle className={`w-5 h-5 ${settings.chatEnabled ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">AI Chat Agent</h4>
                    <p className="text-xs text-gray-500">Chat bubble that handles customer questions</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.chatEnabled} onChange={e => setSettings({ ...settings, chatEnabled: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-amber-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>

              {/* Booking Toggle */}
              <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition ${settings.bookingEnabled ? 'border-green-400 bg-green-50/50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${settings.bookingEnabled ? 'bg-green-500' : 'bg-gray-100'}`}>
                    <Calendar className={`w-5 h-5 ${settings.bookingEnabled ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Book Online</h4>
                    <p className="text-xs text-gray-500">Connects "Book Now" buttons to SORCE booking</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.bookingEnabled} onChange={e => setSettings({ ...settings, bookingEnabled: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-green-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>

              {/* Lead Form Toggle */}
              <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition ${settings.leadFormEnabled ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${settings.leadFormEnabled ? 'bg-blue-500' : 'bg-gray-100'}`}>
                    <Mail className={`w-5 h-5 ${settings.leadFormEnabled ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Lead Capture Form</h4>
                    <p className="text-xs text-gray-500">Replaces existing forms & triggers SMS follow-up</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.leadFormEnabled} onChange={e => setSettings({ ...settings, leadFormEnabled: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-blue-600 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            </div>

            {/* Save & Next */}
            <div className="max-w-xl mx-auto text-center mb-4">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition disabled:opacity-50 shadow-md shadow-amber-200 inline-flex items-center gap-2"
                >
                  {saving ? 'Saving...' : saveSuccess ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Embed Settings'}
                </button>
                {enabledCount > 0 && !saving && (
                  <button
                    onClick={() => { handleSave(); setStep(4); }}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition inline-flex items-center gap-2 text-sm"
                  >
                    Save & Continue <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              {enabledCount === 0 && (
                <p className="text-xs text-gray-400 mt-2">Enable at least one widget, then save to activate.</p>
              )}
            </div>

            <div className="flex justify-start mt-6 max-w-xl mx-auto">
              <button onClick={() => setStep(0)} className="px-4 py-2 text-gray-400 hover:text-gray-600 text-xs font-medium flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Restart Setup Guide
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Configure Your Integrations */}
        {step === 4 && (
          <div className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Configure Your Integrations</h3>
              <p className="text-gray-500 mt-1">Set up and customize the features you enabled</p>
            </div>

            <div className="max-w-xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                <button
                  onClick={() => setCurrentView?.('ai-agents')}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50/50 transition group"
                >
                  <div className="w-11 h-11 bg-amber-100 group-hover:bg-amber-500 rounded-xl flex items-center justify-center transition">
                    <Bot className="w-6 h-6 text-amber-600 group-hover:text-white transition" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Train Your AI Agents</span>
                  <span className="text-xs text-gray-400">Customize chat personality & responses</span>
                </button>

                <button
                  onClick={() => setStep(5)}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition group"
                >
                  <div className="w-11 h-11 bg-blue-100 group-hover:bg-blue-500 rounded-xl flex items-center justify-center transition">
                    <FileText className="w-6 h-6 text-blue-600 group-hover:text-white transition" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Edit Your Contact Form</span>
                  <span className="text-xs text-gray-400">Customize fields, titles & page rules</span>
                </button>

                <button
                  onClick={() => setCurrentView?.('business-settings:services')}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50/50 transition group"
                >
                  <div className="w-11 h-11 bg-green-100 group-hover:bg-green-500 rounded-xl flex items-center justify-center transition">
                    <Settings className="w-6 h-6 text-green-600 group-hover:text-white transition" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">Configure Booking</span>
                  <span className="text-xs text-gray-400">Set up services for online booking</span>
                </button>
              </div>

            </div>

            <div className="flex justify-between mt-6 max-w-xl mx-auto">
              <button onClick={() => setStep(3)} className="px-4 py-2 text-gray-400 hover:text-gray-600 text-xs font-medium flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Back to Features
              </button>
              <button onClick={() => setStep(0)} className="px-4 py-2 text-gray-400 hover:text-gray-600 text-xs font-medium flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Restart Setup Guide
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Contact Form Editor (sub-view from step 4) */}
        {step === 5 && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep(4)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Your Contact Form</h3>
                  <p className="text-gray-500 text-sm">Changes update the preview instantly</p>
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition disabled:opacity-50 inline-flex items-center gap-2 text-sm"
              >
                {saving ? 'Saving...' : saveSuccess ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
              </button>
            </div>

            <div className="flex gap-6">
              {/* Left: Editor */}
              <div className="flex-1 space-y-5 min-w-0">
                {/* Info banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">Existing contact forms are <strong>automatically replaced</strong>. All submissions become leads and trigger AI SMS follow-up.</p>
                  </div>
                </div>

                {/* Default Form */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">Default Form (all pages)</span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Form Title</label>
                    <input
                      type="text"
                      value={settings.leadFormTitle}
                      onChange={e => { setSettings({ ...settings, leadFormTitle: e.target.value }); setPreviewRuleIdx(-1); }}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Get a Free Quote"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Form Description</label>
                    <input
                      type="text"
                      value={settings.leadFormDescription}
                      onChange={e => { setSettings({ ...settings, leadFormDescription: e.target.value }); setPreviewRuleIdx(-1); }}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Fill out the form and we'll get back to you shortly."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Form Fields</label>
                    <div className="space-y-2">
                      {['name', 'email', 'phone', 'service', 'message'].map(fid => {
                        const isRequired = fid === 'name' || fid === 'email';
                        const existing = settings.leadFormFields.find(f => f.id === fid);
                        const isEnabled = !!existing;
                        const def = ALL_FIELD_DEFAULTS[fid];
                        return (
                          <div key={fid} className={`border rounded-lg transition ${isEnabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50/50'}`}>
                            <div className="flex items-center gap-2 px-3 py-2">
                              <button
                                disabled={isRequired}
                                onClick={() => {
                                  let fields = [...settings.leadFormFields];
                                  if (isEnabled) { fields = fields.filter(f => f.id !== fid); }
                                  else { fields.push({ id: fid, label: def.label, placeholder: def.placeholder, required: def.required }); }
                                  setSettings({ ...settings, leadFormFields: fields });
                                  setPreviewRuleIdx(-1);
                                }}
                                className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition ${isEnabled ? 'bg-blue-600 border-blue-600' : 'border-gray-300'} ${isRequired ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                {isEnabled && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                              </button>
                              <span className="text-xs font-semibold text-gray-700 flex-1">{def.label}{isRequired && <span className="text-red-400 ml-1">*</span>}</span>
                            </div>
                            {isEnabled && (
                              <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Label</label>
                                  <input
                                    type="text"
                                    value={existing.label}
                                    onChange={e => {
                                      const fields = settings.leadFormFields.map(f => f.id === fid ? { ...f, label: e.target.value } : f);
                                      setSettings({ ...settings, leadFormFields: fields });
                                      setPreviewRuleIdx(-1);
                                    }}
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:border-blue-500 focus:outline-none"
                                    placeholder={def.label}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Placeholder</label>
                                  <input
                                    type="text"
                                    value={existing.placeholder}
                                    onChange={e => {
                                      const fields = settings.leadFormFields.map(f => f.id === fid ? { ...f, placeholder: e.target.value } : f);
                                      setSettings({ ...settings, leadFormFields: fields });
                                      setPreviewRuleIdx(-1);
                                    }}
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:border-blue-500 focus:outline-none"
                                    placeholder={def.placeholder}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Submit Button Text</label>
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
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-gray-700">Page Rules</span>
                      <p className="text-xs text-gray-400">Override form for specific pages</p>
                    </div>
                    <button onClick={addPageRule} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition">
                      <Plus className="w-3.5 h-3.5" /> Add Rule
                    </button>
                  </div>
                  {settings.formRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-3 space-y-2.5 cursor-pointer transition ${previewRuleIdx === idx ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200'}`}
                      onClick={() => setPreviewRuleIdx(idx)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">{rule.urlPattern || '/'}</span>
                        <button onClick={(e) => { e.stopPropagation(); removePageRule(idx); }} className="p-1 text-gray-400 hover:text-red-500 transition">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">URL Path</label>
                        <input type="text" value={rule.urlPattern} onChange={e => updatePageRule(idx, 'urlPattern', e.target.value)} onClick={e => e.stopPropagation()} className="w-full px-2.5 py-1.5 border-2 border-gray-200 rounded-lg text-xs font-mono focus:border-blue-500 focus:outline-none" placeholder="/contact" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Form Title</label>
                        <input type="text" value={rule.formTitle} onChange={e => updatePageRule(idx, 'formTitle', e.target.value)} onClick={e => e.stopPropagation()} className="w-full px-2.5 py-1.5 border-2 border-gray-200 rounded-lg text-xs focus:border-blue-500 focus:outline-none" placeholder="Contact Us" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Fields</label>
                        <div className="flex flex-wrap gap-1">
                          {['name', 'email', 'phone', 'service', 'message'].map(field => {
                            const glbl = settings.leadFormFields.find(f => f.id === field);
                            const lbl = glbl?.label || ALL_FIELD_DEFAULTS[field]?.label || field;
                            const isReq = field === 'name' || field === 'email';
                            return (
                              <button
                                key={field}
                                onClick={(e) => { e.stopPropagation(); toggleRuleField(idx, field); }}
                                disabled={isReq}
                                className={`px-2 py-0.5 rounded-full text-xs font-medium transition ${
                                  (rule.formFields || []).includes(field) ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-400 border border-gray-200'
                                } ${isReq ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                {lbl}{isReq && '*'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Submit Button Text</label>
                        <input type="text" value={rule.submitButtonText} onChange={e => updatePageRule(idx, 'submitButtonText', e.target.value)} onClick={e => e.stopPropagation()} className="w-full px-2.5 py-1.5 border-2 border-gray-200 rounded-lg text-xs focus:border-blue-500 focus:outline-none" placeholder="Submit" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Appearance */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <span className="text-sm font-semibold text-gray-700 block mb-3">Appearance</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Theme Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={settings.themeColor} onChange={e => setSettings({ ...settings, themeColor: e.target.value })} className="w-9 h-9 rounded-lg border-2 border-gray-200 cursor-pointer" />
                        <input type="text" value={settings.themeColor} onChange={e => setSettings({ ...settings, themeColor: e.target.value })} className="flex-1 px-2 py-1.5 border-2 border-gray-200 rounded-lg text-xs font-mono focus:border-blue-500 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Widget Position</label>
                      <select value={settings.position} onChange={e => setSettings({ ...settings, position: e.target.value })} className="w-full px-2 py-1.5 border-2 border-gray-200 rounded-lg text-xs focus:border-blue-500 focus:outline-none">
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Live Preview */}
              <div className="w-80 flex-shrink-0">
                <div className="sticky top-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Live Preview</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {previewRuleIdx >= 0 && settings.formRules[previewRuleIdx] ? `Page: ${settings.formRules[previewRuleIdx].urlPattern || '/'}` : 'Default'}
                    </span>
                  </div>
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="p-5 bg-white">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{previewConfig.title}</h3>
                      <p className="text-xs text-gray-500 mb-4">{settings.leadFormDescription}</p>
                      <div className="space-y-3">
                        {previewConfig.fields.map(f => (
                          <div key={f.id}>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}</label>
                            {f.id === 'message'
                              ? <textarea rows="2" placeholder={f.placeholder} disabled className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-400 resize-none" />
                              : <input type="text" placeholder={f.placeholder} disabled className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-400" />
                            }
                          </div>
                        ))}
                        <div className="flex items-start gap-2">
                          <input type="checkbox" disabled className="mt-0.5" />
                          <span className="text-xs text-gray-400">I consent to receive text messages from [Business Name] about services I'm interested in. Message & data rates may apply. Message frequency may vary. Reply STOP to unsubscribe.</span>
                        </div>
                        <button disabled className="w-full py-2.5 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: settings.themeColor }}>
                          {previewConfig.submitText}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
