// WebsiteChatAgent.jsx
import { useState } from 'react';
import { Power, Settings, Copy, Check, ExternalLink, MessageCircle, TrendingUp } from 'lucide-react';

export default function WebsiteChatAgent({ user, apiUrl, authFetch }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const embedCode = `<!-- Thompson's Auto Detailing - AI Chat Widget -->
<script>
  (function() {
    const script = document.createElement('script');
    script.src = '${window.location.origin}/chat-widget.js';
    script.setAttribute('data-business-id', '${user?.business_id || 'your-business-id'}');
    script.async = true;
    document.body.appendChild(script);
  })();
</script>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleAgent = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/agents/website`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !isEnabled })
      });
      if (response.ok) {
        setIsEnabled(!isEnabled);
      }
    } catch (error) {
      console.error('Error toggling agent:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Website Chat Agent</h2>
            <p className="text-gray-600 mt-1">Live chat widget for your website visitors</p>
          </div>
          <button
            onClick={toggleAgent}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isEnabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Power className="w-4 h-4" />
            {isEnabled ? 'Active' : 'Inactive'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Conversations</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">47</p>
            <p className="text-xs text-gray-600 mt-1">This month</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Leads Captured</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">23</p>
            <p className="text-xs text-gray-600 mt-1">48.9% conversion</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Avg Response</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">2.3s</p>
            <p className="text-xs text-gray-600 mt-1">Instant replies</p>
          </div>
        </div>

        {/* Configuration */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
          
          <div className="space-y-4">
            {/* Agent Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name
              </label>
              <input
                type="text"
                defaultValue="Kurt"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Greeting Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Greeting
              </label>
              <textarea
                defaultValue="Hey it's Kurt, I just happened to look and saw you were browsing. What are you looking to get done?"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Auto-open Delay */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-open After (seconds)
              </label>
              <input
                type="number"
                defaultValue="3"
                min="0"
                max="60"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Save Button */}
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Installation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Installation</h3>
            <p className="text-sm text-gray-600 mt-1">Add this code to your website</p>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Code
              </>
            )}
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-green-400 font-mono">
            {embedCode}
          </pre>
        </div>

        <div className="mt-4 flex items-center gap-4">
          
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowPreview(true);
            }}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Preview on Website
          </a>
          
            href="/docs/installation"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-700 text-sm font-medium"
          >
            View Installation Guide
          </a>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900">Visitor lands on your website</p>
              <p className="text-sm text-gray-600">The chat widget automatically appears after 3 seconds</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900">AI initiates conversation</p>
              <p className="text-sm text-gray-600">Kurt greets them naturally and asks what they need</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900">Captures lead information</p>
              <p className="text-sm text-gray-600">Automatically detects and saves contact details to your CRM</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              4
            </div>
            <div>
              <p className="font-medium text-gray-900">Books appointments or answers questions</p>
              <p className="text-sm text-gray-600">Can schedule services, provide pricing, or answer FAQs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
