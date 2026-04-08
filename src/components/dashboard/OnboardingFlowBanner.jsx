import { useState, useEffect } from 'react';
import {
  CheckCircle, Lock, ChevronRight, Mail, Briefcase, Search, MapPin,
  Globe, Bot, Sparkles, X, ChevronDown, ChevronUp
} from 'lucide-react';

const STEPS = [
  {
    key: 'flow_csv',
    num: 1,
    icon: Mail,
    title: 'Import your customers & send your first email',
    shortTitle: 'Email Marketing',
    description: "Let's get you started off with a bang and get some repeat business going. Upload your customer base using a CSV file from your current CRM or where you keep track of customers.",
    view: 'email-campaigns',
    cta: 'Go to Email Marketing →',
  },
  {
    key: 'flow_business',
    num: 2,
    icon: Briefcase,
    title: 'Set up your business',
    shortTitle: 'Business Setup',
    description: "Now that we did something exciting, let's get to the boring stuff — setting up your business. Fill out all your business information so the AI agents can start going to work on your behalf.",
    view: 'business-settings',
    cta: 'Set Up Business →',
  },
  {
    key: 'flow_seo',
    num: 3,
    icon: Search,
    title: 'Run your SEO audit',
    shortTitle: 'SEO Audit',
    description: "Time to see how your website is performing in search. Run the full audit to get your personalized game plan.",
    view: 'seo-audit',
    cta: 'Run SEO Audit →',
  },
  {
    key: 'flow_gbp',
    num: 4,
    icon: MapPin,
    title: 'Audit your Google Business Profile',
    shortTitle: 'GBP Audit',
    description: "Don't worry, we'll implement the SEO plan later. Now let's audit your Google Business Profile to see where you stand.",
    view: 'google-business',
    cta: 'Run GBP Audit →',
  },
  {
    key: 'flow_embed',
    num: 5,
    icon: Globe,
    title: 'Embed SORCE on your website',
    shortTitle: 'Embed SORCE',
    description: "Let's get SORCE connected to your website so leads can reach you 24/7.",
    view: 'website',
    cta: 'Set Up Embed →',
  },
  {
    key: 'flow_agent',
    num: 6,
    icon: Bot,
    title: 'Train & deploy your AI chat agent',
    shortTitle: 'Train Agent',
    description: "Edit your contact form, train your chat agent, and hit Deploy. Once it's live you're officially up and running.",
    view: 'ai-agents',
    cta: 'Train Agent →',
  },
];

function getFlowSteps() {
  try {
    return JSON.parse(localStorage.getItem('onboarding_flow') || '{}');
  } catch { return {}; }
}

function saveFlowStep(key) {
  const flow = getFlowSteps();
  flow[key] = true;
  localStorage.setItem('onboarding_flow', JSON.stringify(flow));
}

export function markFlowStepDone(key) {
  saveFlowStep(key);
  window.dispatchEvent(new CustomEvent('flow-step-done', { detail: { key } }));
}

export function isFlowComplete() {
  const flow = getFlowSteps();
  return STEPS.every(s => flow[s.key]);
}

export default function OnboardingFlowBanner({ setCurrentView }) {
  const [flow, setFlow] = useState(getFlowSteps());
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('onboarding_flow_dismissed') === 'true'
  );

  useEffect(() => {
    const handler = () => setFlow(getFlowSteps());
    window.addEventListener('flow-step-done', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('flow-step-done', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const doneCount = STEPS.filter(s => flow[s.key]).length;
  const allDone = doneCount === STEPS.length;
  const activeStep = STEPS.find(s => !flow[s.key]) || STEPS[STEPS.length - 1];

  const dismiss = () => {
    localStorage.setItem('onboarding_flow_dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed || allDone) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-amber-100">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <span className="font-bold text-amber-900 text-sm">Getting Started</span>
          <span className="text-xs text-amber-700 font-medium">{doneCount}/{STEPS.length} complete</span>
          {/* Progress bar */}
          <div className="w-32 h-1.5 bg-amber-200 rounded-full hidden sm:block">
            <div
              className="h-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${(doneCount / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCollapsed(c => !c)} className="p-1 text-amber-600 hover:text-amber-800">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button onClick={dismiss} className="p-1 text-amber-400 hover:text-amber-700" title="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-5">
          {/* Active step callout */}
          <div className="mb-4 p-4 bg-white rounded-xl border border-amber-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {activeStep.num}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm mb-1">{activeStep.title}</p>
                <p className="text-sm text-gray-600 mb-3 leading-snug">{activeStep.description}</p>
                <button
                  onClick={() => setCurrentView(activeStep.view)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-semibold rounded-lg hover:shadow-md transition-all"
                >
                  {activeStep.cta}
                </button>
              </div>
            </div>
          </div>

          {/* Steps row */}
          <div className="flex flex-wrap gap-2">
            {STEPS.map((step, idx) => {
              const done = flow[step.key];
              const isActive = step.key === activeStep.key;
              const locked = !done && !isActive;
              const Icon = step.icon;
              return (
                <button
                  key={step.key}
                  onClick={() => !locked && setCurrentView(step.view)}
                  disabled={locked}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    done
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : isActive
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {done
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    : locked
                    ? <Lock className="w-3.5 h-3.5" />
                    : <Icon className="w-3.5 h-3.5" />
                  }
                  <span>{step.shortTitle}</span>
                  {isActive && !done && <ChevronRight className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
