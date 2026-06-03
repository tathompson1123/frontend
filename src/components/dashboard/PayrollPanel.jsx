import { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, Loader, ChevronLeft, ChevronRight, SlidersHorizontal, Plus, Trash2, Save } from 'lucide-react';

const fmt$ = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
                  <tr key={emp.id} className="border-b border-gray-50">
                    <td className="py-2.5 pr-3 font-medium text-gray-900 whitespace-nowrap">{emp.name}</td>
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
                    <td className="py-2.5 px-2 text-gray-700">{emp.clockedHours}h</td>
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
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Efficiency = budgeted hours of completed jobs ÷ hours clocked. "Adj $/hr" applies your efficiency scale. The Actual pay placeholder is the efficiency-adjusted suggestion — type your real pay-for-performance number to override.
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
