// AIAgents.jsx
import { useState } from 'react';
import { Bot, Globe, FileText, Power, Settings, ExternalLink } from 'lucide-react';
import WebsiteChatAgent from './WebsiteChatAgent';
import LeadFormAgent from './LeadFormAgent';

export default function AIAgents({ user, setCurrentView, apiUrl, authFetch }) {
  const [activeTab, setActiveTab] = useState('website');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
            <p className="text-gray-600 mt-1">Manage your automated AI assistants</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">2 Agents Active</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('website')}
              className={`px-8 py-4 font-semibold transition-all relative ${
                activeTab === 'website' 
                  ? 'text-blue-600 bg-white' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website Chat Agent
              </div>
              {activeTab === 'website' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('leadform')}
              className={`px-8 py-4 font-semibold transition-all relative ${
                activeTab === 'leadform' 
                  ? 'text-blue-600 bg-white' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Lead Form Agent
              </div>
              {activeTab === 'leadform' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'website' ? (
        <WebsiteChatAgent user={user} apiUrl={apiUrl} authFetch={authFetch} />
      ) : (
        <LeadFormAgent user={user} apiUrl={apiUrl} authFetch={authFetch} />
      )}
    </div>
  );
}
