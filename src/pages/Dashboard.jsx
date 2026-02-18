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
  Bot,
  Wallet,
  Mail,
  ChevronDown,
  Zap
} from 'lucide-react';

// Component imports
import Overview from '../components/dashboard/Overview';
import MyWebsite from '../components/dashboard/MyWebsite';
import BookingCalendar from '../components/dashboard/BookingCalendar';
import CustomersLeads from '../components/dashboard/CustomersLeads';
import AIAgentBuilder from '../components/dashboard/AIAgentBuilder';
import GoogleBusiness from '../components/dashboard/GoogleBusiness';
import BusinessInformation from '../components/dashboard/BusinessInformation';
import MarketResearch from '../components/dashboard/MarketResearch';
import Billing from '../components/dashboard/Billing';
import EmailCampaigns from '../components/dashboard/EmailCampaigns';
import SettingsPage from '../components/dashboard/Settings';
import FeatureGate from '../components/dashboard/FeatureGate';
import Invoices from '../components/dashboard/Invoices';
import PaymentProcessors from '../components/dashboard/PaymentSettings';
import Transactions from '../components/dashboard/Transactions';

// Combined Payment Settings page with sub-tabs
function PaymentSettingsPage({ apiUrl, user, authFetch, initialSubTab, justConnected }) {
  const [subTab, setSubTab] = useState(initialSubTab || 'processors');
  const tabs = [
    { key: 'processors', label: 'Payment Processors' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'transactions', label: 'Transactions' },
  ];
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Payment Settings</h2>
        <p className="text-gray-600 mt-1">Manage payment processors, invoices, and transactions</p>
      </div>
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
              subTab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {subTab === 'processors' && <PaymentProcessors apiUrl={apiUrl} user={user} authFetch={authFetch} justConnected={justConnected} />}
      {subTab === 'invoices' && <Invoices apiUrl={apiUrl} user={user} authFetch={authFetch} />}
      {subTab === 'transactions' && <Transactions apiUrl={apiUrl} user={user} authFetch={authFetch} />}
    </div>
  );
}

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
  const [proOpen, setProOpen] = useState(false);
  const [currentView, setCurrentView] = useState('overview');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [justConnectedProcessor, setJustConnectedProcessor] = useState(null);

  // DEFINE user AND apiUrl FIRST
const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [widgetMinimized, setWidgetMinimized] = useState(false);
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const completedSteps = currentUser.onboarding_steps_completed || {};
  // Only count valid 5 steps (ignore old step6 from previous flow)
  const validStepKeys = ['step1', 'step2', 'step3', 'step4', 'step5'];
  const completedCount = validStepKeys.filter(key => completedSteps[key]).length;

  // If marked complete but not all 5 steps done, fix it
  if (currentUser.onboarding_completed && completedCount < 5) {
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
    
    // Count completed steps (only valid 5 steps)
    const validStepKeys = ['step1', 'step2', 'step3', 'step4', 'step5'];
    const completedCount = validStepKeys.filter(key => updatedSteps[key]).length;

    // Save to backend
    try {
      await authFetch(`${apiUrl}/api/auth/onboarding/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: step < 5 ? step + 1 : step,
          completedSteps: updatedSteps
        })
      });

      // Update local storage
      const updatedUser = {
        ...currentUser,
        onboarding_steps_completed: updatedSteps,
        onboarding_current_step: step < 5 ? step + 1 : step,
        // Mark onboarding complete when all 5 steps are done
        onboarding_completed: completedCount === 5
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Notify components that user was updated
      window.dispatchEvent(new Event('user-updated'));

      // Show onboarding wizard to guide to next step (only if not all done)
      if (completedCount < 5) {
        // Optional: trigger wizard
      }
    } catch (error) {
      console.error('Error saving step completion:', error);
    }
  };
  
  window.addEventListener('onboarding-step-complete', handleStepComplete);
  return () => window.removeEventListener('onboarding-step-complete', handleStepComplete);
}, [apiUrl]);

  // Handle URL tab parameter + 3DS redirect return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const flow = params.get('flow');

    if (flow === 'publish') {
      // User returning from 3DS redirect — refresh their plan and go to website tab
      setCurrentView('website');
      (async () => {
        try {
          const res = await authFetch(`${apiUrl}/api/billing/subscription`);
          if (res.ok) {
            const data = await res.json();
            if (data.plan) {
              const updatedUser = { ...user, plan: data.plan };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setUser(updatedUser);
            }
          }
        } catch (err) {
          console.error('Error refreshing plan after 3DS redirect:', err);
        }
      })();
      window.history.replaceState({}, '', '/dashboard');
    } else if (tab) {
      setCurrentView(tab);
      const connected = params.get('connected');
      if (connected) {
        setJustConnectedProcessor(connected);
      }
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
        const [bookingsRes, servicesRes, employeesRes, hoursRes, websiteRes, googleBusinessRes, userProfileRes] = await Promise.all([
          authFetch(`${apiUrl}/api/bookings`),
          authFetch(`${apiUrl}/api/services`),
          authFetch(`${apiUrl}/api/employees`),
          authFetch(`${apiUrl}/api/business-hours`),
          authFetch(`${apiUrl}/api/website`),
          authFetch(`${apiUrl}/api/google-business/profile`),
          authFetch(`${apiUrl}/api/user/profile`)
        ]);

        const bookingsData = await bookingsRes.json();
        const servicesData = await servicesRes.json();
        const employeesData = await employeesRes.json();
        const hoursData = await hoursRes.json();
        const websiteDataRes = await websiteRes.json();
        const googleBusinessDataRes = await googleBusinessRes.json();
        const userProfileData = await userProfileRes.json();

        setBookings(bookingsData.bookings || []);
        setServices(servicesData.services || []);
        setEmployees(employeesData.employees || []);
        setBusinessHours(hoursData.hours || []);
        setWebsiteData(websiteDataRes.website || null);
        setGoogleBusinessData(googleBusinessDataRes.profile || null);

        // Sync user plan and profile from backend (catches plan upgrades)
        if (userProfileData.user) {
          const updatedUser = { ...user, plan: userProfileData.user.plan, businessName: userProfileData.user.businessName };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }

        if (websiteDataRes.website) {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = {
            ...currentUser,
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

  const refreshWebsiteData = async () => {
  try {
    const response = await authFetch(`${apiUrl}/api/website`);
    const data = await response.json();
    setWebsiteData(data.website || null);
  } catch (error) {
    console.error('Error refreshing website:', error);
  }
};

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

  const topMenuItems = [
    { id: 'overview', icon: Home, label: 'Overview' },
    { id: 'website', icon: Globe, label: 'My Website' },
    { id: 'booking-calendar', icon: Calendar, label: 'Booking Calendar' },
    { id: 'customers-leads', icon: Users, label: 'Customers & Leads' },
  ];

  const bottomMenuItems = [
    { id: 'business-settings', icon: Briefcase, label: 'Business Settings' },
    { id: 'payment-settings', icon: Wallet, label: 'Payment Settings' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const proMenuItems = [
    { id: 'ai-agents', icon: Bot, label: 'AI Agents' },
    { id: 'email-campaigns', icon: Mail, label: 'Email Marketing' },
    { id: 'google-business', icon: MapPin, label: 'Google Business' },
    { id: 'market-research', icon: TrendingUp, label: 'Market Research' },
  ];

  // Auto-open Pro section when navigating to a Pro view
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (['ai-agents', 'email-campaigns', 'google-business', 'market-research'].includes(currentView)) {
      setProOpen(true);
    }
  }, [currentView]);

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

{user && Object.keys(user).length > 0 && (() => {
  // Only hide widget if ALL 5 steps are actually complete
  const steps = user?.onboarding_steps_completed || {};
  const validStepKeys = ['step1', 'step2', 'step3', 'step4', 'step5'];
  const completedCount = validStepKeys.filter(key => steps[key]).length;
  const actuallyComplete = completedCount === 5;
  console.log('🎯 OnboardingWidget check:', { steps, completedCount, actuallyComplete, shouldShow: !actuallyComplete });
  return !actuallyComplete;
})() && (
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
        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {topMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-primary-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}

          {/* PRO Section */}
          <div className="pt-2">
            <button
              onClick={() => setProOpen(p => !p)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900 hover:from-amber-100 hover:to-yellow-100 border-2 border-amber-200 shadow-md"
            >
              <Zap className="w-5 h-5 flex-shrink-0 text-amber-600" />
              {sidebarOpen && (
                <>
                  <span className="font-bold">PRO Features</span>
                  <ChevronDown className={`w-4 h-4 text-amber-600 flex-shrink-0 ml-auto transition-transform duration-200 ${proOpen ? '' : '-rotate-90'}`} />
                </>
              )}
            </button>

            {proOpen && (
              <div className={`mt-1 space-y-1 ${sidebarOpen ? 'ml-3 border-l-2 border-amber-200 pl-3' : ''}`}>
                {proMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  const isPurple = item.id === 'market-research';
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive
                          ? isPurple
                            ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white shadow-lg'
                            : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white shadow-lg'
                          : isPurple
                            ? 'text-purple-800 hover:bg-purple-50'
                            : 'text-amber-800 hover:bg-amber-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${
                        !isActive ? (isPurple ? 'text-purple-600' : 'text-amber-600') : ''
                      }`} />
                      {sidebarOpen && (
                        <>
                          <span className="text-sm font-medium">{item.label}</span>
                          {!isActive && (
                            <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold text-white ${
                              isPurple ? 'bg-purple-500' : 'bg-amber-500'
                            }`}>
                              {isPurple ? 'EXPERT' : 'PRO'}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-primary-50'
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
            <AIAgentBuilder
              user={user}
              setCurrentView={setCurrentView}
              apiUrl={apiUrl}
              authFetch={authFetch}
            />
          )}

          {currentView === 'email-campaigns' && (
            <FeatureGate user={user} requiredPlan="pro" feature="email-campaigns" onUpgradeClick={() => setCurrentView('billing')}>
              <EmailCampaigns
                user={user}
                apiUrl={apiUrl}
                authFetch={authFetch}
              />
            </FeatureGate>
          )}

          {currentView === 'website' && (
            <MyWebsite
              apiUrl={apiUrl}
              user={user}
              navigate={navigate}
              websiteData={websiteData}
              authFetch={authFetch}
              setCurrentView={setCurrentView}
              refreshWebsiteData={refreshWebsiteData}
              onUserPlanUpdate={(plan) => {
                const updatedUser = { ...user, plan };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
              }}
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
    <MarketResearch
      apiUrl={apiUrl}
      authFetch={authFetch}
      user={user}
    />
  </FeatureGate>
)}
          {currentView === 'payment-settings' && (
            <PaymentSettingsPage
              apiUrl={apiUrl}
              user={user}
              authFetch={authFetch}
              justConnected={justConnectedProcessor}
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
              apiUrl={apiUrl}
              authFetch={authFetch}
              onUserUpdate={(updatedUser) => {
                const merged = { ...user, ...updatedUser };
                localStorage.setItem('user', JSON.stringify(merged));
                setUser(merged);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
