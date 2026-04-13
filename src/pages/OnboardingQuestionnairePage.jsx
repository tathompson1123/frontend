import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle, Zap, Star, Mail, Users,
  ChevronRight, ChevronLeft, Check, ArrowRight, Sparkles, TrendingUp,
  Briefcase
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const BUSINESS_TYPES = [
  'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Landscaping / Lawn Care',
  'Cleaning / Janitorial', 'Painting', 'Carpentry / General Contractor',
  'Pest Control', 'Pool Service', 'Tree Service', 'Flooring',
  'Appliance Repair', 'Auto Detailing', 'Moving', 'Other',
];

const LEAD_OPTIONS = [
  { value: '0-10',   label: '0 – 10',   sub: 'Just getting started' },
  { value: '10-50',  label: '10 – 50',  sub: 'Building momentum' },
  { value: '50-150', label: '50 – 150', sub: 'Established & growing' },
  { value: '150+',   label: '150+',     sub: 'High-volume operation' },
];

const REVENUE_OPTIONS = [
  { value: 'under_100k', label: 'Under $100k',     sub: 'Growing business' },
  { value: '100k_300k',  label: '$100k – $300k',   sub: 'Established & scaling' },
  { value: '300k_1m',    label: '$300k – $1M',     sub: 'Strong revenue base' },
  { value: '1m_plus',    label: '$1M+',             sub: 'Enterprise level' },
];

// Mini illustrations for each feature card
const ChatIllustration = () => (
  <div className="flex flex-col gap-1.5 w-full px-3 pt-1">
    <div className="flex items-end gap-1.5">
      <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-700">V</div>
      <div className="bg-white rounded-2xl rounded-bl-none px-3 py-1.5 text-xs text-gray-700 shadow-sm max-w-[140px]">Hey! I need a quote 👋</div>
    </div>
    <div className="flex items-end gap-1.5 flex-row-reverse">
      <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"/></svg>
      </div>
      <div className="bg-blue-500 rounded-2xl rounded-br-none px-3 py-1.5 text-xs text-white shadow-sm max-w-[150px]">I'd love to help! What service do you need?</div>
    </div>
    <div className="flex items-end gap-1.5">
      <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-700">V</div>
      <div className="bg-white rounded-2xl rounded-bl-none px-3 py-1.5 text-xs text-gray-700 shadow-sm">AC repair, ASAP!</div>
    </div>
  </div>
);

const SmsIllustration = () => (
  <div className="flex flex-col items-center justify-center w-full h-full gap-2">
    <div className="relative">
      <div className="w-14 h-20 rounded-xl border-2 border-gray-300 bg-gray-800 flex flex-col items-center justify-end pb-1.5 gap-1">
        <div className="w-8 h-1 rounded bg-gray-600"/>
        <div className="w-3 h-3 rounded-full border border-gray-500"/>
      </div>
      <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">1</div>
    </div>
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[10px] text-amber-800 font-medium text-center leading-tight shadow-sm">
      ⚡ New lead from your site!<br/>Texting them now…
    </div>
  </div>
);

const ReviewIllustration = () => (
  <div className="flex flex-col items-center justify-center w-full h-full gap-2">
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-2.5 w-full mx-3">
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-[9px] font-bold text-white">G</div>
        <span className="text-[11px] font-semibold text-gray-700">Google Review</span>
      </div>
      <div className="flex gap-0.5 mb-1">
        {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400 text-sm">★</span>)}
      </div>
      <p className="text-[10px] text-gray-500 leading-tight">"Great service, highly recommend!"</p>
    </div>
    <div className="text-[10px] text-yellow-700 font-medium bg-yellow-50 rounded-lg px-2.5 py-1 border border-yellow-200">✓ Sent automatically after job</div>
  </div>
);

const EmailIllustration = () => (
  <div className="flex flex-col gap-1.5 w-full px-3">
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-800 px-3 py-1.5 flex items-center justify-between">
        <span className="text-white text-[10px] font-semibold">April Flash Sale 🔥</span>
        <span className="text-gray-400 text-[9px]">AI written</span>
      </div>
      <div className="px-3 py-2 space-y-1">
        <div className="h-1.5 bg-gray-200 rounded w-full"/>
        <div className="h-1.5 bg-gray-200 rounded w-4/5"/>
        <div className="h-1.5 bg-gray-200 rounded w-3/5"/>
        <div className="mt-2 bg-purple-500 rounded-lg py-1 px-2 text-white text-[9px] font-semibold text-center w-20">Book Now →</div>
      </div>
    </div>
  </div>
);

const SeoIllustration = () => (
  <div className="flex flex-col items-center justify-center w-full h-full gap-2 px-3">
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-gray-600">SEO Score</span>
        <span className="text-sm font-bold text-green-600">87</span>
      </div>
      <div className="flex items-end gap-1 h-8">
        {[40,55,45,65,72,80,87].map((h, i) => (
          <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: i === 6 ? '#22c55e' : `hsl(${140 + i*5}, 60%, ${65 + i*2}%)` }}/>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-gray-400">Before</span>
        <span className="text-[8px] text-green-600 font-medium">After SORCE</span>
      </div>
    </div>
  </div>
);

const CrmIllustration = () => (
  <div className="flex flex-col gap-1.5 w-full px-3">
    {[
      { name: 'John D.', status: 'New Lead', dot: 'bg-blue-400' },
      { name: 'Sarah M.', status: 'Quoted', dot: 'bg-amber-400' },
      { name: 'Mike R.', status: 'Booked ✓', dot: 'bg-green-400' },
    ].map((c, i) => (
      <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 px-3 py-1.5 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-[9px] font-bold text-rose-600">{c.name[0]}</div>
        <span className="text-[10px] font-semibold text-gray-700 flex-1">{c.name}</span>
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>
          <span className="text-[9px] text-gray-500">{c.status}</span>
        </div>
      </div>
    ))}
  </div>
);

const FEATURE_OPTIONS = [
  {
    value: 'ai_chat',
    icon: MessageCircle,
    label: 'AI Chat Agent',
    sub: '24/7 lead capture & qualification on your site',
    color: 'blue',
    firstStep: 'Deploy your AI Chat Agent on your website from the AI Agents tab.',
    illustration: ChatIllustration,
    illustrationBg: 'from-blue-50 to-blue-100',
  },
  {
    value: 'sms_followup',
    icon: Zap,
    label: 'SMS Lead Follow-up',
    sub: 'Auto-text new leads within 60 seconds of contact',
    color: 'amber',
    firstStep: 'Enable the SMS Lead Agent in the AI Agents tab — it starts working immediately.',
    illustration: SmsIllustration,
    illustrationBg: 'from-amber-50 to-amber-100',
  },
  {
    value: 'reviews',
    icon: Star,
    label: 'Review Automation',
    sub: 'Auto-request Google reviews after every completed job',
    color: 'yellow',
    firstStep: 'Add your Google Review link in Business Settings to start collecting reviews.',
    illustration: ReviewIllustration,
    illustrationBg: 'from-yellow-50 to-yellow-100',
  },
  {
    value: 'email_marketing',
    icon: Mail,
    label: 'AI Email Marketing',
    sub: 'Weekly AI-written campaigns sent to past customers',
    color: 'purple',
    firstStep: 'Set up your email list in the Email Campaigns tab to launch your first campaign.',
    illustration: EmailIllustration,
    illustrationBg: 'from-purple-50 to-purple-100',
  },
  {
    value: 'seo_audit',
    icon: TrendingUp,
    label: 'Website SEO Audit',
    sub: "See exactly what's holding your site back in search rankings",
    color: 'green',
    firstStep: 'Run your first SEO audit from the SEO Analyzer tab to find quick wins.',
    illustration: SeoIllustration,
    illustrationBg: 'from-green-50 to-green-100',
  },
  {
    value: 'crm',
    icon: Users,
    label: 'Smart CRM',
    sub: 'Manage all leads and customers in one place',
    color: 'rose',
    firstStep: 'Import your existing customer list in the Customers & Leads tab to get started.',
    illustration: CrmIllustration,
    illustrationBg: 'from-rose-50 to-rose-100',
  },
];

const COLOR_MAP = {
  blue:   { border: 'border-blue-400',   icon: 'text-blue-600',   iconBg: 'bg-blue-100',   check: 'bg-blue-500' },
  amber:  { border: 'border-amber-400',  icon: 'text-amber-600',  iconBg: 'bg-amber-100',  check: 'bg-amber-500' },
  yellow: { border: 'border-yellow-400', icon: 'text-yellow-600', iconBg: 'bg-yellow-100', check: 'bg-yellow-500' },
  purple: { border: 'border-purple-400', icon: 'text-purple-600', iconBg: 'bg-purple-100', check: 'bg-purple-500' },
  green:  { border: 'border-green-400',  icon: 'text-green-600',  iconBg: 'bg-green-100',  check: 'bg-green-500' },
  rose:   { border: 'border-rose-400',   icon: 'text-rose-600',   iconBg: 'bg-rose-100',   check: 'bg-rose-500' },
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
  const [servicesText, setServicesText] = useState('');
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
    if (!user.email_verified) { navigate('/verify-email', { replace: true }); return; }
    if (user.questionnaire_completed) { navigate('/dashboard', { replace: true }); }
  }, [navigate]);

  const goTo = (next) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 220);
  };

  const finalBusinessType = businessType === 'Other' ? customBusinessType.trim() : businessType;
  const step1Valid = finalBusinessType && servicesText.trim() && knownFor.trim();

  const handleFinish = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/auth/onboarding/questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          businessType: finalBusinessType,
          businessServices: servicesText.trim(),
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
                </label>
                <textarea
                  value={servicesText}
                  onChange={e => setServicesText(e.target.value)}
                  placeholder="e.g. Drain cleaning, water heater install, pipe repair…"
                  rows={3}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-amber-400 outline-none resize-none"
                />
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FEATURE_OPTIONS.map(feat => {
                  const Icon = feat.icon;
                  const c = COLOR_MAP[feat.color];
                  const selected = interestedFeature === feat.value;
                  const Illustration = feat.illustration;
                  return (
                    <button
                      key={feat.value}
                      onClick={() => setInterestedFeature(feat.value)}
                      className={`rounded-2xl border-2 text-left transition-all duration-150 hover:shadow-md overflow-hidden flex flex-col ${
                        selected ? `${c.border} shadow-md` : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {/* Illustration area */}
                      <div className={`bg-gradient-to-b ${feat.illustrationBg} h-28 flex items-center justify-center relative`}>
                        <Illustration />
                        {selected && (
                          <div className={`absolute top-2 right-2 w-5 h-5 ${c.check} rounded-full flex items-center justify-center shadow`}>
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      {/* Label area */}
                      <div className="p-3 bg-white flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${selected ? c.icon : 'text-gray-400'}`} />
                          <span className="font-semibold text-gray-900 text-xs leading-tight">{feat.label}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-snug">{feat.sub}</p>
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
