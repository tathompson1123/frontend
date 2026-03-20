import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Send, Eye, RotateCw, Trash2, X, DollarSign, Clock, CheckCircle, AlertCircle, Ban, Edit2, ChevronDown, Settings, Percent } from 'lucide-react';

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

const processorLabel = { square: 'Square', stripe: 'Stripe', paypal: 'PayPal' };

const fmt = (val) => parseFloat(val || 0).toFixed(2);

function InvoicePreview({ form, editingInvoice, subtotal, taxAmount }) {
  const total = subtotal + taxAmount;
  const invoiceNum = editingInvoice?.invoice_number || 'PREVIEW';
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const dueDateDisplay = form.dueDate
    ? new Date(form.dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
  const lineItems = form.items.filter(it => it.description || parseFloat(it.unitPrice) > 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-7 text-sm shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-7 pb-5 border-b border-gray-100">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-0.5">INVOICE</h3>
          <p className="text-xs text-gray-400 font-mono">{invoiceNum}</p>
        </div>
        <div className="text-right text-xs">
          <p className="text-gray-400 mb-0.5">Date</p>
          <p className="font-semibold text-gray-700">{today}</p>
          <p className="text-gray-400 mt-2 mb-0.5">Due Date</p>
          <p className="font-semibold text-gray-700">{dueDateDisplay}</p>
        </div>
      </div>

      {/* Bill To */}
      {(form.customerName || form.customerEmail) && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Bill To</p>
          {form.customerName && <p className="font-bold text-gray-900">{form.customerName}</p>}
          {form.customerEmail && <p className="text-gray-500 text-xs">{form.customerEmail}</p>}
          {form.customerPhone && <p className="text-gray-500 text-xs">{form.customerPhone}</p>}
        </div>
      )}

      {/* Line Items */}
      <div className="mb-5">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
              <th className="text-center pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-10">Qty</th>
              <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">Price</th>
              <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">Total</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.length === 0 ? (
              <tr><td colSpan={4} className="py-4 text-center text-gray-300 text-xs">No line items yet</td></tr>
            ) : lineItems.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-50">
                <td className="py-2 text-gray-700 pr-2">
                  {item.description || '—'}
                  {item.taxable === false && <span className="ml-1 text-[10px] text-gray-400">(no tax)</span>}
                </td>
                <td className="py-2 text-center text-gray-500">{item.quantity}</td>
                <td className="py-2 text-right text-gray-500">${parseFloat(item.unitPrice || 0).toFixed(2)}</td>
                <td className="py-2 text-right font-semibold text-gray-800">${(item.quantity * parseFloat(item.unitPrice || 0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="space-y-1.5 pt-3 border-t border-gray-200">
        <div className="flex justify-between text-gray-500 text-xs">
          <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
        </div>
        {taxAmount > 0 && (
          <div className="flex justify-between text-gray-500 text-xs">
            <span>Tax ({form.taxRate}%)</span><span>${taxAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-900 font-bold text-base pt-2 border-t border-gray-200 mt-1">
          <span>Total</span><span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Notes */}
      {form.notes && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Notes</p>
          <p className="text-gray-600 text-xs leading-relaxed">{form.notes}</p>
        </div>
      )}

      {/* Terms */}
      {form.terms && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Terms</p>
          <p className="text-gray-400 text-xs leading-relaxed">{form.terms}</p>
        </div>
      )}
    </div>
  );
}

export default function Invoices({ apiUrl, user, authFetch }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [catalog, setCatalog] = useState([]); // saved fees/supplies
  const [connections, setConnections] = useState([]);
  const [defaultTaxRate, setDefaultTaxRate] = useState(0);
  const [sendingId, setSendingId] = useState(null);
  const [sendDropdown, setSendDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Settings modal state
  const [settingsTaxRate, setSettingsTaxRate] = useState('');
  const [newCatalogItem, setNewCatalogItem] = useState({ name: '', category: 'fee', amountType: 'fixed', amount: '', taxable: false });

  const emptyForm = {
    customerName: '', customerEmail: '', customerPhone: '',
    customerId: null, items: [{ description: '', quantity: 1, unitPrice: 0, taxable: true }],
    notes: '', terms: 'Payment due within 30 days.', dueDate: '', taxRate: 0
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const init = async () => {
      await fetchInvoices();
      fetchCustomers();
      fetchServices();
      fetchConnections();
      fetchSettings();
      fetchCatalog();
      try {
        const res = await authFetch(`${apiUrl}/api/invoices/sync-square`, { method: 'POST' });
        if (res.ok) fetchInvoices();
      } catch (e) { /* Square not connected — ignore */ }
    };
    init();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSendDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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

  const fetchConnections = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/payment-connections`);
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (e) { console.error(e); }
  };

  const fetchSettings = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/invoices/settings`);
      const data = await res.json();
      setDefaultTaxRate(data.defaultTaxRate || 0);
      setSettingsTaxRate(String(data.defaultTaxRate || 0));
    } catch (e) { console.error(e); }
  };

  const fetchCatalog = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/invoices/catalog`);
      const data = await res.json();
      setCatalog(data.items || []);
    } catch (e) { console.error(e); }
  };

  const saveSettings = async () => {
    try {
      await authFetch(`${apiUrl}/api/invoices/settings`, {
        method: 'PUT',
        body: JSON.stringify({ defaultTaxRate: parseFloat(settingsTaxRate) || 0 }),
      });
      const rate = parseFloat(settingsTaxRate) || 0;
      setDefaultTaxRate(rate);
      setShowSettings(false);
    } catch (e) { console.error(e); }
  };

  const addCatalogItem = async () => {
    if (!newCatalogItem.name.trim() || !newCatalogItem.amount) return;
    try {
      const res = await authFetch(`${apiUrl}/api/invoices/catalog`, {
        method: 'POST',
        body: JSON.stringify(newCatalogItem),
      });
      const data = await res.json();
      if (res.ok) {
        setCatalog(prev => [...prev, data.item]);
        setNewCatalogItem({ name: '', category: 'fee', amountType: 'fixed', amount: '', taxable: false });
      }
    } catch (e) { console.error(e); }
  };

  const deleteCatalogItem = async (itemId) => {
    try {
      await authFetch(`${apiUrl}/api/invoices/catalog/${itemId}`, { method: 'DELETE' });
      setCatalog(prev => prev.filter(i => i.id !== itemId));
    } catch (e) { console.error(e); }
  };

  const activeProcessors = connections.filter(c => c.is_active).map(c => c.processor);

  const openCreateModal = () => {
    setEditingInvoice(null);
    // Start with one blank line item + auto-add saved catalog fees/supplies
    const baseItems = [{ description: '', quantity: 1, unitPrice: 0, taxable: true }];
    const feeItems = catalog
      .filter(c => c.amount_type === 'fixed')
      .map(c => ({ description: c.name, quantity: 1, unitPrice: parseFloat(c.amount) || 0, taxable: !!c.taxable }));
    setForm({ ...emptyForm, taxRate: defaultTaxRate, items: [...baseItems, ...feeItems] });
    setShowModal(true);
  };

  const openEditModal = (invoice) => {
    setEditingInvoice(invoice);
    setForm({
      customerName: invoice.customer_name || '',
      customerEmail: invoice.customer_email || '',
      customerPhone: invoice.customer_phone || '',
      customerId: invoice.customer_id || null,
      items: invoice.items?.length > 0
        ? invoice.items.map(i => ({
            description: i.description || '',
            quantity: parseFloat(i.quantity) || 1,
            unitPrice: parseFloat(i.unit_price) || 0,
            taxable: i.taxable !== false,
          }))
        : [{ description: '', quantity: 1, unitPrice: 0, taxable: true }],
      notes: invoice.notes || '',
      terms: invoice.terms || 'Payment due within 30 days.',
      dueDate: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '',
      taxRate: parseFloat(invoice.tax_rate || 0) * 100,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingInvoice(null);
    setForm(emptyForm);
  };

  const handleSaveInvoice = async () => {
    try {
      const dueDate = form.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const url = editingInvoice ? `${apiUrl}/api/invoices/${editingInvoice.id}` : `${apiUrl}/api/invoices`;
      const method = editingInvoice ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        body: JSON.stringify({ ...form, dueDate, taxRate: form.taxRate / 100 })
      });
      if (res.ok) {
        closeModal();
        fetchInvoices();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save invoice');
      }
    } catch (err) { console.error(err); }
  };

  // Generic send handler — processor is 'square'|'stripe'|'paypal'|'email'
  const handleSend = async (processor, invoiceId, isRemind = false) => {
    setSendingId(invoiceId);
    setSendDropdown(null);
    try {
      const url = processor === 'email'
        ? `${apiUrl}/api/invoices/${invoiceId}/${isRemind ? 'remind' : 'send'}`
        : `${apiUrl}/api/invoices/${invoiceId}/send-${processor}`;
      const res = await authFetch(url, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Invoice sent!');
        fetchInvoices();
      } else {
        alert(data.error || 'Failed to send invoice');
      }
    } catch (err) { console.error(err); }
    finally { setSendingId(null); }
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
    setForm(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, taxable: true }] }));
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
      setForm(prev => {
        const items = prev.items.map((item, i) => i === index
          ? { ...item, description: service.name, unitPrice: parseFloat(service.price), serviceId: service.id, taxable: true }
          : item);
        return { ...prev, items };
      });
    }
  };

  const selectCatalogItem = (index, itemId) => {
    const item = catalog.find(c => c.id === parseInt(itemId));
    if (!item) return;
    const isTaxable = !!item.taxable;
    if (item.amount_type === 'percentage') {
      const taxableItems = form.items.filter((it, idx) => idx !== index && it.taxable !== false);
      const subtotalTaxable = taxableItems.reduce((s, it) => s + (it.quantity * it.unitPrice), 0);
      const calculated = Math.round(subtotalTaxable * (parseFloat(item.amount) / 100) * 100) / 100;
      setForm(prev => {
        const items = prev.items.map((it, i) => i === index
          ? { ...it, description: `${item.name} (${item.amount}%)`, unitPrice: calculated, quantity: 1, taxable: isTaxable }
          : it);
        return { ...prev, items };
      });
    } else {
      setForm(prev => {
        const items = prev.items.map((it, i) => i === index
          ? { ...it, description: item.name, unitPrice: parseFloat(item.amount), quantity: 1, taxable: isTaxable }
          : it);
        return { ...prev, items };
      });
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
  const taxableSubtotal = form.items.reduce((s, i) => i.taxable !== false ? s + (i.quantity * i.unitPrice) : s, 0);
  const taxAmount = taxableSubtotal * (form.taxRate / 100);
  const canEdit = !editingInvoice || ['draft', 'sent', 'viewed', 'overdue'].includes(editingInvoice.status);

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  // Send dropdown options for a given invoice (draft = send, sent/overdue = remind)
  const sendOptions = (isRemind = false) => [
    ...['square', 'stripe', 'paypal'].filter(p => activeProcessors.includes(p)).map(p => ({
      processor: p,
      label: `${isRemind ? 'Remind via' : 'Send via'} ${processorLabel[p]}`,
    })),
    { processor: 'email', label: isRemind ? 'Email Reminder' : 'Send Email' },
  ];

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" /></div>;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Invoices</h2>
          <p className="text-gray-600 mt-1">Create and manage invoices for your customers</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setSettingsTaxRate(String(defaultTaxRate)); setShowSettings(true); }}
            className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold">
            <Settings className="w-4 h-4" /> Tax & Fees
          </button>
          <button onClick={openCreateModal} className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold">
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
          <button onClick={openCreateModal} className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold">
            Create Invoice
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" ref={dropdownRef}>
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
                const isDraft = invoice.status === 'draft';
                const isActionable = ['draft', 'sent', 'viewed', 'overdue'].includes(invoice.status);
                const isRemind = ['sent', 'viewed', 'overdue'].includes(invoice.status);
                const isSending = sendingId === invoice.id;
                const dropdownOpen = sendDropdown === invoice.id;

                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-gray-900">{invoice.invoice_number}</span>
                      {invoice.payment_processor && (
                        <span className="ml-2 text-xs text-gray-400">via {processorLabel[invoice.payment_processor] || invoice.payment_processor}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{invoice.customer_name || '—'}</div>
                      <div className="text-xs text-gray-500">{invoice.customer_email || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">${fmt(invoice.total_amount)}</div>
                      {parseFloat(invoice.amount_due || 0) > 0 && parseFloat(invoice.amount_due) < parseFloat(invoice.total_amount || 0) && (
                        <div className="text-xs text-amber-600">Due: ${fmt(invoice.amount_due)}</div>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit — draft only */}
                        {isDraft && (
                          <button onClick={() => openEditModal(invoice)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Edit — non-draft (next to Remind) */}
                        {isRemind && (
                          <button onClick={() => openEditModal(invoice)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Send / Remind dropdown */}
                        {isActionable && (
                          <div className="relative">
                            <button
                              onClick={() => setSendDropdown(dropdownOpen ? null : invoice.id)}
                              disabled={isSending}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition disabled:opacity-50">
                              {isSending ? 'Sending...' : isRemind ? 'Remind' : 'Send'}
                              {!isSending && <ChevronDown className="w-3 h-3" />}
                            </button>
                            {dropdownOpen && (
                              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[180px] py-1">
                                {sendOptions(isRemind).map(opt => (
                                  <button
                                    key={opt.processor}
                                    onClick={() => handleSend(opt.processor, invoice.id, isRemind)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition">
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Void — sent invoices */}
                        {isRemind && (
                          <button onClick={() => handleVoidInvoice(invoice.id)}
                            className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
                            Void
                          </button>
                        )}

                        {/* Delete — draft only */}
                        {isDraft && (
                          <button onClick={() => handleDeleteInvoice(invoice.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Create / Edit Invoice — Split Editor */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingInvoice ? (canEdit ? 'Edit Invoice' : 'Invoice Details') : 'New Invoice'}
              </h2>
              {editingInvoice && !canEdit && (
                <p className="text-xs text-amber-600 mt-0.5">Only draft invoices can be edited</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {canEdit ? (
                <button onClick={handleSaveInvoice}
                  className="px-6 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold">
                  {editingInvoice ? 'Save Changes' : 'Create Invoice'}
                </button>
              ) : (
                <div className="flex gap-2">
                  {sendOptions().map(opt => (
                    <button key={opt.processor}
                      onClick={() => { closeModal(); handleSend(opt.processor, editingInvoice.id); }}
                      className="px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold text-sm">
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Body: form + preview */}
          <div className="flex flex-1 overflow-hidden">
            {/* Form */}
            <div className="flex-1 min-w-0 overflow-y-auto p-8 space-y-6">

              {/* Customer */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer</label>
                {canEdit ? (
                  <>
                    <select onChange={(e) => selectCustomer(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none mb-3">
                      <option value="">Select existing customer...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.email}</option>)}
                    </select>
                    <div className="grid grid-cols-3 gap-3">
                      <input type="text" placeholder="Name" value={form.customerName}
                        onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                        className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                      <input type="email" placeholder="Email" value={form.customerEmail}
                        onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                        className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                      <input type="tel" placeholder="Phone" value={form.customerPhone}
                        onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                        className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">{editingInvoice.customer_name}</p>
                    <p className="text-sm text-gray-600">{editingInvoice.customer_email}</p>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Line Items</label>
                  {canEdit && (services.length > 0 || catalog.length > 0) && (
                    <span className="text-xs text-gray-400">Type a custom service or quick-fill from your saved services</span>
                  )}
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex gap-3 mb-2 items-start">
                      <input type="text" placeholder="Service description (e.g. Full detail, Oil change, Lawn mow...)" value={item.description}
                        onChange={e => updateLineItem(i, 'description', e.target.value)}
                        disabled={!canEdit}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none disabled:bg-white bg-white" />
                      <input type="number" min="1" value={item.quantity}
                        onChange={e => updateLineItem(i, 'quantity', parseInt(e.target.value) || 1)}
                        disabled={!canEdit}
                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none disabled:bg-white bg-white text-center" placeholder="Qty" />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input type="number" step="0.01" min="0" value={item.unitPrice}
                          onChange={e => updateLineItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                          disabled={!canEdit}
                          className="w-28 pl-6 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none disabled:bg-white bg-white" placeholder="0.00" />
                      </div>
                      <span className="py-2 text-sm font-bold text-gray-700 w-20 text-right">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                      {canEdit && (
                        <button
                          onClick={() => updateLineItem(i, 'taxable', !item.taxable)}
                          title={item.taxable !== false ? 'Taxed — click to exclude from tax' : 'Not taxed — click to include in tax'}
                          className={`px-2 py-1 text-xs font-semibold rounded-lg border transition ${
                            item.taxable !== false
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {item.taxable !== false ? 'TAX' : 'NO TAX'}
                        </button>
                      )}
                      {!canEdit && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${
                          item.taxable !== false ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {item.taxable !== false ? 'TAX' : 'NO TAX'}
                        </span>
                      )}
                      {canEdit && form.items.length > 1 && (
                        <button onClick={() => removeLineItem(i)} className="p-2 text-red-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {canEdit && (services.length > 0 || catalog.length > 0) && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Quick-fill:</span>
                        {services.length > 0 && (
                          <select value="" onChange={(e) => { if (e.target.value) selectService(i, e.target.value); }}
                            className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:border-amber-500 focus:outline-none text-gray-600 cursor-pointer">
                            <option value="">— service —</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name} (${parseFloat(s.price).toFixed(2)})</option>)}
                          </select>
                        )}
                        {catalog.length > 0 && (
                          <select value="" onChange={(e) => { if (e.target.value) selectCatalogItem(i, e.target.value); }}
                            className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:border-amber-500 focus:outline-none text-gray-600 cursor-pointer">
                            <option value="">— fee / supply —</option>
                            {catalog.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name} {c.amount_type === 'percentage' ? `(${c.amount}%)` : `($${parseFloat(c.amount).toFixed(2)})`}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {canEdit && (
                  <button onClick={addLineItem} className="text-sm text-amber-600 hover:text-amber-700 font-medium">+ Add Line Item</button>
                )}
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2"><span>Subtotal</span><span className="font-bold">${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm mb-2 items-center">
                  <span>Tax (%)</span>
                  {canEdit ? (
                    <input type="number" step="0.01" min="0" value={form.taxRate}
                      onChange={e => setForm(f => ({ ...f, taxRate: parseFloat(e.target.value) || 0 }))}
                      className="w-20 px-2 py-1 border border-gray-200 rounded text-right text-sm" />
                  ) : (
                    <span>{(parseFloat(editingInvoice?.tax_rate || 0) * 100).toFixed(1)}%</span>
                  )}
                </div>
                {taxAmount > 0 && <div className="flex justify-between text-sm mb-2"><span>Tax Amount</span><span>${taxAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                  <span>Total</span>
                  <span>${canEdit ? (subtotal + taxAmount).toFixed(2) : fmt(editingInvoice?.total_amount)}</span>
                </div>
              </div>

              {/* Notes & Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                  <input type="date" value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    disabled={!canEdit}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none disabled:bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <input type="text" value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    disabled={!canEdit}
                    placeholder="Optional notes..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none disabled:bg-gray-50" />
                </div>
              </div>

            </div>

            {/* Preview Panel */}
            <div className="w-1/3 min-w-72 flex-shrink-0 overflow-y-auto bg-gray-100 border-l border-gray-200 p-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Preview</p>
              <InvoicePreview form={form} editingInvoice={editingInvoice} subtotal={subtotal} taxAmount={taxAmount} />
            </div>
          </div>
        </div>
      )}

      {/* Tax & Fees Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Tax & Fees Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {/* Sales Tax */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Default Sales Tax Rate</label>
              <p className="text-xs text-gray-400 mb-3">Auto-fills on every new invoice. You can still override it per invoice.</p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number" step="0.01" min="0" max="100"
                    value={settingsTaxRate}
                    onChange={e => setSettingsTaxRate(e.target.value)}
                    placeholder="e.g. 9.8"
                    className="w-full px-4 py-3 pr-8 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-lg font-semibold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">%</span>
                </div>
                <button onClick={saveSettings}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold">
                  Save
                </button>
              </div>
            </div>

            {/* Saved Fees & Supplies */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Saved Fees & Supplies</label>
              <p className="text-xs text-gray-400 mb-3">These auto-fill when creating invoices. Toggle "Taxed" to include a fee in the tax calculation, or "No Tax" to exclude it (e.g. processing fees).</p>

              {/* Existing items */}
              {catalog.length > 0 && (
                <div className="mb-4 divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                  {catalog.map(item => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3 bg-white">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">{item.category}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          item.taxable ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
                        }`}>
                          {item.taxable ? 'Taxed' : 'No Tax'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-700 flex items-center gap-0.5">
                          {item.amount_type === 'percentage'
                            ? <><Percent className="w-3.5 h-3.5" />{parseFloat(item.amount).toFixed(2)}</>
                            : <>${parseFloat(item.amount).toFixed(2)}</>}
                        </span>
                        <button onClick={() => deleteCatalogItem(item.id)} className="p-1 text-red-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new item */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Add New</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text" placeholder="Name (e.g. Processing Fee)"
                    value={newCatalogItem.name}
                    onChange={e => setNewCatalogItem(p => ({ ...p, name: e.target.value }))}
                    className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none bg-white"
                  />
                  <select value={newCatalogItem.category}
                    onChange={e => setNewCatalogItem(p => ({ ...p, category: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none bg-white">
                    <option value="fee">Fee</option>
                    <option value="supply">Supply</option>
                    <option value="other">Other</option>
                  </select>
                  <select value={newCatalogItem.amountType}
                    onChange={e => setNewCatalogItem(p => ({ ...p, amountType: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none bg-white">
                    <option value="fixed">Fixed ($)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      {newCatalogItem.amountType === 'percentage' ? '%' : '$'}
                    </span>
                    <input type="number" step="0.01" min="0" placeholder="0.00"
                      value={newCatalogItem.amount}
                      onChange={e => setNewCatalogItem(p => ({ ...p, amount: e.target.value }))}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewCatalogItem(p => ({ ...p, taxable: !p.taxable }))}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition whitespace-nowrap ${
                      newCatalogItem.taxable
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {newCatalogItem.taxable ? 'Taxed' : 'No Tax'}
                  </button>
                  <button onClick={addCatalogItem}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-semibold">
                    + Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
