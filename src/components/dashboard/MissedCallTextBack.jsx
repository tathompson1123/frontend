import { useState, useEffect } from 'react';
import { Phone, PhoneOff, Clock, MessageCircle, TrendingUp, Save, Rocket, Crown, Settings, ChevronDown, ChevronUp, Brain } from 'lucide-react';

export default function MissedCallTextBack({ user, apiUrl, authFetch, setCurrentView, isDeployed, onDeploymentChange, onDirtyChange }) {
  const [config, setConfig] = useState({
    enabled: false,
    smsEnabled: true,
    forwardingNumber: '',
    ringTimeout: 20,
    delayMin: 30,
    delayMax: 60,
    training: {
      responseTone: 'friendly',
      agentName: '',
      businessContext: '',
      servicesInfo: ''
    }
  });
  const [configSnapshot, setConfigSnapshot] = useState(null);
  const [templateSnapshot, setTemplateSnapshot] = useState(null);
  const [smsTemplate, setSmsTemplate] = useState(getDefaultTemplate());
  const [stats, setStats] = useState({
    totalCalls: 0,
    missedCalls: 0,
    textsSent: 0,
    replies: 0
  });
  const [missedCalls, setMissedCalls] = useState([]);
  const [missedCallsTotal, setMissedCallsTotal] = useState(0);
  const [missedCallsPage, setMissedCallsPage] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [showCallLog, setShowCallLog] = useState(false);

  function getDefaultTemplate() {
    return "Hey {{name}}, sorry we missed your call! How can we help you? Reply here and we'll get right back to you.";
  }

  useEffect(() => {
    if (!apiUrl) return;
    loadConfig();
    loadStats();
    // Phone number comes from user prop (loaded by Dashboard from /api/user/profile)
    setPhoneNumber(user?.twilio_phone_number || null);
  }, [apiUrl, user]);

  useEffect(() => {
    if (configSnapshot && onDirtyChange) {
      const dirty = JSON.stringify(config) !== configSnapshot || smsTemplate !== templateSnapshot;
      onDirtyChange(dirty);
    }
  }, [config, smsTemplate, configSnapshot, templateSnapshot]);

  const loadConfig = async () => {
    try {
      const [voiceRes, bizRes, svcRes] = await Promise.all([
        authFetch(`${apiUrl}/api/voice/config`),
        authFetch(`${apiUrl}/api/business-info`).catch(() => ({ ok: false })),
        authFetch(`${apiUrl}/api/services`).catch(() => ({ ok: false })),
      ]);

      const defaults = {
        enabled: false,
        smsEnabled: true,
        forwardingNumber: '',
        ringTimeout: 20,
        delayMin: 30,
        delayMax: 60,
        training: { responseTone: 'friendly', agentName: '', businessContext: '', servicesInfo: '' }
      };

      let savedConfig = defaults;
      let loadedTemplate = getDefaultTemplate();
      if (voiceRes.ok) {
        const data = await voiceRes.json();
        savedConfig = data.config || defaults;
        loadedTemplate = data.smsTemplate || getDefaultTemplate();
        setSmsTemplate(loadedTemplate);
      }

      // Pre-fill training fields from business settings when empty
      const training = savedConfig.training || defaults.training;
      if (!training.businessContext) {
        const bizData = bizRes.ok ? await bizRes.json() : {};
        const bizInfo = bizData.businessInfo || {};
        const businessName = user?.business_name || user?.businessName || '';
        training.businessContext = [businessName, bizInfo.city, bizInfo.state].filter(Boolean).join(', ');
      }
      if (!training.servicesInfo && svcRes.ok) {
        const svcData = await svcRes.json();
        const services = (svcData.services || []).filter(s => !s.is_addon);
        if (services.length > 0) {
          training.servicesInfo = services.map(s => `${s.name}${s.price ? ` - $${s.price}` : ''}`).join('\n');
        }
      }

      const finalConfig = { ...savedConfig, training };
      setConfig(finalConfig);
      setConfigSnapshot(JSON.stringify(finalConfig));
      setTemplateSnapshot(loadedTemplate);
    } catch (error) {
      console.error('Error loading voice config:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/voice/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading voice stats:', error);
    }
  };

  const loadMissedCalls = async (page = 1) => {
    try {
      const response = await authFetch(`${apiUrl}/api/voice/missed-calls?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setMissedCalls(data.missedCalls);
        setMissedCallsTotal(data.total);
        setMissedCallsPage(page);
      }
    } catch (error) {
      console.error('Error loading missed calls:', error);
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      const response = await authFetch(`${apiUrl}/api/voice/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, smsTemplate })
      });

      if (response.ok) {
        setConfigSnapshot(JSON.stringify(config));
        setTemplateSnapshot(smsTemplate);
        alert('Configuration saved successfully!');
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
    if (!config.forwardingNumber) {
      alert('Please enter your forwarding phone number (the number where calls will ring).');
      return;
    }

    if (!phoneNumber) {
      alert('You need a provisioned business phone number first. Deploy the Lead Form Agent to get one.');
      return;
    }

    setIsDeploying(true);
    try {
      const response = await authFetch(`${apiUrl}/api/voice/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forwardingNumber: config.forwardingNumber,
          ringTimeout: config.ringTimeout,
          delayMin: config.delayMin,
          delayMax: config.delayMax,
          smsTemplate,
          training: config.training
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.callForwarding) {
          alert(`Missed Call Text-Back is now active!\n\nCalls to ${data.phoneNumber} will forward to ${config.forwardingNumber}.\nIf you don't answer, the caller gets a text automatically.`);
        } else {
          alert(`Missed Call Text-Back deployed (SMS text-back mode)!\n\nYour number: ${data.phoneNumber}\nAuto text-back is enabled for missed calls.\n\nNote: Call forwarding requires a Twilio number. Your Telnyx number supports SMS text-back.`);
        }
        setConfig({ ...config, enabled: true, callForwardingActive: data.callForwarding });
        onDeploymentChange();
      } else {
        const error = await response.json();
        alert('Failed to deploy: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deploying:', error);
      alert('Failed to deploy: ' + error.message);
    } finally {
      setIsDeploying(false);
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return 'Unknown';
    if (phone.length === 12 && phone.startsWith('+1')) {
      return `(${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
    }
    return phone;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
           d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header with Status Badge */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">Missed Call Text-Back</h2>
            <div className={`px-3 py-1 rounded-lg font-medium text-sm ${
              isDeployed
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {isDeployed ? '● Active' : '○ Not Active'}
            </div>
            {phoneNumber && (
              <div className="px-3 py-1 rounded-lg font-medium text-sm bg-blue-100 text-blue-700 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {phoneNumber}
              </div>
            )}
          </div>
          <p className="text-gray-600">
            {isDeployed
              ? 'Forwarding calls and auto-texting missed callers'
              : 'Set up call forwarding and automatic text-back for missed calls'}
          </p>
        </div>

        {/* Stats */}
        {isDeployed && (
          <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Phone className="w-5 h-5" />
                <span className="text-sm font-medium">Total Calls</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
              <p className="text-xs text-gray-600 mt-1">This month</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <PhoneOff className="w-5 h-5" />
                <span className="text-sm font-medium">Missed Calls</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.missedCalls}</p>
              <p className="text-xs text-gray-600 mt-1">Auto-detected</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Texts Sent</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.textsSent}</p>
              <p className="text-xs text-gray-600 mt-1">Auto text-backs</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Replies</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.replies}</p>
              <button
                onClick={() => setCurrentView('customers-leads')}
                className="text-xs text-green-600 hover:text-green-700 font-medium mt-1"
              >
                View Leads →
              </button>
            </div>
          </div>
        )}

        {/* Business Phone Number */}
        <div className={`rounded-xl border-2 p-5 flex items-start gap-4 mb-6 ${phoneNumber ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${phoneNumber ? 'bg-green-600' : 'bg-gray-300'}`}>
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Business Phone Number</p>
            {phoneNumber ? (
              <>
                <p className="text-lg font-bold text-green-700 tracking-wide mt-0.5">{phoneNumber}</p>
                <p className="text-xs text-gray-500 mt-1">Incoming calls to this number will be forwarded to your personal phone. If you don't answer, the caller gets an automatic text.</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mt-0.5">No number assigned yet.</p>
                <p className="text-xs text-gray-400 mt-1">Deploy the Lead Form Agent first to provision a business phone number.</p>
              </>
            )}
          </div>
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Call Forwarding Settings</h3>

            {/* Forwarding Number */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Your Personal Phone Number</p>
                  <p className="text-sm text-gray-600">Calls will ring this number first</p>
                </div>
              </div>
              <input
                type="tel"
                value={config.forwardingNumber || ''}
                onChange={(e) => setConfig({ ...config, forwardingNumber: e.target.value })}
                placeholder="+15551234567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">Enter in E.164 format: +1 followed by 10 digits (e.g., +15551234567)</p>
            </div>

            {/* Ring Timeout */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Ring Timeout: {config.ringTimeout || 20} seconds</p>
                  <p className="text-sm text-gray-600">How long to ring before considering the call missed</p>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="30"
                value={config.ringTimeout || 20}
                onChange={(e) => setConfig({ ...config, ringTimeout: parseInt(e.target.value) })}
                className="w-full accent-amber-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10s</span>
                <span>20s</span>
                <span>30s</span>
              </div>
            </div>

            {/* SMS Enabled Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Auto Text-Back</p>
                  <p className="text-sm text-gray-600">Send SMS when a call is missed</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.smsEnabled !== false}
                  onChange={(e) => setConfig({ ...config, smsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* SMS Delay */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Text-Back Delay</p>
                  <p className="text-sm text-gray-600">Random delay before sending to feel human ({config.delayMin || 30}-{config.delayMax || 60}s)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Min seconds</label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={config.delayMin || 30}
                    onChange={(e) => setConfig({ ...config, delayMin: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Max seconds</label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    value={config.delayMax || 60}
                    onChange={(e) => setConfig({ ...config, delayMax: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mt-1"
                  />
                </div>
              </div>
            </div>

            {/* SMS Template */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Text-Back Template</h3>
                <span className="text-xs text-gray-500">160 chars = 1 SMS, 320 max = 2 SMS</span>
              </div>
              <textarea
                value={smsTemplate}
                onChange={(e) => setSmsTemplate(e.target.value)}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                maxLength="320"
              />
              <div className="mt-2">
                <span className={`text-xs ${smsTemplate.length > 160 ? 'text-orange-600' : 'text-gray-500'}`}>
                  {smsTemplate.length} / 160 characters {smsTemplate.length > 160 && '(will send as 2 SMS)'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {`Available variables: {{name}}, {{agentName}}, {{businessName}}`}
              </p>
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

          {/* Deploy Panel */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <PhoneOff className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">
                  {isDeployed ? 'Text-Back Active' : 'Deploy Text-Back'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isDeployed
                    ? 'Missed calls trigger automatic texts'
                    : 'Never lose a lead to a missed call again'}
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-purple-600" />
                  <span>Forwards calls to your phone</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <MessageCircle className="w-4 h-4 text-purple-600" />
                  <span>Auto-texts missed callers</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Human-like response delay</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>Creates leads automatically</span>
                </div>
              </div>

              <button
                onClick={deployAgent}
                disabled={isDeploying || !phoneNumber}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
              >
                <Rocket className="w-5 h-5" />
                {isDeploying ? 'Deploying...' : isDeployed ? 'Redeploy' : 'Deploy Now'}
              </button>

              {!phoneNumber && (
                <p className="text-xs text-red-600 mt-2 text-center">
                  Deploy the Lead Form Agent first to get a phone number
                </p>
              )}

              <div className="flex items-center gap-1 justify-center mt-3">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-gray-500">Requires Pro plan or higher</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Training */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <button
          onClick={() => setShowTraining(!showTraining)}
          className="w-full flex items-center justify-between p-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">Agent Training</h3>
              <p className="text-sm text-gray-600">Customize how the agent responds to missed callers</p>
            </div>
          </div>
          {showTraining ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {showTraining && (
          <div className="px-6 pb-6 space-y-4">
            {/* Agent Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
              <input
                type="text"
                value={config.training?.agentName || ''}
                onChange={(e) => setConfig({
                  ...config,
                  training: { ...config.training, agentName: e.target.value }
                })}
                placeholder="e.g., Kurt"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Used in templates as {'{{agentName}}'}</p>
            </div>

            {/* Response Tone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Response Tone</label>
              <select
                value={config.training?.responseTone || 'friendly'}
                onChange={(e) => setConfig({
                  ...config,
                  training: { ...config.training, responseTone: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="friendly">Friendly & Warm</option>
                <option value="formal">Professional & Formal</option>
                <option value="casual">Casual & Relaxed</option>
              </select>
            </div>

            {/* Business Context */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Context</label>
              <textarea
                value={config.training?.businessContext || ''}
                onChange={(e) => setConfig({
                  ...config,
                  training: { ...config.training, businessContext: e.target.value }
                })}
                rows="3"
                placeholder="Brief description of your business, what you do, and your specialties..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Services Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Services Offered</label>
              <textarea
                value={config.training?.servicesInfo || ''}
                onChange={(e) => setConfig({
                  ...config,
                  training: { ...config.training, servicesInfo: e.target.value }
                })}
                rows="3"
                placeholder="List your main services, pricing ranges, service areas..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <button
              onClick={saveConfiguration}
              disabled={isSaving}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Save Training Data'}
            </button>
          </div>
        )}
      </div>

      {/* Missed Calls Log */}
      {isDeployed && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <button
            onClick={() => { setShowCallLog(!showCallLog); if (!showCallLog) loadMissedCalls(); }}
            className="w-full flex items-center justify-between p-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <PhoneOff className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900">Call Log</h3>
                <p className="text-sm text-gray-600">{missedCallsTotal} total calls recorded</p>
              </div>
            </div>
            {showCallLog ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {showCallLog && (
            <div className="px-6 pb-6">
              {missedCalls.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No calls recorded yet.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2 font-medium text-gray-600">Date/Time</th>
                          <th className="text-left py-3 px-2 font-medium text-gray-600">Caller</th>
                          <th className="text-left py-3 px-2 font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-2 font-medium text-gray-600">Text Sent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {missedCalls.map((call) => (
                          <tr key={call.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2 text-gray-900">{formatDate(call.created_at)}</td>
                            <td className="py-3 px-2">
                              <div>
                                <span className="text-gray-900">{formatPhone(call.caller_phone)}</span>
                                {call.lead_name && (
                                  <span className="text-xs text-gray-500 ml-2">{call.lead_name}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                call.call_status === 'answered'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {call.call_status === 'answered' ? 'Answered' : 'Missed'}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              {call.textback_sent ? (
                                <span className="text-green-600 text-xs font-medium">Sent</span>
                              ) : call.call_status === 'answered' ? (
                                <span className="text-gray-400 text-xs">N/A</span>
                              ) : (
                                <span className="text-amber-600 text-xs font-medium">Pending</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {missedCallsTotal > 10 && (
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-gray-500">
                        Page {missedCallsPage} of {Math.ceil(missedCallsTotal / 10)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadMissedCalls(missedCallsPage - 1)}
                          disabled={missedCallsPage <= 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => loadMissedCalls(missedCallsPage + 1)}
                          disabled={missedCallsPage >= Math.ceil(missedCallsTotal / 10)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
