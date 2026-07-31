import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Phone, Mail, Building2, X,
  Loader2, Check, Trash2, Send, StickyNote, User, RefreshCw,
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
// Pill colour inside a calendar cell, mirroring how the dashboard colours bookings.
const CELL_COLORS = {
  scheduled: '#2563eb', completed: '#059669', no_show: '#d97706', cancelled: '#9ca3af',
};

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

// Six weeks of cells starting on the Sunday before the 1st, same as the dashboard grid.
function monthGridDays(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function DiscoveryCalls({ token }) {
  const [calls, setCalls] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('scheduled');
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(null);
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

  const filtered = useMemo(() => {
    const list = statusFilter === 'all' ? calls : calls.filter(c => c.status === statusFilter);
    return [...list].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  }, [calls, statusFilter]);

  const patch = async (id, body, { quiet = false } = {}) => {
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
    }
  };

  const removeCall = async (id) => {
    if (!window.confirm('Delete this discovery call? This cannot be undone.')) return;
    try {
      await fetch(`${API_URL}/api/discovery/calls/${id}`, { method: 'DELETE', headers: authHeaders });
      setCalls(prev => prev.filter(c => c.id !== id));
      setSelectedId(null);
      flash('Call deleted');
    } catch {
      flash('Could not delete that call', 'error');
    }
  };

  const resend = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/discovery/calls/${id}/resend`, {
        method: 'POST', headers: authHeaders,
      });
      const data = await res.json();
      const sent = [data.smsSent && 'text', data.emailSent && 'email'].filter(Boolean);
      if (sent.length) flash(`Confirmation ${sent.join(' and ')} resent`);
      else flash(data.errors?.join(' · ') || 'Nothing was sent', 'error');
    } catch {
      flash('Could not resend', 'error');
    }
  };

  const openNewCall = (date) => {
    setFormDate(date || new Date());
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const gridDays = monthGridDays(currentDate);

  return (
    <div>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.kind === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:gap-6">

        {/* LEFT: narrow vertical list of who's booked */}
        <div className="md:w-80 md:flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col md:h-[calc(100vh-220px)]">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Booked</h3>
              <button
                onClick={load}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:border-amber-500 focus:outline-none"
            >
              <option value="scheduled">Upcoming ({calls.filter(c => c.status === 'scheduled').length})</option>
              <option value="completed">Completed ({calls.filter(c => c.status === 'completed').length})</option>
              <option value="no_show">No show ({calls.filter(c => c.status === 'no_show').length})</option>
              <option value="cancelled">Cancelled ({calls.filter(c => c.status === 'cancelled').length})</option>
              <option value="all">All ({calls.length})</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">Nothing here yet</p>
              </div>
            ) : filtered.map(call => (
              <button
                key={call.id}
                onClick={() => { setSelectedId(call.id); setCurrentDate(new Date(call.scheduled_at)); }}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  selectedId === call.id
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900 text-sm truncate">{call.name}</p>
                  {call.notes && <StickyNote className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />}
                </div>
                {call.company && (
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3 flex-shrink-0" /> {call.company}
                  </p>
                )}
                <p className="text-xs font-medium text-amber-700 mt-1.5">
                  {fmtDate(call.scheduled_at)} · {fmtTime(call.scheduled_at)}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLES[call.status]}`}>
                    {STATUS_LABELS[call.status]}
                  </span>
                  {call.source === 'public' && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600 border border-purple-100">
                      Self-booked
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Mobile only — on desktop the button lives top-right of the calendar */}
          <div className="p-3 border-t border-gray-200 md:hidden">
            <button
              onClick={() => openNewCall(new Date())}
              className="w-full py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Book a call
            </button>
          </div>
        </div>

        {/* RIGHT: the calendar, filling the space */}
        <div className="flex-1 min-w-0 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col md:h-[calc(100vh-220px)]">
          <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500 hidden lg:block">
                {calls.filter(c => {
                  const d = new Date(c.scheduled_at);
                  return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()
                    && c.status !== 'cancelled';
                }).length} this month
              </p>
              <button
                onClick={() => openNewCall(new Date())}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Book a call
              </button>
            </div>
          </div>

          <div className="px-6 pb-6 flex-1 flex flex-col min-h-0">
            <div className="border border-gray-200 rounded-lg flex-1 flex flex-col overflow-hidden">
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div
                    key={day}
                    className={`p-3 text-center text-sm font-medium text-gray-600 ${day !== 'Sat' ? 'border-r border-gray-200' : ''}`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-7 auto-rows-fr" style={{ minHeight: '100%' }}>
                  {gridDays.map((day, idx) => {
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isToday = sameDay(day, new Date());
                    const dayCalls = calls
                      .filter(c => sameDay(new Date(c.scheduled_at), day))
                      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
                    const maxVisible = 3;

                    return (
                      <div
                        key={idx}
                        onDoubleClick={() => openNewCall(day)}
                        className={`min-h-[110px] p-1.5 border-b border-r border-gray-100 ${
                          !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                        } ${isToday ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className={`text-sm font-medium mb-1 px-1 ${
                          isToday
                            ? 'text-white bg-blue-600 rounded-full w-7 h-7 flex items-center justify-center'
                            : !isCurrentMonth
                            ? 'text-gray-300'
                            : 'text-gray-900'
                        }`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-0.5">
                          {dayCalls.slice(0, maxVisible).map(call => {
                            const color = CELL_COLORS[call.status] || CELL_COLORS.scheduled;
                            return (
                              <button
                                key={call.id}
                                type="button"
                                onClick={() => setSelectedId(call.id)}
                                className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate transition hover:brightness-110 ${
                                  call.status === 'cancelled' ? 'opacity-50 line-through' : ''
                                }`}
                                style={{
                                  backgroundColor: color + '20',
                                  color,
                                  borderLeft: `3px solid ${color}`,
                                }}
                                title={`${call.name} — ${fmtTime(call.scheduled_at)}`}
                              >
                                {fmtTime(call.scheduled_at)} {call.name}
                              </button>
                            );
                          })}
                          {dayCalls.length > maxVisible && (
                            <button
                              type="button"
                              onClick={() => setSelectedId(dayCalls[maxVisible].id)}
                              className="w-full text-left px-1.5 py-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                            >
                              +{dayCalls.length - maxVisible} more
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Double-click any day to book a call on it.</p>
          </div>
        </div>
      </div>

      {selected && (
        <CallDetailModal
          call={selected}
          team={team}
          onClose={() => setSelectedId(null)}
          onPatch={patch}
          onDelete={removeCall}
          onResend={resend}
        />
      )}

      {showForm && (
        <BookCallModal
          team={team}
          defaultDate={formDate || new Date()}
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

function CallDetailModal({ call, team, onClose, onPatch, onDelete, onResend }) {
  const [noteDraft, setNoteDraft] = useState(call.notes || '');
  const [noteSaved, setNoteSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setNoteDraft(call.notes || ''); setNoteSaved(false); }, [call.id, call.notes]);

  const saveNote = async () => {
    setBusy(true);
    await onPatch(call.id, { notes: noteDraft }, { quiet: true });
    setNoteSaved(true);
    setBusy(false);
    setTimeout(() => setNoteSaved(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-lg font-bold text-gray-900 truncate">{call.name}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[call.status]}`}>
                {STATUS_LABELS[call.status]}
              </span>
              {call.source === 'public' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600 border border-purple-100">
                  Self-booked
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {fmtDate(call.scheduled_at)} · {fmtTime(call.scheduled_at)}
              {call.company ? ` · ${call.company}` : ''}
            </p>
            {call.rep_name && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                <User className="w-3 h-3" /> {call.rep_name}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {call.email && (
              <a href={`mailto:${call.email}`} className="flex items-center gap-2 text-blue-600 hover:underline truncate">
                <Mail className="w-4 h-4 flex-shrink-0" /> {call.email}
              </a>
            )}
            {call.phone && (
              <a href={`tel:${call.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                <Phone className="w-4 h-4 flex-shrink-0" /> {call.phone}
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            {[
              ['Confirmation text', call.confirmation_sms_sent],
              ['Confirmation email', call.confirmation_email_sent],
              ['24h reminder', call.reminder_24h_sent],
              ['2h reminder', call.reminder_2h_sent],
            ].map(([label, done]) => (
              <span key={label} className={`px-2 py-1 rounded-md ${done ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                {done ? '✓' : '—'} {label}
              </span>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5 text-amber-500" /> Notes
            </label>
            <textarea
              value={noteDraft}
              onChange={e => { setNoteDraft(e.target.value); setNoteSaved(false); }}
              rows={5}
              placeholder="What they're struggling with, what they're running now, what to follow up on..."
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-y"
            />
            <button
              onClick={saveNote}
              disabled={busy || noteDraft === (call.notes || '')}
              className="mt-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition disabled:opacity-40"
            >
              {noteSaved ? <><Check className="w-3 h-3 inline" /> Saved</> : 'Save note'}
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
              <select
                value={call.status}
                onChange={e => onPatch(call.id, { status: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Assigned to</label>
              <select
                value={call.assigned_to || ''}
                onChange={e => onPatch(call.id, { assignedTo: e.target.value || null })}
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
              onChange={e => onPatch(call.id, { scheduledAt: new Date(e.target.value).toISOString() })}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Moving the call re-arms both reminder texts.</p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onResend(call.id)}
              className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Resend confirmation
            </button>
            <button
              onClick={() => onDelete(call.id)}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookCallModal({ team, defaultDate, authHeaders, onClose, onCreated }) {
  const initial = new Date(defaultDate);
  if (!initial.getHours()) initial.setHours(10, 0, 0, 0);
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
            <span className="text-sm text-gray-700">Send the confirmation text and email now</span>
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
