import { useState, useEffect } from 'react';
import { DollarSign, CreditCard, RefreshCw, Filter, CheckCircle, Clock, XCircle, ArrowDownLeft, AlertCircle } from 'lucide-react';

const statusConfig = {
  succeeded: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-700', icon: ArrowDownLeft },
  partially_refunded: { label: 'Partial Refund', color: 'bg-purple-100 text-purple-700', icon: ArrowDownLeft },
};

const processorIcons = {
  square: '🟩',
  stripe: '💳',
  paypal: '🅿️',
  manual: '💵',
};

export default function Transactions({ apiUrl, user, authFetch }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null); // { ok, message }
  const [filter, setFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const init = async () => {
      await fetchPayments();
      await syncSquare();
    };
    init();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let url = `${apiUrl}/api/payments`;
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await authFetch(url);
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncSquare = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await authFetch(`${apiUrl}/api/payments/sync-square`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncResult({ ok: true, message: `Synced ${data.synced} transaction${data.synced !== 1 ? 's' : ''} from Square` });
        await fetchPayments();
      } else {
        setSyncResult({ ok: false, message: data.error || 'Sync failed' });
      }
    } catch (e) {
      setSyncResult({ ok: false, message: 'Could not reach server' });
    } finally {
      setSyncing(false);
    }
  };

  const totalAmount = payments
    .filter(p => p.status === 'succeeded' || p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'succeeded', label: 'Completed' },
    { key: 'pending', label: 'Pending' },
    { key: 'failed', label: 'Failed' },
    { key: 'refunded', label: 'Refunded' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-600 font-medium">Total Revenue</p>
          <p className="text-2xl font-bold text-green-700">${totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">Total Transactions</p>
          <p className="text-2xl font-bold text-blue-700">{payments.length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-amber-700">{payments.filter(p => p.status === 'pending').length}</p>
        </div>
      </div>

      {/* Sync status banner */}
      {syncResult && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm font-medium ${
          syncResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {syncResult.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {syncResult.message}
        </div>
      )}

      {/* Filters + sync button */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                filter === f.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={fetchPayments}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition"
          >
            <Filter className="w-4 h-4" /> Apply
          </button>
          <button
            onClick={syncSquare}
            disabled={syncing}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Square'}
          </button>
        </div>
      </div>

      {/* Transactions List */}
      {payments.length === 0 ? (
        <div className="text-center py-16">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No transactions yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Card payments processed through Square, Stripe, or PayPal will appear here.
            {syncResult?.ok && syncResult.message.includes('0') && (
              <span className="block mt-2 text-amber-600">Square is connected but has no card transactions in the last 90 days.</span>
            )}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Processor</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => {
                const config = statusConfig[payment.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                return (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.created_at).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">
                        ${parseFloat(payment.amount || 0).toFixed(2)}
                      </p>
                      {parseFloat(payment.refund_amount) > 0 && (
                        <p className="text-xs text-purple-600">
                          -${parseFloat(payment.refund_amount).toFixed(2)} refunded
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{processorIcons[payment.processor] || '💰'}</span>
                        <span className="text-sm text-gray-700 capitalize">{payment.processor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {payment.card_brand && payment.card_last_four ? (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {payment.card_brand} ····{payment.card_last_four}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">{payment.payment_method || '—'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
