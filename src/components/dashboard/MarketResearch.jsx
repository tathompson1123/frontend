import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, DollarSign, Clock, Loader2, Zap, ArrowRight, Plus, X, Check, CheckSquare, Square } from 'lucide-react';

export default function MarketResearch({ apiUrl, authFetch, user }) {
  // Upsells state
  const [upsellAnalysis, setUpsellAnalysis] = useState(null);
  const [upsellLoading, setUpsellLoading] = useState(false);
  const [upsellError, setUpsellError] = useState('');
  const [loadingUpsellCache, setLoadingUpsellCache] = useState(true);

  // Main services list for the add-to-services modal
  const [mainServices, setMainServices] = useState([]);

  // Add-to-services modal state
  const [modal, setModal] = useState(null); // { upsell, name, price, description, selectedIds, saving, error }

  // Track which upsells have been added (by index)
  const [addedUpsells, setAddedUpsells] = useState(new Set());

  useEffect(() => {
    fetchCachedUpsellReport();
    fetchMainServices();
  }, []);

  const fetchMainServices = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/services`);
      const data = await res.json();
      // Only show non-addon services as potential parents
      setMainServices((data.services || []).filter(s => !s.is_addon));
    } catch { /* ignore */ }
  };

  const fetchCachedUpsellReport = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/market-research/upsells/latest`);
      const data = await res.json();
      if (data.analysis) setUpsellAnalysis(data.analysis);
    } catch (err) { console.error(err); }
    finally { setLoadingUpsellCache(false); }
  };

  const runUpsellAnalysis = async () => {
    setUpsellLoading(true);
    setUpsellError('');
    try {
      const res = await authFetch(`${apiUrl}/api/market-research/upsells`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run analysis');
      setUpsellAnalysis(data.analysis);
    } catch (err) {
      setUpsellError(err.message);
    } finally {
      setUpsellLoading(false);
    }
  };

  const openAddModal = (upsell) => {
    setModal({
      upsell,
      name: upsell.upsellName || '',
      price: upsell.suggestedPrice || '',
      description: upsell.description || '',
      selectedIds: new Set(),
      saving: false,
      error: '',
    });
  };

  const toggleService = (id) => {
    setModal(m => {
      const next = new Set(m.selectedIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...m, selectedIds: next };
    });
  };

  const saveAddon = async () => {
    if (!modal) return;
    if (modal.selectedIds.size === 0) {
      setModal(m => ({ ...m, error: 'Select at least one service to attach this add-on to.' }));
      return;
    }
    setModal(m => ({ ...m, saving: true, error: '' }));

    try {
      // 1. Create the add-on service
      const createRes = await authFetch(`${apiUrl}/api/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modal.name,
          description: modal.description,
          price: parseFloat(modal.price) || 0,
          durationHours: 0,
          isAddon: true,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Failed to create service');
      const newAddonId = createData.service.id;

      // 2. For each selected service, fetch its current addons then append the new one
      for (const serviceId of modal.selectedIds) {
        const addonsRes = await authFetch(`${apiUrl}/api/services/${serviceId}/addons`);
        const addonsData = await addonsRes.json();
        const existingIds = (addonsData.addons || []).map(a => a.id);
        const updatedIds = [...existingIds, newAddonId];
        await authFetch(`${apiUrl}/api/services/${serviceId}/addons`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addonServiceIds: updatedIds }),
        });
      }

      // Mark this upsell as added
      const idx = (upsellAnalysis?.upsells || []).indexOf(modal.upsell);
      if (idx !== -1) setAddedUpsells(s => new Set([...s, idx]));
      setModal(null);
    } catch (err) {
      setModal(m => ({ ...m, saving: false, error: err.message }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Upsell Potential</h2>
        <p className="text-gray-600 mt-1">Discover upsells that increase your revenue per customer</p>
      </div>

      {/* Header + CTA */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Upsell Potential</h3>
            <p className="text-gray-600 mt-1">Discover upsells that increase your revenue per customer</p>
            {upsellAnalysis && (
              <p className="text-xs text-gray-400 mt-2">
                Last updated: {new Date(upsellAnalysis.generatedAt).toLocaleDateString()} at {new Date(upsellAnalysis.generatedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={runUpsellAnalysis}
            disabled={upsellLoading}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {upsellLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
            ) : upsellAnalysis ? (
              <><RefreshCw className="w-5 h-5" /> Re-analyze</>
            ) : (
              <><TrendingUp className="w-5 h-5" /> Create Upsell Plan</>
            )}
          </button>
        </div>
      </div>

      {upsellError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{upsellError}</div>
      )}

      {upsellLoading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing your services...</h3>
          <p className="text-gray-500">Finding upsell opportunities based on your business type and pricing. This may take 15-20 seconds.</p>
        </div>
      )}

      {!upsellLoading && !upsellAnalysis && !loadingUpsellCache && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No upsell analysis yet</h3>
          <p className="text-gray-600">Click "Create Upsell Plan" to discover upsells for every service you offer.</p>
        </div>
      )}

      {/* Upsell Results */}
      {upsellAnalysis && !upsellLoading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <p className="text-sm text-green-600 font-medium mb-1">Est. Monthly Revenue Potential</p>
              <p className="text-3xl font-bold text-green-700">
                ${(upsellAnalysis.totalMonthlyPotential || 0).toLocaleString()}
              </p>
              <p className="text-xs text-green-500 mt-1">If all recommended upsells are implemented</p>
            </div>
            {upsellAnalysis.topRecommendation && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <p className="text-sm text-amber-600 font-medium mb-1 flex items-center gap-1">
                  <Zap className="w-4 h-4" /> Top Recommendation
                </p>
                <p className="text-gray-800 font-medium">{upsellAnalysis.topRecommendation}</p>
              </div>
            )}
          </div>

          {/* Upsell Cards */}
          {(upsellAnalysis.upsells || []).map((upsell, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium mb-1">
                    For: {upsell.forService} {upsell.forServicePrice ? `($${upsell.forServicePrice})` : ''}
                  </p>
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                    {upsell.upsellName}
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="text-green-600">${upsell.suggestedPrice}</span>
                  </h4>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    {upsell.estimatedConversion} conversion
                  </span>
                  {addedUpsells.has(i) ? (
                    <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                      <Check className="w-3.5 h-3.5" /> Added
                    </span>
                  ) : (
                    <button
                      onClick={() => openAddModal(upsell)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow"
                      title="Add to your services"
                    >
                      <Plus className="w-4 h-4" /> Add to Services
                    </button>
                  )}
                </div>
              </div>

              <p className="text-gray-600 mb-4">{upsell.description}</p>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Best Time to Ask
                  </p>
                  <p className="text-sm text-gray-800">{upsell.bestTimeToAsk}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-purple-600 mb-1">Why It Works</p>
                  <p className="text-sm text-gray-800">{upsell.whyItWorks}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-green-600 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Revenue Impact
                  </p>
                  <p className="text-sm text-gray-800 font-medium">{upsell.revenueImpact}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add-to-Services Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add as Service Add-on</h3>
                <p className="text-sm text-gray-500 mt-0.5">This will appear as an add-on customers can select</p>
              </div>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Editable name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Add-on Name</label>
                <input
                  type="text"
                  value={modal.name}
                  onChange={e => setModal(m => ({ ...m, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* Editable price */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={modal.price}
                  onChange={e => setModal(m => ({ ...m, price: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* Service selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Assign to Services
                  <span className="ml-1 text-gray-400 font-normal normal-case">(select one or more)</span>
                </label>
                {mainServices.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-3">No services found. Add services in Business Info first.</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {mainServices.map(svc => {
                      const selected = modal.selectedIds.has(svc.id);
                      return (
                        <button
                          key={svc.id}
                          onClick={() => toggleService(svc.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                            selected
                              ? 'border-green-400 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {selected
                            ? <CheckSquare className="w-5 h-5 text-green-600 shrink-0" />
                            : <Square className="w-5 h-5 text-gray-300 shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${selected ? 'text-green-800' : 'text-gray-800'}`}>{svc.name}</p>
                            {svc.price > 0 && <p className="text-xs text-gray-400">${svc.price}</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {modal.error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{modal.error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAddon}
                disabled={modal.saving || !modal.name.trim()}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {modal.saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Add to Services</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
