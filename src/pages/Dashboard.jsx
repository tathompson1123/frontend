import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {   
  User, 
  Phone, 
  FileText, 
  Edit2, 
  Save, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Search,
} from 'lucide-react';
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
  ArrowRight,
  Copy,
  MapPin,
  Star,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Mail
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
  
  // Booking Calendar state
const [selectedBooking, setSelectedBooking] = useState(null);
const [showBookingModal, setShowBookingModal] = useState(false);
const [bookingNotes, setBookingNotes] = useState('');
const [editingNotes, setEditingNotes] = useState(false);
const [calendarView, setCalendarView] = useState('week'); // 'week' or 'month'
const [currentDate, setCurrentDate] = useState(new Date());
const [allBookings, setAllBookings] = useState([]);
const [filteredBookings, setFilteredBookings] = useState([]);
const [searchQuery, setSearchQuery] = useState('');

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

  // Google Business - AI Reply Generator
const [reviewCustomerName, setReviewCustomerName] = useState('');
const [reviewRating, setReviewRating] = useState(5);
const [reviewText, setReviewText] = useState('');
const [generatedReply, setGeneratedReply] = useState('');
const [isGeneratingReply, setIsGeneratingReply] = useState(false);
const [copied, setCopied] = useState(false);
const [repliesGeneratedToday, setRepliesGeneratedToday] = useState(0);
const [repliesGeneratedWeek, setRepliesGeneratedWeek] = useState(0);


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
  if (currentView === 'booking-calendar') {
    fetchAllBookings();
  }
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

  const fetchAllBookings = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/bookings?userId=${user.id}`);
    const data = await response.json();
    
    if (data.bookings) {
      // Sort by date, newest first
      const sorted = data.bookings.sort((a, b) => 
        new Date(b.booking_date) - new Date(a.booking_date)
      );
      setAllBookings(sorted);
      setFilteredBookings(sorted);
    }
  } catch (error) {
    console.error('Error fetching bookings:', error);
  }
};

const handleSaveNotes = async () => {
  if (!selectedBooking) return;
  
  try {
    const response = await fetch(`${apiUrl}/api/bookings/${selectedBooking.id}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        notes: bookingNotes
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update local state
      setSelectedBooking({ ...selectedBooking, job_notes: bookingNotes });
      setAllBookings(allBookings.map(b => 
        b.id === selectedBooking.id ? { ...b, job_notes: bookingNotes } : b
      ));
      setEditingNotes(false);
      alert('Notes saved successfully!');
    }
  } catch (error) {
    console.error('Error saving notes:', error);
    alert('Failed to save notes');
  }
};

const handleSearchBookings = (query) => {
  setSearchQuery(query);
  
  if (!query.trim()) {
    setFilteredBookings(allBookings);
    return;
  }
  
  const filtered = allBookings.filter(booking => 
    booking.customer_name?.toLowerCase().includes(query.toLowerCase()) ||
    booking.customer_email?.toLowerCase().includes(query.toLowerCase()) ||
    booking.customer_phone?.includes(query) ||
    booking.service_name?.toLowerCase().includes(query.toLowerCase())
  );
  
  setFilteredBookings(filtered);
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

 const handleGenerateReviewReply = async () => {
  if (!reviewText.trim()) {
    alert('Please enter a review first');
    return;
  }

  setIsGeneratingReply(true);
  setGeneratedReply('');

  try {
    const response = await fetch(`${apiUrl}/api/google-business/generate-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        reviewText: reviewText.trim(),
        rating: reviewRating,
        businessName: user.businessName,
        customerName: reviewCustomerName.trim()
      })
    });

    const data = await response.json();

    if (data.success) {
      setGeneratedReply(data.reply);
      setRepliesGeneratedToday(prev => prev + 1);
      setRepliesGeneratedWeek(prev => prev + 1);
    } else {
      alert('Failed to generate reply. Please try again.');
    }
  } catch (error) {
    console.error('AI reply error:', error);
    alert('Failed to generate reply. Please try again.');
  } finally {
    setIsGeneratingReply(false);
  }
};

  const fetchGBPData = async () => {
    try {
      const profileRes = await fetch(`${apiUrl}/api/google-business/profile?userId=${user.id}`);
      const profileData = await profileRes.json();
      
      if (profileData.connected) {
        setIsGBPConnected(true);
        setGBPProfile(profileData.profile);
      }

      const imagesRes = await fetch(`${apiUrl}/api/google-business/images?userId=${user.id}`);
      const imagesData = await imagesRes.json();
      setGBPImages(imagesData.images || []);

      const reviewsRes = await fetch(`${apiUrl}/api/google-business/reviews?userId=${user.id}`);
      const reviewsData = await reviewsRes.json();
      setReviews(reviewsData.reviews || []);

      const requestsRes = await fetch(`${apiUrl}/api/google-business/review-requests?userId=${user.id}`);
      const requestsData = await requestsRes.json();
      setReviewRequests(requestsData.requests || []);
      
    } catch (error) {
      console.error('Error fetching GBP data:', error);
    }
  };

  const menuItems = [
    { id: 'overview', icon: Home, label: 'Overview' },
    { id: 'website', icon: Globe, label: 'My Website' },
    { id: 'google-business', icon: MapPin, label: 'Google Business' },
    { id: 'services', icon: Briefcase, label: 'Services' },
    { id: 'team', icon: Users, label: 'Team' },
    { id: 'hours', icon: Clock, label: 'Business Hours' },
    { id: 'booking-calendar', icon: Calendar, label: 'Booking Calendar' },
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
              <button type="button"
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
                <button type="button"
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
            <button type="button"
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
                    type="button"
                    onClick={() => setCurrentView('services')}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                  >
                    <Briefcase className="w-8 h-8 text-purple-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Manage Services</h3>
                    <p className="text-sm text-gray-600">Add or edit your service offerings</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentView('team')}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                  >
                    <Users className="w-8 h-8 text-blue-600 mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Manage Team</h3>
                    <p className="text-sm text-gray-600">Add team members and assign services</p>
                  </button>

                  <button
                    type="button"
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
              {/* Header with Title, Buttons, and Status */}
              <div className="flex justify-between items-center">
                {/* Left: Title */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">My Website</h2>
                  <p className="text-gray-600 mt-1">View and manage your AI-generated website</p>
                </div>

                {/* Center: Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/editor')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    View/Edit Website
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEditWebsite(true)}
                    className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:border-purple-500 hover:text-purple-600 transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate New
                  </button>
                </div>

                {/* Right: Status and Publish */}
                {currentWebsite && (
                  <div className="flex flex-col items-end gap-2">
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
                      className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
                        isPublished 
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isPublished ? 'Unpublish' : 'Publish Now'}
                    </button>
                  </div>
                )}
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
                        ref={(iframe) => {
                          if (iframe && iframe.contentWindow) {
                            iframe.onload = () => {
                              try {
                                const iframeDoc = iframe.contentWindow.document;
                                
                                // Allow same-page navigation, prevent external navigation
                                iframeDoc.addEventListener('click', (e) => {
                                  const link = e.target.closest('a');
                                  if (link) {
                                    const href = link.getAttribute('href');
                                    
                                    // Allow anchor links (same-page navigation)
                                    if (href && href.startsWith('#')) {
                                      e.stopPropagation(); // Let the default anchor behavior work
                                      return;
                                    }
                                    
                                    // Prevent external navigation
                                    e.preventDefault();
                                    console.log('External navigation prevented:', href);
                                  }
                                  
                                  // Prevent form submissions
                                  const form = e.target.closest('form');
                                  if (form) {
                                    e.preventDefault();
                                    console.log('Form submission prevented in preview');
                                  }
                                }, true);
                              } catch (err) {
                                console.log('Could not access iframe:', err);
                              }
                            };
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
                      <p className="text-sm text-gray-600 mb-4">Track website performance</p>
                      <button
                        type="button"
                        onClick={() => setCurrentView('analytics')}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                      >
                        View Analytics
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

{/* Google Business Profile - AI Reply Generator */}
{currentView === 'google-business' && (
  <div className="space-y-6">
    {/* Header */}
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Google Business Profile</h2>
      <p className="text-gray-600 mt-1">AI-powered review response generator</p>
    </div>

    {/* AI Review Reply Generator */}
    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">AI Review Reply Generator</h3>
          <p className="text-sm text-gray-600">Generate professional responses in seconds</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Customer Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={reviewCustomerName}
            onChange={(e) => setReviewCustomerName(e.target.value)}
            placeholder="John Smith"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition"
          />
        </div>

        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Star Rating
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setReviewRating(star)}
                className="focus:outline-none transition hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= reviewRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 hover:text-gray-400'
                  } transition`}
                />
              </button>
            ))}
            <span className="ml-3 text-gray-700 font-medium">
              {reviewRating} {reviewRating === 1 ? 'star' : 'stars'}
            </span>
          </div>
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Text
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Paste the customer's review here..."
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Copy the review from Google Business Profile and paste it here
          </p>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerateReviewReply}
          disabled={!reviewText.trim() || isGeneratingReply}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isGeneratingReply ? (
            <>
              <RefreshCw className="w-6 h-6 animate-spin" />
              Generating Your Reply...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              Generate AI Reply
            </>
          )}
        </button>
      </div>

      {/* AI Generated Reply */}
      {generatedReply && (
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-6 h-6 text-purple-600" />
            <h4 className="font-bold text-gray-900 text-lg">Your AI-Generated Reply</h4>
          </div>
          
          <div className="bg-white p-4 rounded-lg mb-4 border border-purple-100">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{generatedReply}</p>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(generatedReply);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy to Clipboard
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleGenerateReviewReply}
              className="flex-1 bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Regenerate
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            Now paste this reply in your Google Business Profile dashboard!
          </p>
        </div>
      )}
    </div>

    {/* Usage Stats */}
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <p className="text-sm font-medium text-blue-900">Today</p>
        </div>
        <p className="text-3xl font-bold text-blue-600">{repliesGeneratedToday}</p>
        <p className="text-xs text-blue-700 mt-1">replies generated</p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <p className="text-sm font-medium text-purple-900">This Week</p>
        </div>
        <p className="text-3xl font-bold text-purple-600">{repliesGeneratedWeek}</p>
        <p className="text-xs text-purple-700 mt-1">replies generated</p>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-900">Time Saved</p>
        </div>
        <p className="text-3xl font-bold text-green-600">
          ~{Math.round(repliesGeneratedWeek * 5 / 60 * 10) / 10}h
        </p>
        <p className="text-xs text-green-700 mt-1">this week</p>
      </div>
    </div>

    {/* How It Works */}
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-blue-200">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">💡</span>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 text-lg mb-4">How It Works</h4>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                1
              </div>
              <p className="text-gray-700">
                Open your <strong>Google Business Profile</strong> (business.google.com) and check your reviews
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                2
              </div>
              <p className="text-gray-700">
                <strong>Copy the review text</strong> from a customer review
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                3
              </div>
              <p className="text-gray-700">
                <strong>Paste it here</strong>, select the star rating, and optionally add the customer's name
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                4
              </div>
              <p className="text-gray-700">
                Click <strong>"Generate AI Reply"</strong> and watch the magic happen! ✨
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                5
              </div>
              <p className="text-gray-700">
                Review the AI response, click <strong>"Copy to Clipboard"</strong>
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                6
              </div>
              <p className="text-gray-700">
                <strong>Paste the reply</strong> back in Google Business Profile and post! 🎉
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border-2 border-green-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-900">
                Saves you 5-10 minutes per review reply — that's 90% faster than writing manually!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Quick Tips */}
    <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200">
      <div className="flex items-start gap-3">
        <span className="text-3xl">💭</span>
        <div>
          <h4 className="font-bold text-gray-900 mb-3">Pro Tips</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span className="text-yellow-600">•</span>
              <span>Including the customer's name makes the reply more personal</span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-600">•</span>
              <span>For low-star reviews (1-3 stars), the AI will generate an empathetic, solution-focused response</span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-600">•</span>
              <span>Click "Regenerate" if you want a different tone or approach</span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-600">•</span>
              <span>You can edit the AI-generated reply before posting if needed</span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-600">•</span>
              <span>Respond to reviews within 24 hours for best customer engagement!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
)}

          {/* Services */}
          {currentView === 'services' && (            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Services</h2>
                  <p className="text-gray-600 mt-1">Manage your service offerings</p>
                </div>
                <button
                  type="button"
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
                    type="button"
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
                          <button type="button"
                            onClick={() => handleEditService(service)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button type="button"
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
                  type="button"
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
                    type="button"
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
                          type="button"
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
                    type="button"
                    onClick={() => setIsEditingHours(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Edit Hours
                  </button>
                ) : (
                  <button
                    type="button"
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

         {/* Booking Calendar */}
{currentView === 'booking-calendar' && (
  <div className="h-full flex gap-6">
    {/* Left Sidebar - Previous Bookings */}
    <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-200px)]">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-bold text-gray-900 mb-3">All Bookings</h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchBookings(e.target.value)}
            placeholder="Search bookings..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* Bookings List */}
      <div className="flex-1 overflow-y-auto">
        {filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No bookings found</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredBookings.map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => {
                  setSelectedBooking(booking);
                  setBookingNotes(booking.job_notes || '');
                  setShowBookingModal(true);
                  setEditingNotes(false);
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                  selectedBooking?.id === booking.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {booking.customer_name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {booking.items?.[0]?.service_name || 'Service'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    {new Date(booking.booking_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    {booking.start_time} - {booking.end_time}
                  </div>
                  {booking.employee_name && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <User className="w-3 h-3" />
                      {booking.employee_name}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Main Calendar View */}
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(currentDate.getDate() - 7);
                setCurrentDate(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(currentDate.getDate() + 7);
                setCurrentDate(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setCalendarView('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                calendarView === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setCalendarView('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                calendarView === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Week View Calendar */}
      {calendarView === 'week' && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="bg-gray-50 p-3 text-sm font-medium text-gray-500">
              Time
            </div>
            {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
              const date = new Date(currentDate);
              date.setDate(currentDate.getDate() - currentDate.getDay() + offset);
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={offset}
                  className={`bg-gray-50 p-3 text-center border-l border-gray-200 ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-bold ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Slots */}
          <div className="max-h-[600px] overflow-y-auto">
            {[9, 10, 11, 12, 13, 14, 15, 16, 17].map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
                <div className="bg-gray-50 p-3 text-sm text-gray-600 border-r border-gray-200">
                  {hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                </div>
                {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                  const date = new Date(currentDate);
                  date.setDate(currentDate.getDate() - currentDate.getDay() + offset);
                  const dateStr = date.toISOString().split('T')[0];
                  
                  // Find bookings for this day and hour
                  const dayBookings = allBookings.filter(booking => {
                    if (booking.booking_date !== dateStr) return false;
                    const startHour = parseInt(booking.start_time.split(':')[0]);
                    return startHour === hour;
                  });

                  return (
                    <div
                      key={offset}
                      className="p-2 min-h-[80px] border-l border-gray-100 hover:bg-gray-50 transition relative"
                    >
                      {dayBookings.map((booking, idx) => (
                        <button
                          key={booking.id}
                          type="button"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setBookingNotes(booking.job_notes || '');
                            setShowBookingModal(true);
                            setEditingNotes(false);
                          }}
                          className="w-full text-left p-2 rounded bg-blue-500 text-white text-xs hover:bg-blue-600 transition mb-1"
                          style={{ marginTop: idx > 0 ? '4px' : '0' }}
                        >
                          <div className="font-semibold truncate">
                            {booking.customer_name}
                          </div>
                          <div className="truncate opacity-90">
                            {booking.items?.[0]?.service_name}
                          </div>
                          <div className="text-xs opacity-75">
                            {booking.start_time} - {booking.end_time}
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month View Calendar */}
      {calendarView === 'month' && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Month view coming soon message */}
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Month View</h3>
            <p className="text-gray-600">
              Month view is coming soon! Use week view to see your bookings.
            </p>
          </div>
        </div>
      )}
    </div>

    {/* Booking Details Modal */}
    {showBookingModal && selectedBooking && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                Booking #{selectedBooking.booking_number}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowBookingModal(false);
                setSelectedBooking(null);
                setEditingNotes(false);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full font-medium ${
                selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                selectedBooking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
              </span>
            </div>

            {/* Customer Information */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-600" />
                <h3 className="font-bold text-gray-900">Customer Information</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-gray-900 font-medium">{selectedBooking.customer_name}</p>
                </div>
                
                {selectedBooking.customer_email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <p className="text-gray-900">{selectedBooking.customer_email}</p>
                  </div>
                )}
                
                {selectedBooking.customer_phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </label>
                    <p className="text-gray-900">{selectedBooking.customer_phone}</p>
                  </div>
                )}
                
                {selectedBooking.customer_address && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </label>
                    <p className="text-gray-900">{selectedBooking.customer_address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">Booking Details</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <p className="text-gray-900 font-medium">
                    {new Date(selectedBooking.booking_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time
                  </label>
                  <p className="text-gray-900 font-medium">
                    {selectedBooking.start_time} - {selectedBooking.end_time}
                  </p>
                </div>

                {selectedBooking.employee_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team Member
                    </label>
                    <p className="text-gray-900 font-medium">{selectedBooking.employee_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Service Details */}
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-gray-900">Service Details</h3>
              </div>
              
              {selectedBooking.items && selectedBooking.items.length > 0 ? (
                <div className="space-y-3">
                  {selectedBooking.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{item.service_name}</p>
                        <p className="text-sm text-gray-600">
                          Duration: {item.duration} hour{item.duration !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <p className="font-bold text-gray-900">${parseFloat(item.price).toFixed(2)}</p>
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t border-purple-200 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-gray-900">
                      ${parseFloat(selectedBooking.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No service details available</p>
              )}
            </div>

            {/* Job Notes */}
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-gray-900">Job Notes</h3>
                </div>
                
                {!editingNotes ? (
                  <button
                    type="button"
                    onClick={() => setEditingNotes(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition text-sm font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Notes
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBookingNotes(selectedBooking.job_notes || '');
                        setEditingNotes(false);
                      }}
                      className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              {editingNotes ? (
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Add notes about this job..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 resize-none"
                />
              ) : (
                <div className="bg-white rounded-lg p-4 min-h-[100px]">
                  {selectedBooking.job_notes || bookingNotes ? (
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {selectedBooking.job_notes || bookingNotes}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic">No notes added yet</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
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

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Payment Method</h3>
                  <button
                    type="button"
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
                      type="button"
                      onClick={() => setShowAddCard(true)}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                    >
                      Add Payment Method
                    </button>
                  </div>
                )}
              </div>

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
                          type="button"
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

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Billing Cycle</h3>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
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
                    type="button"
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
