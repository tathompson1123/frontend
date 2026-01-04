import { Calendar, Briefcase, Users, TrendingUp, Clock } from 'lucide-react';

export default function Overview({ bookings, services, employees, setCurrentView, user }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.businessName || 'User'}!</h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your business today.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-semibold text-gray-500">TODAY</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {bookings.filter(b => new Date(b.booking_date).toDateString() === new Date().toDateString()).length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Bookings Today</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Briefcase className="w-8 h-8 text-purple-600" />
            <span className="text-sm font-semibold text-gray-500">ACTIVE</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{services.filter(s => s.active).length}</div>
          <div className="text-sm text-gray-600 mt-1">Active Services</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-green-600" />
            <span className="text-sm font-semibold text-gray-500">TEAM</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{employees.filter(e => e.active).length}</div>
          <div className="text-sm text-gray-600 mt-1">Team Members</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <span className="text-sm font-semibold text-gray-500">MONTH</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{bookings.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Bookings</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setCurrentView('services')}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
          >
            <Briefcase className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Manage Services</h3>
            <p className="text-sm text-gray-600">Add or edit your service offerings</p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('team')}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
          >
            <Users className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Manage Team</h3>
            <p className="text-sm text-gray-600">Add team members and assign services</p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('hours')}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left group"
          >
            <Clock className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Business Hours</h3>
            <p className="text-sm text-gray-600">Set your availability schedule</p>
          </button>
        </div>
      </div>
    </div>
  );
}
