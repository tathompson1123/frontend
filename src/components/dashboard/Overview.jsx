import { Calendar, Briefcase, Users, TrendingUp, Clock, DollarSign, Star, Globe, MessageSquare, Zap, Target, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function Overview({ bookings, services, employees, setCurrentView, user }) {
  // Calculate metrics
  const today = new Date().toDateString();
  const todayBookings = bookings.filter(b => new Date(b.booking_date).toDateString() === today);
  
  const thisWeekBookings = bookings.filter(b => {
    const bookingDate = new Date(b.booking_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return bookingDate >= weekAgo;
  });
  
  const thisMonthBookings = bookings.filter(b => {
    const bookingDate = new Date(b.booking_date);
    return bookingDate.getMonth() === new Date().getMonth() &&
           bookingDate.getFullYear() === new Date().getFullYear();
  });

  const thisMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
  const avgBookingValue = thisMonthBookings.length > 0 ? thisMonthRevenue / thisMonthBookings.length : 0;

  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const totalBookings = bookings.length;
  const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

  // Calculate potential with automated review system
  const avgReviewConversion = 0.35; // 35% review rate
  const avgNewCustomerFromReview = 2.5; // Each review brings 2.5 new customers
  const potentialNewCustomers = Math.round(completedBookings * avgReviewConversion * avgNewCustomerFromReview);
  const potentialRevenue = potentialNewCustomers * avgBookingValue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.businessName || 'User'}! 👋</h1>
          <p className="text-gray-600 mt-1">Here's your business performance dashboard</p>
        </div>
        <button
          onClick={() => setCurrentView('vision')}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 shadow-lg"
        >
          <Target className="w-4 h-4" />
          View Vision Board
        </button>
      </div>

      {/* Main KPI Cards - Inspired by Vision Board */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-10 h-10 text-blue-100" />
              <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Today</span>
            </div>
            <div className="text-4xl font-bold mb-1">{todayBookings.length}</div>
            <div className="text-sm text-blue-100">Bookings Today</div>
            {todayBookings.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-400/30 text-xs text-blue-100">
                ${todayBookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0).toFixed(0)} revenue
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-10 h-10 text-purple-100" />
              <span className="text-xs font-bold text-purple-100 uppercase tracking-wider">This Week</span>
            </div>
            <div className="text-4xl font-bold mb-1">{thisWeekBookings.length}</div>
            <div className="text-sm text-purple-100">Weekly Bookings</div>
            <div className="mt-3 pt-3 border-t border-purple-400/30 text-xs text-purple-100">
              +{Math.round((thisWeekBookings.length / 7) * 100)}% daily avg
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-10 h-10 text-green-100" />
              <span className="text-xs font-bold text-green-100 uppercase tracking-wider">Revenue</span>
            </div>
            <div className="text-4xl font-bold mb-1">${thisMonthRevenue.toFixed(0)}</div>
            <div className="text-sm text-green-100">This Month</div>
            <div className="mt-3 pt-3 border-t border-green-400/30 text-xs text-green-100">
              ${avgBookingValue.toFixed(0)} avg booking
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <Star className="w-10 h-10 text-orange-100" />
              <span className="text-xs font-bold text-orange-100 uppercase tracking-wider">Success</span>
            </div>
            <div className="text-4xl font-bold mb-1">{completionRate}%</div>
            <div className="text-sm text-orange-100">Completion Rate</div>
            <div className="mt-3 pt-3 border-t border-orange-400/30 text-xs text-orange-100">
              {completedBookings} of {totalBookings} completed
            </div>
          </div>
        </div>
      </div>

      {/* Growth Opportunity Banner - Inspired by Vision Board */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-8 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-8 h-8 text-yellow-300" />
                <h3 className="text-2xl font-bold">Unlock Revenue Potential</h3>
              </div>
              <p className="text-indigo-100 text-lg mb-4">
                With automated review requests, you could generate <span className="font-bold text-white">{potentialNewCustomers} new customers</span> and 
                <span className="font-bold text-white"> ${potentialRevenue.toFixed(0)} additional revenue</span> from your existing {completedBookings} completed jobs.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  <span>35% review rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  <span>2.5x customer multiplier</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  <span>Automated system</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('google-business')}
              className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg ml-4"
            >
              Set Up Now
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Active Services</div>
              <div className="text-3xl font-bold text-gray-900">{services.filter(s => s.active).length}</div>
              <div className="text-xs text-gray-500 mt-1">Generating revenue</div>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Team Members</div>
              <div className="text-3xl font-bold text-gray-900">{employees.filter(e => e.active).length}</div>
              <div className="text-xs text-gray-500 mt-1">Serving customers</div>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 hover:border-green-300 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Bookings</div>
              <div className="text-3xl font-bold text-gray-900">{totalBookings}</div>
              <div className="text-xs text-gray-500 mt-1">All time</div>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setCurrentView('services')}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
          >
            <Briefcase className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Services</h3>
            <p className="text-sm text-gray-600">Manage offerings</p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('team')}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
          >
            <Users className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Team</h3>
            <p className="text-sm text-gray-600">Manage employees</p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('hours')}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left group"
          >
            <Clock className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Hours</h3>
            <p className="text-sm text-gray-600">Set availability</p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('website')}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
          >
            <Globe className="w-8 h-8 text-indigo-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 mb-1">Website</h3>
            <p className="text-sm text-gray-600">Edit your site</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
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
    </div>
  );
}
