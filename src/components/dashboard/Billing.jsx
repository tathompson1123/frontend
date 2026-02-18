import { useState, useEffect } from 'react';
import { Check, X, Sparkles, Crown, Zap, TrendingUp, MessageSquare, Mail } from 'lucide-react';

export default function Billing({ user, apiUrl, authFetch }) {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentPlan(user?.plan || null);
    if (user?.plan && user.plan !== 'free') {
      window.dispatchEvent(new CustomEvent('onboarding-step-complete', { detail: { step: 5 } }));
    }
  }, [user]);

  const handleUpgrade = async (planId) => {
    if (planId === currentPlan) return;
    setLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId })
      });
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        alert('Failed to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const SMS_LIMIT = { free: 0, pro: 100, scale: 500, basic: 100, expert: 200 };
  const planSmsLimit = SMS_LIMIT[currentPlan] || 0;

  const plans = [
    {
      id: null,
      name: 'Free',
      tagline: 'Get started at no cost',
      price: 0,
      icon: Sparkles,
      gradient: 'from-gray-400 to-gray-500',
      features: [
        { text: 'AI Website Generator', included: true },
        { text: 'Publish & Host Your Website', included: true },
        { text: 'Online Booking Calendar', included: true },
        { text: 'Customer & Lead Management', included: true },
        { text: 'Team Management', included: true },
        { text: 'AI Chat Agent', included: false },
        { text: 'SMS Lead Follow-Up Agent', included: false },
        { text: 'Automated Google Reviews', included: false },
        { text: 'Embed on Any Website', included: false },
        { text: 'AI Email Marketing', included: false },
        { text: 'Market Research Reports', included: false },
      ],
      cta: 'Current Plan',
      isFree: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'Full AI automation for growth',
      price: 95.50,
      icon: Crown,
      gradient: 'from-blue-500 to-purple-600',
      popular: true,
      smsLimit: 100,
      features: [
        { text: 'Everything in Free', included: true, bold: true },
        { text: 'AI Chat Agent (24/7 on your website)', included: true, highlight: true },
        { text: 'SMS Lead Follow-Up Agent', included: true, highlight: true },
        { text: '100 SMS / month', included: true, highlight: true },
        { text: 'Automated Google Review Requests', included: true, highlight: true },
        { text: 'Embed on Any Website (Wix, Squarespace…)', included: true, highlight: true },
        { text: 'Weekly AI Email Marketing', included: true, highlight: true },
        { text: 'Market Research Reports', included: true },
        { text: 'SEO Blog Writing (4 posts/month)', included: true },
        { text: 'Priority Support', included: true },
      ],
      cta: 'Upgrade to Pro',
    },
    {
      id: 'scale',
      name: 'Scale',
      tagline: 'Higher limits for busy businesses',
      price: 175.50,
      icon: TrendingUp,
      gradient: 'from-purple-500 to-pink-600',
      smsLimit: 500,
      features: [
        { text: 'Everything in Pro', included: true, bold: true },
        { text: '500 SMS / month (5× more)', included: true, highlight: true },
        { text: 'Higher chat conversation limits', included: true, highlight: true },
        { text: 'White-label options', included: true, soon: true },
        { text: 'Dedicated account manager', included: true, soon: true },
        { text: 'Custom API integrations', included: true, soon: true },
      ],
      cta: 'Upgrade to Scale',
    },
  ];

  const isCurrentPlanPaid = currentPlan && currentPlan !== 'free';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Choose Your Plan</h1>
        <p className="text-lg text-gray-600">AI-powered tools that grow your business on autopilot</p>

        {!currentPlan && (
          <div className="mt-5 mx-auto max-w-xl p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
            <p className="text-amber-900 font-semibold">⚠️ You're on the Free plan — upgrade to unlock AI agents & automation</p>
          </div>
        )}
      </div>

      {/* Cost breakdown callout */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" /> What you get with Pro — estimated value
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: 'AI Chat Agent', value: '$199/mo', icon: MessageSquare, desc: '24/7 lead capture & booking on your site' },
            { label: 'SMS Lead Agent', value: '$79/mo', icon: Zap, desc: 'Texts every new lead within 60 seconds' },
            { label: 'AI Email Marketing', value: '$149/mo', icon: Mail, desc: 'Weekly offers to past customers, on autopilot' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-white rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 flex items-center gap-2"><Icon className="w-4 h-4 text-blue-500" />{item.label}</span>
                  <span className="text-sm line-through text-gray-400">{item.value}</span>
                </div>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            );
          })}
        </div>
        <p className="text-center text-sm text-gray-600 mt-4">
          Total standalone value: <span className="font-bold text-gray-900 line-through">$427/mo</span>
          {' '}→ <span className="font-bold text-green-600">$95.50/mo with Pro</span>
          <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">78% OFF</span>
        </p>
      </div>

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isActive = currentPlan === plan.id || (plan.id === null && !currentPlan);
          const Icon = plan.icon;
          return (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 transition-all ${
                plan.popular ? 'border-blue-500 shadow-xl md:scale-105' : 'border-gray-200'
              } ${isActive ? 'ring-4 ring-green-200' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-1 rounded-full text-sm font-bold shadow">
                    ⭐ MOST POPULAR
                  </div>
                </div>
              )}
              <div className="p-7">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-xs text-gray-500">{plan.tagline}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && <span className="text-gray-500 text-sm">/month</span>}
                  </div>
                  {plan.smsLimit && (
                    <p className="text-xs text-blue-600 font-medium mt-1">{plan.smsLimit} SMS leads/month included</p>
                  )}
                </div>

                <div className="space-y-2 mb-7">
                  {plan.features.map((f, i) => (
                    <div key={i} className={`flex items-start gap-2 ${f.highlight ? 'bg-blue-50 -mx-2 px-2 py-1 rounded-lg' : ''}`}>
                      {f.included
                        ? <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${f.highlight ? 'text-blue-600' : 'text-green-500'}`} />
                        : <X className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />}
                      <span className={`text-sm ${f.bold ? 'font-semibold text-gray-900' : f.included ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                        {f.text}
                        {f.soon && <span className="ml-1.5 text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">Soon</span>}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => !plan.isFree && handleUpgrade(plan.id)}
                  disabled={isActive || loading || plan.isFree}
                  className={`w-full py-3 rounded-xl font-bold transition-all text-sm ${
                    isActive
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : plan.isFree
                      ? 'bg-gray-100 text-gray-400 cursor-default'
                      : `bg-gradient-to-r ${plan.gradient} text-white hover:shadow-lg hover:scale-105`
                  }`}
                >
                  {isActive ? '✓ Current Plan' : loading ? 'Processing…' : plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SMS usage for current paid users */}
      {isCurrentPlanPaid && (
        <div className="mt-8 bg-gray-50 rounded-xl p-5 border border-gray-200 text-sm text-gray-600">
          <p className="font-semibold text-gray-800 mb-1">Your plan: <span className="capitalize">{currentPlan}</span></p>
          <p>SMS lead follow-ups: <strong>{planSmsLimit}/month</strong> included.
            {currentPlan === 'pro' && ' Upgrade to Scale for 500 SMS/month.'}
          </p>
        </div>
      )}

      <div className="mt-10 text-center text-sm text-gray-500 flex items-center justify-center gap-8">
        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" />14-day money-back guarantee</span>
        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" />Cancel anytime</span>
        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" />No setup fees</span>
      </div>
    </div>
  );
}
