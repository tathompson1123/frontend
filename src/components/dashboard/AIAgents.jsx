import { useState, useEffect } from 'react';
import { Bot, MessageCircle, Mail, Phone, Sparkles } from 'lucide-react';
import WebsiteChatAgent from './WebsiteChatAgent';
import LeadFormAgent from './LeadFormAgent';
import MissedCallTextBack from './MissedCallTextBack';

export default function AIAgents({ user, setCurrentView, apiUrl, authFetch }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [chatAgentDeployed, setChatAgentDeployed] = useState(false);
  const [leadAgentDeployed, setLeadAgentDeployed] = useState(false);
  const [missedCallDeployed, setMissedCallDeployed] = useState(false);

  // Load deployment status on mount
  useEffect(() => {
    loadDeploymentStatus();
  }, []);

const loadDeploymentStatus = async () => {
  console.log('🔍 Loading agent deployment status...');
  
  try {
    // Load chat agent status
    const chatResponse = await authFetch(`${apiUrl}/api/agents/website/status`);
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('💬 Chat agent status:', chatData.isDeployed);
      setChatAgentDeployed(chatData.isDeployed || false);
    } else {
      console.warn('Failed to load chat agent status');
      setChatAgentDeployed(false);
    }

    // Load lead form agent status
    const leadResponse = await authFetch(`${apiUrl}/api/agents/leadform/status`);
    if (leadResponse.ok) {
      const leadData = await leadResponse.json();
      console.log('📧 Lead agent status:', leadData.isDeployed);
      setLeadAgentDeployed(leadData.isDeployed || false);
    } else {
      console.warn('Failed to load lead agent status');
      setLeadAgentDeployed(false);
    }

    // Load missed call text-back status
    const missedCallResponse = await authFetch(`${apiUrl}/api/voice/status`);
    if (missedCallResponse.ok) {
      const missedCallData = await missedCallResponse.json();
      console.log('📞 Missed call agent status:', missedCallData.deployed);
      setMissedCallDeployed(missedCallData.deployed || false);
    } else {
      console.warn('Failed to load missed call status');
      setMissedCallDeployed(false);
    }
  } catch (error) {
    console.error('❌ Error loading deployment status:', error);
    setChatAgentDeployed(false);
    setLeadAgentDeployed(false);
    setMissedCallDeployed(false);
  }
};

  const handleDeploymentChange = () => {
    // Reload deployment status when an agent is deployed/undeployed
    loadDeploymentStatus();
  };

  const activeAgentsCount = (chatAgentDeployed ? 1 : 0) + (leadAgentDeployed ? 1 : 0) + (missedCallDeployed ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">AI Agents</h1>
              <p className="text-gray-600 mt-0.5 text-sm md:text-base">Manage your automated AI assistants</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg flex-shrink-0">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <span className="font-semibold text-sm">{activeAgentsCount} Active</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="flex gap-2 border-b border-gray-200 min-w-max">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all relative whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'text-primary-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Website </span>Chat Agent
              {chatAgentDeployed && (
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              )}
              {activeTab === 'chat' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('leadform')}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all relative whitespace-nowrap ${
                activeTab === 'leadform'
                  ? 'text-primary-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Mail className="w-5 h-5" />
              Lead Form<span className="hidden sm:inline"> Agent</span>
              {leadAgentDeployed && (
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              )}
              {activeTab === 'leadform' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('missedcall')}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all relative whitespace-nowrap ${
                activeTab === 'missedcall'
                  ? 'text-primary-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Phone className="w-5 h-5" />
              Missed Call<span className="hidden sm:inline"> Text-Back</span>
              {missedCallDeployed && (
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              )}
              {activeTab === 'missedcall' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Agent Content */}
      {activeTab === 'chat' && (
        <WebsiteChatAgent
          user={user}
          apiUrl={apiUrl}
          authFetch={authFetch}
          setCurrentView={setCurrentView}
          isDeployed={chatAgentDeployed}
          onDeploymentChange={handleDeploymentChange}
        />
      )}

      {activeTab === 'leadform' && (
        <LeadFormAgent
          user={user}
          apiUrl={apiUrl}
          authFetch={authFetch}
          setCurrentView={setCurrentView}
          isDeployed={leadAgentDeployed}
          onDeploymentChange={handleDeploymentChange}
        />
      )}

      {activeTab === 'missedcall' && (
        <MissedCallTextBack
          user={user}
          apiUrl={apiUrl}
          authFetch={authFetch}
          setCurrentView={setCurrentView}
          isDeployed={missedCallDeployed}
          onDeploymentChange={handleDeploymentChange}
        />
      )}
    </div>
  );
}
