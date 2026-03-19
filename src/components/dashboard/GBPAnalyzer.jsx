import { useState, useEffect, useMemo } from 'react';
import {
  Search, RefreshCw, Loader2, CheckCircle2, AlertCircle, XCircle,
  TrendingUp, TrendingDown, BarChart3, Target, MapPin, Clock,
  Star, Camera, MessageSquare, FileText, ChevronDown, ChevronUp,
  Activity, Shield, AlertTriangle, ExternalLink, Info, ArrowLeftRight
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps';

// ─── Score Circle Component ───────────────────────────────
function ScoreCircle({ score, label, size = 100, color }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const strokeColor = color || (score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444');

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="#e5e7eb" strokeWidth="6" fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={strokeColor} strokeWidth="6" fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold text-gray-900">{score}</span>
      </div>
      <span className="text-xs font-medium text-gray-600 mt-1 text-center">{label}</span>
    </div>
  );
}

// ─── Priority Badge Component ─────────────────────────────
function PriorityBadge({ priority }) {
  const styles = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    ongoing: 'bg-green-100 text-green-700 border-green-200'
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[priority] || styles.medium}`}>
      {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
    </span>
  );
}

// ─── Cadence Badge Component ──────────────────────────────
function CadenceBadge({ cadence }) {
  if (cadence === 'one-time') return null;
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
      {cadence}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function GBPAnalyzer({ apiUrl, user, authFetch }) {
  const [subTab, setSubTab] = useState('audit');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [googleUrl, setGoogleUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchMode, setSearchMode] = useState('search'); // 'search' or 'url'
  const [profile, setProfile] = useState(null);
  const [audit, setAudit] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [scans, setScans] = useState([]);
  const [monitoring, setMonitoring] = useState(null);
  const [error, setError] = useState(null);
  const [scanKeyword, setScanKeyword] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedScanIdx, setSelectedScanIdx] = useState(0);
  const [mapsApiKey, setMapsApiKey] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // ── Load existing profile + maps key on mount ──
  useEffect(() => {
    loadProfile();
    loadMapsKey();
  }, []);

  async function loadMapsKey() {
    try {
      const res = await authFetch(`${apiUrl}/api/gbp-analyzer/maps-key`);
      const data = await res.json();
      if (data.key) setMapsApiKey(data.key);
    } catch {}
  }

  // ── Business search with debounce ──
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(() => searchBusinesses(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function searchBusinesses(query) {
    setSearching(true);
    try {
      const res = await authFetch(`${apiUrl}/api/gbp-analyzer/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      setShowResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function selectBusiness(result) {
    setShowResults(false);
    setSearchQuery(result.name);
    setAnalyzing(true);
    setError(null);
    try {
      const res = await authFetch(`${apiUrl}/api/gbp-analyzer/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: result.placeId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setProfile(data.profile);
      setAudit(data.audit);
      setActionItems(data.actionItems || []);
      setSubTab('audit');
      loadScans();
      loadMonitoring();
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await authFetch(`${apiUrl}/api/gbp-analyzer/profile`);
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setAudit(data.audit);
        loadActionItems();
        loadScans();
        loadMonitoring();
      }
    } catch (err) {
      console.error('Failed to load GBP profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadActionItems() {
    try {
      const res = await authFetch(`${apiUrl}/api/gbp-analyzer/action-items`);
      const data = await res.json();
      setActionItems(data.actionItems || []);
    } catch {}
  }

  async function loadScans() {
    try {
      const res = await authFetch(`${apiUrl}/api/gbp-analyzer/rank-scans`);
      const data = await res.json();
      setScans(data.scans || []);
    } catch {}
  }

  async function loadMonitoring() {
    try {
      const res = await authFetch(`${apiUrl}/api/gbp-analyzer/monitoring`);
      const data = await res.json();
      setMonitoring(data);
    } catch {}
  }

  async function handleAnalyze() {
    if (!googleUrl.trim()) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await authFetch(`${apiUrl}/api/gbp-analyzer/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleUrl: googleUrl.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setProfile(data.profile);
      setAudit(data.audit);
      setActionItems(data.actionItems || []);
      setSubTab('audit');
      loadScans();
      loadMonitoring();
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleReAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await authFetch(`${apiUrl}/api/gbp-analyzer/re-analyze`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Re-analysis failed');
      setProfile(data.profile);
      setAudit(data.audit);
      setActionItems(data.actionItems || []);
      loadMonitoring();
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleRunScan() {
    if (!scanKeyword.trim()) return;
    setScanning(true);
    setScanError(null);
    try {
      const res = await authFetch(`${apiUrl}/api/gbp-analyzer/rank-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: scanKeyword.trim(), gridSize: 5, radiusMiles: 5 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setScans(prev => [data.scan, ...prev]);
      setSelectedScanIdx(0);
      loadMonitoring();
    } catch (err) {
      setScanError(err.message);
    } finally {
      setScanning(false);
    }
  }

  async function toggleActionStatus(item) {
    const nextStatus = item.status === 'not_started' ? 'in_progress' : item.status === 'in_progress' ? 'completed' : 'not_started';
    try {
      await authFetch(`${apiUrl}/api/gbp-analyzer/action-items/${item.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      setActionItems(prev => prev.map(a => a.id === item.id ? { ...a, status: nextStatus } : a));
    } catch {}
  }

  function toggleExpand(id) {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Filtered action items ──
  const filteredActions = useMemo(() => {
    if (actionFilter === 'all') return actionItems;
    return actionItems.filter(a => a.status === actionFilter);
  }, [actionItems, actionFilter]);

  const actionStats = useMemo(() => {
    const total = actionItems.length;
    const completed = actionItems.filter(a => a.status === 'completed').length;
    return { total, completed, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [actionItems]);

  // ── Selected scan data ──
  const currentScan = scans[selectedScanIdx] || null;

  // ── Rank color helper ──
  function getRankColor(rank) {
    if (rank === null) return '#9ca3af';
    if (rank <= 3) return '#22c55e';
    if (rank <= 7) return '#eab308';
    if (rank <= 10) return '#f97316';
    return '#ef4444';
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  // ── No profile yet — show analysis input ──
  if (!profile) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Analyze Your Google Business Profile</h3>
          <p className="text-gray-600 mb-6">
            Search for your business to get a full audit, optimization score, and action plan.
          </p>

          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit mx-auto">
            <button
              onClick={() => setSearchMode('search')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${searchMode === 'search' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
            >
              Search by Name
            </button>
            <button
              onClick={() => setSearchMode('url')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${searchMode === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
            >
              Paste URL
            </button>
          </div>

          {searchMode === 'search' ? (
            <div className="relative text-left">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowResults(true); }}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                    placeholder="Type your business name..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  {searching && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute right-3 top-3.5" />
                  )}
                </div>
              </div>

              {/* Autocomplete dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {searchResults.map((r, i) => (
                    <button
                      key={i}
                      onMouseDown={() => selectBusiness(r)}
                      className="w-full text-left px-4 py-3 hover:bg-amber-50 border-b border-gray-100 last:border-b-0 transition"
                    >
                      <div className="font-semibold text-sm text-gray-900">{r.name}</div>
                      <div className="text-xs text-gray-500">{r.address}</div>
                      {r.category && <span className="text-xs text-amber-600">{r.category}</span>}
                    </button>
                  ))}
                </div>
              )}

              {analyzing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-amber-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Analyzing profile...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={googleUrl}
                onChange={e => setGoogleUrl(e.target.value)}
                placeholder="https://www.google.com/maps/place/..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
              />
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !googleUrl.trim()}
                className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {analyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Profile exists — show full dashboard ──
  return (
    <div className="space-y-6">
      {/* Business header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{profile.business_name}</h3>
            <p className="text-sm text-gray-500">{profile.primary_category} &middot; {profile.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setProfile(null);
              setAudit(null);
              setActionItems([]);
              setScans([]);
              setMonitoring(null);
              setSearchQuery('');
              setGoogleUrl('');
              setError(null);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Select Different Business
          </button>
          <button
            onClick={handleReAnalyze}
            disabled={analyzing}
            className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 flex items-center gap-2"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Re-analyze
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'audit', label: 'Audit Results', icon: BarChart3 },
          { id: 'rankings', label: 'Map Rankings', icon: Target },
          { id: 'actions', label: 'Action Plan', icon: FileText },
          { id: 'monitoring', label: 'Monitoring', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition flex items-center justify-center gap-2 ${
              subTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          AUDIT RESULTS TAB
          ═══════════════════════════════════════════════════════ */}
      {subTab === 'audit' && audit && (
        <div className="space-y-6">
          {/* Score overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Optimization Score</h4>
            <div className="grid grid-cols-5 gap-4">
              <div className="relative flex flex-col items-center">
                <ScoreCircle score={audit.overallScore} label="Overall" size={90} />
              </div>
              <div className="relative flex flex-col items-center">
                <ScoreCircle score={audit.categoryScores?.completeness || 0} label="Completeness" size={80} />
              </div>
              <div className="relative flex flex-col items-center">
                <ScoreCircle score={audit.categoryScores?.contentMedia || 0} label="Content" size={80} />
              </div>
              <div className="relative flex flex-col items-center">
                <ScoreCircle score={audit.categoryScores?.reviews || 0} label="Reviews" size={80} />
              </div>
              <div className="relative flex flex-col items-center">
                <ScoreCircle score={audit.categoryScores?.engagement || 0} label="Engagement" size={80} />
              </div>
            </div>
          </div>

          {/* Good vs Needs Improvement */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* What's Good */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">What&apos;s Good</h4>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{audit.goodItems?.length || 0}</span>
              </div>
              <div className="space-y-3">
                {(audit.goodItems || []).map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                        <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{item.value}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{item.note}</p>
                    </div>
                  </div>
                ))}
                {(audit.goodItems || []).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No items detected yet.</p>
                )}
              </div>
            </div>

            {/* Needs Improvement */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h4 className="font-semibold text-gray-900">Needs Improvement</h4>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{audit.improvementItems?.length || 0}</span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {(audit.improvementItems || []).map((item, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                      <PriorityBadge priority={item.priority} />
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Current: {item.currentStatus}</p>
                    <p className="text-xs text-gray-700">{item.recommendation}</p>
                  </div>
                ))}
                {(audit.improvementItems || []).length === 0 && (
                  <p className="text-sm text-gray-500 italic">Everything looks great!</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900">{profile.average_rating || '-'}</div>
              <div className="text-xs text-gray-500">Rating</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <MessageSquare className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900">{profile.total_reviews || 0}</div>
              <div className="text-xs text-gray-500">Reviews</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <Camera className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900">{profile.total_photos || 0}</div>
              <div className="text-xs text-gray-500">Photos</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <Clock className="w-5 h-5 text-gray-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900">{profile.hours_complete ? 'Yes' : 'No'}</div>
              <div className="text-xs text-gray-500">Hours Complete</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MAP RANKINGS TAB
          ═══════════════════════════════════════════════════════ */}
      {subTab === 'rankings' && (
        <div className="space-y-6">
          {/* Scan controls */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Run Ranking Grid Scan</h4>
            <p className="text-sm text-gray-600 mb-4">
              Enter a keyword your customers search for. We&apos;ll check your ranking at 25 points around your location.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={scanKeyword}
                onChange={e => setScanKeyword(e.target.value)}
                placeholder="e.g. plumber near me, auto detailing, landscaping"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                onKeyDown={e => e.key === 'Enter' && handleRunScan()}
              />
              <button
                onClick={handleRunScan}
                disabled={scanning || !scanKeyword.trim()}
                className="px-6 py-2.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
              >
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                {scanning ? 'Scanning...' : 'Run Scan'}
              </button>
            </div>
            {scanError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {scanError}
              </div>
            )}
          </div>

          {/* Scan results */}
          {scans.length > 0 && (
            <>
              {/* Scan selector + stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900">Scan Results</h4>
                    {scans.length > 1 && (
                      <select
                        value={selectedScanIdx}
                        onChange={e => setSelectedScanIdx(parseInt(e.target.value))}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                      >
                        {scans.map((s, i) => (
                          <option key={s.id} value={i}>
                            {s.keyword} — {new Date(s.created_at).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {currentScan && (
                  <>
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-gray-900">{currentScan.average_rank || '-'}</div>
                        <div className="text-xs text-gray-500">Avg Rank</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-green-600">{currentScan.top3_count}</div>
                        <div className="text-xs text-gray-500">In Top 3</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-gray-900">{currentScan.total_points}</div>
                        <div className="text-xs text-gray-500">Points Scanned</div>
                      </div>
                    </div>

                    {/* Map */}
                    {profile.lat && profile.lng && mapsApiKey && (
                      <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: 400 }}>
                        <APIProvider apiKey={mapsApiKey}>
                          <Map
                            defaultCenter={{ lat: profile.lat, lng: profile.lng }}
                            defaultZoom={12}
                            gestureHandling="cooperative"
                            mapId="gbp-ranking-grid"
                            style={{ width: '100%', height: '100%' }}
                          >
                            {/* Business location marker */}
                            <AdvancedMarker position={{ lat: profile.lat, lng: profile.lng }}>
                              <div className="flex items-center justify-center w-8 h-8 bg-amber-500 rounded-full border-3 border-white shadow-lg"
                                title="Your Business">
                                <MapPin className="w-4 h-4 text-white" />
                              </div>
                            </AdvancedMarker>
                            {/* Grid point markers */}
                            {(currentScan.grid_points || []).map((point, i) => (
                              <AdvancedMarker
                                key={i}
                                position={{ lat: point.lat, lng: point.lng }}
                                onClick={() => setHoveredPoint(hoveredPoint === i ? null : i)}
                              >
                                <div
                                  className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-white shadow-md text-white text-xs font-bold cursor-pointer"
                                  style={{ backgroundColor: getRankColor(point.rank) }}
                                >
                                  {point.rank || '-'}
                                </div>
                              </AdvancedMarker>
                            ))}
                            {/* Info window for clicked point */}
                            {hoveredPoint !== null && currentScan.grid_points[hoveredPoint] && (
                              <InfoWindow
                                position={{ lat: currentScan.grid_points[hoveredPoint].lat, lng: currentScan.grid_points[hoveredPoint].lng }}
                                onCloseClick={() => setHoveredPoint(null)}
                              >
                                <div className="p-1">
                                  <strong className="text-sm">Rank: {currentScan.grid_points[hoveredPoint].rank || 'Not found'}</strong>
                                  {currentScan.grid_points[hoveredPoint].competitors?.length > 0 && (
                                    <div className="text-xs mt-1 text-gray-600">
                                      {currentScan.grid_points[hoveredPoint].competitors.map((c, ci) => (
                                        <div key={ci}>#{c.rank} {c.name}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </InfoWindow>
                            )}
                          </Map>
                        </APIProvider>
                      </div>
                    )}
                    {profile.lat && profile.lng && !mapsApiKey && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center" style={{ height: 400 }}>
                        <p className="text-sm text-gray-500">Google Maps API key not configured. Add GOOGLE_PLACES_API_KEY to your environment.</p>
                      </div>
                    )}

                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Rank 1-3 (Map Pack)</div>
                      <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span> Rank 4-7</div>
                      <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span> Rank 8-10</div>
                      <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Rank 11-20</div>
                      <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400 inline-block"></span> Not Found</div>
                    </div>
                  </>
                )}
              </div>

              {/* Rank trend chart (simple SVG) */}
              {scans.length >= 2 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Average Rank Trend</h4>
                  <div className="h-40">
                    <svg viewBox="0 0 400 150" className="w-full h-full">
                      {(() => {
                        const sorted = [...scans].reverse();
                        const ranks = sorted.map(s => s.average_rank || 20);
                        const maxRank = 20;
                        const w = 400 / (ranks.length - 1 || 1);
                        const points = ranks.map((r, i) => `${i * w},${(r / maxRank) * 130 + 10}`);
                        return (
                          <>
                            {/* Grid lines */}
                            <line x1="0" y1="10" x2="400" y2="10" stroke="#e5e7eb" strokeDasharray="4" />
                            <line x1="0" y1="49" x2="400" y2="49" stroke="#e5e7eb" strokeDasharray="4" />
                            <line x1="0" y1="75" x2="400" y2="75" stroke="#22c55e" strokeDasharray="4" opacity="0.3" />
                            <text x="402" y="14" fontSize="10" fill="#9ca3af">1</text>
                            <text x="402" y="53" fontSize="10" fill="#9ca3af">7</text>
                            <text x="402" y="79" fontSize="10" fill="#22c55e">3</text>
                            {/* Line */}
                            <polyline
                              fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              points={points.join(' ')}
                            />
                            {/* Dots */}
                            {ranks.map((r, i) => (
                              <circle key={i} cx={i * w} cy={(r / maxRank) * 130 + 10} r="4" fill="#d97706" />
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                    <p className="text-xs text-gray-500 text-center mt-1">Lower rank = better (1 is best). Green line = top 3 threshold.</p>
                  </div>
                </div>
              )}
            </>
          )}

          {scans.length === 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
              <Target className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-700 mb-1">No scans yet</h4>
              <p className="text-sm text-gray-500">Enter a keyword above and run your first ranking grid scan.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ACTION PLAN TAB
          ═══════════════════════════════════════════════════════ */}
      {subTab === 'actions' && (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Optimization Progress</h4>
              <span className="text-sm font-medium text-gray-600">{actionStats.completed} of {actionStats.total} completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${actionStats.rate}%` }}
              ></div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'not_started', label: 'To Do' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActionFilter(f.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  actionFilter === f.id
                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Action items grouped by priority */}
          {['critical', 'high', 'medium', 'ongoing'].map(priority => {
            const items = filteredActions.filter(a => a.priority === priority);
            if (items.length === 0) return null;

            const headerColors = {
              critical: 'text-red-700 bg-red-50 border-red-200',
              high: 'text-orange-700 bg-orange-50 border-orange-200',
              medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
              ongoing: 'text-green-700 bg-green-50 border-green-200'
            };

            const headerLabels = {
              critical: 'Critical — Do Immediately',
              high: 'High Priority — This Week',
              medium: 'Medium Priority — Within 2 Weeks',
              ongoing: 'Ongoing — Regular Cadence'
            };

            return (
              <div key={priority} className="space-y-2">
                <div className={`px-4 py-2 rounded-lg border text-sm font-semibold ${headerColors[priority]}`}>
                  {headerLabels[priority]}
                </div>
                {items.map(item => (
                  <div key={item.id} className={`bg-white rounded-lg border border-gray-200 p-4 transition ${item.status === 'completed' ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleActionStatus(item)}
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
                          item.status === 'completed' ? 'bg-green-500 border-green-500 text-white'
                          : item.status === 'in_progress' ? 'bg-amber-500 border-amber-500 text-white'
                          : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {item.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                        {item.status === 'in_progress' && <div className="w-2 h-2 bg-white rounded-full" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => toggleExpand(item.id)} className="flex items-center gap-1 hover:opacity-80 transition">
                            <span className={`text-sm font-semibold ${item.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {item.title}
                            </span>
                            {expandedItems.has(item.id) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </button>
                          <CadenceBadge cadence={item.cadence} />
                        </div>
                        {expandedItems.has(item.id) && (
                          <div className="mt-2 space-y-2">
                            <p className="text-sm text-gray-700">{item.description}</p>
                            {item.why_it_matters && (
                              <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-700">{item.why_it_matters}</p>
                              </div>
                            )}
                            {item.due_date && (
                              <p className="text-xs text-gray-500">Due: {new Date(item.due_date).toLocaleDateString()}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {filteredActions.length === 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-700">
                {actionFilter === 'all' ? 'No action items yet' : 'No items in this category'}
              </h4>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MONITORING TAB
          ═══════════════════════════════════════════════════════ */}
      {subTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Health status */}
          {monitoring && (
            <>
              <div className={`rounded-xl border-2 p-6 ${
                monitoring.health === 'healthy' ? 'bg-green-50 border-green-200'
                : monitoring.health === 'needs_attention' ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  {monitoring.health === 'healthy' ? (
                    <Shield className="w-8 h-8 text-green-600" />
                  ) : monitoring.health === 'needs_attention' ? (
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">
                      {monitoring.health === 'healthy' ? 'Profile Health: Healthy'
                        : monitoring.health === 'needs_attention' ? 'Profile Health: Needs Attention'
                        : 'Profile Health: Critical'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {monitoring.health === 'healthy'
                        ? 'Your profile is in good shape. Keep up the ongoing tasks.'
                        : `${monitoring.alerts?.length || 0} issue(s) detected that need your attention.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Metric cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Last Analysis</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {monitoring.profile?.lastAnalyzedAt
                      ? `${Math.floor((Date.now() - new Date(monitoring.profile.lastAnalyzedAt).getTime()) / (1000 * 60 * 60 * 24))}d ago`
                      : '-'
                    }
                  </div>
                  <button onClick={handleReAnalyze} className="text-xs text-amber-600 hover:underline mt-1">
                    Re-analyze now
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-gray-500">Reviews</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {monitoring.profile?.totalReviews || 0}
                  </div>
                  <div className="text-xs text-gray-500">
                    {monitoring.profile?.averageRating ? `${monitoring.profile.averageRating} ★ avg` : ''}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-gray-500">Avg Map Rank</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {monitoring.ranking?.latest?.average_rank || '-'}
                  </div>
                  {monitoring.ranking?.trend && (
                    <div className={`text-xs flex items-center gap-1 ${monitoring.ranking.trend.rankChange > 0 ? 'text-green-600' : monitoring.ranking.trend.rankChange < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {monitoring.ranking.trend.rankChange > 0 ? <TrendingUp className="w-3 h-3" /> : monitoring.ranking.trend.rankChange < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                      {monitoring.ranking.trend.rankChange > 0 ? `+${monitoring.ranking.trend.rankChange.toFixed(1)} improvement` : monitoring.ranking.trend.rankChange < 0 ? `${monitoring.ranking.trend.rankChange.toFixed(1)} decline` : 'No change'}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-500">Action Items</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {monitoring.actionItems?.completionRate || 0}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {monitoring.actionItems?.completed || 0}/{monitoring.actionItems?.total || 0} completed
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {monitoring.alerts && monitoring.alerts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Alerts</h4>
                  <div className="space-y-3">
                    {monitoring.alerts.map((alert, i) => (
                      <div key={i} className={`p-4 rounded-lg border ${
                        alert.severity === 'critical' ? 'bg-red-50 border-red-200'
                        : alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start gap-3">
                          {alert.severity === 'critical' ? (
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          ) : alert.severity === 'warning' ? (
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900">{alert.title}</h5>
                            <p className="text-xs text-gray-600 mt-0.5">{alert.description}</p>
                            <p className="text-xs font-medium text-gray-700 mt-1">Action: {alert.action}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No alerts */}
              {(!monitoring.alerts || monitoring.alerts.length === 0) && (
                <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-800">No alerts</h4>
                  <p className="text-sm text-green-600">Everything is looking good. Keep up the great work!</p>
                </div>
              )}
            </>
          )}

          {!monitoring && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
              <Activity className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-700">Loading monitoring data...</h4>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
