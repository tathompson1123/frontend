import { useState, useEffect } from 'react';
import { Check, X, Sparkles, Crown, Zap, TrendingUp, MessageSquare, Mail, AlertTriangle, ArrowUpRight, Phone, ChevronDown } from 'lucide-react';

const PLAN_LEVEL = { basic: 1, pro: 2, scale: 3 };

const PLAN_META = {
  basic:  { name: 'Basic',  price: 29.95,  color: 'from-gray-500 to-gray-600',    icon: Sparkles,   smsLimit: 100,  chatLimit: 200  },
  pro:    { name: 'Pro',    price: 99.95,  color: 'from-blue-500 to-purple-600',   icon: Crown,      smsLimit: 100,  chatLimit: 500  },
  scale:  { name: 'Scale',  price: 175.95, color: 'from-purple-500 to-pink-600',   icon: TrendingUp, smsLimit: 500,  chatLimit: 99999 },
  expert: { name: 'Expert', price: 99.95,  color: 'from-blue-500 to-purple-600',   icon: Crown,      smsLimit: 200,  chatLimit: 500  },
};

function UsageMeter({ label, used, limit, color = 'blue', upgradeNote }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isUnlimited = limit >= 99999;
  const isWarning = pct >= 80;
  const barColor = isWarning ? 'bg-red-500' : color === 'green' ? 'bg-green-500' : 'bg-blue-500';
  return (
    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-800 text-sm">{label}</span>
        {isUnlimited
          ? <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Unlimited</span>
          : <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isWarning ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>{used} / {limit}</span>
        }
      </div>
      {!isUnlimited && (
        <>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-1">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{pct}% used this month</span>
            {isWarning && upgradeNote && (
              <span className="text-xs text-red-500 font-semibold">{upgradeNote}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ContactSalesForm({ apiUrl, authFetch, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', phone: '', reason: '', flaws: '', feedback: '' });
  const [submitting, setSubmitting] = useState(false);
  const reasons = [
    'Too expensive',
    'Missing features I need',
    'Switching to a different provider',
    'Business is closed / paused',
    'Only needed it temporarily',
    'Technical issues',
    'Other',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.reason) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`${apiUrl}/api/billing/contact-sales`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (res.ok) onSuccess();
      else alert('Failed to submit. Please try again.');
    } catch { alert('Something went wrong.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-1">Contact Sales to Unsubscribe</h2>
          <p className="text-red-100 text-sm">A team member will reach out within 1 business day to process your request.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Personal Phone Number *</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="(555) 000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Reason for Unsubscribing *</label>
            <div className="relative">
              <select
                required
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 appearance-none bg-white pr-8"
              >
                <option value="">Select a reason...</option>
                {reasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">What could we improve? (Dashboard flaws)</label>
            <textarea
              value={form.flaws}
              onChange={e => setForm(f => ({ ...f, flaws: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              placeholder="What didn't work well or felt frustrating?"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Feedback</label>
            <textarea
              value={form.feedback}
              onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              placeholder="Anything else you'd like us to know?"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !form.name || !form.phone || !form.reason}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Unsubscribe Request'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Billing({ user, apiUrl, authFetch }) {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [basePlan, setBasePlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    const plan = user?.plan || null;
    const bp = user?.base_plan || plan;
    setCurrentPlan(plan);
    setBasePlan(bp);
    if (plan && plan !== 'free') {
      window.dispatchEvent(new CustomEvent('onboarding-step-complete', { detail: { step: 5 } }));
      fetchUsage();
      fetchSubscription();
    }
  }, [user]);

  const fetchUsage = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/billing/usage`);
      if (res.ok) setUsage(await res.json());
    } catch {}
  };

  const fetchSubscription = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/billing/subscription`);
      if (res.ok) setSubscription(await res.json());
    } catch {}
  };

  const handleUpgrade = async (planId) => {
    const bp = basePlan || currentPlan;
    if (planId === bp) return;
    setLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId })
      });
      const data = await response.json();
      if (data.upgraded || data.downgraded) {
        window.location.reload();
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout. Please try again.');
      }
    } catch {
      alert('Something went wrong. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const isOnPaidPlan = currentPlan && currentPlan !== 'free';
  const meta = PLAN_META[basePlan || currentPlan];
  const PlanIcon = meta?.icon || Sparkles;
  const nextBilling = subscription?.current_period_end
    ? new Date(subscription.current_period_end * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  // ── CURRENT PLAN DASHBOARD ────────────────────────────────────────────────
  if (isOnPaidPlan && meta) {
    const isProOrBelow = (PLAN_LEVEL[basePlan || currentPlan] || 0) < PLAN_LEVEL.scale;
    const smsUsed = usage?.smsUsed ?? 0;
    const smsLimit = meta.smsLimit;
    const chatUsed = usage?.chatUsed ?? 0;
    const chatLimit = meta.chatLimit;
    const smsPct = smsLimit > 0 ? Math.round((smsUsed / smsLimit) * 100) : 0;
    const chatPct = chatLimit < 99999 && chatLimit > 0 ? Math.round((chatUsed / chatLimit) * 100) : 0;
    const nearLimit = smsPct >= 80 || chatPct >= 80;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Plan header */}
        <div className={`bg-gradient-to-br ${meta.color} rounded-2xl p-7 text-white mb-6 shadow-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <PlanIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Current Plan</p>
                <h1 className="text-3xl font-bold">{meta.name}</h1>
                <p className="text-white/80 text-sm">${meta.price}/month</p>
              </div>
            </div>
            <div className="text-right">
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">Active</span>
              {nextBilling && (
                <p className="text-white/60 text-xs mt-2">Renews {nextBilling}</p>
              )}
            </div>
          </div>
        </div>

        {/* Usage limit warning */}
        {nearLimit && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Approaching your plan limits</p>
              <p className="text-red-600 text-xs mt-0.5">Upgrade to Scale for 5x more SMS and unlimited chat responses.</p>
            </div>
          </div>
        )}

        {/* Usage meters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">This Month's Usage</h2>
          <div className="space-y-4">
            <UsageMeter
              label="SMS Messages Sent"
              used={smsUsed}
              limit={smsLimit}
              color="blue"
              upgradeNote={smsPct >= 80 ? 'Upgrade for 500/mo' : null}
            />
            <UsageMeter
              label="Chat Agent AI Responses"
              used={chatUsed}
              limit={chatLimit}
              color="green"
              upgradeNote={chatPct >= 80 ? 'Upgrade for unlimited' : null}
            />
          </div>
        </div>

        {/* Upgrade to Scale */}
        {isProOrBelow && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-gray-900">Upgrade to Scale — $175.95/mo</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">Remove your SMS and chat limits and unlock everything at full capacity.</p>
                <div className="space-y-1.5">
                  {[
                    '500 SMS / month (5× more)',
                    'Unlimited chat agent responses',
                    'Higher priority support',
                  ].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleUpgrade('scale')}
                disabled={loading}
                className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
              >
                <ArrowUpRight className="w-4 h-4" />
                Upgrade to Scale
              </button>
            </div>
          </div>
        )}

        {/* What's included */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">What's Included in Your Plan</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              'AI Website Generator',
              'Online Booking Calendar',
              'Customer & Lead Management',
              'Team Management',
              ...(currentPlan !== 'basic' ? [
                'AI Chat Agent (24/7)',
                'SMS Lead Follow-Up Agent',
                'Automated Google Reviews',
                'Weekly AI Email Marketing',
                'Market Research Reports',
              ] : []),
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3">
          <div className="text-xs text-gray-400 flex items-center justify-center gap-6">
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" />Billed monthly</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" />Cancel anytime</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" />Secure payments via Stripe</span>
          </div>

          {/* Tiny unsubscribe link */}
          {!contactSuccess ? (
            <button
              onClick={() => setShowContactForm(true)}
              className="text-[11px] text-gray-300 hover:text-gray-400 underline transition-colors"
            >
              Need to unsubscribe? Contact sales
            </button>
          ) : (
            <p className="text-[11px] text-green-600 font-medium">Request received — we'll reach out within 1 business day.</p>
          )}
        </div>

        {/* Contact form modal */}
        {showContactForm && (
          <ContactSalesForm
            apiUrl={apiUrl}
            authFetch={authFetch}
            onClose={() => setShowContactForm(false)}
            onSuccess={() => { setShowContactForm(false); setContactSuccess(true); }}
          />
        )}
      </div>
    );
  }

  // ── PRICING PAGE (no active plan) ─────────────────────────────────────────
  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      tagline: 'Essential tools to get started',
      price: 29.95,
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
        { text: 'Automated Google Reviews', included: false },
      ],
      cta: 'Get 2 weeks of Pro for free',
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'Full AI automation for growth',
      price: 99.95,
      icon: Crown,
      gradient: 'from-blue-500 to-purple-600',
      popular: true,
      trial: '1-week free trial',
      smsLimit: 100,
      chatLimit: 500,
      features: [
        { text: 'Everything in Basic', included: true, bold: true },
        { text: 'AI Chat Agent (24/7 on your website)', included: true, highlight: true },
        { text: 'SMS Lead Follow-Up Agent', included: true, highlight: true },
        { text: '100 SMS / month', included: true, highlight: true },
        { text: '500 chat AI responses / month', included: true, highlight: true },
        { text: 'Automated Google Review Requests', included: true, highlight: true },
        { text: 'Weekly AI Email Marketing', included: true, highlight: true },
        { text: 'Market Research Reports', included: true },
        { text: 'Priority Support', included: true },
      ],
      cta: 'Start free trial',
    },
    {
      id: 'scale',
      name: 'Scale',
      tagline: 'Higher limits for busy businesses',
      price: 175.95,
      icon: TrendingUp,
      gradient: 'from-purple-500 to-pink-600',
      trial: '1-week free trial',
      smsLimit: 500,
      features: [
        { text: 'Everything in Pro', included: true, bold: true },
        { text: '500 SMS / month (5× more)', included: true, highlight: true },
        { text: 'Unlimited chat agent responses', included: true, highlight: true },
        { text: 'White-label options', included: true, soon: true },
        { text: 'Dedicated account manager', included: true, soon: true },
        { text: 'Custom API integrations', included: true, soon: true },
      ],
      cta: 'Start free trial',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Choose Your Plan</h1>
        <p className="text-lg text-gray-600">AI-powered tools that grow your business on autopilot</p>
        {!currentPlan && (
          <div className="mt-5 mx-auto max-w-xl p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
            <p className="text-amber-900 font-semibold">You need a plan to get started — choose one below</p>
          </div>
        )}
      </div>

      {/* Value callout */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" /> What you get with Pro — estimated value
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: 'AI Chat Agent', value: '$199/mo', icon: MessageSquare, desc: '24/7 lead capture & booking on your site' },
            { label: 'SMS Lead Agent', value: '$79/mo', icon: Zap, desc: 'Texts every new lead within 60 seconds' },
            { label: 'AI Email Marketing', value: '$149/mo', icon: Mail, desc: 'Weekly offers to past customers, on autopilot' },
          ].map(item => {
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
          {' '}→ <span className="font-bold text-green-600">$99.95/mo with Pro</span>
          <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">76% OFF</span>
        </p>
      </div>

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const bp = basePlan || currentPlan;
          const isActive = bp === plan.id;
          const isUpgrade = bp && PLAN_LEVEL[plan.id] > (PLAN_LEVEL[bp] || 0);
          const isDowngrade = bp && PLAN_LEVEL[plan.id] < (PLAN_LEVEL[bp] || 0);
          const Icon = plan.icon;
          return (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 transition-all ${plan.popular ? 'border-blue-500 shadow-xl md:scale-105' : 'border-gray-200'} ${isActive ? 'ring-4 ring-green-200' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-1 rounded-full text-sm font-bold shadow">MOST POPULAR</div>
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
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                  {plan.trial && <p className="text-xs text-green-600 font-semibold mt-1 bg-green-50 inline-block px-2 py-0.5 rounded-full">{plan.trial}</p>}
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
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isActive || loading}
                  className={`w-full py-3 rounded-xl font-bold transition-all text-sm ${isActive ? 'bg-green-100 text-green-700 cursor-default' : `bg-gradient-to-r ${plan.gradient} text-white hover:shadow-lg hover:scale-105`}`}
                >
                  {isActive ? '✓ Current Plan' : loading ? 'Processing...' : isUpgrade ? `Upgrade to ${plan.name}` : isDowngrade ? `Switch to ${plan.name}` : plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 text-center text-sm text-gray-500 flex items-center justify-center gap-8">
        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" />Free trial included</span>
        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" />Cancel anytime</span>
        <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-500" />No setup fees</span>
      </div>
    </div>
  );
}
