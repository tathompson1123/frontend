import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import WebsiteGenerator from './pages/WebsiteGenerator';
import WebsiteLoading from './pages/WebsiteLoading';
import Dashboard from './pages/Dashboard';
import PricingPage from './pages/PricingPage';
import WebsiteEditor from './pages/WebsiteEditor';
import PublicBookingPage from './pages/PublicBookingPage';
import EditorV2 from './pages/EditorV2';
import PaymentPage from './pages/PaymentPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/loading" element={<WebsiteLoading />} />
        <Route path="/generate" element={<WebsiteGenerator />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/editor" element={<WebsiteEditor />} />
        <Route path="/editor-v2" element={<EditorV2 />} />  {/* ADD THIS */}
        <Route path="/book/:businessId" element={<PublicBookingPage />} />
        <Route path="/pay/:token" element={<PaymentPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
