import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  X, Check, Sparkles, Crown, Rocket, Globe, Link, ShoppingCart,
  CreditCard, ArrowRight, Loader, ExternalLink, RefreshCw, Send,
  AlertCircle, MessageCircle, Copy, ChevronRight
} from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Plan definitions (compact version for wizard)
const plans = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Essential tools to get started',
    price: 29.95,
    icon: Sparkles,
    gradient: 'from-gray-400 to-gray-600',
    features: [
      'AI-Generated Website',
      'Online Booking Integration',
      'Team Management',
      'Customer & Lead Management'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'AI-powered automation',
    price: 69.95,
    icon: Crown,
    gradient: 'from-blue-500 to-purple-600',
    popular: true,
    features: [
      'Everything in Basic',
      'AI Chat Agent',
      'AI Lead Form Agent',
      'Automated Google Reviews',
      'AI SEO Blog Writing'
    ]
  },
  {
    id: 'expert',
    name: 'Expert',
    tagline: 'Complete business intelligence',
    price: 99.95,
    icon: Rocket,
    gradient: 'from-purple-500 to-pink-600',
    comingSoon: true,
    features: [
      'Everything in Pro',
      'AI Market Research',
      'Revenue Forecasting',
      'Competitor Analysis'
    ]
  }
];

const registrarLinks = [
  { name: 'GoDaddy', url: 'https://www.godaddy.com/help/change-nameservers-for-my-domains-664' },
  { name: 'Namecheap', url: 'https://www.namecheap.com/support/knowledgebase/article.aspx/767/10/how-to-change-dns-for-a-domain/' },
  { name: 'Google Domains', url: 'https://support.google.com/domains/answer/3290309' },
  { name: 'Cloudflare', url: 'https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/' },
  { name: 'Hostinger', url: 'https://support.hostinger.com/en/articles/1696789-how-to-change-nameservers-at-hostinger' },
  { name: 'Bluehost', url: 'https://www.bluehost.com/help/article/custom-nameservers' },
  { name: 'IONOS', url: 'https://www.ionos.com/help/domains/using-your-own-name-servers/change-a-domains-name-servers/' },
  { name: 'Porkbun', url: 'https://kb.porkbun.com/article/22-how-to-change-your-nameservers' },
  { name: 'Hover', url: 'https://help.hover.com/hc/en-us/articles/217282457-Managing-DNS-records-' },
  { name: 'Name.com', url: 'https://www.name.com/support/articles/205934547-Changing-nameservers-for-DNS-management' },
];

export default function PublishWizard({
  isOpen,
  onClose,
  startStep,
  user,
  apiUrl,
  authFetch,
  websiteData,
  refreshWebsiteData,
  onUserPlanUpdate,
}) {
  const [currentStep, setCurrentStep] = useState(startStep || 1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Domain state
  const [domainMode, setDomainMode] = useState(null); // 'buy', 'connect'
  const [domainSearchQuery, setDomainSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [availableDomains, setAvailableDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainAdded, setDomainAdded] = useState(false);
  const [domainVerified, setDomainVerified] = useState(false);
  const [domainPurchasedViaSorce, setDomainPurchasedViaSorce] = useState(false);

  // Assistant state
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);

  // Publish state
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);

  const checkoutRef = useRef(null);
  const checkoutInstanceRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const assistantEndRef = useRef(null);

  // Reset step when wizard opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(startStep || 1);
      setPaymentComplete(false);
      setCheckoutClientSecret(null);
      setSelectedPlan(null);
      setDomainMode(null);
      setPublishResult(null);
      setIsPublishing(false);
    }
  }, [isOpen, startStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkoutInstanceRef.current) {
        checkoutInstanceRef.current.destroy();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Mount Stripe Embedded Checkout when step 2 is active
  useEffect(() => {
    if (currentStep !== 2 || !checkoutClientSecret) return;

    let mounted = true;

    const initCheckout = async () => {
      try {
        const stripe = await stripePromise;
        if (!stripe || !mounted) return;

        const checkout = await stripe.initEmbeddedCheckout({
          clientSecret: checkoutClientSecret,
        });

        if (!mounted) {
          checkout.destroy();
          return;
        }

        checkoutInstanceRef.current = checkout;

        // Small delay to ensure DOM element exists
        setTimeout(() => {
          if (mounted && checkoutRef.current) {
            checkout.mount(checkoutRef.current);
          }
        }, 100);
      } catch (error) {
        console.error('Error initializing embedded checkout:', error);
      }
    };

    initCheckout();

    return () => {
      mounted = false;
      if (checkoutInstanceRef.current) {
        checkoutInstanceRef.current.destroy();
        checkoutInstanceRef.current = null;
      }
    };
  }, [currentStep, checkoutClientSecret]);

  // Poll for plan activation after checkout renders
  useEffect(() => {
    if (currentStep !== 2 || paymentComplete) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await authFetch(`${apiUrl}/api/billing/subscription`);
        const data = await res.json();
        if (data.plan && data.status !== 'none') {
          setPaymentComplete(true);
          clearInterval(pollIntervalRef.current);

          // Update user plan in parent
          if (onUserPlanUpdate) onUserPlanUpdate(data.plan);

          // Destroy checkout and advance
          if (checkoutInstanceRef.current) {
            checkoutInstanceRef.current.destroy();
            checkoutInstanceRef.current = null;
          }

          // Short delay for user to see success, then advance
          setTimeout(() => setCurrentStep(3), 1500);
        }
      } catch (e) {
        // Silent — keep polling
      }
    }, 2500);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [currentStep, paymentComplete]);

  // Auto-scroll assistant messages
  useEffect(() => {
    if (assistantEndRef.current) {
      assistantEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [assistantMessages]);

  if (!isOpen) return null;

  // --- Handlers ---

  const handleSelectPlan = async (planId) => {
    setSelectedPlan(planId);
    setCheckoutLoading(true);

    try {
      const response = await authFetch(`${apiUrl}/api/billing/create-embedded-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId })
      });

      if (response.ok) {
        const data = await response.json();
        setCheckoutClientSecret(data.clientSecret);
        setCurrentStep(2);
      } else {
        const err = await response.json();
        alert('Failed to start checkout: ' + (err.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSearchDomains = async () => {
    if (!domainSearchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await authFetch(`${apiUrl}/api/website/search-domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: domainSearchQuery.trim() })
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableDomains(data.domains || []);
      } else {
        alert('Failed to search domains');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search domains');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePurchaseDomain = async () => {
    if (!selectedDomain) return;
    setIsPurchasing(true);
    try {
      const response = await authFetch(`${apiUrl}/api/website/purchase-domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: selectedDomain.name })
      });
      if (response.ok) {
        setDomainVerified(true);
        setDomainPurchasedViaSorce(true);
        // Auto-advance to publish
        setTimeout(() => setCurrentStep(4), 1000);
      } else {
        const error = await response.json();
        alert('Failed to purchase domain: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to purchase domain');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleConnectDomain = async () => {
    if (!domainInput.trim()) return;
    setDomainLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/website/add-domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput.trim() })
      });
      if (response.ok) {
        setDomainAdded(true);
      } else {
        const error = await response.json();
        alert('Failed to add domain: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Add domain error:', error);
      alert('Failed to add domain');
    } finally {
      setDomainLoading(false);
    }
  };

  const handleCheckDomainStatus = async () => {
    setDomainLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/website/domain-status`);
      if (response.ok) {
        const data = await response.json();
        if (data.verified) {
          setDomainVerified(true);
          setTimeout(() => setCurrentStep(4), 1000);
        } else {
          alert('Domain not verified yet. DNS changes can take 5-60 minutes.');
        }
      }
    } catch (error) {
      console.error('Check domain error:', error);
    } finally {
      setDomainLoading(false);
    }
  };

  const sendAssistantMessage = async () => {
    if (!assistantInput.trim() || assistantLoading) return;

    const userMsg = assistantInput.trim();
    setAssistantMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAssistantInput('');
    setAssistantLoading(true);

    try {
      const response = await authFetch(`${apiUrl}/api/website/domain-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          domain: domainInput || null,
          registrar: null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAssistantMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setAssistantMessages(prev => [...prev, {
          role: 'assistant',
          content: "Sorry, I couldn't process that. Please try again or contact support."
        }]);
      }
    } catch (error) {
      console.error('Assistant error:', error);
      setAssistantMessages(prev => [...prev, {
        role: 'assistant',
        content: "Connection error. Please try again."
      }]);
    } finally {
      setAssistantLoading(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const response = await authFetch(`${apiUrl}/api/website/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html_content: websiteData?.html_content,
          pages: websiteData?.pages
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPublishResult(data);
        if (refreshWebsiteData) await refreshWebsiteData();

        // Trigger onboarding completion
        window.dispatchEvent(new CustomEvent('onboarding-step-complete', { detail: { step: 3 } }));
      } else {
        const error = await response.json();
        alert('Failed to publish: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish website');
    } finally {
      setIsPublishing(false);
    }
  };

  // Auto-publish when step 4 is reached
  useEffect(() => {
    if (currentStep === 4 && !publishResult && !isPublishing) {
      handlePublish();
    }
  }, [currentStep]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // --- Step Progress Bar ---
  const stepLabels = ['Plan', 'Payment', 'Domain', 'Publish'];
  const activeSteps = [];
  if (startStep <= 1) activeSteps.push(1, 2, 3, 4);
  else if (startStep === 3) activeSteps.push(3, 4);
  else if (startStep === 4) activeSteps.push(4);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentStep === 1 && 'Choose Your Plan'}
              {currentStep === 2 && 'Complete Payment'}
              {currentStep === 3 && 'Set Up Your Domain'}
              {currentStep === 4 && 'Publishing Your Website'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {currentStep === 1 && 'Select a plan to publish your website'}
              {currentStep === 2 && 'Enter your card details to activate your plan'}
              {currentStep === 3 && 'Get your own domain or connect one you already have'}
              {currentStep === 4 && 'Deploying to the web...'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Progress */}
        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            {activeSteps.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  currentStep === step
                    ? 'bg-amber-100 text-amber-800'
                    : currentStep > step
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {currentStep > step ? <Check className="w-3 h-3" /> : null}
                  {stepLabels[step - 1]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ========== STEP 1: Plan Selection ========== */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  const isSelected = selectedPlan === plan.id;

                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all ${
                        plan.comingSoon
                          ? 'opacity-50 cursor-not-allowed border-gray-200'
                          : isSelected
                          ? 'border-amber-500 shadow-lg bg-amber-50'
                          : plan.popular
                          ? 'border-blue-400 shadow-md hover:shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                      onClick={() => !plan.comingSoon && setSelectedPlan(plan.id)}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-0.5 rounded-full text-xs font-bold">
                            MOST POPULAR
                          </span>
                        </div>
                      )}
                      {plan.comingSoon && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-gray-500 text-white px-3 py-0.5 rounded-full text-xs font-bold">
                            COMING SOON
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{plan.name}</h3>
                          <p className="text-xs text-gray-500">{plan.tagline}</p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-500 text-sm">/mo</span>
                      </div>

                      <ul className="space-y-1.5">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      {isSelected && !plan.comingSoon && (
                        <div className="mt-3 text-center">
                          <div className="w-5 h-5 rounded-full bg-amber-600 flex items-center justify-center mx-auto">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">14-day money-back guarantee. Cancel anytime.</p>
                <button
                  onClick={() => selectedPlan && handleSelectPlan(selectedPlan)}
                  disabled={!selectedPlan || checkoutLoading}
                  className="px-8 py-3 bg-gradient-to-r from-amber-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
                >
                  {checkoutLoading ? (
                    <><Loader className="w-5 h-5 animate-spin" /> Setting up payment...</>
                  ) : (
                    <>Continue to Payment <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========== STEP 2: Stripe Embedded Checkout ========== */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {paymentComplete ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                  <p className="text-gray-600">Your {selectedPlan} plan is now active. Setting up domain...</p>
                  <Loader className="w-6 h-6 text-amber-600 animate-spin mx-auto mt-4" />
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <p className="text-sm text-blue-800">
                      Secure payment powered by Stripe. Your card details never touch our servers.
                    </p>
                  </div>
                  <div ref={checkoutRef} className="min-h-[400px]" />
                </>
              )}
            </div>
          )}

          {/* ========== STEP 3: Domain Setup ========== */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {!domainMode ? (
                // Domain choice screen
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Buy Domain */}
                    <div
                      className="bg-gradient-to-br from-amber-50 to-pink-50 rounded-xl p-6 border-2 border-amber-200 cursor-pointer hover:shadow-lg transition"
                      onClick={() => setDomainMode('buy')}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Buy a Domain</h3>
                          <p className="text-sm text-gray-600">$15/year - fully managed</p>
                        </div>
                      </div>
                      <ul className="space-y-1.5 text-sm text-gray-700 mb-4">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Instant activation</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> We handle everything</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Privacy protection included</li>
                      </ul>
                      <div className="flex items-center gap-2 text-amber-700 font-semibold">
                        Search for domains <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Connect Domain */}
                    <div
                      className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200 cursor-pointer hover:shadow-lg transition"
                      onClick={() => setDomainMode('connect')}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <Link className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Connect Your Domain</h3>
                          <p className="text-sm text-gray-600">Free - use a domain you own</p>
                        </div>
                      </div>
                      <ul className="space-y-1.5 text-sm text-gray-700 mb-4">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Free hosting & SSL</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Simple 2-step setup</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> AI-guided instructions</li>
                      </ul>
                      <div className="flex items-center gap-2 text-blue-700 font-semibold">
                        Connect my domain <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Skip for now */}
                  <div className="text-center">
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Skip for now - I'll set up a domain later
                    </button>
                    <p className="text-xs text-gray-400 mt-1">Your website will be live at a temporary URL</p>
                  </div>
                </div>
              ) : domainMode === 'buy' ? (
                // Buy domain sub-flow
                <div className="space-y-4">
                  <button onClick={() => { setDomainMode(null); setAvailableDomains([]); setSelectedDomain(null); }} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 rotate-180" /> Back to options
                  </button>

                  {/* Search */}
                  <div className="bg-gradient-to-br from-amber-50 to-pink-50 rounded-xl p-6 border-2 border-amber-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-amber-600" />
                      Search for your perfect domain
                    </h3>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={domainSearchQuery}
                        onChange={(e) => setDomainSearchQuery(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearchDomains()}
                        placeholder="mybusiness"
                        className="flex-1 px-4 py-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none text-lg"
                      />
                      <button
                        onClick={handleSearchDomains}
                        disabled={isSearching || !domainSearchQuery.trim()}
                        className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-50"
                      >
                        {isSearching ? <Loader className="w-5 h-5 animate-spin" /> : 'Search'}
                      </button>
                    </div>
                  </div>

                  {/* Results */}
                  {availableDomains.length > 0 && (
                    <div className="space-y-3">
                      {availableDomains.filter(d => d.available).map((domain) => (
                        <div
                          key={domain.name}
                          onClick={() => setSelectedDomain(domain)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                            selectedDomain?.name === domain.name
                              ? 'border-amber-600 bg-amber-50'
                              : 'border-gray-200 hover:border-amber-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedDomain?.name === domain.name ? 'border-amber-600 bg-amber-600' : 'border-gray-300'
                              }`}>
                                {selectedDomain?.name === domain.name && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{domain.name}</p>
                                <p className="text-xs text-green-600">{domain.isSuggestion ? 'Suggested alternative' : 'Available'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">${domain.price}</p>
                              <p className="text-xs text-gray-500">/year</p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {availableDomains.filter(d => d.available).length === 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                          <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                          <p className="font-medium text-gray-900">All domains are taken</p>
                          <p className="text-sm text-gray-600">Try a different name or variation</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Purchase */}
                  {selectedDomain && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{selectedDomain.name}</p>
                          <p className="text-sm text-gray-600">${selectedDomain.price}/year - includes hosting, SSL, privacy</p>
                        </div>
                        <button
                          onClick={handlePurchaseDomain}
                          disabled={isPurchasing}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                          {isPurchasing ? (
                            <><Loader className="w-5 h-5 animate-spin" /> Purchasing...</>
                          ) : (
                            <><ShoppingCart className="w-5 h-5" /> Purchase Domain</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Connect domain sub-flow
                <div className="space-y-4">
                  <button onClick={() => { setDomainMode(null); setDomainAdded(false); setDomainInput(''); }} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 rotate-180" /> Back to options
                  </button>

                  {!domainAdded ? (
                    // Step A: Enter domain
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-3">Enter your domain name</h3>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={domainInput}
                          onChange={(e) => setDomainInput(e.target.value.toLowerCase())}
                          placeholder="yourbusiness.com"
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          onClick={handleConnectDomain}
                          disabled={domainLoading || !domainInput.trim()}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {domainLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Continue'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Step B: Nameserver instructions + AI assistant
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600" />
                        <p className="text-sm text-green-800">Domain <strong>{domainInput}</strong> registered. Now update your nameservers.</p>
                      </div>

                      {/* Nameservers */}
                      <div className="bg-white rounded-xl p-5 border-2 border-amber-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Update your nameservers to:</h4>
                        <div className="space-y-2 mb-4">
                          {['ns1.vercel-dns.com', 'ns2.vercel-dns.com'].map(ns => (
                            <div key={ns} className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <span className="font-mono text-amber-900 font-semibold flex-1">{ns}</span>
                              <button
                                onClick={() => { copyToClipboard(ns); }}
                                className="px-3 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" /> Copy
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* CNAME alternative */}
                        <details className="text-sm">
                          <summary className="text-blue-600 cursor-pointer hover:underline font-medium">
                            Alternative: Use CNAME/A records instead
                          </summary>
                          <div className="mt-2 p-3 bg-blue-50 rounded-lg text-gray-700 space-y-1">
                            <p><strong>A Record:</strong> @ → 76.76.21.21</p>
                            <p><strong>CNAME Record:</strong> www → cname.vercel-dns.com</p>
                          </div>
                        </details>
                      </div>

                      {/* SORCE Assistant */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-blue-600" />
                          SORCE Assistant
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">Need help? Tell me which registrar you use and I'll walk you through it.</p>

                        <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
                          {assistantMessages.length === 0 && (
                            <div className="text-sm text-gray-500 py-3 px-2 space-y-2">
                              <p className="font-medium text-gray-700">I have step-by-step instructions for:</p>
                              <p className="text-xs text-gray-500">
                                GoDaddy &bull; Namecheap &bull; Google Domains &bull; Cloudflare &bull; Hostinger &bull; Bluehost &bull; IONOS &bull; Porkbun &bull; Hover &bull; Name.com
                              </p>
                              <p className="text-xs text-gray-400">I can also help with CNAME/A record setup as an alternative to nameservers.</p>
                              <p className="text-xs text-blue-500 font-medium">Tell me which registrar you use and I'll walk you through it!</p>
                            </div>
                          )}
                          {assistantMessages.map((msg, i) => (
                            <div
                              key={i}
                              className={`text-sm p-3 rounded-lg ${
                                msg.role === 'user'
                                  ? 'bg-blue-100 text-blue-900 ml-8'
                                  : 'bg-white text-gray-800 mr-4 border border-gray-200'
                              }`}
                            >
                              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                            </div>
                          ))}
                          {assistantLoading && (
                            <div className="bg-white text-gray-500 mr-4 border border-gray-200 p-3 rounded-lg text-sm flex items-center gap-2">
                              <Loader className="w-4 h-4 animate-spin" /> Thinking...
                            </div>
                          )}
                          <div ref={assistantEndRef} />
                        </div>

                        <div className="flex gap-2">
                          <input
                            value={assistantInput}
                            onChange={(e) => setAssistantInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendAssistantMessage()}
                            placeholder="e.g., I use GoDaddy"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                          />
                          <button
                            onClick={sendAssistantMessage}
                            disabled={assistantLoading || !assistantInput.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Registrar tutorials */}
                      <div className="bg-white rounded-xl p-5 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Step-by-step guides for your registrar:</h4>
                        <div className="flex flex-wrap gap-2">
                          {registrarLinks.map(r => (
                            <a
                              key={r.name}
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 hover:border-gray-300 flex items-center gap-1 transition"
                            >
                              {r.name} <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Verify + Continue */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <button
                          onClick={handleCheckDomainStatus}
                          disabled={domainLoading}
                          className="px-6 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition disabled:opacity-50 flex items-center gap-2"
                        >
                          {domainLoading ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          Check Domain Status
                        </button>
                        <button
                          onClick={() => setCurrentStep(4)}
                          className="px-6 py-3 bg-gradient-to-r from-amber-600 to-blue-600 text-white rounded-lg font-bold hover:shadow-lg transition flex items-center gap-2"
                        >
                          Continue & Publish <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 text-center">
                        You can verify your domain later. DNS changes typically take 5-60 minutes.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========== STEP 4: Publishing ========== */}
          {currentStep === 4 && (
            <div className="text-center py-12">
              {isPublishing ? (
                <div>
                  <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader className="w-10 h-10 text-amber-600 animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Publishing Your Website...</h3>
                  <p className="text-gray-600">Deploying to the web. This takes just a moment.</p>
                </div>
              ) : publishResult ? (
                <div>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Website is Live!</h3>
                  <p className="text-gray-600 mb-6">Congratulations! Your website has been published successfully.</p>

                  {publishResult.url && (
                    <a
                      href={publishResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition mb-4"
                    >
                      <Globe className="w-5 h-5" /> Visit Your Website <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {domainPurchasedViaSorce && (
                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-left max-w-md mx-auto">
                      <p className="font-semibold mb-1">⏱ DNS Propagation in Progress</p>
                      <p className="text-amber-700">
                        Your domain was successfully registered and pointed to your website. However, DNS changes can take <strong>a few minutes up to 48 hours</strong> to fully propagate worldwide — this is normal. Your custom domain will start working automatically once propagation completes.
                      </p>
                      <p className="mt-2 text-amber-600 text-xs">
                        In the meantime, your site is live at the link above.
                      </p>
                    </div>
                  )}

                  <div className="mt-6">
                    <button
                      onClick={onClose}
                      className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
                  <p className="text-gray-600 mb-4">Failed to publish your website. Please try again.</p>
                  <button
                    onClick={handlePublish}
                    className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
