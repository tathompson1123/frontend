import { useState, useEffect } from 'react';
import { 
  Home, 
  Settings, 
  Users, 
  Briefcase, 
  Clock, 
  Calendar,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Sparkles,
  Plus,
  Edit,
  Trash2,
  BarChart3
} from 'lucide-react';

export default function Dashboard({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('overview');
  
  // Services state
  const [services, setServices] = useState([]);
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', durationHours: '', price: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Team state
  const [employees, setEmployees] = useState([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({ name: '', email: '', phone: '', color: '#3b82f6' });

  // Business Hours state
  const [businessHours, setBusinessHours] = useState([]);
  const [isEditingHours, setIsEditingHours] = useState(false);

  // Bookings state
  const [bookings, setBookings] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch services
  useEffect(() => {
    if (currentView === 'services') {
      fetchServices();
    }
  }, [currentView]);

  // Fetch employees
  useEffect(() => {
    if (currentView === 'team') {
      fetchEmployees();
    }
  }, [currentView]);

  // Fetch business hours
  useEffect(() => {
    if (currentView === 'hours') {
      fetchBusinessHours();
    }
  }, [currentView]);

  // Fetch bookings
  useEffect(() => {
    if (currentView === 'bookings') {
      fetchBookings();
    }
  }, [currentView]);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/services?userId=${user.id}`);
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/employees?userId=${user.id}`);
      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchBusinessHours = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/business-hours?userId=${user.id}`);
      const data = await response.json();
      setBusinessHours(data.businessHours || []);
    } catch (error) {
      console.error('Error fetching business hours:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/bookings?userId=${user.id}`);
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');

    try {
      const url = editingService 
        ? `${apiUrl}/api/services/${editingService.id}`
        : `${apiUrl}/api/services`;
      
      const response = await fetch(url, {
        method: editingService ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: serviceForm.name,
          description: serviceForm.description,
          durationHours: parseFloat(serviceForm.durationHours),
          price: parseFloat(serviceForm.price)
        })
      });

      if (!response.ok) throw new Error('Failed to save service');

      setShowAddService(false);
      setEditingService(null);
      setServiceForm({ name: '', description: '', durationHours: '', price: '' });
      fetchServices();
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      durationHours: service.duration_hours,
      price: service.price
    });
    setShowAddService(true);
  };

  const handleToggleService = async (id, active) => {
    try {
      await fetch(`${apiUrl}/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });
      fetchServices();
    } catch (error) {
      console.error('Error toggling service:', error);
    }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`${apiUrl}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...employeeForm
        })
      });

      if (!response.ok) throw new Error('Failed to save employee');

      setShowAddEmployee(false);
      setEmployeeForm({ name: '', email: '', phone: '', color: '#3b82f6' });
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBusinessHours = async () => {
    try {
      await fetch(`${apiUrl}/api/business-hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          hours: businessHours
        })
      });
      setIsEditingHours(false);
    } catch (error) {
      console.error('Error saving business hours:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (onLogout) onLogout();
    }
  };

  const menuItems = [
    { id: 'overview', icon: Home, label: 'Overview' },
    { id: 'services', icon: Briefcase, label: 'Services' },
    { id: 'team', icon: Users, label: 'Team' },
    { id: 'hours', icon: Clock, label: 'Business Hours' },
    { id: 'bookings', icon: Calendar, label: 'Bookings' },
    { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white shadow-xl transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    SORCE
                  </span>
                </div>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-8">
          {/* Overview */}
          {currentView === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.businessName || 'User'}!</h1>
                <p className="text-gray-600 mt-1">Here's what's happening with your business today.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="w-8 h-8 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-500">TODAY</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{bookings.filter(b => new Date(b.booking_date).toDateString() === new Date().toDateString()).length}</div>
                  <div className="text-sm text-gray-600 mt-1">Bookings Today</div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <Briefcase className="w-8 h-8 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-500">ACTIVE</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{services.filter(s => s.active).length}</div>
                  <div className="text-sm text-gray-600 mt-1">Active Services</div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-8 h-8 text-green-600" />
                    <span className="text-sm font-semibold text-gray-500">TEAM</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{employees.filter(e => e.active).length}</div>
                  <div className="text-sm text-gray-600 mt-1">Team Members</div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                    <span className="text-sm font-semibold text-gray-500">MONTH</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{bookings.length}</div>
                  <div className="text-sm text-gray-600 mt-1">Total Bookings</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setCurrentView('services')}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                  >
                    <Briefcase className="w-8 h-8 text-purple-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Manage Services</h3>
                    <p className="text-sm text-gray-600">Add or edit your service offerings</p>
                  </button>

                  <button
                    onClick={() => setCurrentView('team')}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                  >
                    <Users className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Manage Team</h3>
                    <p className="text-sm text-gray-600">Add team members and assign services</p>
                  </button>

                  <button
                    onClick={() => setCurrentView('hours')}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left group"
                  >
                    <Clock className="w-8 h-8 text-green-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Business Hours</h3>
                    <p className="text-sm text-gray-600">Set your availability schedule</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Services */}
          {currentView === 'services' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Services</h2>
                  <p className="text-gray-600 mt-1">Manage your service offerings</p>
                </div>
                <button
                  onClick={() => setShowAddService(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Service
                </button>
              </div>

              {services.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                  <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No services yet</h3>
                  <p className="text-gray-600 mb-6">Add your first service to get started</p>
                  <button
                    onClick={() => setShowAddService(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Create First Service
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {services.map((service) => (
                    <div key={service.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              service.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {service.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {service.description && (
                            <p className="text-gray-600 mb-4">{service.description}</p>
                          )}
                          <div className="flex gap-6 text-sm">
                            <div className="flex items-center gap-2 text-gray-700">
                              <Clock className="w-4 h-4" />
                              <span>{service.duration_hours} {service.duration_hours === 1 ? 'hour' : 'hours'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700 font-semibold">
                              <span className="text-green-600">${service.price}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditService(service)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleToggleService(service.id, !service.active)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
                          >
                            {service.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit Service Modal */}
              {showAddService && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {editingService ? 'Edit Service' : 'Add New Service'}
                    </h2>
                    
                    <form onSubmit={handleSaveService} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Service Name *
                        </label>
                        <input
                          type="text"
                          value={serviceForm.name}
                          onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                          placeholder="e.g., Basic Cleaning, Premium Plumbing"
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={serviceForm.description}
                          onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                          placeholder="Describe what's included in this service..."
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Duration (hours) *
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={serviceForm.durationHours}
                            onChange={(e) => setServiceForm({ ...serviceForm, durationHours: e.target.value })}
                            placeholder="2"
                            required
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Price ($) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={serviceForm.price}
                            onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                            placeholder="150.00"
                            required
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {saveError && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-700">
                          {saveError}
                        </div>
                      )}

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddService(false);
                            setEditingService(null);
                            setServiceForm({ name: '', description: '', durationHours: '', price: '' });
                            setSaveError('');
                          }}
                          className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : (editingService ? 'Update Service' : 'Create Service')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Team */}
          {currentView === 'team' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
                  <p className="text-gray-600 mt-1">Manage your employees and their services</p>
                </div>
                <button
                  onClick={() => setShowAddEmployee(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Employee
                </button>
              </div>

              {employees.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h3>
                  <p className="text-gray-600 mb-6">Add your first employee to get started</p>
                  <button
                    onClick={() => setShowAddEmployee(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Add First Employee
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: employee.color }}>
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{employee.name}</h3>
                          {employee.email && <p className="text-sm text-gray-600">{employee.email}</p>}
                          {employee.phone && <p className="text-sm text-gray-600">{employee.phone}</p>}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          employee.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {employee.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Employee Modal */}
              {showAddEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Employee</h2>
                    
                    <form onSubmit={handleSaveEmployee} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                        <input
                          type="text"
                          value={employeeForm.name}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={employeeForm.email}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={employeeForm.phone}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddEmployee(false);
                            setEmployeeForm({ name: '', email: '', phone: '', color: '#3b82f6' });
                          }}
                          className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : 'Add Employee'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Business Hours */}
          {currentView === 'hours' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Business Hours</h2>
                  <p className="text-gray-600 mt-1">Set your availability schedule</p>
                </div>
                {!isEditingHours ? (
                  <button
                    onClick={() => setIsEditingHours(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Edit Hours
                  </button>
                ) : (
                  <button
                    onClick={handleSaveBusinessHours}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Save Changes
                  </button>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="space-y-4">
                  {businessHours.map((day, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0">
                      <div className="w-32">
                        <span className="font-semibold text-gray-900">{day.day_name}</span>
                      </div>
                      <div className="flex items-center gap-4 flex-1">
                        {isEditingHours ? (
                          <>
                            <input
                              type="checkbox"
                              checked={day.is_open}
                              onChange={(e) => {
                                const updated = [...businessHours];
                                updated[index].is_open = e.target.checked;
                                setBusinessHours(updated);
                              }}
                              className="w-5 h-5"
                            />
                            {day.is_open && (
                              <>
                                <input
                                  type="time"
                                  value={day.open_time || ''}
                                  onChange={(e) => {
                                    const updated = [...businessHours];
                                    updated[index].open_time = e.target.value;
                                    setBusinessHours(updated);
                                  }}
                                  className="px-3 py-2 border-2 border-gray-200 rounded-lg"
                                />
                                <span>to</span>
                                <input
                                  type="time"
                                  value={day.close_time || ''}
                                  onChange={(e) => {
                                    const updated = [...businessHours];
                                    updated[index].close_time = e.target.value;
                                    setBusinessHours(updated);
                                  }}
                                  className="px-3 py-2 border-2 border-gray-200 rounded-lg"
                                />
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-600">
                            {day.is_open ? `${day.open_time} - ${day.close_time}` : 'Closed'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bookings */}
          {currentView === 'bookings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
                <p className="text-gray-600 mt-1">View and manage customer bookings</p>
              </div>

              {bookings.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-gray-600">Bookings will appear here when customers book services</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{booking.customer_name}</h3>
                          <p className="text-gray-600">{booking.customer_email}</p>
                          <p className="text-gray-600">{booking.customer_phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{new Date(booking.booking_date).toLocaleDateString()}</p>
                          <p className="text-gray-600">{booking.start_time} - {booking.end_time}</p>
                          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics */}
          {currentView === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
                <p className="text-gray-600 mt-1">Track your business performance</p>
              </div>

              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-600">Detailed analytics and insights will be available here</p>
              </div>
            </div>
          )}

          {/* Settings */}
          {currentView === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-600 mt-1">Manage your account and preferences</p>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      value={user.businessName || ''}
                      disabled
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Plan</label>
                    <input
                      type="text"
                      value={user.plan || 'free'}
                      disabled
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 capitalize"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
