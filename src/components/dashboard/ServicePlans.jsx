import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Star, X, RefreshCw } from 'lucide-react';

// Membership plans: "Monthly Detail — $X/month", "Bi-monthly Detail — $Y/month", ...
// A plan is how often + which services each visit does + ONE flat price per billing
// period. Customers are put on a plan from the booking form or online booking; what they
// pay is this price (a Square subscription), not the sum of their visits.

const FREQUENCIES = [
  ['monthly', 'Monthly (1 visit a month)'],
  ['bimonthly', 'Bi-monthly (twice a month)'],
  ['biweekly', 'Bi-weekly (every 2 weeks)'],
  ['weekly', 'Weekly'],
  ['quarterly', 'Quarterly'],
  ['yearly', 'Yearly'],
];

const EMPTY = { name: '', description: '', frequency: 'monthly', price: '', mainIds: [], addonIds: [], showOnline: true };

export default function ServicePlans({ apiUrl, authFetch, services }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | {id?, ...form}
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const mainServices = (services || []).filter((s) => !s.is_addon);
  const addonServices = (services || []).filter((s) => s.is_addon);
  const nameOf = (id) => (services || []).find((s) => s.id === id)?.name;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${apiUrl}/api/service-plans`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load plans');
      setPlans(data.plans || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, authFetch]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setFormError(''); setEditing({ ...EMPTY }); };
  const openEdit = (p) => {
    setFormError('');
    setEditing({
      id: p.id, name: p.name, description: p.description || '', frequency: p.frequency, price: String(p.price),
      mainIds: (p.services?.mains || []).map((s) => s.id), addonIds: (p.services?.addons || []).map((s) => s.id),
      showOnline: p.show_online,
    });
  };

  const toggle = (key, id) => setEditing((f) => ({
    ...f, [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id],
  }));

  const save = async () => {
    setSaving(true);
    setFormError('');
    try {
      const body = {
        name: editing.name, description: editing.description, frequency: editing.frequency, price: editing.price,
        mainServices: editing.mainIds.map((id) => ({ id })), additionalServices: editing.addonIds.map((id) => ({ id })),
        showOnline: editing.showOnline,
      };
      const res = await authFetch(`${apiUrl}/api/service-plans${editing.id ? `/${editing.id}` : ''}`, {
        method: editing.id ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setEditing(null);
      load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const retire = async (p) => {
    if (!window.confirm(`Remove "${p.name}"? Customers already on it keep it; it just stops being offered to new ones.`)) return;
    const res = await authFetch(`${apiUrl}/api/service-plans/${p.id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-400" /> Recurring Plans
          </h2>
          <p className="text-gray-600 mt-1 max-w-2xl">
            A plan is a repeat schedule with <b>one flat price per billing period</b>. Put a customer on a plan and their visits
            go on the calendar automatically while their card on file is charged the plan price once — never per visit.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Plan
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {!loading && plans.length === 0 && !error ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">No plans yet</h3>
          <p className="text-sm text-gray-600 mb-4">Create one for each plan you sell, like “Monthly Detail” or “Bi-monthly Detail”.</p>
          <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">Create your first plan</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((p) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg truncate">{p.name}</h3>
                  <p className="text-sm text-gray-500">{p.frequency_label}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold text-green-700">${p.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">per {p.billing_period}</p>
                </div>
              </div>
              {p.description && <p className="text-sm text-gray-600 mt-2">{p.description}</p>}
              <p className="text-xs text-gray-500 mt-3">
                Each visit: {[...(p.services?.mains || []), ...(p.services?.addons || [])].map((s) => nameOf(s.id) || 'Removed service').join(' + ')}
              </p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {p.subscribers} customer{p.subscribers === 1 ? '' : 's'} · {p.show_online ? 'Offered online' : 'Not offered online'}
                </span>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => retire(p)} className="text-red-600 hover:text-red-800 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !saving && setEditing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">{editing.id ? 'Edit Plan' : 'New Plan'}</h3>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{formError}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan name</label>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Monthly Detail" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (shown to customers)</label>
                <textarea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visits</label>
                  <select value={editing.frequency} onChange={(e) => setEditing({ ...editing, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                    {FREQUENCIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per {editing.frequency === 'yearly' ? 'year' : editing.frequency === 'quarterly' ? 'quarter' : 'month'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input type="number" min="0" step="0.01" value={editing.price}
                      onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                This is the one charge per billing period, whatever number of visits it covers. Changing it later only affects new customers.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Services done on every visit</label>
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-100">
                  {mainServices.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={editing.mainIds.includes(s.id)} onChange={() => toggle('mainIds', s.id)} />
                      {s.name}
                    </label>
                  ))}
                  {mainServices.length === 0 && <p className="p-3 text-sm text-gray-500">Add services first.</p>}
                </div>
              </div>
              {addonServices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Included add-ons (optional)</label>
                  <div className="border border-gray-200 rounded-lg max-h-32 overflow-y-auto divide-y divide-gray-100">
                    {addonServices.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={editing.addonIds.includes(s.id)} onChange={() => toggle('addonIds', s.id)} />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={editing.showOnline} onChange={(e) => setEditing({ ...editing, showOnline: e.target.checked })} />
                Offer this plan in online booking
              </label>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <button onClick={() => setEditing(null)} disabled={saving} className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-700">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {saving ? 'Saving…' : editing.id ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
