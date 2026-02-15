import { useState, useEffect } from 'react';
import { Search, TrendingUp, Star, MapPin, Globe, ChevronDown, ChevronUp, RefreshCw, DollarSign, Clock, Loader2, Shield, AlertTriangle, Zap, ArrowRight } from 'lucide-react';

export default function MarketResearch({ apiUrl, authFetch, user }) {
  const [activeTab, setActiveTab] = useState('competitors');

  // Competitors state
  const [competitorReport, setCompetitorReport] = useState(null);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [competitorError, setCompetitorError] = useState('');
  const [expandedCompetitor, setExpandedCompetitor] = useState(null);
  const [loadingCache, setLoadingCache] = useState(true);

  // Upsells state
  const [upsellAnalysis, setUpsellAnalysis] = useState(null);
  const [upsellLoading, setUpsellLoading] = useState(false);
  const [upsellError, setUpsellError] = useState('');
  const [loadingUpsellCache, setLoadingUpsellCache] = useState(true);

  // Load cached reports on mount
  useEffect(() => {
    fetchCachedCompetitorReport();
    fetchCachedUpsellReport();
  }, []);

  const fetchCachedCompetitorReport = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/market-research/competitors/latest`);
      const data = await res.json();
      if (data.report) setCompetitorReport(data.report);
    } catch (err) { console.error(err); }
    finally { setLoadingCache(false); }
  };

  const fetchCachedUpsellReport = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/market-research/upsells/latest`);
      const data = await res.json();
      if (data.analysis) setUpsellAnalysis(data.analysis);
    } catch (err) { console.error(err); }
    finally { setLoadingUpsellCache(false); }
  };

  const runCompetitorAnalysis = async () => {
    setCompetitorLoading(true);
    setCompetitorError('');
    try {
      const res = await authFetch(`${apiUrl}/api/market-research/competitors`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run analysis');
      setCompetitorReport(data.report);
    } catch (err) {
      setCompetitorError(err.message);
    } finally {
      setCompetitorLoading(false);
    }
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

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.3;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < full ? 'text-yellow-400 fill-yellow-400' : i === full && hasHalf ? 'text-yellow-400 fill-yellow-200' : 'text-gray-300'}`} />
        ))}
        <span className="text-sm font-semibold text-gray-700 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const tabs = [
    { id: 'competitors', label: 'Competitors', icon: Search },
    { id: 'revenue', label: 'Revenue Growth', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Market Research</h2>
        <p className="text-gray-600 mt-1">Analyze your competition and discover revenue opportunities</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════ COMPETITORS TAB ═══════════════ */}
      {activeTab === 'competitors' && (
        <div className="space-y-6">
          {/* Header + CTA */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Competitor Analysis</h3>
                <p className="text-gray-600 mt-1">See how you stack up against the top businesses in your area</p>
                {competitorReport && (
                  <p className="text-xs text-gray-400 mt-2">
                    Last updated: {new Date(competitorReport.generatedAt).toLocaleDateString()} at {new Date(competitorReport.generatedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <button
                onClick={runCompetitorAnalysis}
                disabled={competitorLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {competitorLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
                ) : competitorReport ? (
                  <><RefreshCw className="w-5 h-5" /> Re-run Report</>
                ) : (
                  <><Search className="w-5 h-5" /> Run Competitor Report</>
                )}
              </button>
            </div>
          </div>

          {competitorError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{competitorError}</div>
          )}

          {competitorLoading && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing your competition...</h3>
              <p className="text-gray-500">Searching Google, analyzing reviews, and comparing services. This may take 15-30 seconds.</p>
            </div>
          )}

          {!competitorLoading && !competitorReport && !loadingCache && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No competitor report yet</h3>
              <p className="text-gray-600">Click "Run Competitor Report" to find and analyze the top 5 businesses competing with you on Google.</p>
            </div>
          )}

          {/* Report Results */}
          {competitorReport && !competitorLoading && (
            <div className="space-y-4">
              {/* Summary */}
              {competitorReport.summary && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h4 className="font-bold text-gray-900 mb-2">Competitive Landscape</h4>
                  <p className="text-gray-700">{competitorReport.summary}</p>
                </div>
              )}

              {/* Competitor Cards */}
              {competitorReport.competitors.map((comp, i) => (
                <div key={comp.placeId || i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-bold text-gray-400 bg-gray-100 w-7 h-7 rounded-full flex items-center justify-center">#{i + 1}</span>
                          <h4 className="text-lg font-bold text-gray-900">{comp.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            comp.estimatedPricing === '$' ? 'bg-green-100 text-green-700' :
                            comp.estimatedPricing === '$$' ? 'bg-blue-100 text-blue-700' :
                            comp.estimatedPricing === '$$$' ? 'bg-purple-100 text-purple-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{comp.estimatedPricing}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {comp.address}
                          </div>
                          {comp.website && (
                            <a href={comp.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                              <Globe className="w-4 h-4" /> Website
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-6">
                          {renderStars(comp.rating)}
                          <span className="text-sm text-gray-500">{comp.totalReviews} reviews</span>
                        </div>
                        {comp.estimatedServices.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {comp.estimatedServices.map((s, j) => (
                              <span key={j} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setExpandedCompetitor(expandedCompetitor === i ? null : i)}
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-100 transition flex items-center gap-2"
                      >
                        {expandedCompetitor === i ? <><ChevronUp className="w-4 h-4" /> Hide</> : <><ChevronDown className="w-4 h-4" /> Compare to You</>}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Comparison */}
                  {expandedCompetitor === i && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      {/* Comparison Table */}
                      <h5 className="font-bold text-gray-900 mb-4">Side-by-Side Comparison</h5>
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b">
                              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Metric</th>
                              <th className="text-center px-4 py-3 text-xs font-semibold text-blue-600 uppercase">{comp.name}</th>
                              <th className="text-center px-4 py-3 text-xs font-semibold text-amber-600 uppercase">You ({competitorReport.yourStats?.name})</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="px-4 py-3 text-sm font-medium text-gray-700">Google Rating</td>
                              <td className="px-4 py-3 text-center text-sm font-semibold">{comp.rating.toFixed(1)} / 5</td>
                              <td className="px-4 py-3 text-center text-sm font-semibold">—</td>
                            </tr>
                            <tr className="border-b">
                              <td className="px-4 py-3 text-sm font-medium text-gray-700">Review Count</td>
                              <td className="px-4 py-3 text-center text-sm font-semibold">{comp.totalReviews}</td>
                              <td className="px-4 py-3 text-center text-sm font-semibold">—</td>
                            </tr>
                            <tr className="border-b">
                              <td className="px-4 py-3 text-sm font-medium text-gray-700">Services Offered</td>
                              <td className="px-4 py-3 text-center text-sm">{comp.estimatedServices.length} (est.)</td>
                              <td className="px-4 py-3 text-center text-sm">{competitorReport.yourStats?.services?.length || 0}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="px-4 py-3 text-sm font-medium text-gray-700">Pricing Tier</td>
                              <td className="px-4 py-3 text-center text-sm font-semibold">{comp.estimatedPricing}</td>
                              <td className="px-4 py-3 text-center text-sm font-semibold">
                                {competitorReport.yourStats?.avgPrice > 0 ? `$${competitorReport.yourStats.avgPrice} avg` : '—'}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-gray-700">Location</td>
                              <td className="px-4 py-3 text-center text-sm text-gray-600">{comp.address.split(',').slice(0, 2).join(',')}</td>
                              <td className="px-4 py-3 text-center text-sm text-gray-600">
                                {competitorReport.yourStats?.city}, {competitorReport.yourStats?.state}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Advantages & Disadvantages */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h6 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Their Advantages
                          </h6>
                          <div className="space-y-2">
                            {comp.advantages.map((adv, j) => (
                              <div key={j} className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">{adv}</div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h6 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Your Advantages
                          </h6>
                          <div className="space-y-2">
                            {comp.disadvantages.map((dis, j) => (
                              <div key={j} className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">{dis}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ REVENUE GROWTH TAB ═══════════════ */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Header + CTA */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Revenue Growth Potential</h3>
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
                  <><TrendingUp className="w-5 h-5" /> Analyze Revenue Potential</>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No revenue analysis yet</h3>
              <p className="text-gray-600">Click "Analyze Revenue Potential" to discover upsells for every service you offer.</p>
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
      )}
    </div>
  );
}
