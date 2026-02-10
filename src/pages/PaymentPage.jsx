import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, FileText, CreditCard, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function PaymentPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState(null);
  const [processors, setProcessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const isSuccess = searchParams.get('success') === 'true';

  useEffect(() => {
    fetchInvoice();
  }, [token]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pay/${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invoice not found');
        return;
      }

      setInvoice(data.invoice);
      setProcessors(data.processors || []);
      setPaid(data.paid || isSuccess);
    } catch (err) {
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (processor) => {
    setPaying(true);
    try {
      const res = await fetch(`${API_URL}/api/pay/${token}/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processor })
      });

      const data = await res.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Failed to create payment session');
      }
    } catch (err) {
      alert('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Available</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (paid || isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-4">Thank you for your payment.</p>
          {invoice && (
            <div className="bg-gray-50 rounded-xl p-4 text-left">
              <p className="text-sm text-gray-500">Invoice: <span className="font-mono font-bold">{invoice.invoice_number}</span></p>
              <p className="text-sm text-gray-500">Amount: <span className="font-bold text-green-600">${parseFloat(invoice.total_amount).toFixed(2)}</span></p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const primaryProcessor = processors.find(p => p.primary)?.name || processors[0]?.name;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Business Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{invoice.business_name}</h1>
          <p className="text-gray-500 mt-1">Invoice {invoice.invoice_number}</p>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Customer Info */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-sm text-gray-500">Bill To</p>
            <p className="font-semibold text-gray-900">{invoice.customer_name}</p>
            {invoice.customer_email && <p className="text-sm text-gray-600">{invoice.customer_email}</p>}
          </div>

          {/* Line Items */}
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="text-left pb-3">Description</th>
                  <th className="text-right pb-3">Qty</th>
                  <th className="text-right pb-3">Price</th>
                  <th className="text-right pb-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(invoice.items || []).map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                    <td className="py-3 text-sm text-gray-600 text-right">${parseFloat(item.unit_price).toFixed(2)}</td>
                    <td className="py-3 text-sm font-medium text-gray-900 text-right">${parseFloat(item.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Subtotal</span>
              <span>${parseFloat(invoice.subtotal).toFixed(2)}</span>
            </div>
            {parseFloat(invoice.tax_amount) > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Tax</span>
                <span>${parseFloat(invoice.tax_amount).toFixed(2)}</span>
              </div>
            )}
            {parseFloat(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Discount</span>
                <span>-${parseFloat(invoice.discount_amount).toFixed(2)}</span>
              </div>
            )}
            {parseFloat(invoice.amount_paid) > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Paid</span>
                <span className="text-green-600">-${parseFloat(invoice.amount_paid).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold mt-3 pt-3 border-t border-gray-200">
              <span>Amount Due</span>
              <span className="text-amber-600">${parseFloat(invoice.amount_due).toFixed(2)}</span>
            </div>
            {invoice.due_date && (
              <p className="text-xs text-gray-500 mt-2">Due by {new Date(invoice.due_date).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {/* Payment Buttons */}
        {parseFloat(invoice.amount_due) > 0 && processors.length > 0 && (
          <div className="space-y-3">
            {primaryProcessor && (
              <button onClick={() => handlePay(primaryProcessor)} disabled={paying}
                className="w-full py-4 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" />
                {paying ? 'Redirecting...' : `Pay $${parseFloat(invoice.amount_due).toFixed(2)}`}
              </button>
            )}
            {processors.length > 1 && (
              <div className="flex gap-3">
                {processors.filter(p => p.name !== primaryProcessor).map(p => (
                  <button key={p.name} onClick={() => handlePay(p.name)} disabled={paying}
                    className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-amber-300 transition font-semibold disabled:opacity-50">
                    Pay with {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {processors.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            <p>Contact {invoice.business_name} to arrange payment.</p>
          </div>
        )}

        {invoice.notes && (
          <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{invoice.notes}</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">Powered by SORCE</p>
      </div>
    </div>
  );
}
