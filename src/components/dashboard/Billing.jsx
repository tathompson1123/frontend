import { useState } from 'react';
import { CreditCard, Check, Calendar } from 'lucide-react';

export default function Billing({ user, apiUrl }) {
  const [cardOnFile, setCardOnFile] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'forever',
      features: [
        'Up to 10 bookings per month',
        'Basic website',
        'Email support',
        '1 team member'
      ]
    },
    {
      id: 'starter',
      name: 'Starter',
      price: billingCycle === 'monthly' ? 29 : 290,
      interval: billingCycle === 'monthly' ? '/month' : '/year',
      popular: false,
      features: [
        'Up to 100 bookings per month',
        'Custom website with AI',
        'Priority email support',
        'Up to 5 team members',
        'Google Business integration',
        'Custom booking forms'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: billingCycle === 'monthly' ? 79 : 790,
      interval: billingCycle === 'monthly' ? '/month' : '/year',
      popular: true,
      features: [
        'Unlimited bookings',
        'Premium AI website',
        'Priority phone & email support',
        'Unlimited team members',
        'Advanced analytics',
        'Custom domain',
        'API access',
        'White-label option'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      interval: '',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        '24/7 phone support',
        'Custom integrations',
        'SLA guarantee',
        'Training & onboarding',
        'Custom features'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Billing & Subscription</h2>
        <p className="text-gray-600 mt-1">Manage your plan and payment methods</p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm">Current Plan</p>
            <h3 className="text-3xl font-bold mt-1 capitalize">{user.plan || 'Free'}</h3>
          </div>
          <div className="text-right">
            <p className="text-purple-100 text-sm">Renews</p>
            <p className="text-xl font-semibold mt-1">
              {user.plan === 'free' ? 'Never' : 'Jan 30, 2026'}
            </p>
          </div>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="bg-white rounded-lg p-1 inline-flex shadow-sm border border-gray-200">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              billingCycle === 'yearly'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 relative ${
              plan.popular ? 'border-purple-600' : 'border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
            )}

            <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
            <div className="mb-6">
              {typeof plan.price === 'number' ? (
                <>
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">{plan.interval}</span>
                </>
              ) : (
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                user.plan === plan.id
                  ? 'bg-gray-100 text-gray-600 cursor-default'
                  : plan.popular
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
                  : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-600 hover:text-purple-600'
              }`}
              disabled={user.plan === plan.id}
            >
              {user.plan === plan.id ? 'Current Plan' : plan.id === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Payment Method</h3>
          <button
            type="button"
            onClick={() => setShowAddCard(true)}
            className="text-purple-600 hover:text-purple-700 font-medium text-sm"
          >
            {cardOnFile ? 'Update Card' : 'Add Card'}
          </button>
        </div>

        {cardOnFile ? (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <CreditCard className="w-10 h-10 text-gray-600" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">•••• •••• •••• 4242</p>
              <p className="text-sm text-gray-600">Expires 12/25</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              Default
            </span>
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No payment method on file</p>
            <button
              type="button"
              onClick={() => setShowAddCard(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-all"
            >
              Add Payment Method
            </button>
          </div>
        )}
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Billing History</h3>
        
        <div className="space-y-3">
          {user.plan !== 'free' ? (
            <>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Calendar className="w-8 h-8 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">December 2025</p>
                    <p className="text-sm text-gray-600">Professional Plan - Monthly</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">$79.00</p>
                  <p className="text-sm text-green-600">Paid</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Calendar className="w-8 h-8 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">November 2025</p>
                    <p className="text-sm text-gray-600">Professional Plan - Monthly</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">$79.00</p>
                  <p className="text-sm text-green-600">Paid</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-600">
              No billing history yet
            </div>
          )}
        </div>
      </div>

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Payment Method</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Smith"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => setShowAddCard(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setCardOnFile(true);
                  setShowAddCard(false);
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Add Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
