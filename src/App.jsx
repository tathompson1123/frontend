import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import WebsiteGenerator from './pages/WebsiteGenerator';
import Dashboard from './pages/Dashboard';
import PricingPage from './pages/PricingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/generate" element={<WebsiteGenerator />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        /* Make SURE modal is always rendered */}
{console.log('🔍 Modal State Check:', { 
  isSignupModalOpen, 
  selectedPlan,
  modalWillRender: isSignupModalOpen 
})}

<SignupModal 
  isOpen={isSignupModalOpen}
  onClose={() => {
    console.log('❌ Closing modal');
    setIsSignupModalOpen(false);
    setSelectedPlan(null);
  }}
  selectedPlan={selectedPlan}
  onSuccess={() => {
    console.log('✅ Success callback triggered');
    setIsSignupModalOpen(false);
    setSelectedPlan(null);
    navigate('/dashboard');
  }}
  generatedWebsite={null}
/>
      </Routes>
    </Router>
  );
}

export default App;
