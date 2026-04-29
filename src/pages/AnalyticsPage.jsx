import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, DollarSign, TrendingDown, TrendingUp,
  LogOut, RefreshCw, Search, MessageCircle, Phone, ChevronUp, ChevronDown, Minus,
  CheckCircle, XCircle, ShieldCheck
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PLAN_COLORS = {
  scale:  'bg-purple-500/15 text-purple-300 border-purple-500/30',
  pro:    'bg-blue-500/15   text-blue-300   border-blue-500/30',
  expert: 'bg-blue-500/15   text-blue-300   border-blue-500/30',
  basic:  'bg-gray-500/15   text-gray-300   border-gray-500/30',
};

const PLAN_LABEL = { scale: 'Scale', pro: 'Pro', expert: 'Expert', basic: 'Basic' };

function fmt$(n) { return '$' + n.toFixed(2); }
function fmtN(n) { return n.toLocaleString(); }

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <Minus className="w-3 h-3 opacity-30" />;
  return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortField, setSortField]   = useState('created_at');
  const [sortDir, setSortDir]       = useState('desc');
  const [verifyRequests, setVerifyRequests] = useState([]);
  const [actioningId, setActioningId] = useState(null);

  const token = sessionStorage.getItem('analyticsToken');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/analytics/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem('analyticsToken');
        navigate('/analytics/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
    // Fetch verification requests in parallel (non-blocking)
    try {
      const vr = await fetch(`${API_URL}/api/analytics/verification-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());
      setVerifyRequests(vr.requests || []);
    } catch { /* ignore */ }
  }, [token, navigate]);

  const approveVerification = async (id) => {
    setActioningId(id);
    try {
      await fetch(`${API_URL}/api/analytics/verification-requests/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } finally { setActioningId(null); }
  };

  const rejectVerification = async (id) => {
    const notes = prompt('Rejection reason (optional):');
    if (notes === null) return;
    setActioningId(id);
    try {
      await fetch(`${API_URL}/api/analytics/verification-requests/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      fetchData();
    } finally { setActioningId(null); }
  };

  useEffect(() => {
    if (!token) { navigate('/analytics/login'); return; }
    fetchData();
  }, [token, navigate, fetchData]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('analyticsToken');
    navigate('/analytics/login');
  };

  const users = data?.users || [];
  const filtered = users
    .filter(u => {
      const q = search.toLowerCase();
      return (!q || u.email.toLowerCase().includes(q) || u.business_name.toLowerCase().includes(q) || u.name.toLowerCase().includes(q))
          && (planFilter === 'all' || u.plan === planFilter);
    })
    .sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (typeof av === 'string') av = av.toLowerCase(), bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1  : -1;
      return 0;
    });

  const th = (label, field) => (
    <th
      onClick={() => handleSort(field)}
      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-200 select-none whitespace-nowrap"
    >
      <span className="flex items-center gap-1">
        {label} <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </span>
    </th>
  );

  const totals = data?.totals;
  const breakdown = data?.plan_breakdown || {};

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">SORCE Analytics</h1>
            {data?.generated_at && (
              <p className="text-gray-500 text-xs mt-0.5">
                Updated {new Date(data.generated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading && !data && (
          <div className="text-center py-32 text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
            Loading analytics data...
          </div>
        )}

        {totals && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={Users} label="Total Users" color="bg-blue-500/20 text-blue-400"
                value={fmtN(totals.user_count)}
                sub={`${Object.entries(breakdown).map(([k,v]) => `${v} ${PLAN_LABEL[k] || k}`).join(' · ')}`}
              />
              <KpiCard
                icon={DollarSign} label="Monthly Revenue (MRR)" color="bg-green-500/20 text-green-400"
                value={fmt$(totals.revenue)}
                sub={`${fmtN(totals.user_count)} paying accounts`}
              />
              <KpiCard
                icon={TrendingDown} label="Est. Costs This Month" color="bg-orange-500/20 text-orange-400"
                value={fmt$(totals.total_cost)}
                sub={`${fmtN(totals.sms_sent_month)} SMS · ${fmtN(totals.chat_convos_month)} chats`}
              />
              <KpiCard
                icon={TrendingUp} label="Net Margin" color={totals.margin >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}
                value={fmt$(totals.margin)}
                sub={totals.revenue > 0 ? `${((totals.margin / totals.revenue) * 100).toFixed(1)}% margin` : '—'}
              />
            </div>

            {/* Plan Breakdown Pills */}
            <div className="flex flex-wrap gap-2">
              {['all', 'scale', 'pro', 'expert', 'basic'].map(p => (
                <button
                  key={p}
                  onClick={() => setPlanFilter(p)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                    planFilter === p
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {p === 'all' ? `All (${users.length})` : `${PLAN_LABEL[p] || p} (${breakdown[p] || 0})`}
                </button>
              ))}

              <div className="ml-auto relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                />
              </div>
            </div>

            {/* Ad Platform Verification Requests */}
            {verifyRequests.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">Ad Platform Verification Requests</h2>
                  <span className="ml-auto text-xs text-gray-500">
                    {verifyRequests.filter(r => r.status === 'pending').length} pending
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-800">
                      <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
                        <th className="px-3 py-2">User</th>
                        <th className="px-3 py-2">Platform</th>
                        <th className="px-3 py-2">Account Email</th>
                        <th className="px-3 py-2">Requested</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {verifyRequests.map(r => (
                        <tr key={r.id} className="hover:bg-gray-800/50">
                          <td className="px-3 py-3">
                            <div className="text-white font-medium">{r.business_name || r.user_name || '—'}</div>
                            <div className="text-gray-500 text-xs">{r.user_email}</div>
                          </td>
                          <td className="px-3 py-3 text-gray-300">
                            {r.platform === 'google_ads' ? 'Google Ads' : r.platform === 'google_lsa' ? 'Google LSA' : r.platform}
                          </td>
                          <td className="px-3 py-3 text-gray-300 font-mono text-xs">{r.email}</td>
                          <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {new Date(r.requested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </td>
                          <td className="px-3 py-3">
                            {r.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30">Pending</span>
                            )}
                            {r.status === 'verified' && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Verified</span>
                            )}
                            {r.status === 'rejected' && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/15 text-red-300 border border-red-500/30">Rejected</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {r.status === 'pending' && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => approveVerification(r.id)}
                                  disabled={actioningId === r.id}
                                  className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-medium disabled:opacity-50"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  {actioningId === r.id ? 'Working…' : 'Mark Verified'}
                                </button>
                                <button
                                  onClick={() => rejectVerification(r.id)}
                                  disabled={actioningId === r.id}
                                  className="flex items-center gap-1 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-xs font-medium disabled:opacity-50"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </div>
                            )}
                            {r.status === 'verified' && r.verified_at && (
                              <span className="text-xs text-gray-500">{new Date(r.verified_at).toLocaleDateString()}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* User Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-800 bg-gray-900/60">
                    <tr>
                      {th('Business / User', 'business_name')}
                      {th('Plan', 'plan')}
                      {th('MRR', 'revenue')}
                      {th('SMS / mo', 'sms_sent_month')}
                      {th('SMS Cost', 'sms_cost')}
                      {th('Chats / mo', 'chat_convos_month')}
                      {th('Claude Cost', 'claude_cost_month')}
                      {th('Total Cost', 'total_cost')}
                      {th('Margin', 'margin')}
                      {th('Status', 'is_trialing')}
                      {th('Joined', 'created_at')}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                          No users match your filters
                        </td>
                      </tr>
                    ) : filtered.map(u => (
                      <tr key={u.id} className="hover:bg-gray-800/40 transition">
                        {/* Business / User */}
                        <td className="px-4 py-3">
                          <p className="font-medium text-white truncate max-w-[180px]">{u.business_name}</p>
                          <p className="text-gray-500 text-xs truncate max-w-[180px]">{u.email}</p>
                        </td>

                        {/* Plan */}
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${PLAN_COLORS[u.plan] || PLAN_COLORS.basic}`}>
                            {PLAN_LABEL[u.plan] || u.plan}
                          </span>
                        </td>

                        {/* MRR */}
                        <td className="px-4 py-3 text-green-400 font-medium">{fmt$(u.revenue)}</td>

                        {/* SMS / mo */}
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-gray-200">
                            <Phone className="w-3.5 h-3.5 text-gray-500" />
                            {fmtN(u.sms_sent_month)}
                          </span>
                          <span className="text-gray-500 text-xs">{fmtN(u.sms_sent_total)} total</span>
                        </td>

                        {/* SMS Cost */}
                        <td className="px-4 py-3 text-orange-300 text-xs">{fmt$(u.sms_cost + u.ai_sms_cost)}</td>

                        {/* Chats / mo */}
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-gray-200">
                            <MessageCircle className="w-3.5 h-3.5 text-gray-500" />
                            {fmtN(u.chat_convos_month)}
                          </span>
                          <span className="text-gray-500 text-xs">{fmtN(u.chat_convos_total)} total</span>
                        </td>

                        {/* Claude Cost (real tracked) */}
                        <td className="px-4 py-3 text-orange-300 text-xs">
                          {fmt$(u.claude_cost_month)}
                          {u.claude_cost_month === 0 && <span className="block text-gray-600 text-[10px]">no data yet</span>}
                        </td>

                        {/* Total Cost */}
                        <td className="px-4 py-3 font-medium text-orange-400">{fmt$(u.total_cost)}</td>

                        {/* Margin */}
                        <td className="px-4 py-3 font-semibold">
                          <span className={u.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {fmt$(u.margin)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {u.is_canceling ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/15 text-red-300 border border-red-500/30">Canceling</span>
                          ) : u.is_trialing ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30">Trial</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Active</span>
                          )}
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              {filtered.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
                  <span>Showing {filtered.length} of {users.length} users</span>
                  <span>
                    Filtered MRR: <span className="text-green-400 font-medium">{fmt$(filtered.reduce((s,u)=>s+u.revenue,0))}</span>
                    {' · '}
                    Filtered Cost: <span className="text-orange-400 font-medium">{fmt$(filtered.reduce((s,u)=>s+u.total_cost,0))}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Cost breakdown note */}
            <p className="text-gray-600 text-xs text-center">
              Claude costs are real tracked token usage (logged on every API call from this deploy forward) · SMS cost estimated at $0.0075/outbound msg · Total org-level spend at console.anthropic.com
            </p>
          </>
        )}
      </main>
    </div>
  );
}
