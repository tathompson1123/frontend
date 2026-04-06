import { Calendar, Briefcase, Users, TrendingUp, Clock, DollarSign, Star, Globe, MessageSquare, Zap, Target, ArrowUpRight, CheckCircle2, Mail, Phone, Bot, Sparkles, ArrowLeft, ArrowRight, Building2, ChevronLeft, ChevronRight, Plus, Trash2, Check, AlertTriangle, Minus, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

export default function Overview({ bookings, services, employees, setCurrentView, user, apiUrl, authFetch }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [activeCard, setActiveCard] = useState(0);
  const autoPlayRef = useRef(null);
  const [todos, setTodos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sorce_todos') || '[]'); } catch { return []; }
  });
  const [todoInput, setTodoInput] = useState('');
  const [todoPriority, setTodoPriority] = useState('medium');

  const PRIORITY_CONFIG = {
    high:   { label: 'High',   color: 'text-red-600',    bg: 'bg-red-50',   border: 'border-red-200',   icon: <AlertTriangle className="w-3 h-3" /> },
    medium: { label: 'Medium', color: 'text-amber-600',  bg: 'bg-amber-50', border: 'border-amber-200', icon: <Minus className="w-3 h-3" /> },
    low:    { label: 'Low',    color: 'text-gray-400',   bg: 'bg-gray-50',  border: 'border-gray-200',  icon: <ChevronDown className="w-3 h-3" /> },
  };

  const saveTodos = (updated) => {
    setTodos(updated);
    localStorage.setItem('sorce_todos', JSON.stringify(updated));
  };
  const addTodo = () => {
    const text = todoInput.trim();
    if (!text) return;
    saveTodos([...todos, { id: Date.now(), text, done: false, priority: todoPriority, createdAt: new Date().toISOString() }]);
    setTodoInput('');
  };
  const toggleTodo = (id) => saveTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTodo = (id) => saveTodos(todos.filter(t => t.id !== id));

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
  });

  const formatTodoDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

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

  // Auto-rotate performance cards
  const startAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActiveCard(prev => (prev + 1) % 4);
    }, 5000);
  }, []);

  useEffect(() => {
    startAutoPlay();
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [startAutoPlay]);

  const goToCard = (idx) => {
    setActiveCard(idx);
    startAutoPlay();
  };

  const prevCard = () => {
    setActiveCard(prev => (prev - 1 + 4) % 4);
    startAutoPlay();
  };

  const nextCard = () => {
    setActiveCard(prev => (prev + 1) % 4);
    startAutoPlay();
  };

  // Calculate date range for current week view
  const getWeekRange = (offset) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (offset * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return { startOfWeek, endOfWeek };
  };

  const { startOfWeek, endOfWeek } = getWeekRange(weekOffset);

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

  const weekLeads = leads.filter(lead => {
    const leadDate = new Date(lead.created_at);
    return leadDate >= startOfWeek && leadDate <= endOfWeek;
  });

  const weekCustomers = customers.filter(customer => {
    const customerDate = new Date(customer.created_at);
    return customerDate >= startOfWeek && customerDate <= endOfWeek;
  });

  const today = new Date().toDateString();
  const todayBookings = bookings.filter(b => {
    if (!b.created_at) return false;
    return new Date(b.created_at).toDateString() === today;
  });

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
      manualEntry: weekBookings.filter(b => !b.source || (b.source !== 'website_chat' && b.source !== 'lead_form')).length,
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

  // Performance cards data
  const performanceCards = [
    {
      title: 'Website Chat Agent',
      icon: MessageSquare,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      hoverBorder: 'border-blue-400',
      stats: [
        { label: 'Conversations Started', value: weekStats.websiteChat.conversationsStarted, color: 'text-blue-600' },
        { label: 'Bookings Made', value: weekStats.websiteChat.bookingsMade, color: 'text-green-600' },
        { label: 'Phone Numbers Collected', value: weekStats.websiteChat.phoneNumbersCollected, color: 'text-orange-600' },
        { label: 'Added to "Follow Up" List', value: `${weekStats.websiteChat.followUpLeads} leads`, color: 'text-amber-600' },
      ],
      footer: { bg: 'bg-green-50', color: 'text-green-700', text: `Conversion Rate: ${weekStats.websiteChat.conversionRate}%` }
    },
    {
      title: 'Lead Form Submissions',
      icon: Sparkles,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      hoverBorder: 'border-amber-400',
      stats: [
        { label: 'Total Submissions', value: weekStats.leadForms.totalSubmissions, color: 'text-blue-600' },
        { label: 'Email Conversions', value: weekStats.leadForms.emailConversions, color: 'text-green-600' },
        { label: 'SMS Conversions', value: weekStats.leadForms.smsConversions, color: 'text-orange-600' },
        { label: 'AI Qualified', value: weekStats.leadForms.qualificationSuccess, color: 'text-amber-600' },
      ],
      footer: { bg: 'bg-yellow-50', color: 'text-yellow-700', text: `Cost Savings: $${weekStats.leadForms.costSavings} this week` }
    },
    {
      title: 'New Bookings',
      icon: Calendar,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      hoverBorder: 'border-green-400',
      stats: [
        { label: 'Total Bookings', value: weekStats.newBookings.total, color: 'text-blue-600' },
        { label: 'From Website Chat', value: weekStats.newBookings.fromChat, color: 'text-green-600' },
        { label: 'From Lead Forms', value: weekStats.newBookings.fromLeadForms, color: 'text-orange-600' },
        { label: 'Manual Entry', value: weekStats.newBookings.manualEntry, color: 'text-amber-600' },
      ],
      footer: { bg: 'bg-blue-50', color: 'text-blue-700', text: `Revenue: $${weekStats.newBookings.revenue.toFixed(0)}` }
    },
    {
      title: 'Review System',
      icon: Star,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      hoverBorder: 'border-yellow-400',
      stats: [
        { label: 'Requests Sent', value: weekStats.reviewSystem.requestsSent, color: 'text-blue-600' },
        { label: 'Reviews Received', value: weekStats.reviewSystem.reviewsReceived, color: 'text-green-600' },
        { label: 'AI Replies Generated', value: weekStats.reviewSystem.aiRepliesGenerated, color: 'text-orange-600' },
        { label: 'Response Rate', value: `${weekStats.reviewSystem.responseRate}%`, color: 'text-amber-600' },
      ],
      footer: { bg: 'bg-orange-50', color: 'text-orange-700', text: `Time Saved: ${weekStats.reviewSystem.timeSaved} hours` }
    }
  ];

  const currentCard = performanceCards[activeCard];
  const CardIcon = currentCard.icon;

  return (
    <div className="flex gap-6 items-start">
    {/* Left column — main content */}
    <div className="flex-1 min-w-0 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Overview Dashboard</h1>
        <p className="text-gray-600 mt-1">Weekly stats with navigation</p>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white rounded-xl px-6 py-3 shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">
          {weekOffset === 0 ? "This Week's Performance" : `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
        </h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-700 text-sm min-w-[180px] text-center">{formatDateRange()}</span>
          {weekOffset < 0 ? (
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowRight className="w-4 h-4 text-gray-600" />
            </button>
          ) : (
            <div className="w-7 h-7" />
          )}
        </div>
      </div>

      {/* Week Summary Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border-l-4 border-emerald-500">
        <div className="flex items-center gap-2 mb-3">
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
            <div className="text-sm text-gray-600 mb-1">Lead Conversion Rate</div>
            <div className="text-3xl font-bold text-gray-900">
              {totalLeads > 0 ? ((weekBookings.length / totalLeads) * 100).toFixed(1) : '0'}%
            </div>
            <div className="text-xs text-gray-500 mt-1">{weekBookings.length} bookings from {totalLeads} leads</div>
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

      {/* Main 2-Column Layout: Booked Today (left) + Revolving Performance Cards (right) */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT: Booked Today */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Booked Today
          </h2>
          {todayBookings.length > 0 ? (
            <div className="space-y-3">
              {todayBookings.slice(0, 8).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:from-blue-50 hover:to-white transition-all border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {booking.start_time?.substring(0, 5) || '--'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{booking.customer_name}</div>
                      <div className="text-xs text-gray-600">{booking.items?.[0]?.service_name || 'Service'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-sm">${parseFloat(booking.total_amount || 0).toFixed(0)}</div>
                    <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
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
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No bookings yet today</p>
              <p className="text-xs mt-1">New bookings will appear here as they come in</p>
            </div>
          )}
        </div>

        {/* RIGHT: Revolving Performance Cards */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Performance</h2>
            <div className="flex items-center gap-2">
              <button onClick={prevCard} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <button onClick={nextCard} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Card content with transition */}
          <div className="transition-all duration-300 ease-in-out">
            <div className={`bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 hover:${currentCard.hoverBorder} transition-all`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 ${currentCard.iconBg} rounded-lg flex items-center justify-center`}>
                  <CardIcon className={`w-5 h-5 ${currentCard.iconColor}`} />
                </div>
                <h3 className="font-bold text-gray-900">{currentCard.title}</h3>
              </div>

              <div className="space-y-3">
                {currentCard.stats.map((stat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{stat.label}</span>
                    <span className={`font-bold ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-gray-200">
                <div className={`${currentCard.footer.bg} px-3 py-2 rounded-lg text-center`}>
                  <span className={`text-sm font-semibold ${currentCard.footer.color}`}>
                    {currentCard.footer.text}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {performanceCards.map((card, idx) => (
              <button
                key={idx}
                onClick={() => goToCard(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === activeCard ? 'bg-blue-600 scale-110' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setCurrentView('customers-leads')}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all text-left group"
          >
            <Users className="w-8 h-8 text-amber-600 mb-3 group-hover:scale-110 transition-transform" />
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
    </div>{/* end left column */}

    {/* Right column — To-Do List */}
    <div className="w-80 flex-shrink-0 sticky top-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-amber-600" />
          To-Do List
        </h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={todoInput}
            onChange={e => setTodoInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
            placeholder="Add a task..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addTodo}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        <div className="flex gap-1.5 mb-4">
          {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTodoPriority(key)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${todoPriority === key ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}
            >
              {cfg.icon}{cfg.label}
            </button>
          ))}
        </div>
        {todos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No tasks yet — add one above</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {sortedTodos.map(todo => {
              const cfg = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.medium;
              return (
                <div key={todo.id} className={`p-3 rounded-lg border transition ${todo.done ? 'bg-gray-50 border-gray-100 opacity-60' : `${cfg.bg} ${cfg.border}`}`}>
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleTodo(todo.id)}
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition mt-0.5 ${todo.done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-amber-500'}`}
                    >
                      {todo.done && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm block ${todo.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{todo.text}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`flex items-center gap-0.5 text-xs font-semibold ${cfg.color}`}>{cfg.icon}{cfg.label}</span>
                        {todo.createdAt && (
                          <span className="text-xs text-gray-400">{formatTodoDate(todo.createdAt)}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteTodo(todo.id)}
                      className="p-1 text-gray-300 hover:text-red-500 transition flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>{/* end right column */}
    </div>
  );
}
