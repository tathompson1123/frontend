import { Lock, CreditCard, Sparkles, Zap, Star, Crown } from 'lucide-react';

/**
 * FeatureGate Component
 * 
 * Supports 4-tier plan system:
 * - null (no plan): Can generate website, buy domain
 * - basic: Can deploy website, use booking/customers/business settings
 * - pro: Can use AI agents, Google Business, AI replies, review automation
 * - expert: All features + priority support
 */
export default function FeatureGate({
  user,
  requiredPlan = 'pro', // 'pro', 'scale' (basic/expert are legacy)
  feature,
  children,
  onUpgradeClick,
  fallback = null
}) {
  // Plan hierarchy: free (0) < pro/basic/expert (1-2) < scale (3)
  const planLevels = { 'basic': 1, 'pro': 2, 'expert': 2, 'scale': 3 };
  const currentLevel = planLevels[user?.plan?.toLowerCase()] || 0;
  const requiredLevel = planLevels[requiredPlan.toLowerCase()] || 0;
  
  const hasAccess = currentLevel >= requiredLevel;

  // Features and their requirements
  const featureInfo = {
    'publish': {
      title: 'Publish Your Website',
      description: 'Go live and let customers find you online',
      icon: Sparkles,
      requiredPlan: 'Basic',
      benefits: [
        'Publish to a live URL',
        'Professional hosting included',
        'Free SSL certificate',
        'Custom domain support'
      ]
    },
    'deploy': {
      title: 'Deploy Your Website',
      description: 'Make your website live and accessible to customers',
      icon: Sparkles,
      requiredPlan: 'Basic',
      benefits: [
        'Custom domain deployment',
        'Professional hosting',
        'SSL certificate included',
        'Booking calendar & customer management'
      ]
    },
    'ai-agents': {
      title: 'AI Agents',
      description: 'Automate customer interactions 24/7 with AI',
      icon: Zap,
      requiredPlan: 'Pro',
      benefits: [
        'AI chat on your website',
        'Lead qualification automation',
        'Capture leads while you sleep',
        'Auto-respond to inquiries'
      ]
    },
    'google-business': {
      title: 'Google Business Integration',
      description: 'Manage reviews and boost your local SEO',
      icon: Star,
      requiredPlan: 'Pro',
      benefits: [
        'Google Business Profile sync',
        'AI-powered review replies',
        'Automated review requests',
        'Boost your Google rankings'
      ]
    },
    'ai-review-reply': {
      title: 'AI Review Reply Generator',
      description: 'Generate professional responses to reviews instantly',
      icon: Sparkles,
      requiredPlan: 'Pro',
      benefits: [
        'AI-generated review responses',
        'Professional tone matching',
        'Save hours of manual work',
        'Respond to all reviews quickly'
      ]
    },
    'review-automation': {
      title: 'Automated Review Requests',
      description: 'Automatically request reviews after every job',
      icon: Star,
      requiredPlan: 'Pro',
      benefits: [
        'Automatic review requests via SMS/email',
        'Perfect timing after job completion',
        '100x faster review growth',
        'Boost local SEO automatically'
      ]
    },

  'market-research': {
      title: 'Market Research & Revenue Potential',
      description: 'AI-powered business intelligence and growth insights',
      icon: Crown,
      requiredPlan: 'Pro',
      benefits: [
        'AI-generated market research reports',
        'Revenue forecasting & predictions',
        'Competitor analysis & benchmarking',
        'Service pricing optimization'
      ]
    },
    'email-campaigns': {
      title: 'AI Email Marketing',
      description: 'Weekly AI-generated offers sent automatically to past customers',
      icon: Crown,
      requiredPlan: 'Pro',
      benefits: [
        'SORCE generates irresistible weekly offers',
        'Sends automatically to all past customers',
        'Seasonal & upsell campaigns on autopilot',
        'Full campaign history & analytics'
      ]
    },
    'embed-code': {
      title: 'Embed on External Sites',
      description: 'Add your booking widget, chat agent, and lead form to any website',
      icon: Zap,
      requiredPlan: 'Pro',
      benefits: [
        'Embed booking calendar on Wix, Squarespace, WordPress',
        'AI chat widget on any external site',
        'Lead capture forms with instant SMS alerts',
        'One snippet — works everywhere'
      ]
    }
  };

  const currentFeature = featureInfo[feature] || {
    title: 'Premium Feature',
    description: 'This feature requires a paid plan',
    icon: Lock,
    requiredPlan: requiredPlan,
    benefits: [
      'Unlock advanced features',
      'Grow your business faster',
      'Automate repetitive tasks',
      'Get priority support'
    ]
  };

  // If user has access, show the feature
  if (hasAccess) {
    return children;
  }

  // If fallback provided, show that
  if (fallback) {
    return fallback;
  }

  // Show upgrade prompt
  const Icon = currentFeature.icon;
  const isProFeature = requiredLevel === 2;
  const isExpertFeature = requiredLevel === 3; // Scale tier

  return (
    <div className={`bg-gradient-to-br rounded-xl border-2 p-8 ${
      isExpertFeature
        ? 'from-purple-50 via-pink-50 to-indigo-50 border-purple-300'
        : isProFeature 
        ? 'from-amber-50 via-yellow-50 to-orange-50 border-amber-200'
        : 'from-primary-50 via-accent-50 to-highlight-50 border-primary-200'
    }`}>
      <div className="text-center max-w-md mx-auto">
        <div className={`w-20 h-20 bg-gradient-to-br rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl ${
          isExpertFeature
            ? 'from-purple-500 to-pink-600'
            : isProFeature
            ? 'from-amber-500 to-orange-600'
            : 'from-primary-500 to-accent-600'
        }`}>
          <Icon className="w-10 h-10 text-white" />
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {currentFeature.title}
        </h3>

        <p className="text-gray-600 mb-6">
          {currentFeature.description}
        </p>

        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Lock className={`w-5 h-5 ${isExpertFeature ? 'text-purple-600' : isProFeature ? 'text-amber-600' : 'text-primary-600'}`} />
            <p className="font-semibold text-gray-900">
              Requires <span className={isExpertFeature ? 'text-purple-600' : isProFeature ? 'text-amber-600' : 'text-primary-600'}>{currentFeature.requiredPlan}</span> Plan
            </p>
          </div>
          <ul className="text-sm text-left space-y-2 text-gray-700">
            {currentFeature.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isExpertFeature ? 'bg-purple-500' : isProFeature ? 'bg-amber-500' : 'bg-primary-500'
                }`}></span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onUpgradeClick}
          className={`w-full text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-3 ${
            isExpertFeature
              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600'
              : isProFeature
              ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-600'
              : 'bg-gradient-to-r from-primary-600 to-accent-600'
          }`}
        >
          {isExpertFeature || isProFeature ? <Crown className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
          Upgrade to {currentFeature.requiredPlan}
        </button>

        <p className="text-xs text-gray-500 mt-4">
          {currentLevel === 0 ? (
            'Plans start at $195/month • Cancel anytime'
          ) : (
            `Upgrade from ${user?.plan} to unlock this feature`
          )}
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to check if feature is available
 */
export function useFeatureAccess(user, requiredPlan) {
  const planLevels = { 'basic': 1, 'pro': 2, 'expert': 2, 'scale': 3 };
  const currentLevel = planLevels[user?.plan?.toLowerCase()] || 0;
  const requiredLevel = planLevels[requiredPlan?.toLowerCase()] || 0;
  return currentLevel >= requiredLevel;
}

/**
 * Component to show plan-gated button
 */
export function PlanGatedButton({ 
  user, 
  requiredPlan = 'basic',
  onClick,
  onUpgradeClick,
  children,
  className = ''
}) {
  const hasAccess = useFeatureAccess(user, requiredPlan);
  
  if (hasAccess) {
    return (
      <button onClick={onClick} className={className}>
        {children}
      </button>
    );
  }
  
  const isProFeature = requiredPlan.toLowerCase() === 'pro' || requiredPlan.toLowerCase() === 'expert';
  
  return (
    <button
      onClick={onUpgradeClick}
      className={`${className} ${
        isProFeature
          ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
          : 'bg-gradient-to-r from-primary-600 to-accent-600'
      } text-white font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2`}
    >
      <Lock className="w-4 h-4" />
      {isProFeature ? 'Pro' : 'Basic'} Feature
    </button>
  );
}
