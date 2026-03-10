import { useState } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, ShieldCheck } from 'lucide-react';

function getHealthInfo(months) {
  if (months < 6) return { label: 'Good', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', Icon: ShieldCheck, iconColor: 'text-green-500', filterIntensity: 0 };
  if (months < 12) return { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', Icon: AlertTriangle, iconColor: 'text-yellow-500', filterIntensity: 0.3 };
  if (months < 24) return { label: 'Warning', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', Icon: AlertTriangle, iconColor: 'text-orange-500', filterIntensity: 0.6 };
  return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', Icon: AlertCircle, iconColor: 'text-red-500', filterIntensity: 1 };
}

function getDiscount(months) {
  if (months < 6) return 25;
  if (months < 12) return 40;
  if (months < 24) return 60;
  return 75;
}

const ROOMS_OPTIONS = ['1–2 rooms', '3–4 rooms', '5+ rooms'];

export default function CarpetCleaningMagnet({ userId, businessName, apiUrl }) {
  const [months, setMonths] = useState(12);
  const [step, setStep] = useState('calculator'); // calculator | form | result
  const [form, setForm] = useState({ name: '', email: '', phone: '', rooms: '1–2 rooms' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const health = getHealthInfo(months);
  const discount = getDiscount(months);
  const dustMites = Math.min(months * 150000, 2000000).toLocaleString();
  const deadSkin = (months * 0.5).toFixed(1);

  // CSS filter: sepia + brightness darkness increases with months
  const filterIntensity = health.filterIntensity;
  const imgFilter = `sepia(${filterIntensity * 60}%) brightness(${1 - filterIntensity * 0.35}) saturate(${1 - filterIntensity * 0.5})`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.phone) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    const message = `Carpet health: ${health.label} | Months since cleaning: ${months} | Rooms: ${form.rooms} | Discount earned: $${discount} off`;
    try {
      const res = await fetch(`${apiUrl}/api/leads/public/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          service: 'Carpet Cleaning',
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
    const { label, color, bg, border, Icon } = health;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Carpet Report</h2>
          <p className="text-gray-500 mb-6">
            We'll reach out to <span className="font-semibold text-gray-700">{form.name}</span> to schedule your cleaning.
          </p>
          <div className={`${bg} border ${border} rounded-xl p-4 mb-5 text-left`}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-5 h-5 ${health.iconColor}`} />
              <span className={`font-bold text-lg ${color}`}>{label} — Action Required</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex justify-between"><span>Months since cleaning</span><span className="font-semibold">{months} months</span></li>
              <li className="flex justify-between"><span>Estimated dust mites</span><span className="font-semibold">{dustMites}</span></li>
              <li className="flex justify-between"><span>Dead skin buildup</span><span className="font-semibold">{deadSkin} lbs</span></li>
              <li className="flex justify-between"><span>Rooms scheduled</span><span className="font-semibold">{form.rooms}</span></li>
            </ul>
            <div className="border-t mt-3 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Your Discount</span>
                <span className="text-2xl font-bold text-purple-600">${discount} OFF</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Applied automatically to your cleaning appointment</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Expect a call or text within a few hours to confirm your booking.</p>
        </div>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <button
            onClick={() => setStep('calculator')}
            className="text-sm text-purple-600 hover:text-purple-800 mb-4"
          >
            ← Back to calculator
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Claim Your ${discount} Discount</h2>
          <p className={`text-sm font-semibold ${health.color} mb-6`}>
            Carpet Health: {health.label} · {months} months since last cleaning
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Rooms</label>
              <select
                value={form.rooms}
                onChange={(e) => setForm({ ...form, rooms: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {ROOMS_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <p className="text-xs text-gray-400">
              By submitting, you consent to receive SMS updates about your appointment.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {submitting ? 'Sending...' : `Claim My $${discount} Discount →`}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { label, color, bg, border, Icon, iconColor } = health;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Carpet Grime Calculator</h2>
        <p className="text-gray-500 mt-1 text-sm">See what's hiding in your carpet right now</p>
      </div>

      {/* Carpet image with filter */}
      <div className="relative rounded-2xl overflow-hidden mb-6">
        <img
          src="https://images.unsplash.com/photo-1558618047-f18c8def4765?w=800&q=80"
          alt="Carpet"
          className="w-full object-cover transition-all duration-700"
          style={{ maxHeight: '260px', objectPosition: 'center', filter: imgFilter }}
        />
        {/* Health badge overlay */}
        <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow ${bg} border ${border}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span className={`text-sm font-bold ${color}`}>{label}</span>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-semibold text-gray-700">
            Months since last professional cleaning
          </label>
          <span className="text-2xl font-bold text-purple-600">{months}</span>
        </div>
        <input
          type="range"
          min={1}
          max={36}
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="w-full accent-purple-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 month</span>
          <span>3 years</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className={`${bg} border ${border} rounded-xl p-3 text-center`}>
          <p className="text-xs text-gray-500 mb-1">Health Status</p>
          <p className={`text-lg font-bold ${color}`}>{label}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Dust Mites</p>
          <p className="text-sm font-bold text-gray-800">{dustMites}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Dead Skin</p>
          <p className="text-sm font-bold text-gray-800">{deadSkin} lbs</p>
        </div>
      </div>

      {/* Discount callout */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-purple-800">Your urgency discount</p>
          <p className="text-xs text-purple-600 mt-0.5">Book now to lock in your savings</p>
        </div>
        <div className="text-3xl font-black text-purple-600">${discount} OFF</div>
      </div>

      <button
        onClick={() => setStep('form')}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Claim My ${discount} Discount →
      </button>
      <p className="text-center text-xs text-gray-400 mt-3">No commitment required · Discount applied at booking</p>
    </div>
  );
}
