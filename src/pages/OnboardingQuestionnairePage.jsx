import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle, Zap, Star, Mail, Users,
  ChevronRight, ChevronLeft, Check, ArrowRight, Sparkles, TrendingUp,
  Briefcase, Plus, X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const BUSINESS_TYPES = [
  'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Landscaping / Lawn Care',
  'Cleaning / Janitorial', 'Painting', 'Carpentry / General Contractor',
  'Pest Control', 'Pool Service', 'Tree Service', 'Flooring',
  'Appliance Repair', 'Auto Detailing', 'Moving', 'Other',
];

const LEAD_OPTIONS = [
  { value: '0-5',  label: '0 – 5',   sub: 'Just getting started' },
  { value: '5-15', label: '5 – 15',  sub: 'Steady flow of prospects' },
  { value: '15-30',label: '15 – 30', sub: 'Consistently busy' },
  { value: '30+',  label: '30+',     sub: 'High-volume operation' },
];

const REVENUE_OPTIONS = [
  { value: 'under_100k', label: 'Under $100k',     sub: 'Growing business' },
  { value: '100k_300k',  label: '$100k – $300k',   sub: 'Established & scaling' },
  { value: '300k_1m',    label: '$300k – $1M',     sub: 'Strong revenue base' },
  { value: '1m_plus',    label: '$1M+',             sub: 'Enterprise level' },
];

const FEATURE_OPTIONS = [
  {
    value: 'ai_chat',
    icon: MessageCircle,
    label: 'AI Chat Agent',
    sub: '24/7 lead capture & qualification on your site',
    color: 'blue',
    firstStep: 'Deploy your AI Chat Agent on your website from the AI Agents tab.',
  },
  {
    value: 'sms_followup',
    icon: Zap,
    label: 'SMS Lead Follow-up',
    sub: 'Auto-text new leads within 60 seconds of contact',
    color: 'amber',
    firstStep: 'Enable the SMS Lead Agent in the AI Agents tab — it starts working immediately.',
  },
  {
    value: 'reviews',
    icon: Star,
    label: 'Review Automation',
    sub: 'Auto-request Google reviews after every completed job',
    color: 'yellow',
    firstStep: 'Add your Google Review link in Business Settings to start collecting reviews.',
  },
  {
    value: 'email_marketing',
    icon: Mail,
    label: 'AI Email Marketing',
    sub: 'Weekly AI-written campaigns sent to past customers',
    color: 'purple',
    firstStep: 'Set up your email list in the Email Campaigns tab to launch your first campaign.',
  },
  {
    value: 'seo_audit',
    icon: TrendingUp,
    label: 'Website SEO Audit',
    sub: "See exactly what's holding your site back in search rankings",
    color: 'green',
    firstStep: 'Run your first SEO audit from the SEO Analyzer tab to find quick wins.',
  },
  {
    value: 'crm',
    icon: Users,
    label: 'Smart CRM',
    sub: 'Manage all leads and customers in one place',
    color: 'rose',
    firstStep: 'Import your existing customer list in the Customers & Leads tab to get started.',
  },
];

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-400',   icon: 'text-blue-600',   ring: 'ring-blue-400' },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-400',  icon: 'text-amber-600',  ring: 'ring-amber-400' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-400', icon: 'text-yellow-600', ring: 'ring-yellow-400' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-400', icon: 'text-purple-600', ring: 'ring-purple-400' },
  green:  { bg: 'bg-green-50',  border: 'border-green-400',  icon: 'text-green-600',  ring: 'ring-green-400' },
  rose:   { bg: 'bg-rose-50',   border: 'border-rose-400',   icon: 'text-rose-600',   ring: 'ring-rose-400' },
};

const TOTAL_STEPS = 4;

export default function OnboardingQuestionnairePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Step 1 — Business profile
  const [businessType, setBusinessType] = useState('');
  const [customBusinessType, setCustomBusinessType] = useState('');
  const [serviceInput, setServiceInput] = useState('');
  const [services, setServices] = useState([]);
  const [knownFor, setKnownFor] = useState('');

  // Step 2 — Leads
  const [leadsPerWeek, setLeadsPerWeek] = useState('');
  // Step 3 — Revenue
  const [revenueRange, setRevenueRange] = useState('');
  // Step 4 — Feature interest
  const [interestedFeature, setInterestedFeature] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.questionnaire_completed) { navigate('/dashboard', { replace: true }); }
  }, [navigate]);

  const goTo = (next) => {
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 220);
  };

  const addService = () => {
    const s = serviceInput.trim();
    if (s && !services.includes(s) && services.length < 10) {
      setServices([...services, s]);
      setServiceInput('');
    }
  };

  const removeService = (s) => setServices(services.filter(x => x !== s));

  const handleServiceKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addService(); }
  };

  const finalBusinessType = businessType === 'Other' ? customBusinessType.trim() : businessType;
  const step1Valid = finalBusinessType && services.length > 0 && knownFor.trim();

  const handleFinish = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/auth/onboarding/questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          businessType: finalBusinessType,
          businessServices: services.join(', '),
          businessKnownFor: knownFor.trim(),
          leadsPerWeek,
          revenueRange,
          interestedFeature,
        }),
      });
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...user, questionnaire_completed: true }));
    } catch (_) {}
    finally {
      setSaving(false);
      navigate('/dashboard');
    }
  };

  const selectedFeature = FEATURE_OPTIONS.find(f => f.value === interestedFeature);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-blue-600 rounded-lg" />
          <span className="font-bold text-gray-900 text-lg tracking-tight">SORCE</span>
        </div>
        {step < TOTAL_STEPS && (
          <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Skip for now
          </button>
        )}
      </div>

      {/* Progress dots */}
      {step < TOTAL_STEPS && (
        <div className="flex items-center justify-center gap-2 mt-2 mb-1">
          {Array.from({ length: TOTAL_STEPS - 1 }, (_, i) => i + 1).map(n => (
            <div
              key={n}
              className={`rounded-full transition-all duration-300 ${
                n === step ? 'w-8 h-2 bg-gradient-to-r from-amber-500 to-blue-600'
                : n < step ? 'w-2 h-2 bg-blue-400'
                : 'w-2 h-2 bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div
        className="flex-1 flex items-center justify-center px-4 py-8"
        style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(10px)' : 'translateY(0)', transition: 'opacity 0.22s ease, transform 0.22s ease' }}
      >
        <div className="w-full max-w-2xl">

          {/* ── Step 1: Business profile ── */}
          {step === 1 && (
            <div>
              <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-2 text-center">Question 1 of 3</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-2">
                Tell us about your business
              </h1>
              <p className="text-gray-500 text-center mb-8">This helps SORCE's AI agents represent you accurately.</p>

              {/* Business type */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Briefcase className="w-4 h-4 inline mr-1.5 text-gray-400" />
                  What type of business do you run?
                </label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => setBusinessType(t)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                        businessType === t
                          ? 'border-amber-500 bg-amber-50 text-amber-800'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {businessType === 'Other' && (
                  <input
                    type="text"
                    value={customBusinessType}
                    onChange={e => setCustomBusinessType(e.target.value)}
                    placeholder="Describe your business type"
                    className="mt-3 w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-400 outline-none"
                  />
                )}
              </div>

              {/* Services */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What services do you provide?
                  <span className="text-gray-400 font-normal ml-1">(add up to 10)</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={serviceInput}
                    onChange={e => setServiceInput(e.target.value)}
                    onKeyDown={handleServiceKeyDown}
                    placeholder="e.g. Drain cleaning, Water heater install…"
                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-400 outline-none"
                  />
                  <button
                    onClick={addService}
                    disabled={!serviceInput.trim() || services.length >= 10}
                    className="px-4 py-2.5 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 transition-all disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {services.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {services.map(s => (
                      <span key={s} className="flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-full">
                        {s}
                        <button onClick={() => removeService(s)} className="text-blue-400 hover:text-blue-700">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Known for */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What are you known for / what makes you stand out?
                </label>
                <textarea
                  value={knownFor}
                  onChange={e => setKnownFor(e.target.value)}
                  rows={3}
                  placeholder="e.g. Same-day service, 20 years of experience, family-owned, 5-star rated…"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-amber-400 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => goTo(2)}
                  disabled={!step1Valid}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold text-base hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Leads per week ── */}
          {step === 2 && (
            <div>
              <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-2 text-center">Question 2 of 3</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-2">
                How many leads do you get per week?
              </h1>
              <p className="text-gray-500 text-center mb-8">This helps us tailor your setup for the volume you're handling.</p>
              <div className="grid grid-cols-2 gap-3">
                {LEAD_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setLeadsPerWeek(opt.value)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all duration-150 hover:shadow-md ${
                      leadsPerWeek === opt.value
                        ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xl font-bold text-gray-900">{opt.label}</span>
                      {leadsPerWeek === opt.value && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{opt.sub}</span>
                  </button>
                ))}
              </div>
              <div className="mt-8 flex items-center justify-between">
                <button onClick={() => goTo(1)} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => goTo(3)}
                  disabled={!leadsPerWeek}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold text-base hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Revenue range ── */}
          {step === 3 && (
            <div>
              <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-2 text-center">Question 3 of 3</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-2">
                What excites you most about SORCE?
              </h1>
              <p className="text-gray-500 text-center mb-8">We'll make sure this is the first thing you see in your dashboard.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURE_OPTIONS.map(feat => {
                  const Icon = feat.icon;
                  const c = COLOR_MAP[feat.color];
                  const selected = interestedFeature === feat.value;
                  return (
                    <button
                      key={feat.value}
                      onClick={() => setInterestedFeature(feat.value)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all duration-150 hover:shadow-md flex items-start gap-3 ${
                        selected ? `${c.border} ${c.bg} shadow-md` : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${selected ? c.bg : 'bg-gray-100'} flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-5 h-5 ${selected ? c.icon : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-gray-900 text-sm">{feat.label}</span>
                          {selected && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{feat.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex items-center justify-between">
                <button onClick={() => goTo(2)} className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => goTo(4)}
                  disabled={!interestedFeature}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold text-base hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  See my setup <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Personalized welcome ── */}
          {step === 4 && selectedFeature && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">You're all set!</h1>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                Based on your answers, here's your personalized plan to get the most out of SORCE.
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 text-left mb-6 max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl ${COLOR_MAP[selectedFeature.color].bg}`}>
                    <selectedFeature.icon className={`w-6 h-6 ${COLOR_MAP[selectedFeature.color].icon}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Your #1 priority</p>
                    <p className="font-bold text-gray-900">{selectedFeature.label}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{selectedFeature.sub}.</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Your first step</p>
                  <p className="text-sm text-gray-800 font-medium">{selectedFeature.firstStep}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-6 mb-8 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{leadsPerWeek || '—'}</p>
                  <p className="text-xs text-gray-400">leads/week</p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">growth ready</p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">14</p>
                  <p className="text-xs text-gray-400">day free trial</p>
                </div>
              </div>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all mx-auto disabled:opacity-60"
              >
                {saving ? 'Getting ready…' : 'Go to my dashboard'}
                {!saving && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
