import { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle, GripVertical, AlertTriangle, Info, Shield, User, Mail, Phone } from 'lucide-react';

function getEtchingInfo(months) {
  if (months <= 2)  return { label: 'Light Spots',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', etched: false, spotsPct: 15,  haze: 10,  permanent: 0  };
  if (months <= 6)  return { label: 'Moderate Stains', color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20',  etched: false, spotsPct: 45,  haze: 35,  permanent: 5  };
  if (months <= 12) return { label: 'Heavy Buildup',   color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  etched: true,  spotsPct: 75,  haze: 65,  permanent: 30 };
  return             { label: 'Permanent Etching', color: 'text-red-400',    bg: 'bg-red-500/10',     border: 'border-red-500/20',     etched: true,  spotsPct: 95,  haze: 88,  permanent: 70 };
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
            background: pct < 30 ? '#10b981' : pct < 65 ? '#f59e0b' : '#ef4444',
          }}
        />
      </div>
    </div>
  );
}

function BeforeAfterSlider({ months }) {
  const containerRef = useRef(null);
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);

  const getPercent = useCallback((clientX) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * 100;
  }, []);

  const onMouseDown = (e) => { e.preventDefault(); dragging.current = true; };
  const onTouchStart = () => { dragging.current = true; };

  useEffect(() => {
    const onMove = (clientX) => {
      if (!dragging.current || !containerRef.current) return;
      setPosition(getPercent(clientX));
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', (e) => onMove(e.clientX));
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', (e) => { if (e.touches[0]) onMove(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', (e) => onMove(e.clientX));
      window.removeEventListener('mouseup', onUp);
    };
  }, [getPercent]);

  const degradation = Math.min(months / 14, 1);
  const dirtyFilter = `brightness(${0.65 - degradation * 0.15}) saturate(${0.35 - degradation * 0.2}) sepia(${0.3 + degradation * 0.4}) contrast(${1.1 + degradation * 0.2}) blur(${degradation * 1.5}px)`;

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden cursor-col-resize select-none ring-1 ring-white/10 shadow-2xl"
      style={{ height: '280px' }}
      onClick={(e) => { if (containerRef.current) setPosition(getPercent(e.clientX)); }}
    >
      {/* AFTER — clean */}
      <img
        src="https://images.unsplash.com/photo-1503708928676-1cb796a0891e?auto=format&fit=crop&q=80&w=1200"
        alt="Clean windows"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute top-3 right-3 bg-sky-500 text-white text-xs font-bold px-2 py-1 rounded-lg z-10">AFTER</div>

      {/* BEFORE — dirty/etched */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img
          src="https://images.unsplash.com/photo-1503708928676-1cb796a0891e?auto=format&fit=crop&q=80&w=1200"
          alt="Hard water stained windows"
          className="absolute inset-0 h-full object-cover max-w-none"
          style={{ width: `${10000 / Math.max(position, 1)}%`, filter: dirtyFilter }}
          draggable={false}
        />
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(ellipse 8px 5px at 20% 30%, rgba(255,255,255,${0.08 + degradation * 0.12}) 0%, transparent 100%),
              radial-gradient(ellipse 12px 8px at 55% 60%, rgba(255,255,255,${0.06 + degradation * 0.1}) 0%, transparent 100%),
              radial-gradient(ellipse 6px 4px at 75% 25%, rgba(255,255,255,${0.1 + degradation * 0.15}) 0%, transparent 100%),
              radial-gradient(ellipse 10px 6px at 35% 75%, rgba(255,255,255,${0.07 + degradation * 0.1}) 0%, transparent 100%)`,
          }}
        />
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg">BEFORE</div>
      </div>

      {/* Slider line */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl z-10" style={{ left: `${position}%` }} />

      {/* Handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center cursor-col-resize z-20"
        style={{ left: `${position}%` }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-5 h-5 text-slate-700" />
      </div>
    </div>
  );
}

export default function WindowCleaningMagnet({ userId, businessName, apiUrl }) {
  const [months, setMonths] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const info = getEtchingInfo(months);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const message = `Window condition: ${info.label} | Months: ${months} | Hard water spots: ${info.spotsPct}% | Haze: ${info.haze}% | Permanent etching risk: ${info.permanent}%`;
    try {
      const res = await fetch(`${apiUrl}/api/leads/public/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone,
          service: 'Window Cleaning', message, sms_consent: true,
        }),
      });
      if (!res.ok) throw new Error('failed');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-full bg-slate-950 flex items-center justify-center py-16 px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <CheckCircle className="w-14 h-14 text-sky-400 mx-auto mb-5" />
          <h2 className="text-2xl font-bold text-white mb-2">Quote Confirmed!</h2>
          <p className="text-slate-400 mb-6">We'll reach out to <span className="text-white font-semibold">{form.name}</span> within a few hours.</p>
          <div className={`${info.bg} border ${info.border} rounded-xl p-4 text-left space-y-2`}>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Window Condition</span>
              <span className={`font-bold ${info.color}`}>{info.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Months untreated</span>
              <span className="text-white font-semibold">{months} months</span>
            </div>
            {info.permanent > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Permanent etching risk</span>
                <span className="text-red-400 font-semibold">{info.permanent}%</span>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-5">Expect a call or text to confirm your appointment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950 py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-4 bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <AlertTriangle className="w-4 h-4" /> Glass Damage Analyzer
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Hard Water is Etching Your Glass
          </h2>
          <p className="text-lg text-slate-400">
            Mineral deposits from rain and sprinklers don't just look bad — they physically etch into the glass surface and become <strong className="text-white">permanent</strong> if left untreated. See the damage building up over time.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-start">

          {/* Interactive Visualizer */}
          <div className="mb-12 lg:mb-0">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <label className="block text-sm font-bold text-slate-300 mb-4">
                Months without professional cleaning:{' '}
                <span className={`text-xl ml-2 ${info.color}`}>{months}{months === 18 ? '+' : ''}</span>
              </label>
              <input
                type="range" min="1" max="18" value={months}
                onChange={(e) => setMonths(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 mb-8"
              />

              <div className="mb-2">
                <p className="text-xs text-slate-500 text-center mb-2">← Drag to reveal clean view</p>
                <BeforeAfterSlider months={months} />
              </div>

              <div className="space-y-3 mb-5 mt-6">
                <StatBar label="Hard Water Spot Coverage" pct={info.spotsPct} color={info.color} />
                <StatBar label="Glass Haze & Cloudiness" pct={info.haze} color={info.color} />
                <StatBar label="Permanent Etching Risk" pct={info.permanent} color={info.color} />
              </div>

              {info.etched ? (
                <div className={`flex items-start gap-3 p-4 ${info.bg} border ${info.border} rounded-xl text-sm`}>
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                  <p className="text-slate-300">
                    At {months} months, calcium and magnesium deposits have begun <strong className="text-red-300">chemically bonding with the glass silica</strong>. Standard cleaning will not remove them. Professional restoration or glass replacement may be required.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sm">
                  <Info className="w-5 h-5 shrink-0 mt-0.5 text-sky-400" />
                  <p className="text-slate-300">
                    At {months} months, mineral stains are still removable with professional treatment. Act before they etch permanently into the glass.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lead Capture — always visible */}
          <div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 lg:p-10">
              <h3 className="text-3xl font-bold text-white mb-2">Get a Crystal Clear Quote</h3>
              <p className={`text-sm font-semibold ${info.color} mb-6`}>
                Window Status: {info.label} · {months} month{months !== 1 ? 's' : ''} untreated
              </p>

              <p className="text-slate-400 mb-7">
                Hard water stains block up to <strong className="text-white">30% of natural sunlight</strong> and permanently etch glass within months. Get your free quote below.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input type="text" placeholder="Your Name" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors" required />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input type="email" placeholder="Email Address" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors" required />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input type="tel" placeholder="Phone Number" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors" required />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <p className="text-xs text-slate-600">By submitting, you consent to receive SMS updates about your appointment.</p>
                <button type="submit" disabled={submitting}
                  className="w-full py-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white rounded-xl font-bold transition-all shadow-lg text-lg">
                  {submitting ? 'Sending...' : 'Reveal My Pricing →'}
                </button>
              </form>
              <div className="mt-5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300">
                🎁 <strong>Free bonus:</strong> Exterior squeegee wash included with any interior package booked this week.
              </div>
              <p className="text-xs text-slate-600 mt-3 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> No commitment · Instant estimate
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
