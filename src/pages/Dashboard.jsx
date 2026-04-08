import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingWizard from '../components/dashboard/OnboardingWizard';
import OnboardingWidget from '../components/dashboard/OnboardingWidget';
import OnboardingFlowBanner from '../components/dashboard/OnboardingFlowBanner';
import OnboardingScreen, { isOnboardingComplete, ONBOARDING_STEPS } from '../components/dashboard/OnboardingScreen';
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
  Zap,
  Crown,
  Flame,
  Sparkles,
  Search,
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
import SEOAudit from '../components/dashboard/SEOAudit';
import Billing from '../components/dashboard/Billing';
import EmailCampaigns from '../components/dashboard/EmailCampaigns';
import SettingsPage from '../components/dashboard/Settings';
import FeatureGate from '../components/dashboard/FeatureGate';
import Invoices from '../components/dashboard/Invoices';
import Estimates from '../components/dashboard/Estimates';
import PaymentProcessors from '../components/dashboard/PaymentSettings';
import Transactions from '../components/dashboard/Transactions';
import TaxFees from '../components/dashboard/TaxFees';
import DomainPolicyModal from '../components/dashboard/DomainPolicyModal';

// Combined Payment Settings page with sub-tabs
function PaymentSettingsPage({ apiUrl, user, authFetch, initialSubTab, justConnected }) {
  const [subTab, setSubTab] = useState(initialSubTab || 'processors');
  const [refreshKey, setRefreshKey] = useState(0);
  const tabs = [
    { key: 'processors', label: 'Payment Processors' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'estimates', label: 'Estimates' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'tax-fees', label: 'Taxes & Fees' },
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
      {subTab === 'processors' && <PaymentProcessors key={`processors-${refreshKey}`} apiUrl={apiUrl} user={user} authFetch={authFetch} justConnected={justConnected} onConnectionChange={() => setRefreshKey(k => k + 1)} />}
      {subTab === 'invoices' && <Invoices key={`invoices-${refreshKey}`} apiUrl={apiUrl} user={user} authFetch={authFetch} />}
      {subTab === 'estimates' && <Estimates key={`estimates-${refreshKey}`} apiUrl={apiUrl} user={user} authFetch={authFetch} />}
      {subTab === 'transactions' && <Transactions key={`transactions-${refreshKey}`} apiUrl={apiUrl} user={user} authFetch={authFetch} />}
      {subTab === 'tax-fees' && <TaxFees apiUrl={apiUrl} authFetch={authFetch} />}
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
  const [currentView, setCurrentViewRaw] = useState('overview');
  const [viewSubTab, setViewSubTab] = useState(null);
  const setCurrentView = (v) => {
    if (v && v.includes(':')) {
      const [view, sub] = v.split(':');
      setCurrentViewRaw(view);
      setViewSubTab(sub);
    } else {
      setCurrentViewRaw(v);
      setViewSubTab(null);
    }
  };
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [inOnboarding, setInOnboarding] = useState(() => !isOnboardingComplete());
  const [justConnectedProcessor, setJustConnectedProcessor] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // Unsaved changes tracking
  const isDirtyRef = useRef(false);
  const saveRef = useRef(null);
  const [pendingView, setPendingView] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // DEFINE user AND apiUrl FIRST
const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [widgetMinimized, setWidgetMinimized] = useState(false);
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Guard: redirect to home if not authenticated
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/', { replace: true });
    }
  }, []);

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
  const [showDomainPolicy, setShowDomainPolicy] = useState(false);
  
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
    requestViewChange(event.detail.view);
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
      if (params.get('saved') === '1') {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 4000);
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
          authFetch(`${apiUrl}/api/gbp-analyzer/profile`),
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
          const updatedUser = { ...user, plan: userProfileData.user.plan, businessName: userProfileData.user.businessName, twilio_phone_number: userProfileData.user.twilio_phone_number || null };
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

  // Watch for onboarding flow completion
  useEffect(() => {
    const handler = () => {
      if (isOnboardingComplete()) setInOnboarding(false);
    };
    window.addEventListener('flow-step-done', handler);
    return () => window.removeEventListener('flow-step-done', handler);
  }, []);

  const handleSkipOnboarding = () => {
    // Mark all steps done so they don't see it again
    const flow = {};
    ONBOARDING_STEPS.forEach(s => { flow[s.key] = true; });
    localStorage.setItem('onboarding_flow', JSON.stringify(flow));
    setInOnboarding(false);
    setCurrentView('overview');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleDirtyChange = useCallback((dirty) => {
    isDirtyRef.current = dirty;
  }, []);

  const requestViewChange = useCallback((view) => {
    if (isDirtyRef.current) {
      setPendingView(view);
      setShowUnsavedModal(true);
    } else {
      setCurrentView(view);
    }
  }, []);

  const handleUnsavedLeave = () => {
    isDirtyRef.current = false;
    setShowUnsavedModal(false);
    setCurrentView(pendingView);
    setPendingView(null);
  };

  const handleUnsavedSave = async () => {
    if (saveRef.current) {
      await saveRef.current();
    }
    isDirtyRef.current = false;
    setShowUnsavedModal(false);
    setCurrentView(pendingView);
    setPendingView(null);
  };

  const handleUnsavedCancel = () => {
    setShowUnsavedModal(false);
    setPendingView(null);
  };

  const onboardingActuallyComplete = (() => {
    const steps = user?.onboarding_steps_completed || {};
    const validStepKeys = ['step1', 'step2', 'step3', 'step4', 'step5'];
    return validStepKeys.filter(k => steps[k]).length === 5;
  })();

  const topMenuItems = [
    { id: 'overview', icon: Home, label: 'Overview' },
    { id: 'website', icon: Globe, label: 'Embed Website' },
    { id: 'booking-calendar', icon: Calendar, label: 'Booking Calendar' },
    { id: 'customers-leads', icon: Users, label: 'Customers & Leads' },
  ];

  const bottomMenuItems = [
    { id: 'business-settings', icon: Briefcase, label: 'Business Setup' },
    { id: 'payment-settings', icon: Wallet, label: 'Payment Settings' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const proMenuItems = [
    { id: 'ai-agents', icon: Bot, label: 'AI Agents' },
    { id: 'email-campaigns', icon: Mail, label: 'Email Marketing' },
    { id: 'google-business', icon: MapPin, label: 'Google Business' },
    { id: 'seo-audit', icon: Search, label: 'SEO Audit' },
    { id: 'market-research', icon: TrendingUp, label: 'Upsell Potential' },
  ];

  // Auto-open Pro section when navigating to a Pro view
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (['ai-agents', 'email-campaigns', 'google-business', 'seo-audit', 'market-research'].includes(currentView)) {
      setProOpen(true);
    }
  }, [currentView]);

  // Content shared between onboarding and normal dashboard
  const renderCurrentView = () => (
    <>
      {currentView === 'overview' && (
        <Overview
          bookings={bookings}
          services={services}
          employees={employees}
          setCurrentView={requestViewChange}
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
          setCurrentView={requestViewChange}
          apiUrl={apiUrl}
          authFetch={authFetch}
        />
      )}
      {currentView === 'ai-agents' && (
        <AIAgentBuilder
          user={user}
          setCurrentView={requestViewChange}
          apiUrl={apiUrl}
          authFetch={authFetch}
          onDirtyChange={handleDirtyChange}
        />
      )}
      {currentView === 'email-campaigns' && (
        <EmailCampaigns
          user={user}
          apiUrl={apiUrl}
          authFetch={authFetch}
          onDirtyChange={handleDirtyChange}
        />
      )}
      {currentView === 'website' && (
        <>
          {savedFlash && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium shadow-sm">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Changes successfully saved and published.
              <button onClick={() => setSavedFlash(false)} className="ml-auto text-green-600 hover:text-green-800">✕</button>
            </div>
          )}
          <MyWebsite
            apiUrl={apiUrl}
            user={user}
            navigate={navigate}
            websiteData={websiteData}
            authFetch={authFetch}
            setCurrentView={requestViewChange}
            refreshWebsiteData={refreshWebsiteData}
            onUserPlanUpdate={(plan) => {
              const updatedUser = { ...user, plan };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setUser(updatedUser);
            }}
          />
        </>
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
          onDirtyChange={handleDirtyChange}
          saveRef={saveRef}
          initialTab={viewSubTab}
        />
      )}
      {currentView === 'market-research' && (
        <FeatureGate user={user} requiredPlan="expert" feature="market-research" onUpgradeClick={() => requestViewChange('billing')}>
          <MarketResearch apiUrl={apiUrl} authFetch={authFetch} user={user} />
        </FeatureGate>
      )}
      {currentView === 'seo-audit' && (
        <SEOAudit apiUrl={apiUrl} user={user} authFetch={authFetch} />
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
        <Billing user={user} apiUrl={apiUrl} authFetch={authFetch} />
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
          onDirtyChange={handleDirtyChange}
          saveRef={saveRef}
        />
      )}
    </>
  );

  if (inOnboarding) {
    return (
      <>
        <OnboardingScreen
          currentView={currentView}
          setCurrentView={setCurrentView}
          onSkip={handleSkipOnboarding}
        >
          {renderCurrentView()}
        </OnboardingScreen>
        {showUnsavedModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={handleUnsavedCancel}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Unsaved Changes</h3>
                <p className="text-sm text-gray-500 mb-6">You have changes that haven't been saved yet.</p>
                <div className="flex gap-3">
                  <button onClick={handleUnsavedCancel} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
                  <button onClick={handleUnsavedLeave} className="flex-1 px-4 py-2 border border-red-200 text-red-700 rounded-xl font-medium hover:bg-red-50">Leave anyway</button>
                  <button onClick={handleUnsavedSave} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">Save & leave</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

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

{/* Onboarding sidebar widget removed — now shown as Getting Started tab */}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white shadow-xl transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Logo & Toggle */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent uppercase tracking-wider">
              SORCE
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
                onClick={() => requestViewChange(item.id)}
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
                  return (
                    <button
                      key={item.id}
                      onClick={() => requestViewChange(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white shadow-lg'
                          : 'text-amber-800 hover:bg-amber-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${!isActive ? 'text-amber-600' : ''}`} />
                      {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
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
                onClick={() => requestViewChange(item.id)}
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
     <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-8">
          {/* Top bar with plan-styled business name */}
          <div className="flex items-center justify-between mb-6">
            {(() => {
              const plan = user?.plan;
              const name = (user?.businessName || 'My Business').toUpperCase();

              if (plan === 'scale') {
                return (
                  <div className="flex items-center gap-3 relative">
                    <Flame className="w-6 h-6 text-red-500 animate-pulse" />
                    <h1 className="text-2xl font-extrabold bg-gradient-to-r from-red-600 via-orange-500 to-red-600 bg-clip-text text-transparent drop-shadow-sm" style={{ backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite' }}>
                      {name}
                    </h1>
                    <Sparkles className="w-5 h-5 text-red-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-gradient-to-r from-red-100 to-orange-100 text-red-800 border-red-300 shadow-sm shadow-red-200">
                      <Crown className="w-3 h-3" />
                      Scale
                    </span>
                  </div>
                );
              }

              if (plan === 'pro' || plan === 'expert') {
                return (
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-extrabold bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent" style={{ backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite' }}>
                      {name}
                    </h1>
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300 shadow-sm shadow-amber-200">
                      <Crown className="w-3 h-3" />
                      {plan === 'expert' ? 'Expert' : 'Pro'}
                    </span>
                  </div>
                );
              }

              if (plan === 'basic') {
                return (
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-500">
                      {name}
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-gray-100 text-gray-500 border-gray-200">
                      Basic
                    </span>
                  </div>
                );
              }

              // PRO trial (plan='pro' but trial_ends_at in future)
              const trialEnd = user?.trial_ends_at ? new Date(user.trial_ends_at) : null;
              const onTrial = trialEnd && trialEnd > new Date() && plan === 'pro';
              if (onTrial) {
                const daysLeft = Math.max(0, Math.ceil((trialEnd - new Date()) / 86400000));
                return (
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-extrabold bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent" style={{ backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite' }}>
                      {name}
                    </h1>
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300 shadow-sm shadow-amber-200">
                      <Crown className="w-3 h-3" />
                      PRO
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                      {daysLeft} day{daysLeft !== 1 ? 's' : ''} free trial
                    </span>
                  </div>
                );
              }

              // Free / no plan
              return (
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-400">
                    {name}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-gray-50 text-gray-400 border-gray-200">
                    Free
                  </span>
                </div>
              );
            })()}
            {!user?.plan && (
              <button
                onClick={() => requestViewChange('billing')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
              >
                <Zap className="w-4 h-4" />
                Upgrade Plan
              </button>
            )}
          </div>
          <style>{`
            @keyframes shimmer {
              0% { background-position: 200% center; }
              100% { background-position: -200% center; }
            }
          `}</style>

          {/* Persistent guided onboarding banner (shows after onboarding, for reference) */}
          <OnboardingFlowBanner setCurrentView={requestViewChange} />

          {renderCurrentView()}
        </div>

        {/* Dashboard Footer */}
        <footer className="border-t border-gray-200 bg-white/60 px-8 py-4 flex items-center justify-between text-xs text-gray-400">
          <span>© {new Date().getFullYear()} SORCE. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowDomainPolicy(true)}
              className="hover:text-gray-600 transition-colors"
            >
              Domain Policy
            </button>
            <span>·</span>
            <a href="mailto:support@sorce.com" className="hover:text-gray-600 transition-colors">
              Support
            </a>
          </div>
        </footer>
      </main>

      {showDomainPolicy && <DomainPolicyModal onClose={() => setShowDomainPolicy(false)} />}

      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={handleUnsavedCancel}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Unsaved Changes</h3>
                  <p className="text-sm text-gray-500">You have changes that haven't been saved yet.</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={handleUnsavedCancel}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Stay
              </button>
              <button
                onClick={handleUnsavedLeave}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
              >
                Leave Without Saving
              </button>
              <button
                onClick={handleUnsavedSave}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-blue-600 hover:shadow-lg rounded-lg transition-all"
              >
                Save & Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
