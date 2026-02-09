import { useState, useEffect } from 'react';
import { CheckCircle, Circle, ChevronRight, ChevronLeft, Sparkles, AlertCircle, Phone, MapPin, Briefcase, Users, Globe } from 'lucide-react';

export default function OnboardingWidget({ user, setCurrentView, isMinimized, setIsMinimized, apiUrl, authFetch }) {
  const [completedSteps, setCompletedSteps] = useState(user?.onboarding_steps_completed || {});
  const [businessValidation, setBusinessValidation] = useState({
    contactInfo: false,
    location: false,
    serviceArea: false,
    services: false,
    team: false
  });
  const [isValidating, setIsValidating] = useState(true);

  // 5-Step Onboarding Flow
  const steps = [
    {
      id: 1,
      label: 'Complete business settings',
      view: 'business-settings',
      key: 'step1',
      description: 'Add contact info, location, services & team'
    },
    {
      id: 2,
      label: 'Generate your website',
      view: 'website',
      key: 'step2',
      description: 'Create your AI-powered website',
      requiresStep1: true
    },
    {
      id: 3,
      label: 'Publish your website',
      view: 'website',
      key: 'step3',
      description: 'Make your site live'
    },
    {
      id: 4,
      label: 'Deploy an AI agent',
      view: 'ai-agents',
      key: 'step4',
      description: 'Add chat or lead automation'
    },
    {
      id: 5,
      label: 'Select a plan',
      view: 'billing',
      key: 'step5',
      description: 'Choose your subscription'
    },
  ];

  // Validate business settings for step 1
  const validateBusinessSettings = async () => {
    if (!apiUrl || !authFetch) return;

    setIsValidating(true);

    try {
      // Fetch all required data in parallel
      const [businessInfoRes, servicesRes, employeesRes] = await Promise.all([
        authFetch(`${apiUrl}/api/business-info`),
        authFetch(`${apiUrl}/api/services`),
        authFetch(`${apiUrl}/api/employees`)
      ]);

      const businessInfo = await businessInfoRes.json();
      const servicesData = await servicesRes.json();
      const employeesData = await employeesRes.json();

      const info = businessInfo?.businessInfo || {};
      const services = servicesData?.services || [];
      const employees = employeesData?.employees || [];

      // Validate each requirement
      const validation = {
        contactInfo: Boolean(info.phone && info.email),
        location: Boolean(info.address && info.city && info.state && info.zip_code),
        serviceArea: Boolean(
          (info.service_area_type === 'zipcodes' && info.service_zip_codes?.length > 0) ||
          (info.service_area_type === 'radius' && info.center_zip_code && info.service_radius > 0)
        ),
        services: services.length > 0,
        team: employees.length > 0
      };

      setBusinessValidation(validation);

      // Check if all business settings are complete
      const allComplete = Object.values(validation).every(Boolean);

      if (allComplete && !completedSteps.step1) {
        // Auto-complete step 1
        await markStepComplete(1);
      } else if (!allComplete && completedSteps.step1) {
        // Un-complete step 1 if validation fails but it was marked complete
        await markStepIncomplete(1);
      }

      return validation;
    } catch (error) {
      console.error('Error validating business settings:', error);
    } finally {
      setIsValidating(false);
    }
  };

  // Mark a step as complete
  const markStepComplete = async (stepNumber) => {
    const updatedSteps = { ...completedSteps, [`step${stepNumber}`]: true };
    setCompletedSteps(updatedSteps);

    try {
      await authFetch(`${apiUrl}/api/auth/onboarding/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: stepNumber,
          completedSteps: updatedSteps
        })
      });

      // Update localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        onboarding_steps_completed: updatedSteps,
        onboarding_current_step: stepNumber + 1
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-updated'));
    } catch (error) {
      console.error('Error saving step progress:', error);
    }
  };

  // Mark a step as incomplete (for re-validation)
  const markStepIncomplete = async (stepNumber) => {
    const updatedSteps = { ...completedSteps };
    delete updatedSteps[`step${stepNumber}`];
    setCompletedSteps(updatedSteps);

    try {
      await authFetch(`${apiUrl}/api/auth/onboarding/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: stepNumber,
          completedSteps: updatedSteps
        })
      });

      // Update localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const validStepKeys = ['step1', 'step2', 'step3', 'step4', 'step5'];
      const completedCount = validStepKeys.filter(key => updatedSteps[key]).length;
      const updatedUser = {
        ...currentUser,
        onboarding_steps_completed: updatedSteps,
        onboarding_current_step: stepNumber,
        onboarding_completed: completedCount === 5
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-updated'));
      console.log('📋 Step', stepNumber, 'marked incomplete - validation failed');
    } catch (error) {
      console.error('Error saving step progress:', error);
    }
  };

  // Initial validation on mount
  useEffect(() => {
    if (apiUrl && authFetch) {
      validateBusinessSettings();
    }
  }, [apiUrl, authFetch]);

  // Re-validate when user navigates back from business info
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        validateBusinessSettings();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Re-validate when business info is updated
  useEffect(() => {
    const handleBusinessInfoUpdate = () => {
      console.log('📋 Business info updated - re-validating...');
      validateBusinessSettings();
    };
    window.addEventListener('business-info-updated', handleBusinessInfoUpdate);
    return () => window.removeEventListener('business-info-updated', handleBusinessInfoUpdate);
  }, []);

  // Load completed steps from user data
  useEffect(() => {
    if (user?.onboarding_steps_completed) {
      setCompletedSteps(user.onboarding_steps_completed);
    }
  }, [user]);

  // Listen for step completion events
  useEffect(() => {
    const handleStepComplete = async (event) => {
      const { step } = event.detail;
      console.log('🎉 Onboarding step completed:', step);
      await markStepComplete(step);
    };

    window.addEventListener('onboarding-step-complete', handleStepComplete);
    return () => window.removeEventListener('onboarding-step-complete', handleStepComplete);
  }, [completedSteps, apiUrl, authFetch]);

  // Check website and agent status
  useEffect(() => {
    const checkCompletionStatus = async () => {
      if (!apiUrl || !authFetch) return;

      try {
        // Check website status
        const websiteRes = await authFetch(`${apiUrl}/api/website`);
        const websiteData = await websiteRes.json();

        const hasWebsite = websiteData.success && websiteData.website?.html_content;
        const isPublished = websiteData.website?.is_published;

        // Auto-complete step 2 if website generated
        if (hasWebsite && !completedSteps.step2) {
          await markStepComplete(2);
        }

        // Auto-complete step 3 if website published
        if (isPublished && !completedSteps.step3) {
          await markStepComplete(3);
        }

        // Check agent deployment
        const [chatRes, leadRes] = await Promise.all([
          authFetch(`${apiUrl}/api/agents/website/status`),
          authFetch(`${apiUrl}/api/agents/leadform/status`)
        ]);

        const chatData = await chatRes.json();
        const leadData = await leadRes.json();

        if ((chatData.isDeployed || leadData.isDeployed) && !completedSteps.step4) {
          await markStepComplete(4);
        }
      } catch (error) {
        console.error('Error checking completion status:', error);
      }
    };

    checkCompletionStatus();
  }, [apiUrl, authFetch]);

  // Only count the 5 valid steps (ignore old step6 data from previous flow)
  const validStepKeys = ['step1', 'step2', 'step3', 'step4', 'step5'];
  const completedCount = validStepKeys.filter(key => completedSteps[key]).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  // Mark onboarding complete when all 5 steps done
  useEffect(() => {
    if (completedCount === 5) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, onboarding_completed: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-updated'));
    }
  }, [completedCount]);

  // Don't render until user data is loaded (must be AFTER all hooks)
  if (!user || Object.keys(user).length === 0) {
    return null;
  }

  // Hide widget when all complete
  if (completedCount === 5) {
    return null;
  }

  // Business validation checklist for step 1
  const validationItems = [
    { key: 'contactInfo', label: 'Contact info', icon: Phone },
    { key: 'location', label: 'Location', icon: MapPin },
    { key: 'serviceArea', label: 'Service area', icon: Globe },
    { key: 'services', label: 'Services', icon: Briefcase },
    { key: 'team', label: 'Team members', icon: Users },
  ];

  return (
    <aside className={`fixed top-0 right-0 h-full bg-white shadow-xl transition-all duration-300 z-50 ${isMinimized ? 'w-16' : 'w-72'}`}>
    {/* Header */}
<div className="p-4 border-b border-gray-200 flex items-center justify-between">
  {!isMinimized && (
    <div className="flex items-center gap-2">
      <Sparkles className="w-5 h-5 text-purple-600" />
      <h2 className="font-bold text-gray-900">Get Started</h2>
    </div>
  )}
  <button
    onClick={() => setIsMinimized(!isMinimized)}
    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
    title={isMinimized ? 'Expand' : 'Minimize'}
  >
    {isMinimized ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
  </button>
</div>
      
      {/* Progress Bar */}
      {!isMinimized && (
        <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {completedCount} of {steps.length} complete
            </span>
            <span className="text-sm font-bold text-purple-600">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Minimized View */}
      {isMinimized && (
        <div className="flex flex-col items-center py-4 space-y-3">
          <div className="relative">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="#E5E7EB"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="url(#gradient)"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${progressPercentage * 1.25} ${125.6 - progressPercentage * 1.25}`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9333EA" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-purple-600">{completedCount}</span>
            </div>
          </div>
          {steps.map((step) => (
            <div key={step.id} className="w-full flex justify-center">
              {completedSteps[step.key] ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Steps List */}
      {!isMinimized && (
        <nav className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {steps.map((step) => {
            const isCompleted = completedSteps[step.key];
            const isStep1 = step.id === 1;
            const isLocked = step.requiresStep1 && !completedSteps.step1;

            return (
              <div key={step.id}>
                <button
                  onClick={() => !isLocked && setCurrentView(step.view)}
                  disabled={isLocked}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                    isCompleted
                      ? 'bg-green-50 text-green-900 hover:bg-green-100'
                      : isLocked
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : isLocked ? (
                    <AlertCircle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${
                        isCompleted ? 'text-green-600' : isLocked ? 'text-gray-300' : 'text-gray-400'
                      }`}>
                        {step.id}
                      </span>
                      <span className={`text-sm font-medium truncate ${isCompleted ? 'line-through' : ''}`}>
                        {step.label}
                      </span>
                    </div>
                    {step.description && !isCompleted && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{step.description}</p>
                    )}
                    {isLocked && (
                      <p className="text-xs text-amber-600 mt-0.5">Complete step 1 first</p>
                    )}
                  </div>
                </button>

                {/* Step 1 Validation Checklist */}
                {isStep1 && !isCompleted && (
                  <div className="ml-8 mt-2 mb-3 space-y-1.5 border-l-2 border-purple-200 pl-3">
                    {isValidating ? (
                      <p className="text-xs text-gray-400 italic">Checking...</p>
                    ) : (
                      validationItems.map((item) => {
                        const Icon = item.icon;
                        const isValid = businessValidation[item.key];
                        return (
                          <div
                            key={item.key}
                            className={`flex items-center gap-2 text-xs ${
                              isValid ? 'text-green-600' : 'text-gray-500'
                            }`}
                          >
                            {isValid ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Circle className="w-3.5 h-3.5" />
                            )}
                            <Icon className="w-3 h-3" />
                            <span className={isValid ? 'line-through' : ''}>{item.label}</span>
                          </div>
                        );
                      })
                    )}
                    <button
                      onClick={() => {
                        setCurrentView('business-settings');
                        // Trigger re-validation after a delay
                        setTimeout(validateBusinessSettings, 1000);
                      }}
                      className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                    >
                      <span>Go to Business Settings</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      )}

      {/* Completion Message */}
      {!isMinimized && completedCount === steps.length && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-200">
          <div className="text-center">
            <div className="text-2xl mb-2">🎉</div>
            <p className="text-sm font-bold text-green-900 mb-1">All Done!</p>
            <p className="text-xs text-green-700">You've completed the setup</p>
          </div>
        </div>
      )}
    </aside>
  );
}
