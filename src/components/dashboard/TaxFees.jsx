import { useState, useEffect } from 'react';
import { X, Percent } from 'lucide-react';

export default function TaxFees({ apiUrl, authFetch }) {
  const [taxRate, setTaxRate] = useState('');
  const [savedTaxRate, setSavedTaxRate] = useState(0);
  const [catalog, setCatalog] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', category: 'fee', amountType: 'fixed', amount: '', taxable: false });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchCatalog();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/invoices/settings`);
      const data = await res.json();
      setSavedTaxRate(data.defaultTaxRate || 0);
      setTaxRate(String(data.defaultTaxRate || 0));
    } catch (e) { console.error(e); }
  };

  const fetchCatalog = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/invoices/catalog`);
      const data = await res.json();
      setCatalog(data.items || []);
    } catch (e) { console.error(e); }
  };

  const saveTaxRate = async () => {
    setSaving(true);
    try {
      await authFetch(`${apiUrl}/api/invoices/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultTaxRate: parseFloat(taxRate) || 0 }),
      });
      const rate = parseFloat(taxRate) || 0;
      setSavedTaxRate(rate);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const addItem = async () => {
    if (!newItem.name.trim() || !newItem.amount) return;
    try {
      const res = await authFetch(`${apiUrl}/api/invoices/catalog`, {
        method: 'POST',
        body: JSON.stringify(newItem),
      });
      const data = await res.json();
      if (res.ok) {
        setCatalog(prev => [...prev, data.item]);
        setNewItem({ name: '', category: 'fee', amountType: 'fixed', amount: '', taxable: false });
      }
    } catch (e) { console.error(e); }
  };

  const deleteItem = async (itemId) => {
    try {
      await authFetch(`${apiUrl}/api/invoices/catalog/${itemId}`, { method: 'DELETE' });
      setCatalog(prev => prev.filter(i => i.id !== itemId));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Taxes & Fees</h2>
        <p className="text-gray-600 mt-1">Configure your default tax rate and saved fees that auto-fill on invoices and bookings.</p>
      </div>

      {/* Sales Tax */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Default Sales Tax Rate</h3>
        <p className="text-sm text-gray-500 mb-4">
          Auto-fills on every new invoice and is applied to booking totals in the booking widget.
          {savedTaxRate > 0 && <span className="ml-1 text-green-600 font-medium">Currently: {savedTaxRate}%</span>}
        </p>
        <div className="flex items-center gap-3">
          <div className="relative w-40">
            <input
              type="number" step="0.01" min="0" max="100"
              value={taxRate}
              onChange={e => setTaxRate(e.target.value)}
              placeholder="e.g. 9.8"
              className="w-full px-4 py-3 pr-8 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-lg font-semibold"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">%</span>
          </div>
          <button
            onClick={saveTaxRate}
            disabled={saving}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : saveSuccess ? '✓ Saved' : 'Save Rate'}
          </button>
        </div>
      </div>

      {/* Saved Fees & Supplies */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Saved Fees & Supplies</h3>
        <p className="text-sm text-gray-500 mb-5">
          These auto-fill on new invoices. Toggle "Taxed" to include in the tax calculation.
        </p>

        {catalog.length > 0 && (
          <div className="mb-5 divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
            {catalog.map(item => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 bg-white">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">{item.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${item.taxable ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                    {item.taxable ? 'Taxed' : 'No Tax'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-700 flex items-center gap-0.5">
                    {item.amount_type === 'percentage'
                      ? <><Percent className="w-3.5 h-3.5" />{parseFloat(item.amount).toFixed(2)}</>
                      : <>${parseFloat(item.amount).toFixed(2)}</>}
                  </span>
                  <button onClick={() => deleteItem(item.id)} className="p-1 text-red-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Add New</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text" placeholder="Name (e.g. Processing Fee)"
              value={newItem.name}
              onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
              className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none bg-white"
            />
            <select value={newItem.category}
              onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none bg-white">
              <option value="fee">Fee</option>
              <option value="supply">Supply</option>
              <option value="other">Other</option>
            </select>
            <select value={newItem.amountType}
              onChange={e => setNewItem(p => ({ ...p, amountType: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none bg-white">
              <option value="fixed">Fixed ($)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {newItem.amountType === 'percentage' ? '%' : '$'}
              </span>
              <input type="number" step="0.01" min="0" placeholder="0.00"
                value={newItem.amount}
                onChange={e => setNewItem(p => ({ ...p, amount: e.target.value }))}
                className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none bg-white"
              />
            </div>
            <button
              type="button"
              onClick={() => setNewItem(p => ({ ...p, taxable: !p.taxable }))}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition whitespace-nowrap ${
                newItem.taxable
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {newItem.taxable ? 'Taxed' : 'No Tax'}
            </button>
            <button onClick={addItem}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-semibold">
              + Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
