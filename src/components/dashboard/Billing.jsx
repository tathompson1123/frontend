import { useState } from 'react';
import { CreditCard } from 'lucide-react';

export default function Billing({ user, apiUrl }) {
  const [cardOnFile, setCardOnFile] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      name: 'Original',
      price: 0.00,
      annualPrice: 0.00,
      features: [
        'Up to 10 bookings per month',
        'Basic website',
        'Email support',
        '1 team member'
      ]
    },
    {
      name: 'Starter',
      price: 29.00,
      annualPrice: 24.00,
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
      name: 'Professional',
      price: 79.00,
      annualPrice: 65.00,
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
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Billing & Subscription</h2>
        <p className="text-gray-600 mt-1">Manage your plan and payment methods</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Current Plan</h3>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold text-purple-600 capitalize">{user.plan || 'Original'} Plan</p>
            <p className="text-gray-600 mt-1">
              Billing Cycle: <span className="font-semibold capitalize">{billingCycle}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              ${plans.find(p => p.name.toLowerCase().includes(user.plan || 'original'))?.price || '0.00'}
              <span className="text-lg text-gray-600">/mo</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">Next billing date: {new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Payment Method</h3>
          <button
            type="button"
            onClick={() => setShowAddCard(true)}
            className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
          >
            {cardOnFile ? 'Update Card' : 'Add Card'}
          </button>
        </div>
        {cardOnFile ? (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <CreditCard className="w-8 h-8 text-gray-600" />
            <div>
              <p className="font-semibold text-gray-900">•••• •••• •••• {cardOnFile.last4}</p>
              <p className="text-sm text-gray-600">Expires {cardOnFile.expiry}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No payment method on file</p>
            <button
              type="button"
              onClick={() => setShowAddCard(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Add Payment Method
            </button>
          </div>
        )}
      </div>

      {/* Available Plans */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Available Plans</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.name.toLowerCase().includes(user.plan || 'original');
            return (
              <div key={plan.name} className={`bg-white rounded-xl p-6 shadow-sm border-2 ${
                plan.popular ? 'border-purple-500' : 'border-gray-200'
              } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}>
                {plan.popular && (
                  <span className="inline-block bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    MOST POPULAR
                  </span>
                )}
                {isCurrentPlan && (
                  <span className="inline-block bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    CURRENT PLAN
                  </span>
                )}
                <h4 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  ${billingCycle === 'annual' ? plan.annualPrice : plan.price}
                  <span className="text-lg text-gray-600">/mo</span>
                </p>
                {billingCycle === 'annual' && (
                  <p className="text-sm text-green-600 mb-4">Save ${((plan.price - plan.annualPrice) * 12).toFixed(2)}/year</p>
                )}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={isCurrentPlan}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing Cycle */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Billing Cycle</h3>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              billingCycle === 'monthly'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-3 rounded-lg font-semibold transition relative ${
              billingCycle === 'annual'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Payment Method</h2>
            <form className="space-y-4">
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    setCardOnFile({ last4: '4242', expiry: '12/25' });
                    setShowAddCard(false);
                  }}
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
