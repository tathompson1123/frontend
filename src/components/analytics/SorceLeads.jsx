// SORCE's own sales pipeline. Same shape as the Leads tab a business gets on their
// dashboard, but these rows are people buying SORCE rather than a customer's clients —
// hence sorce_leads rather than the per-business `leads` table.
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Search, X, Loader2, Trash2, Mail, Phone, Building2, User,
  CalendarDays, Pencil, Check, Video, PhoneCall, Globe, MapPin, Clock, CalendarPlus,
} from 'lucide-react';
import BookCallModal from './BookCallModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const STATUSES = [
  { id: 'new',            label: 'New',        pill: 'bg-blue-100 text-blue-700' },
  { id: 'contacted',      label: 'Contacted',  pill: 'bg-indigo-100 text-indigo-700' },
  { id: 'qualified',      label: 'Qualified',  pill: 'bg-purple-100 text-purple-700' },
  { id: 'demo_scheduled', label: 'Demo Set',   pill: 'bg-amber-100 text-amber-700' },
  { id: 'won',            label: 'Won',        pill: 'bg-green-100 text-green-700' },
  { id: 'lost',           label: 'Lost',       pill: 'bg-gray-100 text-gray-500' },
];
const statusMeta = (id) => STATUSES.find(s => s.id === id) || { label: id || '—', pill: 'bg-gray-100 text-gray-600' };

const SOURCES = ['manual', 'website', 'referral', 'cold_outreach', 'social', 'event', 'other'];
const label = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—';
const fmtDateTime = (iso) => iso
  ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  : '—';

// Three ways into the same pipeline table. Booked Meetings is every prospect with a
// discovery call attached — the backend links one automatically the moment a call is
// booked, so this view and the calendar can't drift. Cold Outreach is the same rows
// filtered to that source, with the business fields foregrounded instead of buried.
const VIEWS = [
  { id: 'pipeline', label: 'Pipeline',       icon: User },
  { id: 'booked',   label: 'Booked Meetings', icon: Video },
  { id: 'outreach', label: 'Cold Outreach',   icon: PhoneCall },
];

// Staleness, not just age: a lead nobody has touched in three weeks is the one that
// quietly dies, and it looks identical to a fresh one without this.
function contactAge(lead) {
  const d = Number(lead?.days_since_contact);
  if (!Number.isFinite(d)) return null;
  const never = !lead.has_been_contacted;
  const text = d === 0 ? (never ? 'Added today' : 'Today')
    : `${d}d ${never ? 'old, no contact' : 'since contact'}`;
  const tone = d >= 21 ? 'bg-red-100 text-red-700'
    : d >= 7 ? 'bg-amber-100 text-amber-700'
    : 'bg-gray-100 text-gray-500';
  return { text, tone, days: d };
}

const EMPTY = {
  name: '', email: '', phone: '', company: '', source: 'manual', status: 'new',
  notes: '', assigned_to: '', website: '', address: '', city: '', state: '',
  industry: '', contact_title: '',
};
// Cold-outreach entries start from the business, so the form opens on that footing
// and the row's contact clock starts the moment it's logged.
const EMPTY_OUTREACH = { ...EMPTY, source: 'cold_outreach', status: 'contacted' };

// onGoToCalls switches the surrounding page to the Discovery Calls tab. Booking a call
// here puts it there, so the confirmation offers to take you rather than leaving you to
// find it.
export default function SorceLeads({ token, onGoToCalls }) {
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({});
  const [viewCounts, setViewCounts] = useState({});
  const [view, setView] = useState('pipeline');
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | { ...lead } | EMPTY-with-no-id
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [booking, setBooking] = useState(null); // the lead being scheduled

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token]
  );

  // An optional action rides along so a booking confirmation can offer the jump to the
  // calendar. Held longer when there's something to click — 2.6s isn't enough to read a
  // message and act on it.
  const notify = (msg, action = null) => {
    setToast({ msg, action });
    setTimeout(() => setToast(null), action ? 6000 : 2600);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/discovery/leads`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
        setCounts(data.counts || {});
        setViewCounts(data.views || {});
      }
    } catch {
      notify('Could not load leads');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  // Team list powers the owner dropdown. Non-fatal — the field just stays empty.
  useEffect(() => {
    fetch(`${API_URL}/api/discovery/team`, { headers: authHeaders })
      .then(r => r.json())
      .then(d => setTeam((d.team || []).filter(m => m.active)))
      .catch(() => {});
  }, [authHeaders]);

  // Filtering is client-side: the list is capped at 500 server-side, so a round trip
  // per keystroke would cost more than it saves.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter(l => {
      if (view === 'booked' && !l.discovery_call_id) return false;
      if (view === 'outreach' && l.source !== 'cold_outreach') return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (!q) return true;
      return [l.name, l.email, l.company, l.phone, l.city, l.industry]
        .some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [leads, view, statusFilter, search]);

  const save = async () => {
    if (!editing?.name?.trim()) { notify('Name is required'); return; }
    setSaving(true);
    try {
      const isNew = !editing.id;
      const body = {
        name: editing.name, email: editing.email, phone: editing.phone,
        company: editing.company, source: editing.source, status: editing.status,
        notes: editing.notes, assigned_to: editing.assigned_to || null,
        website: editing.website, address: editing.address, city: editing.city,
        state: editing.state, industry: editing.industry, contact_title: editing.contact_title,
      };
      const res = await fetch(
        `${API_URL}/api/discovery/leads${isNew ? '' : `/${editing.id}`}`,
        { method: isNew ? 'POST' : 'PATCH', headers: authHeaders, body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Save failed');
      setEditing(null);
      notify(isNew ? 'Lead added' : 'Lead saved');
      load();
    } catch (e) {
      notify(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    try {
      await fetch(`${API_URL}/api/discovery/leads/${id}`, { method: 'DELETE', headers: authHeaders });
      setEditing(null);
      notify('Lead deleted');
      load();
    } catch {
      notify('Could not delete lead');
    }
  };

  // Verbal consent, stamped server-side with who took it. Kept separate from the
  // ordinary save so it can't be set by accident while editing something else.
  const setConsent = async (lead, granted) => {
    try {
      const res = await fetch(`${API_URL}/api/discovery/leads/${lead.id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          recordSmsConsent: granted,
          ...(granted ? { sms_consent_note: lead.sms_consent_note || null } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not save consent');
      setLeads(ls => ls.map(l => (l.id === lead.id ? data.lead : l)));
      setEditing(e => (e && e.id === lead.id ? { ...e, ...data.lead } : e));
      notify(granted ? 'Verbal consent recorded' : 'Consent cleared');
    } catch (e) {
      notify(e.message);
    }
  };

  // Reset the staleness clock without opening anything. This is the whole point of
  // showing days-since-contact: see the stale row, act on it, clear it.
  const logContact = async (lead) => {
    setLeads(ls => ls.map(l => (l.id === lead.id
      ? { ...l, days_since_contact: 0, has_been_contacted: true } : l)));
    try {
      await fetch(`${API_URL}/api/discovery/leads/${lead.id}`, {
        method: 'PATCH', headers: authHeaders, body: JSON.stringify({ markContacted: true }),
      });
      notify('Contact logged');
    } catch {
      notify('Could not log contact');
      load();
    }
  };

  // Inline status change straight off the row — the most common edit by far, and
  // making people open the panel for it turns a one-click job into four.
  const setStatus = async (lead, status) => {
    setLeads(ls => ls.map(l => (l.id === lead.id ? { ...l, status } : l)));
    try {
      await fetch(`${API_URL}/api/discovery/leads/${lead.id}`, {
        method: 'PATCH', headers: authHeaders, body: JSON.stringify({ status }),
      });
      setCounts(c => ({ ...c, [lead.status]: Math.max(0, (c[lead.status] || 1) - 1), [status]: (c[status] || 0) + 1 }));
    } catch {
      notify('Could not update status');
      load();
    }
  };

  // The lead comes back re-projected with call_scheduled_at and the Zoom link, so the row
  // can be swapped in place rather than refetching the whole list. Status moved to
  // demo_scheduled server-side, so the chip counts shift with it.
  const onBooked = (call, delivery, lead) => {
    const wasStatus = booking?.status;
    setBooking(null);
    if (lead) {
      setLeads(ls => ls.map(l => (l.id === lead.id ? lead : l)));
      if (wasStatus && wasStatus !== 'demo_scheduled') {
        setCounts(c => ({
          ...c,
          [wasStatus]: Math.max(0, (c[wasStatus] || 1) - 1),
          demo_scheduled: (c.demo_scheduled || 0) + 1,
        }));
        setViewCounts(v => ({ ...v, booked: (v.booked || 0) + 1 }));
      }
    } else {
      load();
    }

    // Report what didn't send, not just what did — "Booked, email sent" reads like
    // success while the text silently failed.
    const sent = [delivery?.smsSent && 'text', delivery?.emailSent && 'email'].filter(Boolean);
    const base = delivery?.errors?.length
      ? `Booked${sent.length ? `, ${sent.join(' and ')} sent` : ''} — but ${delivery.errors.join('; ')}`
      : sent.length ? `Booked — confirmation ${sent.join(' and ')} sent` : 'Booked';
    notify(base, onGoToCalls ? { label: 'View in Discovery Calls', onClick: onGoToCalls } : null);
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-3">
          <span>{toast.msg}</span>
          {toast.action && (
            <button
              onClick={() => { toast.action.onClick(); setToast(null); }}
              className="font-semibold text-amber-400 hover:text-amber-300 whitespace-nowrap"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Leads</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {leads.length} prospect{leads.length !== 1 ? 's' : ''} in the pipeline
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...(view === 'outreach' ? EMPTY_OUTREACH : EMPTY) })}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition"
        >
          <Plus className="w-4 h-4" />
          {view === 'outreach' ? 'Log a Business' : 'Add Lead'}
        </button>
      </div>

      {/* Views */}
      <div className="flex gap-1 border-b border-gray-200">
        {VIEWS.map(v => {
          const Icon = v.icon;
          const n = v.id === 'pipeline' ? (viewCounts.total ?? leads.length)
            : v.id === 'booked' ? (viewCounts.booked ?? 0)
            : (viewCounts.outreach ?? 0);
          return (
            <button
              key={v.id}
              onClick={() => { setView(v.id); setStatusFilter('all'); }}
              className={`px-4 py-2.5 text-sm font-semibold relative flex items-center gap-2 transition ${
                view === v.id ? 'text-amber-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {v.label}
              <span className="text-xs opacity-60">{n}</span>
              {view === v.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, company…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[{ id: 'all', label: 'All' }, ...STATUSES].map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === s.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.label}
              <span className="ml-1.5 opacity-60">
                {s.id === 'all' ? leads.length : (counts[s.id] || 0)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading leads…
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16 px-4">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              {leads.length === 0 ? 'No leads yet' : 'No leads match this filter'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {leads.length === 0 ? 'Add your first prospect to start tracking the pipeline' : 'Try a different status or search'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">{view === 'outreach' ? 'Business' : 'Company'}</th>
                    {view === 'booked'
                      ? <th className="px-5 py-3">Meeting</th>
                      : <th className="px-5 py-3">Source</th>}
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Added</th>
                    <th className="px-5 py-3">Last Contact</th>
                    <th className="px-5 py-3">Owner</th>
                    <th className="px-5 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visible.map(l => (
                    // Whole row opens the record. The controls inside it stop
                    // propagation so changing a status or logging contact stays a
                    // one-click job rather than also throwing the editor open.
                    <tr
                      key={l.id}
                      onClick={() => setEditing({ ...l })}
                      className="hover:bg-gray-50 transition cursor-pointer"
                    >
                      <td className="px-5 py-3">
                        <span className="text-blue-600 font-semibold">
                          {l.name || '—'}
                        </span>
                        {l.call_scheduled_at && (
                          <span className="ml-2 text-xs text-amber-600 inline-flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />{fmtDate(l.call_scheduled_at)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {/* stopPropagation sits on the links themselves, not a wrapper.
                            On the wrapper it swallowed clicks anywhere in this column —
                            including the blank space around the text — so the cell
                            looked clickable, highlighted on hover, and did nothing. */}
                        <div className="flex flex-col gap-0.5">
                          {l.email && <a href={`mailto:${l.email}`} onClick={e => e.stopPropagation()} className="text-blue-600 hover:underline truncate max-w-[220px] w-fit">{l.email}</a>}
                          {l.phone && <a href={`tel:${l.phone}`} onClick={e => e.stopPropagation()} className="text-gray-500 hover:underline w-fit">{l.phone}</a>}
                          {!l.email && !l.phone && <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        <div>{l.company || <span className="text-gray-400">—</span>}</div>
                        {(l.city || l.industry) && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {[l.industry, [l.city, l.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </td>
                      {view === 'booked' ? (
                        <td className="px-5 py-3">
                          {l.call_scheduled_at ? (
                            <div className="text-gray-700">
                              <div className="flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
                                {fmtDateTime(l.call_scheduled_at)}
                              </div>
                              {l.call_zoom_url && (
                                <a href={l.call_zoom_url} target="_blank" rel="noreferrer"
                                   onClick={e => e.stopPropagation()}
                                   className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5">
                                  <Video className="w-3 h-3" /> Zoom link
                                </a>
                              )}
                            </div>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                      ) : (
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{label(l.source)}</span>
                        </td>
                      )}
                      <td className="px-5 py-3">
                        {/* Bare select styled as a pill so the common edit stays one click */}
                        <select
                          value={l.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => { e.stopPropagation(); setStatus(l, e.target.value); }}
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${statusMeta(l.status).pill}`}
                        >
                          {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmtDate(l.created_at)}</td>
                      <td className="px-5 py-3">
                        {(() => {
                          const age = contactAge(l);
                          if (!age) return <span className="text-gray-400">—</span>;
                          return (
                            <button
                              onClick={e => { e.stopPropagation(); logContact(l); }}
                              title="Log contact — resets this counter to today"
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap hover:ring-2 hover:ring-amber-400/40 transition ${age.tone}`}
                            >
                              {age.text}
                            </button>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{l.assigned_name || <span className="text-gray-400">Unassigned</span>}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-0.5">
                          {/* Hidden once a call exists — booking again would be a second
                              meeting for the same person, and the backend refuses it. The
                              time is already shown next to the name. */}
                          {!l.call_scheduled_at && (
                            <button
                              onClick={e => { e.stopPropagation(); setBooking(l); }}
                              title="Book a discovery call"
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => setEditing({ ...l })} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {visible.map(l => (
                <button key={l.id} onClick={() => setEditing({ ...l })} className="w-full text-left p-4 active:bg-gray-50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-blue-600 font-semibold">{l.name || '—'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusMeta(l.status).pill}`}>
                      {statusMeta(l.status).label}
                    </span>
                  </div>
                  {l.company && <p className="text-sm text-gray-600 mt-0.5">{l.company}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                    {l.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{l.email}</span>}
                    {l.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{l.phone}</span>}
                    {l.call_scheduled_at && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <CalendarDays className="w-3 h-3" />{fmtDateTime(l.call_scheduled_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(() => {
                      const age = contactAge(l);
                      return age ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${age.tone}`}>
                          <Clock className="w-3 h-3" />{age.text}
                        </span>
                      ) : null;
                    })()}
                    <span className="text-xs text-gray-400">Added {fmtDate(l.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Full-screen editor. The fields outgrew a side panel once the business detail
          went in, and a narrow column made an eight-field form scroll for no reason. */}
      {editing && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-gray-900 truncate">
                {editing.id ? (editing.name || 'Edit Lead') : 'Add Lead'}
              </h3>
              {editing.id && (editing.company || editing.status) && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {[editing.company, statusMeta(editing.status).label].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <button
              onClick={() => setEditing(null)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
              {editing.id && (() => {
                const age = contactAge(editing);
                return age ? (
                  <div className="flex items-center justify-between gap-3 -mt-1 mb-1 p-3 bg-gray-50 rounded-lg flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${age.tone}`}>{age.text}</span>
                      <span className="text-xs text-gray-500">Added {fmtDate(editing.created_at)}</span>
                    </div>
                    <button
                      onClick={() => { logContact(editing); setEditing(v => ({ ...v, days_since_contact: 0, has_been_contacted: true })); }}
                      className="text-xs font-semibold text-amber-700 hover:underline"
                    >
                      Log contact today
                    </button>
                  </div>
                ) : null;
              })()}

              {/* The meeting, front and centre. Booking from here writes a real discovery
                  call rather than just flipping the status to Demo Set, which used to
                  leave the calendar and the Discovery Calls tab none the wiser. */}
              {editing.id && (
                <div className={`rounded-lg border p-4 ${editing.call_scheduled_at
                  ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className={`text-sm font-bold flex items-center gap-1.5 ${
                        editing.call_scheduled_at ? 'text-amber-800' : 'text-gray-700'}`}>
                        <CalendarDays className="w-4 h-4" />
                        {editing.call_scheduled_at ? 'Discovery call booked' : 'No discovery call booked'}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {editing.call_scheduled_at
                          ? `${fmtDateTime(editing.call_scheduled_at)}${editing.call_duration ? ` · ${editing.call_duration} min` : ''}${editing.call_status ? ` · ${label(editing.call_status)}` : ''}`
                          : (editing.email || editing.phone)
                            ? 'Book one and it lands in Discovery Calls straight away.'
                            : 'Add a phone number or email below first so we can send the invite.'}
                      </p>
                      {editing.call_zoom_url && (
                        <a href={editing.call_zoom_url} target="_blank" rel="noreferrer"
                           className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1">
                          <Video className="w-3 h-3" /> Zoom link
                        </a>
                      )}
                    </div>
                    {editing.call_scheduled_at ? (
                      onGoToCalls && (
                        <button
                          onClick={() => { setEditing(null); onGoToCalls(); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-800 hover:bg-amber-100 transition flex-shrink-0"
                        >
                          Open in Discovery Calls
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => { setBooking(editing); setEditing(null); }}
                        disabled={!editing.email && !editing.phone}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" /> Book a call
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Texting a number you got on a cold call needs consent you can evidence.
                  Recorded here with the date and who took it, because "they said yes on
                  the phone" is not a defence without a record of when. */}
              {editing.id && (
                <div className={`rounded-lg border p-4 ${editing.has_sms_consent
                  ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className={`text-sm font-bold flex items-center gap-1.5 ${
                        editing.has_sms_consent ? 'text-green-800' : 'text-gray-700'}`}>
                        <Check className="w-4 h-4" />
                        {editing.has_sms_consent ? 'Verbal SMS consent on file' : 'No SMS consent recorded'}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {editing.has_sms_consent
                          ? `Taken ${fmtDateTime(editing.sms_consent_at)}${editing.sms_consent_by_name ? ` by ${editing.sms_consent_by_name}` : ''}`
                          : 'Read the consent script on the call before texting this number.'}
                      </p>
                    </div>
                    <button
                      onClick={() => setConsent(editing, !editing.has_sms_consent)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0 ${
                        editing.has_sms_consent
                          ? 'text-gray-600 hover:bg-gray-200'
                          : 'bg-green-600 text-white hover:bg-green-700'}`}
                    >
                      {editing.has_sms_consent ? 'Clear' : 'Record verbal consent'}
                    </button>
                  </div>
                  <input
                    value={editing.sms_consent_note || ''}
                    onChange={e => setEditing(v => ({ ...v, sms_consent_note: e.target.value }))}
                    placeholder="Who agreed, and anything they said about it"
                    className="w-full mt-3 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              )}

              {editing.call_scheduled_at && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                  <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" /> Meeting booked
                  </p>
                  <p className="text-amber-700 mt-0.5">{fmtDateTime(editing.call_scheduled_at)}</p>
                  {editing.call_zoom_url && (
                    <a href={editing.call_zoom_url} target="_blank" rel="noreferrer"
                       className="text-blue-600 hover:underline text-xs inline-flex items-center gap-1 mt-1">
                      <Video className="w-3 h-3" /> Join link
                    </a>
                  )}
                </div>
              )}

              {/* Two across now there's room, so the whole record is visible without
                  scrolling. Address, city and state share a row as one address block. */}
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { k: 'name', label: 'Contact Name', required: true },
                  { k: 'contact_title', label: 'Their Role' },
                  { k: 'company', label: 'Business Name' },
                  { k: 'industry', label: 'Industry' },
                  { k: 'email', label: 'Email', type: 'email' },
                  { k: 'phone', label: 'Phone', type: 'tel' },
                  { k: 'website', label: 'Website' },
                  { k: 'address', label: 'Address' },
                ].map(f => (
                  <div key={f.k}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <input
                      type={f.type || 'text'}
                      value={editing[f.k] || ''}
                      onChange={e => setEditing(v => ({ ...v, [f.k]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">City</label>
                  <input
                    value={editing.city || ''}
                    onChange={e => setEditing(v => ({ ...v, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">State</label>
                  <input
                    value={editing.state || ''}
                    onChange={e => setEditing(v => ({ ...v, state: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                  <select
                    value={editing.status || 'new'}
                    onChange={e => setEditing(v => ({ ...v, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Source</label>
                  <select
                    value={editing.source || 'manual'}
                    onChange={e => setEditing(v => ({ ...v, source: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    {SOURCES.map(s => <option key={s} value={s}>{label(s)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Owner</label>
                  <select
                    value={editing.assigned_to || ''}
                    onChange={e => setEditing(v => ({ ...v, assigned_to: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="">Unassigned</option>
                    {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea
                  rows={8}
                  value={editing.notes || ''}
                  onChange={e => setEditing(v => ({ ...v, notes: e.target.value }))}
                  placeholder="What they said, what they run now, what to follow up on..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-y"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white flex-shrink-0">
            <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
              {editing.id ? (
                <button onClick={() => remove(editing.id)} className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              ) : <span />}
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition">
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-60 transition"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing.id ? 'Save' : 'Add Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {booking && (
        <BookCallModal
          lead={booking}
          team={team}
          defaultDate={new Date()}
          authHeaders={authHeaders}
          onClose={() => setBooking(null)}
          onCreated={onBooked}
        />
      )}
    </div>
  );
}
