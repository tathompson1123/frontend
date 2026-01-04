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
  Settings,      // ← Icon from lucide-react
  LogOut,
  Menu,
  X
} from 'lucide-react';

// Component imports
import Overview from '../components/dashboard/Overview';
import BookingCalendar from '../components/dashboard/BookingCalendar';
import MyWebsite from '../components/dashboard/MyWebsite';
import GoogleBusiness from '../components/dashboard/GoogleBusiness';
import Services from '../components/dashboard/Services';
import Team from '../components/dashboard/Team';
import BusinessHours from '../components/dashboard/BusinessHours';
import Analytics from '../components/dashboard/Analytics';
import Billing from '../components/dashboard/Billing';
import SettingsPage from '../components/dashboard/Settings';  // ← Renamed to avoid conflict

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('overview');
  
  // Shared state (kept in Dashboard)
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch functions (kept in Dashboard for reuse)
  const fetchServices = async () => { /* ... */ };
  const fetchEmployees = async () => { /* ... */ };
  const fetchBusinessHours = async () => { /* ... */ };

  // Fetch initial data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [bookingsRes, servicesRes, employeesRes] = await Promise.all([
          fetch(`${apiUrl}/api/bookings?userId=${user.id}`),
          fetch(`${apiUrl}/api/services?userId=${user.id}`),
          fetch(`${apiUrl}/api/employees?userId=${user.id}`)
        ]);

        const bookingsData = await bookingsRes.json();
        const servicesData = await servicesRes.json();
        const employeesData = await employeesRes.json();

        setBookings(bookingsData.bookings || []);
        setServices(servicesData.services || []);
        setEmployees(employeesData.employees || []);
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
    { id: 'booking-calendar', icon: Calendar, label: 'Booking Calendar' },
    { id: 'website', icon: Globe, label: 'My Website' },
    { id: 'google-business', icon: MapPin, label: 'Google Business' },
    { id: 'services', icon: Briefcase, label: 'Services' },
    { id: 'team', icon: Users, label: 'Team' },
    { id: 'hours', icon: Clock, label: 'Business Hours' },
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
  <nav className="p-4 space-y-2">
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
            />
          )}

          {currentView === 'website' && (
            <MyWebsite apiUrl={apiUrl} user={user} navigate={navigate} />
          )}

          {currentView === 'google-business' && (
            <GoogleBusiness apiUrl={apiUrl} user={user} />
          )}

          {currentView === 'services' && (
            <Services
              services={services}
              setServices={setServices}
              fetchServices={fetchServices}
              apiUrl={apiUrl}
              user={user}
            />
          )}

          {currentView === 'team' && (
            <Team
              employees={employees}
              setEmployees={setEmployees}
              fetchEmployees={fetchEmployees}
              apiUrl={apiUrl}
              user={user}
            />
          )}

          {currentView === 'hours' && (
            <BusinessHours
              businessHours={businessHours}
              setBusinessHours={setBusinessHours}
              apiUrl={apiUrl}
              user={user}
            />
          )}

          {currentView === 'analytics' && <Analytics />}

          {currentView === 'billing' && (
            <Billing user={user} apiUrl={apiUrl} />
          )}

          {currentView === 'settings' && <Settings user={user} />}
        </div>
      </main>
    </div>
  );
}
