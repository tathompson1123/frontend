import { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle, TrendingUp, Calendar, Save, Rocket, Crown, Sparkles, AlertCircle, Settings } from 'lucide-react';
import FeatureGate from './FeatureGate';

export default function LeadFormAgent({ user, apiUrl, authFetch, setCurrentView, isDeployed, onDeploymentChange }) {
  const [agentConfig, setAgentConfig] = useState({
    emailEnabled: true,
    smsEnabled: true,
    followUpEnabled: true,
    autoBookingEnabled: true,
    emailTemplate: getDefaultEmailTemplate(),
    smsTemplate: getDefaultSmsTemplate()
  });
  const [formNeedsFix, setFormNeedsFix] = useState(null); // null = not checked, true = needs fix, false = good
  const [isFixingForm, setIsFixingForm] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    emailsSent: 0,
    smsSent: 0,
    responseRate: 0,
    bookingsCreated: 0
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAgentConfig();
    loadStats();
    checkContactForm();
  }, []);

   const checkContactForm = async () => {
  try {
    const response = await authFetch(`${apiUrl}/api/website/check-contact-form`);
    useEffect(() => {
  console.log('🔍 API URL:', apiUrl);
  loadAgentConfig();
  loadStats();
  checkContactForm();
}, []);
    if (response.ok) {
      const data = await response.json();
      setFormNeedsFix(!data.isValid);
      
      // Optional: Log details for debugging
      if (!data.isValid && data.issues) {
        console.log('Form issues:', data.issues);
      }
    }
  } catch (error) {
    console.error('Error checking contact form:', error);
    setFormNeedsFix(true); // Assume needs fix if check fails
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
        // Don't check immediately - mark as fixed
        setFormNeedsFix(false);
      } else {
        alert('✅ Contact form updated in database!\n\n⚠️ Auto-deploy failed. Please manually redeploy from My Website to see changes.');
        // Still needs manual redeploy, so keep showing fix button
        setFormNeedsFix(true);
      }
      
      // Trigger onboarding step
      window.dispatchEvent(new CustomEvent('onboarding-step-complete', { 
        detail: { step: 5 } 
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
  function getDefaultEmailTemplate() {
    return `Hey {{name}},

Thanks for reaching out! I'm Kurt, and I just saw your request come through.

You mentioned you're interested in {{service}}. I'd love to help you out with that!

Here's what I can do:
- Get you scheduled ASAP (we have availability this week)
- Answer any questions about pricing or our process
- Show you some before/after photos of similar work we've done

What day works best for you? Or if you want, just reply with your phone number and I'll give you a call directly.

Looking forward to working with you!

Kurt
(555) 123-4567`;
  }

  function getDefaultSmsTemplate() {
    return `Hey {{name}}, it's Kurt! Just got your request for {{service}}. When's a good time to chat? - Kurt`;
  }

  const loadAgentConfig = async () => {
    try {
     const response = await authFetch(`${apiUrl}/api/agents/lead-form/config`);
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
      const response = await authFetch(`${apiUrl}/api/agents/leadform/stats`);
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
      const response = await authFetch(`${apiUrl}/api/agents/leadform/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentConfig)
      });
      
      if (response.ok) {
        alert('✅ Configuration saved successfully!');
        window.dispatchEvent(new CustomEvent('onboarding-step-complete', { 
          detail: { step: 5 } 
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
      const response = await authFetch(`${apiUrl}/api/agents/leadform/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        alert('✅ Lead Form Agent deployed! It will respond to form submissions automatically.');
        onDeploymentChange();
        
        window.dispatchEvent(new CustomEvent('onboarding-step-complete', { 
          detail: { step: 5 } 
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
            <h2 className="text-xl font-bold text-gray-900">Lead Form Agent</h2>
            <div className={`px-3 py-1 rounded-lg font-medium text-sm ${
              isDeployed
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {isDeployed ? '● Deployed' : '○ Not Deployed'}
            </div>
          </div>
          <p className="text-gray-600">
            {isDeployed 
              ? 'Automatically responding to lead form submissions' 
              : 'Configure settings and deploy to activate'}
          </p>
        </div>

        {/* Stats */}
        {isDeployed && (
          <div className="grid grid-cols-5 gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Mail className="w-5 h-5" />
                <span className="text-sm font-medium">Total Responses</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600 mt-1">This month</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Emails Sent</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.emailsSent}</p>
              <p className="text-xs text-gray-600 mt-1">Automated</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Mail className="w-5 h-5" />
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

        {/* Configuration and Deploy Section - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration - Takes 2/3 width */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Trigger Settings</h3>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Send Email Response</p>
                  <p className="text-sm text-gray-600">Immediately when lead form is submitted</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={agentConfig.emailEnabled}
                  onChange={(e) => setAgentConfig({ ...agentConfig, emailEnabled: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Send SMS Response</p>
                  <p className="text-sm text-gray-600">If phone number is provided</p>
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
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Follow-up Email</p>
                  <p className="text-sm text-gray-600">Send if no response after 24 hours</p>
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

            {/* Email Template */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Email Template</h3>
                <span className="text-xs text-gray-500">
                  {`Available variables: {{name}}, {{email}}, {{phone}}, {{service}}, {{message}}`}
                </span>
              </div>
              <textarea
                value={agentConfig.emailTemplate}
                onChange={(e) => setAgentConfig({ ...agentConfig, emailTemplate: e.target.value })}
                rows="12"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            {/* SMS Template */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">SMS Template</h3>
                <span className="text-xs text-gray-500">Max 160 characters recommended</span>
              </div>
              <textarea
                value={agentConfig.smsTemplate}
                onChange={(e) => setAgentConfig({ ...agentConfig, smsTemplate: e.target.value })}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                maxLength="320"
              />
              <div className="mt-2">
                <span className="text-xs text-gray-500">{agentConfig.smsTemplate.length} / 320 characters</span>
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
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
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

      {/* How It Works */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">✨ How It Works</h3>
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
              <p className="font-medium text-gray-900">Auto-create booking (if enabled)</p>
              <p className="text-sm text-gray-600">If service and date are mentioned, booking is created in your calendar</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
            <div>
              <p className="font-medium text-gray-900">Follow-up if needed</p>
              <p className="text-sm text-gray-600">Automatic follow-up email after 24 hours if no response</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
