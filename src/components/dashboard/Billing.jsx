import { useState, useEffect } from 'react';
import { Check, X, Sparkles, Crown, Rocket, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';

export default function Billing({ user, apiUrl, authFetch }) {
  const [currentPlan, setCurrentPlan] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [showAnnual, setShowAnnual] = useState(false);

  useEffect(() => {
    setCurrentPlan(user?.plan || 'basic');
  }, [user]);

  const handleUpgrade = async (planId) => {
    if (planId === currentPlan) return;
    
    setLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/billing/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId })
      });

      if (response.ok) {
        alert(`Successfully upgraded to ${planId}! 🎉`);
        window.dispatchEvent(new CustomEvent('onboarding-step-complete', { 
    detail: { step: 6 } 
  }));
        window.location.reload();
      } else {
        alert('Upgrade failed. Please try again.');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Something went wrong. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      tagline: 'Essential tools to get started',
      price: 29.95,
      annualPrice: 299,
      icon: Sparkles,
      gradient: 'from-gray-400 to-gray-600',
      features: [
        { text: 'Unlimited bookings & calendar', included: true },
        { text: 'Customer & lead management', included: true },
        { text: 'Email notifications', included: true },
        { text: 'Basic website builder', included: true },
        { text: 'Manual review requests', included: true },
        { text: 'AI Chat Agent', included: false },
        { text: 'Automated Google Reviews', included: false },
        { text: 'SEO Blog Writing', included: false },
        { text: 'Advanced Analytics', included: false }
      ],
      cta: 'Current Plan',
      ctaVariant: 'outline'
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'AI-powered automation for growth',
      price: 69.95,
      annualPrice: 699,
      icon: Crown,
      gradient: 'from-blue-500 to-purple-600',
      popular: true,
      savings: {
        total: 447,
        breakdown: [
          { feature: 'AI Chat Agent', value: 199 },
          { feature: 'Automated Google Reviews', value: 149 },
          { feature: 'SEO Blog Writing', value: 99 }
        ]
      },
      features: [
        { text: 'Everything in Basic', included: true, bold: true },
        { text: 'AI Chat Agent for website', included: true, highlight: true },
        { text: 'AI Lead Form Agent', included: true, highlight: true },
        { text: 'Automated Google Review requests', included: true, highlight: true },
        { text: 'AI SEO Blog Writing (4 posts/month)', included: true, highlight: true },
        { text: 'Advanced analytics dashboard', included: true },
        { text: 'Multi-page website builder', included: true },
        { text: 'Priority support', included: true },
        { text: 'Custom branding', included: true }
      ],
      cta: 'Upgrade to Pro',
      ctaVariant: 'primary'
    },
    {
      id: 'expert',
      name: 'Expert',
      tagline: 'Complete business intelligence',
      price: 99.95,
      annualPrice: 999,
      icon: Rocket,
      gradient: 'from-purple-500 to-pink-600',
      comingSoon: true,
      features: [
        { text: 'Everything in Pro', included: true, bold: true },
        { text: 'AI Market Research Reports', included: true, soon: true },
        { text: 'Business Model Generator', included: true, soon: true },
        { text: 'Service Offer Optimization', included: true, soon: true },
        { text: 'Upsell Idea Creation', included: true, soon: true },
        { text: 'Competitor Analysis', included: true, soon: true },
        { text: 'Revenue Forecasting', included: true, soon: true },
        { text: 'White-label options', included: true, soon: true },
        { text: 'Dedicated account manager', included: true, soon: true }
      ],
      cta: 'Coming Soon',
      ctaVariant: 'outline'
    }
  ];

 return (
  <div className="max-w-7xl mx-auto px-4 py-8">
    {/* Header */}
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Choose Your Growth Plan
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
        Get AI-powered tools that work 24/7 to grow your business
      </p>

      {/* No Plan Warning */}
      {!user?.plan && (
        <div className="mt-6 mx-auto max-w-xl p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
          <p className="text-yellow-900 font-semibold flex items-center justify-center gap-2">
            <span className="text-2xl">⚠️</span>
            Please select a plan to access your dashboard features
          </p>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="mt-8 inline-flex items-center gap-3 bg-gray-100 rounded-full p-1">
        <button
          onClick={() => setShowAnnual(false)}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            !showAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setShowAnnual(true)}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            showAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
          }`}
        >
          Annual
          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            Save 15%
          </span>
        </button>
      </div>
    </div>

      {/* Pro Plan Value Proposition */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-8 mb-12">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pro Plan: Get $447/month in AI Tools for just $69.95
            </h2>
            <p className="text-gray-600">
              Save 84% by bundling the most powerful automation tools
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">AI Chat Agent</span>
              <span className="text-sm line-through text-gray-400">$199/mo</span>
            </div>
            <p className="text-sm text-gray-600">
              24/7 website chat that captures leads & books appointments automatically
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">Auto Reviews</span>
              <span className="text-sm line-through text-gray-400">$149/mo</span>
            </div>
            <p className="text-sm text-gray-600">
              Automated Google review requests with smart follow-up sequences
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">SEO Blogs</span>
              <span className="text-sm line-through text-gray-400">$99/mo</span>
            </div>
            <p className="text-sm text-gray-600">
              AI-written blog posts optimized for Google rankings (4 posts/month)
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">
              Total Value: <span className="font-bold text-gray-900">$447/month</span>
            </span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            <span className="text-gray-600">
              You Pay: <span className="font-bold text-green-600">$69.95/month</span>
            </span>
          </div>
          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">
            Save $377/mo (84% OFF)
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const Icon = plan.icon;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 transition-all ${
                plan.popular
                  ? 'border-blue-500 shadow-xl scale-105'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isCurrentPlan ? 'ring-4 ring-green-200' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-1 rounded-full text-sm font-bold shadow-lg">
                    ⭐ MOST POPULAR
                  </div>
                </div>
              )}

              {/* Coming Soon Badge */}
              {plan.comingSoon && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-1 rounded-full text-sm font-bold shadow-lg">
                    🚀 COMING SOON
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-600">{plan.tagline}</p>
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      ${showAnnual ? plan.annualPrice : plan.price}
                    </span>
                    <span className="text-gray-600">
                      /{showAnnual ? 'year' : 'month'}
                    </span>
                  </div>
                  {showAnnual && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      Save ${(plan.price * 12 - plan.annualPrice).toFixed(0)} per year
                    </p>
                  )}
                </div>

                {/* Savings Breakdown (Pro Plan Only) */}
                {plan.savings && !showAnnual && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm font-bold text-green-900 mb-2">
                      💰 You Save $377/month
                    </div>
                    {plan.savings.breakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-green-700 mb-1">
                        <span>{item.feature}</span>
                        <span className="line-through">${item.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 ${
                        feature.highlight ? 'bg-blue-50 -mx-2 px-2 py-1 rounded-lg' : ''
                      }`}
                    >
                      {feature.included ? (
                        <Check className={`w-5 h-5 flex-shrink-0 ${
                          feature.highlight ? 'text-blue-600' : 'text-green-600'
                        }`} />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${
                        feature.bold ? 'font-semibold text-gray-900' : 'text-gray-700'
                      } ${!feature.included ? 'text-gray-400 line-through' : ''}`}>
                        {feature.text}
                        {feature.soon && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            Soon
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => !plan.comingSoon && handleUpgrade(plan.id)}
                  disabled={isCurrentPlan || loading || plan.comingSoon}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    plan.ctaVariant === 'primary' && !isCurrentPlan
                      ? `bg-gradient-to-r ${plan.gradient} text-white hover:shadow-lg hover:scale-105`
                      : isCurrentPlan
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : plan.comingSoon
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {isCurrentPlan ? '✓ Current Plan' : plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ / Additional Info */}
      <div className="mt-16 bg-gray-50 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Frequently Asked Questions
        </h3>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h4>
            <p className="text-sm text-gray-600">
              Yes! Upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4>
            <p className="text-sm text-gray-600">
              We accept all major credit cards, debit cards, and ACH bank transfers.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h4>
            <p className="text-sm text-gray-600">
              The Basic plan is free forever. Upgrade to Pro to access AI features with a 14-day money-back guarantee.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Do AI features really work?</h4>
            <p className="text-sm text-gray-600">
              Yes! Our AI agents capture leads 24/7, book appointments automatically, and get you more Google reviews without lifting a finger.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="mt-12 text-center">
        <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span>14-day money-back guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span>No setup fees</span>
          </div>
        </div>
      </div>
    </div>
  );
}
