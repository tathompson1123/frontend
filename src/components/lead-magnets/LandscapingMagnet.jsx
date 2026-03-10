import { useState } from 'react';
import { Search, CheckCircle, Leaf } from 'lucide-react';

const FEATURES = [
  { id: 'mulch', label: 'Premium Mulch', icon: '🌿', priceMin: 400, priceMax: 800 },
  { id: 'trees', label: 'Mature Trees', icon: '🌳', priceMin: 1200, priceMax: 2400 },
  { id: 'patio', label: 'Stone Patio', icon: '🪨', priceMin: 3000, priceMax: 6000 },
  { id: 'firepit', label: 'Firepit Area', icon: '🔥', priceMin: 1500, priceMax: 3000 },
  { id: 'lighting', label: 'Outdoor Lighting', icon: '💡', priceMin: 800, priceMax: 1600 },
  { id: 'irrigation', label: 'Irrigation System', icon: '💧', priceMin: 2000, priceMax: 4000 },
];

export default function LandscapingMagnet({ userId, businessName, apiUrl }) {
  const [step, setStep] = useState('address'); // address | scanning | features | form | result
  const [address, setAddress] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedItems = FEATURES.filter((f) => selected.has(f.id));
  const totalMin = selectedItems.reduce((s, f) => s + f.priceMin, 0);
  const totalMax = selectedItems.reduce((s, f) => s + f.priceMax, 0);

  const handleAddressSearch = (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    setStep('scanning');
    setTimeout(() => setStep('features'), 2200);
  };

  const toggleFeature = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.phone) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    const features = selectedItems.map((f) => f.label).join(', ') || 'General landscaping inquiry';
    const message = `Address: ${address} | Features: ${features} | Estimated Range: $${totalMin.toLocaleString()}–$${totalMax.toLocaleString()}`;
    try {
      const res = await fetch(`${apiUrl}/api/leads/public/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          service: 'Landscaping',
          message,
          sms_consent: true,
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setStep('result');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'result') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Vision is Ready!</h2>
          <p className="text-gray-500 mb-6">
            Our designer will contact <span className="font-semibold text-gray-700">{form.name}</span> within 24 hours.
          </p>
          <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-3">Your Backyard Features</p>
            {selectedItems.length > 0 ? (
              <ul className="space-y-2">
                {selectedItems.map((f) => (
                  <li key={f.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {f.icon} {f.label}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ${f.priceMin.toLocaleString()}–${f.priceMax.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Custom landscaping package — we'll assess on-site.</p>
            )}
            {selectedItems.length > 0 && (
              <div className="border-t border-emerald-200 mt-3 pt-3 flex justify-between">
                <span className="font-bold text-gray-900">Estimated Total</span>
                <span className="font-bold text-emerald-600 text-lg">
                  ${totalMin.toLocaleString()}–${totalMax.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">
            <span className="font-medium">Property:</span> {address}
          </p>
        </div>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <button
            onClick={() => setStep('features')}
            className="text-sm text-emerald-600 hover:text-emerald-800 mb-4"
          >
            ← Back to features
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Get Your Landscape Plan</h2>
          {selectedItems.length > 0 ? (
            <p className="text-gray-500 text-sm mb-6">
              {selectedItems.length} feature{selectedItems.length > 1 ? 's' : ''} selected — estimated{' '}
              <span className="font-semibold text-emerald-600">
                ${totalMin.toLocaleString()}–${totalMax.toLocaleString()}
              </span>
            </p>
          ) : (
            <p className="text-gray-500 text-sm mb-6">We'll build a custom plan for your property.</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="(555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
              <input
                type="text"
                value={address}
                readOnly
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-600"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <p className="text-xs text-gray-400">
              By submitting, you consent to receive SMS updates about your project.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Send Me My Landscape Plan →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'scanning') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping" />
            <div className="absolute inset-2 rounded-full border-4 border-emerald-400 animate-ping animation-delay-300" />
            <div className="relative w-full h-full rounded-full bg-emerald-100 flex items-center justify-center">
              <Leaf className="w-10 h-10 text-emerald-600 animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Scanning Your Property...</h3>
          <p className="text-gray-500 text-sm">{address}</p>
          <div className="mt-4 flex gap-1 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'features') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Design Your Backyard</h2>
          <p className="text-gray-500 mt-1 text-sm">Toggle features to build your estimated project cost</p>
        </div>
        <p className="text-center text-xs text-emerald-600 font-medium mb-5">{address}</p>

        {/* Landscape image with overlaid feature badges */}
        <div className="relative rounded-2xl overflow-hidden mb-5">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
            alt="Backyard"
            className="w-full object-cover"
            style={{ maxHeight: '300px', objectPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex flex-wrap gap-2">
              {FEATURES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => toggleFeature(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    selected.has(f.id)
                      ? 'bg-emerald-500 text-white shadow-lg scale-105'
                      : 'bg-white/90 text-gray-800 hover:bg-emerald-50'
                  }`}
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Running estimate */}
        <div className="bg-emerald-50 rounded-xl p-4 mb-5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              {selectedItems.length > 0
                ? `${selectedItems.length} feature${selectedItems.length > 1 ? 's' : ''} selected`
                : 'Select features above to estimate'}
            </span>
            {selectedItems.length > 0 && (
              <span className="text-xl font-bold text-emerald-600">
                ${totalMin.toLocaleString()}–${totalMax.toLocaleString()}
              </span>
            )}
          </div>
          {selectedItems.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-1">
              {selectedItems.map((f) => (
                <div key={f.id} className="flex items-center gap-1 text-xs text-gray-600">
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setStep('form')}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Get My Free Landscape Plan →
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">Free consultation · No obligation</p>
      </div>
    );
  }

  // Step: address
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Leaf className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Visualize Your Dream Backyard</h2>
        <p className="text-gray-500 mb-8">
          Enter your address and we'll build a personalized landscaping estimate for your property.
        </p>
        <form onSubmit={handleAddressSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="123 Main St, City, State"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-4">
          Address is used only to personalize your estimate
        </p>
      </div>
    </div>
  );
}
