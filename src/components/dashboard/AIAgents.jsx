import { useState, useEffect } from 'react';
import { Bot, MessageCircle, Mail, Sparkles } from 'lucide-react';
import WebsiteChatAgent from './WebsiteChatAgent';
import LeadFormAgent from './LeadFormAgent';

export default function AIAgents({ user, setCurrentView, apiUrl, authFetch }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [chatAgentDeployed, setChatAgentDeployed] = useState(false);
  const [leadAgentDeployed, setLeadAgentDeployed] = useState(false);

  // Load deployment status on mount
  useEffect(() => {
    loadDeploymentStatus();
  }, []);

  const loadDeploymentStatus = async () => {
    try {
      // Load chat agent status
      const chatResponse = await authFetch(`${apiUrl}/api/agents/website/status`);
      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        setChatAgentDeployed(chatData.isDeployed || false);
      }

      // Load lead form agent status
      const leadResponse = await authFetch(`${apiUrl}/api/agents/leadform/status`);
      if (leadResponse.ok) {
        const leadData = await leadResponse.json();
        setLeadAgentDeployed(leadData.isDeployed || false);
      }
    } catch (error) {
      console.error('Error loading deployment status:', error);
    }
  };

  const handleDeploymentChange = () => {
    // Reload deployment status when an agent is deployed/undeployed
    loadDeploymentStatus();
  };

  const activeAgentsCount = (chatAgentDeployed ? 1 : 0) + (leadAgentDeployed ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
              <p className="text-gray-600 mt-1">Manage your automated AI assistants</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <span className="font-semibold">{activeAgentsCount} Agent{activeAgentsCount !== 1 ? 's' : ''} Active</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'chat'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            Website Chat Agent
            {chatAgentDeployed && (
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
            )}
            {activeTab === 'chat' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('leadform')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'leadform'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Mail className="w-5 h-5" />
            Lead Form Agent
            {leadAgentDeployed && (
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
            )}
            {activeTab === 'leadform' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
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
    </div>
  );
}
