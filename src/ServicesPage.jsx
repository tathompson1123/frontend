import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, DollarSign, Check, X, ChevronRight, MapPin } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const EMPTY_FORM = {
  name: '',
  description: '',
  durationHours: '',
  price: '',
  locationType: 'business_address',
  customAddress: '',
};

// ── Booking Form tab ──────────────────────────────────────────────────────────
function BookingFormTab({ form, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Service Location</p>
        <p className="text-xs text-gray-500 mb-4">
          Choose where this service takes place. This appears on booking confirmations and emails.
        </p>

        <div className="space-y-3">
          {[
            { value: 'business_address', label: 'Business address', desc: 'Your default business location (from Business Info settings)' },
            { value: 'custom_address', label: 'Custom address', desc: 'A different fixed address for this specific service' },
            { value: 'customer_address', label: 'Customer\'s address', desc: 'Mobile or on-site service — customer provides their location' },
          ].map(opt => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                form.locationType === opt.value
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="locationType"
                value={opt.value}
                checked={form.locationType === opt.value}
                onChange={() => onChange({ locationType: opt.value })}
                className="mt-0.5 accent-amber-600"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {form.locationType === 'custom_address' && (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Custom Address
            </label>
            <input
              type="text"
              value={form.customAddress}
              onChange={e => onChange({ customAddress: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="123 Main St, City, State 12345"
            />
          </div>
        )}

        {form.locationType === 'customer_address' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800">
              The booking chat will automatically ask the customer for their address when they book this service.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Ons tab ───────────────────────────────────────────────────────────────
function AddOnsTab({ serviceId, allServices, authToken }) {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (!serviceId) { setLoading(false); return; }
    fetch(`${API_URL}/api/services/${serviceId}/addons`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.json())
      .then(d => {
        setAddons(d.addons || []);
        setSelected(new Set((d.addons || []).map(a => a.id)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [serviceId]);

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const save = async () => {
    setSaving(true);
    await fetch(`${API_URL}/api/services/${serviceId}/addons`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ addonServiceIds: Array.from(selected) }),
    });
    setSaving(false);
  };

  if (!serviceId) {
    return (
      <p className="text-sm text-gray-500 py-4">Save the service first to configure add-ons.</p>
    );
  }

  if (loading) return <p className="text-sm text-gray-500 py-4">Loading...</p>;

  const candidates = allServices.filter(s => s.id !== serviceId && s.is_addon !== false);

  if (candidates.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">
        No other services available to add as add-ons. Create additional services first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Select services customers can add on when booking this service.
      </p>
      <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
        {candidates.map(s => (
          <label key={s.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selected.has(s.id)}
              onChange={() => toggle(s.id)}
              className="accent-amber-600"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{s.name}</p>
              {s.description && <p className="text-xs text-gray-500 truncate">{s.description}</p>}
            </div>
            <span className="text-sm font-semibold text-gray-600">${parseFloat(s.price).toFixed(2)}</span>
          </label>
        ))}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="px-5 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Add-Ons'}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const ServicesPage = ({ userId, authToken }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null); // null = list view
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState('details');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => { fetchServices(); }, [userId]);

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/services`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      const data = await res.json();
      setServices(data.services || []);
    } catch (e) {
      console.error('Error fetching services:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = patch => setForm(f => ({ ...f, ...patch }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingService
      ? `${API_URL}/api/services/${editingService.id}`
      : `${API_URL}/api/services`;

    try {
      const res = await fetch(url, {
        method: editingService ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          userId,
          name: form.name,
          description: form.description,
          durationHours: parseFloat(form.durationHours),
          price: parseFloat(form.price),
          locationType: form.locationType,
          customAddress: form.customAddress || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (!editingService) {
          // Switch to editing the newly created service so Add-Ons can be configured
          setEditingService(data.service);
        }
        fetchServices();
      }
    } catch (e) {
      console.error('Error saving service:', e);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description || '',
      durationHours: String(service.duration_hours),
      price: String(service.price),
      locationType: service.location_type || 'business_address',
      customAddress: service.custom_address || '',
    });
    setActiveTab('details');
    setShowAddForm(true);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingService(null);
    setShowAddForm(false);
    setActiveTab('details');
  };

  const handleToggleActive = async (service) => {
    try {
      await fetch(`${API_URL}/api/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ active: !service.active }),
      });
      fetchServices();
    } catch (e) {
      console.error('Error toggling service:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  const TABS = [
    { id: 'details', label: 'Details' },
    { id: 'addons', label: 'Add Ons' },
    { id: 'booking_form', label: 'Booking Form' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Your Services</h2>
          <p className="text-gray-600 mt-2">
            Manage your services and booking settings
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => { setForm(EMPTY_FORM); setEditingService(null); setActiveTab('details'); setShowAddForm(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Service
          </button>
        )}
      </div>

      {/* Add/Edit panel */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg mb-8 border border-gray-200 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">
              {editingService ? `Edit: ${editingService.name}` : 'Add New Service'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'details' && (
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Service Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => handleChange({ name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g., Full Detail"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Duration (hours) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.durationHours}
                    onChange={e => handleChange({ durationHours: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="2.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={e => handleChange({ price: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="75.00"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => handleChange({ description: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    rows="3"
                    placeholder="Brief description of this service"
                  />
                </div>

                <div className="col-span-2 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
                  >
                    {editingService ? 'Update Service' : 'Add Service'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'addons' && (
              <AddOnsTab
                serviceId={editingService?.id}
                allServices={services}
                authToken={authToken}
              />
            )}

            {activeTab === 'booking_form' && (
              <div>
                <BookingFormTab form={form} onChange={handleChange} />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Services list */}
      {services.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No services yet</h3>
          <p className="text-gray-600 mb-6">
            Add your first service to start accepting bookings
          </p>
          <button
            onClick={() => { setForm(EMPTY_FORM); setEditingService(null); setActiveTab('details'); setShowAddForm(true); }}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
          >
            Add Your First Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <div
              key={service.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-2 transition ${
                service.active ? 'border-transparent' : 'border-gray-300 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleActive(service)}
                  className={`ml-2 p-2 rounded-lg transition flex-shrink-0 ${
                    service.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="font-semibold">{service.duration_hours} hours</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="font-semibold text-2xl">${parseFloat(service.price).toFixed(2)}</span>
                </div>
                {service.location_type && service.location_type !== 'business_address' && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs capitalize">
                      {service.location_type === 'customer_address' ? 'Mobile / On-site' : service.custom_address || 'Custom address'}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(service)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition font-semibold"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
