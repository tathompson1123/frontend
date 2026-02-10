import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Check, X } from 'lucide-react';

const EmployeesPage = ({ userId }) => {
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    color: '#3b82f6',
    serviceIds: []
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const colorOptions = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      // Fetch employees
      const empResponse = await fetch(`${API_URL}/api/employees?userId=${userId}`);
      const empData = await empResponse.json();
      setEmployees(empData.employees || []);

      // Fetch services
      const servResponse = await fetch(`${API_URL}/api/services?userId=${userId}`);
      const servData = await servResponse.json();
      setServices(servData.services || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingEmployee
        ? `${API_URL}/api/employees/${editingEmployee.id}`
        : `${API_URL}/api/employees`;

      const response = await fetch(url, {
        method: editingEmployee ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...formData })
      });

      if (response.ok) {
        fetchData();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', color: '#3b82f6', serviceIds: [] });
    setShowForm(false);
    setEditingEmployee(null);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone || '',
      color: employee.color || '#3b82f6',
      serviceIds: employee.service_ids || []
    });
    setShowForm(true);
  };

  const handleDelete = async (employee) => {
    if (!confirm(`Delete ${employee.name}? This cannot be undone.`)) return;

    try {
      const response = await fetch(`${API_URL}/api/employees/${employee.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const toggleService = (serviceId) => {
    setFormData(prev => {
      const serviceIds = prev.serviceIds || [];
      if (serviceIds.includes(serviceId)) {
        return { ...prev, serviceIds: serviceIds.filter(id => id !== serviceId) };
      } else {
        return { ...prev, serviceIds: [...serviceIds, serviceId] };
      }
    });
  };

  const handleToggleActive = async (employee) => {
    try {
      await fetch(`${API_URL}/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !employee.active })
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling employee:', error);
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
            <h2 className="text-3xl font-bold text-gray-900">Team & Staff</h2>
            <p className="text-gray-600 mt-2">
              Manage your team members who perform services. Multiple employees enable concurrent bookings.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="John Smith"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Calendar Color
                </label>
                <div className="flex gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-full border-4 transition ${
                        formData.color === color ? 'border-gray-900' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Services They Can Perform
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Leave all unchecked if they can perform all services
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {services.map(service => (
                  <label
                    key={service.id}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${
                      formData.serviceIds.includes(service.id)
                        ? 'border-amber-600 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviceIds.includes(service.id)}
                      onChange={() => toggleService(service.id)}
                      className="w-5 h-5 text-amber-600 rounded"
                    />
                    <span className="font-medium">{service.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
              >
                {editingEmployee ? 'Update Employee' : 'Add Employee'}
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

      {/* Employees Grid */}
      {employees.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No team members yet</h3>
          <p className="text-gray-600 mb-6">
            Add your first team member to enable multi-employee scheduling
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
          >
            Add Your First Employee
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-2 transition ${
                employee.active ? 'border-transparent' : 'border-gray-300 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: employee.color }}
                  >
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{employee.name}</h3>
                    {employee.active ? (
                      <span className="text-xs text-green-600 font-semibold">Active</span>
                    ) : (
                      <span className="text-xs text-gray-400 font-semibold">Inactive</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(employee)}
                  className={`p-2 rounded-lg transition ${
                    employee.active
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>

              {(employee.email || employee.phone) && (
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  {employee.email && <div>📧 {employee.email}</div>}
                  {employee.phone && <div>📱 {employee.phone}</div>}
                </div>
              )}

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">Can perform:</div>
                <div className="text-sm text-gray-700">
                  {employee.service_ids && employee.service_ids.length > 0
                    ? `${employee.service_ids.length} specific services`
                    : 'All services'}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => handleEdit(employee)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition font-semibold"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(employee)}
                  className="flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
