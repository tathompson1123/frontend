import React from 'react';
import { Wand2, MessageCircle, Calendar, TrendingUp, Zap, ArrowRight, Check, Sparkles } from 'lucide-react';

const HomePage = ({ onNavigate, onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  SORCE
                </span>
              </div>
              <button
                onClick={() => onOpenAuth && onOpenAuth('login')}
                className="text-gray-700 hover:text-purple-600 font-medium transition"
              >
                Login
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('pricing')}
                className="text-gray-700 hover:text-purple-600 font-medium transition"
              >
                Pricing
              </button>
              <button
                onClick={() => onNavigate('builder')}
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
            The only website builder with AI chat, automated Google reviews, and growth tools built in. 
            Perfect for service businesses that want to convert more customers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('builder')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Wand2 className="w-5 h-5" />
              Create My Website with AI
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg hover:shadow-lg transition-all border-2 border-gray-200"
            >
              View Pricing
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            ✨ No credit card required • 🚀 Live in 2 minutes • 💰 30-day money-back guarantee
          </p>
        </div>
      </section>

      {/* Unique Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why SORCE is Different
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Every other website builder just gives you a pretty page. SORCE gives you a business partner 
            that works 24/7 to convert visitors into paying customers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 - Google Reviews */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Automated Google Review Integration
            </h3>
            <p className="text-gray-600 mb-6">
              Automatically sends review requests to customers after job completion. 
              Increases Google reviews 100x faster than organic growth, boosting your local SEO and credibility.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500" />
                <span>Auto-requests after job completion</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500" />
                <span>100x faster than organic reviews</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500" />
                <span>Boosts local SEO automatically</span>
              </div>
            </div>
          </div>

          {/* Feature 2 - AI Chat Agent */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-6">
              <MessageCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              AI Chat Agent
            </h3>
            <p className="text-gray-600 mb-6">
              Your AI assistant starts conversations with every visitor within 3 seconds. 
              Answers questions, qualifies leads, and books appointments automatically.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500" />
                <span>Responds instantly 24/7</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500" />
                <span>Qualifies leads automatically</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500" />
                <span>Never misses a potential customer</span>
              </div>
            </div>
          </div>

          {/* Feature 3 - AI Growth Engine */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              AI Growth Engine
            </h3>
            <p className="text-gray-600 mb-6">
              Daily SEO writing, market research, and AI-powered marketing 
              recommendations that increase your revenue without lifting a finger.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500" />
                <span>Daily SEO content writing</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500" />
                <span>AI market research & insights</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500" />
                <span>Smart marketing recommendations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              SORCE vs Everyone Else
            </h2>
            <p className="text-xl text-gray-600">
              Other builders just give you a website. SORCE gives you a complete business system.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Other Builders */}
            <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Other Website Builders
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <span className="text-gray-700">Just a static website</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <span className="text-gray-700">Visitors leave without engaging</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <span className="text-gray-700">You handle all customer interactions</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <span className="text-gray-700">No marketing automation</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <span className="text-gray-700">Miss leads after business hours</span>
                </div>
              </div>
            </div>

            {/* SORCE */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-300 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                SORCE
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                SORCE AI Platform
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-900 font-medium">AI-powered business engine</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-900 font-medium">Engages every visitor automatically</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-900 font-medium">AI handles inquiries 24/7</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-900 font-medium">Auto SEO, reviews, marketing</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-900 font-medium">Never miss a lead, ever</span>
                </div>
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
              Real Results for Service Businesses
            </h2>
            <p className="text-xl text-purple-100">
              SORCE customers see massive growth in their first 90 days
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">3x</div>
              <div className="text-purple-100">More Leads Generated</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">67%</div>
              <div className="text-purple-100">Increase in Bookings</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-purple-100">Customer Engagement</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100x</div>
              <div className="text-purple-100">Faster Review Growth</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of service businesses using SORCE to automate their growth 
            and scale their revenue. Get started in less than 2 minutes.
          </p>
          <button
            onClick={() => onNavigate('builder')}
            className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-xl hover:shadow-2xl transition-all inline-flex items-center gap-3"
          >
            <Wand2 className="w-6 h-6" />
            Create My Website Now
            <ArrowRight className="w-6 h-6" />
          </button>
          <p className="text-sm text-gray-500 mt-6">
            No credit card • No setup fees • Cancel anytime
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
                onClick={() => onNavigate('pricing')}
                className="text-gray-400 hover:text-white transition"
              >
                Pricing
              </button>
              <button
                onClick={() => onOpenAuth && onOpenAuth('login')}
                className="text-gray-400 hover:text-white transition"
              >
                Login
              </button>
              <button
                onClick={() => onOpenAuth && onOpenAuth('signup')}
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
    </div>
  );
};

export default HomePage;
