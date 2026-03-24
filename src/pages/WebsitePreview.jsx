import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Star, Calendar, Zap, Shield, ArrowRight, Sparkles, Check, Brain } from 'lucide-react';
import AuthModal from '../components/AuthModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'AI Lead Texting',
    description: 'Automatically text new leads using AI that sounds human. Qualify prospects 24/7.',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    icon: Brain,
    title: 'Website Chat Agent',
    description: 'AI chat widget that answers questions, qualifies visitors, and books appointments around the clock.',
    color: 'from-purple-500 to-pink-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    icon: Calendar,
    title: 'Online Booking System',
    description: 'Customers book directly from your website. Syncs with your calendar and sends reminders.',
    color: 'from-teal-500 to-emerald-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  {
    icon: Star,
    title: 'Automatic Google Reviews',
    description: 'After each booking, automatically request a Google review. Grow your reviews 100x faster.',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    icon: Zap,
    title: 'Lead Magnets',
    description: 'Discount popups, free quote forms, and seasonal offers that convert browsers into leads.',
    color: 'from-rose-500 to-red-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  {
    icon: Shield,
    title: 'Missed Call Text-Back',
    description: "Can't answer? AI texts the caller back automatically so you never lose a customer.",
    color: 'from-cyan-500 to-blue-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
  },
];

export default function WebsitePreview() {
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const [previewData, setPreviewData] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('previewWebsite');
    if (!stored) {
      navigate('/');
      return;
    }
    setPreviewData(JSON.parse(stored));
  }, [navigate]);

  useEffect(() => {
    if (previewData?.html && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      doc.open();
      doc.write(previewData.html);
      doc.close();
    }
  }, [previewData]);

  const handleAuthSuccess = async (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    setClaiming(true);
    try {
      await fetch(`${API_URL}/api/generate-preview/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          schema: previewData.schema,
          pages: previewData.pages,
          html: previewData.html,
          formData: previewData.formData,
        }),
      });
    } catch (err) {
      console.error('Claim error:', err);
    }

    sessionStorage.removeItem('previewWebsite');
    navigate('/dashboard?tab=website', { state: { showSuccess: true } });
  };

  if (!previewData) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-50 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Your Website is Ready</h1>
            <p className="text-xs text-gray-500">{previewData.formData?.businessName}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAuthModal(true)}
          className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg transition flex items-center gap-2"
        >
          Sign Up to Access
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content: Sidebar + Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar — Features */}
        <div className="w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-lg font-bold text-gray-900">Supercharge Your Website</h2>
            <p className="text-xs text-gray-500 mt-1">Everything included when you sign up</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
            {FEATURES.map((feature, i) => (
              <div key={i} className={`${feature.bg} ${feature.border} border rounded-xl p-3.5`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm">{feature.title}</h3>
                    <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar CTA */}
          <div className="p-5 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 flex-shrink-0">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full px-5 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              Sign Up to Unlock Everything
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center gap-4 mt-3">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Check className="w-3.5 h-3.5 text-green-500" /> 14-day free trial
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Check className="w-3.5 h-3.5 text-green-500" /> No credit card required
              </span>
            </div>
          </div>
        </div>

        {/* Right — Website Preview */}
        <div className="flex-1 bg-gray-100 relative">
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Website Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode="signup"
        onModeChange={() => {}}
        onSuccess={handleAuthSuccess}
      />

      {/* Claiming overlay */}
      {claiming && (
        <div className="fixed inset-0 z-[60] bg-white/80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900">Setting up your account...</p>
          </div>
        </div>
      )}
    </div>
  );
}
