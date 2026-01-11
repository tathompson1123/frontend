import { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  Phone, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  Filter,
  Search,
  UserPlus,
  Send,
  Sparkles,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bot,
  Zap,
  Star,
  Eye,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';

export default function CustomersLeads({ user, setCurrentView }) {
  const [activeTab, setActiveTab] = useState('leads'); // 'leads' or 'customers'
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [aiMessage, setAiMessage] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showConversation, setShowConversation] = useState(false);

  // Fetch leads and customers
  useEffect(() => {
    fetchLeads();
    fetchCustomers();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // AI Conversation Starter
  const generateAIResponse = async (lead) => {
    setGeneratingAI(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leads/generate-response`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadName: lead.name,
          serviceInterest: lead.service_interest,
          leadMessage: lead.message,
          preferredContact: lead.preferred_contact
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiMessage(data.response);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      alert('Failed to generate AI response');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Send message to lead
  const sendMessageToLead = async (lead, message) => {
    setSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      
      if (lead.preferred_contact === 'sms' && lead.phone) {
        // Send SMS
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leads/send-sms`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            leadId: lead.id,
            phone: lead.phone,
            message: message
          })
        });

        if (response.ok) {
          alert('SMS sent successfully!');
          setAiMessage('');
          fetchLeads();
        }
      } else if (lead.email) {
        // Send Email
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leads/send-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            leadId: lead.id,
            email: lead.email,
            subject: `Re: ${lead.service_interest || 'Your Inquiry'}`,
            message: message
          })
        });

        if (response.ok) {
          alert('Email sent successfully!');
          setAiMessage('');
          fetchLeads();
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Convert lead to customer
  const convertToCustomer = async (lead) => {
    if (!confirm('Convert this lead to a customer?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leads/${lead.id}/convert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Lead converted to customer!');
        fetchLeads();
        fetchCustomers();
        setSelectedLead(null);
      }
    } catch (error) {
      console.error('Error converting lead:', error);
      alert('Failed to convert lead');
    }
  };

  // Create booking for customer
  const createBookingForCustomer = (customer) => {
    setCurrentView('calendar');
    // Store customer info for booking
    localStorage.setItem('preselectedCustomer', JSON.stringify(customer));
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.phone?.includes(searchTerm);
    
    const matchesFilter = filterStatus === 'all' || lead.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    return customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           customer.phone?.includes(searchTerm);
  });

  // Calculate stats
  const leadStats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted_email' || l.status === 'contacted_sms').length,
    converted: leads.filter(l => l.status === 'converted').length,
    emailPreferred: leads.filter(l => l.preferred_contact === 'email').length,
    smsPreferred: leads.filter(l => l.preferred_contact === 'sms').length,
  };

  const customerStats = {
    total: customers.length,
    active: customers.filter(c => c.total_jobs > 0).length,
    avgValue: customers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0) / (customers.length || 1)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers & Leads</h1>
          <p className="text-gray-600 mt-1">Manage your customer relationships and convert leads</p>
        </div>
        <button
          onClick={() => window.open(`${window.location.origin}/contact/${user.id}`, '_blank')}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
        >
          <UserPlus className="w-4 h-4" />
          Public Lead Form
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-100" />
          </div>
          <div className="text-3xl font-bold">{leadStats.total}</div>
          <div className="text-sm text-blue-100">Total Leads</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Sparkles className="w-8 h-8 text-green-100" />
          </div>
          <div className="text-3xl font-bold">{leadStats.new}</div>
          <div className="text-sm text-green-100">New Leads</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-8 h-8 text-purple-100" />
          </div>
          <div className="text-3xl font-bold">{leadStats.contacted}</div>
          <div className="text-sm text-purple-100">Contacted</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-8 h-8 text-orange-100" />
          </div>
          <div className="text-3xl font-bold">{leadStats.converted}</div>
          <div className="text-sm text-orange-100">Converted</div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-pink-100" />
          </div>
          <div className="text-3xl font-bold">{customerStats.total}</div>
          <div className="text-sm text-pink-100">Customers</div>
        </div>
      </div>

      {/* Email-First Lead Strategy Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-xl p-6 shadow-xl text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-yellow-300" />
              <h3 className="text-xl font-bold">Email-First Lead Strategy</h3>
            </div>
            <p className="text-emerald-100 mb-3">
              <span className="font-bold text-white">{leadStats.emailPreferred}</span> of your leads prefer email communication - 
              saving you <span className="font-bold text-white">${(leadStats.emailPreferred * 5 * 0.0079).toFixed(2)}/month</span> in SMS costs!
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{leadStats.emailPreferred} Email leads (FREE)</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{leadStats.smsPreferred} SMS leads ($0.0079 each)</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>82% cost savings</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-6 py-4 font-semibold transition-all ${
                activeTab === 'leads'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Leads ({leadStats.total})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-6 py-4 font-semibold transition-all ${
                activeTab === 'customers'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Customers ({customerStats.total})
              </div>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {activeTab === 'leads' && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted_email">Contacted (Email)</option>
                <option value="contacted_sms">Contacted (SMS)</option>
                <option value="email_preferred">Email Preferred</option>
                <option value="sms_conversation">SMS Conversation</option>
                <option value="converted">Converted</option>
              </select>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'leads' ? (
            <LeadsView
              leads={filteredLeads}
              loading={loading}
              selectedLead={selectedLead}
              setSelectedLead={setSelectedLead}
              generateAIResponse={generateAIResponse}
              aiMessage={aiMessage}
              setAiMessage={setAiMessage}
              generatingAI={generatingAI}
              sendMessageToLead={sendMessageToLead}
              sendingMessage={sendingMessage}
              convertToCustomer={convertToCustomer}
              showConversation={showConversation}
              setShowConversation={setShowConversation}
            />
          ) : (
            <CustomersView
              customers={filteredCustomers}
              loading={loading}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              createBookingForCustomer={createBookingForCustomer}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Leads View Component
function LeadsView({ 
  leads, 
  loading, 
  selectedLead, 
  setSelectedLead,
  generateAIResponse,
  aiMessage,
  setAiMessage,
  generatingAI,
  sendMessageToLead,
  sendingMessage,
  convertToCustomer,
  showConversation,
  setShowConversation
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading leads...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads yet</h3>
        <p className="text-gray-600">Share your public lead form to start collecting leads!</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Leads List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {leads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => setSelectedLead(lead)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedLead?.id === lead.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {lead.preferred_contact === 'email' ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      SMS
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(lead.status)}`}>
                    {lead.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{formatDate(lead.created_at)}</div>
              </div>
            </div>
            
            {lead.service_interest && (
              <div className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Interest:</span> {lead.service_interest}
              </div>
            )}
            
            {lead.message && (
              <div className="text-sm text-gray-600 line-clamp-2">
                "{lead.message}"
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lead Details */}
      {selectedLead ? (
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 sticky top-0">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedLead.name}</h2>
              <p className="text-gray-600">{formatDate(selectedLead.created_at)}</p>
            </div>
            <button
              onClick={() => setSelectedLead(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 mb-6">
            {selectedLead.email && (
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-blue-600" />
                <a href={`mailto:${selectedLead.email}`} className="hover:underline">
                  {selectedLead.email}
                </a>
              </div>
            )}
            {selectedLead.phone && (
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-green-600" />
                <a href={`tel:${selectedLead.phone}`} className="hover:underline">
                  {selectedLead.phone}
                </a>
              </div>
            )}
            {selectedLead.service_interest && (
              <div className="flex items-center gap-3 text-gray-700">
                <Star className="w-5 h-5 text-purple-600" />
                <span>{selectedLead.service_interest}</span>
              </div>
            )}
          </div>

          {/* Original Message */}
          {selectedLead.message && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Original Message:</h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-gray-700">
                {selectedLead.message}
              </div>
            </div>
          )}

          {/* AI Response Generator */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">AI Response</h3>
              <button
                onClick={() => generateAIResponse(selectedLead)}
                disabled={generatingAI}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {generatingAI ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    Generate AI Response
                  </>
                )}
              </button>
            </div>

            <textarea
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              placeholder="AI-generated response will appear here, or write your own..."
              className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />

            <div className="flex items-center gap-3">
              <button
                onClick={() => sendMessageToLead(selectedLead, aiMessage)}
                disabled={!aiMessage || sendingMessage}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sendingMessage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send {selectedLead.preferred_contact === 'sms' ? 'SMS' : 'Email'}
                  </>
                )}
              </button>

              <button
                onClick={() => convertToCustomer(selectedLead)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Convert
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Select a lead to view details</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Customers View Component
function CustomersView({ 
  customers, 
  loading, 
  selectedCustomer, 
  setSelectedCustomer,
  createBookingForCustomer
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading customers...</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers yet</h3>
        <p className="text-gray-600">Convert leads or create bookings to add customers!</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Customers List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {customers.map((customer) => (
          <div
            key={customer.id}
            onClick={() => setSelectedCustomer(customer)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedCustomer?.id === customer.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {customer.total_jobs > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      {customer.total_jobs} bookings
                    </span>
                  )}
                  {customer.lifetime_value > 0 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      ${customer.lifetime_value.toFixed(0)} LTV
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">{formatDate(customer.created_at)}</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {customer.email}
            </div>
          </div>
        ))}
      </div>

      {/* Customer Details */}
      {selectedCustomer ? (
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 sticky top-0">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
              <p className="text-gray-600">Customer since {formatDate(selectedCustomer.created_at)}</p>
            </div>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 mb-6">
            {selectedCustomer.email && (
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-blue-600" />
                <a href={`mailto:${selectedCustomer.email}`} className="hover:underline">
                  {selectedCustomer.email}
                </a>
              </div>
            )}
            {selectedCustomer.phone && (
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-green-600" />
                <a href={`tel:${selectedCustomer.phone}`} className="hover:underline">
                  {selectedCustomer.phone}
                </a>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{selectedCustomer.total_jobs || 0}</div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">${(selectedCustomer.lifetime_value || 0).toFixed(0)}</div>
              <div className="text-sm text-gray-600">Lifetime Value</div>
            </div>
          </div>

          {/* Notes */}
          {selectedCustomer.notes && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Notes:</h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-gray-700">
                {selectedCustomer.notes}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => createBookingForCustomer(selectedCustomer)}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 font-semibold"
            >
              <Calendar className="w-5 h-5" />
              Create New Booking
            </button>

            <button
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Send Message
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Select a customer to view details</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getStatusColor(status) {
  const colors = {
    new: 'bg-yellow-100 text-yellow-700',
    contacted_email: 'bg-blue-100 text-blue-700',
    contacted_sms: 'bg-green-100 text-green-700',
    email_preferred: 'bg-purple-100 text-purple-700',
    sms_conversation: 'bg-indigo-100 text-indigo-700',
    converted: 'bg-emerald-100 text-emerald-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  
  return date.toLocaleDateString();
}
