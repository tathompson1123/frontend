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
    <button
      onClick={() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
          // Already logged in - go to dashboard
          window.location.href = '/dashboard';
        } else {
          // Not logged in - show signup modal
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
    );  
  }  
  
  // Full homepage - BENEFITS FOCUSED
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
                onClick={onNavigateToPricing}
                className="text-gray-700 hover:text-purple-600 font-medium transition"
              >
                Pricing
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
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Wand2 className="w-5 h-5" />
              Generate Your Website
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            ✨ Free to generate • 🚀 Live in 2 minutes • 💎 Upgrade for growth features
          </p>
        </div>
      </section>

      {/* The Problem Section - PROFESSIONAL VERSION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Traditional Websites Don't Work
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Most websites are passive brochures. They don't engage visitors, capture leads, or drive growth.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-red-500">
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6">
              <Target className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Low Engagement Rates</h3>
            <p className="text-gray-600 mb-4">
              The average website converts only 2-3% of visitors. Without proactive engagement, 
              97% of your traffic leaves without taking action.
            </p>
            <div className="bg-red-50 rounded-lg p-3 text-sm text-red-900 font-medium">
              Lost Opportunity: $1,000s in potential revenue monthly
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-orange-500">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Limited Availability</h3>
            <p className="text-gray-600 mb-4">
              Service businesses lose 60% of potential bookings to competitors simply because 
              customers can't reach them after hours or on weekends.
            </p>
            <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-900 font-medium">
              Impact: Competitors capture your overflow traffic
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-yellow-500">
            <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
              <BarChart className="w-7 h-7 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Invisible on Google</h3>
            <p className="text-gray-600 mb-4">
              Without consistent reviews and fresh content, service businesses struggle to rank 
              on Google Maps and organic search—where 80% of customers find providers.
            </p>
            <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-900 font-medium">
              Result: Customers never see you in search results
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How SORCE Actually Grows Your Business
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Three automated systems working 24/7 to turn visitors into customers
          </p>
        </div>

        <div className="space-y-16">
          {/* Benefit 1: AI Conversation Starter */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full mb-4">
                <MessageCircle className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-900">Benefit #1</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                AI Starts Conversations with Every Visitor
              </h3>
              <p className="text-xl text-gray-600 mb-6">
                Most visitors leave within 10 seconds. SORCE's AI agent engages them immediately, 
                asks qualifying questions, and captures their contact info—even while you sleep.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Never miss a lead</p>
                    <p className="text-gray-600">Responds to website visitors 24/7, even at 2am</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Qualifies prospects instantly</p>
                    <p className="text-gray-600">Asks the right questions to identify serious customers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Captures contact info</p>
                    <p className="text-gray-600">Turns anonymous visitors into leads you can follow up with</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8 border-2 border-purple-300">
              <div className="bg-white rounded-xl p-6 shadow-lg mb-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">AI Agent</p>
                    <p className="text-gray-900 font-medium">
                      Hi! I noticed you're looking at our plumbing services. What's bringing you in today?
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Visitor</p>
                    <p className="text-gray-900">I have a leaky faucet that needs fixing...</p>
                  </div>
                </div>
              </div>
              <p className="text-center text-purple-900 font-semibold">
                ✨ Engagement Rate: 67% vs 2% industry average
              </p>
            </div>
          </div>

          {/* Benefit 2: Automated Review Requests */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl p-8 border-2 border-green-300">
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold text-gray-900">Job Completed</span>
                  </div>
                  <p className="text-sm text-gray-600">Fixed water heater for John Smith</p>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-green-600" />
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-gray-900">Auto-Send Review Request</span>
                  </div>
                  <p className="text-sm text-gray-600">Sent via email & SMS after 2 hours</p>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-green-600" />
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-900">Google Ranking ↑</span>
                  </div>
                  <p className="text-sm text-gray-600">More reviews = higher visibility</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full mb-4">
                <Star className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-900">Benefit #2</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Automated Google Review Requests
              </h3>
              <p className="text-xl text-gray-600 mb-6">
                Getting reviews is the #1 way to rank higher on Google Maps and build trust with new customers. 
                SORCE automatically requests reviews after every job—increasing your reviews 100x faster than organic growth.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Automatic timing</p>
                    <p className="text-gray-600">Sends review request at the perfect moment after job completion</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">100x faster growth</p>
                    <p className="text-gray-600">Get more reviews in weeks than most businesses get in years</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Boost local SEO</p>
                    <p className="text-gray-600">More reviews = higher Google Maps ranking = more customers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefit 3: Daily SEO Blog Writing */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Benefit #3</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                AI Writes SEO Content Daily
              </h3>
              <p className="text-xl text-gray-600 mb-6">
                Google loves fresh content. SORCE's AI writes relevant blog posts and service pages every single day, 
                automatically improving your search rankings while you focus on running your business.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Daily fresh content</p>
                    <p className="text-gray-600">New blog posts and pages published automatically</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">SEO optimized</p>
                    <p className="text-gray-600">Written specifically to rank on Google for your keywords</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Zero effort required</p>
                    <p className="text-gray-600">You never have to write a single word yourself</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 border-2 border-blue-300">
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">🔍 Search Ranking</span>
                    <span className="text-green-600 font-bold">↑ +47%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-blue-500 w-3/4"></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <p className="text-sm font-semibold text-gray-900 mb-2">📝 Recent AI Blog Posts:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• "5 Signs You Need Emergency Plumbing"</li>
                    <li>• "How to Prevent Frozen Pipes This Winter"</li>
                    <li>• "Water Heater Maintenance Checklist"</li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">📊 Organic Traffic</span>
                    <span className="text-2xl font-bold text-blue-600">+312%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-12 text-white">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Real Results from Service Businesses
            </h2>
            <p className="text-xl text-purple-100">
              These aren't hypothetical—this is what happens when your website actually works for you
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">3x</div>
              <div className="text-purple-100">More Bookings</div>
              <p className="text-sm text-purple-200 mt-2">AI chat converts 3x better than forms</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100x</div>
              <div className="text-purple-100">Faster Reviews</div>
              <p className="text-sm text-purple-200 mt-2">Automated requests get results</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-purple-100">Lead Capture</div>
              <p className="text-sm text-purple-200 mt-2">Never miss another late-night lead</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">+47%</div>
              <div className="text-purple-100">SEO Growth</div>
              <p className="text-sm text-purple-200 mt-2">Daily content boosts rankings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Stop Losing Customers?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Generate your website now. Add growth features later. Start turning visitors into customers today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-xl hover:shadow-2xl transition-all inline-flex items-center gap-3"
            >
              <Wand2 className="w-6 h-6" />
              Generate Free Website
              <ArrowRight className="w-6 h-6" />
            </button>
            <button
              onClick={onNavigateToPricing}
              className="px-10 py-5 bg-white text-gray-900 border-2 border-gray-300 rounded-xl font-semibold text-xl hover:border-purple-600 transition-all"
            >
              See Growth Plans →
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Free website generation • Upgrade anytime for AI chat, reviews & SEO
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
                onClick={onNavigateToPricing}
                className="text-gray-400 hover:text-white transition"
              >
                Pricing
              </button>
              <button
                onClick={handleSignup}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition font-semibold"
              >
                Sign Up
              </button>
            </div>
            
            <div className="text-gray-400 text-sm">
              © 2025 SORCE. Built for service businesses.
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
                      htmlContent: generatedWebsite  // Changed from generatedHTML
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

    </div>  {/* Main container closing */}
  );
)}
