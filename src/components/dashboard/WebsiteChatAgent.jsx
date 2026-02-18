import { useState, useEffect } from 'react';
import { MessageCircle, TrendingUp, Calendar, Users, Save, Rocket, Crown, Sparkles, ChevronDown, ChevronUp, History } from 'lucide-react';
import FeatureGate from './FeatureGate';

export default function WebsiteChatAgent({ user, apiUrl, authFetch, setCurrentView, isDeployed: initialDeployed, onDeploymentChange }) {
 const [agentConfig, setAgentConfig] = useState({
  agentName: 'Kurt',
  greetingMessage: "Hey it's Kurt, I just happened to look and saw you were browsing. What are you looking to get done?",
  autoOpenDelay: 14
});
  const [stats, setStats] = useState({
    conversations: 0,
    leadsCaptured: 0,
    avgResponse: '2.3s',
    bookingsCreated: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [expandedConv, setExpandedConv] = useState(null);
  const [convMessages, setConvMessages] = useState({});

  useEffect(() => {
    loadAgentConfig();
    checkDeploymentStatus();
  }, []);

  const checkDeploymentStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const response = await authFetch(`${apiUrl}/api/agents/website/status`);
      if (response.ok) {
        const data = await response.json();
        setIsDeployed(data.isDeployed);
        console.log('✅ Chat agent deployment status:', data.isDeployed);
      }
    } catch (error) {
      console.error('Error checking deployment status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const loadAgentConfig = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/agents/website/config`);
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setAgentConfig(data.config);
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

  const loadConversations = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/agents/website/conversations`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (convId) => {
    if (convMessages[convId]) {
      setExpandedConv(expandedConv === convId ? null : convId);
      return;
    }
    try {
      const response = await authFetch(`${apiUrl}/api/agents/website/conversations/${convId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setConvMessages(prev => ({ ...prev, [convId]: data.messages || [] }));
        setExpandedConv(convId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Load stats when deployed
  useEffect(() => {
    if (isDeployed) {
      loadStats();
      loadConversations();
      const interval = setInterval(loadStats, 30000);
      return () => clearInterval(interval);
    }
  }, [isDeployed]);

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      const response = await authFetch(`${apiUrl}/api/agents/website/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentConfig)
      });
      
      if (response.ok) {
        alert('✅ Configuration saved successfully!');
        window.dispatchEvent(new CustomEvent('onboarding-step-complete', { 
          detail: { step: 4 } 
        }));
      } else {
        const error = await response.json();
        alert('Failed to save: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const deployAgent = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/agents/website/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        alert('✅ Chat Agent deployed! It will appear on your published website.');
        setIsDeployed(true);
        
        if (onDeploymentChange) {
          onDeploymentChange();
        }
        
        window.dispatchEvent(new CustomEvent('onboarding-step-complete', { 
          detail: { step: 4 } 
        }));
      }
    } catch (error) {
      console.error('Error deploying agent:', error);
      alert('Failed to deploy agent');
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header with Status Badge */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">Website Chat Agent</h2>
            {isCheckingStatus ? (
              <div className="px-3 py-1 rounded-lg font-medium text-sm bg-gray-100 text-gray-700 animate-pulse">
                ⟳ Checking...
              </div>
            ) : (
              <div className={`px-3 py-1 rounded-lg font-medium text-sm ${
                isDeployed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {isDeployed ? '● Deployed' : '○ Not Deployed'}
              </div>
            )}
          </div>
          <p className="text-gray-600">
            {isDeployed 
              ? 'Automatically integrated with your published website' 
              : 'Configure settings and deploy to activate'}
          </p>
        </div>

        {/* Stats */}
        {isDeployed && (
          <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
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
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-medium">Bookings</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.bookingsCreated}</p>
              <button
                onClick={() => setCurrentView('booking-calendar')}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium mt-1"
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
        )}

        {/* Configuration and Deploy Section - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration - Takes 2/3 width */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
              <input
                type="text"
                value={agentConfig.agentName}
                onChange={(e) => setAgentConfig({ ...agentConfig, agentName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Initial Greeting</label>
              <textarea
                value={agentConfig.greetingMessage}
                onChange={(e) => setAgentConfig({ ...agentConfig, greetingMessage: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

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

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Agent Capabilities</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Identifies customer needs and recommends services</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Books appointments with available employees</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Captures leads automatically (email, phone, name)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Answers questions about pricing and availability</span>
                </div>
              </div>
            </div>

            {/* Save Configuration Button */}
            <button
              onClick={saveConfiguration}
              disabled={isSaving}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

          {/* Deploy Section - Takes 1/3 width */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Deploy Agent</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {isDeployed 
                  ? 'Your chat agent is live on your website. Visitors can interact with it in real-time.'
                  : 'Deploy this agent to add an AI-powered chat widget to your website.'}
              </p>
              
              {user?.plan?.toLowerCase() !== 'pro' && user?.plan?.toLowerCase() !== 'expert' && !isDeployed && (
                <div className="flex items-start gap-2 bg-amber-100 border border-amber-300 rounded-lg p-3 mb-4">
                  <Crown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 font-medium">
                    Pro Plan required to deploy AI agents
                  </p>
                </div>
              )}

              {user?.plan?.toLowerCase() === 'pro' || user?.plan?.toLowerCase() === 'expert' || isDeployed ? (
                <button
                  onClick={deployAgent}
                  disabled={isDeployed}
                  className={`w-full px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    isDeployed
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-600 to-blue-600 text-white hover:shadow-lg'
                  }`}
                >
                  <Rocket className="w-5 h-5" />
                  {isDeployed ? 'Agent Deployed' : 'Deploy Agent'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentView('billing')}
                  className="w-full px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-600 text-white hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Crown className="w-5 h-5" />
                  Upgrade to Pro to Deploy
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat History */}
      {isDeployed && conversations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Chat History</h3>
            <span className="ml-auto text-xs text-gray-500">{conversations.length} conversations</span>
          </div>
          <div className="space-y-2">
            {conversations.map(conv => (
              <div key={conv.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => loadMessages(conv.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.lead_name || 'Website Visitor'}
                      </p>
                      {conv.lead_status === 'booked' && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex-shrink-0">Booked</span>
                      )}
                      {conv.lead_email && (
                        <span className="text-xs text-gray-400 truncate">{conv.lead_email}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {conv.first_message || 'No messages'} · {conv.message_count} messages
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-400">{new Date(conv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    {expandedConv === conv.id ? <ChevronUp className="w-4 h-4 text-gray-400 ml-auto mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-auto mt-1" />}
                  </div>
                </button>
                {expandedConv === conv.id && convMessages[conv.id] && (
                  <div className="border-t border-gray-200 bg-gray-50 p-3 space-y-2 max-h-64 overflow-y-auto">
                    {convMessages[conv.id].map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-gradient-to-br from-blue-50 to-amber-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">✨ How It Works</h3>
        <p className="text-gray-700 mb-4">
          The AI chat agent automatically integrates with your published website. No code installation needed!
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
            <div>
              <p className="font-medium text-gray-900">Visitor lands on your website</p>
              <p className="text-sm text-gray-600">The chat widget automatically appears after {agentConfig.autoOpenDelay} seconds with: "{agentConfig.greetingMessage}"</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
            <div>
              <p className="font-medium text-gray-900">AI identifies their needs</p>
              <p className="text-sm text-gray-600">{agentConfig.agentName} asks what they're looking to get done and recommends your services</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
            <div>
              <p className="font-medium text-gray-900">Captures contact information</p>
              <p className="text-sm text-gray-600">Automatically collects name, email, and phone during booking process</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
            <div>
              <p className="font-medium text-gray-900">Books appointments instantly</p>
              <p className="text-sm text-gray-600">Schedules services with available employees and adds to your calendar automatically</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
