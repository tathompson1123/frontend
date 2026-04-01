import { useState, useEffect } from 'react';
import { 
  X, 
  Globe, 
  Briefcase, 
  Users, 
  Star, 
  Bot, 
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

export default function OnboardingWizard({ user, onComplete, onSkip, apiUrl, authFetch }) {
  const [currentStep, setCurrentStep] = useState(user?.onboarding_current_step || 1);
  const [completedSteps, setCompletedSteps] = useState(
    user?.onboarding_steps_completed || {
      step1: false,
      step2: false,
      step3: false,
      step4: false,
      step5: false,
      step6: false
    }
  );

  const steps = [
    {
      number: 1,
      title: 'Integrate Your Website',
      description: 'Connect SORCE to your existing site',
      icon: Globe,
      color: 'purple',
      component: 'settings'
    },
    {
      number: 2,
      title: 'Business Information',
      description: 'Tell us about your business',
      icon: Briefcase,
      color: 'blue',
      component: 'business-settings'
    },
    {
      number: 3,
      title: 'Add Customers',
      description: 'Import your customer list',
      icon: Users,
      color: 'green',
      component: 'customers-leads'
    },
    {
      number: 4,
      title: 'Google Business Profile',
      description: 'Connect your review link',
      icon: Star,
      color: 'yellow',
      component: 'google-business'
    },
    {
      number: 5,
      title: 'AI Agent Setup',
      description: 'Configure automated responses',
      icon: Bot,
      color: 'indigo',
      component: 'ai-agents'
    },
    {
      number: 6,
      title: 'Select Your Plan',
      description: 'Unlock all features',
      icon: CreditCard,
      color: 'pink',
      component: 'billing'
    }
  ];

  // Save progress to backend
  const saveProgress = async (step, completed = false) => {
    try {
      await authFetch(`${apiUrl}/api/auth/onboarding/progress`, {
        method: 'POST',
        body: JSON.stringify({
          currentStep: step,
          completedSteps: completed ? { ...completedSteps, [`step${step}`]: true } : completedSteps
        })
      });

      if (completed) {
        setCompletedSteps(prev => ({ ...prev, [`step${step}`]: true }));
      }
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
    }
  };

  const handleNext = async () => {
    // Mark current step as completed
    await saveProgress(currentStep, true);
    
    if (currentStep < 6) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await saveProgress(nextStep, false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    try {
      await authFetch(`${apiUrl}/api/auth/onboarding/skip`, {
        method: 'POST'
      });
      onSkip();
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  const handleComplete = async () => {
    try {
      await authFetch(`${apiUrl}/api/auth/onboarding/complete`, {
        method: 'POST'
      });
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleGoToStep = (stepNumber) => {
    onComplete(); // Close onboarding wizard
    // The parent Dashboard component will handle navigation
    const step = steps.find(s => s.number === stepNumber);
    if (step && step.component) {
      window.dispatchEvent(new CustomEvent('navigate-to-view', { 
        detail: { view: step.component } 
      }));
    }
  };

  const currentStepData = steps.find(s => s.number === currentStep);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-600 via-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Welcome to Your Dashboard!</h2>
                <p className="text-amber-100 text-sm">Let's get you set up in 6 easy steps</p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden"
              >
                <div
                  className={`h-full transition-all duration-500 ${
                    completedSteps[`step${step.number}`] || step.number < currentStep
                      ? 'bg-green-400'
                      : step.number === currentStep
                      ? 'bg-white'
                      : 'bg-transparent'
                  }`}
                  style={{
                    width: completedSteps[`step${step.number}`] || step.number < currentStep ? '100%' : step.number === currentStep ? '50%' : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          <p className="text-sm text-amber-100 mt-2">
            Step {currentStep} of 6 • {Object.values(completedSteps).filter(Boolean).length} steps completed
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Current Step Info */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${currentStepData.color}-500 to-${currentStepData.color}-600 flex items-center justify-center shadow-lg`}>
                <currentStepData.icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{currentStepData.title}</h3>
                <p className="text-gray-600">{currentStepData.description}</p>
              </div>
            </div>

            {/* Step Instructions */}
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
              {currentStep === 1 && (
                <div>
                  <p className="text-gray-700 mb-4">
                    Add the SORCE embed code to your existing website — Wix, Squarespace, WordPress, Webflow, and more. This unlocks bookings, lead capture, and the AI chat agent on your site.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Works with any website platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>One-line install — paste and go</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Enables booking widget and AI chat agent</span>
                    </li>
                  </ul>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <p className="text-gray-700 mb-4">
                    Fill in your business details, services, and team information. This helps us personalize your experience and powers your booking system.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Add business hours and location</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>List your services and pricing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Add team members</span>
                    </li>
                  </ul>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <p className="text-gray-700 mb-4">
                    Import your existing customers to manage them all in one place. Upload a CSV file or add them manually.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Upload CSV with customer data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Track customer interactions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Segment and organize contacts</span>
                    </li>
                  </ul>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <p className="text-gray-700 mb-4">
                    Connect your Google Business Profile to automatically request and manage reviews from your customers.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Add your Google review link</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Automate review requests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Boost your online reputation</span>
                    </li>
                  </ul>
                </div>
              )}

              {currentStep === 5 && (
                <div>
                  <p className="text-gray-700 mb-4">
                    Configure AI agents to automatically respond to customer inquiries, follow up on leads, and manage reviews.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Customize AI agent personality</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Set response templates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Enable automated workflows</span>
                    </li>
                  </ul>
                </div>
              )}

              {currentStep === 6 && (
                <div>
                  <p className="text-gray-700 mb-4">
                    Choose a plan that fits your business needs. All plans include access to core features - upgrade for advanced automation and priority support.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Unlock website publishing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Enable AI agents and automation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Access all premium features</span>
                    </li>
                  </ul>
                </div>
              )}

              <button
                onClick={() => handleGoToStep(currentStep)}
                className="mt-6 w-full bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Go to {currentStepData.title}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* All Steps Overview */}
          <div className="mt-8">
            <h4 className="font-semibold text-gray-900 mb-4">Setup Progress</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {steps.map((step) => {
                const Icon = step.icon;
                const isCompleted = completedSteps[`step${step.number}`];
                const isCurrent = step.number === currentStep;

                return (
                  <button
                    key={step.number}
                    onClick={() => setCurrentStep(step.number)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isCurrent
                        ? 'border-amber-600 bg-amber-50'
                        : isCompleted
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCompleted
                          ? 'bg-green-500'
                          : isCurrent
                          ? `bg-${step.color}-500`
                          : 'bg-gray-200'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : (
                          <Icon className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-gray-500'}`} />
                        )}
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${isCurrent ? 'text-amber-600' : isCompleted ? 'text-green-600' : 'text-gray-900'}`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-gray-600 hover:text-gray-900 font-medium transition"
            >
              Skip for now
            </button>

            <div className="flex items-center gap-3">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Previous
                </button>
              )}
              
              {currentStep < 6 ? (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-amber-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
                >
                  Next Step
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
                >
                  Complete Setup
                  <CheckCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
