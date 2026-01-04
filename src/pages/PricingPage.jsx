import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import SignupModal from '../components/SignupModal';

const PricingPage = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleSelectPlan = (plan) => {
    const planSlug = plan.name.toLowerCase().replace(' plan', '').replace(' ', '-');
    const finalPrice = billingCycle === 'annual' ? (plan.price * 0.8).toFixed(2) : plan.price.toFixed(2);
    
    setSelectedPlan({
      plan: planSlug,
      price: finalPrice,
      billing: billingCycle
    });
    
    setShowSignupModal(true);
  };

  const handleSignupSuccess = () => {
    setShowSignupModal(false);
    navigate('/dashboard');
  };

  const plans = [
    {
      name: 'Original',
      price: 29.95,
      popular: false,
      description: 'Perfect for getting started',
      features: [
        {
          title: 'High Converting AI Website Builder',
          subtitle: 'Easily make changes using AI',
          icon: Sparkles
        },
        {
          title: 'Mobile-Responsive Design',
          subtitle: 'Looks perfect on all devices',
          icon: Check
        },
        {
          title: 'Custom Domain Connection',
          subtitle: 'Use your own business domain',
          icon: Check
        },
        {
          title: '24/7 Website Hosting',
          subtitle: 'Fast, reliable, and secure',
          icon: Check
        },
        {
          title: 'Monthly Website Updates',
          subtitle: 'Up to 3 AI-powered changes per month',
          icon: Check
        }
      ],
      cta: 'Start Building',
      gradient: 'from-blue-600 to-cyan-600'
    },
    {
      name: 'Pro Plan',
      price: 59.95,
      popular: true,
      description: 'For businesses ready to scale',
      features: [
        {
          title: 'High Converting AI Website Builder',
          subtitle: 'Easily make changes using AI',
          icon: Sparkles
        },
        {
          title: 'Conversation-Starting AI Agent',
          subtitle: 'Your agent automatically starts a conversation with each person who visits your website',
          icon: Zap,
          highlight: true
        },
        {
          title: 'Automated Review Requests',
          subtitle: 'Automatically sends review requests to customers following completion of jobs - increases reviews left by customers 100x faster than organic',
          icon: Zap,
          highlight: true
        },
        {
          title: 'AI SEO Writing (Daily)',
          subtitle: 'Your AI agent writes SEO every single day, boosting your website\'s ranking without you lifting a finger',
          icon: Zap,
          highlight: true
        },
        {
          title: 'Everything in Original',
          subtitle: 'Plus unlimited monthly updates',
          icon: Check
        }
      ],
      cta: 'Go Pro',
      gradient: 'from-purple-600 to-pink-600'
    },
    {
      name: 'Expert Plan',
      price: 95.99,
      popular: false,
      description: 'Maximum growth & automation',
      features: [
        {
          title: 'High Converting AI Website Builder',
          subtitle: 'Easily make changes using AI',
          icon: Sparkles
        },
        {
          title: 'Conversation-Starting AI Agent',
          subtitle: 'Your agent automatically starts a conversation with each person who visits your website',
          icon: Zap
        },
        {
          title: 'Automated Review Requests',
          subtitle: 'Automatically sends review requests to customers following completion of jobs',
          icon: Zap
        },
        {
          title: 'AI SEO Writing (Daily)',
          subtitle: 'Your AI agent writes SEO every single day, boosting your ranking',
          icon: Zap
        },
        {
          title: 'AI Market Research & Recommendations',
          subtitle: 'Your AI agent does market research and recommends ads to run, offers by seasonality, ways to increase your average ticket price, upsells within your niche to add to increase profit',
          icon: TrendingUp,
          highlight: true
        },
        {
          title: 'Priority Support & Strategy Calls',
          subtitle: 'Monthly strategy sessions with our team',
          icon: Check
        }
      ],
      cta: 'Become an Expert',
      gradient: 'from-orange-600 to-red-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <button
            onClick={() => navigate('/')}
            className="mb-8 text-gray-600 hover:text-gray-900 transition inline-flex items-center gap-2"
          >
            ← Back to Homepage
          </button>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get your AI-powered website and grow your service business
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-full font-medium transition relative ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="flex flex-col lg:flex-row gap-6 mb-16 justify-center items-stretch max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`flex-1 bg-white rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-105 ${
                plan.popular ? 'ring-4 ring-purple-500 lg:scale-105' : ''
              } relative`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 text-sm font-semibold text-center">
                  MOST POPULAR
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-gray-900">
                      ${billingCycle === 'annual' ? (plan.price * 0.8).toFixed(2) : plan.price.toFixed(2)}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-sm text-green-600 mt-2">
                      Save ${((plan.price * 12) - (plan.price * 0.8 * 12)).toFixed(2)}/year
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all mb-8 bg-gradient-to-r ${plan.gradient} hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2`}
                >
                  {plan.cta}
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Features */}
                <div className="space-y-4">
                  {plan.features.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={idx}
                        className={`flex gap-3 ${
                          feature.highlight ? 'bg-purple-50 -mx-4 px-4 py-3 rounded-lg' : ''
                        }`}
                      >
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          feature.highlight
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                            : 'bg-blue-100'
                        }`}>
                          <Icon className={`w-4 h-4 ${
                            feature.highlight ? 'text-white' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">
                            {feature.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {feature.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Service Businesses Trust Us</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">98%</div>
              <div className="text-gray-600">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-pink-600 mb-2">24/7</div>
              <div className="text-gray-600">Website Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">3x</div>
              <div className="text-gray-600">Average ROI Increase</div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I switch plans anytime?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens to my website if I cancel?
              </h3>
              <p className="text-gray-600 text-sm">
                You can download your website HTML before canceling. Your site will remain live until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                How does the AI agent work?
              </h3>
              <p className="text-gray-600 text-sm">
                Our AI agent uses advanced technology to engage visitors, qualify leads, and send automated follow-ups - all customized to your business.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Do I need technical knowledge?
              </h3>
              <p className="text-gray-600 text-sm">
                Not at all! Our AI handles everything. Just tell us about your business and we'll create and manage your website.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-600">
            All plans include SSL certificate, professional hosting, and customer support
          </p>
          <p className="text-sm text-gray-500 mt-2">
            30-day money-back guarantee • Cancel anytime • No hidden fees
          </p>
        </div>
      </div>

      {/* Signup Modal */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        selectedPlan={selectedPlan}
        onSuccess={handleSignupSuccess}
      />
    </div>
  );
};

export default PricingPage;
