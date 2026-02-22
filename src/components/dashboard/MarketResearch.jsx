import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, DollarSign, Clock, Loader2, Zap, ArrowRight } from 'lucide-react';

export default function MarketResearch({ apiUrl, authFetch, user }) {
  // Upsells state
  const [upsellAnalysis, setUpsellAnalysis] = useState(null);
  const [upsellLoading, setUpsellLoading] = useState(false);
  const [upsellError, setUpsellError] = useState('');
  const [loadingUpsellCache, setLoadingUpsellCache] = useState(true);

  useEffect(() => {
    fetchCachedUpsellReport();
  }, []);

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
              <><TrendingUp className="w-5 h-5" /> Analyze Upsell Potential</>
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
          <p className="text-gray-600">Click "Analyze Upsell Potential" to discover upsells for every service you offer.</p>
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
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">
                    For: {upsell.forService} {upsell.forServicePrice ? `($${upsell.forServicePrice})` : ''}
                  </p>
                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {upsell.upsellName}
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="text-green-600">${upsell.suggestedPrice}</span>
                  </h4>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    {upsell.estimatedConversion} conversion
                  </span>
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
    </div>
  );
}
