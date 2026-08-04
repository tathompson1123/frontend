import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Calendar, ChevronLeft, ChevronRight, Loader2, Check, Clock, Star, Phone, Mail,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function BookCallPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [chosen, setChosen] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState(null);

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

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!chosen) { setError('Please pick a time first'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/public/discovery/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          scheduledAt: chosen.iso,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not book that call');
      setBooked({ when: chosen.iso });
    } catch (err) {
      setError(err.message);
      if (selectedDate) loadSlots(selectedDate);
    } finally {
      setSubmitting(false);
    }
  };

  if (booked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-highlight-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're booked in</h1>
          <p className="text-gray-600 mb-6">
            {new Date(booked.when).toLocaleString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
              hour: 'numeric', minute: '2-digit',
            })}
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
            <p className="text-sm text-gray-600 flex items-start gap-2">
              <Phone className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              We'll text your Zoom link to {form.phone}
            </p>
            <p className="text-sm text-gray-600 flex items-start gap-2">
              <Mail className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              A confirmation with all the details is on its way to {form.email}
            </p>
          </div>
          <Link to="/" className="text-sm font-semibold text-amber-600 hover:text-amber-700">
            Back to sorceintegrations.com
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-highlight-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              SORCE
            </span>
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Book a free 30-minute discovery call
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We'll look at where leads are slipping through the cracks in your business, and give you a
            straight answer on whether SORCE is a fit. No pressure either way.
          </p>
        </div>

        <div className="grid lg:grid-cols-[420px_1fr] gap-8 items-start">
          {/* Pick a time */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-gray-900">
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
                <div key={i} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
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

            <div className="mt-5 pt-5 border-t border-gray-100">
              {!selectedDate ? (
                <p className="text-sm text-gray-400 text-center py-4 flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" /> Pick a day to see available times
                </p>
              ) : loadingSlots ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-amber-600" /></div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nothing free that day — try another.
                </p>
              ) : (
                <>
                  <p className="text-xs font-semibold text-gray-600 mb-2.5">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto">
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
          </div>

          {/* Your details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Your details</h2>
            <p className="text-sm text-gray-500 mb-6">
              {chosen
                ? <>Booking <strong className="text-gray-900">
                    {new Date(chosen.iso).toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </strong></>
                : 'Pick a time on the left, then tell us where to reach you'}
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your name *</label>
                <input
                  required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone *</label>
                  <input
                    required type="tel" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email *</label>
                  <input
                    required type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="jane@business.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Business name</label>
                <input
                  value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="Smith Plumbing"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Anything you'd like us to look at first?
                </label>
                <textarea
                  rows={3} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. we get website traffic but hardly any calls"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none resize-y"
                />
              </div>

              {/* A2P 10DLC registration asks you to evidence the opt-in for the number
                  you text from, and carriers expect the disclosure at the point the
                  number is collected — not only in the message that follows. */}
              <p className="text-xs text-gray-500 leading-relaxed">
                By booking, you agree to receive text messages from SORCE about this call —
                a confirmation with your Zoom link, and reminders before it starts.
                Message and data rates may apply. Reply STOP to opt out at any time.
                See our <a href="/terms" className="underline hover:text-gray-700">Terms</a> and{' '}
                <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting || !chosen}
                className="w-full py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Booking...</>
                  : <>Confirm my call <Check className="w-5 h-5" /></>}
              </button>

              <div className="flex items-center justify-center gap-5 pt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 30 minutes</span>
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> On Zoom</span>
                <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> No obligation</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
