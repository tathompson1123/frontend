import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingWizard from '../components/dashboard/OnboardingWizard';
import OnboardingWidget from '../components/dashboard/OnboardingWidget';
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
  const [showOnboarding, setShowOnboarding] = useState(false);

  // DEFINE user AND apiUrl FIRST
const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [widgetMinimized, setWidgetMinimized] = useState(false);
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const completedSteps = currentUser.onboarding_steps_completed || {};
  const completedCount = Object.keys(completedSteps).filter(key => completedSteps[key]).length;
  
  // If marked complete but not all steps done, fix it
  if (currentUser.onboarding_completed && completedCount < 6) {
    const updatedUser = {
      ...currentUser,
      onboarding_completed: false
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }
}, []);


  // Shared state
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);
  const [websiteData, setWebsiteData] = useState(null);
  const [googleBusinessData, setGoogleBusinessData] = useState(null);
  
// Show welcome wizard ONLY on first signup (never on login)
useEffect(() => {
  console.log('🎯 Onboarding check:', {
    hasUser: !!user,
    userKeys: Object.keys(user || {}).length,
    hasSeenWelcome: user?.hasSeenWelcome,
    showOnboarding
  });
 if (user && Object.keys(user).length > 0 && !user.hasSeenWelcome) {
    setShowOnboarding(true);
    console.log('✅ Setting showOnboarding to TRUE');
    setShowOnboarding(true);
    markWelcomeAsSeen();
  }
}, [user]);

const markWelcomeAsSeen = async () => {
  try {
    await authFetch(`${apiUrl}/api/auth/welcome-seen`, {
      method: 'POST'
    });
    
    // Update local storage
    const updatedUser = { ...user, hasSeenWelcome: true };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  } catch (error) {
    console.error('Error marking welcome as seen:', error);
  }
};

const handleOnboardingComplete = async () => {
  setShowOnboarding(false);
  await markWelcomeAsSeen(); // Mark as seen AFTER completing
};
  
const handleOnboardingSkip = async () => {
  setShowOnboarding(false);
  await markWelcomeAsSeen(); // Mark as seen AFTER skipping
};

// Listen for navigation events from onboarding
useEffect(() => {
  const handleNavigate = (event) => {
    setCurrentView(event.detail.view);
  };
  
  window.addEventListener('navigate-to-view', handleNavigate);
  return () => window.removeEventListener('navigate-to-view', handleNavigate);
}, []);

// Listen for onboarding step completion
useEffect(() => {
  const handleStepComplete = async (event) => {
    const { step } = event.detail;
    
    // Get current user data
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Update completed steps
    const updatedSteps = {
      ...currentUser.onboarding_steps_completed,
      [`step${step}`]: true
    };
    
    // Count completed steps
    const completedCount = Object.keys(updatedSteps).filter(key => updatedSteps[key]).length;
    
    // Save to backend
    try {
      await authFetch(`${apiUrl}/api/auth/onboarding/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: step < 6 ? step + 1 : step,
          completedSteps: updatedSteps
        })
      });
      
      // Update local storage
      const updatedUser = {
        ...currentUser,
        onboarding_steps_completed: updatedSteps,
        onboarding_current_step: step < 6 ? step + 1 : step,
        // Mark onboarding complete when all 6 steps are done
        onboarding_completed: completedCount === 6
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Notify components that user was updated
      window.dispatchEvent(new Event('user-updated'));
      
      // Show onboarding wizard to guide to next step (only if not all done)
      if (completedCount < 6) {
        // Optional: trigger wizard
      }
    } catch (error) {
      console.error('Error saving step completion:', error);
    }
  };
  
  window.addEventListener('onboarding-step-complete', handleStepComplete);
  return () => window.removeEventListener('onboarding-step-complete', handleStepComplete);
}, [apiUrl]);

  // Handle URL tab parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) {
      setCurrentView(tab);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

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

  // Listen for user updates from localStorage
useEffect(() => {
  const handleStorageChange = () => {
    setUser(JSON.parse(localStorage.getItem('user') || '{}'));
  };

  // Listen for custom event when user is updated
  window.addEventListener('user-updated', handleStorageChange);
  
  return () => window.removeEventListener('user-updated', handleStorageChange);
}, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

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
    { id: 'market-research', icon: TrendingUp, label: 'Market Research' },
    { id: 'business-settings', icon: Briefcase, label: 'Business Settings' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-highlight-50">
      {showOnboarding && user && Object.keys(user).length > 0 && (
  <OnboardingWizard
    user={user}
    onComplete={handleOnboardingComplete}
    onSkip={handleOnboardingSkip}
    apiUrl={apiUrl}
    authFetch={authFetch}
  />
)}

{user && Object.keys(user).length > 0 && !user?.onboarding_completed && (
  <OnboardingWidget 
    user={user} 
    setCurrentView={setCurrentView}
    isMinimized={widgetMinimized}
    setIsMinimized={setWidgetMinimized}
    apiUrl={apiUrl}
    authFetch={authFetch}
  />
)}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white shadow-xl transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Logo & Toggle */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
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
            const isLuxuryItem = item.id === 'ai-agents' || item.id === 'google-business' || item.id === 'market-research';
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${
                  isActive
                    ? isLuxuryItem
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white shadow-xl shadow-amber-500/50'
                      : 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                    : isLuxuryItem
                      ? 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900 hover:from-amber-100 hover:to-yellow-100 border-2 border-amber-200 shadow-md'
                      : 'text-gray-700 hover:bg-primary-50'
                }`}
              >
                {isLuxuryItem && !isActive && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 ${isLuxuryItem && !isActive ? 'text-amber-600' : ''}`} />
                {sidebarOpen && (
                  <span className={`font-medium ${isLuxuryItem && !isActive ? 'font-bold' : ''}`}>
                    {item.label}
                  </span>
                )}
                {isLuxuryItem && sidebarOpen && !isActive && (
                  <span className="ml-auto text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                    PRO
                  </span>
                )}
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
     <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'} ${!user?.onboarding_completed ? (widgetMinimized ? 'mr-16' : 'mr-72') : ''}`}>
        <div className="p-8">
         {currentView === 'overview' && (
            <Overview
              bookings={bookings}
              services={services}
              employees={employees}
              setCurrentView={setCurrentView}
              user={user}
              apiUrl={apiUrl}
              authFetch={authFetch}
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
              setCurrentView={setCurrentView}
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

          {currentView === 'business-settings' && (
            <BusinessInformation
              businessHours={businessHours}
              setBusinessHours={setBusinessHours}
              services={services}
              setServices={setServices}
              fetchServices={fetchServices}
              employees={employees}
              setEmployees={setEmployees}
              fetchEmployees={fetchEmployees}
              apiUrl={apiUrl}
              user={user}
              authFetch={authFetch}
            />
          )}

         {currentView === 'market-research' && (
  <FeatureGate 
    user={user} 
    requiredPlan="expert"
    feature="market-research"
    onUpgradeClick={() => setCurrentView('billing')}
  >
    <Analytics 
      apiUrl={apiUrl}
      authFetch={authFetch}
    />
  </FeatureGate>
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
