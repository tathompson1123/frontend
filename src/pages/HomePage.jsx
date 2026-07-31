import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wand2, MessageCircle, TrendingUp, Zap, ArrowRight, Check, X as XIcon, Star, Users, Rocket, BarChart, Calendar, Globe, Brain, Mail, Clock, Phone, Menu, X } from 'lucide-react';
import AuthModal from '../components/AuthModal';

const BEFORE_AFTER = [
  {
    before: 'Leads sit unanswered until you finish the job — most have already called someone else',
    after: 'Every new lead gets a personal text within 60 seconds, automatically',
  },
  {
    before: 'You remember to ask for a Google review maybe one time in ten',
    after: 'A review request goes out after every single job, on its own',
  },
  {
    before: 'Phone tag and back-and-forth texts just to get one appointment on the calendar',
    after: 'Customers book themselves 24/7 — straight into your calendar',
  },
  {
    before: 'Your website gets visitors, but almost none of them ever contact you',
    after: 'AI chat and smart forms turn those same visitors into leads',
  },
  {
    before: 'Evenings and weekends disappear into admin, invoices and follow-ups',
    after: 'The busywork runs itself while you stay on the tools',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-redirect if already signed in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);
  const [authMode, setAuthMode] = useState('signup');
  const handleGetStarted = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleSignup = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    if (!user.email_verified) {
      navigate('/verify-email');
    } else if (!user.questionnaire_completed) {
      navigate('/onboarding');
    } else {
      navigate('/dashboard');
    }
  };

  const handleNavigateToPricing = () => {
    navigate('/pricing');
  };

  return (
   <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-highlight-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" fill="currentColor" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                SORCE
              </span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <button onClick={handleLogin} className="text-gray-700 hover:text-primary-600 font-medium transition">
                Login
              </button>
              <button onClick={handleNavigateToPricing} className="text-gray-700 hover:text-primary-600 font-medium transition">
                Pricing
              </button>
              <button onClick={handleGetStarted} className="px-6 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-lg transition font-semibold">
                Get Started
              </button>
            </div>
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="md:hidden p-2 -mr-2 text-gray-700 hover:text-primary-600 transition"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 py-3 flex flex-col gap-1">
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogin(); }}
                className="text-left px-3 py-3 text-gray-700 hover:bg-gray-50 hover:text-primary-600 font-medium rounded-lg transition"
              >
                Login
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); handleNavigateToPricing(); }}
                className="text-left px-3 py-3 text-gray-700 hover:bg-gray-50 hover:text-primary-600 font-medium rounded-lg transition"
              >
                Pricing
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); handleGetStarted(); }}
                className="mt-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-lg transition font-semibold text-center"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm mb-6">
              <Rocket className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-gray-700">Built for service businesses</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Turn{' '}
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                200% more website visitors
              </span>{' '}
              into booked jobs
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              SORCE fills your calendar and your Google reviews without you lifting a finger.
              Automated review requests, hands-free booking, and AI that answers every lead in
              under a minute — day or night.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all inline-flex items-center gap-2 justify-center"
              >
                <Wand2 className="w-5 h-5" />
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleNavigateToPricing}
                className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl font-semibold text-lg hover:border-primary-600 transition-all"
              >
                See Plans
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              ✨ Free to start • 🚀 Live in minutes • 💳 No credit card required
            </p>
          </div>

          <div className="relative">
            <img
              src="/home/hero.jpg"
              alt="Service business owner in front of his work van"
              className="w-full rounded-3xl shadow-2xl object-cover aspect-[16/11]"
            />
            {/* Floating proof cards */}
            <div className="absolute -bottom-6 -left-4 sm:left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 max-w-[15rem]">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">New 5-star review</p>
                <p className="text-xs text-gray-500">Requested automatically</p>
              </div>
            </div>
            <div className="absolute -top-4 right-2 sm:right-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 max-w-[15rem]">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Job booked · 9:41pm</p>
                <p className="text-xs text-gray-500">While you were asleep</p>
              </div>
            </div>
          </div>
        </div>

        {/* Headline benefit stats */}
        <div className="grid sm:grid-cols-3 gap-6 mt-20">
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-4xl font-bold text-primary-600 mb-1">200%</div>
            <p className="font-semibold text-gray-900">More visitors become leads</p>
            <p className="text-sm text-gray-500 mt-1">AI chat and smart forms on your existing site</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-4xl font-bold text-teal-600 mb-1">100%</div>
            <p className="font-semibold text-gray-900">Of jobs get a review request</p>
            <p className="text-sm text-gray-500 mt-1">Sent automatically, every single time</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-4xl font-bold text-accent-600 mb-1">24/7</div>
            <p className="font-semibold text-gray-900">Hands-free booking</p>
            <p className="text-sm text-gray-500 mt-1">Customers book themselves while you work</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Three things that grow a service business
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            SORCE automates all three — so they happen on every job, not just the ones you remember.
          </p>
        </div>

        <div className="space-y-24">
          {/* Benefit 1: Automated Google Reviews */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-100 px-4 py-2 rounded-full mb-4">
                <Star className="w-5 h-5 text-teal-600" />
                <span className="text-sm font-semibold text-teal-900">Benefit #1</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Automated Google reviews
              </h3>
              <p className="text-xl text-gray-600 mb-6">
                Reviews are the number one reason a customer picks you over the business down the road.
                SORCE texts every customer after the job, reads their reply, and sends the happy ones
                straight to your Google page — while quietly flagging the unhappy ones to you first.
              </p>
              <div className="space-y-3">
                {[
                  ['Asks every customer, every time', 'No more remembering — it fires the moment a job ends'],
                  ['Catches problems before they go public', 'Unhappy replies come to you instead of your review page'],
                  ['Climbs the Google Maps ranking', 'More reviews means more people find you first'],
                ].map(([title, sub]) => (
                  <div key={title} className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">{title}</p>
                      <p className="text-gray-600">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="/home/benefit-reviews.jpg"
                alt="Detailer reading a review request reply on his phone"
                loading="lazy"
                className="w-full rounded-3xl shadow-xl object-cover aspect-[3/2]"
              />
              <div className="absolute -bottom-6 left-6 right-6 bg-white rounded-2xl shadow-xl p-4">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-gray-900">Review posted</span>
                </div>
                <p className="text-sm text-gray-500">Sent 2 hours after the job — no action needed from you</p>
              </div>
            </div>
          </div>

          {/* Benefit 2: Hands-free booking */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative">
              <img
                src="/home/benefit-booking.jpg"
                alt="Customer booking an appointment from her phone at home in the evening"
                loading="lazy"
                className="w-full rounded-3xl shadow-xl object-cover aspect-[3/2]"
              />
              <div className="absolute -bottom-6 left-6 right-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Booked at 9:41pm, confirmed instantly</p>
                  <p className="text-xs text-gray-500">Reminder texts scheduled automatically</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 bg-primary-100 px-4 py-2 rounded-full mb-4">
                <Calendar className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-semibold text-primary-900">Benefit #2</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                A hands-free booking system
              </h3>
              <p className="text-xl text-gray-600 mb-6">
                Most customers want to book at 9pm, not call you at 9am. SORCE puts real-time
                availability on your website so they book themselves — into the right service,
                the right slot, and the right team member, with no phone tag.
              </p>
              <div className="space-y-3">
                {[
                  ['Takes bookings while you work', 'Your calendar fills up during jobs and after hours'],
                  ['No double-bookings', 'Services, durations and staff availability all respected'],
                  ['Fewer no-shows', 'Automatic confirmations and reminder texts go out for you'],
                ].map(([title, sub]) => (
                  <div key={title} className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">{title}</p>
                      <p className="text-gray-600">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Benefit 3: Visitors into leads */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-accent-100 px-4 py-2 rounded-full mb-4">
                <TrendingUp className="w-5 h-5 text-accent-600" />
                <span className="text-sm font-semibold text-accent-900">Benefit #3</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                200% more visitors turned into leads
              </h3>
              <p className="text-xl text-gray-600 mb-6">
                You already have traffic — it just leaves without saying anything. Drop one line of
                code onto your existing site and SORCE starts a conversation with every visitor,
                captures their details, and texts them back within 60 seconds.
              </p>
              <div className="space-y-3">
                {[
                  ['Works on the site you already have', 'Wix, Squarespace, WordPress, GoDaddy or plain HTML'],
                  ['Replies in under 60 seconds', 'The business that answers first almost always wins the job'],
                  ['Nothing slips through', 'Every enquiry lands in one CRM with follow-up built in'],
                ].map(([title, sub]) => (
                  <div key={title} className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">{title}</p>
                      <p className="text-gray-600">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="/home/benefit-leads.jpg"
                alt="Business owner reviewing new leads on her laptop and phone"
                loading="lazy"
                className="w-full rounded-3xl shadow-xl object-cover aspect-[3/2]"
              />
              <div className="absolute -bottom-6 left-6 right-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">3 new leads captured today</p>
                  <p className="text-xs text-gray-500">All three texted back automatically</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your week, before and after SORCE
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Same business, same hours in the day — a completely different amount of it spent on admin.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Before */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border-2 border-red-100">
            <img
              src="/home/before.jpg"
              alt="Overwhelmed business owner working late surrounded by paperwork"
              loading="lazy"
              className="w-full object-cover aspect-[4/3]"
            />
            <div className="p-8">
              <div className="inline-flex items-center gap-2 bg-red-100 px-4 py-1.5 rounded-full mb-5">
                <XIcon className="w-4 h-4 text-red-600" />
                <span className="text-sm font-bold text-red-900">Before SORCE</span>
              </div>
              <div className="space-y-4">
                {BEFORE_AFTER.map((row) => (
                  <div key={row.before} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <XIcon className="w-3 h-3 text-red-600" />
                    </div>
                    <p className="text-gray-600">{row.before}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-red-50 rounded-xl p-4 text-sm font-medium text-red-900">
                Growth depends on you remembering to do all of it.
              </div>
            </div>
          </div>

          {/* After */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-teal-300 md:-mt-4">
            <img
              src="/home/after.jpg"
              alt="Relaxed business owner with a clear desk checking his phone"
              loading="lazy"
              className="w-full object-cover aspect-[4/3]"
            />
            <div className="p-8">
              <div className="inline-flex items-center gap-2 bg-teal-100 px-4 py-1.5 rounded-full mb-5">
                <Check className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-bold text-teal-900">With SORCE</span>
              </div>
              <div className="space-y-4">
                {BEFORE_AFTER.map((row) => (
                  <div key={row.after} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-teal-600" />
                    </div>
                    <p className="text-gray-700 font-medium">{row.after}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-teal-50 rounded-xl p-4 text-sm font-medium text-teal-900">
                Growth happens on every job, whether you think about it or not.
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
          >
            Get the "With SORCE" version
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Everything else included */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            And everything else runs in the same place
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            One dashboard instead of five subscriptions that don't talk to each other.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { icon: Users, color: 'text-primary-600', bg: 'from-primary-100 to-accent-100', title: 'Unified CRM', body: 'Every lead from your website, Google, forms and AI chat lands in one place with its full history.' },
            { icon: Phone, color: 'text-teal-600', bg: 'from-teal-100 to-primary-100', title: 'AI SMS follow-up', body: 'New leads get a personal text in under a minute, and the AI keeps the conversation going.' },
            { icon: Mail, color: 'text-accent-600', bg: 'from-accent-100 to-highlight-100', title: 'Email marketing', body: 'Weekly offers written and sent to past customers automatically to bring them back.' },
            { icon: Globe, color: 'text-primary-600', bg: 'from-primary-100 to-teal-100', title: 'SEO & website tools', body: 'Fresh AI-written content and audits that keep you climbing the search results.' },
            { icon: Brain, color: 'text-accent-600', bg: 'from-accent-100 to-primary-100', title: 'Market research', body: 'See what competitors charge and where the upsell room is in your own customer list.' },
            { icon: BarChart, color: 'text-teal-600', bg: 'from-teal-100 to-accent-100', title: 'Real reporting', body: 'Know exactly which channels turn into booked, paid jobs — not just clicks.' },
          ].map(({ icon: Icon, color, bg, title, body }) => (
            <div key={title} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className={`w-14 h-14 bg-gradient-to-br ${bg} rounded-xl flex items-center justify-center mb-6`}>
                <Icon className={`w-7 h-7 ${color}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
              <p className="text-gray-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-3xl p-12 text-white">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What changes in the first 90 days
            </h2>
            <p className="text-xl text-primary-100">
              This is what happens when reviews, booking and follow-up stop depending on your memory
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">200%</div>
              <div className="text-primary-100">Visitors → Leads</div>
              <p className="text-sm text-primary-200 mt-2">AI chat beats a contact form every time</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">3x</div>
              <div className="text-primary-100">More Bookings</div>
              <p className="text-sm text-primary-200 mt-2">Self-serve booking captures the after-hours jobs</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100x</div>
              <div className="text-primary-100">Faster Reviews</div>
              <p className="text-sm text-primary-200 mt-2">Every job asks, so reviews compound</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">60s</div>
              <div className="text-primary-100">Lead Response</div>
              <p className="text-sm text-primary-200 mt-2">Beat competitors to the phone, automatically</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to stop losing customers?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get your reviews, bookings and follow-up running on autopilot — starting with today's jobs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="px-10 py-5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold text-xl hover:shadow-2xl transition-all inline-flex items-center gap-3 justify-center"
            >
              Get Started Free
              <ArrowRight className="w-6 h-6" />
            </button>
            <button
              onClick={handleNavigateToPricing}
              className="px-10 py-5 bg-white text-gray-900 border-2 border-gray-300 rounded-xl font-semibold text-xl hover:border-primary-600 transition-all"
            >
              See Plans →
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Free to start • Upgrade anytime for AI chat, reviews & SEO
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="text-xl font-bold">SORCE</span>
            </div>

            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <button onClick={handleLogin} className="text-gray-400 hover:text-white transition">
                Login
              </button>
              <button onClick={handleNavigateToPricing} className="text-gray-400 hover:text-white transition">
                Pricing
              </button>
              <button onClick={handleSignup} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition font-semibold">
                Sign Up
              </button>
            </div>

            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <span>© 2026 SORCE. Built for service businesses.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
        onSuccess={handleAuthSuccess}
      />

    </div>
  );
}
