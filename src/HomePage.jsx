import { useState } from 'react';
import { Wand2, MessageCircle, TrendingUp, Zap, ArrowRight, Check, Sparkles, Star, Users, Target, Rocket, BarChart } from 'lucide-react';

export default function HomePage({ onAuthSuccess, onNavigateToPricing }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatedWebsite, setGeneratedWebsite] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [buildStatus, setBuildStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupForm, setSignupForm] = useState({ email: '', password: '', businessName: '' });
  const [signupError, setSignupError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    services: '',
    description: ''
  });

  const [authFormData, setAuthFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    fullName: ''
  });

  const handleGetStarted = () => {
    setShowGenerator(true);
  };

  const handleLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
    setAuthError('');
  };

  const handleSignup = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
    setAuthError('');
  };

  const handleAuthInputChange = (e) => {
    const { name, value } = e.target;
    setAuthFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';

      const payload = authMode === 'signup' 
        ? {
            email: authFormData.email,
            password: authFormData.password,
            businessName: authFormData.businessName,
            fullName: authFormData.fullName
          }
        : {
            email: authFormData.email,
            password: authFormData.password
          };

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (onAuthSuccess) {
        onAuthSuccess(data.user, data.token);
      }

    } catch (err) {
      console.error('Auth error:', err);
      setAuthError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

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
          setGeneratedWebsite(data.html);
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

  const handleTryAgain = () => {
    setGeneratedWebsite(null);
    setIsGenerating(false);
    setProgress(0);
    setBuildStatus('');
    setShowGenerator(false);
    setFormData({
      businessName: '',
      businessType: '',
      services: '',
      description: ''
    });
  };

  const handleDownload = () => {
    const blob = new Blob([generatedWebsite], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.businessName.replace(/\s+/g, '-').toLowerCase()}-website.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isGenerating && !generatedWebsite) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 z-50 flex items-center justify-center">
        <div className="text-center space-y-8 px-4">
          <div className="animate-bounce">
            <Sparkles className="w-20 h-20 text-white mx-auto" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Building {formData.businessName}
          </h2>
          <div className="max-w-md mx-auto">
            <div className="bg-white/20 rounded-full h-4 overflow-hidden backdrop-blur">
              <div 
                className="bg-white h-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white/90 text-lg mt-4 font-medium">
              {Math.round(progress)}%
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md mx-auto">
            <p className="text-white text-xl font-medium animate-pulse">
              {buildStatus}
            </p>
          </div>
          <p className="text-white/70 text-sm max-w-md mx-auto">
            AI is crafting a unique design just for your business
          </p>
        </div>
      </div>
    );
  }

  if (showGenerator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
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
                  onClick={() => setShowGenerator(false)}
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

        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  🎉 Your Website is Ready!
                </h2>
                <p className="text-gray-600">
                  Preview below • Ready to download and use
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleTryAgain}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Generate Another
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Download HTML
                </button>
              </div>
            </div>

            <div className="border-4 border-gray-200 rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <iframe
                srcDoc={generatedWebsite}
                title="Generated Website Preview"
                className="w-full h-full"
                sandbox="allow-scripts"
              />
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (token) {
                    window.location.href = '/dashboard';
                  } else {
                    setShowSignupModal(true);
                  }
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all"
              >
                Get My Website
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
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
            <div className="flex items-center gap-4">
              <button onClick={handleLogin} className="text-gray-700 hover:text-purple-600 font-medium transition">
                Login
              </button>
              <button onClick={onNavigateToPricing} className="text-gray-700 hover:text-purple-600 font-medium transition">
                Pricing
              </button>
              <button onClick={handleGetStarted} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-semibold">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm mb-6">
            <Rocket className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Built for Service-Based Businesses</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Your Website Should<br />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Grow Your Business
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Most websites just sit there. SORCE websites actively work to grow your service business with 
            AI conversations, automated review requests, and SEO blog writing that boosts your rankings.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
          >
            <Wand2 className="w-5 h-5" />
            Generate Your Website
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500 mt-6">
            ✨ Free to generate • 🚀 Live in 2 minutes • 💎 Upgrade for growth features
          </p>
        </div>
      </section>

      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </h2>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    value={authFormData.fullName}
                    onChange={handleAuthInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    name="businessName"
                    placeholder="Business Name"
                    value={authFormData.businessName}
                    onChange={handleAuthInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </>
              )}
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={authFormData.email}
                onChange={handleAuthInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={authFormData.password}
                onChange={handleAuthInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
              {authError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {authError}
                </div>
              )}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {authLoading ? 'Please wait...' : (authMode === 'signup' ? 'Sign Up' : 'Log In')}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === 'signup' ? 'login' : 'signup');
                  setAuthError('');
                }}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                {authMode === 'signup' ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
              </button>
            </div>
            <button
              onClick={() => setShowAuthModal(false)}
              className="mt-4 text-gray-600 hover:text-gray-900 w-full text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showSignupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Your Website</h2>
            <p className="text-gray-600 mb-6">Create a free account to save and manage your website</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSigningUp(true);
              setSignupError('');
              try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                const response = await fetch(`${apiUrl}/api/auth/signup`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: signupForm.email,
                    password: signupForm.password,
                    businessName: signupForm.businessName
                  })
                });
                const data = await response.json();
                if (response.ok) {
                  localStorage.setItem('token', data.token);
                  localStorage.setItem('user', JSON.stringify(data.user));
                  await fetch(`${apiUrl}/api/website`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: data.user.id,
                      htmlContent: generatedWebsite
                    })
                  });
                  window.location.href = '/dashboard';
                } else {
                  setSignupError(data.error || 'Signup failed');
                }
              } catch (error) {
                setSignupError('Network error. Please try again.');
              } finally {
                setIsSigningUp(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name</label>
                <input
                  type="text"
                  value={signupForm.businessName}
                  onChange={(e) => setSignupForm({ ...signupForm, businessName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
              {signupError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {signupError}
                </div>
              )}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowSignupModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSigningUp}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {isSigningUp ? 'Creating Account...' : 'Sign Up Free'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
