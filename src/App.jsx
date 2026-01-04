import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import WebsiteGenerator from './pages/WebsiteGenerator';
import Dashboard from './pages/Dashboard';
import PricingPage from './pages/PricingPage';
import SignupModal from './components/SignupModal';

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleOpenSignup = (planSlug, planPrice, billingCycle) => {
    console.log('✅ Opening signup modal with:', { planSlug, planPrice, billingCycle });
    
    setSelectedPlan({
      plan: planSlug,
      price: planPrice,
      billing: billingCycle
    });
    
    setIsSignupModalOpen(true);
  };

  const handleCloseSignup = () => {
    console.log('Closing signup modal');
    setIsSignupModalOpen(false);
    setSelectedPlan(null);
  };

  const handleSignupSuccess = () => {
    console.log('✅ Signup/Login successful! Navigating to dashboard...');
    setIsSignupModalOpen(false);
    setSelectedPlan(null);
    navigate('/dashboard');
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/generate" element={<WebsiteGenerator />} />
        <Route 
          path="/pricing" 
          element={
            <PricingPage 
              onOpenSignup={handleOpenSignup}
            />
          } 
        />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Signup Modal */}
      <SignupModal 
        isOpen={isSignupModalOpen}
        onClose={handleCloseSignup}
        selectedPlan={selectedPlan}
        onSuccess={handleSignupSuccess}
      />
    </>
  );
}

export default App;
