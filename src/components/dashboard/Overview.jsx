import { Calendar, Briefcase, Users, TrendingUp, Clock, DollarSign, Star, Globe, MessageSquare, Zap, Target, ArrowUpRight, CheckCircle2, Mail, Phone, Bot, Sparkles, ArrowLeft, ArrowRight, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Overview({ bookings, services, employees, setCurrentView, user, apiUrl, authFetch }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);

  // Fetch customers and leads
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, leadsRes] = await Promise.all([
          authFetch(`${apiUrl}/api/customers`),
          authFetch(`${apiUrl}/api/leads`)
        ]);
        
        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData.customers || []);
        }
        
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          setLeads(leadsData.leads || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [apiUrl, authFetch]);

  // Calculate date range for current week view
  const getWeekRange = (offset) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (offset * 7)); // Sunday
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    
    return { startOfWeek, endOfWeek };
  };

  const { startOfWeek, endOfWeek } = getWeekRange(weekOffset);

  // Format date range display
  const formatDateRange = () => {
    const options = { month: 'short', day: 'numeric' };
    const start = startOfWeek.toLocaleDateString('en-US', options);
    const end = endOfWeek.toLocaleDateString('en-US', options);
    const year = endOfWeek.getFullYear();
    return `${start} - ${end}, ${year}`;
  };

  // Calculate metrics for the week
  const weekBookings = bookings.filter(b => {
    const bookingDate = new Date(b.booking_date);
    return bookingDate >= startOfWeek && bookingDate <= endOfWeek;
  });

  const weekRevenue = weekBookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
  const weekCompleted = weekBookings.filter(b => b.status === 'completed').length;
  const completionRate = weekBookings.length > 0 ? ((weekCompleted / weekBookings.length) * 100).toFixed(1) : 0;

  // Calculate week leads
  const weekLeads = leads.filter(lead => {
    const leadDate = new Date(lead.created_at);
    return leadDate >= startOfWeek && leadDate <= endOfWeek;
  });

  // Calculate week customers
  const weekCustomers = customers.filter(customer => {
    const customerDate = new Date(customer.created_at);
    return customerDate >= startOfWeek && customerDate <= endOfWeek;
  });

  // Calculate today's bookings
  const today = new Date().toDateString();
  const todayBookings = bookings.filter(b => new Date(b.booking_date).toDateString() === today);

  // Real data stats
  const weekStats = {
    websiteChat: {
      conversationsStarted: weekLeads.filter(l => l.source === 'website_chat').length,
      bookingsMade: weekBookings.filter(b => b.source === 'website_chat').length,
      phoneNumbersCollected: weekLeads.filter(l => l.source === 'website_chat' && l.phone).length,
      followUpLeads: weekLeads.filter(l => l.status === 'new' || l.status === 'contacted').length,
      conversionRate: weekLeads.length > 0 ? ((weekBookings.filter(b => b.source === 'website_chat').length / weekLeads.filter(l => l.source === 'website_chat').length) * 100).toFixed(0) : 0
    },
    leadForms: {
      totalSubmissions: weekLeads.filter(l => l.source === 'lead_form').length,
      emailConversions: weekLeads.filter(l => l.source === 'lead_form' && l.email).length,
      smsConversions: weekLeads.filter(l => l.source === 'lead_form' && l.phone).length,
      qualificationSuccess: weekLeads.filter(l => l.qualified === true).length,
      costSavings: (weekLeads.filter(l => l.source === 'lead_form').length * 0.15).toFixed(2)
    },
    newBookings: {
      total: weekBookings.length,
      fromChat: weekBookings.filter(b => b.source === 'website_chat').length,
      fromLeadForms: weekBookings.filter(b => b.source === 'lead_form').length,
      manualEntry: weekBookings.filter(b => !b.source || b.source === 'manual').length,
      revenue: weekRevenue
    },
    reviewSystem: {
      requestsSent: weekBookings.filter(b => b.review_request_sent).length,
      reviewsReceived: weekBookings.filter(b => b.review_received).length,
      aiRepliesGenerated: weekBookings.filter(b => b.ai_reply_sent).length,
      responseRate: weekBookings.filter(b => b.review_request_sent).length > 0 
        ? ((weekBookings.filter(b => b.review_received).length / weekBookings.filter(b => b.review_request_sent).length) * 100).toFixed(0)
        : 0,
      timeSaved: (weekBookings.filter(b => b.ai_reply_sent).length * 0.1).toFixed(2)
    }
  };

  const totalLeads = weekLeads.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📊 Overview Dashboard</h1>
        <p className="text-gray-600 mt-1">Weekly stats with navigation</p>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">This Week's Performance</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="font-semibold text-gray-700 min-w-[200px] text-center">
              {formatDateRange()}
            </span>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              disabled={weekOffset >= 0}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Week Summary - GREEN BANNER AT TOP */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border-l-4 border-emerald-500 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-gray-900">Week Summary</h3>
          </div>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Leads Captured</div>
              <div className="text-3xl font-bold text-gray-900">{totalLeads}</div>
              <div className="text-xs text-gray-500 mt-1">+{weekCustomers.length} new customers</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Conversion Rate</div>
              <div className="text-3xl font-bold text-gray-900">{completionRate}%</div>
              <div className="text-xs text-gray-500 mt-1">{weekCompleted} completed jobs</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Revenue This Week</div>
              <div className="text-3xl font-bold text-gray-900">${weekRevenue.toFixed(0)}</div>
              <div className="text-xs text-gray-500 mt-1">from {weekBookings.length} bookings</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">AI Cost Savings</div>
              <div className="text-3xl font-bold text-gray-900">${weekStats.leadForms.costSavings}</div>
              <div className="text-xs text-gray-500 mt-1">automated lead qualification</div>
            </div>
          </div>
        </div>

        {/* Performance Cards - 4 columns */}
        <div className="grid md:grid-cols-4 gap-6">
          {/* Website Chat Agent */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">Website Chat Agent</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Conversations Started</span>
                <span className="font-bold text-blue-600">{weekStats.websiteChat.conversationsStarted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bookings Made</span>
                <span className="font-bold text-green-600">{weekStats.websiteChat.bookingsMade}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Phone Numbers Collected</span>
                <span className="font-bold text-orange-600">{weekStats.websiteChat.phoneNumbersCollected}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Added to "Follow Up" List</span>
                <span className="font-bold text-purple-600">{weekStats.websiteChat.followUpLeads} leads</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-green-50 px-3 py-2 rounded-lg text-center">
                <span className="text-sm font-semibold text-green-700">
                  Conversion Rate: {weekStats.websiteChat.conversionRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Lead Form Submissions */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-purple-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900">Lead Form Submissions</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Submissions</span>
                <span className="font-bold text-blue-600">{weekStats.leadForms.totalSubmissions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Conversions</span>
                <span className="font-bold text-green-600">{weekStats.leadForms.emailConversions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">SMS Conversions</span>
                <span className="font-bold text-orange-600">{weekStats.leadForms.smsConversions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AI Qualification Success</span>
                <span className="font-bold text-purple-600">{weekStats.leadForms.qualificationSuccess} qualified</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-yellow-50 px-3 py-2 rounded-lg text-center">
                <span className="text-sm font-semibold text-yellow-700">
                  Cost Savings: ${weekStats.leadForms.costSavings} this week
                </span>
              </div>
            </div>
          </div>

          {/* New Bookings */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-green-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900">New Bookings</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Bookings</span>
                <span className="font-bold text-blue-600">{weekStats.newBookings.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">From Website Chat</span>
                <span className="font-bold text-green-600">{weekStats.newBookings.fromChat}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">From Lead Forms</span>
                <span className="font-bold text-orange-600">{weekStats.newBookings.fromLeadForms}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Manual Entry</span>
                <span className="font-bold text-purple-600">{weekStats.newBookings.manualEntry}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-blue-50 px-3 py-2 rounded-lg text-center">
                <span className="text-sm font-semibold text-blue-700">
                  Revenue: ${weekStats.newBookings.revenue.toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* Review System */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-yellow-300 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="font-bold text-gray-900">Review System</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Requests Sent</span>
                <span className="font-bold text-blue-600">{weekStats.reviewSystem.requestsSent}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Reviews Received</span>
                <span className="font-bold text-green-600">{weekStats.reviewSystem.reviewsReceived}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AI Replies Generated</span>
                <span className="font-bold text-orange-600">{weekStats.reviewSystem.aiRepliesGenerated}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Response Rate</span>
                <span className="font-bold text-purple-600">{weekStats.reviewSystem.responseRate}%</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-orange-50 px-3 py-2 rounded-lg text-center">
                <span className="text-sm font-semibold text-orange-700">
                  Time Saved: {weekStats.reviewSystem.timeSaved} hours
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Activity */}
      {todayBookings.length > 0 && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Today's Bookings</h2>
          <div className="space-y-3">
            {todayBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:from-blue-50 hover:to-white transition-all border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {booking.start_time?.substring(0, 5) || '--'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{booking.customer_name}</div>
                    <div className="text-sm text-gray-600">{booking.items?.[0]?.service_name || 'Service'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">${parseFloat(booking.total_amount || 0).toFixed(0)}</div>
                  <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                    booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {booking.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setCurrentView('customers-leads')}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
          >
            <Users className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Customers & Leads</h3>
            <p className="text-sm text-gray-600">{customers.length} customers, {leads.length} leads</p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('ai-agents')}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
          >
            <Bot className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">AI Agents</h3>
            <p className="text-sm text-gray-600">Deploy automation</p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('google-business')}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left group"
          >
            <Globe className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Google Business</h3>
            <p className="text-sm text-gray-600">Manage profile & reviews</p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('business-settings')}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
          >
            <Building2 className="w-8 h-8 text-indigo-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Business Info</h3>
            <p className="text-sm text-gray-600">Settings & details</p>
          </button>
        </div>
      </div>
    </div>
  );
}
