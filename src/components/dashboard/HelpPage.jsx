import { useState } from 'react';
import {
  CheckCircle, Circle, PlayCircle, Mail, Briefcase, Search,
  MapPin, Globe, Bot, HelpCircle, ExternalLink, RefreshCw,
  MessageCircle, ChevronRight,
} from 'lucide-react';
import { ONBOARDING_STEPS } from './OnboardingScreen';

function getFlow() {
  try { return JSON.parse(localStorage.getItem('onboarding_flow') || '{}'); } catch { return {}; }
}

const STEP_ICONS = {
  flow_csv:      Mail,
  flow_business: Briefcase,
  flow_seo:      Search,
  flow_gbp:      MapPin,
  flow_embed:    Globe,
  flow_agent:    Bot,
};

export default function HelpPage({ setInOnboarding, requestViewChange, setUser }) {
  const [tab, setTab] = useState('onboarding');
  const flow = getFlow();
  const doneCount = ONBOARDING_STEPS.filter(s => flow[s.key]).length;
  const allDone = doneCount === ONBOARDING_STEPS.length;
  const nextStep = ONBOARDING_STEPS.find(s => !flow[s.key]);

  const handleRunOnboarding = () => {
    // Ensure questionnaire is marked complete so the in-dashboard onboarding activates
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    const updated = { ...u, questionnaire_completed: true };
    localStorage.setItem('user', JSON.stringify(updated));
    if (setUser) setUser(updated);
    // Activate onboarding mode in Dashboard
    setInOnboarding(true);
    // Navigate to first incomplete step (or overview if all done)
    if (nextStep) {
      requestViewChange(nextStep.view);
    } else {
      requestViewChange('overview');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Help & Resources</h2>
        <p className="text-gray-500 mt-1">Get the most out of SORCE</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {[
          { key: 'onboarding', label: 'Onboarding' },
          { key: 'support',    label: 'Support' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Onboarding tab ── */}
      {tab === 'onboarding' && (
        <div className="space-y-4">
          {/* Progress summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Setup Progress</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {allDone
                    ? 'All setup steps completed!'
                    : `${doneCount} of ${ONBOARDING_STEPS.length} steps completed`}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-black ${allDone ? 'text-green-600' : 'text-amber-600'}`}>
                  {Math.round((doneCount / ONBOARDING_STEPS.length) * 100)}%
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / ONBOARDING_STEPS.length) * 100}%` }}
              />
            </div>
            {/* Steps list */}
            <div className="space-y-2.5">
              {ONBOARDING_STEPS.map(s => {
                const done = !!flow[s.key];
                const Icon = STEP_ICONS[s.key] || Circle;
                return (
                  <div
                    key={s.key}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      done ? 'bg-green-50' : nextStep?.key === s.key ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-gray-50'
                    }`}
                  >
                    {done
                      ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      : <Circle className={`w-5 h-5 shrink-0 ${nextStep?.key === s.key ? 'text-amber-500' : 'text-gray-300'}`} />
                    }
                    <Icon className={`w-4 h-4 shrink-0 ${done ? 'text-green-600' : nextStep?.key === s.key ? 'text-amber-600' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${done ? 'text-green-800' : nextStep?.key === s.key ? 'text-amber-800' : 'text-gray-500'}`}>
                        {s.label}
                        {nextStep?.key === s.key && <span className="ml-2 text-xs font-normal text-amber-600">← next up</span>}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{s.title}</p>
                    </div>
                    {done && <span className="text-xs text-green-600 font-medium shrink-0">Done</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Run through onboarding CTA */}
          <div className="bg-gradient-to-r from-amber-50 to-blue-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                <PlayCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {allDone ? 'Run through onboarding again' : 'Continue setup'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {allDone
                    ? "All steps done — but you can revisit any of them any time."
                    : nextStep
                    ? `Pick up where you left off. Next: "${nextStep.title}"`
                    : "Let's finish getting SORCE configured for your business."}
                </p>
                <button
                  onClick={handleRunOnboarding}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  {allDone ? 'Run through onboarding' : 'Continue setup'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Support tab ── */}
      {tab === 'support' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-base font-bold text-gray-900 mb-4">Get Help</h3>
            <div className="space-y-3">
              <a
                href="mailto:support@sorceintegrations.com"
                className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
              >
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Email Support</p>
                  <p className="text-xs text-gray-500">support@sorceintegrations.com</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">Quick Tips</p>
                  <ul className="text-xs text-amber-800 space-y-1.5">
                    <li className="flex items-start gap-1.5"><CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />Complete Business Setup so your AI agents know your services and hours</li>
                    <li className="flex items-start gap-1.5"><CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />Run the SEO Audit and install the embed code to appear in Google AI Mode</li>
                    <li className="flex items-start gap-1.5"><CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />Upload your customer list in Email Marketing to send your first campaign</li>
                    <li className="flex items-start gap-1.5"><CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />Deploy the AI Chat Agent so leads get answered 24/7</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-bold text-gray-900">SORCE Assistant</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              The SORCE AI assistant in the bottom-right corner of your dashboard can answer questions about any feature and walk you through how to use it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
