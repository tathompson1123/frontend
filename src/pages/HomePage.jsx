import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, MessageCircle, TrendingUp, Zap, ArrowRight, Check, Sparkles, Star, Users, Target, Rocket, BarChart } from 'lucide-react';
import AuthModal from '../components/AuthModal';

export default function HomePage() {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signup'); // 'signup' or 'login'

  const handleGetStarted = () => {
    navigate('/generate');
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
    navigate('/dashboard');
  };

  const handleNavigateToPricing = () => {
  navigate('/pricing');
};

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
              <button onClick={handleLogin} className="text-gray-700 hover:text-purple-600 font-medium transition">
                Login
              </button>
              <button onClick={handleNavigateToPricing} className="text-gray-700 hover:text-purple-600 font-medium transition">
                Pricing
              </button>
              <button onClick={handleGetStarted} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-semibold">
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

      {/* Problems Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Traditional Websites Fail Service Businesses
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

          {/* Benefit 2: Review Requests */}
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

          {/* Benefit 3: SEO Content */}
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

      {/* Results Section */}
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

      {/* CTA Section */}
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
              className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-xl hover:shadow-2xl transition-all inline-flex items-center gap-3 justify-center"
            >
              <Wand2 className="w-6 h-6" />
              Generate Free Website
              <ArrowRight className="w-6 h-6" />
            </button>
            <button
              onClick={handleNavigateToPricing}
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
              <button onClick={handleLogin} className="text-gray-400 hover:text-white transition">
                Login
              </button>
              <button onClick={handleNavigateToPricing} className="text-gray-400 hover:text-white transition">
                Pricing
              </button>
              <button onClick={handleSignup} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition font-semibold">
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
