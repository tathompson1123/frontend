import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Calendar,
  Globe,
  MapPin,
  Briefcase,
  Users,
  Clock,
  TrendingUp,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bot
} from 'lucide-react';

// Component imports
import Overview from '../components/dashboard/Overview';
import MyWebsite from '../components/dashboard/MyWebsite';
import BookingCalendar from '../components/dashboard/BookingCalendar';
import CustomersLeads from '../components/dashboard/CustomersLeads';
import AIAgents from '../components/dashboard/AIAgents';
import GoogleBusiness from '../components/dashboard/GoogleBusiness';
import Services from '../components/dashboard/Services';
import Team from '../components/dashboard/Team';
import BusinessInformation from '../components/dashboard/BusinessInformation';
import Analytics from '../components/dashboard/Analytics';
import Billing from '../components/dashboard/Billing';
import SettingsPage from '../components/dashboard/Settings';

// Helper function for authenticated API calls
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('overview');
  
  // Handle URL tab parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) {
      setCurrentView(tab);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);
  
  // Shared state
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);
  const [websiteData, setWebsiteData] = useState(null);
  const [googleBusinessData, setGoogleBusinessData] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch functions
  const fetchServices = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/services`);
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/employees`);
      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchBusinessHours = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/business-hours`);
      const data = await response.json();
      setBusinessHours(data.hours || []);
    } catch (error) {
      console.error('Error fetching business hours:', error);
    }
  };

  // Fetch initial data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [bookingsRes, servicesRes, employeesRes, hoursRes, websiteRes, googleBusinessRes] = await Promise.all([
          authFetch(`${apiUrl}/api/bookings`),
          authFetch(`${apiUrl}/api/services`),
          authFetch(`${apiUrl}/api/employees`),
          authFetch(`${apiUrl}/api/business-hours`),
          authFetch(`${apiUrl}/api/website`),
          authFetch(`${apiUrl}/api/google-business/profile`)
        ]);

        const bookingsData = await bookingsRes.json();
        const servicesData = await servicesRes.json();
        const employeesData = await employeesRes.json();
        const hoursData = await hoursRes.json();
        const websiteDataRes = await websiteRes.json();
        const googleBusinessDataRes = await googleBusinessRes.json();

        setBookings(bookingsData.bookings || []);
        setServices(servicesData.services || []);
        setEmployees(employeesData.employees || []);
        setBusinessHours(hoursData.hours || []);
        setWebsiteData(websiteDataRes.website || null);
        setGoogleBusinessData(googleBusinessDataRes.profile || null);

        if (websiteDataRes.website) {
          const updatedUser = { 
            ...user, 
            websiteUrl: websiteDataRes.website.url || null,
            websiteId: websiteDataRes.website.id || null,
            websitePublished: websiteDataRes.website.is_published || false
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const menuItems = [
    { id: 'overview', icon: Home, label: 'Overview' },
    { id: 'website', icon: Globe, label: 'My Website' },
    { id: 'booking-calendar', icon: Calendar, label: 'Booking Calendar' },
    { id: 'customers-leads', icon: Users, label: 'Customers & Leads' },
    { id: 'ai-agents', icon: Bot, label: 'AI Agents' },
    { id: 'google-business', icon: MapPin, label: 'Google Business' },
    { id: 'services', icon: Briefcase, label: 'Services' },
    { id: 'team', icon: Users, label: 'Team' },
    { id: 'hours', icon: Clock, label: 'Business Information' },
    { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white shadow-xl transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Logo & Toggle */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentView === item.id
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

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-8">
          {currentView === 'overview' && (
            <Overview
              bookings={bookings}
              services={services}
              employees={employees}
              setCurrentView={setCurrentView}
              user={user}
            />
          )}

          {currentView === 'booking-calendar' && (
            <BookingCalendar
              apiUrl={apiUrl}
              user={user}
              services={services}
              employees={employees}
              authFetch={authFetch}
            />
          )}

          {currentView === 'customers-leads' && (
            <CustomersLeads
              user={user}
              setCurrentView={setCurrentView}
              apiUrl={apiUrl}
              authFetch={authFetch}
            />
          )}

          {currentView === 'ai-agents' && (
            <AIAgents
              user={user}
              setCurrentView={setCurrentView}
              apiUrl={apiUrl}
              authFetch={authFetch}
            />
          )}

          {currentView === 'website' && (
            <MyWebsite 
              apiUrl={apiUrl} 
              user={user} 
              navigate={navigate} 
              websiteData={websiteData}
              authFetch={authFetch}
            />
          )}

          {currentView === 'google-business' && (
            <GoogleBusiness 
              apiUrl={apiUrl} 
              user={user}
              profileData={googleBusinessData}
              authFetch={authFetch}
            />
          )}

          {currentView === 'services' && (
            <Services
              services={services}
              setServices={setServices}
              fetchServices={fetchServices}
              apiUrl={apiUrl}
              user={user}
              authFetch={authFetch}
            />
          )}

          {currentView === 'team' && (
            <Team
              employees={employees}
              setEmployees={setEmployees}
              fetchEmployees={fetchEmployees}
              apiUrl={apiUrl}
              user={user}
              authFetch={authFetch}
            />
          )}

          {currentView === 'hours' && (
            <BusinessInformation
              businessHours={businessHours}
              setBusinessHours={setBusinessHours}
              apiUrl={apiUrl}
              user={user}
              authFetch={authFetch}
            />
          )}

          {currentView === 'analytics' && (
            <Analytics 
              apiUrl={apiUrl}
              authFetch={authFetch}
            />
          )}

          {currentView === 'billing' && (
            <Billing 
              user={user} 
              apiUrl={apiUrl}
              authFetch={authFetch}
            />
          )}

          {currentView === 'settings' && (
            <SettingsPage 
              user={user}
              authFetch={authFetch}
            />
          )}
        </div>
      </main>
    </div>
  );
}
