import { useState, useEffect } from 'react';
import { CheckCircle, Circle, ChevronRight, ChevronLeft, Sparkles, X } from 'lucide-react';

export default function OnboardingWidget({ user, setCurrentView, isMinimized, setIsMinimized, apiUrl, authFetch }) {
  const [completedSteps, setCompletedSteps] = useState({});
  const [hasWebsite, setHasWebsite] = useState(false);

  // Don't render until user data is loaded
  if (!user || Object.keys(user).length === 0) {
    return null;
  }

  useEffect(() => {
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    if (completedCount === 6) {
      // Mark onboarding as complete
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        onboarding_completed: true
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-updated'));
    }
  }, [completedSteps]);

  useEffect(() => {
  console.log('🔍 Widget Debug:', {
    completedSteps,
    completedCount: Object.values(completedSteps).filter(Boolean).length,
    userOnboardingSteps: user?.onboarding_steps_completed
  });
}, [completedSteps, user]);

  // Check for actual completion status
  useEffect(() => {
    const checkCompletionStatus = async () => {
      try {
        // Check if website exists
        const websiteResponse = await authFetch(`${apiUrl}/api/website`);
        const websiteData = await websiteResponse.json();
        
        const websiteExists = websiteData.success && websiteData.website?.html_content;
        setHasWebsite(websiteExists);

        // Auto-complete step 1 if website exists
        if (websiteExists && !completedSteps.step1) {
          const updatedSteps = { ...completedSteps, step1: true };
          setCompletedSteps(updatedSteps);
          
          // Save to backend
          await authFetch(`${apiUrl}/api/auth/onboarding/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentStep: 2,
              completedSteps: updatedSteps
            })
          });

          // Update localStorage
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = {
            ...currentUser,
            onboarding_steps_completed: updatedSteps,
            onboarding_current_step: 2
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          window.dispatchEvent(new Event('user-updated'));
        }
      } catch (error) {
        console.error('Error checking completion status:', error);
      }
    };

    if (apiUrl && authFetch) {
      checkCompletionStatus();
    }
  }, [apiUrl, authFetch]);

  useEffect(() => {
    // Load completed steps from user data
    if (user?.onboarding_steps_completed) {
      setCompletedSteps(user.onboarding_steps_completed);
    }
  }, [user]);

  // Listen for step completion events
 useEffect(() => {
  const handleStepComplete = async (event) => {
    const { step } = event.detail;
    
    console.log('🎉 Onboarding step completed:', step);
    
    const updatedSteps = {
      ...completedSteps,
      [`step${step}`]: true
    };
    
    setCompletedSteps(updatedSteps);
    
    // SAVE TO BACKEND - This was missing!
    try {
      await authFetch(`${apiUrl}/api/auth/onboarding/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: step,
          completedSteps: updatedSteps
        })
      });
      
      console.log('✅ Saved onboarding progress to backend');
      
      // Update localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        onboarding_steps_completed: updatedSteps,
        onboarding_current_step: step
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-updated'));
      
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
    }
  };

  window.addEventListener('onboarding-step-complete', handleStepComplete);
  return () => window.removeEventListener('onboarding-step-complete', handleStepComplete);
}, [completedSteps, apiUrl, authFetch]);

  const steps = [
    { id: 1, label: 'Generate your website', view: 'website', key: 'step1' },
    { id: 2, label: 'Publish your website', view: 'website', key: 'step2' },
    { id: 3, label: 'Add a customer or lead', view: 'customers-leads', key: 'step3' },
    { id: 4, label: 'Create a booking', view: 'booking-calendar', key: 'step4' },
    { id: 5, label: 'Deploy an AI agent', view: 'ai-agents', key: 'step5' },
    { id: 6, label: 'Select a plan', view: 'billing', key: 'step6' },
  ];

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  if (completedCount === 6) {
    return null;
  }

  // Add this around line 90 in OnboardingWidget.jsx, after the other useEffects

useEffect(() => {
  const checkAgentDeployment = async () => {
    if (!apiUrl || !authFetch) return;
    
    try {
      // Check if any agent is deployed
      const chatResponse = await authFetch(`${apiUrl}/api/agents/website/status`);
      const leadResponse = await authFetch(`${apiUrl}/api/agents/leadform/status`);
      
      const chatData = await chatResponse.json();
      const leadData = await leadResponse.json();
      
      const anyAgentDeployed = chatData.isDeployed || leadData.isDeployed;
      
      // If any agent is deployed and step 5 isn't marked complete, mark it
      if (anyAgentDeployed && !completedSteps.step5) {
        console.log('🤖 Agent detected as deployed - marking step 5 complete');
        
        const updatedSteps = { ...completedSteps, step5: true };
        setCompletedSteps(updatedSteps);
        
        // Save to backend
        await authFetch(`${apiUrl}/api/auth/onboarding/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentStep: 5,
            completedSteps: updatedSteps
          })
        });
        
        // Update localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...currentUser,
          onboarding_steps_completed: updatedSteps,
          onboarding_current_step: 5
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('user-updated'));
      }
    } catch (error) {
      console.error('Error checking agent deployment:', error);
    }
  };
  
  checkAgentDeployment();
}, [apiUrl, authFetch, completedSteps.step5]);

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
            
            return (
              <button
                key={step.id}
                onClick={() => setCurrentView(step.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                  isCompleted
                    ? 'bg-green-50 text-green-900 hover:bg-green-100'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                      {step.id}
                    </span>
                    <span className={`text-sm font-medium truncate ${isCompleted ? 'line-through' : ''}`}>
                      {step.label}
                    </span>
                  </div>
                </div>
              </button>
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
