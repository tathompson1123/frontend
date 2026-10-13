import { useState, useEffect, useCallback, useRef } from 'react';
import Player from '@vimeo/player';
import { startLandingTracking, track, pixel, flush } from '../utils/landingTrack';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play, ArrowRight, ChevronLeft, ChevronDown, Loader2,
  CheckCircle2, XCircle,
} from 'lucide-react';
import logoLandscapingImg from '../assets/learnmore/logo-landscaping.png';
import logoHvacImg from '../assets/learnmore/logo-hvac.png';

// Thompson's Auto Detailing logo is dropped in by hand as
// src/assets/learnmore/logo-thompsons.(png|jpg|webp|svg). Globbed rather than imported
// so the build still works before the file exists — the card shows initials until then.
const thompsonsLogoFiles = import.meta.glob('../assets/learnmore/logo-thompsons.*', { eager: true, import: 'default' });
const logoThompsonsImg = Object.values(thompsonsLogoFiles)[0] || null;

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
  'Under $5k/mo', '$5k – $20k/mo', '$20k – $50k/mo', '$50k – $100k/mo', '$100k+/mo',
];

const TOTAL_STEPS = 4;
const QUIZ_STAGES = ['1 Business type', '2 Struggle', '3 Revenue', '4 Contact details'];

// ── Main VSL (vertical 9:16) ─────────────────────────────────────────────────
// Vimeo's own player, so the thumbnail is whatever is set on the video in Vimeo
// (Vimeo → video → Settings → Thumbnail). The box is capped by viewport height so a
// vertical video never runs off a laptop screen, and stays full-width-ish on a phone.
const VSL_VIMEO_ID = '1233896654';

// locked: the video is blurred and can't be played; tapping it calls onLockedClick (the
// landing page opens the form there). Unlocked, it's the normal Vimeo player.
export function VslPlayer({ locked = false, onLockedClick }) {
  const frameRef = useRef(null);

  // The video lives in Vimeo's iframe, so clicks inside it can't be seen from here; the
  // player API reports play and progress instead.
  useEffect(() => {
    if (locked || !frameRef.current) return undefined;
    let player;
    try {
      player = new Player(frameRef.current);
      const reached = new Set();
      let played = false;
      player.on('play', () => { if (!played) { played = true; track('video_play'); } });
      player.on('timeupdate', ({ percent }) => {
        for (const m of [25, 50, 75]) {
          if (percent * 100 >= m && !reached.has(m)) { reached.add(m); track('video_progress', m); }
        }
      });
      player.on('ended', () => track('video_complete'));
    } catch { /* tracking must never break the page */ }
    return () => { try { player && player.destroy(); } catch { /* ignore */ } };
  }, [locked]);

  return (
    <div
      className="relative mx-auto aspect-[9/16] rounded-2xl overflow-hidden shadow-xl bg-black"
      style={{ width: 'min(100%, 380px, max(230px, calc((100vh - 210px) * 9 / 16)))' }}
    >
      <iframe
        ref={frameRef}
        src={`https://player.vimeo.com/video/${VSL_VIMEO_ID}?dnt=1&title=0&byline=0&portrait=0`}
        title="SORCE — how it works"
        loading="lazy"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className={`absolute inset-0 w-full h-full border-0 ${locked ? 'blur-[3px] scale-[1.02] pointer-events-none' : ''}`}
        tabIndex={locked ? -1 : undefined}
      />
      {locked && (
        <button
          type="button"
          onClick={onLockedClick}
          aria-label="Play video"
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/25 group"
        >
          <span className="w-20 h-20 rounded-full bg-white/95 shadow-2xl flex items-center justify-center group-hover:scale-105 transition">
            <Play className="w-9 h-9 text-primary-600 ml-1" fill="currentColor" />
          </span>
        </button>
      )}
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

function QuizModal({ open, onClose }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    businessType: '', businessTypeOther: '',
    struggle: '', struggleOther: '',
    revenue: '',
    name: '', company: '', phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Funnel events: the quiz opening, and each step the visitor reaches.
  useEffect(() => { if (open) track('quiz_open'); }, [open]);
  useEffect(() => { if (open) track('quiz_step', step + 1); }, [open, step]);

  // Where they left: the step they were on when they closed the quiz or the page.
  const stage = QUIZ_STAGES[step];
  const stageRef = useRef(null);
  stageRef.current = open ? stage : null;
  const abandonSent = useRef(false);
  useEffect(() => { if (open) abandonSent.current = false; }, [open]);
  const reportAbandon = useCallback(() => {
    if (!stageRef.current || abandonSent.current) return;
    abandonSent.current = true;
    track('quiz_abandon', stageRef.current);
    flush();
  }, []);
  // Closing the tab or navigating away while the quiz is open counts too.
  useEffect(() => {
    if (!open) return undefined;
    window.addEventListener('pagehide', reportAbandon);
    return () => window.removeEventListener('pagehide', reportAbandon);
  }, [open, reportAbandon]);

  if (!open) return null;

  const reset = () => {
    setStep(0);
    setForm({ businessType: '', businessTypeOther: '', struggle: '', struggleOther: '', revenue: '', name: '', company: '', phone: '' });
    setError('');
  };

  const close = () => { reportAbandon(); reset(); onClose(); };

  const canAdvance = () => {
    if (step === 0) return form.businessType && (form.businessType !== 'Other' || form.businessTypeOther.trim());
    if (step === 1) return form.struggle && (form.struggle !== 'Other' || form.struggleOther.trim());
    if (step === 2) return !!form.revenue;
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.company.trim() || !form.phone.trim()) {
      setError('Please fill in your name, business name and phone number.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/public/discovery/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, company: form.company, phone: form.phone,
          businessType: form.businessType === 'Other' ? form.businessTypeOther : form.businessType,
          struggle: form.struggle === 'Other' ? form.struggleOther : form.struggle,
          revenue: form.revenue,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong — please try again.');
      track('quiz_submit');
      pixel('Lead');
      abandonSent.current = true; // they finished — not a drop-off
      flush();
      navigate('/watch');
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
        <div className="flex items-center gap-2 px-6 pt-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= step ? 'bg-amber-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {(
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
                  <div className="space-y-3">
                    <input
                      required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-sm"
                    />
                    <input
                      required value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                      placeholder="Business name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-sm"
                    />
                    <input
                      required type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="Phone number"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none text-sm"
                    />
                  </div>

                  <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                    By submitting, you agree to be contacted by SORCE about your results — by call and text.
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
                      : <>Unlock the Video <ArrowRight className="w-4 h-4" /></>}
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

// Emphasis for the "what you get on the call" copy: { hl } is brand orange + bold
// (paragraphs), { b } is bold black (the three bullets).
function Hl({ children }) {
  return <strong className="font-bold text-primary-600">{children}</strong>;
}

function Rich({ parts }) {
  return parts.map((p, i) => {
    if (typeof p === 'string') return <span key={i}>{p}</span>;
    if (p.b) return <strong key={i} className="font-extrabold text-black">{p.b}</strong>;
    return <Hl key={i}>{p.hl}</Hl>;
  });
}

const CALL_BULLETS = [
  ['A ', { b: 'live demo' }, ' showing you exactly how you can pull cash from past customers.'],
  ['Your complete google review system that runs on ', { b: 'auto pilot' }, '.'],
  ['Your ', { b: 'Live chat agent' }, ' that grabs customers phone numbers and books them in the minute they step onto your site.'],
];

const CALL_PARAGRAPHS = [
  ['Before you commit to anything, we know how important it is to ', 'see what you\'re getting into', '.'],
  ['We want you to ', 'leave the call gaining real value', ' and hopefully even ', { hl: 'landing a sale live on the call' }, '.'],
  [
    'So if you\'re a service business owner who wants to get ahead of your competition and ',
    { hl: 'capture more cash from your local market' },
    ' while everyone else scrambles to run more ads, then ', { hl: 'book the call' },
    ' with us and run this live with us. See you then.',
  ],
];

// ── Placeholder social proof photos — swap for real customer photos later ────
// Placeholder names/quotes — FAKE, for layout purposes only. Swap for real
// customers and real quotes before this page runs any traffic.
export const SOCIAL_PROOF_PHOTOS = [
  { image: logoLandscapingImg, name: 'Mike R.', business: 'Evergreen Edge Lawn Care', quote: 'Leads stopped slipping through the cracks the first week.' },
  { image: logoThompsonsImg, name: 'Sarah T.', business: "Thompson's Auto Detailing", quote: 'We picked up 11 new jobs last month without spending more on ads.' },
  { image: logoHvacImg, name: 'Dave K.', business: 'Summit Comfort Heating & Air', quote: 'My Google reviews tripled and the phone hasn\'t stopped ringing.' },
];

const GOOD_FIT = [
  'Already getting some jobs, but following up is eating your time',
  'Doing $5k/mo or more and ready to systemize growth',
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
    a: "Built for home service and local service businesses typically doing $5k–$100k+/mo who are ready to stop manually chasing every lead.",
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

// Meta Pixel — loaded only on this page (the app is a SPA, so putting it in index.html
// would track every route). The script lands in <head> via insertBefore, same as Meta's snippet.
const META_PIXEL_ID = '1581971773185076';

function loadMetaPixel() {
  if (typeof window === 'undefined') return;
  if (!window.fbq) {
    const f = window;
    const n = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const t = document.createElement('script');
    t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(t);
    window.fbq('init', META_PIXEL_ID);
  }
  window.fbq('track', 'PageView');
}

export default function LearnMorePage() {
  const [quizOpen, setQuizOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    loadMetaPixel();
    return startLandingTracking();
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Hero — on desktop the headline sits beside the video so the whole video is in
          frame on arrival; on mobile it stacks: headline, video, then the button. */}
      <section className="max-w-6xl mx-auto px-6 pt-12 lg:pt-10 pb-16 lg:pb-14">
        <div className="grid lg:grid-cols-2 lg:gap-x-16 gap-y-8 lg:items-center">
          <div className="text-center lg:text-left lg:col-start-1 lg:row-start-1 lg:self-end">
            <h1 className="text-3xl md:text-5xl lg:text-[2.5rem] xl:text-5xl font-bold mb-7 text-gray-900 tracking-normal leading-[1.3]" style={{ fontFamily: "'Inter', sans-serif" }}>
              We implement recurring revenue systems for home service businesses without you spending a dime on ads.
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
              Book extra jobs while saving more time.
            </p>
          </div>

          <div className="text-center lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <span className="block text-2xl text-gray-900 mb-1" style={{ fontFamily: "'Caveat', cursive" }}>
              Watch here to learn how
            </span>
            <CurvyArrow className="mx-auto w-14 h-16 lg:h-12 text-gray-400 mb-3" />
            <VslPlayer locked onLockedClick={() => setQuizOpen(true)} />
          </div>

          <div className="text-center lg:text-left lg:col-start-1 lg:row-start-2 lg:self-start">
            <button
              onClick={() => setQuizOpen(true)}
              className="px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition inline-flex items-center gap-2"
            >
              See How It Works <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-500 mt-3">60-second quiz · No commitment</p>
          </div>
        </div>
      </section>

      {/* Social proof photo strip */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wide mb-8">What people are saying</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {SOCIAL_PROOF_PHOTOS.map((p, i) => (
              <div key={i} className="text-center">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={`${p.business} logo`}
                    className="w-20 h-20 mx-auto object-contain rounded-full bg-white border border-gray-200 shadow-md mb-3"
                  />
                ) : (
                  <div
                    aria-label={`${p.business} logo`}
                    className="w-20 h-20 mx-auto rounded-full bg-gray-900 text-white shadow-md mb-3 flex items-center justify-center text-xl font-bold"
                  >
                    {p.business.split(' ').slice(0, 2).map(w => w[0]).join('')}
                  </div>
                )}
                <p className="text-sm text-gray-700 italic mb-2">"{p.quote}"</p>
                <p className="text-xs font-semibold text-gray-900">{p.name}</p>
                <p className="text-[11px] text-gray-400">{p.business}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get on the call — copy, not cards. Hard-hitting words are the brand orange. */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
          What you get with <Hl>SORCE</Hl> on the 20 minute call
        </h2>

        <ul className="space-y-8 text-lg md:text-xl text-gray-900 leading-loose mb-8">
          {CALL_BULLETS.map((parts, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="mt-[0.9em] w-2.5 h-2.5 rounded-full bg-black flex-shrink-0" aria-hidden="true" />
              <span><Rich parts={parts} /></span>
            </li>
          ))}
        </ul>

        <div className="space-y-8 text-lg md:text-xl text-gray-900 leading-loose">
          {CALL_PARAGRAPHS.map((parts, i) => (
            <p key={i}><Rich parts={parts} /></p>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => setQuizOpen(true)}
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-bold hover:shadow-xl transition inline-flex items-center gap-2"
          >
            See How It Works <ArrowRight className="w-5 h-5" />
          </button>
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
            See How It Works <ArrowRight className="w-5 h-5" />
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
