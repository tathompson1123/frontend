import { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle, TrendingUp, Calendar, Save, Rocket, Crown, Sparkles, MessageCircle, AlertCircle, Settings, Phone, ChevronDown, ChevronUp, Plus, Trash2, Brain } from 'lucide-react';
import FeatureGate from './FeatureGate';

export default function LeadFormAgent({ user, apiUrl, authFetch, setCurrentView, isDeployed, onDeploymentChange }) {
  const [agentConfig, setAgentConfig] = useState({
    emailEnabled: true,
    smsEnabled: true,
    followUpEnabled: true,
    autoBookingEnabled: true,
    smsTemplate: getDefaultSmsTemplate()
  });
  const [formNeedsFix, setFormNeedsFix] = useState(null);
  const [isFixingForm, setIsFixingForm] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    emailsSent: 0,
    smsSent: 0,
    responseRate: 0,
    bookingsCreated: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [areaCode, setAreaCode] = useState('');
  const [showTraining, setShowTraining] = useState(false);
  const [isSavingTraining, setIsSavingTraining] = useState(false);
  const [trainingData, setTrainingData] = useState({
    responseTone: 'friendly',
    agentName: '',
    businessContext: '',
    servicesInfo: '',
    faqs: [],
    commonObjections: []
  });

  useEffect(() => {
    if (!apiUrl) return;

    console.log('🔍 API URL:', apiUrl);
    loadAgentConfig();
    loadStats();
    checkContactForm();
    loadPhoneNumber();
    loadTrainingData();
  }, [apiUrl]);

  const loadTrainingData = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/agents/lead-form/training`);
      if (response.ok) {
        const data = await response.json();
        setTrainingData({
          responseTone: data.responseTone || 'friendly',
          agentName: data.agentName || '',
          businessContext: data.businessContext || '',
          servicesInfo: data.servicesInfo || '',
          faqs: data.faqs || [],
          commonObjections: data.commonObjections || []
        });
      }
    } catch (error) {
      console.error('Error loading training data:', error);
    }
  };

  const saveTrainingData = async () => {
    setIsSavingTraining(true);
    try {
      const response = await authFetch(`${apiUrl}/api/agents/lead-form/training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainingData)
      });

      if (response.ok) {
        alert('✅ AI training data saved successfully!');
      } else {
        alert('Failed to save training data');
      }
    } catch (error) {
      console.error('Error saving training data:', error);
      alert('Failed to save training data');
    } finally {
      setIsSavingTraining(false);
    }
  };

  const addFaq = () => {
    setTrainingData({
      ...trainingData,
      faqs: [...trainingData.faqs, { question: '', answer: '' }]
    });
  };

  const removeFaq = (index) => {
    setTrainingData({
      ...trainingData,
      faqs: trainingData.faqs.filter((_, i) => i !== index)
    });
  };

  const updateFaq = (index, field, value) => {
    const updated = [...trainingData.faqs];
    updated[index][field] = value;
    setTrainingData({ ...trainingData, faqs: updated });
  };

  const addObjection = () => {
    setTrainingData({
      ...trainingData,
      commonObjections: [...trainingData.commonObjections, { objection: '', response: '' }]
    });
  };

  const removeObjection = (index) => {
    setTrainingData({
      ...trainingData,
      commonObjections: trainingData.commonObjections.filter((_, i) => i !== index)
    });
  };

  const updateObjection = (index, field, value) => {
    const updated = [...trainingData.commonObjections];
    updated[index][field] = value;
    setTrainingData({ ...trainingData, commonObjections: updated });
  };

  const loadPhoneNumber = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/auth/user`);
      if (response.ok) {
        const userData = await response.json();
        // Prefer Telnyx number, fall back to Twilio
        setPhoneNumber(userData.user?.telnyx_phone_number || userData.user?.twilio_phone_number || null);
      }
    } catch (error) {
      console.error('Error loading phone number:', error);
    }
  };

  const checkContactForm = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/website/check-contact-form`);
      if (response.ok) {
        const data = await response.json();
        setFormNeedsFix(!data.isValid);
        
        if (!data.isValid && data.issues) {
          console.log('Form issues:', data.issues);
        }
      }
    } catch (error) {
      console.error('Error checking contact form:', error);
      setFormNeedsFix(true);
    }
  };

  const fixContactForm = async () => {
    if (!confirm('Update your website contact form to work with the Lead Form Agent? This will replace your existing form.')) {
      return;
    }
    
    setIsFixingForm(true);
    try {
      const response = await authFetch(`${apiUrl}/api/website/fix-contact-form`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.redeployed) {
          alert(`✅ Contact form updated and deployed!\n\nChanges will be live at ${data.deployUrl || 'your website'} in 1-2 minutes.`);
          setFormNeedsFix(false);
        } else {
          alert('✅ Contact form updated in database!\n\n⚠️ Auto-deploy failed. Please manually redeploy from My Website to see changes.');
          setFormNeedsFix(true);
        }
        
        window.dispatchEvent(new CustomEvent('onboarding-step-complete', { 
          detail: { step: 4 } 
        }));
      } else {
        const error = await response.json();
        alert('Failed: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update contact form');
    } finally {
      setIsFixingForm(false);
    }
  };

  function getDefaultSmsTemplate() {
    return `Hey {{name}}, it's Kurt! Just got your request for {{service}}. When's a good time to chat? - Kurt`;
  }

  const loadAgentConfig = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/agents/lead-form/config`);
      if (response.ok) {
        const data = await response.json();
        
        setAgentConfig({
          smsEnabled: data.config?.smsEnabled ?? true,
          followUpEnabled: data.config?.followUpEnabled ?? true,
          autoBookingEnabled: data.config?.autoBookingEnabled ?? true,
          smsTemplate: data.smsTemplate || getDefaultSmsTemplate()
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/agents/lead-form/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      const response = await authFetch(`${apiUrl}/api/agents/lead-form/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailEnabled: agentConfig.emailEnabled,
          smsEnabled: agentConfig.smsEnabled,
          followUpEnabled: agentConfig.followUpEnabled,
          autoBookingEnabled: agentConfig.autoBookingEnabled,
          emailTemplate: agentConfig.emailTemplate,
          smsTemplate: agentConfig.smsTemplate
        })
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
    // Validate area code if SMS is enabled and no phone number exists
    if (agentConfig.smsEnabled && !phoneNumber) {
      if (!areaCode) {
        alert('Please enter your area code to provision a phone number for SMS messaging.');
        return;
      }
      if (!/^\d{3}$/.test(areaCode)) {
        alert('Area code must be exactly 3 digits (e.g., 206, 425, 360)');
        return;
      }
    }

    setIsDeploying(true);
    try {
      const response = await authFetch(`${apiUrl}/api/agents/lead-form/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areaCode })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.phoneNumber) {
          setPhoneNumber(data.phoneNumber);
          alert(`✅ Lead Form Agent deployed!\n\n📱 Your business phone number: ${data.phoneNumber}\n\nThe agent will now respond to form submissions automatically.`);
        } else {
          alert('✅ Lead Form Agent deployed! It will respond to form submissions automatically.');
        }
        
        onDeploymentChange();
        window.dispatchEvent(new CustomEvent('onboarding-step-complete', { 
          detail: { step: 4 } 
        }));
      } else {
        const error = await response.json();
        alert('Failed to deploy: ' + (error.error || error.details || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deploying agent:', error);
      alert('Failed to deploy agent: ' + error.message);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header with Status Badge */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900">Lead Form Agent</h2>
            <div className={`px-3 py-1 rounded-lg font-medium text-sm ${
              isDeployed
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {isDeployed ? '● Deployed' : '○ Not Deployed'}
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
              ? 'Automatically responding to lead form submissions' 
              : 'Configure settings and deploy to activate'}
          </p>
        </div>

       {isDeployed && (
  <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
    <div className="bg-blue-50 rounded-lg p-4">
      <div className="flex items-center gap-2 text-blue-600 mb-2">
        <Phone className="w-5 h-5" />
        <span className="text-sm font-medium">Total Leads</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
      <p className="text-xs text-gray-600 mt-1">This month</p>
    </div>
    <div className="bg-amber-50 rounded-lg p-4">
      <div className="flex items-center gap-2 text-amber-600 mb-2">
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-medium">SMS Sent</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{stats.smsSent}</p>
      <p className="text-xs text-gray-600 mt-1">Automated</p>
    </div>
    <div className="bg-orange-50 rounded-lg p-4">
      <div className="flex items-center gap-2 text-orange-600 mb-2">
        <TrendingUp className="w-5 h-5" />
        <span className="text-sm font-medium">Response Rate</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{stats.responseRate}%</p>
      <button
        onClick={() => setCurrentView('customers-leads')}
        className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-1"
      >
        View Leads →
      </button>
    </div>
    <div className="bg-indigo-50 rounded-lg p-4">
      <div className="flex items-center gap-2 text-indigo-600 mb-2">
        <Calendar className="w-5 h-5" />
        <span className="text-sm font-medium">Bookings</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{stats.bookingsCreated}</p>
      <button
        onClick={() => setCurrentView('booking-calendar')}
        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-1"
      >
        View Calendar →
      </button>
    </div>
  </div>
)}

        {/* Assigned Business Phone Number */}
        <div className={`rounded-xl border-2 p-5 flex items-start gap-4 ${phoneNumber ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${phoneNumber ? 'bg-green-600' : 'bg-gray-300'}`}>
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Assigned Business Phone Number</p>
            {phoneNumber ? (
              <>
                <p className="text-lg font-bold text-green-700 tracking-wide mt-0.5">{phoneNumber}</p>
                <p className="text-xs text-gray-500 mt-1">This is the number your leads will receive SMS messages from. When a customer replies, your AI agent responds automatically.</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mt-0.5">No number assigned yet.</p>
                <p className="text-xs text-gray-400 mt-1">A local phone number matching your area code is automatically provisioned when you deploy the agent with SMS enabled.</p>
              </>
            )}
          </div>
        </div>

        {/* Configuration and Deploy Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration - Takes 2/3 width */}
<div className="lg:col-span-2 space-y-4">
  <h3 className="text-lg font-semibold text-gray-900">Trigger Settings</h3>
  
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
        <Phone className="w-5 h-5 text-green-600" />
      </div>
      <div>
        <p className="font-medium text-gray-900">Send SMS Response</p>
        <p className="text-sm text-gray-600">Delayed 45-75 seconds to mimic human response time</p>
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        checked={agentConfig.smsEnabled}
        onChange={(e) => setAgentConfig({ ...agentConfig, smsEnabled: e.target.checked })}
        className="sr-only peer" 
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  </div>

  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
        <Clock className="w-5 h-5 text-amber-600" />
      </div>
      <div>
        <p className="font-medium text-gray-900">AI Conversation Follow-up</p>
        <p className="text-sm text-gray-600">Continue SMS conversation with human-like delays</p>
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        checked={agentConfig.followUpEnabled}
        onChange={(e) => setAgentConfig({ ...agentConfig, followUpEnabled: e.target.checked })}
        className="sr-only peer" 
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  </div>

  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
        <Calendar className="w-5 h-5 text-indigo-600" />
      </div>
      <div>
        <p className="font-medium text-gray-900">Auto-Create Booking</p>
        <p className="text-sm text-gray-600">Add lead to calendar if service & date mentioned</p>
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        checked={agentConfig.autoBookingEnabled}
        onChange={(e) => setAgentConfig({ ...agentConfig, autoBookingEnabled: e.target.checked })}
        className="sr-only peer" 
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  </div>

  {/* Remove Email Template section entirely */}

  {/* SMS Template */}
  <div>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Initial SMS Template</h3>
      <span className="text-xs text-gray-500">160 chars = 1 SMS, 320 max = 2 SMS</span>
    </div>
    <textarea
      value={agentConfig.smsTemplate}
      onChange={(e) => setAgentConfig({ ...agentConfig, smsTemplate: e.target.value })}
      rows="3"
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
      maxLength="320"
    />
    <div className="mt-2">
      <span className={`text-xs ${agentConfig.smsTemplate.length > 160 ? 'text-orange-600' : 'text-gray-500'}`}>
        {agentConfig.smsTemplate.length} / 160 characters {agentConfig.smsTemplate.length > 160 && '(will send as 2 SMS)'}
      </span>
    </div>
    <p className="text-xs text-gray-500 mt-2">
      {`Available variables: {{name}}, {{phone}}, {{service}}, {{message}}`}
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

          {/* Deploy Section - Takes 1/3 width */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200 p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Deploy Agent</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {isDeployed 
                  ? 'Your lead form agent is active and will respond to all form submissions automatically.'
                  : 'Deploy this agent to automatically respond to lead form submissions.'}
              </p>

              {/* Area Code Input - Only show if SMS enabled and no phone number */}
              {agentConfig.smsEnabled && !phoneNumber && !isDeployed && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area Code for SMS Number
                  </label>
                  <input
                    type="text"
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="206"
                    maxLength="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    A local phone number will be purchased for SMS messaging
                  </p>
                </div>
              )}
              
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
                  disabled={isDeployed || isDeploying}
                  className={`w-full px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    isDeployed
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-600 to-blue-600 text-white hover:shadow-lg'
                  }`}
                >
                  <Rocket className="w-5 h-5" />
                  {isDeploying ? 'Deploying...' : isDeployed ? 'Agent Deployed' : 'Deploy Agent'}
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

            {/* Fix Contact Form Section */}
            <div className={`rounded-xl border-2 p-6 mt-4 ${
              formNeedsFix === false 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                {formNeedsFix === false ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Contact Form Ready</h3>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Contact Form Setup</h3>
                  </>
                )}
              </div>
              
              {formNeedsFix === false ? (
                <p className="text-xs text-green-700 font-medium">
                  ✅ Your website form is properly configured and ready to capture leads!
                </p>
              ) : (
                <>
                  <p className="text-xs text-gray-600 mb-3">
                    Ensure your website form captures leads with SMS consent
                  </p>

                  <div className="bg-white rounded-lg p-3 border border-amber-200 mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">✅ Required:</p>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-amber-600 rounded-full"></div>
                        SMS consent checkbox
                      </li>
                      <li className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-amber-600 rounded-full"></div>
                        Leads auto-submit
                      </li>
                      <li className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-amber-600 rounded-full"></div>
                        Proper form tagging
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={fixContactForm}
                    disabled={isFixingForm}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Settings className="w-4 h-4" />
                    {isFixingForm ? 'Updating...' : 'Fix Contact Form'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Training Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowTraining(!showTraining)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">AI Training & Customization</h3>
              <p className="text-sm text-gray-600">Teach your AI how to respond to leads</p>
            </div>
          </div>
          {showTraining ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {showTraining && (
          <div className="p-6 pt-0 space-y-6 border-t border-gray-200">
            {/* Response Tone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Response Tone</label>
              <div className="grid grid-cols-3 gap-3">
                {['formal', 'friendly', 'casual'].map(tone => (
                  <button
                    key={tone}
                    onClick={() => setTrainingData({ ...trainingData, responseTone: tone })}
                    className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium capitalize ${
                      trainingData.responseTone === tone
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {trainingData.responseTone === 'formal' && 'Professional, polished responses suitable for corporate clients'}
                {trainingData.responseTone === 'friendly' && 'Warm and approachable while maintaining professionalism'}
                {trainingData.responseTone === 'casual' && 'Relaxed, conversational tone like texting a friend'}
              </p>
            </div>

            {/* Agent Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name (for SMS)</label>
              <input
                type="text"
                value={trainingData.agentName}
                onChange={(e) => setTrainingData({ ...trainingData, agentName: e.target.value })}
                placeholder="e.g., Kurt, Sarah, Alex"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">The name the AI will use when introducing itself</p>
            </div>

            {/* Business Context */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Context</label>
              <textarea
                value={trainingData.businessContext}
                onChange={(e) => setTrainingData({ ...trainingData, businessContext: e.target.value })}
                rows="3"
                placeholder="Describe your business, what makes you unique, your target customers, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Help the AI understand your business to give better responses</p>
            </div>

            {/* Services Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Services & Pricing</label>
              <textarea
                value={trainingData.servicesInfo}
                onChange={(e) => setTrainingData({ ...trainingData, servicesInfo: e.target.value })}
                rows="4"
                placeholder="List your services and pricing, e.g.:&#10;- Basic Wash: $50&#10;- Full Detail: $200&#10;- Ceramic Coating: $800+"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">The AI will reference this when asked about services or pricing</p>
            </div>

            {/* FAQs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Frequently Asked Questions</label>
                <button
                  onClick={addFaq}
                  className="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add FAQ
                </button>
              </div>

              {trainingData.faqs.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-4 text-center bg-gray-50 rounded-lg">
                  No FAQs added yet. Add common questions your customers ask.
                </p>
              ) : (
                <div className="space-y-3">
                  {trainingData.faqs.map((faq, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 relative">
                      <button
                        onClick={() => removeFaq(index)}
                        className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="space-y-2 pr-8">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => updateFaq(index, 'question', e.target.value)}
                          placeholder="Question, e.g., How long does a detail take?"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                        <textarea
                          value={faq.answer}
                          onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                          placeholder="Answer the AI should give..."
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Common Objections */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Objection Handling</label>
                <button
                  onClick={addObjection}
                  className="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Objection
                </button>
              </div>

              {trainingData.commonObjections.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-4 text-center bg-gray-50 rounded-lg">
                  No objections added. Add common concerns and how to address them.
                </p>
              ) : (
                <div className="space-y-3">
                  {trainingData.commonObjections.map((obj, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 relative">
                      <button
                        onClick={() => removeObjection(index)}
                        className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="space-y-2 pr-8">
                        <input
                          type="text"
                          value={obj.objection}
                          onChange={(e) => updateObjection(index, 'objection', e.target.value)}
                          placeholder="Objection, e.g., That's too expensive"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                        <textarea
                          value={obj.response}
                          onChange={(e) => updateObjection(index, 'response', e.target.value)}
                          placeholder="How to respond to this objection..."
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={saveTrainingData}
              disabled={isSavingTraining}
              className="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Brain className="w-5 h-5" />
              {isSavingTraining ? 'Saving...' : 'Save AI Training'}
            </button>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
        <p className="text-gray-700 mb-4">
          The Lead Form Agent automatically responds when someone submits a contact form on your website.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
            <div>
              <p className="font-medium text-gray-900">Lead submits form</p>
              <p className="text-sm text-gray-600">Lead appears in your Customers & Leads tab with source "lead_form"</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
            <div>
              <p className="font-medium text-gray-900">Instant automated response</p>
              <p className="text-sm text-gray-600">Email and/or SMS sent within seconds using your templates</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
            <div>
              <p className="font-medium text-gray-900">Two-way SMS conversation</p>
              <p className="text-sm text-gray-600">Leads can text your business number and get AI-powered responses</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
            <div>
              <p className="font-medium text-gray-900">Auto-create booking (if enabled)</p>
              <p className="text-sm text-gray-600">If service and date are mentioned, booking is created in your calendar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
