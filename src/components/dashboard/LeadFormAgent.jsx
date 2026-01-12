// LeadFormAgent.jsx
import { useState, useEffect } from 'react';
import { Power, Mail, Clock, CheckCircle, TrendingUp, Calendar, Users } from 'lucide-react';

export default function LeadFormAgent({ user, apiUrl, authFetch, setCurrentView }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [smsTemplate, setSmsTemplate] = useState('');
  const [responseStats, setResponseStats] = useState({
    total: 0,
    emailsSent: 0,
    smsSent: 0,
    responseRate: 0,
    bookingsCreated: 0
  });

  useEffect(() => {
    loadTemplates();
    loadStats();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/agents/leadform/templates`);
      if (response.ok) {
        const data = await response.json();
        setEmailTemplate(data.email || getDefaultEmailTemplate());
        setSmsTemplate(data.sms || getDefaultSmsTemplate());
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setEmailTemplate(getDefaultEmailTemplate());
      setSmsTemplate(getDefaultSmsTemplate());
    }
  };

  const loadStats = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/agents/leadform/stats`);
      if (response.ok) {
        const data = await response.json();
        setResponseStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getDefaultEmailTemplate = () => {
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
  };

  const getDefaultSmsTemplate = () => {
    return `Hey {{name}}, it's Kurt! Just got your request for {{service}}. When's a good time to chat? - Kurt`;
  };

  const toggleAgent = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/agents/leadform`, {
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

  const saveTemplates = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/agents/leadform/templates`, {
        method: 'POST',
        body: JSON.stringify({
          email: emailTemplate,
          sms: smsTemplate
        })
      });
      if (response.ok) {
        alert('Templates saved successfully!');
      }
    } catch (error) {
      console.error('Error saving templates:', error);
      alert('Failed to save templates');
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Lead Form Agent</h2>
            <p className="text-gray-600 mt-1">Automatically respond to lead form submissions</p>
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
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Mail className="w-5 h-5" />
              <span className="text-sm font-medium">Total Responses</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{responseStats.total}</p>
            <p className="text-xs text-gray-600 mt-1">This month</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Emails Sent</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{responseStats.emailsSent}</p>
            <p className="text-xs text-gray-600 mt-1">Automated</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Mail className="w-5 h-5" />
              <span className="text-sm font-medium">SMS Sent</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{responseStats.smsSent}</p>
            <p className="text-xs text-gray-600 mt-1">Automated</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Response Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{responseStats.responseRate}%</p>
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
            <p className="text-2xl font-bold text-gray-900">{responseStats.bookingsCreated}</p>
            <button
              onClick={() => setCurrentView('booking-calendar')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-1"
            >
              View Calendar →
            </button>
          </div>
        </div>

        {/* Trigger Settings */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trigger Settings</h3>
          
          <div className="space-y-4">
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
                <input type="checkbox" defaultChecked className="sr-only peer" />
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
                <input type="checkbox" defaultChecked className="sr-only peer" />
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
                <input type="checkbox" defaultChecked className="sr-only peer" />
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
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Email Template */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Email Template</h3>
            <span className="text-xs text-gray-500">Available variables: {{name}}, {{email}}, {{phone}}, {{service}}, {{message}}</span>
          </div>
          <textarea
            value={emailTemplate}
            onChange={(e) => setEmailTemplate(e.target.value)}
            rows="12"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        {/* SMS Template */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">SMS Template</h3>
            <span className="text-xs text-gray-500">Max 160 characters recommended</span>
          </div>
          <textarea
            value={smsTemplate}
            onChange={(e) => setSmsTemplate(e.target.value)}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            maxLength="320"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{smsTemplate.length} / 320 characters</span>
            <button
              onClick={saveTemplates}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Templates
            </button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900">Lead submits form</p>
              <p className="text-sm text-gray-600">Lead appears in your Customers & Leads tab with source "lead_form"</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900">Instant automated response</p>
              <p className="text-sm text-gray-600">Email and/or SMS sent within seconds using your templates</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900">Auto-create booking (if enabled)</p>
              <p className="text-sm text-gray-600">If service and date are mentioned, booking is created in your calendar</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              4
            </div>
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
