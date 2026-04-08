import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wand2, MessageCircle, TrendingUp, Zap, ArrowRight, Check, Sparkles, Star, Users, Target, Rocket, BarChart, Calendar, Globe, Brain, LineChart } from 'lucide-react';
import AuthModal from '../components/AuthModal';

export default function HomePage() {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Auto-redirect if already signed in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);
  const [authMode, setAuthMode] = useState('signup');
  const handleGetStarted = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleSignup = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    if (!user.email_verified) {
      navigate('/verify-email');
    } else if (!user.questionnaire_completed) {
      navigate('/onboarding');
    } else {
      navigate('/dashboard');
    }
  };

  const handleNavigateToPricing = () => {
    navigate('/pricing');
  };

  return (
   <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-highlight-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                SORCE
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleLogin} className="text-gray-700 hover:text-primary-600 font-medium transition">
                Login
              </button>
              <button onClick={handleNavigateToPricing} className="text-gray-700 hover:text-primary-600 font-medium transition">
                Pricing
              </button>
              <button onClick={handleGetStarted} className="px-6 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-lg transition font-semibold">
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
            <Rocket className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">The All-in-One Platform for Service Businesses</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight uppercase">
            Grow Your Google Reviews,<br />
            Have AI Talk to Leads,<br />
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Boost Your Website Rankings<br />
              And More
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            SORCE connects every aspect of your service business in one dashboard—lead flow, Google Business growth, 
            AI messaging, website SEO, online booking, and market research. Everything you need to grow, without the complexity.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
          >
            <Wand2 className="w-5 h-5" />
            Start Growing Your Business
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500 mt-6">
            ✨ Free to start • 🚀 Up and running in minutes • 💎 Built for sustainable growth
          </p>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Service Businesses Struggle to Grow
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            You're drowning in disconnected tools, wasting hours on manual tasks, and missing opportunities daily.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-red-500">
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6">
              <Target className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Tool Chaos</h3>
            <p className="text-gray-600 mb-4">
              Separate tools for booking, website, CRM, reviews, and messaging means constant tab-switching, 
              duplicate data entry, and things falling through the cracks.
            </p>
            <div className="bg-red-50 rounded-lg p-3 text-sm text-red-900 font-medium">
              Result: Hours wasted daily on admin work
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-orange-500">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Leaked Leads</h3>
            <p className="text-gray-600 mb-4">
              Leads come from your website, Google, social media, and referrals—but without a central system, 
              you lose track of who needs follow-up and when.
            </p>
            <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-900 font-medium">
              Impact: 40-60% of leads never get followed up
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-yellow-500">
            <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
              <BarChart className="w-7 h-7 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">No Growth Visibility</h3>
            <p className="text-gray-600 mb-4">
              Without seeing your full business in one place, you can't identify what's working, what's not, 
              or where to focus your energy for maximum growth.
            </p>
            <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-900 font-medium">
              Consequence: Guessing instead of growing strategically
            </div>
          </div>
        </div>
      </section>

      {/* The Solution - Core Platform Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            One Dashboard. Your Entire Business.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            SORCE integrates everything service businesses need to grow—no more juggling tools or losing opportunities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Lead Flow Management */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Unified Lead Flow</h3>
            <p className="text-gray-600 mb-4">
              Every lead—from your website, Google, forms, and AI chat—flows into one place. 
              See exactly who needs follow-up, when to reach out, and what stage they're in.
            </p>
            <div className="flex items-center gap-2 text-sm text-teal-700 font-medium">
              <Check className="w-4 h-4" />
              <span>Never lose track of a lead again</span>
            </div>
          </div>

          {/* Google Business Growth */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-primary-100 rounded-xl flex items-center justify-center mb-6">
              <Star className="w-7 h-7 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Google Business Growth</h3>
            <p className="text-gray-600 mb-4">
              Automatically request reviews after jobs, respond with AI, and watch your Google ranking climb. 
              More reviews = more visibility = more customers finding you.
            </p>
            <div className="flex items-center gap-2 text-sm text-teal-700 font-medium">
              <Check className="w-4 h-4" />
              <span>Rank higher on Google Maps</span>
            </div>
          </div>

          {/* AI Lead Messaging */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-accent-100 to-highlight-100 rounded-xl flex items-center justify-center mb-6">
              <MessageCircle className="w-7 h-7 text-accent-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Lead Messaging</h3>
            <p className="text-gray-600 mb-4">
              Your AI assistant engages website visitors 24/7, qualifies leads while you sleep, 
              and captures contact info so you can follow up during business hours.
            </p>
            <div className="flex items-center gap-2 text-sm text-teal-700 font-medium">
              <Check className="w-4 h-4" />
              <span>Convert visitors while you sleep</span>
            </div>
          </div>

          {/* Website + SEO */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-teal-100 rounded-xl flex items-center justify-center mb-6">
              <Globe className="w-7 h-7 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Website + SEO Engine</h3>
            <p className="text-gray-600 mb-4">
              Your website isn't just pretty—it's a growth machine. AI writes fresh content daily to boost 
              your Google rankings, bringing in more organic traffic month after month.
            </p>
            <div className="flex items-center gap-2 text-sm text-teal-700 font-medium">
              <Check className="w-4 h-4" />
              <span>Climb search rankings automatically</span>
            </div>
          </div>

          {/* Online Booking */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-accent-100 rounded-xl flex items-center justify-center mb-6">
              <Calendar className="w-7 h-7 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Comprehensive Booking</h3>
            <p className="text-gray-600 mb-4">
              Let customers book online 24/7—directly on your website. Syncs with your calendar, 
              sends reminders, and eliminates phone tag that wastes your time.
            </p>
            <div className="flex items-center gap-2 text-sm text-teal-700 font-medium">
              <Check className="w-4 h-4" />
              <span>Get bookings around the clock</span>
            </div>
          </div>

          {/* Market Research */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-gradient-to-br from-accent-100 to-primary-100 rounded-xl flex items-center justify-center mb-6">
              <Brain className="w-7 h-7 text-accent-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Market Research</h3>
            <p className="text-gray-600 mb-4">
              Know exactly what your competitors charge, what customers in your area want, 
              and how to position your business for maximum growth—powered by AI analysis.
            </p>
            <div className="flex items-center gap-2 text-sm text-teal-700 font-medium">
              <Check className="w-4 h-4" />
              <span>Make data-driven decisions</span>
            </div>
          </div>
        </div>

        {/* Integration Callout */}
        <div className="mt-16 bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-12 text-white text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            The Power Isn't in the Features—It's in the Integration
          </h3>
          <p className="text-xl text-primary-100 mb-6 max-w-3xl mx-auto">
            When your lead flow, booking system, reviews, SEO, and AI messaging all talk to each other, 
            you get compounding growth. One system feeding the next, working together to drive sustainable results.
          </p>
          <div className="inline-flex items-center gap-2 bg-white/20 px-6 py-3 rounded-full">
            <LineChart className="w-5 h-5" />
            <span className="font-semibold">Built for long-term, sustainable growth</span>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
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
          {/* Benefit 1: AI Conversations */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-100 px-4 py-2 rounded-full mb-4">
                <MessageCircle className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-semibold text-primary-900">Benefit #1</span>
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
                  <Check className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Never miss a lead</p>
                    <p className="text-gray-600">Responds to website visitors 24/7, even at 2am</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Qualifies prospects instantly</p>
                    <p className="text-gray-600">Asks the right questions to identify serious customers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Captures contact info</p>
                    <p className="text-gray-600">Turns anonymous visitors into leads you can follow up with</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl p-8 border-2 border-primary-300">
              <div className="bg-white rounded-xl p-6 shadow-lg mb-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
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
              <p className="text-center text-primary-900 font-semibold">
                ✨ Engagement Rate: 67% vs 2% industry average
              </p>
            </div>
          </div>

          {/* Benefit 2: Review Requests */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 bg-gradient-to-br from-teal-100 to-accent-100 rounded-2xl p-8 border-2 border-teal-300">
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold text-gray-900">Job Completed</span>
                  </div>
                  <p className="text-sm text-gray-600">Fixed water heater for John Smith</p>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-teal-600" />
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-primary-600" />
                    <span className="font-semibold text-gray-900">Auto-Send Review Request</span>
                  </div>
                  <p className="text-sm text-gray-600">Sent via email & SMS after 2 hours</p>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-teal-600" />
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart className="w-5 h-5 text-teal-600" />
                    <span className="font-semibold text-gray-900">Google Ranking ↑</span>
                  </div>
                  <p className="text-sm text-gray-600">More reviews = higher visibility</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 bg-teal-100 px-4 py-2 rounded-full mb-4">
                <Star className="w-5 h-5 text-teal-600" />
                <span className="text-sm font-semibold text-teal-900">Benefit #2</span>
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
                  <Check className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Automatic timing</p>
                    <p className="text-gray-600">Sends review request at the perfect moment after job completion</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">100x faster growth</p>
                    <p className="text-gray-600">Get more reviews in weeks than most businesses get in years</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Boost local SEO</p>
                    <p className="text-gray-600">More reviews = higher Google Maps ranking = more customers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefit 3: SEO Content */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-accent-100 px-4 py-2 rounded-full mb-4">
                <TrendingUp className="w-5 h-5 text-accent-600" />
                <span className="text-sm font-semibold text-accent-900">Benefit #3</span>
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
                  <Check className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Daily fresh content</p>
                    <p className="text-gray-600">New blog posts and pages published automatically</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">SEO optimized</p>
                    <p className="text-gray-600">Written specifically to rank on Google for your keywords</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Zero effort required</p>
                    <p className="text-gray-600">You never have to write a single word yourself</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-accent-100 to-highlight-100 rounded-2xl p-8 border-2 border-accent-300">
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">🔍 Search Ranking</span>
                    <span className="text-teal-600 font-bold">↑ +47%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-accent-500 w-3/4"></div>
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
                    <span className="text-2xl font-bold text-accent-600">+312%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-3xl p-12 text-white">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Real Results from Service Businesses
            </h2>
            <p className="text-xl text-primary-100">
              These aren't hypothetical—this is what happens when your website actually works for you
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">3x</div>
              <div className="text-primary-100">More Bookings</div>
              <p className="text-sm text-primary-200 mt-2">AI chat converts 3x better than forms</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100x</div>
              <div className="text-primary-100">Faster Reviews</div>
              <p className="text-sm text-primary-200 mt-2">Automated requests get results</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-primary-100">Lead Capture</div>
              <p className="text-sm text-primary-200 mt-2">Never miss another late-night lead</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">+47%</div>
              <div className="text-primary-100">SEO Growth</div>
              <p className="text-sm text-primary-200 mt-2">Daily content boosts rankings</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Stop Losing Customers?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get your business running on autopilot. Start booking more customers today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="px-10 py-5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold text-xl hover:shadow-2xl transition-all inline-flex items-center gap-3 justify-center"
            >
              Get Started Free
              <ArrowRight className="w-6 h-6" />
            </button>
            <button
              onClick={handleNavigateToPricing}
              className="px-10 py-5 bg-white text-gray-900 border-2 border-gray-300 rounded-xl font-semibold text-xl hover:border-primary-600 transition-all"
            >
              See Plans →
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Free to start • Upgrade anytime for AI chat, reviews & SEO
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">SORCE</span>
            </div>
            
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <button onClick={handleLogin} className="text-gray-400 hover:text-white transition">
                Login
              </button>
              <button onClick={handleNavigateToPricing} className="text-gray-400 hover:text-white transition">
                Pricing
              </button>
              <button onClick={handleSignup} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition font-semibold">
                Sign Up
              </button>
            </div>
            
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <span>© 2026 SORCE. Built for service businesses.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
        onSuccess={handleAuthSuccess}
      />

    </div>
  );
}
