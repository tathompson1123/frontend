import { useState, useEffect, useRef } from 'react';
import {
  Bot, MessageCircle, Sparkles, ChevronDown, ChevronRight, Save, Rocket,
  Crown, Settings, User, Brain, Phone, Send, RefreshCw,
  BookOpen, Target, MessageSquare, Loader2, Calendar, Wrench
} from 'lucide-react';

export default function AIAgentBuilder({ user, setCurrentView, apiUrl, authFetch }) {
  const [activeAgent, setActiveAgent] = useState('chat'); // 'chat' or 'leadform'
  const [setupMode, setSetupMode] = useState('ai'); // 'manual' or 'ai'
  const [chatAgentDeployed, setChatAgentDeployed] = useState(false);
  const [leadAgentDeployed, setLeadAgentDeployed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [expandedSections, setExpandedSections] = useState(['personality']);

  // Chat preview state
  const [previewMessages, setPreviewMessages] = useState([]);
  const [previewInput, setPreviewInput] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const previewRef = useRef(null);

  // Initial messages for each agent type
  const getInitialAiMessage = (agentType) => {
    if (agentType === 'chat') {
      return {
        role: 'assistant',
        content: "Hi! I'm the SORCE AI Assistant and I'll help you configure your Website Chat Agent.\n\nI'm going to ask you a few questions so I can set this up exactly how you want it.\n\n**What type of business do you have?** (e.g., auto detailing, plumbing, landscaping, salon, etc.)"
      };
    } else {
      return {
        role: 'assistant',
        content: "Hi! I'm the SORCE AI Assistant and I'll help you configure your SMS Lead Form Agent.\n\nI'll ask you some questions about how you want to handle incoming leads via text message.\n\n**What type of business do you have?** (e.g., auto detailing, plumbing, landscaping, salon, etc.)"
      };
    }
  };

  // AI Assistant state - starts with a guided question
  const [aiMessages, setAiMessages] = useState([getInitialAiMessage('chat')]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiChatRef = useRef(null);

  // Website Chat Agent config
  const [chatConfig, setChatConfig] = useState({
    agentName: 'Kurt',
    greetingMessage: "Hey it's Kurt, I just happened to look and saw you were browsing. What are you looking to get done?",
    autoOpenDelay: 14,
    personality: 'friendly',
    responseLength: 'concise',
    captureStrategy: 'natural',
    customInstructions: '',
    enableBooking: true,
    enableLeadCapture: true
  });

  // Lead Form Agent config
  const [leadConfig, setLeadConfig] = useState({
    agentName: 'Kurt',
    smsTemplate: "Hey {{name}}, it's Kurt! Just got your request for {{service}}. When's a good time to chat?",
    responseTone: 'friendly',
    followUpEnabled: true,
    autoBookingEnabled: true,
    businessContext: '',
    servicesInfo: '',
    faqs: []
  });

  useEffect(() => {
    loadDeploymentStatus();
    loadConfigs();
  }, []);

  useEffect(() => {
    // Reset preview and AI messages when switching agents
    setPreviewMessages([]);
    setPreviewInput('');
    setAiMessages([getInitialAiMessage(activeAgent)]);
    setAiInput('');
  }, [activeAgent]);

  useEffect(() => {
    // Auto-scroll AI chat
    if (aiChatRef.current) {
      aiChatRef.current.scrollTop = aiChatRef.current.scrollHeight;
    }
  }, [aiMessages]);

  const loadDeploymentStatus = async () => {
    try {
      const [chatRes, leadRes] = await Promise.all([
        authFetch(`${apiUrl}/api/agents/website/status`),
        authFetch(`${apiUrl}/api/agents/leadform/status`)
      ]);

      if (chatRes.ok) {
        const data = await chatRes.json();
        setChatAgentDeployed(data.isDeployed || false);
      }
      if (leadRes.ok) {
        const data = await leadRes.json();
        setLeadAgentDeployed(data.isDeployed || false);
      }
    } catch (error) {
      console.error('Error loading deployment status:', error);
    }
  };

  const loadConfigs = async () => {
    try {
      const [chatRes, leadRes] = await Promise.all([
        authFetch(`${apiUrl}/api/agents/website/config`),
        authFetch(`${apiUrl}/api/agents/leadform/config`)
      ]);

      if (chatRes.ok) {
        const data = await chatRes.json();
        if (data.config) {
          setChatConfig(prev => ({ ...prev, ...data.config }));
        }
      }
      if (leadRes.ok) {
        const data = await leadRes.json();
        if (data.config) {
          setLeadConfig(prev => ({ ...prev, ...data.config }));
        }
      }
    } catch (error) {
      console.error('Error loading configs:', error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      const endpoint = activeAgent === 'chat'
        ? `${apiUrl}/api/agents/website/config`
        : `${apiUrl}/api/agents/leadform/config`;
      const config = activeAgent === 'chat' ? chatConfig : leadConfig;

      const response = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        alert('Configuration saved successfully!');
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const deployAgent = async () => {
    setIsDeploying(true);
    try {
      const endpoint = activeAgent === 'chat'
        ? `${apiUrl}/api/agents/website/deploy`
        : `${apiUrl}/api/agents/leadform/deploy`;

      const response = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        alert('Agent deployed successfully!');
        loadDeploymentStatus();
      } else {
        alert('Failed to deploy agent');
      }
    } catch (error) {
      console.error('Error deploying:', error);
      alert('Failed to deploy agent');
    } finally {
      setIsDeploying(false);
    }
  };

  // Preview chat functionality
  const sendPreviewMessage = async () => {
    if (!previewInput.trim()) return;

    const userMessage = previewInput.trim();
    setPreviewMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setPreviewInput('');
    setIsPreviewLoading(true);

    try {
      const response = await authFetch(`${apiUrl}/api/agents/preview-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          config: activeAgent === 'chat' ? chatConfig : leadConfig,
          agentType: activeAgent,
          history: previewMessages
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setPreviewMessages(prev => [...prev, {
          role: 'assistant',
          content: "I'm having trouble responding right now. This is just a preview - the live agent will work properly!"
        }]);
      }
    } catch (error) {
      setPreviewMessages(prev => [...prev, {
        role: 'assistant',
        content: `Hi! I'm ${activeAgent === 'chat' ? chatConfig.agentName : leadConfig.agentName}. How can I help you today?`
      }]);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const resetPreview = () => {
    const config = activeAgent === 'chat' ? chatConfig : leadConfig;
    setPreviewMessages([{ role: 'assistant', content: config.greetingMessage || config.smsTemplate?.replace(/\{\{.*?\}\}/g, '[Customer]') || "Hi! How can I help?" }]);
  };

  // AI Assistant functionality - passes conversation history for context
  const sendAiMessage = async () => {
    if (!aiInput.trim()) return;

    const userMessage = aiInput.trim();
    const updatedMessages = [...aiMessages, { role: 'user', content: userMessage }];
    setAiMessages(updatedMessages);
    setAiInput('');
    setAiLoading(true);

    try {
      // Filter out the initial assistant message for cleaner history
      const conversationHistory = updatedMessages.slice(1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await authFetch(`${apiUrl}/api/agents/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          currentConfig: activeAgent === 'chat' ? chatConfig : leadConfig,
          agentType: activeAgent,
          conversationHistory: conversationHistory.slice(-10) // Keep last 10 messages for context
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Apply suggested config if provided + auto-save
        if (data.suggestedConfig) {
          const currentConfig = activeAgent === 'chat' ? chatConfig : leadConfig;
          const mergedConfig = { ...currentConfig, ...data.suggestedConfig };
          if (activeAgent === 'chat') {
            setChatConfig(mergedConfig);
          } else {
            setLeadConfig(mergedConfig);
          }
          // Auto-save immediately so user doesn't have to hit Save
          try {
            const saveEndpoint = activeAgent === 'chat'
              ? `${apiUrl}/api/agents/website/config`
              : `${apiUrl}/api/agents/leadform/config`;
            await authFetch(saveEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mergedConfig)
            });
          } catch (e) { console.error('Auto-save failed:', e); }
          setAiMessages(prev => [...prev, {
            role: 'assistant',
            content: data.message + "\n\n✅ Configuration updated & saved!"
          }]);
        } else {
          setAiMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        }
      } else {
        setAiMessages(prev => [...prev, {
          role: 'assistant',
          content: "I'm having trouble processing that request. Try rephrasing or check your connection."
        }]);
      }
    } catch (error) {
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: "I couldn't process your request. Please try again."
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const currentConfig = activeAgent === 'chat' ? chatConfig : leadConfig;
  const isDeployed = activeAgent === 'chat' ? chatAgentDeployed : leadAgentDeployed;
  const canDeploy = user?.plan?.toLowerCase() === 'pro' || user?.plan?.toLowerCase() === 'expert';

  // Configuration sections for Manual Mode
  const configSections = activeAgent === 'chat' ? [
    {
      id: 'personality',
      title: 'Personality & Tone',
      icon: User,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
            <input
              type="text"
              value={chatConfig.agentName}
              onChange={(e) => setChatConfig({ ...chatConfig, agentName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g., Kurt, Alex, Sarah"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Personality Style</label>
            <div className="grid grid-cols-3 gap-2">
              {['professional', 'friendly', 'casual'].map(style => (
                <button
                  key={style}
                  onClick={() => setChatConfig({ ...chatConfig, personality: style })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    chatConfig.personality === style
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Response Length</label>
            <div className="grid grid-cols-3 gap-2">
              {['concise', 'balanced', 'detailed'].map(length => (
                <button
                  key={length}
                  onClick={() => setChatConfig({ ...chatConfig, responseLength: length })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    chatConfig.responseLength === length
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {length}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'greeting',
      title: 'Welcome Message',
      icon: MessageSquare,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Initial Greeting</label>
            <textarea
              value={chatConfig.greetingMessage}
              onChange={(e) => setChatConfig({ ...chatConfig, greetingMessage: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Hey! How can I help you today?"
            />
            <p className="text-xs text-gray-500 mt-1">{chatConfig.greetingMessage.length}/200 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Auto-open After (seconds)</label>
            <input
              type="number"
              value={chatConfig.autoOpenDelay}
              onChange={(e) => setChatConfig({ ...chatConfig, autoOpenDelay: Number(e.target.value) })}
              min="0"
              max="60"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Set to 0 to disable auto-open</p>
          </div>
        </div>
      )
    },
    {
      id: 'leadcapture',
      title: 'Lead Capture',
      icon: Target,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">When to Ask for Contact Info</label>
            <div className="space-y-2">
              {[
                { value: 'natural', label: 'Natural Flow', desc: 'Ask when relevant in conversation' },
                { value: 'early', label: 'Early', desc: 'Ask within first 2-3 messages' },
                { value: 'booking', label: 'At Booking', desc: 'Only ask when booking a service' }
              ].map(option => (
                <label key={option.value} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="captureStrategy"
                    value={option.value}
                    checked={chatConfig.captureStrategy === option.value}
                    onChange={(e) => setChatConfig({ ...chatConfig, captureStrategy: e.target.value })}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Enable Lead Capture</p>
              <p className="text-sm text-gray-500">Collect name, email, phone</p>
            </div>
            <button
              onClick={() => setChatConfig({ ...chatConfig, enableLeadCapture: !chatConfig.enableLeadCapture })}
              className={`w-12 h-6 rounded-full transition-colors ${chatConfig.enableLeadCapture ? 'bg-amber-600' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${chatConfig.enableLeadCapture ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'booking',
      title: 'Booking Integration',
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Enable Direct Booking</p>
              <p className="text-sm text-gray-500">Let agent book appointments automatically</p>
            </div>
            <button
              onClick={() => setChatConfig({ ...chatConfig, enableBooking: !chatConfig.enableBooking })}
              className={`w-12 h-6 rounded-full transition-colors ${chatConfig.enableBooking ? 'bg-amber-600' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${chatConfig.enableBooking ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              The agent uses your services and employee availability from Business Information to book appointments.
            </p>
            <button
              onClick={() => setCurrentView('business-settings')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2"
            >
              Manage Services & Availability →
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'advanced',
      title: 'Custom Instructions',
      icon: Brain,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Instructions</label>
            <textarea
              value={chatConfig.customInstructions}
              onChange={(e) => setChatConfig({ ...chatConfig, customInstructions: e.target.value })}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm"
              placeholder="Add specific instructions for your agent...&#10;&#10;Example:&#10;- Always mention our weekend discount&#10;- Don't discuss competitor pricing&#10;- Redirect billing questions to email"
            />
            <p className="text-xs text-gray-500 mt-1">These instructions guide how the agent responds</p>
          </div>
        </div>
      )
    }
  ] : [
    // Lead Form Agent sections
    {
      id: 'personality',
      title: 'Agent Identity',
      icon: User,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
            <input
              type="text"
              value={leadConfig.agentName}
              onChange={(e) => setLeadConfig({ ...leadConfig, agentName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g., Kurt, Alex, Sarah"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Response Tone</label>
            <div className="grid grid-cols-3 gap-2">
              {['professional', 'friendly', 'casual'].map(tone => (
                <button
                  key={tone}
                  onClick={() => setLeadConfig({ ...leadConfig, responseTone: tone })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    leadConfig.responseTone === tone
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'sms',
      title: 'SMS Template',
      icon: MessageSquare,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Initial SMS Message</label>
            <textarea
              value={leadConfig.smsTemplate}
              onChange={(e) => setLeadConfig({ ...leadConfig, smsTemplate: e.target.value })}
              rows="3"
              maxLength="320"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">Variables: {'{{name}}, {{phone}}, {{service}}, {{message}}'}</p>
              <span className={`text-xs ${leadConfig.smsTemplate.length > 160 ? 'text-orange-600' : 'text-gray-500'}`}>
                {leadConfig.smsTemplate.length}/160 {leadConfig.smsTemplate.length > 160 && '(2 SMS)'}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'behavior',
      title: 'Agent Behavior',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Follow-up Messages</p>
              <p className="text-sm text-gray-500">Send reminders if no response</p>
            </div>
            <button
              onClick={() => setLeadConfig({ ...leadConfig, followUpEnabled: !leadConfig.followUpEnabled })}
              className={`w-12 h-6 rounded-full transition-colors ${leadConfig.followUpEnabled ? 'bg-amber-600' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${leadConfig.followUpEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Auto-Create Bookings</p>
              <p className="text-sm text-gray-500">Book when date/time mentioned</p>
            </div>
            <button
              onClick={() => setLeadConfig({ ...leadConfig, autoBookingEnabled: !leadConfig.autoBookingEnabled })}
              className={`w-12 h-6 rounded-full transition-colors ${leadConfig.autoBookingEnabled ? 'bg-amber-600' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${leadConfig.autoBookingEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'knowledge',
      title: 'Business Knowledge',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Context</label>
            <textarea
              value={leadConfig.businessContext}
              onChange={(e) => setLeadConfig({ ...leadConfig, businessContext: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Describe your business, what makes you unique, your service area, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Services & Pricing Info</label>
            <textarea
              value={leadConfig.servicesInfo}
              onChange={(e) => setLeadConfig({ ...leadConfig, servicesInfo: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="List your services and typical pricing ranges..."
            />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Agent Builder</h1>
              <p className="text-sm text-gray-600">Customize and deploy your AI agents</p>
            </div>
          </div>

          {/* Agent Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveAgent('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeAgent === 'chat'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Website Chat
              {chatAgentDeployed && <span className="w-2 h-2 bg-green-500 rounded-full" />}
            </button>
            <button
              onClick={() => setActiveAgent('leadform')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeAgent === 'leadform'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Phone className="w-4 h-4" />
              SMS Lead Agent
              {leadAgentDeployed && <span className="w-2 h-2 bg-green-500 rounded-full" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Split Panel */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Side - Configuration (2/3 width) */}
        <div className="w-2/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-0">
          {/* Setup Mode Toggle + Actions */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            {/* Setup Mode Dropdown */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSetupMode('ai')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  setupMode === 'ai'
                    ? 'bg-gradient-to-r from-amber-600 to-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                SORCE AI Setup
              </button>
              <button
                onClick={() => setSetupMode('manual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  setupMode === 'manual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Wrench className="w-4 h-4" />
                Manual Setup
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={saveConfiguration}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              {canDeploy ? (
                <button
                  onClick={deployAgent}
                  disabled={isDeploying || isDeployed}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isDeployed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gradient-to-r from-amber-600 to-blue-600 text-white hover:shadow-lg'
                  }`}
                >
                  <Rocket className="w-4 h-4" />
                  {isDeployed ? 'Deployed' : isDeploying ? 'Deploying...' : 'Deploy'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentView('billing')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Deploy
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {setupMode === 'manual' ? (
              /* Manual Setup - Accordion Sections */
              <div className="p-4 space-y-2">
                {configSections.map(section => {
                  const Icon = section.icon;
                  const isExpanded = expandedSections.includes(section.id);

                  return (
                    <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-amber-600" />
                          <span className="font-medium text-gray-900">{section.title}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-4 border-t border-gray-200 bg-white">
                          {section.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* AI Setup - Chat Interface */
              <div className="flex flex-col h-full">
                {/* AI Chat Header */}
                <div className="p-4 bg-gradient-to-r from-amber-50 to-blue-50 border-b border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-blue-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">SORCE AI Assistant</h3>
                      <p className="text-sm text-gray-600">Describe what you want and I'll configure your agent</p>
                    </div>
                  </div>
                </div>

                {/* AI Chat Messages */}
                <div ref={aiChatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {aiMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                        <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Chat Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendAiMessage()}
                      placeholder="Tell the AI what you want your agent to do..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <button
                      onClick={sendAiMessage}
                      disabled={!aiInput.trim() || aiLoading}
                      className="px-4 py-3 bg-gradient-to-r from-amber-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Preview (1/3 width) */}
        <div className="w-1/3 flex flex-col gap-4 min-h-0 self-start sticky top-4">
          {/* Chat Preview */}
          <div className="h-[450px] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-0">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Live Preview</p>
                  <p className="text-xs text-gray-500">{currentConfig.agentName || 'Agent'}</p>
                </div>
              </div>
              <button
                onClick={resetPreview}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Reset conversation"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div ref={previewRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {previewMessages.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Test your agent here</p>
                  <button
                    onClick={resetPreview}
                    className="mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Start Preview
                  </button>
                </div>
              ) : (
                previewMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {isPreviewLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-3 py-2 rounded-lg">
                    <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={previewInput}
                  onChange={(e) => setPreviewInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendPreviewMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  onClick={sendPreviewMessage}
                  disabled={!previewInput.trim() || isPreviewLoading}
                  className="p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-amber-50 to-blue-50 rounded-xl border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-gray-900">Quick Tips</span>
            </div>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• Test with common customer questions</li>
              <li>• Try booking a service in the preview</li>
              <li>• Use SORCE AI Setup to quickly configure</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
