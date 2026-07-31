import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Phone, Mail, Building2, X,
  Loader2, Check, Clock, Trash2, Send, StickyNote, User, RefreshCw,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const STATUS_STYLES = {
  scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  no_show:   'bg-amber-100 text-amber-700 border-amber-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};
const STATUS_LABELS = {
  scheduled: 'Scheduled', completed: 'Completed', no_show: 'No show', cancelled: 'Cancelled',
};

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const toLocalInput = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export default function DiscoveryCalls({ token }) {
  const [calls, setCalls] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('scheduled');
  const [showForm, setShowForm] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [toast, setToast] = useState(null);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token]
  );

  const flash = (msg, kind = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [callsRes, teamRes] = await Promise.all([
        fetch(`${API_URL}/api/discovery/calls`, { headers: authHeaders }),
        fetch(`${API_URL}/api/discovery/team`, { headers: authHeaders }),
      ]);
      const callsData = await callsRes.json();
      const teamData = await teamRes.json();
      setCalls(callsData.calls || []);
      setTeam((teamData.team || []).filter(m => m.active));
    } catch {
      flash('Could not load discovery calls', 'error');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  const selected = calls.find(c => c.id === selectedId) || null;
  useEffect(() => {
    setNoteDraft(selected?.notes || '');
    setNoteSaved(false);
  }, [selectedId, selected?.notes]);

  const filtered = useMemo(() => {
    const list = statusFilter === 'all' ? calls : calls.filter(c => c.status === statusFilter);
    return [...list].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  }, [calls, statusFilter]);

  const callsOnSelectedDay = useMemo(
    () => calls.filter(c => sameDay(new Date(c.scheduled_at), selectedDate))
               .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)),
    [calls, selectedDate]
  );

  const patch = async (id, body, { quiet = false } = {}) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/discovery/calls/${id}`, {
        method: 'PUT', headers: authHeaders, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setCalls(prev => prev.map(c => (c.id === id ? data.call : c)));
      if (!quiet) flash('Saved');
      return data.call;
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    if (!selected) return;
    await patch(selected.id, { notes: noteDraft }, { quiet: true });
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
  };

  const removeCall = async (id) => {
    if (!window.confirm('Delete this discovery call? This cannot be undone.')) return;
    try {
      await fetch(`${API_URL}/api/discovery/calls/${id}`, { method: 'DELETE', headers: authHeaders });
      setCalls(prev => prev.filter(c => c.id !== id));
      if (selectedId === id) setSelectedId(null);
      flash('Call deleted');
    } catch {
      flash('Could not delete that call', 'error');
    }
  };

  const resend = async (id) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/discovery/calls/${id}/resend`, {
        method: 'POST', headers: authHeaders,
      });
      const data = await res.json();
      const sent = [data.smsSent && 'text', data.emailSent && 'email'].filter(Boolean);
      if (sent.length) flash(`Confirmation ${sent.join(' and ')} resent`);
      else flash(data.errors?.join(' · ') || 'Nothing was sent', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Calendar grid: leading blanks + every day of the month
  const grid = useMemo(() => {
    const first = startOfMonth(month);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells = Array.from({ length: first.getDay() }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    }
    return cells;
  }, [month]);

  const countsByDay = useMemo(() => {
    const map = {};
    for (const c of calls) {
      if (c.status === 'cancelled') continue;
      const d = new Date(c.scheduled_at);
      map[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`] =
        (map[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`] || 0) + 1;
    }
    return map;
  }, [calls]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.kind === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Discovery Calls</h2>
          <p className="text-sm text-gray-500">Prospects booked in for a call about SORCE</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Book a call
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* LEFT: the pipeline */}
        <div className="space-y-4 min-w-0">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {[
              ['scheduled', 'Upcoming'], ['completed', 'Completed'],
              ['no_show', 'No show'], ['all', 'All'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  statusFilter === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
                <span className="ml-1.5 text-xs text-gray-400">
                  {value === 'all' ? calls.length : calls.filter(c => c.status === value).length}
                </span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No calls here yet</p>
              <p className="text-sm text-gray-400 mt-1">Book one manually, or wait for a prospect to self-book.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(call => {
                const isOpen = selectedId === call.id;
                return (
                  <div
                    key={call.id}
                    className={`bg-white rounded-2xl border transition-all ${
                      isOpen ? 'border-amber-400 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedId(isOpen ? null : call.id)}
                      className="w-full text-left p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-gray-900 truncate">{call.name}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[call.status] || STATUS_STYLES.scheduled}`}>
                              {STATUS_LABELS[call.status] || call.status}
                            </span>
                            {call.source === 'public' && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600 border border-purple-100">
                                Self-booked
                              </span>
                            )}
                          </div>
                          {call.company && (
                            <p className="text-sm text-gray-500 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5" /> {call.company}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 flex-wrap">
                            <span className="flex items-center gap-1.5 font-medium text-gray-900">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              {fmtDate(call.scheduled_at)} · {fmtTime(call.scheduled_at)}
                            </span>
                            {call.phone && (
                              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{call.phone}</span>
                            )}
                          </div>
                          {call.rep_name && (
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                              <User className="w-3 h-3" /> {call.rep_name}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {call.notes && <StickyNote className="w-4 h-4 text-amber-500" />}
                          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          {call.email && (
                            <a href={`mailto:${call.email}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                              <Mail className="w-4 h-4" /> {call.email}
                            </a>
                          )}
                          {call.phone && (
                            <a href={`tel:${call.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                              <Phone className="w-4 h-4" /> {call.phone}
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className={`px-2 py-1 rounded-md ${call.confirmation_sms_sent ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {call.confirmation_sms_sent ? '✓' : '—'} Confirmation text
                          </span>
                          <span className={`px-2 py-1 rounded-md ${call.confirmation_email_sent ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {call.confirmation_email_sent ? '✓' : '—'} Confirmation email
                          </span>
                          <span className={`px-2 py-1 rounded-md ${call.reminder_24h_sent ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            24h
                          </span>
                          <span className={`px-2 py-1 rounded-md ${call.reminder_2h_sent ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            2h
                          </span>
                        </div>

                        {/* Notes on the booking card */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                            <StickyNote className="w-3.5 h-3.5 text-amber-500" /> Notes
                          </label>
                          <textarea
                            value={noteDraft}
                            onChange={e => { setNoteDraft(e.target.value); setNoteSaved(false); }}
                            rows={4}
                            placeholder="What they're struggling with, what they're running now, what to follow up on..."
                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-y"
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={saveNote}
                              disabled={saving || noteDraft === (selected?.notes || '')}
                              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition disabled:opacity-40"
                            >
                              {noteSaved ? <><Check className="w-3 h-3 inline" /> Saved</> : 'Save note'}
                            </button>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                            <select
                              value={call.status}
                              onChange={e => patch(call.id, { status: e.target.value })}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                            >
                              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Assigned to</label>
                            <select
                              value={call.assigned_to || ''}
                              onChange={e => patch(call.id, { assignedTo: e.target.value || null })}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                            >
                              <option value="">Unassigned</option>
                              {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reschedule</label>
                          <input
                            type="datetime-local"
                            value={toLocalInput(call.scheduled_at)}
                            onChange={e => patch(call.id, { scheduledAt: new Date(e.target.value).toISOString() })}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                          />
                          <p className="text-xs text-gray-400 mt-1">Moving the call re-arms both reminder texts.</p>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => resend(call.id)}
                            disabled={saving}
                            className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" /> Resend confirmation
                          </button>
                          <button
                            onClick={() => removeCall(call.id)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: the calendar */}
        <div className="lg:sticky lg:top-6 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
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
                <div key={i} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((day, i) => {
                if (!day) return <div key={i} />;
                const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                const count = countsByDay[key] || 0;
                const isSelected = sameDay(day, selectedDate);
                const isToday = sameDay(day, new Date());
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square rounded-lg text-sm font-medium flex flex-col items-center justify-center gap-0.5 transition ${
                      isSelected ? 'bg-amber-600 text-white'
                      : isToday ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {day.getDate()}
                    {count > 0 && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-bold text-gray-900 mb-3">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            {callsOnSelectedDay.length === 0 ? (
              <p className="text-sm text-gray-400 py-3">Nothing booked this day.</p>
            ) : (
              <div className="space-y-2">
                {callsOnSelectedDay.map(call => (
                  <button
                    key={call.id}
                    onClick={() => setSelectedId(call.id)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      selectedId === call.id
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">{call.name}</span>
                      <span className="text-xs font-medium text-amber-700 flex-shrink-0">{fmtTime(call.scheduled_at)}</span>
                    </div>
                    {call.company && <p className="text-xs text-gray-500 truncate mt-0.5">{call.company}</p>}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="w-full mt-3 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-amber-400 hover:text-amber-700 transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Book a call
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <BookCallModal
          team={team}
          defaultDate={selectedDate}
          authHeaders={authHeaders}
          onClose={() => setShowForm(false)}
          onCreated={(call, delivery) => {
            setCalls(prev => [call, ...prev]);
            setShowForm(false);
            setSelectedId(call.id);
            const sent = [delivery?.smsSent && 'text', delivery?.emailSent && 'email'].filter(Boolean);
            flash(sent.length ? `Booked — confirmation ${sent.join(' and ')} sent` : 'Booked');
          }}
        />
      )}
    </div>
  );
}

function BookCallModal({ team, defaultDate, authHeaders, onClose, onCreated }) {
  const initial = new Date(defaultDate);
  initial.setHours(10, 0, 0, 0);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '',
    scheduledAt: toLocalInput(initial.toISOString()),
    durationMinutes: 30, assignedTo: '', notes: '', sendNotifications: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/discovery/calls`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ...form,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          assignedTo: form.assignedTo || null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not book that call');
      onCreated(data.call, data.delivery);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Book a discovery call</h3>
            <p className="text-sm text-gray-500">They'll get a confirmation text and email</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Name *</label>
            <input
              required value={form.name} onChange={set('name')} placeholder="Jane Smith"
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone *</label>
              <input
                type="tel" value={form.phone} onChange={set('phone')} placeholder="(555) 123-4567"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email *</label>
              <input
                type="email" value={form.email} onChange={set('email')} placeholder="jane@business.com"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Business</label>
            <input
              value={form.company} onChange={set('company')} placeholder="Smith Plumbing"
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">When *</label>
              <input
                required type="datetime-local" value={form.scheduledAt} onChange={set('scheduledAt')}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Who's taking it</label>
              <select
                value={form.assignedTo} onChange={set('assignedTo')}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="">Me</option>
                {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              rows={3} value={form.notes} onChange={set('notes')}
              placeholder="Where they came from, what they're after..."
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-y"
            />
          </div>

          <label className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg cursor-pointer">
            <input
              type="checkbox" checked={form.sendNotifications}
              onChange={e => setForm(f => ({ ...f, sendNotifications: e.target.checked }))}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-400"
            />
            <span className="text-sm text-gray-700">
              Send the confirmation text and email now
            </span>
          </label>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</> : 'Book the call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
