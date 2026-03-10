import { useState } from 'react';
import { AlertTriangle, Info, Shield, User, Mail, Phone, CheckCircle } from 'lucide-react';

function getPaintHealth(months) {
  if (months <= 3)  return { label: 'Good',     color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', discount: 20,  pollenPct: 10,  uvPct: 5,  oxidationPct: 5  };
  if (months <= 9)  return { label: 'Caution',  color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20',  discount: 40,  pollenPct: 35,  uvPct: 25, oxidationPct: 20 };
  if (months <= 18) return { label: 'Warning',  color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  discount: 60,  pollenPct: 65,  uvPct: 55, oxidationPct: 45 };
  return             { label: 'Critical', color: 'text-red-400',    bg: 'bg-red-500/10',     border: 'border-red-500/20',     discount: 80,  pollenPct: 90,  uvPct: 85, oxidationPct: 75 };
}

function StatBar({ label, pct, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className={`font-bold ${color}`}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: pct < 30 ? '#10b981' : pct < 60 ? '#f59e0b' : '#ef4444',
          }}
        />
      </div>
    </div>
  );
}

export default function AutoDetailingMagnet({ userId, businessName, apiUrl }) {
  const [months, setMonths] = useState(8);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const health = getPaintHealth(months);

  const degradation = Math.min(months / 24, 1);
  const imgFilter = `brightness(${1 - degradation * 0.3}) saturate(${1 - degradation * 0.55}) sepia(${degradation * 0.35}) contrast(${1 + degradation * 0.15})`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const message = `Paint health: ${health.label} | Months since detail: ${months} | Pollen: ${health.pollenPct}% | UV Damage: ${health.uvPct}% | Oxidation: ${health.oxidationPct}% | Discount: ${health.discount}% off`;
    try {
      const res = await fetch(`${apiUrl}/api/leads/public/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          service: 'Auto Detailing',
          message,
          sms_consent: true,
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-full bg-zinc-950 flex items-center justify-center py-16 px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <CheckCircle className="w-14 h-14 text-amber-400 mx-auto mb-5" />
          <h2 className="text-2xl font-bold text-white mb-2">Your Paint Report is Ready!</h2>
          <p className="text-zinc-400 mb-6">
            We'll reach out to <span className="text-white font-semibold">{form.name}</span> within a few hours.
          </p>
          <div className={`${health.bg} border ${health.border} rounded-xl p-4 mb-5 text-left space-y-2`}>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Paint Health</span>
              <span className={`font-bold ${health.color}`}>{health.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Months unprotected</span>
              <span className="text-white font-semibold">{months} months</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Pollen / Grime</span>
              <span className="text-white font-semibold">{health.pollenPct}% coverage</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">UV Damage</span>
              <span className="text-white font-semibold">{health.uvPct}%</span>
            </div>
            <div className="border-t border-zinc-700 pt-3 flex justify-between items-center">
              <span className="text-white font-bold">Urgency Discount</span>
              <span className="text-2xl font-black text-amber-400">{health.discount}% OFF</span>
            </div>
          </div>
          <p className="text-sm text-zinc-500">Expect a call or text to confirm your booking. No obligation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-950 py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-4 bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4" /> Paint Health Analyzer
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
            What's Happening to Your Paint?
          </h2>
          <p className="text-lg text-zinc-400">
            Pollen, grime, and UV rays attack your clear coat every day. Move the slider to see the invisible damage building up over time.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-start">

          {/* Interactive Visualizer */}
          <div className="mb-12 lg:mb-0">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <label className="block text-sm font-bold text-zinc-300 mb-4">
                Months since last professional detail:{' '}
                <span className={`text-xl ml-2 ${health.color}`}>{months}{months === 24 ? '+' : ''}</span>
              </label>
              <input
                type="range" min="1" max="24" value={months}
                onChange={(e) => setMonths(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mb-8"
              />

              <div className="relative rounded-xl overflow-hidden aspect-video mb-6 bg-zinc-800 ring-1 ring-white/10">
                <img
                  src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&auto=format&fit=crop&q=80"
                  alt="Car paint condition"
                  className="w-full h-full object-cover transition-all duration-700"
                  style={{ filter: imgFilter }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-5">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold mb-1">Paint Health</p>
                      <p className={`text-2xl font-black uppercase ${health.color}`}>{health.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold mb-1">Your Discount</p>
                      <p className="text-2xl font-black text-amber-400">{health.discount}% OFF</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <StatBar label="Pollen & Grime Coverage" pct={health.pollenPct} color={health.color} />
                <StatBar label="UV Damage Severity" pct={health.uvPct} color={health.color} />
                <StatBar label="Clear Coat Oxidation" pct={health.oxidationPct} color={health.color} />
              </div>

              <div className={`flex items-start gap-3 p-4 ${health.bg} border ${health.border} rounded-xl text-sm`}>
                <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                <p className="text-zinc-300">
                  At {months} month{months > 1 ? 's' : ''}, pollen acid and UV rays have begun{' '}
                  {months > 18 ? <strong className="text-red-300">permanently etching</strong> : months > 9 ? 'visibly dulling' : 'lightly affecting'}{' '}
                  your clear coat. {months > 12 && 'Without treatment, this damage becomes irreversible.'}
                </p>
              </div>
            </div>
          </div>

          {/* Lead Capture — always visible */}
          <div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 lg:p-10">
              <h3 className="text-3xl font-bold text-white mb-2">Claim Your {health.discount}% Discount</h3>
              <p className={`text-sm font-semibold ${health.color} mb-6`}>
                Paint Status: {health.label} · {months} month{months !== 1 ? 's' : ''} since last detail
              </p>

              <div className={`flex items-center justify-between p-4 ${health.bg} border ${health.border} rounded-2xl mb-7`}>
                <div>
                  <p className="text-sm font-semibold text-zinc-300">Your urgency discount</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Based on {months} months unprotected</p>
                </div>
                <div className={`text-4xl font-black ${health.color}`}>{health.discount}%<span className="text-xl"> OFF</span></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input type="text" placeholder="Your Name" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                    required />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input type="email" placeholder="Email Address" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                    required />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input type="tel" placeholder="Phone Number" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                    required />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <p className="text-xs text-zinc-600">By submitting, you consent to receive SMS updates about your appointment.</p>
                <button type="submit" disabled={submitting}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 rounded-xl font-bold transition-all shadow-lg text-lg mt-2">
                  {submitting ? 'Sending...' : `Lock In My ${health.discount}% Discount →`}
                </button>
              </form>
              <p className="text-xs text-zinc-600 mt-4 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> No commitment · Free inspection included
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
