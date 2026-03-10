import { useState } from 'react';
import { CheckCircle, ChevronRight, Car } from 'lucide-react';

const HOTSPOTS = [
  {
    id: 'paint',
    label: 'Paint Correction & Ceramic',
    description: 'Multi-stage paint correction with ceramic coating protection.',
    top: '18%',
    left: '52%',
    priceMin: 299,
    priceMax: 599,
  },
  {
    id: 'wheels',
    label: 'Wheel & Caliper Detail',
    description: 'Deep clean, decontamination, and caliper color coating.',
    top: '68%',
    left: '22%',
    priceMin: 79,
    priceMax: 149,
  },
  {
    id: 'glass',
    label: 'Glass Polishing',
    description: 'Remove water spots, haze, and apply rain-repellent treatment.',
    top: '25%',
    left: '30%',
    priceMin: 99,
    priceMax: 179,
  },
  {
    id: 'interior',
    label: 'Interior Restoration',
    description: 'Deep steam clean, leather conditioning, and odor elimination.',
    top: '38%',
    left: '68%',
    priceMin: 199,
    priceMax: 399,
  },
];

export default function AutoDetailingMagnet({ userId, businessName, apiUrl }) {
  const [selected, setSelected] = useState(new Set());
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [step, setStep] = useState('hotspots'); // hotspots | form | result
  const [form, setForm] = useState({ vehicle: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleHotspot = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedItems = HOTSPOTS.filter((h) => selected.has(h.id));
  const totalMin = selectedItems.reduce((s, h) => s + h.priceMin, 0);
  const totalMax = selectedItems.reduce((s, h) => s + h.priceMax, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.vehicle || !form.email) {
      setError('Please fill in your vehicle and email.');
      return;
    }
    setSubmitting(true);
    const services = selectedItems.map((h) => h.label).join(', ') || 'General detail inquiry';
    const message = `Selected services: ${services} | Estimated Range: $${totalMin}–$${totalMax} | Vehicle: ${form.vehicle}`;
    try {
      const res = await fetch(`${apiUrl}/api/leads/public/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.vehicle,
          email: form.email,
          phone: form.phone || '0000000000',
          service: 'Auto Detailing',
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
          <CheckCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Quote is Ready!</h2>
          <p className="text-gray-500 mb-6">
            We'll send your detailed quote to <span className="font-semibold text-gray-700">{form.email}</span>
          </p>
          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Selected Services</p>
            {selectedItems.length > 0 ? (
              <ul className="space-y-2">
                {selectedItems.map((h) => (
                  <li key={h.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{h.label}</span>
                    <span className="font-semibold text-gray-900">${h.priceMin}–${h.priceMax}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Full detail package — our team will assess on-site.</p>
            )}
            <div className="border-t border-blue-200 mt-3 pt-3 flex justify-between">
              <span className="font-bold text-gray-900">Estimated Total</span>
              <span className="font-bold text-blue-600 text-lg">${totalMin}–${totalMax}</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">Expect a call or text within 24 hours to confirm your appointment.</p>
        </div>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <button
            onClick={() => setStep('hotspots')}
            className="text-sm text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1"
          >
            ← Back to services
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Get Your Quote</h2>
          {selectedItems.length > 0 ? (
            <p className="text-gray-500 text-sm mb-6">
              {selectedItems.length} service{selectedItems.length > 1 ? 's' : ''} selected — estimated{' '}
              <span className="font-semibold text-blue-600">${totalMin}–${totalMax}</span>
            </p>
          ) : (
            <p className="text-gray-500 text-sm mb-6">We'll put together a custom quote for you.</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Make &amp; Model</label>
              <input
                type="text"
                placeholder="e.g. 2021 Honda Accord"
                value={form.vehicle}
                onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                placeholder="(555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <p className="text-xs text-gray-400">
              By submitting, you consent to receive SMS updates about your quote.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Get My Quote →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Build Your Detail Package</h2>
        <p className="text-gray-500 mt-1 text-sm">Tap the hotspots on the car to select services</p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>{selected.size} of 4 areas selected</span>
          {selected.size > 0 && (
            <span className="font-semibold text-blue-600">${totalMin}–${totalMax}</span>
          )}
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(selected.size / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Car image with hotspots */}
      <div className="relative rounded-2xl overflow-hidden bg-gray-900 select-none">
        <img
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80"
          alt="Car"
          className="w-full object-cover"
          style={{ maxHeight: '360px', objectPosition: 'center' }}
          draggable={false}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {HOTSPOTS.map((h) => (
          <div
            key={h.id}
            className="absolute"
            style={{ top: h.top, left: h.left, transform: 'translate(-50%, -50%)' }}
          >
            {/* Tooltip */}
            {activeTooltip === h.id && (
              <div
                className="absolute z-20 bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white text-gray-900 rounded-xl shadow-2xl p-3 w-48 text-center"
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <p className="font-semibold text-sm">{h.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{h.description}</p>
                <p className="text-blue-600 font-bold text-sm mt-1">${h.priceMin}–${h.priceMax}</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
              </div>
            )}
            {/* Pulsing dot */}
            <button
              onClick={() => {
                toggleHotspot(h.id);
                setActiveTooltip(activeTooltip === h.id ? null : h.id);
              }}
              onMouseEnter={() => setActiveTooltip(h.id)}
              onMouseLeave={() => setActiveTooltip(null)}
              className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none ${
                selected.has(h.id)
                  ? 'bg-blue-600 shadow-lg shadow-blue-500/50 scale-110'
                  : 'bg-white/90 hover:bg-blue-100'
              }`}
            >
              {selected.has(h.id) ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <span className="w-3 h-3 rounded-full bg-blue-600" />
              )}
              {/* Pulse ring */}
              {!selected.has(h.id) && (
                <span className="absolute inset-0 rounded-full bg-blue-400 opacity-40 animate-ping" />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Selected services list */}
      {selected.size > 0 && (
        <div className="mt-5 bg-blue-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Selected</p>
          <ul className="space-y-1">
            {selectedItems.map((h) => (
              <li key={h.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{h.label}</span>
                <span className="font-medium text-gray-900">${h.priceMin}–${h.priceMax}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => setStep('form')}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        {selected.size === 0 ? 'Request a Quote' : 'Get My Quote'}
        <ChevronRight className="w-5 h-5" />
      </button>
      <p className="text-center text-xs text-gray-400 mt-3">
        Select 0–4 services · Free estimate · No obligation
      </p>
    </div>
  );
}
