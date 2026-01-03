import { useState } from 'react';
import { Wand2, MessageCircle, TrendingUp, Zap, ArrowRight, Check, Sparkles, Code, BarChart3, Calendar } from 'lucide-react';

export default function HomePage({ onAuthSuccess }) {
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

  // Form state
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    services: '',
    description: ''
  });

  // Auth form state
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

  // Loading screen
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
              <p className="text-gray-600 mb-4">
                Want to add AI chat widget and booking system to this website?
              </p>
              <button
                onClick={handleSignup}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Upgrade to Pro Plan →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generator form
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

  // Full homepage
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation */}
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
              <button
                onClick={handleLogin}
                className="text-gray-700 hover:text-purple-600 font-medium transition"
              >
                Login
              </button>
              <button
                onClick={handleGetStarted}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-semibold"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm mb-6">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">AI-Powered Website Builder</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Build Your Website in Minutes<br />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Start Growing Today
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Generate professional websites for your clients with AI, then upgrade to add chat widgets and booking systems automatically.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Wand2 className="w-5 h-5" />
              Generate Website with AI
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            ✨ No credit card required • 🚀 Live in 2 minutes
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple workflow to deliver powerful websites to your customers
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">For Your Customers:</h3>
            <div className="space-y-4">
              {[
                'You generate their professional website with AI',
                'Pro Plan customers get chat widget automatically embedded',
                'Pro/Expert Plans get booking system automatically embedded',
                'Visitors to their site can chat with AI and book appointments',
                'Business owner gets email notifications for all bookings'
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-lg text-gray-700 pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-300">
              <MessageCircle className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Chat Agent</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Never miss a lead</li>
                <li>✓ Respond 24/7 automatically</li>
                <li>✓ Qualify prospects instantly</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300">
              <Calendar className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Booking System</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ 3x more bookings</li>
                <li>✓ Reduce phone calls</li>
                <li>✓ Automated confirmations</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white/50">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why SORCE is Different
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Other builders just give you a website. SORCE gives you embedded growth tools.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Automated Google Reviews
            </h3>
            <p className="text-gray-600 mb-6">
              Automatically sends review requests after job completion. Increases reviews 100x faster than organic growth.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-6">
              <MessageCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Embedded AI Chat
            </h3>
            <p className="text-gray-600 mb-6">
              Chat widget automatically embedded on Pro+ plans. Visitors get instant responses 24/7 without you lifting a finger.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-6">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Auto-Embedded Booking
            </h3>
            <p className="text-gray-600 mb-6">
              Booking system automatically added to websites on Pro+ plans. Customers book online 24/7 without phone calls.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your agency needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Original Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <div className="mb-6">
              <Code className="w-12 h-12 text-gray-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Original</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-gray-900">$29</span>
                <span className="text-gray-600">.95/mo</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Website generation only</p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">AI Website Generator</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Professional Templates</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Mobile Responsive</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Download HTML</span>
              </div>
            </div>

            <button
              onClick={handleSignup}
              className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
            >
              Get Started
            </button>
          </div>

          {/* Pro Plan - POPULAR */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-2xl p-8 border-4 border-purple-500 relative transform scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold">
              MOST POPULAR
            </div>

            <div className="mb-6">
              <MessageCircle className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-gray-900">$59</span>
                <span className="text-gray-600">.95/mo</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Website + AI Chat + Booking</p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-900 font-medium">Everything in Original, plus:</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">✨ AI Chat Widget (Auto-Embedded)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">📅 Booking System (Auto-Embedded)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Email Notifications</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Customer Database</span>
              </div>
            </div>

            <button
              onClick={handleSignup}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-xl transition-all"
            >
              Get Started
            </button>
          </div>

          {/* Expert Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-300">
            <div className="mb-6">
              <BarChart3 className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Expert</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-gray-900">$95</span>
                <span className="text-gray-600">.99/mo</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Everything + Analytics</p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-900 font-medium">Everything in Pro, plus:</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">📊 Advanced Analytics Dashboard</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Google Review Automation</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Multi-Employee Scheduling</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Priority Support</span>
              </div>
            </div>

            <button
              onClick={handleSignup}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 mt-8">
          All plans include 30-day money-back guarantee • No setup fees • Cancel anytime
        </p>
      </section>

      {/* Comparison Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              SORCE vs Everyone Else
            </h2>
            <p className="text-xl text-gray-600">
              Other builders just give you HTML. We give you a complete business system.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Other Website Builders
              </h3>
              <div className="space-y-4">
                {[
                  'Just generates static HTML',
                  'No embedded features',
                  'You install widgets manually',
                  'No lead capture',
                  'No booking system'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-600 text-sm">✗</span>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-300 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                SORCE
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                SORCE Platform
              </h3>
              <div className="space-y-4">
                {[
                  'AI-generated websites',
                  'Chat widget auto-embedded',
                  'Booking system auto-embedded',
                  '24/7 AI lead capture',
                  'Complete business platform'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-900 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-12 text-white">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Real Results for Your Customers
            </h2>
            <p className="text-xl text-purple-100">
              Businesses using SORCE Pro+ see massive growth
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">3x</div>
              <div className="text-purple-100">More Bookings</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-purple-100">AI Responses</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">67%</div>
              <div className="text-purple-100">Less Phone Calls</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100x</div>
              <div className="text-purple-100">Faster Reviews</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Build Better Websites?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Start generating AI websites for your clients today. Upgrade to Pro to auto-embed chat and booking systems.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-xl hover:shadow-2xl transition-all inline-flex items-center gap-3"
          >
            <Wand2 className="w-6 h-6" />
            Generate Your First Website
            <ArrowRight className="w-6 h-6" />
          </button>
          <p className="text-sm text-gray-500 mt-6">
            No credit card required • Generate websites instantly
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">SORCE</span>
            </div>
            
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <button
                onClick={handleLogin}
                className="text-gray-400 hover:text-white transition"
              >
                Login
              </button>
              <button
                onClick={handleSignup}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition font-semibold"
              >
                Sign Up
              </button>
            </div>
            
            <div className="text-gray-400 text-sm">
              © 2025 SORCE. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
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
                    placeholder="Agency Name"
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
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
