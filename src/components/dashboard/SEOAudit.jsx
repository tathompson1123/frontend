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
  Sparkles,
  ExternalLink,
  Loader2,
  Link,
} from 'lucide-react';
import OakameLoader from '../OakameLoader';
import BacklinksPage from './BacklinksPage';

// ── Helpers ──────────────────────────────────────────────────
function scoreColor(score) {
  if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-400', bar: 'bg-green-500' };
  if (score >= 65) return { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-400', bar: 'bg-blue-500' };
  if (score >= 45) return { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-400', bar: 'bg-amber-500' };
  return { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-400', bar: 'bg-red-500' };
}

function scoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 45) return 'Getting There';
  return 'Needs Work';
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

const APPLY_TASKS = [
  { label: 'Loading your SORCE website', icon: Globe },
  { label: 'Reading business information', icon: FileText },
  { label: 'Generating JSON-LD structured data', icon: Code },
  { label: 'Writing AI-ready meta tags', icon: Cpu },
  { label: 'Creating llms.txt for AI search engines', icon: FileText },
  { label: 'Injecting SEO code into your website', icon: Zap },
  { label: 'Saving and redeploying', icon: CheckCircle },
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
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(iv);
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  const subtitle = elapsed < 15
    ? `Scanning your website… ${timeStr}`
    : elapsed < 35
      ? `Still running — this usually takes 30–60 seconds… ${timeStr}`
      : elapsed < 75
        ? `Almost there, analyzing results… ${timeStr}`
        : `Taking a bit longer than usual — your site may have a lot to analyze… ${timeStr}`;

  return (
    <LoadingScreen
      tasks={AUDIT_TASKS}
      title="Sorce is analyzing your website SEO"
      subtitle={subtitle}
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

// ── Visitor chart (pure SVG, no external lib) ────────────
function SeoVisitorChart({ visits, seoCodeGeneratedAt }) {
  if (!visits || visits.length === 0) return null;

  const W = 600, H = 180, PL = 36, PR = 16, PT = 14, PB = 28;
  const cw = W - PL - PR, ch = H - PT - PB;
  const maxCount = Math.max(...visits.map(v => v.count), 1);

  const xAt = i => PL + (visits.length < 2 ? cw / 2 : (i / (visits.length - 1)) * cw);
  const yAt = c => PT + ch - (c / maxCount) * ch;

  const linePts = visits.map((v, i) => `${xAt(i)},${yAt(v.count)}`).join(' ');
  const areaPts = `${xAt(0)},${PT + ch} ${linePts} ${xAt(visits.length - 1)},${PT + ch}`;

  const appliedDate = seoCodeGeneratedAt ? seoCodeGeneratedAt.split('T')[0] : null;
  const appliedIdx = appliedDate ? visits.findIndex(v => v.date >= appliedDate) : -1;
  const appliedX = appliedIdx >= 0 ? xAt(appliedIdx) : null;

  const labelIdxs = [0, Math.floor((visits.length - 1) / 2), visits.length - 1].filter((v, i, a) => a.indexOf(v) === i && v >= 0 && v < visits.length);

  const yTicks = [0, 0.5, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="seoVisitGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map(f => (
        <line key={f} x1={PL} y1={PT + ch * (1 - f)} x2={W - PR} y2={PT + ch * (1 - f)}
          stroke="#f3f4f6" strokeWidth="1" />
      ))}

      {/* SEO code applied line */}
      {appliedX !== null && (
        <>
          <line x1={appliedX} y1={PT} x2={appliedX} y2={PT + ch}
            stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4,3" />
          <text x={appliedX + 4} y={PT + 10} fill="#7c3aed" fontSize="8.5" fontWeight="600">Code applied</text>
        </>
      )}

      {/* Area */}
      <polygon points={areaPts} fill="url(#seoVisitGrad)" />

      {/* Line */}
      <polyline points={linePts} fill="none" stroke="#8b5cf6" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {visits.map((v, i) => (
        <circle key={i} cx={xAt(i)} cy={yAt(v.count)} r="2.5"
          fill="#8b5cf6" stroke="white" strokeWidth="1.5" />
      ))}

      {/* Y labels */}
      {yTicks.map(f => (
        <text key={f} x={PL - 4} y={PT + ch * (1 - f) + 3.5} fill="#9ca3af"
          fontSize="8.5" textAnchor="end">
          {f === 0 ? 0 : f === 1 ? maxCount : Math.round(maxCount * f)}
        </text>
      ))}

      {/* X labels */}
      {labelIdxs.map(i => (
        <text key={i} x={xAt(i)} y={H - 4} fill="#9ca3af" fontSize="8.5" textAnchor="middle">
          {new Date(visits[i].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </text>
      ))}
    </svg>
  );
}

function SeoVisitorGraph({ apiUrl, authFetch }) {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    authFetch(`${apiUrl}/api/seo-audit/visits?days=${days}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center justify-center h-40">
      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const hasVisits = data?.visits?.length > 0;
  const total = data?.visits?.reduce((s, v) => s + v.count, 0) || 0;
  const appliedDate = data?.seoCodeGeneratedAt;

  // Before/after split
  let before = 0, after = 0;
  if (hasVisits && appliedDate) {
    const split = appliedDate.split('T')[0];
    data.visits.forEach(v => { if (v.date < split) before += v.count; else after += v.count; });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <span className="font-semibold text-gray-900 text-sm">Website Visitors</span>
          {appliedDate && (
            <span className="text-xs text-gray-400 font-normal">tracked via SEO code pixel</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {[30, 60, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                days === d ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {!hasVisits ? (
        <div className="p-8 text-center">
          <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">No visits recorded yet</p>
          <p className="text-xs text-gray-400">Visitors will appear here once you paste the SEO code onto your website.</p>
        </div>
      ) : (
        <div className="p-5 space-y-4">
          {/* Stats row */}
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-purple-700">{total.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total ({days}d)</p>
            </div>
            {appliedDate && before + after > 0 && (
              <>
                <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-gray-700">{before.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Before SEO code</p>
                </div>
                <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-green-700">{after.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">After SEO code</p>
                </div>
              </>
            )}
          </div>

          {/* Chart */}
          <SeoVisitorChart visits={data.visits} seoCodeGeneratedAt={data.seoCodeGeneratedAt} />

          {appliedDate && (
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="inline-block w-3 border-t-2 border-dashed border-purple-400" />
              SEO code applied {new Date(appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SeoGenerateLoadingScreen() {
  return (
    <LoadingScreen
      tasks={APPLY_TASKS}
      title="Generating your SEO embed code"
      subtitle="SORCE is building your structured data, meta tags, and AI discovery file."
      accentClass={{
        iconBg: 'bg-purple-100',
        iconText: 'text-purple-600',
        bar: 'bg-gradient-to-r from-purple-500 to-indigo-500',
        activeBg: 'bg-purple-50',
        activeBorder: 'border-purple-200',
        activeText: 'text-purple-800',
        spinnerBorder: 'border-purple-500',
        loaderColor: '#7c3aed',
      }}
    />
  );
}

const SEO_PLATFORMS = [
  { id: 'wix',          name: 'Wix',           color: 'bg-blue-600',   letter: 'W' },
  { id: 'squarespace',  name: 'Squarespace',   color: 'bg-gray-900',   letter: 'Sq' },
  { id: 'wordpress',    name: 'WordPress',     color: 'bg-blue-700',   letter: 'WP' },
  { id: 'shopify',      name: 'Shopify',       color: 'bg-green-700',  letter: 'Sh' },
  { id: 'webflow',      name: 'Webflow',       color: 'bg-blue-500',   letter: 'Wf' },
  { id: 'godaddy',      name: 'GoDaddy',       color: 'bg-orange-500', letter: 'G' },
  { id: 'weebly',       name: 'Weebly',        color: 'bg-indigo-600', letter: 'We' },
  { id: 'html',         name: 'Any HTML Site', color: 'bg-gray-700',   letter: '</>' },
];

// '__PASTE__' renders as the code block inline within the step list
const SEO_HEAD_STEPS = {
  wix: {
    note: 'Requires Wix Premium. Go to Dashboard (not the Editor) for site-wide injection.',
    steps: [
      'Open your <strong>Wix Dashboard</strong>',
      'Click <strong>Settings</strong> in the left sidebar',
      'Click <strong>Custom Code</strong> under Advanced',
      'Click <strong>+ Add Code</strong> in the <strong>Head</strong> section',
      '__PASTE__',
      'Set <strong>Pages:</strong> All Pages · <strong>Code Type:</strong> Essential',
      'Click <strong>Apply</strong>',
    ],
  },
  squarespace: {
    steps: [
      'Go to <strong>Settings → Developer Tools → Code Injection</strong>',
      'Scroll to the <strong>Header</strong> section',
      '__PASTE__',
      'Click <strong>Save</strong>',
    ],
    note: 'Requires a Business plan or higher.',
  },
  wordpress: {
    steps: [
      'Install the free <strong>WPCode</strong> plugin (Plugins → Add New)',
      'Go to <strong>Code Snippets → Header & Footer</strong>',
      'Paste into the <strong>Header</strong> section',
      '__PASTE__',
      'Click <strong>Save Changes</strong>',
    ],
    note: 'Alternative: Appearance → Theme File Editor → header.php → paste before </head>.',
  },
  shopify: {
    steps: [
      'Go to <strong>Online Store → Themes → Actions → Edit Code</strong>',
      'Open <strong>theme.liquid</strong> from the Layout folder',
      'Find the closing <code>&lt;/head&gt;</code> tag',
      '__PASTE__',
      'Click <strong>Save</strong>',
    ],
  },
  webflow: {
    steps: [
      'Go to <strong>Project Settings → Custom Code</strong>',
      'Paste into the <strong>Inside &lt;head&gt; Tag</strong> field',
      '__PASTE__',
      'Click <strong>Save Changes</strong> then <strong>Publish</strong>',
    ],
  },
  godaddy: {
    steps: [
      'Open your site in the GoDaddy Editor',
      'Go to <strong>Settings → Tracking & Analytics → Add Code</strong>',
      'Select <strong>Header</strong> as the location',
      '__PASTE__',
      'Click <strong>Save → Publish</strong>',
    ],
  },
  weebly: {
    steps: [
      'Go to <strong>Settings → SEO</strong>',
      'Scroll to <strong>Header Code</strong>',
      '__PASTE__',
      'Click <strong>Save → Publish</strong>',
    ],
  },
  html: {
    steps: [
      'Open your HTML file in a code editor',
      'Find the closing <code>&lt;/head&gt;</code> tag',
      '__PASTE__',
      'Save and re-upload to your host',
    ],
  },
};

// '__PASTE_LLMS__' renders as the llms.txt copy block within the step list
const SEO_LLMS_STEPS = {
  wordpress: {
    steps: [
      'In your WordPress admin sidebar, click <strong>Plugins → Add New Plugin</strong>',
      'In the search box type <strong>WP File Manager</strong> — click <strong>Install Now</strong> on the first result, then click <strong>Activate</strong>',
      'You\'ll now see <strong>WP File Manager</strong> in your left sidebar — click it to open',
      'At the top of the file list you\'ll see folder icons. Click on the folder icon all the way to the left to make sure you\'re in the <strong>public_html</strong> root (not inside wp-content)',
      'Click the <strong>New File</strong> icon in the toolbar (looks like a blank page with a +). Type <code>llms.txt</code> and press Enter',
      'Right-click the new <code>llms.txt</code> file and select <strong>Edit</strong> — a text editor opens in the same window',
      '__PASTE_LLMS__',
      'Click <strong>Save</strong> in the editor toolbar — your file is now live at <code>yourdomain.com/llms.txt</code> ✓',
    ],
    note: 'Already comfortable with cPanel? Log into cPanel → File Manager → navigate to public_html → click + File → name it llms.txt → right-click → Edit → paste → Save Changes.',
  },
  wix: {
    preWrapped: true,
    steps: [
      'In your Wix account, click <strong>Edit Site</strong> to open the Wix Editor',
      'In the left-side panel, click <strong>Pages & Menu</strong> (the icon that looks like a document)',
      'Scroll to the bottom of the page list and click <strong>Add Page</strong>',
      'Select <strong>Blank</strong> as the page type, then name the page <code>llms</code> and press Enter',
      'With the new page selected, click the <strong>Settings</strong> icon (gear icon) next to the page name → set the <strong>Page URL</strong> field to <code>/llms</code>',
      'Click on the page to open it, then click the blue <strong>+</strong> button on the left to add an element',
      'Click <strong>More</strong> at the bottom of the elements list, then select <strong>HTML iFrame</strong> (or search for "Embed Code")',
      'In the HTML settings panel that appears, click <strong>Enter Code</strong>',
      '__PASTE_LLMS__',
      'Click <strong>Apply</strong> to confirm, then click <strong>Publish</strong> in the top-right — live at <code>yourdomain.com/llms</code> ✓',
    ],
    note: 'This puts your content at /llms rather than /llms.txt — Wix doesn\'t support root .txt file hosting. AI crawlers (ChatGPT, Perplexity) will still find and read this page.',
  },
  squarespace: {
    preWrapped: true,
    steps: [
      'Log into your Squarespace account and open your site\'s editor',
      'In the left menu, click <strong>Pages</strong>',
      'Scroll to the very bottom of the Pages panel — you\'ll see a section called <strong>Not Linked</strong>. Click it to expand',
      'Click the <strong>+</strong> button next to "Not Linked" — a popup appears. Select <strong>Blank Page</strong>',
      'Name the page <code>llms</code> — this sets the URL to <code>/llms</code> automatically',
      'Click the new <strong>llms</strong> page in the panel to select it, then click <strong>Edit</strong>',
      'Hover over the page content area and click the <strong>+</strong> that appears to add a block',
      'From the block menu, choose <strong>Code</strong> (it may be under the "More" section — a code block opens)',
      '__PASTE_LLMS__',
      'Click <strong>Apply</strong> on the code block, then click <strong>Save</strong> in the top bar, then click <strong>Done</strong> — live at <code>yourdomain.com/llms</code> ✓',
    ],
    note: 'Squarespace doesn\'t allow uploading files to your domain root, so this creates a page at /llms instead of /llms.txt. AI search engines like ChatGPT and Perplexity will still read this page correctly.',
  },
  shopify: {
    preWrapped: true,
    steps: [
      'Log into your Shopify admin at <strong>yourstore.myshopify.com/admin</strong>',
      'In the left sidebar, click <strong>Online Store</strong> to expand it, then click <strong>Pages</strong>',
      'Click the <strong>Add page</strong> button in the top-right corner',
      'In the <strong>Title</strong> field type <code>llms</code> — the URL handle below will auto-fill as <code>/pages/llms</code>',
      'In the content editor toolbar, look for the <strong>&lt; &gt;</strong> button (hover says "Show HTML") — click it to switch to HTML mode',
      '__PASTE_LLMS__',
      'Click the <strong>Save</strong> button in the top-right — live at <code>yourdomain.com/pages/llms</code> ✓',
    ],
    note: 'Shopify doesn\'t allow files at your domain root, so your content will be at /pages/llms. AI crawlers still read this correctly.',
  },
  webflow: {
    preWrapped: true,
    steps: [
      'Open your Webflow project in the <strong>Designer</strong>',
      'In the top-left corner, click the <strong>Pages</strong> icon (it looks like stacked rectangles)',
      'Click the <strong>+ New Page</strong> button',
      'Name the page <code>llms</code> — Webflow sets the URL path to <code>/llms</code> automatically',
      'Click on the new <strong>llms</strong> page to navigate to it',
      'In the <strong>Add Elements</strong> panel (+ icon on the left), search for <strong>Embed</strong> and drag it onto the page',
      'An HTML Embed editor opens — click inside it',
      '__PASTE_LLMS__',
      'Click <strong>Save & Close</strong>, then click <strong>Publish</strong> in the top-right — live at <code>yourdomain.com/llms</code> ✓',
    ],
    note: 'Webflow doesn\'t support serving arbitrary files at the domain root. A page at /llms is the closest option and AI search engines will still find and index it.',
  },
  godaddy: {
    steps: [
      'Go to <strong>account.godaddy.com</strong> and sign in',
      'Click <strong>My Products</strong> at the top, then scroll down to find your <strong>Web Hosting</strong> plan',
      'Click the <strong>Manage</strong> button next to your hosting plan',
      'In the hosting dashboard, look for a button labeled <strong>cPanel Admin</strong> or <strong>File Manager</strong> — click it',
      'Once File Manager opens, you\'ll see a folder tree on the left. Click on <strong>public_html</strong> to open your website\'s root folder',
      'In the toolbar at the top, click <strong>+ File</strong> (or "New File")',
      'A popup will ask for the file name — type <code>llms.txt</code> and click <strong>Create New File</strong>',
      'You\'ll see <code>llms.txt</code> appear in the file list. Right-click it and select <strong>Edit</strong> (or "Code Editor")',
      '__PASTE_LLMS__',
      'Click <strong>Save Changes</strong> in the editor — your file is now live at <code>yourdomain.com/llms.txt</code> ✓',
    ],
    note: 'Using GoDaddy\'s drag-and-drop Website Builder (not cPanel hosting)? You won\'t have File Manager access. Instead, create a new page at /llms, add a text block, and paste the content there as a workaround.',
  },
  weebly: {
    steps: [
      'Weebly\'s dashboard doesn\'t have a file manager, so you\'ll use your <strong>hosting provider\'s control panel</strong> directly',
      'Check your original signup email for your hosting provider (Weebly uses Bluehost, HostGator, or others under the hood) — log into that account',
      'Find and open <strong>cPanel</strong> or <strong>File Manager</strong> from your hosting dashboard',
      'In File Manager, click on <strong>public_html</strong> (or <strong>www</strong>) to open your site\'s root folder',
      'Click <strong>New File</strong> in the toolbar, type <code>llms.txt</code>, and click <strong>Create</strong>',
      'Right-click the new <code>llms.txt</code> file and select <strong>Edit</strong>',
      '__PASTE_LLMS__',
      'Click <strong>Save</strong> — your file is now live at <code>yourdomain.com/llms.txt</code> ✓',
    ],
    note: 'Not sure how to access your hosting control panel? Search your email inbox for "welcome to [your hosting company]" — the cPanel login link is usually in that first email. If you\'re still stuck, contact your hosting provider\'s support and ask them to help you upload a file to your public_html root.',
  },
  html: {
    steps: [
      'On your computer, open <strong>Notepad</strong> (Windows: press Windows key and search "Notepad") or <strong>TextEdit</strong> (Mac: open it from Applications, then go to Format → Make Plain Text)',
      '__PASTE_LLMS__',
      'Save the file: click <strong>File → Save As</strong>. In the filename box type <code>llms.txt</code>. On Windows, change "Save as type" dropdown to <strong>All Files (*.*)</strong> before saving, otherwise it saves as llms.txt.txt',
      'Open your <strong>FTP client</strong> — if you don\'t have one, download <strong>FileZilla</strong> for free at filezilla-project.org',
      'In FileZilla: enter your FTP host, username, and password (find these in your hosting control panel under "FTP Accounts"), then click <strong>Quickconnect</strong>',
      'On the right side (Remote Site), navigate to your website\'s <strong>root folder</strong> — it\'s usually named <code>public_html</code> or <code>www</code> and contains your <code>index.html</code>',
      'On the left side (Local Site), find your <code>llms.txt</code> file. Drag it from the left panel to the right panel to upload it',
      'Done — your file is live at <code>yourdomain.com/llms.txt</code> ✓',
    ],
  },
};

function SeoEmbedResult({ headCode, llmsTxtContent, apiUrl, authFetch }) {
  const [platform, setPlatform] = useState(null);
  const [llmsPlatform, setLlmsPlatform] = useState(null);
  const [copiedHead, setCopiedHead] = useState(false);
  const [copiedLlms, setCopiedLlms] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  // Pre-wrapped version for platforms that need HTML embed (Wix, Squarespace, Shopify, Webflow)
  const wrappedLlmsTxt = `<pre style="white-space:pre-wrap;font-family:monospace;font-size:13px">\n${llmsTxtContent}\n</pre>`;
  const currentPlatformPreWrapped = llmsPlatform && SEO_LLMS_STEPS[llmsPlatform]?.preWrapped;

  const copyHead = () => {
    navigator.clipboard.writeText(headCode).then(() => {
      setCopiedHead(true);
      setTimeout(() => setCopiedHead(false), 2000);
    });
  };
  const copyLlms = () => {
    const textToCopy = currentPlatformPreWrapped ? wrappedLlmsTxt : llmsTxtContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedLlms(true);
      setTimeout(() => setCopiedLlms(false), 2000);
    });
  };

  const runVerify = async () => {
    if (!verifyUrl.trim() || verifying) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await authFetch(`${apiUrl}/api/seo-audit/verify-llms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: verifyUrl.trim() }),
      });
      const data = await res.json();
      setVerifyResult(data);
    } catch {
      setVerifyResult({ status: 'error', message: 'Check failed — please try again.' });
    } finally {
      setVerifying(false);
    }
  };

  const platformSteps = platform ? SEO_HEAD_STEPS[platform] : null;

  return (
    <div className="space-y-4">
      {/* Step 1 — Copy the code */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">1</span>
            <span className="font-semibold text-gray-900 text-sm">Copy your SEO head code</span>
          </div>
          <button
            onClick={copyHead}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              copiedHead ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            {copiedHead ? <><CheckCircle className="w-3.5 h-3.5" />Copied!</> : <><Code className="w-3.5 h-3.5" />Copy Code</>}
          </button>
        </div>
        <pre className="text-xs font-mono text-gray-700 bg-gray-50 p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
          {headCode}
        </pre>
      </div>

      {/* Step 2 — Pick platform */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">2</span>
          <span className="font-semibold text-gray-900 text-sm">Choose your website platform</span>
        </div>
        <div className="p-4 grid grid-cols-4 gap-2">
          {SEO_PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id === platform ? null : p.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                platform === p.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <span className={`w-8 h-8 rounded-lg ${p.color} text-white text-xs font-bold flex items-center justify-center`}>
                {p.letter}
              </span>
              <span className="text-xs text-gray-700 font-medium leading-tight">{p.name}</span>
            </button>
          ))}
        </div>

        {/* Platform-specific steps */}
        {platformSteps && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
            {platformSteps.note && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {platformSteps.note}
              </p>
            )}
            <ol className="space-y-2">
              {platformSteps.steps.map((step, i) =>
                step === '__PASTE__' ? (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 mb-1">Paste the copied SEO code</p>
                      <button
                        onClick={copyHead}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                          copiedHead ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700'
                        }`}
                      >
                        {copiedHead ? <><CheckCircle className="w-3 h-3" />Copied!</> : <><Code className="w-3 h-3" />Copy Code</>}
                      </button>
                    </div>
                  </li>
                ) : (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: step }} />
                  </li>
                )
              )}
            </ol>
          </div>
        )}
      </div>

      {/* Step 3 — llms.txt */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">3</span>
            <span className="font-semibold text-gray-900 text-sm">Add your llms.txt file</span>
            <span className="text-xs text-gray-400 font-normal">optional but recommended</span>
          </div>
          <p className="text-xs text-gray-500 ml-8">
            This plain-text file tells AI search engines (ChatGPT, Perplexity, Google AI) exactly what your business does so they cite you accurately. Pick your platform below for step-by-step instructions — the copy button will automatically format it correctly for your platform.
          </p>
        </div>

        {/* llms.txt copy button — no raw content shown so users don't paste it alone */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {currentPlatformPreWrapped ? 'Your llms.txt code (ready to paste)' : 'Your llms.txt file content'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentPlatformPreWrapped
                  ? 'Select your platform below, then click Copy — it\'s formatted correctly for your platform.'
                  : 'Select your platform below for step-by-step instructions, then click Copy.'}
              </p>
            </div>
            <button
              onClick={copyLlms}
              className={`flex-shrink-0 ml-4 flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                copiedLlms ? 'bg-green-100 text-green-700' : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {copiedLlms
                ? <><CheckCircle className="w-3.5 h-3.5" />Copied!</>
                : currentPlatformPreWrapped
                  ? <><Code className="w-3.5 h-3.5" />Copy Code</>
                  : <><FileText className="w-3.5 h-3.5" />Copy Content</>
              }
            </button>
          </div>
        </div>

        {/* Platform picker for llms.txt */}
        <div className="px-5 pt-2 pb-3 border-t border-gray-100 mt-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Where to add it</p>
          <div className="grid grid-cols-4 gap-2">
            {SEO_PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => setLlmsPlatform(p.id === llmsPlatform ? null : p.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                  llmsPlatform === p.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className={`w-8 h-8 rounded-lg ${p.color} text-white text-xs font-bold flex items-center justify-center`}>
                  {p.letter}
                </span>
                <span className="text-xs text-gray-700 font-medium leading-tight">{p.name}</span>
              </button>
            ))}
          </div>

          {/* Platform-specific llms.txt steps */}
          {llmsPlatform && SEO_LLMS_STEPS[llmsPlatform] && (
            <div className="mt-4 space-y-3">
              {SEO_LLMS_STEPS[llmsPlatform].note && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {SEO_LLMS_STEPS[llmsPlatform].note}
                </p>
              )}
              <ol className="space-y-2">
                {SEO_LLMS_STEPS[llmsPlatform].steps.map((step, i) =>
                  step === '__PASTE_LLMS__' ? (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        {currentPlatformPreWrapped ? (
                          <p className="text-sm text-gray-700 mb-2">
                            Click <strong>Copy Code</strong> below — it's ready to paste directly, no extra typing needed.
                          </p>
                        ) : (
                          <p className="text-sm text-gray-700 mb-2">Click <strong>Copy Content</strong> below, then paste it into the editor.</p>
                        )}
                        <button
                          onClick={copyLlms}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                            copiedLlms ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                        >
                          {copiedLlms
                            ? <><CheckCircle className="w-3 h-3" />Copied!</>
                            : currentPlatformPreWrapped
                              ? <><Code className="w-3 h-3" />Copy Code</>
                              : <><FileText className="w-3 h-3" />Copy Content</>
                          }
                        </button>
                        {currentPlatformPreWrapped && !copiedLlms && (
                          <p className="text-xs text-gray-400 mt-1.5">Copies content wrapped in display tags — just paste and you're done.</p>
                        )}
                      </div>
                    </li>
                  ) : (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: step }} />
                    </li>
                  )
                )}
              </ol>
            </div>
          )}

          {/* Verify checker */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">Did it work? Check your website</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={verifyUrl}
                onChange={e => { setVerifyUrl(e.target.value); setVerifyResult(null); }}
                onKeyDown={e => e.key === 'Enter' && runVerify()}
                placeholder="yourdomain.com"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200"
              />
              <button
                onClick={runVerify}
                disabled={!verifyUrl.trim() || verifying}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                {verifying ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Checking…</> : 'Check'}
              </button>
            </div>
            {verifyResult && (
              <div className={`mt-2 text-xs rounded-lg px-3 py-2.5 leading-relaxed ${
                verifyResult.status === 'found'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}>
                {verifyResult.status === 'found' && (
                  <p className="font-semibold text-green-700 mb-1">Found at: {verifyResult.foundAt}</p>
                )}
                <p>{verifyResult.assessment || verifyResult.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Regenerate anytime from your SEO audit if your business info changes.
      </p>
    </div>
  );
}

// ── SEO Content Generator ─────────────────────────────────
const CONTENT_TOPICS = {
  blog: [
    { label: 'How-to Guide', template: (biz, loc) => `How to ${biz} in ${loc || 'your area'}: A complete guide` },
    { label: 'Cost Guide', template: (biz, loc) => `How much does ${biz} cost in ${loc || 'your area'}?` },
    { label: 'Local Tips', template: (biz, loc) => `Top ${biz} tips for homeowners in ${loc || 'your area'}` },
    { label: 'DIY vs Pro', template: (biz) => `DIY vs professional ${biz}: what you need to know` },
    { label: 'Warning Signs', template: (biz) => `5 signs you need a professional ${biz} service` },
    { label: 'Seasonal', template: (biz, loc) => `${biz} checklist for ${loc || 'local'} homeowners this season` },
  ],
  service: [
    { label: 'Main Service', template: (biz, loc) => `Professional ${biz} services in ${loc || 'your area'}` },
    { label: 'Emergency', template: (biz, loc) => `Emergency ${biz} in ${loc || 'your area'} — fast response` },
    { label: 'Residential', template: (biz, loc) => `Residential ${biz} for homeowners in ${loc || 'your area'}` },
    { label: 'Commercial', template: (biz, loc) => `Commercial ${biz} services in ${loc || 'your area'}` },
    { label: 'Affordable', template: (biz, loc) => `Affordable ${biz} near ${loc || 'you'} — free estimates` },
    { label: 'Best in Area', template: (biz, loc) => `Best ${biz} in ${loc || 'your area'} — trusted local experts` },
  ],
};

// ── SEO Quick Fixes ──────────────────────────────────────────
const QUICK_FIX_STEPS = {
  wix: [
    {
      label: 'Set your Page Title',
      detail: 'Wix Dashboard → SEO (left menu) → Get Found on Google → click your homepage → Edit SEO Settings → Page Title field',
      example: 'Example: Thompson\'s Auto Detailing | Auto Detailing in Olympia, WA',
    },
    {
      label: 'Set your Meta Description',
      detail: 'Same panel, one field below → Meta Description (aim for 150–160 characters)',
      example: 'Example: Professional auto detailing in Olympia, WA. Ceramic coating, paint correction & interior detailing. Serving Thurston County. Book online.',
    },
    {
      label: 'Set your H1 heading',
      detail: 'Wix Editor → click your main headline on the page → in the text toolbar change the style from "Paragraph" to Heading 1 → Publish',
      example: 'There should be exactly one H1 on the page — your business name or main service.',
    },
  ],
  wordpress: [
    {
      label: 'Set your Page Title',
      detail: 'Install the free Yoast SEO or RankMath plugin → edit your homepage → find the SEO panel at the bottom → SEO Title field',
      example: 'Example: Thompson\'s Auto Detailing | Auto Detailing in Olympia, WA',
    },
    {
      label: 'Set your Meta Description',
      detail: 'Same SEO plugin panel → Meta Description field (150–160 characters)',
      example: 'Describe your service and location clearly in 1–2 sentences.',
    },
    {
      label: 'Set your H1 heading',
      detail: 'In the page editor, click your main headline block → change the block type to Heading → set level to H1',
      example: 'Every page should have exactly one H1.',
    },
  ],
  squarespace: [
    {
      label: 'Set your Page Title',
      detail: 'Pages → hover your homepage → gear icon → SEO tab → SEO Page Title field',
      example: 'Example: Thompson\'s Auto Detailing | Olympia, WA',
    },
    {
      label: 'Set your Meta Description',
      detail: 'Same SEO tab → SEO Description field (150–160 characters)',
      example: 'Describe your service and location clearly in 1–2 sentences.',
    },
    {
      label: 'Set your H1 heading',
      detail: 'Edit page → click your main headline → in the text toolbar, set the style to Heading 1',
      example: 'There should be exactly one H1 on the page.',
    },
  ],
  shopify: [
    {
      label: 'Set your Page Title',
      detail: 'Online Store → Preferences → Homepage title field',
      example: 'Example: Thompson\'s Auto Detailing | Olympia, WA',
    },
    {
      label: 'Set your Meta Description',
      detail: 'Online Store → Preferences → Homepage meta description (150–160 characters)',
      example: 'Describe your service and location clearly in 1–2 sentences.',
    },
    {
      label: 'Set your H1 heading',
      detail: 'Themes → Customize → find your main banner/heading section → ensure it\'s using an H1 element',
      example: 'Check your theme\'s heading settings — some themes let you set heading level.',
    },
  ],
  webflow: [
    {
      label: 'Set your Page Title',
      detail: 'Click the gear icon (Page Settings) for your page → SEO Settings tab → Title Tag field',
      example: 'Example: Thompson\'s Auto Detailing | Olympia, WA',
    },
    {
      label: 'Set your Meta Description',
      detail: 'Same SEO Settings tab → Meta Description field (150–160 characters)',
      example: 'Describe your service and location clearly in 1–2 sentences.',
    },
    {
      label: 'Set your H1 heading',
      detail: 'In Designer, click your main headline element → in the right panel under Tag, set it to H1',
      example: 'There should be exactly one H1 per page.',
    },
  ],
  godaddy: [
    {
      label: 'Set your Page Title',
      detail: 'Website Builder → Pages → click your homepage → SEO → Meta Title field',
      example: 'Example: Thompson\'s Auto Detailing | Olympia, WA',
    },
    {
      label: 'Set your Meta Description',
      detail: 'Same SEO panel → Meta Description field (150–160 characters)',
      example: 'Describe your service and location clearly in 1–2 sentences.',
    },
    {
      label: 'Set your H1 heading',
      detail: 'Website Builder → click your main headline → set the text style to Heading 1',
      example: 'There should be exactly one H1 on your homepage.',
    },
  ],
  html: [
    {
      label: 'Set your Page Title',
      detail: 'In your index.html, find or add <title>Your Title Here</title> inside the <head> section',
      example: 'Example: <title>Thompson\'s Auto Detailing | Olympia, WA</title>',
    },
    {
      label: 'Set your Meta Description',
      detail: 'In your <head>, add: <meta name="description" content="Your description here">',
      example: 'Keep it 150–160 characters and include your city and main service.',
    },
    {
      label: 'Add an H1 heading',
      detail: 'In your page body, wrap your main headline in <h1> tags: <h1>Your Business Name</h1>',
      example: 'There should be exactly one H1 on the page.',
    },
  ],
};

function SeoQuickFixesCard({ platform, onPlatformChange }) {
  const storageKey = 'seo_quick_fixes_done';
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  });
  const [expanded, setExpanded] = useState(null);

  const toggle = (idx) => {
    const next = { ...checked, [idx]: !checked[idx] };
    setChecked(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const steps = platform ? QUICK_FIX_STEPS[platform] : null;
  const doneCount = steps ? steps.filter((_, i) => checked[i]).length : 0;
  const allDone = steps && doneCount === steps.length;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900">3 Quick Fixes</h3>
              <span className="text-xs text-gray-500">— takes 5 minutes, pushes your score to 85+</span>
              {steps && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${allDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {doneCount}/{steps.length} done
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Platform picker */}
        {!platform && (
          <p className="text-sm text-gray-500">Select your platform to see the exact steps:</p>
        )}
        <div className="grid grid-cols-4 gap-2">
          {SEO_PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => onPlatformChange(p.id === platform ? null : p.id)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all text-center ${
                platform === p.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <span className={`w-7 h-7 rounded-lg ${p.color} text-white text-xs font-bold flex items-center justify-center`}>{p.letter}</span>
              <span className="text-xs text-gray-700 font-medium leading-tight">{p.name}</span>
            </button>
          ))}
        </div>

        {steps && (
          <div className="space-y-2 pt-1">
            {steps.map((fix, i) => (
              <div key={i} className={`rounded-xl border transition-all ${checked[i] ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle(i); }}
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      checked[i] ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {checked[i] && <CheckCircle className="w-3 h-3 text-white" />}
                  </button>
                  <span className={`flex-1 text-sm font-semibold ${checked[i] ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {fix.label}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded === i ? 'rotate-180' : ''}`} />
                </button>
                {expanded === i && (
                  <div className="px-4 pb-3 space-y-1.5 border-t border-gray-100 pt-2">
                    <p className="text-xs text-gray-700 leading-relaxed">{fix.detail}</p>
                    <p className="text-xs text-gray-400 italic">{fix.example}</p>
                    <button
                      onClick={() => toggle(i)}
                      className={`mt-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        checked[i] ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {checked[i] ? 'Mark as not done' : 'Mark as done ✓'}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {allDone && (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800 font-semibold">All 3 done — re-run your audit to see the new score!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SeoContentCard({ apiUrl, authFetch, audit }) {
  const [type, setType] = useState('blog');
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [genError, setGenError] = useState('');
  const [copiedContent, setCopiedContent] = useState(false);
  const [history, setHistory] = useState([]); // last 3 generated pieces

  if (!audit) return null;

  const bizType = audit.businessType || 'service';
  const loc = audit.url ? '' : '';

  const generate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setGenError('');
    setResult(null);
    try {
      const res = await authFetch(`${apiUrl}/api/seo-audit/generate-content`, {
        method: 'POST',
        body: JSON.stringify({ type, topic: topic.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate content');
      setResult(data.content);
      setHistory(prev => [{ type, topic: topic.trim(), title: data.content.title }, ...prev].slice(0, 3));
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const copyAll = () => {
    const full = `${result.title}\n\nMeta Description: ${result.metaDescription}\nSlug: /${result.slug}\nKeywords: ${result.targetKeywords?.join(', ')}\n\n${result.htmlContent}\n\n${result.jsonLd}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    });
  };

  if (generating) return (
    <LoadingScreen
      tasks={[
        { label: 'Researching keywords', icon: Search },
        { label: 'Writing SEO-optimised content', icon: FileText },
        { label: 'Optimising for local search', icon: MapPin },
        { label: 'Adding Schema.org structured data', icon: Code },
        { label: 'Final polish', icon: CheckCircle },
      ]}
      title={`Generating your ${type === 'blog' ? 'blog post' : 'service page'}`}
      subtitle="SORCE is writing locally-optimised content built to rank."
      accentClass={{
        iconBg: 'bg-emerald-100', iconText: 'text-emerald-600',
        bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-200',
        activeText: 'text-emerald-800', spinnerBorder: 'border-emerald-500',
        loaderColor: '#10b981',
      }}
    />
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <FileText className="w-4 h-4 text-emerald-600" />
        <div>
          <h3 className="text-sm font-bold text-gray-900">Fresh SEO Content</h3>
          <p className="text-xs text-gray-500">Generate blog posts and service pages to keep your SEO improving over time</p>
        </div>
      </div>

      {!result ? (
        <div className="p-5 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            {[{ id: 'blog', label: 'Blog Post' }, { id: 'service', label: 'Service Page' }].map(t => (
              <button
                key={t.id}
                onClick={() => { setType(t.id); setTopic(''); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                  type === t.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Suggested topics */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Suggested Topics</p>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TOPICS[type].map(t => (
                <button
                  key={t.label}
                  onClick={() => setTopic(t.template(bizType, ''))}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom topic input */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Topic / Title</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !generating && topic.trim() && generate()}
              placeholder={type === 'blog' ? 'e.g. How much does roof repair cost in Austin?' : 'e.g. Emergency plumbing services in Dallas'}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {genError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {genError}
            </div>
          )}

          <button
            onClick={generate}
            disabled={!topic.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            Generate {type === 'blog' ? 'Blog Post' : 'Service Page'}
          </button>

          {/* Session history */}
          {history.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent</p>
              <div className="space-y-1.5">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setTopic(h.topic)}
                    className="w-full text-left text-xs text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <span className="text-gray-300">{h.type === 'blog' ? '📝' : '📄'}</span>
                    <span className="truncate">{h.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-5 space-y-4">
          {/* Result header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-sm leading-snug">{result.title}</h4>
              <p className="text-xs text-gray-500 mt-1">~{result.wordCount?.toLocaleString()} words · /{result.slug}</p>
            </div>
            <button
              onClick={copyAll}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                copiedContent ? 'bg-green-100 text-green-700' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              {copiedContent ? <><CheckCircle className="w-3.5 h-3.5" />Copied!</> : <><FileText className="w-3.5 h-3.5" />Copy All</>}
            </button>
          </div>

          {/* Meta & keywords */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            <div>
              <span className="text-xs font-semibold text-gray-500">Meta: </span>
              <span className="text-xs text-gray-700">{result.metaDescription}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.targetKeywords?.map(k => (
                <span key={k} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{k}</span>
              ))}
            </div>
          </div>

          {/* HTML content preview */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">HTML Content</p>
            <div
              className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-4 max-h-72 overflow-y-auto prose prose-sm"
              dangerouslySetInnerHTML={{ __html: result.htmlContent }}
            />
          </div>

          {/* JSON-LD */}
          <details className="group">
            <summary className="text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-1.5 select-none">
              <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
              Schema.org JSON-LD
            </summary>
            <pre className="text-xs font-mono text-gray-600 bg-gray-50 rounded-xl p-3 mt-2 whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">
              {result.jsonLd}
            </pre>
          </details>

          <button
            onClick={() => { setResult(null); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
          >
            ← Generate another piece
          </button>
        </div>
      )}
    </div>
  );
}

function SeoEmbedCard({ apiUrl, authFetch, audit, savedHeadCode, savedLlmsTxtContent }) {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(
    savedHeadCode && savedLlmsTxtContent ? { headCode: savedHeadCode, llmsTxtContent: savedLlmsTxtContent } : null
  );
  const [genError, setGenError] = useState('');

  if (!audit) return null;

  const generate = async () => {
    setGenerating(true);
    setGenError('');
    setResult(null);
    try {
      const res = await authFetch(`${apiUrl}/api/seo-audit/generate-code`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate SEO code');
      setResult(data);
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (generating) return <SeoGenerateLoadingScreen />;

  if (result) {
    return (
      <div className="space-y-3">
        <SeoEmbedResult
          headCode={result.headCode}
          llmsTxtContent={result.llmsTxtContent}
          apiUrl={apiUrl}
          authFetch={authFetch}
        />
        <button
          onClick={generate}
          className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 block text-center"
        >
          Regenerate (if business info changed)
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-6 h-6 text-purple-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900 mb-1">Get Your SEO Embed Code</h3>
          <p className="text-sm text-gray-600 mb-4">
            SORCE generates a copy-paste code block for your website's <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">&lt;head&gt;</code> — works on Wix, Squarespace, WordPress, Shopify, and any other platform. Includes JSON-LD structured data, meta tags, and an <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">llms.txt</code> file so AI search engines can find you.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { icon: Code,     label: 'JSON-LD Schema' },
              { icon: FileText, label: 'Meta & OG Tags' },
              { icon: Cpu,      label: 'llms.txt (AI Search)' },
              { icon: Globe,    label: 'Any Platform' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-white border border-purple-200 rounded-full px-3 py-1">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </span>
            ))}
          </div>
          {genError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {genError}
            </div>
          )}
          <button
            onClick={generate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Generate SEO Code
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
const ANALYZING_WORDS = ['Analyzing', 'Crunching', 'Auditing', 'Scanning', 'Inspecting', 'Scoring'];

export default function SEOAudit({ apiUrl, user, authFetch, inOnboarding }) {
  const [seoTab, setSeoTab] = useState('audit');
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
  const [savedHeadCode, setSavedHeadCode] = useState(null);
  const [savedLlmsTxt, setSavedLlmsTxt] = useState(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(
    () => localStorage.getItem('seo_nudge_dismissed') === 'true'
  );

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
            if (auditData.headCode) setSavedHeadCode(auditData.headCode);
            if (auditData.llmsTxtContent) setSavedLlmsTxt(auditData.llmsTxtContent);
            return; // URL already set from saved audit
          }
        }
      } catch { /* ignore */ }

      // Fallback: pre-fill URL from SORCE website
      try {
        const res = await authFetch(`${apiUrl}/api/website/v2`);
        if (!res.ok) return;
        const data = await res.json();
        const site = data.website;
        if (!site) return;
        if (site.vercel_url) setUrl(site.vercel_url.startsWith('http') ? site.vercel_url : `https://${site.vercel_url}`);
        else if (site.custom_domain) setUrl(`https://${site.custom_domain}`);
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
      {/* Top-level tabs: SEO Audit | Backlinks & Citations */}
      {!inOnboarding && (
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setSeoTab('audit')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              seoTab === 'audit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Search className="w-4 h-4" />
            SEO Audit
          </button>
          <button
            onClick={() => setSeoTab('backlinks')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              seoTab === 'backlinks' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Link className="w-4 h-4" />
            Backlinks & Citations
          </button>
        </div>
      )}

      {/* Backlinks tab */}
      {seoTab === 'backlinks' && !inOnboarding && (
        <BacklinksPage apiUrl={apiUrl} authFetch={authFetch} user={user} />
      )}

      {/* SEO Audit tab */}
      {(seoTab === 'audit' || inOnboarding) && (
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
            {/* 60-day stale audit nudge */}
            {!inOnboarding && !nudgeDismissed && savedAt && (() => {
              const daysSince = Math.floor((Date.now() - new Date(savedAt)) / (1000 * 60 * 60 * 24));
              if (daysSince < 60) return null;
              return (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                  <RefreshCw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900">Your audit is {daysSince} days old</p>
                    <p className="text-xs text-amber-700 mt-0.5">SEO changes over time — competitors improve, Google updates its algorithms. Run a fresh audit to see where you stand today.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={runAudit}
                      className="text-xs font-semibold px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Re-run audit
                    </button>
                    <button
                      onClick={() => { setNudgeDismissed(true); localStorage.setItem('seo_nudge_dismissed', 'true'); }}
                      className="text-amber-400 hover:text-amber-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Score always at top */}
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

            {!inOnboarding && (
              <>
                {/* Step 1 — Embed the SEO code */}
                <SeoEmbedCard
                  apiUrl={apiUrl}
                  authFetch={authFetch}
                  audit={audit}
                  savedHeadCode={savedHeadCode}
                  savedLlmsTxtContent={savedLlmsTxt}
                  platform={platform}
                  onPlatformChange={setPlatform}
                />

                {/* Step 2 — 3 quick on-page fixes */}
                <SeoQuickFixesCard
                  platform={platform}
                  onPlatformChange={setPlatform}
                />

                {/* Step 3 — Visitors graph */}
                <SeoVisitorGraph
                  apiUrl={apiUrl}
                  authFetch={authFetch}
                />

                {/* Step 4 — Content + backlinks over time */}
                <SeoContentCard
                  apiUrl={apiUrl}
                  authFetch={authFetch}
                  audit={audit}
                />
              </>
            )}
          </>
        );
      })()}
      </div>
      )}
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
                      {scoreLabel(audit.score)}
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
