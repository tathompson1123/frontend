import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Play, ArrowRight, ChevronLeft, Check, Loader2, Star,
  MessageCircle, Globe, Repeat, Users, TrendingUp, Award,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

  if (!open) return null;

  const reset = () => {
    setStep(0);
    setForm({ businessType: '', businessTypeOther: '', struggle: '', struggleOther: '', revenue: '', name: '', email: '', phone: '' });
    setError('');
    setDone(false);
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
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
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h3>
              <p className="text-gray-600 mb-6">
                Our team will reach out shortly to get a call on the books. Want to grab a time right now instead?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/book-a-call"
                  className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition text-center"
                >
                  Pick a time now
                </Link>
                <button
                  onClick={close}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  I'll wait to hear from you
                </button>
              </div>
            </div>
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
  },
  {
    icon: MessageCircle,
    title: 'Every lead gets followed up, instantly',
    body: 'New leads get a personal text within seconds and automatic follow-up until they book, so nobody slips through the cracks.',
  },
  {
    icon: Award,
    title: '5-star reviews, on autopilot',
    body: 'A review request goes out after every job automatically, building the reputation that gets you picked over the competition.',
  },
];

export default function LearnMorePage() {
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-highlight-50">
      {/* Nav */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              SORCE
            </span>
          </Link>
          <button
            onClick={() => setQuizOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition"
          >
            See If We're a Fit
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <p className="text-primary-600 font-semibold tracking-wide uppercase text-sm mb-4">For Service Businesses</p>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight max-w-4xl mx-auto mb-6 text-gray-900">
          Get More Jobs With AI, a Website That Converts, and{' '}
          <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            5-Star Reviews
          </span>{' '}
          — On Autopilot
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          SORCE runs the lead-gen, follow-up and review requests behind the scenes, so you spend less time chasing
          customers and more time on the job.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
          <button
            onClick={() => setQuizOpen(true)}
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition flex items-center gap-2"
          >
            See If We're a Fit <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-12">60-second quiz · No commitment</p>

        <VideoPlaceholder label="Drop in your main demo / VSL video here" className="max-w-3xl mx-auto" />
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-2 text-gray-900">How SORCE Works</h2>
        <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
          Three systems running quietly in the background of your business, every single day.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl p-7 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center mb-5">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Video testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-16">
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

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-5 text-gray-900">Ready to grow?</h2>
          <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto">
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
