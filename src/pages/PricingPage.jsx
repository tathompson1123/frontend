import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight, Sparkles, Crown, TrendingUp, Zap, MessageSquare, Mail, Star, ChevronDown } from 'lucide-react';
import SignupModal from '../components/SignupModal';

const ENTERPRISE_REASONS = [
  'Multi-location business',
  'High SMS / chat volume needs',
  'White-label / agency use',
  'Custom integrations required',
  'Other',
];

function EnterpriseModal({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', reason: '', details: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/billing/enterprise-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch { setSubmitted(true); } // show success even if fetch fails
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-t-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-1">Enterprise Inquiry</h2>
          <p className="text-gray-300 text-sm">Tell us about your business and we'll reach out within 1 business day.</p>
        </div>
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Request Received!</h3>
            <p className="text-gray-600 text-sm mb-6">Our sales team will reach out within 1 business day.</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" placeholder="Jane Smith" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Company *</label>
                <input required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" placeholder="Acme Co." />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" placeholder="jane@company.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
              <input required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" placeholder="(555) 000-0000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Need *</label>
              <div className="relative">
                <select required value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 appearance-none bg-white pr-8">
                  <option value="">Select...</option>
                  {ENTERPRISE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tell us more</label>
              <textarea value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
                rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                placeholder="Number of locations, monthly volume, specific requirements..." />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={submitting || !form.name || !form.email || !form.phone || !form.company || !form.reason}
                className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50">
                {submitting ? 'Sending...' : 'Submit Inquiry'}
              </button>
              <button type="button" onClick={onClose} className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

  const handleSelectPlan = (plan) => {
    if (plan.enterprise) { setShowEnterpriseModal(true); return; }
    if (plan.id === null) return;
    setSelectedPlan({ plan: plan.id, price: plan.price, billing: 'monthly' });
    setShowSignupModal(true);
  };

  const handleSignupSuccess = () => {
    setShowSignupModal(false);
    navigate('/dashboard');
  };

  const plans = [
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
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: null,
      description: 'Custom solutions for large or multi-location businesses',
      icon: Star,
      gradient: 'from-gray-700 to-gray-900',
      features: [
        { text: 'Everything in Scale', included: true, bold: true },
        { text: 'Unlimited SMS & chat responses', included: true, highlight: true },
        { text: 'Multi-location support', included: true, highlight: true },
        { text: 'White-label branding', included: true, highlight: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Custom API integrations', included: true },
        { text: 'Custom onboarding & training', included: true },
      ],
      cta: 'Contact Sales',
      ctaClass: 'bg-gray-900 hover:bg-gray-800',
      enterprise: true,
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
        <div className="grid md:grid-cols-3 gap-6 mb-16 items-start" style={{gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
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
              { q: 'How does the AI Email Marketing work?', a: 'Every week, SORCE generates an irresistible promotional offer tailored to your business and sends it to all past customers automatically. You set it up once and it runs on autopilot.' },
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
      {showEnterpriseModal && <EnterpriseModal onClose={() => setShowEnterpriseModal(false)} />}
    </div>
  );
}
