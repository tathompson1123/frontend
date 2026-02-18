import { useState, useEffect } from 'react';
import { FileText, Plus, Send, Eye, RotateCw, Trash2, X, DollarSign, Clock, CheckCircle, AlertCircle, Ban } from 'lucide-react';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Send },
  viewed: { label: 'Viewed', color: 'bg-amber-100 text-amber-700', icon: Eye },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-700', icon: DollarSign },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-400', icon: Ban },
  refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-700', icon: RotateCw },
};

export default function Invoices({ apiUrl, user, authFetch }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [sending, setSending] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const [form, setForm] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    customerId: null, items: [{ description: '', quantity: 1, unitPrice: 0 }],
    notes: '', terms: 'Payment due within 30 days.', dueDate: '', taxRate: 0
  });

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchServices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/invoices`);
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/customers`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) { console.error(err); }
  };

  const fetchServices = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/services`);
      const data = await res.json();
      setServices(data.services || []);
    } catch (err) { console.error(err); }
  };

  const handleCreateInvoice = async () => {
    try {
      const dueDate = form.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res = await authFetch(`${apiUrl}/api/invoices`, {
        method: 'POST',
        body: JSON.stringify({ ...form, dueDate, taxRate: form.taxRate / 100 })
      });
      if (res.ok) {
        setShowCreateModal(false);
        setForm({ customerName: '', customerEmail: '', customerPhone: '', customerId: null, items: [{ description: '', quantity: 1, unitPrice: 0 }], notes: '', terms: 'Payment due within 30 days.', dueDate: '', taxRate: 0 });
        fetchInvoices();
      }
    } catch (err) { console.error(err); }
  };

  const syncFromSquare = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await authFetch(`${apiUrl}/api/invoices/sync-square`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncMsg(`Synced ${data.synced} invoices from Square`);
        fetchInvoices();
      } else {
        setSyncMsg(data.error || 'Sync failed');
      }
    } catch (err) {
      setSyncMsg('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    setSending(invoiceId);
    try {
      const res = await authFetch(`${apiUrl}/api/invoices/${invoiceId}/send`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Invoice sent!');
        fetchInvoices();
      } else {
        alert(data.error || 'Failed to send');
      }
    } catch (err) { console.error(err); }
    finally { setSending(null); }
  };

  const handleVoidInvoice = async (invoiceId) => {
    if (!confirm('Void this invoice? This cannot be undone.')) return;
    try {
      await authFetch(`${apiUrl}/api/invoices/${invoiceId}/void`, { method: 'POST' });
      fetchInvoices();
    } catch (err) { console.error(err); }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!confirm('Delete this draft invoice?')) return;
    try {
      await authFetch(`${apiUrl}/api/invoices/${invoiceId}`, { method: 'DELETE' });
      fetchInvoices();
    } catch (err) { console.error(err); }
  };

  const addLineItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unitPrice: 0 }] }));
  };

  const updateLineItem = (index, field, value) => {
    setForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const removeLineItem = (index) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const selectService = (index, serviceId) => {
    const service = services.find(s => s.id === parseInt(serviceId));
    if (service) {
      updateLineItem(index, 'description', service.name);
      updateLineItem(index, 'unitPrice', parseFloat(service.price));
      updateLineItem(index, 'serviceId', service.id);
    }
  };

  const selectCustomer = (customerId) => {
    const customer = customers.find(c => c.id === parseInt(customerId));
    if (customer) {
      setForm(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email || '',
        customerPhone: customer.phone || ''
      }));
    }
  };

  const subtotal = form.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const taxAmount = subtotal * (form.taxRate / 100);

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" /></div>;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Invoices</h2>
          <p className="text-gray-600 mt-1">Create and manage invoices for your customers</p>
        </div>
        <div className="flex items-center gap-3">
          {syncMsg && <span className="text-sm text-gray-600">{syncMsg}</span>}
          <button
            onClick={syncFromSquare}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#006AFF] rounded-lg hover:bg-[#0058D0] transition disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from Square'}
          </button>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold">
            <Plus className="w-5 h-5" /> New Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: invoices.length, color: 'text-gray-900' },
          { label: 'Outstanding', value: invoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status)).reduce((s, i) => s + parseFloat(i.amount_due || 0), 0).toFixed(2), prefix: '$', color: 'text-amber-600' },
          { label: 'Paid', value: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.total_amount || 0), 0).toFixed(2), prefix: '$', color: 'text-green-600' },
          { label: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length, color: 'text-red-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.prefix || ''}{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'draft', 'sent', 'viewed', 'paid', 'overdue'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No invoices yet</h3>
          <p className="text-gray-500 mb-6">Create your first invoice to start collecting payments</p>
          <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold">
            Create Invoice
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(invoice => {
                const config = statusConfig[invoice.status] || statusConfig.draft;
                const StatusIcon = config.icon;
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{invoice.customer_name}</div>
                      <div className="text-xs text-gray-500">{invoice.customer_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">${parseFloat(invoice.total_amount).toFixed(2)}</div>
                      {parseFloat(invoice.amount_due) > 0 && parseFloat(invoice.amount_due) < parseFloat(invoice.total_amount) && (
                        <div className="text-xs text-amber-600">Due: ${parseFloat(invoice.amount_due).toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invoice.status === 'draft' && (
                          <>
                            <button onClick={() => handleSendInvoice(invoice.id)} disabled={sending === invoice.id}
                              className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition disabled:opacity-50">
                              {sending === invoice.id ? 'Sending...' : 'Send'}
                            </button>
                            <button onClick={() => handleDeleteInvoice(invoice.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {['sent', 'viewed', 'overdue'].includes(invoice.status) && (
                          <>
                            <button onClick={() => handleSendInvoice(invoice.id)} disabled={sending === invoice.id}
                              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition disabled:opacity-50">
                              Remind
                            </button>
                            <button onClick={() => handleVoidInvoice(invoice.id)}
                              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
                              Void
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">New Invoice</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-6 h-6" /></button>
            </div>

            {/* Customer Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Customer</label>
              <select onChange={(e) => selectCustomer(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none mb-3">
                <option value="">Select existing customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.email}</option>)}
              </select>
              <div className="grid grid-cols-3 gap-3">
                <input type="text" placeholder="Name" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                <input type="email" placeholder="Email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                <input type="tel" placeholder="Phone" value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Line Items</label>
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-3 mb-3 items-start">
                  <div className="flex-1">
                    <select onChange={(e) => selectService(i, e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-1 focus:border-amber-500 focus:outline-none">
                      <option value="">Pick a service...</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>)}
                    </select>
                    <input type="text" placeholder="Description" value={item.description} onChange={e => updateLineItem(i, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none" />
                  </div>
                  <input type="number" min="1" value={item.quantity} onChange={e => updateLineItem(i, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none" placeholder="Qty" />
                  <input type="number" step="0.01" min="0" value={item.unitPrice} onChange={e => updateLineItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none" placeholder="Price" />
                  <span className="py-2 text-sm font-bold text-gray-700 w-24 text-right">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                  {form.items.length > 1 && (
                    <button onClick={() => removeLineItem(i)} className="p-2 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
              <button onClick={addLineItem} className="text-sm text-amber-600 hover:text-amber-700 font-medium">+ Add Line Item</button>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between text-sm mb-2"><span>Subtotal</span><span className="font-bold">${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm mb-2 items-center">
                <span>Tax (%)</span>
                <input type="number" step="0.01" min="0" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-20 px-2 py-1 border border-gray-200 rounded text-right text-sm" />
              </div>
              {taxAmount > 0 && <div className="flex justify-between text-sm mb-2"><span>Tax Amount</span><span>${taxAmount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2"><span>Total</span><span>${(subtotal + taxAmount).toFixed(2)}</span></div>
            </div>

            {/* Notes & Due Date */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleCreateInvoice} className="flex-1 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold">
                Create Invoice
              </button>
              <button onClick={() => setShowCreateModal(false)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
