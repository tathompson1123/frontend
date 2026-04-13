import { useState, useEffect } from 'react';
import {
  Search,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MapPin,
  Globe,
  Zap,
  FileText,
  Code,
  Image,
  Cpu,
  ClipboardList,
  Clock,
  ArrowRight,
} from 'lucide-react';
import OakameLoader from '../OakameLoader';

// ── Helpers ──────────────────────────────────────────────────
function scoreColor(score) {
  if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-400', bar: 'bg-green-500' };
  if (score >= 50) return { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-400', bar: 'bg-amber-500' };
  return { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-400', bar: 'bg-red-500' };
}

function ScoreBadge({ score, size = 'sm' }) {
  const c = scoreColor(score);
  const sizeClass = size === 'lg' ? 'text-5xl font-black w-32 h-32' : 'text-xl font-bold w-16 h-16';
  return (
    <div className={`rounded-full flex items-center justify-center ring-4 ${c.ring} ${c.bg} ${c.text} ${sizeClass} shrink-0`}>
      {score}
    </div>
  );
}

const CATEGORY_ICONS = {
  technical: Code,
  onPage: FileText,
  content: FileText,
  performance: Zap,
  schema: Code,
  localSeo: MapPin,
  aiReadiness: Cpu,
};

function CategoryCard({ catKey, cat }) {
  const [open, setOpen] = useState(false);
  const c = scoreColor(cat.score);
  const Icon = CATEGORY_ICONS[catKey] || Globe;
  const issueCount = (cat.issues || []).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-gray-900 text-sm">{cat.label}</span>
            <span className={`text-sm font-bold ${c.text}`}>{cat.score}/100</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${c.bar}`}
              style={{ width: `${cat.score}%` }}
            />
          </div>
          {issueCount > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {issueCount} issue{issueCount !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {(cat.issues || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Issues</p>
              <ul className="space-y-1">
                {cat.issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(cat.passes || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Passing</p>
              <ul className="space-y-1">
                {cat.passes.map((pass, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    {pass}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ACTION_COLORS = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  low: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
};

const ACTION_LABELS = {
  critical: 'Critical',
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Low Priority',
};

function ActionSection({ priority, items }) {
  const [open, setOpen] = useState(priority === 'critical');
  const c = ACTION_COLORS[priority];
  if (!items || items.length === 0) return null;

  return (
    <div className={`rounded-xl border ${c.border} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-5 py-4 ${c.bg} hover:opacity-90 transition-opacity text-left`}
      >
        <div className="flex items-center gap-3">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${c.dot}`} />
          <span className="font-semibold text-gray-900">{ACTION_LABELS[priority]}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
            {items.length} action{items.length !== 1 ? 's' : ''}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {open && (
        <div className="divide-y divide-gray-100 bg-white">
          {items.map((item, i) => (
            <div key={i} className="px-5 py-4">
              <p className="font-semibold text-gray-900 text-sm mb-1">{item.title}</p>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Loading Screens ──────────────────────────────────────────
const AUDIT_TASKS = [
  { label: 'Fetching page HTML', icon: Globe },
  { label: 'Analyzing title & meta description', icon: FileText },
  { label: 'Checking heading structure', icon: FileText },
  { label: 'Evaluating content quality', icon: TrendingUp },
  { label: 'Scanning schema markup', icon: Code },
  { label: 'Checking image optimization', icon: Image },
  { label: 'Analyzing local SEO signals', icon: MapPin },
  { label: 'Scoring AI search readiness', icon: Cpu },
  { label: 'Estimating performance signals', icon: Zap },
  { label: 'Calculating overall score', icon: TrendingUp },
];

const PLAN_TASKS = [
  { label: 'Reviewing audit findings', icon: Search },
  { label: 'Identifying critical issues', icon: AlertCircle },
  { label: 'Prioritizing quick wins', icon: Zap },
  { label: 'Building Phase 1 — Critical Fixes', icon: ClipboardList },
  { label: 'Building Phase 2 — High Impact', icon: ClipboardList },
  { label: 'Building Phase 3 — Polish & Optimization', icon: ClipboardList },
  { label: 'Writing step-by-step instructions', icon: FileText },
  { label: 'Finalizing your optimization plan', icon: CheckCircle },
];

const LAST_STEP_MESSAGES = [
  'Hang tight, almost there…',
  'Still crunching the numbers…',
  'Running final calculations…',
  'Nearly done, just a moment…',
];

function LoadingScreen({ tasks, title, subtitle, accentClass }) {
  const [completedCount, setCompletedCount] = useState(0);
  const [dots, setDots] = useState('');
  const [lastStepMsgIdx, setLastStepMsgIdx] = useState(0);

  const isOnLastStep = completedCount === tasks.length - 1;

  useEffect(() => {
    // Advance one task every ~1.8s, stopping before the last (it completes when response arrives)
    const interval = setInterval(() => {
      setCompletedCount(c => (c < tasks.length - 1 ? c + 1 : c));
    }, 1800);

    // Animate dots on the active task
    const dotInterval = setInterval(() => {
      setDots(d => (d.length >= 3 ? '' : d + '.'));
    }, 400);

    return () => {
      clearInterval(interval);
      clearInterval(dotInterval);
    };
  }, [tasks.length]);

  // Cycle through "still working" messages on the last step
  useEffect(() => {
    if (!isOnLastStep) return;
    const msgInterval = setInterval(() => {
      setLastStepMsgIdx(i => (i + 1) % LAST_STEP_MESSAGES.length);
    }, 2200);
    return () => clearInterval(msgInterval);
  }, [isOnLastStep]);

  const activeIdx = completedCount;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className={`w-16 h-16 rounded-2xl ${accentClass.iconBg} flex items-center justify-center mx-auto mb-4`}>
          <Search className={`w-8 h-8 ${accentClass.iconText}`} />
        </div>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${accentClass.bar}`}
          style={{ width: `${Math.round((completedCount / (tasks.length - 1)) * 100)}%` }}
        />
      </div>

      {/* Task list */}
      <div className="space-y-2 max-w-sm mx-auto">
        {tasks.map((task, i) => {
          const Icon = task.icon;
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                active
                  ? `${accentClass.activeBg} border ${accentClass.activeBorder}`
                  : done
                  ? 'opacity-50'
                  : 'opacity-20'
              }`}
            >
              {done ? (
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              ) : active ? (
                <div className={`w-4 h-4 rounded-full border-2 ${accentClass.spinnerBorder} border-t-transparent animate-spin shrink-0`} />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
              )}
              <span className={`text-sm font-medium ${active ? accentClass.activeText : done ? 'text-gray-500' : 'text-gray-300'}`}>
                {active ? `${task.label}${dots}` : task.label}
              </span>
              {active && (
                <Icon className={`w-3.5 h-3.5 ${accentClass.iconText} ml-auto shrink-0`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Last-step "still working" animation */}
      {isOnLastStep && (
        <div className="mt-8 flex flex-col items-center gap-3 animate-fade-in">
          <OakameLoader size="md" color={accentClass.loaderColor || '#f59e0b'} />
          <p className="text-sm text-gray-400 font-medium transition-all duration-500">
            {LAST_STEP_MESSAGES[lastStepMsgIdx]}
          </p>
        </div>
      )}
    </div>
  );
}

function AuditLoadingScreen() {
  return (
    <LoadingScreen
      tasks={AUDIT_TASKS}
      title="Sorce is analyzing your website SEO"
      subtitle="This takes 15–30 seconds. We're checking every factor that affects your ranking."
      accentClass={{
        iconBg: 'bg-blue-100',
        iconText: 'text-blue-600',
        bar: 'bg-gradient-to-r from-blue-500 to-indigo-500',
        activeBg: 'bg-blue-50',
        activeBorder: 'border-blue-200',
        activeText: 'text-blue-800',
        spinnerBorder: 'border-blue-500',
        loaderColor: '#3b82f6',
      }}
    />
  );
}

function PlanLoadingScreen() {
  return (
    <LoadingScreen
      tasks={PLAN_TASKS}
      title="Building your SEO optimization plan"
      subtitle="Sorce is creating step-by-step instructions for every improvement."
      accentClass={{
        iconBg: 'bg-amber-100',
        iconText: 'text-amber-600',
        bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
        activeBg: 'bg-amber-50',
        activeBorder: 'border-amber-200',
        activeText: 'text-amber-800',
        spinnerBorder: 'border-amber-500',
        loaderColor: '#f59e0b',
      }}
    />
  );
}

// ── Main Component ────────────────────────────────────────────
const ANALYZING_WORDS = ['Analyzing', 'Crunching', 'Auditing', 'Scanning', 'Inspecting', 'Scoring'];

export default function SEOAudit({ apiUrl, user, authFetch, inOnboarding }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzingIdx, setAnalyzingIdx] = useState(0);
  const [error, setError] = useState('');
  const [audit, setAudit] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const [platform, setPlatform] = useState('');

  // Cycle button label while loading
  useEffect(() => {
    if (!loading) { setAnalyzingIdx(0); return; }
    const iv = setInterval(() => setAnalyzingIdx(i => (i + 1) % ANALYZING_WORDS.length), 1400);
    return () => clearInterval(iv);
  }, [loading]);

  // Load last saved audit + pre-fill URL
  useEffect(() => {
    const init = async () => {
      try {
        // Load last audit
        const auditRes = await authFetch(`${apiUrl}/api/seo-audit/last`);
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          if (auditData.audit) {
            setAudit(auditData.audit);
            setUrl(auditData.audit.url || '');
            setSavedAt(auditData.savedAt);
            if (auditData.plan) setPlan(auditData.plan);
            return; // URL already set from saved audit
          }
        }
      } catch { /* ignore */ }

      // Fallback: pre-fill from website settings
      try {
        const res = await authFetch(`${apiUrl}/api/website`);
        if (!res.ok) return;
        const data = await res.json();
        const site = data.website;
        if (!site) return;
        if (site.domain) setUrl(`https://${site.domain}`);
        else if (site.subdomain) setUrl(`https://${site.subdomain}.sorceintegrations.com`);
      } catch { /* ignore */ }
    };
    init();
  }, []);

  const runAudit = async () => {
    let cleanUrl = url.trim();
    if (!cleanUrl) {
      setError('Please enter a website URL.');
      return;
    }
    // Auto-prepend https:// if no protocol
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
      setUrl(cleanUrl);
    }
    setLoading(true);
    setError('');
    setAudit(null);
    setPlan(null);
    try {
      const res = await authFetch(`${apiUrl}/api/seo-audit/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run audit');
      setAudit(data.audit);
      setSavedAt(new Date().toISOString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (selectedPlatform) => {
    setLoadingPlan(true);
    setPlanError('');
    setPlan(null);
    try {
      const res = await authFetch(`${apiUrl}/api/seo-audit/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audit, platform: selectedPlatform || platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan');
      setPlan(data.plan);
    } catch (err) {
      setPlanError(err.message);
    } finally {
      setLoadingPlan(false);
    }
  };

  const overallColor = audit ? scoreColor(audit.score) : null;

  // Onboarding flow
  const [flowSEO] = useState(() => {
    try { return JSON.parse(localStorage.getItem('onboarding_flow') || '{}'); } catch { return {}; }
  });
  const [seoFlowDone, setSeoFlowDone] = useState(!!flowSEO.flow_seo);

  const markSEODone = () => {
    const flow = { ...flowSEO };
    flow.flow_seo = true;
    localStorage.setItem('onboarding_flow', JSON.stringify(flow));
    window.dispatchEvent(new CustomEvent('flow-step-done', { detail: { key: 'flow_seo' } }));
    setSeoFlowDone(true);
  };

  return (
    <div className="space-y-6">
      {/* Onboarding banner — hidden during the main onboarding flow (replaced by inline nudge below results) */}
      {!seoFlowDone && !inOnboarding && (
        <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-teal-900 text-sm">Getting Started · Step 3: SEO Audit</span>
          </div>
          {!audit ? (
            <p className="text-sm text-gray-600">Run the full audit to get your personalized SEO game plan. Enter your website URL below and hit "Run Audit".</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 font-medium">
                Don't worry, we'll implement the SEO plan later. Now let's audit your Google Business Profile next. 👇
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={markSEODone}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:shadow-md transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  Continue to GBP Audit →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header — hidden during onboarding (OnboardingScreen already shows step title) */}
      {!inOnboarding && (
        <div>
          <h2 className="text-3xl font-bold text-gray-900">SEO Audit</h2>
          <p className="text-gray-600 mt-1">
            AI-powered SEO analysis for your business website
            {savedAt && (
              <span className="ml-2 text-xs text-gray-400">
                · Last run {new Date(savedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Onboarding nudge — shown above URL input once audit is complete */}
      {inOnboarding && audit && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <Search className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-blue-900 text-sm">Your SEO baseline is saved.</p>
            <p className="text-blue-700 text-sm mt-0.5">We'll build your full optimization plan once you're set up. Next, let's audit your Google Business Profile.</p>
          </div>
          <button
            onClick={() => {
              const flow = JSON.parse(localStorage.getItem('onboarding_flow') || '{}');
              flow.flow_seo = true;
              localStorage.setItem('onboarding_flow', JSON.stringify(flow));
              window.dispatchEvent(new CustomEvent('flow-step-done', { detail: { key: 'flow_seo' } }));
            }}
            className="shrink-0 flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Website URL to Audit
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && runAudit()}
                placeholder="https://yourbusiness.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the full URL of any website to analyze — your own or a competitor's
            </p>
          </div>
          <button
            onClick={runAudit}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                {ANALYZING_WORDS[analyzingIdx]}…
              </>
            ) : audit ? (
              <>
                <RefreshCw className="w-5 h-5" />
                Re-run Audit
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Run SEO Audit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Loading State — Audit */}
      {loading && (
        <AuditLoadingScreen />
      )}

      {/* Results — Step-by-step tabs */}
      {audit && !loading && (() => {
        const STEPS = inOnboarding
          ? [
              { id: 'score', label: 'Score' },
              { id: 'categories', label: 'Categories' },
              { id: 'issues', label: 'Issues & Wins' },
            ]
          : [
              { id: 'score', label: 'Score' },
              { id: 'categories', label: 'Categories' },
              { id: 'issues', label: 'Issues & Wins' },
              { id: 'plan', label: 'Optimization Plan' },
            ];
        return (
          <>
            <AuditSteps
              audit={audit}
              plan={plan}
              loadingPlan={loadingPlan}
              planError={planError}
              onCreatePlan={createPlan}
              platform={platform}
              onPlatformChange={setPlatform}
              onRerun={runAudit}
              overallColor={overallColor}
              steps={STEPS}
              inOnboarding={inOnboarding}
            />
          </>
        );
      })()}
    </div>
  );
}

const PLATFORMS = [
  { id: 'wordpress',   label: 'WordPress',    emoji: '🔵' },
  { id: 'wix',         label: 'Wix',          emoji: '🟣' },
  { id: 'squarespace', label: 'Squarespace',  emoji: '⬛' },
  { id: 'shopify',     label: 'Shopify',      emoji: '🟢' },
  { id: 'webflow',     label: 'Webflow',      emoji: '🔷' },
  { id: 'godaddy',     label: 'GoDaddy',      emoji: '🟠' },
  { id: 'weebly',      label: 'Weebly',       emoji: '🔴' },
  { id: 'framer',      label: 'Framer',       emoji: '⚫' },
  { id: 'sorce',       label: 'SORCE',        emoji: '✨' },
  { id: 'custom',      label: 'Custom / Dev', emoji: '💻' },
  { id: 'bigcommerce', label: 'BigCommerce',  emoji: '🛒' },
  { id: 'other',       label: 'Other',        emoji: '🌐' },
];

function AuditSteps({ audit, plan, loadingPlan, planError, onCreatePlan, onRerun, overallColor, steps, platform, onPlatformChange, inOnboarding }) {
  const [activeStep, setActiveStep] = useState('score');

  return (
    <div className="space-y-4">
      {/* Step Nav */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
                activeStep === s.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mr-2 ${
                activeStep === s.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>{i + 1}</span>
              {s.label}
              {activeStep === s.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Step 1 — Score */}
          {activeStep === 'score' && (
            <div>
              <div className="flex flex-col sm:flex-row items-center gap-8 mb-6">
                <ScoreBadge score={audit.score} size="lg" />
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center gap-3 mb-2 justify-center sm:justify-start">
                    <h3 className="text-2xl font-bold text-gray-900">Overall SEO Score</h3>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${overallColor.bg} ${overallColor.text}`}>
                      {audit.score >= 80 ? 'Good' : audit.score >= 50 ? 'Needs Work' : 'Poor'}
                    </span>
                  </div>
                  {audit.businessType && (
                    <p className="text-sm text-blue-600 font-medium mb-3">
                      <Globe className="inline w-4 h-4 mr-1" />{audit.businessType}
                    </p>
                  )}
                  <p className="text-gray-600 text-sm leading-relaxed">{audit.summary}</p>
                  <p className="text-xs text-gray-400 mt-2">{audit.url}</p>
                </div>
              </div>
              <button onClick={() => setActiveStep('categories')} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                View Category Breakdown <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2 — Categories */}
          {activeStep === 'categories' && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Category Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {Object.entries(audit.categories || {}).map(([key, cat]) => (
                  <CategoryCard key={key} catKey={key} cat={cat} />
                ))}
              </div>
              <button onClick={() => setActiveStep('issues')} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                View Issues & Quick Wins <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 3 — Issues & Wins */}
          {activeStep === 'issues' && (
            <div className="space-y-5">
              {(audit.criticalIssues || []).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h4 className="font-bold text-red-800">Critical Issues</h4>
                    <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">{audit.criticalIssues.length}</span>
                  </div>
                  <ul className="space-y-2">
                    {audit.criticalIssues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />{issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(audit.quickWins || []).length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-green-600" />
                    <h4 className="font-bold text-green-800">Quick Wins</h4>
                    <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">{audit.quickWins.length}</span>
                  </div>
                  <ul className="space-y-2">
                    {audit.quickWins.map((win, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-green-500" />{win}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!inOnboarding && (
                <button onClick={() => setActiveStep('plan')} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Create SEO Optimization Plan <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Step 4 — Optimization Plan (dashboard only) */}
          {activeStep === 'plan' && !inOnboarding && (
            <div>
              {!plan && !loadingPlan && (
                <div className="space-y-6">
                  <div className="text-center">
                    <ClipboardList className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Create Your SEO Optimization Plan</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                      Select your website platform so SORCE can tailor every step to your exact editor.
                    </p>
                  </div>

                  {/* Platform picker */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">What platform is your website on?</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {PLATFORMS.map(p => (
                        <button
                          key={p.id}
                          onClick={() => onPlatformChange(p.id)}
                          className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all ${
                            platform === p.id
                              ? 'border-amber-400 bg-amber-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-xl">{p.emoji}</span>
                          <span className={`text-xs font-semibold leading-tight ${platform === p.id ? 'text-amber-800' : 'text-gray-700'}`}>
                            {p.label}
                          </span>
                          {platform === p.id && (
                            <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {planError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">{planError}</div>
                  )}

                  <button
                    onClick={() => onCreatePlan(platform)}
                    disabled={!platform}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-base hover:shadow-xl transition-all flex items-center gap-3 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ClipboardList className="w-5 h-5" />
                    {platform
                      ? `Create Plan for ${PLATFORMS.find(p => p.id === platform)?.label}`
                      : 'Select a platform to continue'}
                  </button>
                </div>
              )}

              {loadingPlan && <PlanLoadingScreen />}

              {plan && !loadingPlan && (
                <PlanViewer plan={plan} onRerun={onRerun} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Editor location hints ─────────────────────────────────────
function getEditorHint(step) {
  const text = `${step.title || ''} ${step.category || ''} ${(step.instructions || []).join(' ')}`.toLowerCase();

  // Meta title / page title
  if (/meta title|page title|title tag|seo title|<title/.test(text)) {
    return { label: 'Business Info → Business Name', sublabel: 'Sorce generates your page title from your business name and type' };
  }
  // Meta description
  if (/meta description|description tag/.test(text)) {
    return { label: 'Business Info → About / Services', sublabel: 'Sorce auto-generates meta descriptions — improve by filling out your business details' };
  }
  // H1 / headings / headline
  if (/\bh1\b|headline|main heading|hero text|hero heading|page heading/.test(text)) {
    return { label: 'Website Editor → Hero Section → Headline', sublabel: 'Click the Hero section in the editor to update your main headline' };
  }
  // H2/H3 headings
  if (/\bh2\b|\bh3\b|subheading|section heading/.test(text)) {
    return { label: 'Website Editor → Section → Edit Heading', sublabel: 'Click any section in the editor and update its title or subheading field' };
  }
  // Images / alt text
  if (/alt text|alt tag|image optim|compress image|image size|photo/.test(text)) {
    return { label: 'Website Editor → [Section] → Image Field', sublabel: 'Click any section with an image — the image field includes alt text and upload options' };
  }
  // Schema / structured data
  if (/schema|json-ld|structured data|local business schema|markup/.test(text)) {
    return { label: 'Business Info → Contact + Services tabs', sublabel: 'Sorce auto-generates LocalBusiness schema from your address, phone, hours, and services' };
  }
  // Phone number
  if (/phone number|telephone|phone/.test(text)) {
    return { label: 'Business Info → Contact Information → Phone', sublabel: 'Also appears in Website Editor → Contact Section and Footer Section' };
  }
  // Email address
  if (/\bemail\b/.test(text)) {
    return { label: 'Business Info → Contact Information → Email', sublabel: 'Also appears in Website Editor → Contact Section and Footer Section' };
  }
  // Physical address / NAP
  if (/address|nap consistency|street|city|zip|postal|location/.test(text)) {
    return { label: 'Business Info → Business Location', sublabel: 'Street address, city, state, and zip — used in schema and contact section' };
  }
  // Business hours
  if (/business hours|opening hours|hours of operation/.test(text)) {
    return { label: 'Business Info → Business Hours', sublabel: 'Set open/close times per day — auto-populates contact section and footer' };
  }
  // Services list
  if (/service list|services offered|service page|add.*service/.test(text)) {
    return { label: 'Business Info → Services Tab', sublabel: 'Add service name, description, price, and image — auto-populates your Services section' };
  }
  // Reviews / testimonials
  if (/review|testimonial|star rating|social proof/.test(text)) {
    return { label: 'Website Editor → Testimonials Section', sublabel: 'Add or update customer quotes, names, and star ratings in the Testimonials section' };
  }
  // About / bio / content
  if (/about page|about section|about.*business|company bio|who we are/.test(text)) {
    return { label: 'Website Editor → Content/About Section', sublabel: 'Click the About or Content section in the editor to update your business story and credentials' };
  }
  // CTA / call to action / buttons
  if (/call.to.action|cta button|\bbutton\b|book now|get a quote|contact us button/.test(text)) {
    return { label: 'Website Editor → Hero or CTA Section → Button Fields', sublabel: 'Update button text and links in the Hero or CTA section' };
  }
  // Social media
  if (/social media|facebook|instagram|twitter|tiktok|linkedin/.test(text)) {
    return { label: 'Website Editor → Footer Section → Social Media Links', sublabel: 'Add your social profile URLs in the Footer section editor' };
  }
  // Footer
  if (/footer|quick link|nav link|privacy policy/.test(text)) {
    return { label: 'Website Editor → Footer Section', sublabel: 'Edit business name, tagline, quick links, and social links in the Footer section' };
  }
  // Contact form
  if (/contact form|lead form|inquiry form/.test(text)) {
    return { label: 'Website Editor → Contact Section', sublabel: 'Update the form title, subtitle, and contact details in the Contact section' };
  }
  // Page speed / performance / compression
  if (/page speed|performance|compress|minif|core web vital|lcp|cls|inp|loading time/.test(text)) {
    return { label: 'Handled automatically by Sorce', sublabel: "Sorce's hosting and rendering pipeline handles speed optimization — no manual editor action needed" };
  }
  // Internal links
  if (/internal link|link building|anchor text/.test(text)) {
    return { label: 'Website Editor → Content/Services Sections → URL Fields', sublabel: 'Add links in content blocks and footer quick links via the section editor' };
  }
  // Google Business Profile
  if (/google business|gbp|google my business|gmb/.test(text)) {
    return { label: 'External: Google Business Profile (business.google.com)', sublabel: 'This is managed directly on Google — not in the Sorce editor' };
  }
  // Sitemap / robots
  if (/sitemap|robots\.txt|crawl|indexing/.test(text)) {
    return { label: 'Handled automatically by Sorce', sublabel: 'Sorce auto-generates your sitemap and robots.txt on publish' };
  }

  return null;
}

function PlanViewer({ plan, onRerun }) {
  const [activePhase, setActivePhase] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const phases = plan.phases || [];
  const currentPhase = phases[activePhase];
  const currentStep = currentPhase?.steps?.[activeStep];
  const isLastStep = activeStep === (currentPhase?.steps?.length || 1) - 1;
  const isLastPhase = activePhase === phases.length - 1;

  const PRIORITY_COLORS = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-blue-100 text-blue-700',
  };

  const goNext = () => {
    if (!isLastStep) {
      setActiveStep(s => s + 1);
    } else if (!isLastPhase) {
      setActivePhase(p => p + 1);
      setActiveStep(0);
    }
  };

  const goPrev = () => {
    if (activeStep > 0) {
      setActiveStep(s => s - 1);
    } else if (activePhase > 0) {
      setActivePhase(p => p - 1);
      setActiveStep((phases[activePhase - 1]?.steps?.length || 1) - 1);
    }
  };

  return (
    <div>
      {/* Plan header */}
      <div className="mb-5">
        <h3 className="text-xl font-bold text-gray-900">{plan.title}</h3>
        <p className="text-gray-500 text-sm mt-1">{plan.overview}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {plan.estimatedTimeTotal && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" /> Estimated: {plan.estimatedTimeTotal}
            </span>
          )}
          {plan.platform && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              <Globe className="w-3.5 h-3.5" /> {plan.platform}
            </span>
          )}
        </div>
      </div>

      {/* Phase tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {phases.map((ph, i) => (
          <button
            key={i}
            onClick={() => { setActivePhase(i); setActiveStep(0); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activePhase === i
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Phase {ph.phase}: {ph.title}
          </button>
        ))}
      </div>

      {/* Phase info */}
      {currentPhase && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-4 flex items-center gap-3">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-semibold text-amber-800 text-sm">{currentPhase.timeframe}</span>
            <span className="text-amber-700 text-sm"> — {currentPhase.description}</span>
          </div>
        </div>
      )}

      {/* Step progress dots */}
      {currentPhase?.steps?.length > 1 && (
        <div className="flex gap-2 mb-4">
          {currentPhase.steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === activeStep ? 'bg-amber-500 w-6' : 'bg-gray-200 w-2 hover:bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* Current step */}
      {currentStep && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 bg-amber-500 text-white text-sm font-bold rounded-full flex items-center justify-center shrink-0">
                  {currentStep.step}
                </span>
                <h4 className="text-lg font-bold text-gray-900">{currentStep.title}</h4>
              </div>
              <div className="flex items-center gap-2 ml-9">
                <span className="text-xs text-gray-500">{currentStep.category}</span>
                {currentStep.priority && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[currentStep.priority] || 'bg-gray-100 text-gray-600'}`}>
                    {currentStep.priority}
                  </span>
                )}
                {currentStep.timeEstimate && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{currentStep.timeEstimate}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {(currentStep.instructions || []).map((instruction, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <span className="w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-sm text-gray-700">{instruction}</p>
              </div>
            ))}
          </div>

          {currentStep.expectedImpact && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800"><span className="font-semibold">Expected impact:</span> {currentStep.expectedImpact}</p>
            </div>
          )}

          {/* Editor location hint */}
          {(() => {
            const hint = getEditorHint(currentStep);
            if (!hint) return null;
            return (
              <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-0.5">Where to find this in Sorce</p>
                  <p className="text-sm font-medium text-indigo-900">{hint.label}</p>
                  {hint.sublabel && <p className="text-xs text-indigo-600 mt-0.5">{hint.sublabel}</p>}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={goPrev}
          disabled={activePhase === 0 && activeStep === 0}
          className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <span className="text-xs text-gray-400">
          Step {activeStep + 1} of {currentPhase?.steps?.length || 1} · Phase {activePhase + 1} of {phases.length}
        </span>
        {isLastStep && isLastPhase ? (
          <button
            onClick={onRerun}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Run New Audit
          </button>
        ) : (
          <button
            onClick={goNext}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            Next Step <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
