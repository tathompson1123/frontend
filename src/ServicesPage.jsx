import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, DollarSign, Check, X } from 'lucide-react';

const ServicesPage = ({ userId }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationHours: '',
    price: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchServices();
  }, [userId]);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/services?userId=${userId}`);
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingService
        ? `${API_URL}/api/services/${editingService.id}`
        : `${API_URL}/api/services`;

      const response = await fetch(url, {
        method: editingService ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData,
          durationHours: parseFloat(formData.durationHours),
          price: parseFloat(formData.price)
        })
      });

      if (response.ok) {
        fetchServices();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', durationHours: '', price: '' });
    setShowAddForm(false);
    setEditingService(null);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      durationHours: service.duration_hours.toString(),
      price: service.price.toString()
    });
    setShowAddForm(true);
  };

  const handleToggleActive = async (service) => {
    try {
      await fetch(`${API_URL}/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !service.active })
      });
      fetchServices();
    } catch (error) {
      console.error('Error toggling service:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Your Services</h2>
            <p className="text-gray-600 mt-2">
              Manage your services and set duration times for automatic review requests
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Service
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., Lawn Mowing"
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
                value={formData.durationHours}
                onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="2.5"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Review request will be sent after this duration
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="75.00"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
        </div>
      )}

      {/* Services List */}
      {services.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No services yet</h3>
          <p className="text-gray-600 mb-6">
            Add your first service to start accepting bookings and sending review requests
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
          >
            Add Your First Service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-2 transition ${
                service.active ? 'border-transparent' : 'border-gray-300 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-sm text-gray-600">{service.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleActive(service)}
                  className={`p-2 rounded-lg transition ${
                    service.active
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold">{service.duration_hours} hours</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-2xl">${service.price}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition font-semibold"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              </div>

              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  📬 Review request sent <strong>{service.duration_hours}h</strong> after job start
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
