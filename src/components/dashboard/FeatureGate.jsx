import { Lock, CreditCard, Sparkles } from 'lucide-react';

/**
 * FeatureGate Component
 * 
 * Wraps features that require a paid plan
 * Shows upgrade prompt for users without a plan
 */
export default function FeatureGate({ 
  user, 
  feature, 
  children, 
  onUpgradeClick,
  fallback = null 
}) {
  const hasPlan = user?.plan && user.plan !== null;

  // Features that require a plan
  const restrictedFeatures = {
    'publish': {
      title: 'Publish Your Website',
      description: 'Make your website live and accessible to customers',
      icon: Sparkles
    },
    'deploy': {
      title: 'Deploy Website',
      description: 'Host your website on a custom domain',
      icon: Sparkles
    },
    'ai-agents': {
      title: 'AI Agents',
      description: 'Automate customer interactions with AI',
      icon: Sparkles
    },
    'google-business': {
      title: 'Google Business Integration',
      description: 'Manage reviews and online presence',
      icon: Sparkles
    }
  };

  const featureInfo = restrictedFeatures[feature];

  // If user has plan, show the feature
  if (hasPlan) {
    return children;
  }

  // If fallback provided, show that
  if (fallback) {
    return fallback;
  }

  // Show upgrade prompt
  const Icon = featureInfo?.icon || Lock;

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 rounded-xl border-2 border-purple-200 p-8">
      <div className="text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
          <Icon className="w-10 h-10 text-white" />
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {featureInfo?.title || 'Premium Feature'}
        </h3>

        <p className="text-gray-600 mb-6">
          {featureInfo?.description || 'This feature requires a paid plan'}
        </p>

        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Lock className="w-5 h-5 text-purple-600" />
            <p className="font-semibold text-gray-900">Select a plan to unlock:</p>
          </div>
          <ul className="text-sm text-left space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
              Publish and deploy websites
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
              AI-powered automation
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
              Google Business integration
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
              Priority support
            </li>
          </ul>
        </div>

        <button
          onClick={onUpgradeClick}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-3"
        >
          <CreditCard className="w-6 h-6" />
          Select Your Plan
        </button>

        <p className="text-xs text-gray-500 mt-4">
          Plans start at just $29/month • Cancel anytime
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to check if feature is available
 */
export function useFeatureAccess(user, feature) {
  const hasPlan = user?.plan && user.plan !== null;
  
  const restrictedFeatures = [
    'publish',
    'deploy',
    'ai-agents-activate',
    'google-business-connect'
  ];

  if (restrictedFeatures.includes(feature)) {
    return hasPlan;
  }

  // All other features are available
  return true;
}
