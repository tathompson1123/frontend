import { useState, useEffect, useRef } from 'react';
import {
  FileText, Plus, Send, Eye, Trash2, X, CheckCircle, Ban, Edit2,
  ArrowRight, Clock, RotateCw, ThumbsUp, ThumbsDown, ChevronLeft,
  Link as LinkIcon, Paperclip, ExternalLink, Upload, Bookmark,
} from 'lucide-react';

const SAVED_LINKS_KEY = 'sorce_estimate_saved_links';

const statusConfig = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-700',    icon: FileText },
  sent:      { label: 'Sent',      color: 'bg-blue-100 text-blue-700',    icon: Send },
  viewed:    { label: 'Viewed',    color: 'bg-amber-100 text-amber-700',  icon: Eye },
  accepted:  { label: 'Accepted',  color: 'bg-green-100 text-green-700',  icon: ThumbsUp },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-700',      icon: ThumbsDown },
  expired:   { label: 'Expired',   color: 'bg-gray-100 text-gray-400',    icon: Clock },
  converted: { label: 'Converted', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
};

const fmt = (val) => parseFloat(val || 0).toFixed(2);

// ── Live preview ───────────────────────────────────────────────────────────────

function EstimatePreview({ form, totals, estimateNumber, businessName }) {
  const validItems = form.items.filter(i => i.description || parseFloat(i.unitPrice) > 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 text-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-400 p-6 text-white">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-amber-100 text-xs font-semibold uppercase tracking-wider">Estimate</p>
            <p className="text-2xl font-bold mt-0.5">{estimateNumber || 'EST-XXXXXXXX'}</p>
          </div>
          {businessName && (
            <p className="font-bold text-base text-right">{businessName}</p>
          )}
        </div>
        <div className="flex gap-6 mt-4 text-xs text-amber-100">
          <div>
            <span className="uppercase tracking-wide opacity-75">Issued:</span>{' '}
            <span className="font-medium text-white">{new Date().toLocaleDateString()}</span>
          </div>
          {form.validUntil && (
            <div>
              <span className="uppercase tracking-wide opacity-75">Valid Until:</span>{' '}
              <span className="font-medium text-white">
                {new Date(form.validUntil + 'T12:00:00').toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bill To */}
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
        {form.customerName
          ? <p className="font-semibold text-gray-900">{form.customerName}</p>
          : <p className="text-gray-300 italic">Customer name</p>
        }
        {form.customerEmail && <p className="text-gray-500 mt-0.5">{form.customerEmail}</p>}
        {form.customerPhone && <p className="text-gray-500 mt-0.5">{form.customerPhone}</p>}
      </div>

      {/* Line Items */}
      <div className="px-6 py-4 border-b border-gray-100">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-xs font-semibold text-gray-400 uppercase text-left pb-2 pr-2 w-6">#</th>
              <th className="text-xs font-semibold text-gray-400 uppercase text-left pb-2">Description</th>
              <th className="text-xs font-semibold text-gray-400 uppercase text-right pb-2 w-10">Qty</th>
              <th className="text-xs font-semibold text-gray-400 uppercase text-right pb-2 w-20">Price</th>
              <th className="text-xs font-semibold text-gray-400 uppercase text-right pb-2 w-20">Amount</th>
            </tr>
          </thead>
          <tbody>
            {validItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-5 text-center text-gray-300 italic">
                  Line items will appear here
                </td>
              </tr>
            ) : validItems.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-50">
                <td className="py-2 pr-2 text-gray-400">{idx + 1}</td>
                <td className="py-2 text-gray-800">{item.description || '—'}</td>
                <td className="py-2 text-gray-600 text-right">{item.quantity}</td>
                <td className="py-2 text-gray-600 text-right">${fmt(item.unitPrice)}</td>
                <td className="py-2 font-semibold text-gray-900 text-right">
                  ${fmt((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="ml-auto max-w-[220px] space-y-1.5">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span><span>${fmt(totals.subtotal)}</span>
          </div>
          {totals.taxAmt > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Tax ({((parseFloat(form.taxRate) || 0) * 100).toFixed(1)}%)</span>
              <span>${fmt(totals.taxAmt)}</span>
            </div>
          )}
          {parseFloat(form.discountAmount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span><span>-${fmt(form.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t-2 border-gray-200 pt-2 text-base">
            <span>Total</span><span>${fmt(totals.total)}</span>
          </div>
        </div>
      </div>

      {/* Links */}
      {form.links?.filter(l => l.url).length > 0 && (
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Links</p>
          <div className="space-y-1">
            {form.links.filter(l => l.url).map((link, i) => (
              <div key={i} className="flex items-center gap-2 text-amber-600">
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-medium">{link.label || 'Link'}:</span>
                <span className="text-blue-500 truncate">{link.url}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments */}
      {form.attachments?.filter(a => a.url).length > 0 && (
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Attachments</p>
          <div className="flex flex-wrap gap-2">
            {form.attachments.filter(a => a.url).map((att, i) => {
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(att.url);
              return isImage ? (
                <div key={i} className="relative">
                  <img
                    src={att.url} alt={att.name || 'Attachment'}
                    className="h-20 w-20 object-cover rounded-lg border border-gray-100"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  {att.name && <p className="text-xs text-gray-400 mt-0.5 truncate w-20">{att.name}</p>}
                </div>
              ) : (
                <div key={i} className="flex items-center gap-1.5 text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[140px]">{att.name || att.url}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes / Terms */}
      {(form.notes || form.terms) && (
        <div className="px-6 py-4 grid grid-cols-2 gap-6">
          {form.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">{form.notes}</p>
            </div>
          )}
          {form.terms && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Terms</p>
              <p className="text-gray-400 whitespace-pre-line leading-relaxed">{form.terms}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Estimates({ apiUrl, user, authFetch }) {
  const [estimates, setEstimates]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');
  const [showEditor, setShowEditor]     = useState(false);
  const [editingEstimate, setEditingEstimate] = useState(null);
  const [customers, setCustomers]       = useState([]);
  const [services, setServices]         = useState([]);
  const [catalog, setCatalog]           = useState([]);
  const [defaultTaxRate, setDefaultTaxRate] = useState(0);
  const [actionLoading, setActionLoading]   = useState(null);
  const [convertModal, setConvertModal]     = useState(null);
  const [convertDueDate, setConvertDueDate] = useState('');
  const [toast, setToast]               = useState(null);
  const [savedLinks, setSavedLinks]     = useState(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_LINKS_KEY) || '[]'); } catch { return []; }
  });
  const serviceSelectRef  = useRef(null);
  const catalogSelectRef  = useRef(null);

  const emptyForm = {
    customerName: '', customerEmail: '', customerPhone: '',
    customerId: null,
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    notes: '', terms: 'This estimate is valid for 30 days.',
    validUntil: '', taxRate: 0, discountAmount: 0,
    links: [],
    attachments: [],
  };
  const [form, setForm] = useState(emptyForm);
  const [formSnapshot, setFormSnapshot] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchEstimates();
    fetchCustomers();
    fetchServices();
    fetchSettings();
    fetchCatalog();
  }, []);

  const fetchEstimates = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/estimates`);
      const data = await res.json();
      setEstimates(data.estimates || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/customers`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch { /* ignore */ }
  };

  const fetchServices = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/services`);
      const data = await res.json();
      setServices(data.services || []);
    } catch { /* ignore */ }
  };

  const fetchSettings = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/estimates/settings`);
      const data = await res.json();
      const rate = parseFloat(data.defaultTaxRate || 0);
      setDefaultTaxRate(rate);
      setForm(f => ({ ...f, taxRate: rate }));
    } catch { /* ignore */ }
  };

  const fetchCatalog = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/estimates/catalog`);
      const data = await res.json();
      setCatalog(data.items || []);
    } catch { /* ignore */ }
  };

  // ── Computed ────────────────────────────────────────────────────────────────

  const totals = (() => {
    const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0);
    const taxAmt   = subtotal * (parseFloat(form.taxRate) || 0);
    const discount = parseFloat(form.discountAmount) || 0;
    return { subtotal, taxAmt, total: Math.max(0, subtotal + taxAmt - discount) };
  })();

  const filtered = filter === 'all' ? estimates : estimates.filter(e => e.status === filter);
  const stats = {
    total:    estimates.length,
    pending:  estimates.filter(e => ['sent', 'viewed'].includes(e.status)).length,
    accepted: estimates.filter(e => e.status === 'accepted').length,
    converted:estimates.filter(e => e.status === 'converted').length,
  };

  // ── Form helpers ────────────────────────────────────────────────────────────

  const updateItem = (idx, field, val) => {
    setForm(f => {
      const items = f.items.map((item, i) => i === idx ? { ...item, [field]: val } : item);
      return { ...f, items };
    });
  };
  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: 1, unitPrice: 0 }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  // Fix: customers table has single 'name' field, not first_name/last_name
  const selectCustomer = (id) => {
    const c = customers.find(c => c.id === parseInt(id));
    if (c) setForm(f => ({
      ...f,
      customerId: c.id,
      customerName: c.name || '',
      customerEmail: c.email || '',
      customerPhone: c.phone || '',
    }));
  };

  // Replace first empty row, or append if all rows have content
  const selectService = (svc) => {
    if (!svc) return;
    const newItem = {
      description: svc.name,
      quantity: 1,
      unitPrice: parseFloat(svc.price || 0),
      serviceId: svc.id,
    };
    setForm(f => {
      const emptyIdx = f.items.findIndex(item => !item.description && !parseFloat(item.unitPrice));
      if (emptyIdx !== -1) {
        const items = f.items.map((item, i) => i === emptyIdx ? newItem : item);
        return { ...f, items };
      }
      return { ...f, items: [...f.items, newItem] };
    });
    if (serviceSelectRef.current) serviceSelectRef.current.value = '';
  };

  const selectCatalogItem = (item) => {
    if (!item) return;
    const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0);
    const price = item.amount_type === 'percentage' ? subtotal * (item.amount / 100) : parseFloat(item.amount);
    setForm(f => ({
      ...f,
      items: [...f.items, { description: item.name, quantity: 1, unitPrice: price }],
    }));
    if (catalogSelectRef.current) catalogSelectRef.current.value = '';
  };

  // Link helpers
  const addLink     = () => setForm(f => ({ ...f, links: [...(f.links || []), { label: '', url: '' }] }));
  const updateLink  = (idx, field, val) => {
    const links = [...(form.links || [])];
    links[idx] = { ...links[idx], [field]: val };
    setForm(f => ({ ...f, links }));
  };
  const removeLink  = (idx) => setForm(f => ({ ...f, links: (f.links || []).filter((_, i) => i !== idx) }));

  // Attachment helpers
  const addAttachment    = () => setForm(f => ({ ...f, attachments: [...(f.attachments || []), { name: '', url: '' }] }));
  const updateAttachment = (idx, field, val) => {
    setForm(f => {
      const attachments = (f.attachments || []).map((a, i) => i === idx ? { ...a, [field]: val } : a);
      return { ...f, attachments };
    });
  };
  const removeAttachment = (idx) => setForm(f => ({ ...f, attachments: (f.attachments || []).filter((_, i) => i !== idx) }));

  const handleFileUpload = (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => {
        const attachments = (f.attachments || []).map((a, i) =>
          i === idx ? { ...a, url: ev.target.result, name: file.name } : a
        );
        return { ...f, attachments };
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset so same file can be re-selected
  };

  // Saved links (persisted to localStorage)
  const saveLink = (link) => {
    if (!link.url) return;
    const next = savedLinks.some(sl => sl.url === link.url)
      ? savedLinks
      : [...savedLinks, { label: link.label || link.url, url: link.url }];
    setSavedLinks(next);
    try { localStorage.setItem(SAVED_LINKS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const removeSavedLink = (url) => {
    const next = savedLinks.filter(sl => sl.url !== url);
    setSavedLinks(next);
    try { localStorage.setItem(SAVED_LINKS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const insertSavedLink = (sl) => {
    setForm(f => ({ ...f, links: [...(f.links || []), { label: sl.label, url: sl.url }] }));
  };

  const openCreate = () => {
    setEditingEstimate(null);
    const newForm = { ...emptyForm, taxRate: defaultTaxRate };
    setForm(newForm);
    setFormSnapshot(JSON.stringify(newForm));
    setShowEditor(true);
  };

  const openEdit = (est) => {
    setEditingEstimate(est);
    const editForm = {
      customerName: est.customer_name || '',
      customerEmail: est.customer_email || '',
      customerPhone: est.customer_phone || '',
      customerId: est.customer_id || null,
      items: (est.items || []).map(i => ({
        description: i.description, quantity: parseFloat(i.quantity),
        unitPrice: parseFloat(i.unit_price), serviceId: i.service_id,
      })),
      notes: est.notes || '',
      terms: est.terms || 'This estimate is valid for 30 days.',
      validUntil: est.valid_until ? est.valid_until.slice(0, 10) : '',
      taxRate: parseFloat(est.tax_rate) || 0,
      discountAmount: parseFloat(est.discount_amount) || 0,
      links: est.links || [],
      attachments: est.attachments || [],
    };
    setForm(editForm);
    setFormSnapshot(JSON.stringify(editForm));
    setShowEditor(true);
  };

  const isFormDirty = () => formSnapshot && JSON.stringify(form) !== formSnapshot;

  const closeEditor = (force = false) => {
    if (!force && isFormDirty()) {
      if (!confirm('You have unsaved changes. Are you sure you want to close? Your changes will be lost.')) return;
    }
    setShowEditor(false);
    setEditingEstimate(null);
    setForm(emptyForm);
    setFormSnapshot(null);
  };

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.customerName) return showToast('Customer name is required.', 'error');
    const validItems = form.items.filter(i => i.description || parseFloat(i.unitPrice) > 0);
    if (validItems.length === 0) return showToast('At least one line item is required.', 'error');

    const payload = {
      ...form,
      items: validItems.map(i => ({
        description: i.description,
        quantity: parseFloat(i.quantity) || 1,
        unitPrice: parseFloat(i.unitPrice) || 0,
        serviceId: i.serviceId || null,
      })),
      links: (form.links || []).filter(l => l.url),
      attachments: (form.attachments || []).filter(a => a.url),
    };
    try {
      const url = editingEstimate
        ? `${apiUrl}/api/estimates/${editingEstimate.id}`
        : `${apiUrl}/api/estimates`;
      const res  = await authFetch(url, { method: editingEstimate ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) return showToast(data.error || 'Failed to save estimate', 'error');
      showToast(editingEstimate ? 'Estimate updated.' : 'Estimate created.');
      closeEditor(true);
      fetchEstimates();
    } catch {
      showToast('Failed to save estimate', 'error');
    }
  };

  const handleAction = async (id, action) => {
    setActionLoading(`${id}-${action}`);
    try {
      const res  = await authFetch(`${apiUrl}/api/estimates/${id}/${action}`, { method: action === 'delete' ? 'DELETE' : 'POST' });
      const data = await res.json();
      if (!res.ok) return showToast(data.error || `Failed to ${action}`, 'error');
      const messages = {
        send: 'Estimate sent!', remind: 'Reminder sent!', void: 'Estimate expired.',
        'mark-accepted': 'Marked as accepted.', 'mark-rejected': 'Marked as rejected.',
        delete: 'Estimate deleted.',
      };
      showToast(messages[action] || 'Done.');
      fetchEstimates();
    } catch { showToast(`Failed to ${action}`, 'error'); }
    finally { setActionLoading(null); }
  };

  const handleConvert = async () => {
    if (!convertModal) return;
    setActionLoading('converting');
    try {
      const res  = await authFetch(`${apiUrl}/api/estimates/${convertModal.id}/convert-to-invoice`, {
        method: 'POST', body: JSON.stringify({ dueDate: convertDueDate }),
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.error || 'Conversion failed', 'error');
      showToast('Converted to invoice! Find it in the Invoices tab.');
      setConvertModal(null);
      fetchEstimates();
    } catch { showToast('Conversion failed', 'error'); }
    finally { setActionLoading(null); }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────

  const inputClass  = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 bg-white';
  const btnBase     = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition';
  const labelClass  = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

  // ── Editor view (split layout) ──────────────────────────────────────────────

  if (showEditor) {
    return (
      <div className="space-y-0 -mx-1">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
            {toast.msg}
          </div>
        )}

        {/* Editor toolbar */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => closeEditor()}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Estimates
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              {editingEstimate ? `Editing ${editingEstimate.estimate_number}` : 'New Estimate'}
            </span>
            <button onClick={() => closeEditor()} className={`${btnBase} bg-gray-100 text-gray-600 hover:bg-gray-200`}>
              Cancel
            </button>
            <button onClick={handleSave} className={`${btnBase} bg-amber-500 text-white hover:bg-amber-600 px-5`}>
              {editingEstimate ? 'Save Changes' : 'Create Estimate'}
            </button>
          </div>
        </div>

        {/* Split layout */}
        <div className="flex gap-6 items-start">

          {/* ── LEFT: Form ───────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 overflow-x-hidden space-y-5">

            {/* Customer */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="font-semibold text-gray-800 text-sm">Customer</h4>

              {customers.length > 0 && (
                <div>
                  <label className={labelClass}>Select Existing Customer</label>
                  <select onChange={e => selectCustomer(e.target.value)} className={inputClass} defaultValue="">
                    <option value="">Select a customer to autofill…</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.email ? ` — ${c.email}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input className={inputClass} value={form.customerName}
                    onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                    placeholder="Customer name" />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input className={inputClass} type="email" value={form.customerEmail}
                    onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                    placeholder="customer@email.com" />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input className={inputClass} value={form.customerPhone}
                    onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                    placeholder="(555) 000-0000" />
                </div>
              </div>
            </div>

            {/* Dates & Tax */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Valid Until</label>
                  <input className={inputClass} type="date" value={form.validUntil}
                    onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Tax Rate (%)</label>
                  <input className={inputClass} type="number" step="0.01" min="0" max="100"
                    value={form.taxRate ? (form.taxRate * 100).toFixed(2) : ''}
                    onChange={e => setForm(f => ({ ...f, taxRate: parseFloat(e.target.value || 0) / 100 }))}
                    placeholder="e.g. 8.5" />
                </div>
              </div>
            </div>

            {/* Quick-fill from services / catalog */}
            {(services.length > 0 || catalog.length > 0) && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h4 className="font-semibold text-gray-800 text-sm mb-3">Quick Add</h4>
                <div className="grid grid-cols-2 gap-3">
                  {services.length > 0 && (
                    <div>
                      <label className={labelClass}>Add from Services</label>
                      <select ref={serviceSelectRef}
                        onChange={e => selectService(services.find(s => s.id === parseInt(e.target.value)))}
                        className={inputClass} defaultValue="">
                        <option value="">Select service…</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name} — ${fmt(s.price)}</option>)}
                      </select>
                    </div>
                  )}
                  {catalog.length > 0 && (
                    <div>
                      <label className={labelClass}>Add Fee / Supply</label>
                      <select ref={catalogSelectRef}
                        onChange={e => selectCatalogItem(catalog.find(c => c.id === parseInt(e.target.value)))}
                        className={inputClass} defaultValue="">
                        <option value="">Select catalog item…</option>
                        {catalog.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} — {c.amount_type === 'percentage' ? `${c.amount}%` : `$${fmt(c.amount)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Line Items */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 text-sm">Line Items</h4>
                <button onClick={addItem} className="text-xs text-amber-600 font-semibold hover:text-amber-700 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
              {/* Column headers */}
              <div className="flex gap-2 mb-1 px-0.5">
                <span className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Description / Service Name</span>
                <span className="w-16 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Qty</span>
                <span className="w-24 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Unit Price</span>
                <span className="w-8" />
              </div>
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="text-xs text-gray-400 font-medium w-5 text-right flex-shrink-0">{idx + 1}</span>
                    <input className={`${inputClass} flex-1`} placeholder="Service or item description"
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)} />
                    <input className={`${inputClass} w-16 text-center`} type="number" min="1" placeholder="1"
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                    <input className={`${inputClass} w-24`} type="number" min="0" step="0.01" placeholder="0.00"
                      value={item.unitPrice}
                      onChange={e => updateItem(idx, 'unitPrice', e.target.value)} />
                    {form.items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Discount row */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Discount ($)</label>
                  <input className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 w-28 bg-white"
                    type="number" min="0" step="0.01"
                    value={form.discountAmount || ''}
                    onChange={e => setForm(f => ({ ...f, discountAmount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00" />
                </div>
                <div className="text-right text-sm space-y-0.5">
                  <div className="text-gray-500">Subtotal: <span className="font-medium text-gray-700">${fmt(totals.subtotal)}</span></div>
                  {totals.taxAmt > 0 && <div className="text-gray-500">Tax: <span className="font-medium">${fmt(totals.taxAmt)}</span></div>}
                  {parseFloat(form.discountAmount) > 0 && <div className="text-green-600">Discount: -${fmt(form.discountAmount)}</div>}
                  <div className="font-bold text-gray-900 text-base border-t border-gray-200 pt-1">Total: ${fmt(totals.total)}</div>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-amber-500" />
                  <h4 className="font-semibold text-gray-800 text-sm">Links</h4>
                </div>
                <button onClick={addLink} className="text-xs text-amber-600 font-semibold hover:text-amber-700 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Link
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-3">Include portfolio pages, galleries, or any relevant URLs — visible in the estimate and included in the email.</p>

              {/* Saved links */}
              {savedLinks.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Saved Links</p>
                  <div className="flex flex-wrap gap-1.5">
                    {savedLinks.map((sl, i) => (
                      <div key={i} className="flex items-center gap-0.5 bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
                        <button onClick={() => insertSavedLink(sl)}
                          className="px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition">
                          {sl.label || sl.url.replace(/^https?:\/\//, '')}
                        </button>
                        <button onClick={() => removeSavedLink(sl.url)}
                          className="px-1.5 py-1 text-amber-400 hover:text-red-500 hover:bg-amber-100 transition">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(form.links || []).length === 0 ? (
                <p className="text-xs text-gray-300 italic">No links added yet.</p>
              ) : (
                <div className="space-y-2">
                  {form.links.map((link, idx) => (
                    <div key={idx} className="flex gap-2 items-center w-full">
                      <input className="min-w-0 w-32 flex-shrink-0 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                        placeholder="Label"
                        value={link.label}
                        onChange={e => updateLink(idx, 'label', e.target.value)} />
                      <input className="min-w-0 flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                        placeholder="https://..."
                        value={link.url}
                        onChange={e => updateLink(idx, 'url', e.target.value)} />
                      {/* Save to saved links */}
                      {link.url && !savedLinks.some(sl => sl.url === link.url) && (
                        <button onClick={() => saveLink(link)} title="Save for later"
                          className="flex-shrink-0 p-1.5 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition">
                          <Bookmark className="w-4 h-4" />
                        </button>
                      )}
                      {link.url && savedLinks.some(sl => sl.url === link.url) && (
                        <Bookmark className="w-4 h-4 text-amber-500 flex-shrink-0 fill-amber-500" />
                      )}
                      <button onClick={() => removeLink(idx)} className="flex-shrink-0 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attachments (upload or paste URL) */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-amber-500" />
                  <h4 className="font-semibold text-gray-800 text-sm">Pictures & Media</h4>
                </div>
                <button onClick={addAttachment} className="text-xs text-amber-600 font-semibold hover:text-amber-700 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-3">Upload a file or paste a URL. Images will appear in the preview and the email.</p>
              {(form.attachments || []).length === 0 ? (
                <p className="text-xs text-gray-300 italic">No media added yet.</p>
              ) : (
                <div className="space-y-2">
                  {form.attachments.map((att, idx) => (
                    <div key={idx} className="flex gap-2 items-center w-full min-w-0">
                      {/* Upload button */}
                      <label className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer text-xs font-semibold text-gray-600 transition whitespace-nowrap">
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                        <input type="file" accept="image/*,video/*" className="hidden"
                          onChange={e => handleFileUpload(idx, e)} />
                      </label>
                      {/* URL input */}
                      <input className="min-w-0 flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                        placeholder="or paste URL…"
                        value={att.url.startsWith('data:') ? '' : att.url}
                        onChange={e => updateAttachment(idx, 'url', e.target.value)} />
                      {/* Thumb if uploaded */}
                      {att.url && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                          {/\.(jpg|jpeg|png|gif|webp)$/i.test(att.url) || att.url.startsWith('data:image') ? (
                            <img src={att.url} alt="" className="w-full h-full object-cover"
                              onError={e => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                          )}
                        </div>
                      )}
                      <button onClick={() => removeAttachment(idx)}
                        className="flex-shrink-0 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes / Terms */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Notes</label>
                  <textarea className={inputClass} rows={4} value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Scope of work, materials included, etc." />
                </div>
                <div>
                  <label className={labelClass}>Terms</label>
                  <textarea className={inputClass} rows={4} value={form.terms}
                    onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Save button (bottom) */}
            <div className="flex justify-end gap-2 pb-4">
              <button onClick={() => closeEditor()} className={`${btnBase} bg-gray-100 text-gray-600 hover:bg-gray-200`}>
                Cancel
              </button>
              <button onClick={handleSave} className={`${btnBase} bg-amber-500 text-white hover:bg-amber-600 px-6 py-2.5`}>
                {editingEstimate ? 'Save Changes' : 'Create Estimate'}
              </button>
            </div>
          </div>

          {/* ── RIGHT: Preview (1/3 of total width) ─────────────────────── */}
          <div className="w-1/3 min-w-72 flex-shrink-0 sticky top-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Live Preview</p>
            <EstimatePreview
              form={form}
              totals={totals}
              estimateNumber={editingEstimate?.estimate_number}
              businessName={user?.businessName || user?.business_name}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── List view ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Estimates</h3>
          <p className="text-sm text-gray-500 mt-0.5">Send professional estimates and convert them to invoices</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition">
          <Plus className="w-4 h-4" /> New Estimate
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',            value: stats.total,     color: 'text-gray-900' },
          { label: 'Awaiting Response',value: stats.pending,   color: 'text-blue-600' },
          { label: 'Accepted',         value: stats.accepted,  color: 'text-green-600' },
          { label: 'Converted',        value: stats.converted, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${filter === f ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading estimates…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No estimates yet</p>
          <button onClick={openCreate} className="mt-4 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition">
            Create your first estimate
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(est => {
            const sc = statusConfig[est.status] || statusConfig.draft;
            const StatusIcon = sc.icon;
            const isLoading = (action) => actionLoading === `${est.id}-${action}`;
            return (
              <div key={est.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">{est.estimate_number}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sc.color}`}>
                        <StatusIcon className="w-3 h-3" />{sc.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{est.customer_name || '—'}</p>
                    {est.customer_email && <p className="text-xs text-gray-400">{est.customer_email}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">${fmt(est.total_amount)}</p>
                    {est.valid_until && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Valid until {new Date(est.valid_until).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {Array.isArray(est.items) && est.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
                    {est.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-500">
                        <span>{item.description}</span><span>${fmt(item.amount)}</span>
                      </div>
                    ))}
                    {est.items.length > 3 && <p className="text-xs text-gray-400">+{est.items.length - 3} more items</p>}
                  </div>
                )}

                <div className="mt-4 flex gap-2 flex-wrap border-t border-gray-50 pt-3">
                  {['draft', 'sent'].includes(est.status) && (
                    <button onClick={() => openEdit(est)} className={`${btnBase} bg-gray-100 text-gray-700 hover:bg-gray-200`}>
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  {est.status === 'draft' && (
                    <button onClick={() => handleAction(est.id, 'send')} disabled={isLoading('send')}
                      className={`${btnBase} bg-blue-500 text-white hover:bg-blue-600`}>
                      <Send className="w-3.5 h-3.5" /> {isLoading('send') ? 'Sending…' : 'Send'}
                    </button>
                  )}
                  {['sent', 'viewed'].includes(est.status) && (
                    <button onClick={() => handleAction(est.id, 'remind')} disabled={isLoading('remind')}
                      className={`${btnBase} bg-amber-100 text-amber-700 hover:bg-amber-200`}>
                      <RotateCw className="w-3.5 h-3.5" /> {isLoading('remind') ? 'Sending…' : 'Remind'}
                    </button>
                  )}
                  {['sent', 'viewed'].includes(est.status) && (
                    <>
                      <button onClick={() => handleAction(est.id, 'mark-accepted')} disabled={isLoading('mark-accepted')}
                        className={`${btnBase} bg-green-100 text-green-700 hover:bg-green-200`}>
                        <ThumbsUp className="w-3.5 h-3.5" /> Mark Accepted
                      </button>
                      <button onClick={() => handleAction(est.id, 'mark-rejected')} disabled={isLoading('mark-rejected')}
                        className={`${btnBase} bg-red-100 text-red-700 hover:bg-red-200`}>
                        <ThumbsDown className="w-3.5 h-3.5" /> Mark Rejected
                      </button>
                    </>
                  )}
                  {['accepted', 'sent', 'viewed'].includes(est.status) && (
                    <button onClick={() => { setConvertModal(est); setConvertDueDate(''); }}
                      className={`${btnBase} bg-purple-500 text-white hover:bg-purple-600`}>
                      <ArrowRight className="w-3.5 h-3.5" /> Convert to Invoice
                    </button>
                  )}
                  {!['expired', 'converted', 'draft'].includes(est.status) && (
                    <button onClick={() => handleAction(est.id, 'void')} disabled={isLoading('void')}
                      className={`${btnBase} bg-gray-100 text-gray-500 hover:bg-gray-200`}>
                      <Ban className="w-3.5 h-3.5" /> Expire
                    </button>
                  )}
                  {est.status === 'draft' && (
                    <button onClick={() => handleAction(est.id, 'delete')} disabled={isLoading('delete')}
                      className={`${btnBase} bg-red-50 text-red-500 hover:bg-red-100`}>
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Convert to Invoice Modal */}
      {convertModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Convert to Invoice</h3>
              <button onClick={() => setConvertModal(null)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                A new invoice will be created from estimate <strong>{convertModal.estimate_number}</strong> for <strong>${fmt(convertModal.total_amount)}</strong>.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Invoice Due Date (optional)</label>
                <input className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                  type="date" value={convertDueDate} onChange={e => setConvertDueDate(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t border-gray-100">
              <button onClick={() => setConvertModal(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button>
              <button onClick={handleConvert} disabled={actionLoading === 'converting'}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                {actionLoading === 'converting' ? 'Converting…' : 'Convert to Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
