import { useState, useEffect, useMemo } from 'react';
import {
  X, Save, Loader, Palette, Eye, Clock, CreditCard, CheckCircle,
  ChevronLeft, ChevronRight, Plus, Trash2, GripVertical,
  User, Mail, Phone, MapPin, FileText, DollarSign, Shield, Percent,
  Calendar, ArrowRight, Check, AlertCircle, CheckCircle2
} from 'lucide-react';

const DEFAULT_CONFIG = {
  steps: {
    categories: { title: 'Our Services', subtitle: 'Choose a category' },
    services: { title: 'Select a Service', subtitle: '' },
    addons: { title: 'Enhance Your Service', subtitle: 'Popular add-ons for this service' },
    datetime: { title: 'Choose Date & Time', subtitle: '' },
    contact: { title: 'Your Information', subtitle: '' },
    payment: { title: 'Confirm & Pay', subtitle: '' },
    confirmation: { title: 'Booking Confirmed!', subtitle: '' }
  },
  paymentMode: 'none',
  depositEnabled: false,
  depositType: 'percent',
  depositAmount: 50,
  contactFields: [
    { key: 'name', label: 'Full Name', type: 'text', required: true, enabled: true, removable: false },
    { key: 'email', label: 'Email', type: 'email', required: true, enabled: true, removable: false },
    { key: 'phone', label: 'Phone', type: 'tel', required: true, enabled: true, removable: false },
    { key: 'address', label: 'Address', type: 'text', required: false, enabled: false, removable: true },
    { key: 'notes', label: 'Notes', type: 'textarea', required: false, enabled: true, removable: true }
  ],
  showPrices: true,
  showDurations: true,
  accentColor: null
};

const STEP_KEYS = ['categories', 'services', 'addons', 'datetime', 'contact', 'payment', 'confirmation'];

const STEP_LABELS = {
  categories: 'Categories',
  services: 'Services',
  addons: 'Add-ons',
  datetime: 'Date & Time',
  contact: 'Contact',
  payment: 'Payment',
  confirmation: 'Confirmation'
};

const PAYMENT_MODES = [
  { value: 'none', label: 'No Payment Required', desc: 'Customers book freely without any payment', icon: CheckCircle },
  { value: 'card_on_file', label: 'Card on File', desc: 'Collect card details without charging at booking', icon: Shield },
  { value: 'pay_at_booking', label: 'Pay at Booking', desc: 'Charge full or partial amount when booking', icon: DollarSign }
];

const FIELD_ICONS = { name: User, email: Mail, phone: Phone, address: MapPin, notes: FileText };

// ── Fake preview data ────────────────────────────────────────
const MOCK = {
  categories: [
    { name: 'Lawn Care', count: 4, color: '#16a34a' },
    { name: 'Landscaping', count: 3, color: '#2563eb' }
  ],
  services: [
    { name: 'Basic Lawn Mow', price: 45, duration: '1h', desc: 'Standard mowing for up to 1/4 acre' },
    { name: 'Full Yard Service', price: 120, duration: '2.5h', desc: 'Mow, edge, blow & trim' },
    { name: 'Hedge Trimming', price: 80, duration: '1.5h', desc: 'Professional hedge shaping' }
  ],
  addons: [
    { name: 'Leaf Cleanup', price: 25 },
    { name: 'Fertilizer Application', price: 35 }
  ],
  times: ['9:00 AM', '10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM']
};

// ── Live Preview Component ───────────────────────────────────
function BookingPreview({ config, previewStep, accent, liveCategories, liveServices }) {
  const stepConf = config.steps?.[previewStep] || {};
  const title = stepConf.title || STEP_LABELS[previewStep];
  const subtitle = stepConf.subtitle || '';

  const renderDots = () => {
    const visible = STEP_KEYS.filter(k => {
      if (k === 'payment' && config.paymentMode === 'none') return false;
      return true;
    });
    const idx = visible.indexOf(previewStep);
    return (
      <div className="flex items-center justify-center gap-1.5 mb-4">
        {visible.map((k, i) => (
          <div
            key={k}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              background: i === idx ? accent : i < idx ? accent : '#e5e7eb',
              opacity: i < idx ? 0.4 : 1
            }}
          />
        ))}
      </div>
    );
  };

  const renderCategories = () => {
    const cats = liveCategories?.length ? liveCategories : MOCK.categories;
    return (
      <div className="grid grid-cols-2 gap-3">
        {cats.map((cat, i) => {
          const count = cat.services?.length ?? cat.count ?? 0;
          const hasImage = !!cat.image_url;
          return (
            <div
              key={cat.id || i}
              className="relative rounded-xl h-24 overflow-hidden cursor-pointer group"
              style={hasImage
                ? { backgroundImage: `url(${cat.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: cat.color || '#374151' }
              }
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-3">
                <div className="text-white font-bold text-sm">{cat.name}</div>
                <div className="text-white/70 text-[11px] mt-0.5">{count} service{count !== 1 ? 's' : ''}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderServices = () => {
    const svcs = liveServices?.length
      ? liveServices.filter(s => !s.is_addon).slice(0, 5)
      : MOCK.services;
    return (
      <div className="space-y-2.5">
        {svcs.map((svc, i) => {
          const price = parseFloat(svc.price) || 0;
          const dur = svc.duration_hours ? `${svc.duration_hours}h` : svc.duration || '';
          return (
            <div key={svc.id || i} className="border-2 border-gray-200 rounded-xl p-3 hover:border-blue-300 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                {svc.image_url && (
                  <img src={svc.image_url} alt={svc.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{svc.name}</div>
                  {(svc.description || svc.desc) && (
                    <div className="text-xs text-gray-500 mt-0.5 truncate">{svc.description || svc.desc}</div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {config.showPrices && <span className="font-bold text-sm" style={{ color: accent }}>${price.toFixed(2)}</span>}
                    {config.showDurations && dur && <span className="text-xs text-gray-400">{dur}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAddons = () => (
    <div className="space-y-0">
      {MOCK.addons.map((a, i) => (
        <div key={i} className="flex items-center py-3 border-b border-gray-100 last:border-0">
          <input type="checkbox" className="w-4 h-4 mr-3 rounded" style={{ accentColor: accent }} defaultChecked={i === 0} readOnly />
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-900">{a.name}</div>
          </div>
          <span className="text-sm font-bold" style={{ color: accent }}>+${a.price}</span>
        </div>
      ))}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
        <div>
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-lg font-bold text-gray-900">$70.00</div>
        </div>
        <button className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: accent }}>
          Continue →
        </button>
      </div>
    </div>
  );

  const renderDatetime = () => {
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const today = new Date();
    const month = today.toLocaleString('default', { month: 'long', year: 'numeric' });
    return (
      <div>
        <div className="border-2 border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
            <ChevronLeft className="w-4 h-4 text-gray-400" />
            <span className="font-bold text-sm text-gray-900">{month}</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <div className="grid grid-cols-7 text-center">
            {days.map(d => <div key={d} className="py-1.5 text-[10px] font-semibold text-gray-400 uppercase">{d}</div>)}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - (new Date(today.getFullYear(), today.getMonth(), 1).getDay()) + 1;
              const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
              if (day < 1 || day > daysInMonth) return <div key={i} className="py-1.5" />;
              const isToday = day === today.getDate();
              const isSel = day === today.getDate() + 2;
              return (
                <div
                  key={i}
                  className={`py-1.5 text-xs font-medium cursor-pointer relative ${day < today.getDate() ? 'text-gray-300' : 'text-gray-900'}`}
                  style={isSel ? { background: accent, color: '#fff', borderRadius: '6px' } : {}}
                >
                  {day}
                  {isToday && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: isSel ? '#fff' : accent }} />}
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-xs font-semibold text-gray-700 mb-2">Available Times</div>
        <div className="grid grid-cols-3 gap-2">
          {MOCK.times.map((t, i) => (
            <div
              key={t}
              className="py-2 text-center rounded-lg text-xs font-medium cursor-pointer border-2 transition-all"
              style={i === 2 ? { background: accent, color: '#fff', borderColor: accent } : { borderColor: '#e5e7eb', color: '#374151' }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContact = () => {
    const fields = config.contactFields?.filter(f => f.enabled) || DEFAULT_CONFIG.contactFields.filter(f => f.enabled);
    return (
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 mb-4">
          <div className="flex justify-between text-xs"><span className="text-gray-500">Service</span><span className="font-semibold">Basic Lawn Mow</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Date</span><span className="font-semibold">Wed, Mar 18, 2026</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Time</span><span className="font-semibold">11:30 AM</span></div>
          <div className="flex justify-between text-xs border-t border-gray-200 pt-1.5 mt-1"><span className="font-bold">Total</span><span className="font-bold" style={{ color: accent }}>$45.00</span></div>
        </div>
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            {f.type === 'textarea' ? (
              <textarea
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 resize-none"
                rows={2}
                placeholder={`Enter ${f.label.toLowerCase()}...`}
                readOnly
              />
            ) : (
              <input
                type={f.type}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400"
                placeholder={`Enter ${f.label.toLowerCase()}...`}
                readOnly
              />
            )}
          </div>
        ))}
        <button className="w-full py-3 rounded-lg text-white text-sm font-semibold mt-2" style={{ background: accent }}>
          {config.paymentMode === 'none' ? 'Confirm Booking' : config.paymentMode === 'card_on_file' ? 'Continue to Payment →' : 'Continue to Payment →'}
        </button>
      </div>
    );
  };

  const renderPayment = () => {
    const total = 45;
    const depositAmt = config.depositEnabled
      ? (config.depositType === 'percent' ? (total * (config.depositAmount || 50) / 100) : Math.min(config.depositAmount || 0, total))
      : total;
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span>Total Due</span>
            <span style={{ color: accent }}>${depositAmt.toFixed(2)}</span>
          </div>
          {config.depositEnabled && (
            <div className="text-[11px] text-gray-500">
              {config.depositType === 'percent' ? `${config.depositAmount}% deposit` : `$${config.depositAmount} deposit`} — remainder of ${(total - depositAmt).toFixed(2)} due at appointment
            </div>
          )}
        </div>
        {config.paymentMode === 'card_on_file' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <Shield className="w-3.5 h-3.5 inline mr-1.5" />
            Your card will be securely saved but <strong>not charged</strong> until your appointment.
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Card Details</label>
          <div className="border-2 border-gray-200 rounded-lg p-3 bg-white">
            <div className="flex items-center gap-3">
              <div className="h-8 w-12 bg-gray-100 rounded flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 text-sm text-gray-400">•••• •••• •••• ••••</div>
              <div className="text-xs text-gray-400">MM/YY</div>
              <div className="text-xs text-gray-400">CVC</div>
            </div>
          </div>
        </div>
        <button className="w-full py-3 rounded-lg text-white text-sm font-semibold" style={{ background: accent }}>
          {config.paymentMode === 'card_on_file' ? 'Save Card & Confirm' : `Pay $${depositAmt.toFixed(2)}`}
        </button>
        <div className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3" /> Secured by Stripe
        </div>
      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="text-center py-4">
      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
        <Check className="w-7 h-7 text-green-600" strokeWidth={3} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-1">Booking Confirmed!</h3>
      <p className="text-sm text-gray-500 mb-4">Confirmation #BK-1234</p>
      <div className="bg-gray-50 rounded-xl p-3 text-left space-y-1.5 mb-4">
        <div className="flex justify-between text-xs"><span className="text-gray-500">Service</span><span className="font-semibold">Basic Lawn Mow</span></div>
        <div className="flex justify-between text-xs"><span className="text-gray-500">Date</span><span className="font-semibold">Wed, Mar 18, 2026</span></div>
        <div className="flex justify-between text-xs"><span className="text-gray-500">Time</span><span className="font-semibold">11:30 AM</span></div>
        <div className="flex justify-between text-xs border-t border-gray-200 pt-1.5"><span className="font-bold">Total</span><span className="font-bold" style={{ color: accent }}>$45.00</span></div>
      </div>
      <p className="text-xs text-gray-500">A confirmation email has been sent to john@example.com</p>
      <button className="w-full py-3 rounded-lg text-white text-sm font-semibold mt-4" style={{ background: accent }}>Done</button>
    </div>
  );

  const stepRenderers = {
    categories: renderCategories,
    services: renderServices,
    addons: renderAddons,
    datetime: renderDatetime,
    contact: renderContact,
    payment: renderPayment,
    confirmation: renderConfirmation
  };

  return (
    <div className="w-full max-w-[380px] mx-auto">
      {/* Mock phone/widget frame */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Widget header bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div />
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <div className="px-5 pb-5">
          {renderDots()}
          {previewStep !== 'confirmation' && (
            <>
              <h3 className="text-lg font-bold text-gray-900 mb-0.5">{title}</h3>
              {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
              {!subtitle && <div className="mb-4" />}
            </>
          )}
          {stepRenderers[previewStep]?.()}
        </div>
      </div>
    </div>
  );
}

// ── Main Editor Component ────────────────────────────────────
export default function BookingWidgetEditor({ apiUrl, user, authFetch, onClose }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewStep, setPreviewStep] = useState('categories');
  const [settingsTab, setSettingsTab] = useState('steps'); // steps | contact | payment | general
  const [liveCategories, setLiveCategories] = useState([]);
  const [liveServices, setLiveServices] = useState([]);

  const accent = config.accentColor || '#3b82f6';

  useEffect(() => { fetchConfig(); fetchLiveData(); }, []);
  useEffect(() => {
    if (saveSuccess) {
      const t = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [saveSuccess]);

  const fetchLiveData = async () => {
    try {
      const [catRes, svcRes] = await Promise.all([
        authFetch(`${apiUrl}/api/service-categories`),
        authFetch(`${apiUrl}/api/services`)
      ]);
      if (catRes.ok) {
        const catData = await catRes.json();
        setLiveCategories(catData.categories || []);
      }
      if (svcRes.ok) {
        const svcData = await svcRes.json();
        const services = svcData.services || [];
        setLiveServices(services);
        // Attach service counts to categories
        setLiveCategories(prev => prev.map(cat => ({
          ...cat,
          services: services.filter(s => s.category_id === cat.id && !s.is_addon)
        })));
      }
    } catch (err) {
      console.error('Failed to load live preview data:', err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/booking-widget-config`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig({
            ...DEFAULT_CONFIG,
            ...data.config,
            steps: { ...DEFAULT_CONFIG.steps, ...(data.config.steps || {}) },
            contactFields: data.config.contactFields || DEFAULT_CONFIG.contactFields
          });
        }
      }
    } catch (err) {
      console.error('Failed to load booking widget config:', err);
      setError('Failed to load configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch(`${apiUrl}/api/booking-widget-config`, {
        method: 'PUT',
        body: JSON.stringify({ config })
      });
      if (res.ok) {
        setSaveSuccess(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save configuration.');
      }
    } catch (err) {
      console.error('Failed to save booking widget config:', err);
      setError('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const updateStep = (stepKey, field, value) => {
    setConfig(prev => ({
      ...prev,
      steps: { ...prev.steps, [stepKey]: { ...prev.steps[stepKey], [field]: value } }
    }));
  };

  const updateContactField = (index, field, value) => {
    setConfig(prev => {
      const fields = [...prev.contactFields];
      fields[index] = { ...fields[index], [field]: value };
      return { ...prev, contactFields: fields };
    });
  };

  const addContactField = () => {
    setConfig(prev => ({
      ...prev,
      contactFields: [
        ...prev.contactFields,
        { key: `custom_${Date.now()}`, label: 'New Field', type: 'text', required: false, enabled: true, removable: true }
      ]
    }));
  };

  const removeContactField = (index) => {
    setConfig(prev => ({
      ...prev,
      contactFields: prev.contactFields.filter((_, i) => i !== index)
    }));
  };

  // Visible preview steps based on payment mode
  const visibleSteps = useMemo(() => {
    return STEP_KEYS.filter(k => {
      if (k === 'payment' && config.paymentMode === 'none') return false;
      return true;
    });
  }, [config.paymentMode]);

  const navigateToStep = (stepKey) => {
    setPreviewStep(stepKey);
    if (stepKey === 'contact') setSettingsTab('contact');
    else if (stepKey === 'payment') setSettingsTab('payment');
    else setSettingsTab('steps');
  };

  const goNextPreview = () => {
    const idx = visibleSteps.indexOf(previewStep);
    if (idx < visibleSteps.length - 1) navigateToStep(visibleSteps[idx + 1]);
  };

  const goPrevPreview = () => {
    const idx = visibleSteps.indexOf(previewStep);
    if (idx > 0) navigateToStep(visibleSteps[idx - 1]);
  };

  // ── Settings Tabs ──────────────────────────────────────
  const SETTINGS_TABS = [
    { key: 'steps', label: 'Step Labels' },
    { key: 'contact', label: 'Contact Form' },
    { key: 'payment', label: 'Payment' },
    { key: 'general', label: 'General' }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="flex items-center justify-between cursor-pointer py-2">
          <span className="flex items-center gap-2 text-sm text-gray-700">
            <Eye className="w-4 h-4 text-gray-400" /> Show prices
          </span>
          <input
            type="checkbox"
            checked={config.showPrices}
            onChange={e => setConfig(prev => ({ ...prev, showPrices: e.target.checked }))}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer py-2">
          <span className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4 text-gray-400" /> Show durations
          </span>
          <input
            type="checkbox"
            checked={config.showDurations}
            onChange={e => setConfig(prev => ({ ...prev, showDurations: e.target.checked }))}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </label>
      </div>

      {/* Accent Color */}
      <div className="flex items-center justify-between py-2">
        <span className="flex items-center gap-2 text-sm text-gray-700">
          <Palette className="w-4 h-4 text-gray-400" /> Accent color
        </span>
        <div className="flex items-center gap-2">
          {config.accentColor && (
            <button
              onClick={() => setConfig(prev => ({ ...prev, accentColor: null }))}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Reset
            </button>
          )}
          <input
            type="color"
            value={accent}
            onChange={e => setConfig(prev => ({ ...prev, accentColor: e.target.value }))}
            className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );

  const renderContactSettings = () => (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Configure which fields customers fill out when booking. Drag to reorder.</p>
      <div className="space-y-2">
        {config.contactFields.map((field, i) => {
          const Icon = FIELD_ICONS[field.key] || FileText;
          return (
            <div key={field.key} className={`border rounded-xl p-3 transition-all ${field.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 cursor-grab" />
                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={field.label}
                  onChange={e => updateContactField(i, 'label', e.target.value)}
                  className="flex-1 text-sm font-medium text-gray-900 bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-blue-400 transition-colors px-1"
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 cursor-pointer" title="Enabled">
                    <input
                      type="checkbox"
                      checked={field.enabled}
                      onChange={e => updateContactField(i, 'enabled', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                    <span className="text-[10px] text-gray-400">On</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer" title="Required">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={e => updateContactField(i, 'required', e.target.checked)}
                      disabled={!field.enabled}
                      className="w-4 h-4 rounded border-gray-300 text-red-500 cursor-pointer disabled:opacity-40"
                    />
                    <span className="text-[10px] text-gray-400">Req</span>
                  </label>
                  {field.removable && (
                    <button
                      onClick={() => removeContactField(i)}
                      className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {field.enabled && (
                <div className="flex items-center gap-2 mt-2 ml-10">
                  <select
                    value={field.type}
                    onChange={e => updateContactField(i, 'type', e.target.value)}
                    className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600 outline-none focus:border-blue-400"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="tel">Phone</option>
                    <option value="textarea">Text Area</option>
                    <option value="number">Number</option>
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={addContactField}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium py-2 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Custom Field
      </button>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Choose how payment is handled when a customer books.</p>
      <div className="space-y-2">
        {PAYMENT_MODES.map(({ value, label, desc, icon: Icon }) => {
          const selected = config.paymentMode === value;
          return (
            <button
              key={value}
              onClick={() => {
                setConfig(prev => ({ ...prev, paymentMode: value }));
                // Auto-navigate preview to payment step when selecting a payment mode
                if (value !== 'none') setPreviewStep('payment');
              }}
              className={`w-full text-left border-2 rounded-xl p-3.5 transition-all ${
                selected ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${selected ? 'text-blue-900' : 'text-gray-900'}`}>{label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                </div>
                {selected && (
                  <div className="ml-auto flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Deposit settings — only for 'pay_at_booking' */}
      {config.paymentMode === 'pay_at_booking' && (
        <div className="border-2 border-gray-100 rounded-xl p-4 space-y-3 mt-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <Percent className="w-4 h-4 text-gray-400" /> Require deposit only
            </span>
            <input
              type="checkbox"
              checked={config.depositEnabled}
              onChange={e => setConfig(prev => ({ ...prev, depositEnabled: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>
          {config.depositEnabled && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <select
                  value={config.depositType}
                  onChange={e => setConfig(prev => ({ ...prev, depositType: e.target.value }))}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                >
                  <option value="percent">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
                <div className="flex items-center gap-1">
                  {config.depositType === 'fixed' && <span className="text-sm text-gray-500">$</span>}
                  <input
                    type="number"
                    min="1"
                    max={config.depositType === 'percent' ? 99 : 9999}
                    value={config.depositAmount}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      setConfig(prev => ({ ...prev, depositAmount: isNaN(val) ? '' : val }));
                    }}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400"
                  />
                  {config.depositType === 'percent' && <span className="text-sm text-gray-500">%</span>}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {config.depositType === 'percent'
                  ? `${config.depositAmount || 0}% of the service total collected at booking`
                  : `$${config.depositAmount || 0} collected at booking`}
                , remainder due at appointment.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderStepSettings = () => (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Customize the title & subtitle shown at each step of the booking flow.</p>
      {STEP_KEYS.filter(k => !(k === 'payment' && config.paymentMode === 'none')).map(key => {
        const step = config.steps[key] || {};
        return (
          <div
            key={key}
            className={`border rounded-xl p-3 transition-all cursor-pointer ${previewStep === key ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}
            onClick={() => setPreviewStep(key)}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center">
                {visibleSteps.indexOf(key) + 1}
              </span>
              <span className="text-sm font-semibold text-gray-900">{STEP_LABELS[key]}</span>
            </div>
            <input
              type="text"
              value={step.title || ''}
              onChange={e => updateStep(key, 'title', e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Title"
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 mb-1.5"
            />
            <input
              type="text"
              value={step.subtitle || ''}
              onChange={e => updateStep(key, 'subtitle', e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Subtitle (optional)"
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 outline-none focus:border-blue-400"
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-gray-50 w-[95vw] max-w-[1200px] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Booking Widget Configuration</h2>
            <p className="text-xs text-gray-500 mt-0.5">Configure how customers book appointments on your website</p>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <CheckCircle className="w-4 h-4" /> Saved
              </span>
            )}
            {error && <span className="text-sm text-red-600">{error}</span>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors flex items-center gap-2"
            >
              {saving ? <><Loader className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader className="w-6 h-6 text-gray-400 animate-spin" />
            <span className="ml-3 text-gray-500">Loading configuration...</span>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Left — Preview */}
            <div className="w-1/2 flex flex-col bg-gradient-to-br from-gray-100 to-gray-200/80 border-r border-gray-200">
              {/* Step navigator */}
              <div className="flex items-center justify-center gap-2 py-4 px-4 shrink-0">
                <button
                  onClick={goPrevPreview}
                  disabled={visibleSteps.indexOf(previewStep) === 0}
                  className="p-1.5 rounded-lg hover:bg-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div className="flex items-center gap-1">
                  {visibleSteps.map(k => (
                    <button
                      key={k}
                      onClick={() => {
                        setPreviewStep(k);
                        if (k === 'contact') setSettingsTab('contact');
                        else if (k === 'payment') setSettingsTab('payment');
                        else setSettingsTab('steps');
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        previewStep === k
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                      }`}
                    >
                      {STEP_LABELS[k]}
                    </button>
                  ))}
                </div>
                <button
                  onClick={goNextPreview}
                  disabled={visibleSteps.indexOf(previewStep) === visibleSteps.length - 1}
                  className="p-1.5 rounded-lg hover:bg-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              {/* Preview widget */}
              <div className="flex-1 overflow-y-auto flex items-start justify-center px-6 pb-6">
                <BookingPreview config={config} previewStep={previewStep} accent={accent} liveCategories={liveCategories} liveServices={liveServices} />
              </div>
            </div>

            {/* Right — Settings */}
            <div className="w-1/2 flex flex-col bg-white">
              {/* Service setup status */}
              {liveCategories.length > 0 ? (
                <div className="mx-4 mt-3 mb-1 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="text-[11px] text-green-700">
                    {liveCategories.length} categor{liveCategories.length === 1 ? 'y' : 'ies'} and {liveServices.filter(s => !s.is_addon).length} service{liveServices.filter(s => !s.is_addon).length !== 1 ? 's' : ''} found — preview uses your real data
                  </span>
                </div>
              ) : !loading && (
                <div className="mx-4 mt-3 mb-1 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span className="text-[11px] text-amber-700">
                    No service categories added yet — add categories in <strong>Services</strong> to see real data in the preview
                  </span>
                </div>
              )}
              {/* Settings tabs */}
              <div className="flex border-b border-gray-200 px-4 shrink-0">
                {SETTINGS_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setSettingsTab(tab.key)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      settingsTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {/* Settings content */}
              <div className="flex-1 overflow-y-auto p-5">
                {settingsTab === 'general' && renderGeneralSettings()}
                {settingsTab === 'contact' && renderContactSettings()}
                {settingsTab === 'payment' && renderPaymentSettings()}
                {settingsTab === 'steps' && renderStepSettings()}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
