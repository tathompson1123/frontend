import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe,
  Download,
  Monitor,
  Smartphone,
  Eye,
  EyeOff,
  RefreshCw,
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
  BarChart3,
  CreditCard,
  Upload,
  Image as ImageIcon,
  Video,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('overview');
  
  // Services state
  const [services, setServices] = useState([]);
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({ 
    name: '', 
    description: '', 
    durationHours: '', 
    price: '',
    mediaUrl: '',
    mediaType: ''
  });
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Team state
  const [employees, setEmployees] = useState([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    color: '#3b82f6',
    workDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    workHours: {
      startTime: '09:00',
      endTime: '17:00'
    }
  });

  // Business Hours state
  const [businessHours, setBusinessHours] = useState([]);
  const [isEditingHours, setIsEditingHours] = useState(false);

  // Bookings state
  const [bookings, setBookings] = useState([]);

  // Billing state
  const [cardOnFile, setCardOnFile] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  const [currentWebsite, setCurrentWebsite] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showEditWebsite, setShowEditWebsite] = useState(false);
  const [websiteForm, setWebsiteForm] = useState({
    businessName: user.businessName || '',
    businessType: '',
    services: '',
    description: ''
  });
  
  const [devicePreview, setDevicePreview] = useState('desktop');

  // Fetch functions
  useEffect(() => {
    if (currentView === 'services') fetchServices();
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'team') fetchEmployees();
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'hours') fetchBusinessHours();
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'bookings') fetchBookings();
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'website') fetchWebsite();
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

  const fetchWebsite = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/website?userId=${user.id}`);
      const data = await response.json();
      if (data.website) {
        setCurrentWebsite(data.website.html_content);
        setIsPublished(data.website.is_published || false);
        setCustomDomain(data.website.custom_domain || '');
      }
    } catch (error) {
      console.error('Error fetching website:', error);
    }
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
      setServiceForm({
        ...serviceForm,
        mediaUrl: reader.result,
        mediaType
      });
    };
    reader.readAsDataURL(file);
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
          price: parseFloat(serviceForm.price),
          mediaUrl: serviceForm.mediaUrl,
          mediaType: serviceForm.mediaType
        })
      });

      if (!response.ok) throw new Error('Failed to save service');

      setShowAddService(false);
      setEditingService(null);
      setServiceForm({ name: '', description: '', durationHours: '', price: '', mediaUrl: '', mediaType: '' });
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
      price: service.price,
      mediaUrl: service.media_url || '',
      mediaType: service.media_type || ''
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
      const url = editingEmployee
        ? `${apiUrl}/api/employees/${editingEmployee.id}`
        : `${apiUrl}/api/employees`;

      const response = await fetch(url, {
        method: editingEmployee ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...employeeForm
        })
      });

      if (!response.ok) throw new Error('Failed to save employee');

      setShowAddEmployee(false);
      setEditingEmployee(null);
      setEmployeeForm({ 
        name: '', 
        email: '', 
        phone: '', 
        color: '#3b82f6',
        workDays: {
          monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
          saturday: false, sunday: false
        },
        workHours: { startTime: '09:00', endTime: '17:00' }
      });
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone || '',
      color: employee.color || '#3b82f6',
      workDays: employee.work_days || {
        monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
        saturday: false, sunday: false
      },
      workHours: employee.work_hours || { startTime: '09:00', endTime: '17:00' }
    });
    setShowAddEmployee(true);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleRegenerateWebsite = async (e) => {
    e.preventDefault();
    setIsRegenerating(true);

    try {
      const response = await fetch(`${apiUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: websiteForm.businessName,
          businessType: websiteForm.businessType,
          services: websiteForm.services,
          description: websiteForm.description
        })
      });

      const data = await response.json();
      if (data.success && data.html) {
        setCurrentWebsite(data.html);
        setShowEditWebsite(false);
        
        await fetch(`${apiUrl}/api/website`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            htmlContent: data.html
          })
        });
      }
    } catch (error) {
      console.error('Error regenerating website:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownloadWebsite = () => {
    if (!currentWebsite) return;
    const blob = new Blob([currentWebsite], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${user.businessName || 'my'}-website.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTogglePublish = async () => {
    try {
      await fetch(`${apiUrl}/api/website/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          isPublished: !isPublished
        })
      });
      setIsPublished(!isPublished);
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const menuItems = [
    { id: 'overview', icon: Home, label: 'Overview' },
    { id: 'website', icon: Globe, label: 'My Website' },
    { id: 'services', icon: Briefcase, label: 'Services' },
    { id: 'team', icon: Users, label: 'Team' },
    { id: 'hours', icon: Clock, label: 'Business Hours' },
    { id: 'bookings', icon: Calendar, label: 'Bookings' },
    { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const plans = [
    {
      name: 'Original',
      price: 29.95,
      annualPrice: 23.96,
      features: ['Website Builder', 'Mobile Responsive', 'Custom Domain', '24/7 Hosting', '3 Monthly Updates']
    },
    {
      name: 'Pro',
      price: 59.95,
      annualPrice: 47.96,
      popular: true,
      features: ['Everything in Original', 'AI Chat Widget', 'Automated Reviews', 'Daily SEO Writing', 'Unlimited Updates']
    },
    {
      name: 'Expert',
      price: 95.99,
      annualPrice: 76.79,
      features: ['Everything in Pro', 'AI Market Research', 'Priority Support', 'Strategy Calls', 'Advanced Analytics']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white shadow-xl transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex flex-col h-full">
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

          {/* Website */}
          {currentView === 'website' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">My Website</h2>
                  <p className="text-gray-600 mt-1">View and manage your AI-generated website</p>
                </div>
              </div>

              {currentWebsite ? (
                <>
                  {/* Website Preview with Device Toggle */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Globe className="w-4 h-4" />
                        <span>Website Preview</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDevicePreview('desktop')}
                          className={`px-3 py-1.5 rounded text-sm ${
                            devicePreview === 'desktop'
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-gray-600 border border-gray-300'
                          }`}
                        >
                          <Monitor className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDevicePreview('mobile')}
                          className={`px-3 py-1.5 rounded text-sm ${
                            devicePreview === 'mobile'
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-gray-600 border border-gray-300'
                          }`}
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div 
                      className={`mx-auto transition-all ${
                        devicePreview === 'mobile' ? 'max-w-md' : 'w-full'
                      }`}
                      style={{ height: '600px' }}
                    >
                      <iframe
                        srcDoc={currentWebsite}
                        title="Website Preview"
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => navigate('/editor')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:from-purple-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 border-2 border-white/20"
                    >
                      <Edit className="w-6 h-6" />
                      View/Edit Website
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowEditWebsite(true)}
                      className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-purple-500 hover:text-purple-600 transition-all flex items-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Generate New
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                      <div className="flex items-center gap-2">
                        {isPublished ? (
                          <>
                            <Eye className="w-5 h-5 text-green-600" />
                            <span className="text-green-600 font-semibold">Published</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-600">Draft</span>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleTogglePublish}
                        className={`mt-4 w-full px-4 py-2 rounded-lg text-sm font-medium transition ${
                          isPublished 
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isPublished ? 'Unpublish' : 'Publish Now'}
                      </button>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Download</h3>
                      <p className="text-sm text-gray-600 mb-4">Save website as HTML file</p>
                      <button
                        type="button"
                        onClick={handleDownloadWebsite}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download HTML
                      </button>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Custom Domain</h3>
                      <input
                        type="text"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        placeholder="yourdomain.com"
                        className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none mb-2"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await fetch(`${apiUrl}/api/website/domain`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: user.id, customDomain })
                            });
                            alert('Domain saved!');
                          } catch (error) {
                            console.error('Error saving domain:', error);
                          }
                        }}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                      >
                        Save Domain
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* No Website Yet */
                <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                  <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No website yet</h3>
                  <p className="text-gray-600 mb-6">Generate your first website to get started</p>
                  <button
                    type="button"
                    onClick={() => setShowEditWebsite(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Generate Website
                  </button>
                </div>
              )}

              {/* Regenerate Modal */}
              {showEditWebsite && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {currentWebsite ? 'Regenerate Website' : 'Generate Website'}
                    </h2>
                    
                    <form onSubmit={handleRegenerateWebsite} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Business Name *
                        </label>
                        <input
                          type="text"
                          value={websiteForm.businessName}
                          onChange={(e) => setWebsiteForm({ ...websiteForm, businessName: e.target.value })}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Business Type *
                        </label>
                        <select
                          value={websiteForm.businessType}
                          onChange={(e) => setWebsiteForm({ ...websiteForm, businessType: e.target.value })}
                          required
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">Select type...</option>
                          <option value="plumbing">Plumbing</option>
                          <option value="hvac">HVAC</option>
                          <option value="landscaping">Landscaping</option>
                          <option value="cleaning">Cleaning</option>
                          <option value="electrical">Electrical</option>
                          <option value="carpentry">Carpentry</option>
                          <option value="painting">Painting</option>
                          <option value="roofing">Roofing</option>
                          <option value="auto-repair">Auto Repair</option>
                          <option value="salon">Hair Salon</option>
                          <option value="spa">Spa/Massage</option>
                          <option value="fitness">Fitness</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Services Offered
                        </label>
                        <input
                          type="text"
                          value={websiteForm.services}
                          onChange={(e) => setWebsiteForm({ ...websiteForm, services: e.target.value })}
                          placeholder="e.g., Emergency repairs, installations, maintenance"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Business Description
                        </label>
                        <textarea
                          value={websiteForm.description}
                          onChange={(e) => setWebsiteForm({ ...websiteForm, description: e.target.value })}
                          placeholder="Tell us about your business..."
                          rows={4}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setShowEditWebsite(false)}
                          className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isRegenerating}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isRegenerating ? (
                            <>
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-5 h-5" />
                              {currentWebsite ? 'Regenerate' : 'Generate'}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
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
                      <div className="flex gap-6">
                        {/* Service Media */}
                        {service.media_url && (
                          <div className="flex-shrink-0">
                            {service.media_type === 'image' ? (
                              <img 
                                src={service.media_url} 
                                alt={service.name}
                                className="w-32 h-32 object-cover rounded-lg"
                              />
                            ) : (
                              <video 
                                src={service.media_url}
                                className="w-32 h-32 object-cover rounded-lg"
                                controls
                              />
                            )}
                          </div>
                        )}

                        {/* Service Info */}
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

                        {/* Actions */}
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

                      {/* Media Upload */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Service Image/Video (Optional)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          {serviceForm.mediaUrl ? (
                            <div className="space-y-4">
                              {serviceForm.mediaType === 'image' ? (
                                <img src={serviceForm.mediaUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                              ) : (
                                <video src={serviceForm.mediaUrl} controls className="max-h-48 mx-auto rounded-lg" />
                              )}
                              <button
                                type="button"
                                onClick={() => setServiceForm({ ...serviceForm, mediaUrl: '', mediaType: '' })}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div>
                              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <label className="cursor-pointer">
                                <span className="text-purple-600 hover:text-purple-700 font-medium">Upload a file</span>
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  onChange={handleMediaUpload}
                                  className="hidden"
                                />
                              </label>
                              <p className="text-xs text-gray-500 mt-2">PNG, JPG, MP4 up to 10MB</p>
                            </div>
                          )}
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
                            setServiceForm({ name: '', description: '', durationHours: '', price: '', mediaUrl: '', mediaType: '' });
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
                  <p className="text-gray-600 mt-1">Manage your employees and their schedules</p>
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
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: employee.color }}>
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{employee.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              employee.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {employee.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {employee.email && <p className="text-sm text-gray-600">{employee.email}</p>}
                          {employee.phone && <p className="text-sm text-gray-600">{employee.phone}</p>}
                          
                          {/* Work Schedule Display */}
                          {employee.work_hours && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Work Schedule:</p>
                              <p className="text-sm text-gray-600">
                                {employee.work_hours.startTime} - {employee.work_hours.endTime}
                              </p>
                              {employee.work_days && (
                                <div className="flex gap-1 mt-2">
                                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                                    const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][i];
                                    const isWorking = employee.work_days[dayKey];
                                    return (
                                      <span
                                        key={day}
                                        className={`text-xs px-2 py-1 rounded ${
                                          isWorking ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                                        }`}
                                      >
                                        {day}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit Employee Modal */}
              {showAddEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                    </h2>
                    
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

                      {/* Work Days */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Work Days *</label>
                        <div className="grid grid-cols-7 gap-2">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                            const dayKey = day.toLowerCase();
                            return (
                              <label key={day} className="flex flex-col items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={employeeForm.workDays[dayKey]}
                                  onChange={(e) => setEmployeeForm({
                                    ...employeeForm,
                                    workDays: { ...employeeForm.workDays, [dayKey]: e.target.checked }
                                  })}
                                  className="mb-1"
                                />
                                <span className="text-xs text-gray-600">{day.slice(0, 3)}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Work Hours */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time *</label>
                          <input
                            type="time"
                            value={employeeForm.workHours.startTime}
                            onChange={(e) => setEmployeeForm({
                              ...employeeForm,
                              workHours: { ...employeeForm.workHours, startTime: e.target.value }
                            })}
                            required
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
                          <input
                            type="time"
                            value={employeeForm.workHours.endTime}
                            onChange={(e) => setEmployeeForm({
                              ...employeeForm,
                              workHours: { ...employeeForm.workHours, endTime: e.target.value }
                            })}
                            required
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddEmployee(false);
                            setEditingEmployee(null);
                            setEmployeeForm({ 
                              name: '', email: '', phone: '', color: '#3b82f6',
                              workDays: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
                              workHours: { startTime: '09:00', endTime: '17:00' }
                            });
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
                          {isSaving ? 'Saving...' : (editingEmployee ? 'Update Employee' : 'Add Employee')}
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

          {/* Billing */}
          {currentView === 'billing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Billing & Subscription</h2>
                <p className="text-gray-600 mt-1">Manage your plan and payment methods</p>
              </div>

              {/* Current Plan */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Current Plan</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold text-purple-600 capitalize">{user.plan || 'Free'} Plan</p>
                    <p className="text-gray-600 mt-1">
                      Billing Cycle: <span className="font-semibold capitalize">{billingCycle}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">
                      ${plans.find(p => p.name.toLowerCase().includes(user.plan || 'original'))?.price || '0.00'}
                      <span className="text-lg text-gray-600">/mo</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Next billing date: {new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Payment Method</h3>
                  <button
                    onClick={() => setShowAddCard(true)}
                    className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
                  >
                    {cardOnFile ? 'Update Card' : 'Add Card'}
                  </button>
                </div>
                {cardOnFile ? (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <CreditCard className="w-8 h-8 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-900">•••• •••• •••• {cardOnFile.last4}</p>
                      <p className="text-sm text-gray-600">Expires {cardOnFile.expiry}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No payment method on file</p>
                    <button
                      onClick={() => setShowAddCard(true)}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                    >
                      Add Payment Method
                    </button>
                  </div>
                )}
              </div>

              {/* Available Plans */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Available Plans</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {plans.map((plan) => {
                    const isCurrentPlan = plan.name.toLowerCase().includes(user.plan || 'original');
                    return (
                      <div key={plan.name} className={`bg-white rounded-xl p-6 shadow-sm border-2 ${
                        plan.popular ? 'border-purple-500' : 'border-gray-200'
                      } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}>
                        {plan.popular && (
                          <span className="inline-block bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                            MOST POPULAR
                          </span>
                        )}
                        {isCurrentPlan && (
                          <span className="inline-block bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                            CURRENT PLAN
                          </span>
                        )}
                        <h4 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                        <p className="text-3xl font-bold text-gray-900 mb-1">
                          ${billingCycle === 'annual' ? plan.annualPrice : plan.price}
                          <span className="text-lg text-gray-600">/mo</span>
                        </p>
                        {billingCycle === 'annual' && (
                          <p className="text-sm text-green-600 mb-4">Save ${((plan.price - plan.annualPrice) * 12).toFixed(2)}/year</p>
                        )}
                        <ul className="space-y-2 mb-6">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <button
                          disabled={isCurrentPlan}
                          className={`w-full py-3 rounded-lg font-semibold transition ${
                            isCurrentPlan
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
                          }`}
                        >
                          {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Billing Cycle Toggle */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Billing Cycle</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      billingCycle === 'monthly'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`px-6 py-3 rounded-lg font-semibold transition relative ${
                      billingCycle === 'annual'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Annual
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                      Save 20%
                    </span>
                  </button>
                </div>
              </div>

              {/* Add Card Modal */}
              {showAddCard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Payment Method</h2>
                    <form className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex gap-4 mt-6">
                        <button
                          type="button"
                          onClick={() => setShowAddCard(false)}
                          className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          onClick={(e) => {
                            e.preventDefault();
                            setCardOnFile({ last4: '4242', expiry: '12/25' });
                            setShowAddCard(false);
                          }}
                          className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                        >
                          Save Card
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
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
