import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Sparkles } from 'lucide-react';
import GenerationProgress from '../components/GenerationProgress';
import SignupModal from '../components/SignupModal';

export default function WebsiteGenerator() {
  const navigate = useNavigate();
  const [generatedWebsite, setGeneratedWebsite] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [buildStatus, setBuildStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    services: '',
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const simulateBuildProgress = () => {
    const steps = [
      { message: 'Analyzing your business...', duration: 800 },
      { message: 'Designing layout...', duration: 1000 },
      { message: 'Choosing color scheme...', duration: 700 },
      { message: 'Creating hero section...', duration: 900 },
      { message: 'Building services section...', duration: 800 },
      { message: 'Adding contact information...', duration: 700 },
      { message: 'Optimizing for mobile...', duration: 600 },
      { message: 'Finalizing your website...', duration: 500 }
    ];

    let currentStep = 0;
    let currentProgress = 0;

    const runStep = () => {
      if (currentStep < steps.length) {
        setBuildStatus(steps[currentStep].message);
        currentProgress += (100 / steps.length);
        setProgress(Math.min(currentProgress, 95));
        
        setTimeout(() => {
          currentStep++;
          runStep();
        }, steps[currentStep].duration);
      }
    };

    runStep();
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setBuildStatus('Starting AI generation...');

    simulateBuildProgress();

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const response = await fetch(`${apiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessType: formData.businessType,
          services: formData.services,
          description: formData.description
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate website');
      }

      if (data.success && data.html) {
        setBuildStatus('Complete! 🎉');
        setProgress(100);
        
        setTimeout(() => {
          console.log('✅ Setting generated website, length:', data.html.length);
          console.log('✅ First 200 chars:', data.html.substring(0, 200));
          setGeneratedWebsite(data.html);
          setIsGenerating(false);
          setError(null);
        }, 500);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('❌ Generation error:', err);
      setError(err.message || 'Failed to generate website. Please try again.');
      setIsGenerating(false);
      setProgress(0);
      setBuildStatus('');
    }
  };

  const handleSignupSuccess = () => {
    navigate('/dashboard');
  };

  // Loading screen
  if (isGenerating && !generatedWebsite) {
    return (
      <GenerationProgress
        businessName={formData.businessName}
        progress={progress}
        buildStatus={buildStatus}
      />
    );
  }

  // Preview screen
  if (generatedWebsite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  SORCE
                </span>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
          {/* Left Half - Website Preview */}
          <div className="w-full lg:w-1/2 p-4 lg:p-6 overflow-hidden">
            <div className="bg-white rounded-xl shadow-xl h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      🎉 Your Website Preview
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      See how your site looks live
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const win = window.open('', '_blank');
                      win.document.write(generatedWebsite);
                      win.document.close();
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                  >
                    Open in New Tab
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden">
               <div className="flex-1 overflow-auto bg-white">
  <div 
    dangerouslySetInnerHTML={{ __html: generatedWebsite }}
    style={{ minHeight: '100%' }}
  />
</div>
              </div>
            </div>
          </div>

          {/* Right Half - Get Website CTA */}
          <div className="w-full lg:w-1/2 p-4 lg:p-6 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl p-8 sticky top-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Ready to Launch?
                </h2>
                <p className="text-lg text-gray-600">
                  Save your website and start growing your business today
                </p>
              </div>

              {/* Main CTA Button */}
              <button
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (token) {
                    navigate('/dashboard');
                  } else {
                    setShowSignupModal(true);
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-5 rounded-xl font-bold text-xl hover:shadow-2xl transition-all mb-8"
              >
                Get My Website Free
              </button>

              {/* What's Included */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">What's Included:</h3>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">AI-Generated Website</p>
                    <p className="text-sm text-gray-600">Professional design created just for your business</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Mobile Responsive</p>
                    <p className="text-sm text-gray-600">Looks perfect on phones, tablets, and desktops</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Fast Hosting Included</p>
                    <p className="text-sm text-gray-600">Your site is hosted and live 24/7</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Easy to Edit</p>
                    <p className="text-sm text-gray-600">Make changes anytime with AI assistance</p>
                  </div>
                </div>
              </div>

              {/* Growth Features Upsell */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-gray-900">Want to grow faster?</h4>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Upgrade to add AI chat, automated reviews, and daily SEO content
                </p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full bg-white text-purple-600 border-2 border-purple-600 px-4 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all"
                >
                  View Growth Plans
                </button>
              </div>

              {/* Trust Badge */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  ✨ Free forever • 🚀 No credit card required • 💎 Upgrade anytime
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Signup Modal */}
        <SignupModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          generatedWebsite={generatedWebsite}
          onSuccess={handleSignupSuccess}
        />
      </div>
    );
  }

  // Generation form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                SORCE
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Generate Your Website with AI
            </h2>
            <p className="text-gray-600">
              Fill in your business details and watch AI create your website instantly
            </p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="e.g., Mike's Plumbing Service"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Type *
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
              >
                <option value="">Select a business type...</option>
                <option value="plumbing">Plumbing</option>
                <option value="hvac">HVAC</option>
                <option value="landscaping">Landscaping</option>
                <option value="cleaning">Cleaning</option>
                <option value="electrical">Electrical</option>
                <option value="carpentry">Carpentry</option>
                <option value="painting">Painting</option>
                <option value="roofing">Roofing</option>
                <option value="auto-repair">Auto Repair</option>
                <option value="salon">Hair Salon / Barbershop</option>
                <option value="spa">Spa / Massage</option>
                <option value="fitness">Personal Training / Gym</option>
                <option value="photography">Photography</option>
                <option value="pet-grooming">Pet Grooming</option>
                <option value="catering">Catering</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Services Offered
              </label>
              <input
                type="text"
                name="services"
                value={formData.services}
                onChange={handleInputChange}
                placeholder="e.g., Emergency repairs, drain cleaning, water heater installation"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell us about your business, what makes you special, your experience..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <Wand2 className="w-5 h-5" />
                <span>Generate Website</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
