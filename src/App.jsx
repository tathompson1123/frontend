import { useState, useEffect } from 'react';
import HomePage from './HomePage';
import Dashboard from './Dashboard';
import PricingPage from './PricingPage';
import WebsiteEditor from './WebsiteEditor';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
  const token = localStorage.getItem('authToken');
  if (token) {
    verifyToken(token);
  } else {
    setIsLoading(false);
  }
  
  // Check URL for page
  const path = window.location.pathname;
  if (path === '/dashboard') {
    setCurrentPage('dashboard');
  } else if (path === '/pricing') {
    setCurrentPage('pricing');
  } else if (path === '/editor') {  // ← ADD THIS
    setCurrentPage('editor');
  }
}, []);

  // Update URL when page changes
  useEffect(() => {
  if (currentPage === 'dashboard' && isAuthenticated) {
    window.history.pushState({}, '', '/dashboard');
  } else if (currentPage === 'pricing') {
    window.history.pushState({}, '', '/pricing');
  } else if (currentPage === 'editor' && isAuthenticated) {  // ← ADD THIS
    window.history.pushState({}, '', '/editor');
  } else if (currentPage === 'home') {
    window.history.pushState({}, '', '/');
  }
}, [currentPage, isAuthenticated]);
  
  const verifyToken = async (token) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (window.location.pathname === '/dashboard') {
          setCurrentPage('dashboard');
        }
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setCurrentPage('home');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      setIsAuthenticated(false);
      setCurrentPage('home');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (user, token) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentPage('home');
  };

  const handleNavigateToPricing = () => {
    setCurrentPage('pricing');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
  };

  const handleSelectPlan = (planName) => {
    console.log('Selected plan:', planName);
    // You can handle plan selection here
    // For now, just navigate back to home or open signup
    setCurrentPage('home');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show dashboard if authenticated and on dashboard page
  if (currentPage === 'dashboard') {
    if (!isAuthenticated) {
      // Redirect to home if not authenticated
      setTimeout(() => setCurrentPage('home'), 0);
      return null;
    }
    return <Dashboard onLogout={handleLogout} />;
  }

  // Show pricing page
  if (currentPage === 'pricing') {
    return (
      <PricingPage 
        onBack={handleBackToHome}
        onSelectPlan={handleSelectPlan}
      />
    );
  }
// Show pricing page
  if (currentPage === 'pricing') {
    return (
      <PricingPage 
        onBack={handleBackToHome}
        onSelectPlan={handleSelectPlan}
      />
    );
  }

  // Show editor page  ← ADD THIS ENTIRE SECTION
  if (currentPage === 'editor') {
    if (!isAuthenticated) {
      // Redirect to home if not authenticated
      setTimeout(() => setCurrentPage('home'), 0);
      return null;
    }
    return <WebsiteEditor />;
  }

  // Show homepage
  return (
    <HomePage 
      onAuthSuccess={handleAuthSuccess}
      onNavigateToPricing={handleNavigateToPricing}
    />
  );
  // Show homepage
  return (
    <HomePage 
      onAuthSuccess={handleAuthSuccess}
      onNavigateToPricing={handleNavigateToPricing}
    />
  );
}

export default App;
