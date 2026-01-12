import { useState, useEffect } from 'react';
import { Power, Copy, Check, ExternalLink, MessageCircle, TrendingUp, Calendar, Users } from 'lucide-react';

export default function WebsiteChatAgent({ user, apiUrl, authFetch, setCurrentView }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [agentConfig, setAgentConfig] = useState({
    agentName: 'Kurt',
    greetingMessage: "Hey it's Kurt, I just happened to look and saw you were browsing. What are you looking to get done?",
    autoOpenDelay: 3
  });
  const [stats, setStats] = useState({
    conversations: 0,
    leadsCaptured: 0,
    avgResponse: '2.3s',
    bookingsCreated: 0
  });

  useEffect(() => {
    loadAgentConfig();
    loadStats();
  }, []);

  const loadAgentConfig = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/agents/website/config`);
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setAgentConfig(data.config);
          setIsEnabled(data.config.enabled || false);
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/agents/website/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const embedCode = `<!-- AI Chat Widget -->
<script>
  (function() {
    const script = document.createElement('script');
    script.src = '${window.location.origin}/chat-widget.js';
    script.setAttribute('data-business-id', '${user?.id || 'your-business-id'}');
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

  const saveConfiguration = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/agents/website/config`, {
        method: 'POST',
        body: JSON.stringify(agentConfig)
      });
      if (response.ok) {
        alert('Configuration saved successfully!');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration');
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
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Conversations</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.conversations}</p>
            <p className="text-xs text-gray-600 mt-1">This month</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Leads Captured</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.leadsCaptured}</p>
            <button
              onClick={() => setCurrentView('customers-leads')}
              className="text-xs text-green-600 hover:text-green-700 font-medium mt-1"
            >
              View in CRM →
            </button>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium">Bookings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.bookingsCreated}</p>
            <button
              onClick={() => setCurrentView('booking-calendar')}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-1"
            >
              View Calendar →
            </button>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Avg Response</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.avgResponse}</p>
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
                value={agentConfig.agentName}
                onChange={(e) => setAgentConfig({ ...agentConfig, agentName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Greeting Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Greeting
              </label>
              <textarea
                value={agentConfig.greetingMessage}
                onChange={(e) => setAgentConfig({ ...agentConfig, greetingMessage: e.target.value })}
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
                value={agentConfig.autoOpenDelay}
                onChange={(e) => setAgentConfig({ ...agentConfig, autoOpenDelay: Number(e.target.value) })}
                min="0"
                max="60"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Capabilities */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Agent Capabilities</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Captures leads automatically (email, phone, name)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Creates bookings and adds to calendar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Answers questions about services and pricing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Provides availability and scheduling options</span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button 
              onClick={saveConfiguration}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
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
              <p className="text-sm text-gray-600">The chat widget automatically appears after {agentConfig.autoOpenDelay} seconds</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900">AI initiates conversation</p>
              <p className="text-sm text-gray-600">{agentConfig.agentName} greets them naturally and asks what they need</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900">Captures lead information</p>
              <p className="text-sm text-gray-600">Automatically detects and saves contact details to Customers & Leads</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              4
            </div>
            <div>
              <p className="font-medium text-gray-900">Books appointments directly</p>
              <p className="text-sm text-gray-600">Can schedule services and add them to your Booking Calendar automatically</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
