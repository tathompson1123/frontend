// SORCE's own sales pipeline. Same shape as the Leads tab a business gets on their
// dashboard, but these rows are people buying SORCE rather than a customer's clients —
// hence sorce_leads rather than the per-business `leads` table.
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Search, X, Loader2, Trash2, Mail, Phone, Building2, User,
  CalendarDays, Pencil, Check,
} from 'lucide-react';

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

const EMPTY = { name: '', email: '', phone: '', company: '', source: 'manual', status: 'new', notes: '', assigned_to: '' };

export default function SorceLeads({ token }) {
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({});
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | { ...lead } | EMPTY-with-no-id
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token]
  );

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/discovery/leads`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) { setLeads(data.leads || []); setCounts(data.counts || {}); }
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
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (!q) return true;
      return [l.name, l.email, l.company, l.phone].some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [leads, statusFilter, search]);

  const save = async () => {
    if (!editing?.name?.trim()) { notify('Name is required'); return; }
    setSaving(true);
    try {
      const isNew = !editing.id;
      const body = {
        name: editing.name, email: editing.email, phone: editing.phone,
        company: editing.company, source: editing.source, status: editing.status,
        notes: editing.notes, assigned_to: editing.assigned_to || null,
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

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
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
          onClick={() => setEditing({ ...EMPTY })}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
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
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Owner</th>
                    <th className="px-5 py-3">Added</th>
                    <th className="px-5 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visible.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3">
                        <button onClick={() => setEditing({ ...l })} className="text-blue-600 font-semibold hover:underline text-left">
                          {l.name || '—'}
                        </button>
                        {l.call_scheduled_at && (
                          <span className="ml-2 text-xs text-amber-600 inline-flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />{fmtDate(l.call_scheduled_at)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        <div className="flex flex-col gap-0.5">
                          {l.email && <a href={`mailto:${l.email}`} className="text-blue-600 hover:underline truncate max-w-[220px]">{l.email}</a>}
                          {l.phone && <a href={`tel:${l.phone}`} className="text-gray-500 hover:underline">{l.phone}</a>}
                          {!l.email && !l.phone && <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{l.company || <span className="text-gray-400">—</span>}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{label(l.source)}</span>
                      </td>
                      <td className="px-5 py-3">
                        {/* Bare select styled as a pill so the common edit stays one click */}
                        <select
                          value={l.status}
                          onChange={e => setStatus(l, e.target.value)}
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${statusMeta(l.status).pill}`}
                        >
                          {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{l.assigned_name || <span className="text-gray-400">Unassigned</span>}</td>
                      <td className="px-5 py-3 text-gray-500">{fmtDate(l.created_at)}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => setEditing({ ...l })} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
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
                    <span>{fmtDate(l.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add / edit panel */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => !saving && setEditing(null)}>
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900">{editing.id ? 'Edit Lead' : 'Add Lead'}</h3>
              <button onClick={() => setEditing(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {[
                { k: 'name', label: 'Name', icon: User, required: true },
                { k: 'email', label: 'Email', icon: Mail, type: 'email' },
                { k: 'phone', label: 'Phone', icon: Phone, type: 'tel' },
                { k: 'company', label: 'Company', icon: Building2 },
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

              <div className="grid grid-cols-2 gap-3">
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

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea
                  rows={5}
                  value={editing.notes || ''}
                  onChange={e => setEditing(v => ({ ...v, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="mt-auto p-5 border-t border-gray-200 flex items-center justify-between gap-3">
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-60 transition"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing.id ? 'Save' : 'Add Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
