import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wand2, Sparkles } from 'lucide-react';
import GenerationProgress from '../components/GenerationProgress';
import SignupModal from '../components/SignupModal';

export default function WebsiteGenerator() {
  const navigate = useNavigate();
  const location = useLocation();
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
    description: '',
    tagline: '',
    yearsInBusiness: '',
    certifications: '',
    uniqueSellingPoints: '',
    targetCustomer: '',
    // NEW: Contact & location fields
    phone: '',
    email: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (location.state?.formData) {
      const dashboardData = location.state.formData;
      
      setFormData({
        businessName: dashboardData.businessName || '',
        businessType: dashboardData.businessType || '',
        services: dashboardData.services || '',
        description: dashboardData.description || '',
        tagline: dashboardData.tagline || '',
        yearsInBusiness: dashboardData.yearsInBusiness || '',
        certifications: dashboardData.certifications || '',
        uniqueSellingPoints: dashboardData.uniqueSellingPoints || '',
        targetCustomer: dashboardData.targetCustomer || '',
        phone: dashboardData.phone || '',
        email: dashboardData.email || '',
        city: dashboardData.city || '',
        state: dashboardData.state || '',
      });

      if (location.state.isRegeneration) {
        setTimeout(() => {
          handleGenerate(null, dashboardData);
        }, 500);
      }
    }
  }, [location.state]);
  
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

  const handleGenerate = async (e, preFilledData = null) => {
    if (e) e.preventDefault();
    
    const dataToSubmit = preFilledData || formData;
    
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setBuildStatus('Starting AI generation...');
    simulateBuildProgress();
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');

      console.log('🔍 API URL:', apiUrl);
      console.log('🔍 Has token:', !!token);
      
      if (!token) {
        setError('Please log in to generate a website');
        setIsGenerating(false);
        setProgress(0);
        setBuildStatus('');
        navigate('/login');
        return;
      }
      
      // V2 endpoint - also saves business info to DB
      const response = await fetch(`${apiUrl}/api/generate-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          businessName: dataToSubmit.businessName,
          businessType: dataToSubmit.businessType,
          tagline: dataToSubmit.tagline,
          services: dataToSubmit.services,
          yearsInBusiness: dataToSubmit.yearsInBusiness,
          certifications: dataToSubmit.certifications,
          description: dataToSubmit.description,
          uniqueSellingPoints: dataToSubmit.uniqueSellingPoints,
          targetCustomer: dataToSubmit.targetCustomer,
          phone: dataToSubmit.phone,
          email: dataToSubmit.email,
          city: dataToSubmit.city,
          state: dataToSubmit.state,
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
          setGeneratedWebsite(data.html);
          
          // Auto-save if logged in
         // if (token) {
           // fetch(`${apiUrl}/api/website`, {
             // method: 'POST',
             // headers: {
               // 'Content-Type': 'application/json',
               // 'Authorization': `Bearer ${token}`
            //  },
            //  body: JSON.stringify({
              //  htmlContent: data.html,
               // pages: data.pages || { 'index.html': data.html }
            //  })
          //  }).then(() => console.log('✅ Website auto-saved'))
           //   .catch(err => console.error('⚠️ Could not auto-save:', err));
        //  }
          
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-blue-600 bg-clip-text text-transparent">
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
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
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
              
              <div className="flex-1 overflow-hidden">
                <iframe
                  srcDoc={generatedWebsite}
                  title="Generated Website Preview"
                  className="w-full h-full"
                  style={{ border: 'none' }}
                  onLoad={(e) => {
                    try {
                      const iframeDoc = e.target.contentDocument;
                      iframeDoc.addEventListener('click', (event) => {
                        event.stopPropagation();
                      });
                    } catch (err) {
                      console.log('Cannot access iframe:', err);
                    }
                  }}
                />
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

              <button
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (token) {
                    navigate('/dashboard');
                  } else {
                    setShowSignupModal(true);
                  }
                }}
                className="w-full bg-gradient-to-r from-amber-600 to-blue-600 text-white px-8 py-5 rounded-xl font-bold text-xl hover:shadow-2xl transition-all mb-8"
              >
                Get My Website Free
              </button>

              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">What's Included:</h3>
                
                {[
                  { title: 'AI-Generated Website', desc: 'Professional design created just for your business' },
                  { title: 'Mobile Responsive', desc: 'Looks perfect on phones, tablets, and desktops' },
                  { title: 'Fast Hosting Included', desc: 'Your site is hosted and live 24/7' },
                  { title: 'Easy to Edit', desc: 'Make changes anytime with AI assistance' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-blue-50 rounded-xl p-6 border-2 border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-gray-900">Want to grow faster?</h4>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Upgrade to add AI chat, automated reviews, and daily SEO content
                </p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full bg-white text-amber-600 border-2 border-amber-600 px-4 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-all"
                >
                  View Growth Plans
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  ✨ Free forever • 🚀 No credit card required • 💎 Upgrade anytime
                </p>
              </div>
            </div>
          </div>
        </div>

        <SignupModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          generatedWebsite={generatedWebsite}
          onSuccess={handleSignupSuccess}
        />
      </div>
    );
  }

  // ===== GENERATION FORM =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50 to-pink-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-blue-600 bg-clip-text text-transparent">
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
            {/* === BASIC INFO === */}
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-600">📋</span> Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name *</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="e.g., Mike's Plumbing Service"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Type *</label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
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
                    <option value="auto-detailing">Auto Detailing</option>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tagline / Slogan</label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleInputChange}
                    placeholder="e.g., Quality Service Since 1995"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* === CONTACT & LOCATION === */}
            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-green-600">📍</span> Contact & Location
              </h3>
              <p className="text-xs text-gray-500 mb-4">This info appears on your website and is saved to your Business Settings</p>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Business Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Business Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="contact@mybusiness.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g., Seattle"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="e.g., WA"
                      maxLength="2"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* === SERVICES & EXPERTISE === */}
            <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-amber-600">🔧</span> Services & Expertise
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Services Offered</label>
                  <input
                    type="text"
                    name="services"
                    value={formData.services}
                    onChange={handleInputChange}
                    placeholder="e.g., Emergency repairs, drain cleaning, water heater installation"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Tell us about your business, what makes you special, your experience..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
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
                className="flex-1 bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
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
