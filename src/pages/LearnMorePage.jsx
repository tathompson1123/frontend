import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Play, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, Check, Loader2, Star,
  MessageCircle, Globe, Repeat, Users, TrendingUp, Award, CheckCircle2, XCircle, Calendar,
} from 'lucide-react';
import bookingAgentImg from '../assets/learnmore/booking-agent.png';
import smsWinbackImg from '../assets/learnmore/sms-winback.png';
import googleReviewImg from '../assets/learnmore/google-review.png';
import testimonial1Img from '../assets/learnmore/testimonial-1.png';
import testimonial2Img from '../assets/learnmore/testimonial-2.png';
import testimonial3Img from '../assets/learnmore/testimonial-3.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const BUSINESS_TYPES = [
  'Landscaping', 'Auto Detailing', 'HVAC', 'Plumbing', 'Electrical',
  'Roofing', 'Cleaning', 'Pest Control', 'Pressure Washing', 'Other',
];

const STRUGGLES = [
  'Not enough leads', 'Inconsistent bookings', 'Growing too slowly',
  'Weak online reviews', "Website doesn't convert", 'Too much manual admin work', 'Other',
];

const REVENUE_BANDS = [
  'Under $10k/mo', '$10k – $20k/mo', '$20k – $50k/mo', '$50k – $100k/mo', '$100k+/mo',
];

const TOTAL_STEPS = 4;

// ── Video placeholder — swap `src` for a real file/embed when it's ready ─────
// Kept dark regardless of page theme: video thumbnails read as a screen, and a
// dark frame is what makes the play button pop against a light page.
function VideoPlaceholder({ label, aspect = 'aspect-video', className = '' }) {
  return (
    <div className={`relative ${aspect} w-full rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl overflow-hidden flex items-center justify-center group cursor-pointer ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,111,81,0.2),transparent_60%)]" />
      <div className="relative flex flex-col items-center gap-3 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center group-hover:bg-primary-600/80 transition">
          <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
        </div>
        <p className="text-xs font-medium text-white/50 uppercase tracking-wide">Video placeholder</p>
        <p className="text-sm text-white/70 max-w-[220px]">{label}</p>
      </div>
    </div>
  );
}

// Hand-drawn style curvy arrow, pointing from a caption down into the video below it.
function CurvyArrow({ className }) {
  return (
    <svg viewBox="0 0 80 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 6 C 62 16, 4 46, 46 58 C 60 65, 38 76, 40 90"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M27 80 L40 92 L51 78"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// Embedded calendar + slot picker for the quiz's success step. Mirrors BookCallPage's
// calendar, but skips re-asking for name/email/phone — the quiz already has them — and
// books straight from a slot tap. Hits the same /api/public/discovery/* endpoints, so
// a booking here creates the real Zoom meeting and merges into the sorce_leads row the
// quiz submission already created (matched by email/phone), same as BookCallPage.
function DiscoveryBookingCalendar({ prefill, onBooked }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [chosen, setChosen] = useState(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  const loadSlots = useCallback(async (date) => {
    setLoadingSlots(true);
    setSlots([]);
    setChosen(null);
    try {
      const res = await fetch(`${API_URL}/api/public/discovery/slots?date=${ymd(date)}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) loadSlots(selectedDate);
  }, [selectedDate, loadSlots]);

  const grid = (() => {
    const first = startOfMonth(month);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells = Array.from({ length: first.getDay() }, () => null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    return cells;
  })();

  const confirmBooking = async () => {
    if (!chosen) return;
    setBooking(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/public/discovery/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prefill.name, email: prefill.email, phone: prefill.phone,
          scheduledAt: chosen.iso,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not book that call');
      onBooked(chosen.iso);
    } catch (err) {
      setError(err.message);
      if (selectedDate) loadSlots(selectedDate);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-bold text-gray-900 text-sm">
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {grid.map((day, i) => {
          if (!day) return <div key={i} />;
          const past = day < new Date(new Date().setHours(0, 0, 0, 0));
          const isSelected = selectedDate && sameDay(day, selectedDate);
          return (
            <button
              key={i}
              disabled={past}
              onClick={() => setSelectedDate(day)}
              className={`aspect-square rounded-lg text-sm font-medium transition ${
                isSelected ? 'bg-amber-600 text-white'
                : past ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-amber-50 hover:text-amber-700'
              }`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        {!selectedDate ? (
          <p className="text-sm text-gray-400 text-center py-3 flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" /> Pick a day to see available times
          </p>
        ) : loadingSlots ? (
          <div className="flex justify-center py-3"><Loader2 className="w-5 h-5 animate-spin text-amber-600" /></div>
        ) : slots.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-3">Nothing free that day — try another.</p>
        ) : (
          <>
            <p className="text-xs font-semibold text-gray-600 mb-2">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto">
              {slots.map(slot => (
                <button
                  key={slot.iso}
                  onClick={() => setChosen(slot)}
                  className={`py-2 rounded-lg text-sm font-medium border-2 transition ${
                    chosen?.iso === slot.iso
                      ? 'border-amber-600 bg-amber-600 text-white'
                      : 'border-gray-200 text-gray-700 hover:border-amber-400'
                  }`}
                >
                  {new Date(slot.iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mt-3">{error}</div>
      )}

      <button
        onClick={confirmBooking}
        disabled={!chosen || booking}
        className="w-full mt-4 py-3.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {booking
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Booking...</>
          : <>Confirm my call <Check className="w-4 h-4" /></>}
      </button>
    </div>
  );
}

function QuizModal({ open, onClose }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    businessType: '', businessTypeOther: '',
    struggle: '', struggleOther: '',
    revenue: '',
    name: '', email: '', phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [callBooked, setCallBooked] = useState(null);

  if (!open) return null;

  const reset = () => {
    setStep(0);
    setForm({ businessType: '', businessTypeOther: '', struggle: '', struggleOther: '', revenue: '', name: '', email: '', phone: '' });
    setError('');
    setDone(false);
    setCallBooked(null);
  };

  const close = () => { reset(); onClose(); };

  const canAdvance = () => {
    if (step === 0) return form.businessType && (form.businessType !== 'Other' || form.businessTypeOther.trim());
    if (step === 1) return form.struggle && (form.struggle !== 'Other' || form.struggleOther.trim());
    if (step === 2) return !!form.revenue;
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Please fill in your name, email and phone.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/public/discovery/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone,
          businessType: form.businessType === 'Other' ? form.businessTypeOther : form.businessType,
          struggle: form.struggle === 'Other' ? form.struggleOther : form.struggle,
          revenue: form.revenue,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong — please try again.');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={close}>
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full overflow-hidden transition-all ${done && !callBooked ? 'max-w-xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {!done && (
          <div className="flex items-center gap-2 px-6 pt-6">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= step ? 'bg-amber-500' : 'bg-gray-150 bg-gray-200'}`} />
            ))}
          </div>
        )}

        <div className="p-6 sm:p-8">
          {done ? (
            callBooked ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">You're booked in!</h3>
                <p className="text-gray-600 mb-6">
                  {new Date(callBooked).toLocaleString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                  <br />
                  We'll text your Zoom link to {form.phone} and email the details to {form.email}.
                </p>
                <button
                  onClick={close}
                  className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="text-center mb-5">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">You're qualified — grab a time 🎉</h3>
                  <p className="text-sm text-gray-500">Pick a day and time below to lock in your free call.</p>
                </div>
                <DiscoveryBookingCalendar
                  prefill={{ name: form.name, email: form.email, phone: form.phone }}
                  onBooked={(iso) => setCallBooked(iso)}
                />
                <button
                  onClick={close}
                  className="w-full mt-3 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition"
                >
                  I'll wait to hear from you instead
                </button>
              </div>
            )
          ) : (
            <>
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-4 -ml-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}

              {step === 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">What service business work do you do?</h3>
                  <p className="text-sm text-gray-500 mb-5">Pick the closest match.</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {BUSINESS_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setForm((f) => ({ ...f, businessType: t }))}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border-2 text-left transition ${
                          form.businessType === t
                            ? 'border-amber-500 bg-amber-50 text-amber-800'
                            : 'border-gray-200 text-gray-700 hover:border-amber-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {form.businessType === 'Other' && (
                    <input
                      autoFocus
                      value={form.businessTypeOther}
                      onChange={(e) => setForm((f) => ({ ...f, businessTypeOther: e.target.value }))}
                      placeholder="Tell us what you do"
                      className="mt-3 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-sm"
                    />
                  )}
                </div>
              )}

              {step === 1 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">What are you currently struggling with?</h3>
                  <p className="text-sm text-gray-500 mb-5">What's the biggest bottleneck right now?</p>
                  <div className="flex flex-col gap-2.5">
                    {STRUGGLES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setForm((f) => ({ ...f, struggle: t }))}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border-2 text-left transition ${
                          form.struggle === t
                            ? 'border-amber-500 bg-amber-50 text-amber-800'
                            : 'border-gray-200 text-gray-700 hover:border-amber-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {form.struggle === 'Other' && (
                    <input
                      autoFocus
                      value={form.struggleOther}
                      onChange={(e) => setForm((f) => ({ ...f, struggleOther: e.target.value }))}
                      placeholder="What's holding you back?"
                      className="mt-3 w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-sm"
                    />
                  )}
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">What's your monthly revenue?</h3>
                  <p className="text-sm text-gray-500 mb-5">Just a ballpark — this stays private.</p>
                  <div className="flex flex-col gap-2.5">
                    {REVENUE_BANDS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setForm((f) => ({ ...f, revenue: t }))}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border-2 text-left transition ${
                          form.revenue === t
                            ? 'border-amber-500 bg-amber-50 text-amber-800'
                            : 'border-gray-200 text-gray-700 hover:border-amber-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <form onSubmit={submit}>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">You're qualified — we can help! 🎉</h3>
                  <p className="text-sm text-gray-500 mb-5">
                    Book a call to see if we're the right partner to help you grow.
                  </p>
                  <div className="space-y-3">
                    <input
                      required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-sm"
                    />
                    <input
                      required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="Email address"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-sm"
                    />
                    <input
                      required type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="Phone number"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-sm"
                    />
                  </div>

                  <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                    By submitting, you agree to be contacted by SORCE about your results — including by text.
                    Message and data rates may apply. Reply STOP to opt out. See our{' '}
                    <a href="/terms" className="underline hover:text-gray-600">Terms</a> and{' '}
                    <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>.
                  </p>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mt-3">{error}</div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 py-3.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                      : <>Get My Free Consultation <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}

              {step < 3 && (
                <button
                  onClick={() => canAdvance() && setStep((s) => s + 1)}
                  disabled={!canAdvance()}
                  className="w-full mt-6 py-3.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const TESTIMONIAL_PLACEHOLDERS = [
  { name: 'Add customer name', business: 'Add business type' },
  { name: 'Add customer name', business: 'Add business type' },
  { name: 'Add customer name', business: 'Add business type' },
];

const HOW_IT_WORKS = [
  {
    icon: Globe,
    title: 'A website that actually converts',
    body: 'Visitors land on a fast, mobile-ready site with AI chat and smart forms built to turn traffic into booked jobs — not just page views.',
    image: bookingAgentImg,
  },
  {
    icon: MessageCircle,
    title: 'Win back past customers, automatically',
    body: 'An automatic text goes out with a personal offer, and when they reply, it\'s already booked — no manual outreach needed.',
    image: smsWinbackImg,
  },
  {
    icon: Award,
    title: '5-star reviews, on autopilot',
    body: 'A review request goes out after every job automatically, building the reputation that gets you picked over the competition.',
    image: googleReviewImg,
  },
];

// ── Placeholder social proof photos — swap for real customer photos later ────
const SOCIAL_PROOF_PHOTOS = [
  { image: testimonial1Img, caption: 'Add a customer photo' },
  { image: testimonial2Img, caption: 'Add a customer photo' },
  { image: testimonial3Img, caption: 'Add a customer photo' },
];

const GOOD_FIT = [
  'Already getting some jobs, but following up is eating your time',
  'Doing $10k/mo or more and ready to systemize growth',
  'Willing to let a system handle the busywork so you can run the business',
];

const NOT_A_FIT = [
  'Pre-revenue or just getting started',
  'Not ready to change how leads get handled day to day',
  'Looking for a one-time fix, not an ongoing system',
];

const FAQ_ITEMS = [
  {
    q: 'What exactly is included?',
    a: 'A converting website with AI chat, instant lead follow-up by text, automated review requests after every job, and a dashboard to manage all of it from one place.',
  },
  {
    q: 'How fast will I see results?',
    a: "Most businesses start seeing more booked jobs within the first few weeks, once leads are flowing through the system instead of sitting in a missed-call voicemail.",
  },
  {
    q: 'Is this right for my business size?',
    a: "Built for home service and local service businesses typically doing $10k–$100k+/mo who are ready to stop manually chasing every lead.",
  },
  {
    q: 'How much does it cost?',
    a: "It depends on your business and what you need automated — that's exactly what the free call is for. No pressure, no obligation.",
  },
];

function FaqAccordionItem({ item, open, onToggle }) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-semibold text-gray-900">{item.q}</span>
        <ChevronDown className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="text-gray-600 text-sm leading-relaxed pb-5 pr-8">{item.a}</p>
      )}
    </div>
  );
}

export default function LearnMorePage() {
  const [quizOpen, setQuizOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] max-w-4xl mx-auto mb-6 text-gray-900 tracking-tight">
          Stop spending more on ads.
          <br />
          Start building a recurring revenue system.
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-2">
          You can double your revenue without spending a dime on ads.
        </p>
        <span className="block text-2xl text-gray-900 mb-1" style={{ fontFamily: "'Caveat', cursive" }}>
          Watch here to learn how
        </span>
        <CurvyArrow className="mx-auto w-14 h-16 text-gray-400 mb-4" />

        <VideoPlaceholder label="Drop in your main demo / VSL video here" className="max-w-3xl mx-auto" />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 mb-4">
          <button
            onClick={() => setQuizOpen(true)}
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition flex items-center gap-2"
          >
            See If We're a Fit <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500">60-second quiz · No commitment</p>
      </section>

      {/* Social proof photo strip */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wide mb-8">What people are saying</p>
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
            {SOCIAL_PROOF_PHOTOS.map((p, i) => (
              <div key={i} className="text-center">
                <img
                  src={p.image}
                  alt={p.caption}
                  className="w-full aspect-square object-cover rounded-2xl shadow-md mb-2"
                />
                <p className="text-[11px] text-gray-400">{p.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — numbered benefit cards */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-2 text-gray-900">What you get with SORCE</h2>
        <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
          Three systems running quietly in the background of your business, every single day.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map(({ icon: Icon, title, body, image }, i) => (
            <div key={title} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <div className="relative">
                <img src={image} alt={title} className="w-full aspect-video object-cover" />
                <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-gray-900/80 backdrop-blur text-white font-bold flex items-center justify-center text-sm">
                  {i + 1}
                </div>
              </div>
              <div className="p-7">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center mb-5 -mt-16 relative shadow-lg border-4 border-white">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <button
            onClick={() => setQuizOpen(true)}
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-bold hover:shadow-xl transition inline-flex items-center gap-2"
          >
            See If We're a Fit <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Video testimonials */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-2 text-gray-900">What Business Owners Are Saying</h2>
        <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
          Swap these placeholders for real customer video testimonials.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIAL_PLACEHOLDERS.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-lg">
              <VideoPlaceholder label="Add testimonial video" aspect="aspect-[4/5]" />
              <div className="flex gap-0.5 mt-4 mb-2">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 text-amber-500" fill="currentColor" />
                ))}
              </div>
              <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
              <p className="text-xs text-gray-500">{t.business}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-3xl p-10 text-white">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 text-3xl font-bold">
                <Users className="w-6 h-6" /> —
              </div>
              <p className="text-xs text-primary-100 mt-1 uppercase tracking-wide">Businesses served</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-3xl font-bold">
                <TrendingUp className="w-6 h-6" /> —
              </div>
              <p className="text-xs text-primary-100 mt-1 uppercase tracking-wide">Leads generated</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-3xl font-bold">
                <Repeat className="w-6 h-6" /> —
              </div>
              <p className="text-xs text-primary-100 mt-1 uppercase tracking-wide">Reviews collected</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who this is for */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-2 text-gray-900">Is this for you?</h2>
        <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
          We'd rather tell you now than waste your time on the call.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-7 shadow-lg border border-green-100">
            <p className="font-bold text-gray-900 mb-4">This is a good fit if you're:</p>
            <ul className="space-y-3">
              {GOOD_FIT.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl p-7 shadow-lg border border-gray-100">
            <p className="font-bold text-gray-900 mb-4">Probably not a fit if you're:</p>
            <ul className="space-y-3">
              {NOT_A_FIT.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <XCircle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-gray-900">Common questions</h2>
          <div className="bg-white rounded-2xl shadow-lg px-6 sm:px-8">
            {FAQ_ITEMS.map((item, i) => (
              <FaqAccordionItem
                key={item.q}
                item={item}
                open={openFaq === i}
                onToggle={() => setOpenFaq((cur) => (cur === i ? -1 : i))}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gray-900 py-20 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold mb-5 text-white">Ready to grow?</h2>
          <p className="text-lg text-gray-300 mb-10 max-w-xl mx-auto">
            Take the 60-second quiz and see if SORCE is the right fit for your business.
          </p>
          <button
            onClick={() => setQuizOpen(true)}
            className="px-10 py-5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition inline-flex items-center gap-2"
          >
            See If We're a Fit <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-gray-900 px-6 pb-12">
        <p className="text-xs text-gray-500 text-center leading-relaxed max-w-4xl mx-auto">
          Results vary by business, market, effort and execution. SORCE does not guarantee specific lead volume,
          booking numbers or revenue outcomes. Any results referenced on this page are individual examples and are
          not a guarantee of future performance for your business.
        </p>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span>© {new Date().getFullYear()} SORCE Integrations. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>

      <QuizModal open={quizOpen} onClose={() => setQuizOpen(false)} />
    </div>
  );
}
