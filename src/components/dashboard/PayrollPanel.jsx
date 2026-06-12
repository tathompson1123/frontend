import { useState, useEffect, useCallback, Fragment } from 'react';
import { Users, TrendingUp, Loader, ChevronLeft, ChevronRight, SlidersHorizontal, Plus, Trash2, Save, Clock, ChevronDown } from 'lucide-react';

const fmt$ = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Convert a stored ISO timestamp (UTC) to a value for <input type="datetime-local"> in the
// browser's local time, and back. datetime-local has no timezone, so we shift by the offset.
function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function localInputToISO(localStr) {
  if (!localStr) return null;
  const d = new Date(localStr); // parsed as local time
  return isNaN(d.getTime()) ? null : d.toISOString();
}
function entryDayLabel(iso) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ── Per-employee clock in/out entries + breaks (view + edit) ──
function TimeEntries({ apiUrl, authFetch, employee, weekStart, onChange, showToast }) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [drafts, setDrafts] = useState({});        // { [entryId]: { clockIn, clockOut } }
  const [breakDrafts, setBreakDrafts] = useState({}); // { [breakId]: { startAt, endAt, breakType } }
  const [total, setTotal] = useState(0);
  const [savingId, setSavingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({ clockIn: '', clockOut: '' });
  const [addBreakFor, setAddBreakFor] = useState(null); // entryId
  const [newBreak, setNewBreak] = useState({ startAt: '', endAt: '', breakType: 'paid' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authFetch(`${apiUrl}/api/payroll/time-entries?employeeId=${employee.id}&weekStart=${weekStart}`);
      const d = await r.json();
      if (!d.error) {
        setEntries(d.entries || []);
        setTotal(d.totalWorked || 0);
        const dr = {}, bdr = {};
        for (const e of (d.entries || [])) {
          dr[e.id] = { clockIn: toLocalInput(e.clockIn), clockOut: toLocalInput(e.clockOut) };
          for (const b of (e.breaks || [])) bdr[b.id] = { startAt: toLocalInput(b.startAt), endAt: toLocalInput(b.endAt), breakType: b.breakType };
        }
        setDrafts(dr); setBreakDrafts(bdr);
      }
    } finally { setLoading(false); }
  }, [apiUrl, authFetch, employee.id, weekStart]);
  useEffect(() => { load(); }, [load]);

  const setDraft = (id, key, val) => setDrafts(s => ({ ...s, [id]: { ...s[id], [key]: val } }));
  const setBreakDraft = (id, key, val) => setBreakDrafts(s => ({ ...s, [id]: { ...s[id], [key]: val } }));

  const saveEntry = async (id) => {
    const dft = drafts[id];
    if (!dft) return;
    setSavingId(`e${id}`);
    try {
      const r = await authFetch(`${apiUrl}/api/payroll/time-entries/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clockIn: localInputToISO(dft.clockIn), clockOut: dft.clockOut ? localInputToISO(dft.clockOut) : '' }),
      });
      const d = await r.json();
      if (r.ok) { showToast(`Saved ${employee.name}'s entry`); await load(); onChange && onChange(); }
      else showToast(d.error || 'Could not save entry', 'error');
    } finally { setSavingId(null); }
  };

  const delEntry = async (id) => {
    if (!confirm('Delete this clock entry (and its breaks)?')) return;
    const r = await authFetch(`${apiUrl}/api/payroll/time-entries/${id}`, { method: 'DELETE' });
    if (r.ok) { showToast('Deleted entry'); await load(); onChange && onChange(); }
    else showToast('Could not delete', 'error');
  };

  const addEntry = async () => {
    if (!newEntry.clockIn) { showToast('Set a clock-in time first', 'error'); return; }
    const r = await authFetch(`${apiUrl}/api/payroll/time-entries`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: employee.id, clockIn: localInputToISO(newEntry.clockIn), clockOut: newEntry.clockOut ? localInputToISO(newEntry.clockOut) : null }),
    });
    const d = await r.json();
    if (r.ok) { showToast('Added entry'); setAdding(false); setNewEntry({ clockIn: '', clockOut: '' }); await load(); onChange && onChange(); }
    else showToast(d.error || 'Could not add entry', 'error');
  };

  const saveBreak = async (id) => {
    const dft = breakDrafts[id];
    if (!dft) return;
    setSavingId(`b${id}`);
    try {
      const r = await authFetch(`${apiUrl}/api/payroll/breaks/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startAt: localInputToISO(dft.startAt), endAt: dft.endAt ? localInputToISO(dft.endAt) : '', breakType: dft.breakType }),
      });
      const d = await r.json();
      if (r.ok) { showToast('Saved break'); await load(); onChange && onChange(); }
      else showToast(d.error || 'Could not save break', 'error');
    } finally { setSavingId(null); }
  };

  const delBreak = async (id) => {
    if (!confirm('Delete this break?')) return;
    const r = await authFetch(`${apiUrl}/api/payroll/breaks/${id}`, { method: 'DELETE' });
    if (r.ok) { showToast('Deleted break'); await load(); onChange && onChange(); }
    else showToast('Could not delete break', 'error');
  };

  const addBreak = async (entryId) => {
    if (!newBreak.startAt) { showToast('Set a break start time first', 'error'); return; }
    const r = await authFetch(`${apiUrl}/api/payroll/time-entries/${entryId}/breaks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startAt: localInputToISO(newBreak.startAt), endAt: newBreak.endAt ? localInputToISO(newBreak.endAt) : null, breakType: newBreak.breakType }),
    });
    const d = await r.json();
    if (r.ok) { showToast('Added break'); setAddBreakFor(null); setNewBreak({ startAt: '', endAt: '', breakType: 'paid' }); await load(); onChange && onChange(); }
    else showToast(d.error || 'Could not add break', 'error');
  };

  const inputCls = 'border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-purple-400 outline-none';
  const selCls = 'border border-gray-200 rounded-lg px-1.5 py-1 text-xs focus:ring-2 focus:ring-purple-400 outline-none bg-white';

  return (
    <div className="bg-gray-50 rounded-xl p-3 my-1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-purple-500" /> Clock entries — {employee.name}</p>
        <p className="text-xs text-gray-500">Total worked: <span className="font-semibold text-gray-800">{total}h</span></p>
      </div>

      {employee.clockedOverridden && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mb-2">
          This week's hours are manually overridden ({employee.clockedHours}h). Editing punches/breaks here won't change the payroll total until you clear the override in the "Clocked" box above.
        </p>
      )}

      {loading ? (
        <div className="py-4 flex justify-center"><Loader className="w-4 h-4 animate-spin text-gray-400" /></div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">No clock entries this week.</p>
      ) : (
        <div className="space-y-2">
          {entries.map(e => (
            <div key={e.id} className="bg-white rounded-lg border border-gray-100 px-2.5 py-2">
              {/* Clock in/out row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-gray-400 w-24">{entryDayLabel(e.clockIn)}</span>
                <label className="text-[11px] text-gray-500">In</label>
                <input type="datetime-local" value={drafts[e.id]?.clockIn || ''} onChange={ev => setDraft(e.id, 'clockIn', ev.target.value)} className={inputCls} />
                <label className="text-[11px] text-gray-500">Out</label>
                <input type="datetime-local" value={drafts[e.id]?.clockOut || ''} onChange={ev => setDraft(e.id, 'clockOut', ev.target.value)} className={inputCls} />
                {e.open && <span className="text-[10px] font-semibold text-green-600 bg-green-50 rounded px-1.5 py-0.5">clocked in</span>}
                <span className="text-[11px] text-gray-500">{e.workedHours}h{e.breakHours > 0 ? ` · ${e.breakHours}h break` : ''}</span>
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => saveEntry(e.id)} disabled={savingId === `e${e.id}`} className="flex items-center gap-1 text-[11px] font-semibold text-white bg-purple-600 rounded-lg px-2 py-1 hover:bg-purple-700 disabled:opacity-50">
                    {savingId === `e${e.id}` ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                  </button>
                  <button onClick={() => delEntry(e.id)} className="p-1 text-gray-300 hover:text-red-600" title="Delete entry"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {/* Breaks for this entry */}
              <div className="mt-1.5 pl-4 border-l-2 border-gray-100 space-y-1.5">
                {(e.breaks || []).map(b => (
                  <div key={b.id} className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-gray-400 w-12">Break</span>
                    <select value={breakDrafts[b.id]?.breakType || 'paid'} onChange={ev => setBreakDraft(b.id, 'breakType', ev.target.value)} className={selCls}>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                    <label className="text-[11px] text-gray-500">Start</label>
                    <input type="datetime-local" value={breakDrafts[b.id]?.startAt || ''} onChange={ev => setBreakDraft(b.id, 'startAt', ev.target.value)} className={inputCls} />
                    <label className="text-[11px] text-gray-500">End</label>
                    <input type="datetime-local" value={breakDrafts[b.id]?.endAt || ''} onChange={ev => setBreakDraft(b.id, 'endAt', ev.target.value)} className={inputCls} />
                    {b.open && <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 rounded px-1.5 py-0.5">on break</span>}
                    <div className="ml-auto flex items-center gap-1">
                      <button onClick={() => saveBreak(b.id)} disabled={savingId === `b${b.id}`} className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 border border-gray-200 rounded-lg px-2 py-1 hover:bg-gray-50 disabled:opacity-50">
                        {savingId === `b${b.id}` ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                      </button>
                      <button onClick={() => delBreak(b.id)} className="p-1 text-gray-300 hover:text-red-600" title="Delete break"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}

                {addBreakFor === e.id ? (
                  <div className="flex flex-wrap items-center gap-2 bg-purple-50/60 rounded-lg px-2 py-1.5">
                    <select value={newBreak.breakType} onChange={ev => setNewBreak(s => ({ ...s, breakType: ev.target.value }))} className={selCls}>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                    <label className="text-[11px] text-gray-500">Start</label>
                    <input type="datetime-local" value={newBreak.startAt} onChange={ev => setNewBreak(s => ({ ...s, startAt: ev.target.value }))} className={inputCls} />
                    <label className="text-[11px] text-gray-500">End</label>
                    <input type="datetime-local" value={newBreak.endAt} onChange={ev => setNewBreak(s => ({ ...s, endAt: ev.target.value }))} className={inputCls} />
                    <div className="ml-auto flex items-center gap-1">
                      <button onClick={() => addBreak(e.id)} className="text-[11px] font-semibold text-white bg-purple-600 rounded-lg px-2 py-1 hover:bg-purple-700">Add</button>
                      <button onClick={() => { setAddBreakFor(null); setNewBreak({ startAt: '', endAt: '', breakType: 'paid' }); }} className="text-[11px] font-semibold text-gray-500 px-2 py-1 hover:text-gray-800">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setAddBreakFor(e.id); setNewBreak({ startAt: drafts[e.id]?.clockIn || '', endAt: '', breakType: 'paid' }); }} className="flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-purple-700">
                    <Plus className="w-3 h-3" /> Add break
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add a manual entry */}
      {adding ? (
        <div className="flex flex-wrap items-center gap-2 bg-white rounded-lg border border-purple-200 px-2.5 py-2 mt-2">
          <label className="text-[11px] text-gray-500">In</label>
          <input type="datetime-local" value={newEntry.clockIn} onChange={ev => setNewEntry(s => ({ ...s, clockIn: ev.target.value }))} className={inputCls} />
          <label className="text-[11px] text-gray-500">Out</label>
          <input type="datetime-local" value={newEntry.clockOut} onChange={ev => setNewEntry(s => ({ ...s, clockOut: ev.target.value }))} className={inputCls} />
          <div className="ml-auto flex items-center gap-1">
            <button onClick={addEntry} className="text-[11px] font-semibold text-white bg-purple-600 rounded-lg px-2 py-1 hover:bg-purple-700">Add</button>
            <button onClick={() => { setAdding(false); setNewEntry({ clockIn: '', clockOut: '' }); }} className="text-[11px] font-semibold text-gray-500 px-2 py-1 hover:text-gray-800">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-[11px] font-semibold text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-white mt-2">
          <Plus className="w-3.5 h-3.5" /> Add entry
        </button>
      )}

      <p className="text-[10px] text-gray-400 mt-2">Note: every break (paid or unpaid) currently subtracts from worked hours.</p>
    </div>
  );
}

function mondayOf(d = new Date()) {
  const day = (d.getDay() + 6) % 7;
  const m = new Date(d); m.setDate(d.getDate() - day);
  return m.toISOString().slice(0, 10);
}
function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function label(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function PayrollPanel({ apiUrl, authFetch }) {
  const [weekStart, setWeekStart] = useState(mondayOf());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [edits, setEdits] = useState({}); // { rate_<id>, actual_<id> }
  const [showTiers, setShowTiers] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [savingTiers, setSavingTiers] = useState(false);
  const [expanded, setExpanded] = useState(null); // employee id whose clock entries are open

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authFetch(`${apiUrl}/api/payroll/summary?weekStart=${weekStart}`);
      const d = await r.json();
      if (!d.error) { setData(d); setTiers(d.tiers || []); setEdits({}); }
    } finally { setLoading(false); }
  }, [apiUrl, authFetch, weekStart]);

  useEffect(() => { load(); }, [load]);

  const saveRate = async (emp) => {
    const v = edits[`rate_${emp.id}`];
    if (v === undefined || v === '' || parseFloat(v) === emp.baseRate) return;
    const r = await authFetch(`${apiUrl}/api/payroll/employees/${emp.id}/rate`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rate: v }),
    });
    if (r.ok) { showToast(`Saved ${emp.name}'s rate`); load(); } else showToast('Could not save rate', 'error');
  };

  const saveHours = async (emp) => {
    const v = edits[`hours_${emp.id}`];
    if (v === undefined) return; // untouched
    const r = await authFetch(`${apiUrl}/api/payroll/hours`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: emp.id, weekStart, hours: v }),
    });
    if (r.ok) { showToast(v === '' ? `Reset ${emp.name}'s hours` : `Saved ${emp.name}'s hours`); load(); }
    else showToast('Could not save hours', 'error');
  };

  const saveActual = async (emp) => {
    const v = edits[`actual_${emp.id}`];
    if (v === undefined || v === '') return;
    const r = await authFetch(`${apiUrl}/api/payroll/actual`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: emp.id, weekStart, amount: v }),
    });
    if (r.ok) { showToast(`Saved ${emp.name}'s pay`); load(); } else showToast('Could not save', 'error');
  };

  const saveTiers = async () => {
    setSavingTiers(true);
    try {
      const r = await authFetch(`${apiUrl}/api/payroll/config`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tiers }),
      });
      if (r.ok) { showToast('Efficiency scale saved'); load(); } else showToast('Could not save scale', 'error');
    } finally { setSavingTiers(false); }
  };

  const updateTier = (i, key, val) => setTiers(ts => ts.map((t, idx) => idx === i ? { ...t, [key]: val } : t));
  const addTier = () => setTiers(ts => [...ts, { min: 0, max: 100, delta: 0 }]);
  const removeTier = (i) => setTiers(ts => ts.filter((_, idx) => idx !== i));

  const t = data?.totals;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>{toast.msg}</div>
      )}

      {/* Header + week nav */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h4 className="font-bold text-gray-900 flex items-center gap-2"><Users className="w-4 h-4 text-purple-600" /> Payroll & Efficiency</h4>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekStart(w => addDays(w, -7))} className="p-1.5 text-gray-400 hover:text-gray-700"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-xs font-semibold text-gray-600 w-28 text-center">{label(weekStart)} – {label(addDays(weekStart, 6))}</span>
          <button onClick={() => setWeekStart(w => addDays(w, 7))} className="p-1.5 text-gray-400 hover:text-gray-700"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {loading && !data ? (
        <div className="py-8 flex justify-center"><Loader className="w-5 h-5 animate-spin text-gray-400" /></div>
      ) : !data || data.employees.length === 0 ? (
        <p className="text-sm text-gray-400">No active employees to show. Add team members in Business Setup → Team.</p>
      ) : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="text-[11px] font-semibold text-gray-500 uppercase">Projected (base)</div>
              <p className="text-xl font-bold text-gray-900">{fmt$(t.projected)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-purple-50/50 p-3">
              <div className="text-[11px] font-semibold text-purple-700 uppercase">Actual (you set)</div>
              <p className="text-xl font-bold text-gray-900">{fmt$(t.actual)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-blue-50/50 p-3">
              <div className="text-[11px] font-semibold text-blue-700 uppercase">Revenue (Square)</div>
              <p className="text-xl font-bold text-gray-900">{fmt$(t.revenue)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="text-[11px] font-semibold text-gray-500 uppercase">Payroll % of rev</div>
              <p className={`text-xl font-bold ${t.actualPctOfRevenue > 40 ? 'text-red-600' : 'text-gray-900'}`}>{t.actualPctOfRevenue != null ? `${t.actualPctOfRevenue}%` : '—'}</p>
            </div>
          </div>

          {/* Per-employee table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-3 font-semibold">Employee</th>
                  <th className="py-2 px-2 font-semibold">Base $/hr</th>
                  <th className="py-2 px-2 font-semibold">Clocked</th>
                  <th className="py-2 px-2 font-semibold">Budgeted</th>
                  <th className="py-2 px-2 font-semibold">Efficiency</th>
                  <th className="py-2 px-2 font-semibold">Adj $/hr</th>
                  <th className="py-2 px-2 font-semibold">Projected</th>
                  <th className="py-2 pl-2 font-semibold">Actual pay</th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map(emp => (
                  <Fragment key={emp.id}>
                  <tr className="border-b border-gray-50">
                    <td className="py-2.5 pr-3 font-medium text-gray-900 whitespace-nowrap">
                      <button
                        onClick={() => setExpanded(x => x === emp.id ? null : emp.id)}
                        className="inline-flex items-center gap-1.5 hover:text-purple-700"
                        title="View / edit clock in & out times"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded === emp.id ? 'rotate-180' : ''}`} />
                        {emp.name}
                      </button>
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number" step="0.5"
                        defaultValue={emp.baseRate}
                        onChange={e => setEdits(s => ({ ...s, [`rate_${emp.id}`]: e.target.value }))}
                        onBlur={() => saveRate(emp)}
                        onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-flex items-center gap-1">
                        <input
                          key={`hours-${emp.id}-${emp.clockedHours}`}
                          type="number" step="0.25"
                          defaultValue={emp.clockedHours}
                          onChange={e => setEdits(s => ({ ...s, [`hours_${emp.id}`]: e.target.value }))}
                          onBlur={() => saveHours(emp)}
                          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                          title={emp.clockedOverridden ? `Edited (auto: ${emp.computedHours}h)` : 'Auto from time clock'}
                          className={`w-16 border rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-purple-400 ${emp.clockedOverridden ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}
                        />
                        <span className="text-gray-400 text-xs">h</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-gray-700">{emp.budgetedEarned}h</td>
                    <td className="py-2.5 px-2">
                      {emp.efficiency != null
                        ? <span className={`font-semibold ${emp.efficiency >= 100 ? 'text-green-600' : 'text-red-600'}`}>{emp.efficiency}%</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-2.5 px-2 text-gray-700">{fmt$(emp.adjustedRate)}</td>
                    <td className="py-2.5 px-2 text-gray-700">{fmt$(emp.projected)}</td>
                    <td className="py-2.5 pl-2">
                      <input
                        type="number" step="1"
                        defaultValue={emp.actual ?? ''}
                        placeholder={fmt$(emp.adjustedProjected).replace('$', '')}
                        onChange={e => setEdits(s => ({ ...s, [`actual_${emp.id}`]: e.target.value }))}
                        onBlur={() => saveActual(emp)}
                        onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                        className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    </td>
                  </tr>
                  {expanded === emp.id && (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <TimeEntries apiUrl={apiUrl} authFetch={authFetch} employee={emp} weekStart={weekStart} onChange={load} showToast={showToast} />
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Clocked hours come from the time clock — edit any value to correct it (amber = manually adjusted; clear it to revert). Budgeted = hours of jobs assigned this week. Efficiency = budgeted ÷ clocked, applied via your scale to "Adj $/hr". The Actual pay placeholder is the efficiency-adjusted suggestion — type your real pay-for-performance number to override.
          </p>

          {/* Efficiency scale editor */}
          <div className="mt-4 border-t border-gray-100 pt-3">
            <button onClick={() => setShowTiers(s => !s)} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" /> Efficiency scale {showTiers ? '▲' : '▼'}
            </button>
            {showTiers && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-500">Set how efficiency adjusts hourly pay. Each bracket adds (or subtracts) from the base rate.</p>
                {tiers.map((tier, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <input type="number" value={tier.min} onChange={e => updateTier(i, 'min', e.target.value)} className="w-16 border border-gray-200 rounded-lg px-2 py-1" />
                    <span className="text-gray-400">% to</span>
                    <input type="number" value={tier.max} onChange={e => updateTier(i, 'max', e.target.value)} className="w-16 border border-gray-200 rounded-lg px-2 py-1" />
                    <span className="text-gray-400">% →</span>
                    <span className="text-gray-500">$</span>
                    <input type="number" step="0.5" value={tier.delta} onChange={e => updateTier(i, 'delta', e.target.value)} className="w-16 border border-gray-200 rounded-lg px-2 py-1" />
                    <span className="text-gray-400 text-xs">/hr</span>
                    <button onClick={() => removeTier(i)} className="p-1 text-gray-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button onClick={addTier} className="flex items-center gap-1 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"><Plus className="w-3.5 h-3.5" /> Add bracket</button>
                  <button onClick={saveTiers} disabled={savingTiers} className="flex items-center gap-1 text-xs font-semibold text-white bg-purple-600 rounded-lg px-3 py-1.5 hover:bg-purple-700 disabled:opacity-50"><Save className="w-3.5 h-3.5" /> Save scale</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
