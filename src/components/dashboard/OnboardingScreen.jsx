import { useState, useEffect } from 'react';
import {
  Mail, Briefcase, Search, MapPin, Globe, Bot,
  CheckCircle, Lock, ChevronRight, X, Sparkles
} from 'lucide-react';

export const ONBOARDING_STEPS = [
  {
    key: 'flow_csv',
    num: 1,
    icon: Mail,
    label: 'Email Marketing',
    title: 'Import your customers & send your first email',
    description: "Let's get you started off with a bang and get some repeat business going. Upload your customer base using a CSV file from your current CRM.",
    view: 'email-campaigns',
    color: 'from-blue-500 to-indigo-600',
    accent: 'blue',
  },
  {
    key: 'flow_business',
    num: 2,
    icon: Briefcase,
    label: 'Business Setup',
    title: 'Set up your business',
    description: "Fill out all your business information so the AI agents can start going to work on your behalf.",
    view: 'business-settings',
    color: 'from-violet-500 to-purple-600',
    accent: 'violet',
  },
  {
    key: 'flow_seo',
    num: 3,
    icon: Search,
    label: 'SEO Audit',
    title: 'Run your SEO audit',
    description: "See how your website is performing in search. Run the full audit to get your personalized game plan.",
    view: 'seo-audit',
    color: 'from-teal-500 to-cyan-600',
    accent: 'teal',
  },
  {
    key: 'flow_gbp',
    num: 4,
    icon: MapPin,
    label: 'GBP Audit',
    title: 'Audit your Google Business Profile',
    description: "Audit your Google Business Profile to see where you stand online.",
    view: 'google-business',
    color: 'from-orange-500 to-amber-600',
    accent: 'orange',
  },
  {
    key: 'flow_embed',
    num: 5,
    icon: Globe,
    label: 'Embed SORCE',
    title: 'Embed SORCE on your website',
    description: "Connect SORCE to your website so leads can reach you 24/7.",
    view: 'website',
    color: 'from-pink-500 to-rose-600',
    accent: 'pink',
  },
  {
    key: 'flow_agent',
    num: 6,
    icon: Bot,
    label: 'Train Agent',
    title: 'Train & deploy your AI chat agent',
    description: "Customize your chat agent, edit your contact form, and hit Deploy. Once live you're officially up and running.",
    view: 'ai-agents',
    color: 'from-amber-500 to-yellow-500',
    accent: 'amber',
  },
];

function getFlow() {
  try { return JSON.parse(localStorage.getItem('onboarding_flow') || '{}'); } catch { return {}; }
}

export function isOnboardingComplete() {
  const flow = getFlow();
  return ONBOARDING_STEPS.every(s => flow[s.key]);
}

export default function OnboardingScreen({ currentView, setCurrentView, onSkip, children }) {
  const [flow, setFlow] = useState(getFlow);

  useEffect(() => {
    const handler = () => {
      const f = getFlow();
      setFlow({ ...f });
      // Auto-advance to next incomplete step
      const next = ONBOARDING_STEPS.find(s => !f[s.key]);
      if (next) setCurrentView(next.view);
    };
    window.addEventListener('flow-step-done', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('flow-step-done', handler);
      window.removeEventListener('storage', handler);
    };
  }, [setCurrentView]);

  // On mount, force view to active step
  useEffect(() => {
    const f = getFlow();
    const next = ONBOARDING_STEPS.find(s => !f[s.key]);
    if (next) setCurrentView(next.view);
  }, []);

  const doneCount = ONBOARDING_STEPS.filter(s => flow[s.key]).length;
  const activeStep = ONBOARDING_STEPS.find(s => !flow[s.key]) || ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1];

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">

      {/* Top bar */}
      <div className="flex-shrink-0 h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
        <div className="flex items-center gap-3">
          <span className="text-lg font-extrabold bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent uppercase tracking-wider">
            SORCE
          </span>
          <span className="text-gray-300">·</span>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-gray-700">Getting Started</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Progress */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Step {doneCount + 1} of {ONBOARDING_STEPS.length}</span>
            <div className="w-28 h-1.5 bg-gray-100 rounded-full">
              <div
                className="h-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / ONBOARDING_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
          <button
            onClick={onSkip}
            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
          >
            Skip setup
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* Left step panel */}
        <div className="w-64 flex-shrink-0 border-r border-gray-100 bg-gray-50 flex flex-col py-4 px-3 overflow-y-auto">
          {ONBOARDING_STEPS.map((step) => {
            const done = !!flow[step.key];
            const isActive = step.key === activeStep.key;
            const locked = !done && !isActive;
            const Icon = step.icon;

            return (
              <button
                key={step.key}
                onClick={() => !locked && setCurrentView(step.view)}
                disabled={locked}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left mb-1 transition-all ${
                  done
                    ? 'hover:bg-green-50 text-green-700'
                    : isActive
                    ? 'bg-white shadow-sm border border-gray-200 text-gray-900'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                {/* Step circle */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done
                    ? 'bg-green-500'
                    : isActive
                    ? `bg-gradient-to-br ${step.color}`
                    : 'bg-gray-100'
                }`}>
                  {done ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : locked ? (
                    <Lock className="w-3.5 h-3.5 text-gray-300" />
                  ) : (
                    <Icon className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Label */}
                <div className="min-w-0">
                  <div className={`text-sm font-semibold truncate ${locked ? 'text-gray-300' : ''}`}>
                    {step.label}
                  </div>
                  {isActive && (
                    <div className="text-xs text-gray-400 mt-0.5">Current step</div>
                  )}
                  {done && (
                    <div className="text-xs text-green-500 mt-0.5">Complete</div>
                  )}
                </div>

                {isActive && <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-auto" />}
              </button>
            );
          })}
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
            {/* Step header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold uppercase tracking-widest text-gray-400`}>
                  Step {activeStep.num} of {ONBOARDING_STEPS.length}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{activeStep.title}</h2>
              <p className="text-gray-500 mt-1">{activeStep.description}</p>
            </div>

            {/* Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
