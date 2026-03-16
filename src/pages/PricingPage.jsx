import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight, Sparkles, Crown, TrendingUp, Zap, MessageSquare, Mail, Star } from 'lucide-react';
import SignupModal from '../components/SignupModal';

export default function PricingPage() {
  const navigate = useNavigate();
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleSelectPlan = (plan) => {
    if (plan.id === null) return; // free plan, no checkout
    setSelectedPlan({ plan: plan.id, price: plan.price, billing: 'monthly' });
    setShowSignupModal(true);
  };

  const handleSignupSuccess = () => {
    setShowSignupModal(false);
    navigate('/dashboard');
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29.95,
      description: 'Essential tools to get started',
      icon: Sparkles,
      gradient: 'from-gray-500 to-gray-600',
      trial: '2-week Pro trial included',
      features: [
        { text: 'AI Website Generator', included: true },
        { text: 'Publish & Host Your Website', included: true },
        { text: 'Online Booking Calendar', included: true },
        { text: 'Customer & Lead Management', included: true },
        { text: 'Team Management', included: true },
        { text: '2-Week PRO Features Trial', included: true, highlight: true },
        { text: 'AI Chat Agent', included: false },
        { text: 'SMS Lead Follow-Up Agent', included: false },
        { text: 'Weekly AI Email Marketing', included: false },
      ],
      cta: 'Get 2 weeks of Pro for free',
      ctaClass: 'bg-gray-700 hover:bg-gray-800',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 99.95,
      description: 'Full AI automation for growing businesses',
      icon: Crown,
      gradient: 'from-blue-600 to-purple-600',
      popular: true,
      trial: '1-week free trial',
      smsLimit: 100,
      features: [
        { text: 'Everything in Free', included: true, bold: true },
        { text: 'AI Chat Agent — 24/7 lead capture & booking', included: true, highlight: true },
        { text: 'SMS Lead Agent — texts leads within 60s', included: true, highlight: true },
        { text: '100 SMS follow-ups / month', included: true, highlight: true },
        { text: 'Automated Google Review Requests', included: true, highlight: true },
        { text: 'Embed on Wix, Squarespace & WordPress', included: true, highlight: true },
        { text: 'Weekly AI Email Marketing Campaigns', included: true, highlight: true },
        { text: 'Market Research & Revenue Reports', included: true },
        { text: 'SEO Blog Writing (4 posts/month)', included: true },
        { text: 'Priority Support', included: true },
      ],
      cta: 'Start free trial',
      ctaClass: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-xl',
    },
    {
      id: 'scale',
      name: 'Scale',
      price: 175.95,
      description: 'More capacity for high-volume businesses',
      icon: TrendingUp,
      gradient: 'from-purple-600 to-pink-600',
      trial: '1-week free trial',
      smsLimit: 500,
      features: [
        { text: 'Everything in Pro', included: true, bold: true },
        { text: '500 SMS follow-ups / month (5× Pro)', included: true, highlight: true },
        { text: 'Higher chat conversation volume', included: true, highlight: true },
        { text: 'White-label branding', included: true, soon: true },
        { text: 'Dedicated account manager', included: true, soon: true },
        { text: 'Custom API integrations', included: true, soon: true },
      ],
      cta: 'Start free trial',
      ctaClass: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl',
    },
  ];

  const valueItems = [
    { label: 'AI Chat Agent', value: '$199/mo', icon: MessageSquare, desc: '24/7 website chat that captures and qualifies leads automatically' },
    { label: 'SMS Lead Agent', value: '$79/mo', icon: Zap, desc: 'Contacts every new lead via text within 60 seconds' },
    { label: 'Auto Google Reviews', value: '$99/mo', icon: Star, desc: 'Sends review requests after every completed job' },
    { label: 'AI Email Marketing', value: '$149/mo', icon: Mail, desc: 'Weekly irresistible offers sent to past customers automatically' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <button onClick={() => navigate('/')} className="mb-8 text-gray-500 hover:text-gray-800 transition inline-flex items-center gap-2 text-sm">
            ← Back to Homepage
          </button>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free. Upgrade when you're ready for AI agents that work 24/7 to grow your business.
          </p>
        </div>

        {/* Value breakdown */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 border border-blue-100">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Pro Plan = $427/month of tools for $99.95 — try free for 1 week</h2>
          <p className="text-center text-gray-500 text-sm mb-8">Everything bundled — no separate subscriptions needed</p>
          <div className="grid md:grid-cols-4 gap-4">
            {valueItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-bold line-through text-gray-400">{item.value}</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-6">
            <span className="text-gray-500 line-through mr-2">$427/month</span>
            <ArrowRight className="inline w-4 h-4 text-gray-400 mr-2" />
            <span className="text-2xl font-bold text-green-600">$99.95/month</span>
            <span className="ml-3 bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">Save 78%</span>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 items-start">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all ${
                  plan.popular ? 'border-blue-500 md:scale-105 shadow-2xl' : 'border-transparent'
                }`}
              >
                {plan.popular && (
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-1.5 text-sm font-bold">
                    ⭐ MOST POPULAR
                  </div>
                )}
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-500">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-gray-900">
                        {plan.price === 0 ? 'Free' : `$${plan.price}`}
                      </span>
                      {plan.price > 0 && <span className="text-gray-500">/month</span>}
                    </div>
                    {plan.trial && (
                      <p className="text-xs text-green-600 font-semibold mt-1 bg-green-50 inline-block px-2 py-0.5 rounded-full">{plan.trial}</p>
                    )}
                    {plan.smsLimit && (
                      <p className="text-xs text-blue-600 font-medium mt-1">{plan.smsLimit} SMS leads/month</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-white transition-all mb-8 flex items-center justify-center gap-2 ${plan.ctaClass}`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="space-y-3">
                    {plan.features.map((f, i) => (
                      <div key={i} className={`flex gap-3 ${f.highlight ? 'bg-blue-50 -mx-3 px-3 py-1.5 rounded-lg' : ''}`}>
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${f.included ? (f.highlight ? 'bg-blue-600' : 'bg-green-100') : 'bg-gray-100'}`}>
                          {f.included
                            ? <Check className={`w-3 h-3 ${f.highlight ? 'text-white' : 'text-green-600'}`} />
                            : <X className="w-3 h-3 text-gray-400" />}
                        </div>
                        <div>
                          <p className={`text-sm ${f.bold ? 'font-semibold text-gray-900' : f.included ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                            {f.text}
                            {f.soon && <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">Soon</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: 'What is the SMS Lead Agent?', a: 'When someone submits your contact form or books a service, our AI automatically texts them within 60 seconds with a personalized follow-up. Pro includes 100 texts/month; Scale includes 500.' },
              { q: 'How does the AI Email Marketing work?', a: 'Every week, Claude generates an irresistible promotional offer tailored to your business and sends it to all past customers automatically. You set it up once and it runs on autopilot.' },
              { q: 'Can I cancel or change plans anytime?', a: 'Yes — upgrade, downgrade, or cancel at any time. Changes take effect at your next billing period.' },
              { q: 'Do I need technical knowledge?', a: 'Not at all. Just describe your business, and our AI builds and manages everything for you.' },
            ].map((faq, i) => (
              <div key={i}>
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>14-day money-back guarantee • Cancel anytime • No hidden fees</p>
        </div>
      </div>

      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        selectedPlan={selectedPlan}
        onSuccess={handleSignupSuccess}
      />
    </div>
  );
}
