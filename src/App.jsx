import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import WebsiteLoading from './pages/WebsiteLoading';
import Dashboard from './pages/Dashboard';
import PricingPage from './pages/PricingPage';
import WebsiteEditor from './pages/WebsiteEditor';
import PublicBookingPage from './pages/PublicBookingPage';
import WebsiteEditorNew from './pages/WebsiteEditorNew';
import PaymentPage from './pages/PaymentPage';
import LeadMagnetPage from './pages/LeadMagnetPage';
import EmployeeInvitePage from './pages/EmployeeInvitePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/loading" element={<WebsiteLoading />} />
        <Route path="/generate" element={<Navigate to="/" replace />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/editor" element={<WebsiteEditor />} />
        <Route path="/editor-v2" element={<WebsiteEditorNew />} />
        <Route path="/book/:businessId" element={<PublicBookingPage />} />
        <Route path="/pay/:token" element={<PaymentPage />} />
        <Route path="/lead/:userId/:type" element={<LeadMagnetPage />} />
        <Route path="/employee-invite" element={<EmployeeInvitePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
