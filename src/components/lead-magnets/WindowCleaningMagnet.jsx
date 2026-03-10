import { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle, GripVertical } from 'lucide-react';

const WINDOW_OPTIONS = [
  { label: '5–10 windows', priceMin: 149, priceMax: 249 },
  { label: '11–20 windows', priceMin: 249, priceMax: 449 },
  { label: '21–30 windows', priceMin: 449, priceMax: 649 },
  { label: '30+ windows', priceMin: 649, priceMax: null },
];

// Before/After slider component
function BeforeAfterSlider() {
  const containerRef = useRef(null);
  const [position, setPosition] = useState(50); // percentage
  const dragging = useRef(false);

  const getPercent = useCallback((clientX) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * 100;
  }, []);

  const onMouseDown = (e) => {
    e.preventDefault();
    dragging.current = true;
  };

  const onTouchStart = (e) => {
    dragging.current = true;
  };

  useEffect(() => {
    const onMove = (clientX) => {
      if (!dragging.current || !containerRef.current) return;
      setPosition(getPercent(clientX));
    };
    const onMouseMove = (e) => onMove(e.clientX);
    const onTouchMove = (e) => {
      if (e.touches[0]) onMove(e.touches[0].clientX);
    };
    const onUp = () => { dragging.current = false; };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [getPercent]);

  // Also allow click on container
  const onContainerClick = (e) => {
    if (containerRef.current) {
      setPosition(getPercent(e.clientX));
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden cursor-col-resize select-none"
      style={{ height: '300px' }}
      onClick={onContainerClick}
    >
      {/* AFTER (clean) — base layer, full width */}
      <img
        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
        alt="Clean windows"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* BEFORE (dirty) — clipped to left side */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
          alt="Dirty windows"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: 'brightness(0.55) saturate(0.3) sepia(0.4) contrast(1.2)',
            width: `${10000 / position}%`,
            maxWidth: 'none',
          }}
          draggable={false}
        />
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-lg">
        BEFORE
      </div>
      <div className="absolute top-3 right-3 bg-sky-500 text-white text-xs font-semibold px-2 py-1 rounded-lg">
        AFTER
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl"
        style={{ left: `${position}%` }}
      />

      {/* Drag handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center cursor-col-resize z-10"
        style={{ left: `${position}%` }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-5 h-5 text-gray-500" />
      </div>
    </div>
  );
}

export default function WindowCleaningMagnet({ userId, businessName, apiUrl }) {
  const [selectedWindow, setSelectedWindow] = useState(null);
  const [step, setStep] = useState('main'); // main | form | result
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const priceDisplay = selectedWindow
    ? selectedWindow.priceMax
      ? `$${selectedWindow.priceMin}–$${selectedWindow.priceMax}`
      : `$${selectedWindow.priceMin}+`
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.phone) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!selectedWindow) {
      setError('Please select your window count.');
      return;
    }
    setSubmitting(true);
    const message = `Window count: ${selectedWindow.label} | Estimated price: ${priceDisplay}`;
    try {
      const res = await fetch(`${apiUrl}/api/leads/public/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          service: 'Window Cleaning',
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
          <CheckCircle className="w-16 h-16 text-sky-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Confirmed!</h2>
          <p className="text-gray-500 mb-6">
            We'll reach out to <span className="font-semibold text-gray-700">{form.name}</span> shortly to schedule your service.
          </p>
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-3">Your Estimate</p>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700">Windows</span>
              <span className="font-semibold text-gray-900">{selectedWindow.label}</span>
            </div>
            <div className="flex justify-between items-center border-t border-sky-200 pt-3 mt-2">
              <span className="font-bold text-gray-900">Price Range</span>
              <span className="text-2xl font-bold text-sky-600">{priceDisplay}</span>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
            <p className="text-sm font-semibold text-amber-800">Special Offer</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Book now for a <strong>FREE exterior wash</strong> with any interior package!
            </p>
          </div>
          <p className="text-sm text-gray-500">
            We'll contact you within a few hours to confirm your appointment.
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
            onClick={() => setStep('main')}
            className="text-sm text-sky-600 hover:text-sky-800 mb-4"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Get Your Free Quote</h2>
          {selectedWindow && (
            <p className="text-gray-500 text-sm mb-6">
              {selectedWindow.label} — estimated{' '}
              <span className="font-semibold text-sky-600">{priceDisplay}</span>
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <p className="text-xs text-gray-400">
              By submitting, you consent to receive SMS updates about your appointment.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Get My Free Quote →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">See the Difference</h2>
        <p className="text-gray-500 mt-1 text-sm">Drag the slider to reveal sparkling clean results</p>
      </div>

      {/* Before/After slider */}
      <BeforeAfterSlider />

      {/* Window count selector */}
      <div className="mt-6 mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">How many windows does your home have?</p>
        <div className="grid grid-cols-2 gap-3">
          {WINDOW_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setSelectedWindow(opt)}
              className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                selectedWindow?.label === opt.label
                  ? 'bg-sky-500 border-sky-500 text-white shadow-lg'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-sky-300'
              }`}
            >
              <div>{opt.label}</div>
              <div
                className={`text-xs font-normal mt-0.5 ${
                  selectedWindow?.label === opt.label ? 'text-sky-100' : 'text-gray-400'
                }`}
              >
                {opt.priceMax ? `$${opt.priceMin}–$${opt.priceMax}` : `$${opt.priceMin}+`}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bonus offer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-sm text-amber-800">
        Book now for a <strong>FREE exterior wash</strong> with any interior package!
      </div>

      <button
        onClick={() => setStep('form')}
        disabled={!selectedWindow}
        className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selectedWindow ? `Get My Quote — ${priceDisplay} →` : 'Select Window Count to Continue'}
      </button>
      <p className="text-center text-xs text-gray-400 mt-3">Free estimate · No commitment required</p>
    </div>
  );
}
