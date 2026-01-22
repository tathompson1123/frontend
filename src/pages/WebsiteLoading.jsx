import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Loader2, Check } from 'lucide-react';

export default function WebsiteLoading() {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedWebsite, setGeneratedWebsite] = useState(null);
  const [error, setError] = useState(null);

  const steps = [
  { label: 'Analyzing your business...', duration: 6 },
  { label: 'Designing custom layout...', duration: 8 },
  { label: 'Selecting perfect color scheme...', duration: 7 },
  { label: 'Creating hero section...', duration: 9 },
  { label: 'Building services showcase...', duration: 10 },
  { label: 'Adding contact information...', duration: 8 },
  { label: 'Color grading and transitions...', duration: 9 },
  { label: 'Optimizing for mobile devices...', duration: 8 },
  { label: 'Adding interactive elements...', duration: 10 },
  { label: 'Final polish and quality check... (not bugged, still generating)', duration: 10 }
];

const animateProgress = () => {
  let stepIndex = 0;
  let currentProgress = 0;
  
  const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
  
  const runStep = () => {
    if (stepIndex < steps.length) {
      setCurrentStep(stepIndex);
      
      const stepDuration = steps[stepIndex].duration * 1000; // Convert seconds to ms
      const increment = (steps[stepIndex].duration / totalDuration) * 100;
      
      setTimeout(() => {
        currentProgress += increment;
        setProgress(Math.min(currentProgress, 95)); // Cap at 95 until actual completion
        stepIndex++;
        runStep();
      }, stepDuration);
    }
  };
  
  runStep();
};

  useEffect(() => {
    // Get form data from navigation state
    const formData = location.state?.formData;
    
    if (!formData) {
      navigate('/dashboard?tab=website');
      return;
    }

    // Start generation immediately
    generateWebsite(formData);
  }, []);

const generateWebsite = async (formData) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('token');

  // Start progress animation
  animateProgress();

  try {
    const response = await fetch(`${apiUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        businessName: formData.businessName,
        businessType: formData.businessType,
        tagline: formData.tagline,
        services: formData.services,
        yearsInBusiness: formData.yearsInBusiness,
        certifications: formData.certifications,
        description: formData.description,
        uniqueSellingPoints: formData.uniqueSellingPoints,
        targetCustomer: formData.targetCustomer
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate website');
    }

    if (data.success && data.html) {
      // Auto-save
      if (token) {
        await fetch(`${apiUrl}/api/website`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            htmlContent: data.html,
            pages: data.pages || { 'index.html': data.html }
          })
        });
        console.log('✅ Website auto-saved with all pages');
        
        // Check if we should trigger onboarding step completion
        if (sessionStorage.getItem('trigger-onboarding-step-1') === 'true') {
          sessionStorage.removeItem('trigger-onboarding-step-1');
          
          window.dispatchEvent(new CustomEvent('onboarding-step-complete', { 
            detail: { step: 1 } 
          }));
          
          console.log('✅ Triggered onboarding step 1 completion');
        }
      }

      // Complete progress and set state
      setProgress(100);
      setCurrentStep(steps.length);
      setGeneratedWebsite(data);
      
      // Redirect after delay
      setTimeout(() => {
        navigate('/dashboard?tab=website', { 
          state: { showSuccess: true } 
        });
      }, 1500);
    }
  } catch (err) {
    console.error('Website generation error:', err);
    setError(err.message || 'Something went wrong during website generation');
  }
};
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generation Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard?tab=website')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (generatedWebsite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Website Complete! 🎉</h2>
          <p className="text-gray-600 mb-6">Redirecting to your dashboard...</p>
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Building Your Website
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Our AI is crafting a professional website just for you
            </p>
          </div>

          {/* Spinning Circle */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Outer spinning ring */}
              <div className="w-32 h-32 border-8 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              {/* Inner circle with percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{Math.round(progress)}%</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Current Step */}
          <div className="mb-6">
            <div className="flex items-center gap-3 justify-center text-lg font-semibold text-gray-700">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              <span>{steps[currentStep]?.label || 'Processing...'}</span>
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-2 mb-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                  index < currentStep 
                    ? 'text-green-600' 
                    : index === currentStep 
                    ? 'text-purple-600 font-semibold' 
                    : 'text-gray-400'
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-4 h-4 flex-shrink-0" />
                ) : index === currentStep ? (
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex-shrink-0"></div>
                )}
                <span>{step.label}</span>
              </div>
            ))}
          </div>

          {/* Time Estimate */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-800">
              ⏱️ <strong>Estimated time:</strong> 1-2 minutes for a high-quality, professional website
            </p>
          </div>

          {/* Optional: Fun Facts */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 italic">
              💡 Did you know? Your website is being custom-designed with your exact business information and branding
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
