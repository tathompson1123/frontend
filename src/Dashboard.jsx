import { useState } from 'react';
import { 
  Home, 
  Settings, 
  Users, 
  Briefcase, 
  Clock, 
  Calendar,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

export default function Dashboard({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('overview');

  const handleLogout = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (onLogout) {
        onLogout();
      }
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { id: 'overview', icon: Home, label: 'Overview' },
    { id: 'services', icon: Briefcase, label: 'Services' },
    { id: 'team', icon: Users, label: 'Team' },
    { id: 'hours', icon: Clock, label: 'Business Hours' },
    { id: 'bookings', icon: Calendar, label: 'Bookings' },
    { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  SORCE
                </span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-gray-600 mx-auto">
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {menuItems.find(item => item.id === currentView)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.businessName || 'My Business'}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {(user.businessName || 'M')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-auto">
          {currentView === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Bookings', value: '0', icon: Calendar, color: 'blue' },
                  { label: 'Active Services', value: '0', icon: Briefcase, color: 'purple' },
                  { label: 'Team Members', value: '0', icon: Users, color: 'green' },
                  { label: 'Reviews', value: '0', icon: TrendingUp, color: 'orange' },
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">{stat.label}</span>
                        <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome to SORCE! 🎉</h2>
                <p className="text-gray-600 mb-6">
                  Your AI-powered business platform is ready to go. Start by setting up your services, team, and business hours.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setCurrentView('services')}
                    className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-colors text-left"
                  >
                    <Briefcase className="w-8 h-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">Add Services</h3>
                    <p className="text-sm text-gray-600">Create your service catalog</p>
                  </button>
                  <button
                    onClick={() => setCurrentView('team')}
                    className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-left"
                  >
                    <Users className="w-8 h-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">Add Team</h3>
                    <p className="text-sm text-gray-600">Invite your team members</p>
                  </button>
                  <button
                    onClick={() => setCurrentView('hours')}
                    className="p-4 border-2 border-green-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-colors text-left"
                  >
                    <Clock className="w-8 h-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">Set Hours</h3>
                    <p className="text-sm text-gray-600">Configure business hours</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentView === 'services' && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Services</h2>
              <p className="text-gray-600">Services management coming soon...</p>
            </div>
          )}

          {currentView === 'team' && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Team Members</h2>
              <p className="text-gray-600">Team management coming soon...</p>
            </div>
          )}

          {currentView === 'hours' && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Business Hours</h2>
              <p className="text-gray-600">Business hours configuration coming soon...</p>
            </div>
          )}

          {currentView === 'bookings' && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Bookings</h2>
              <p className="text-gray-600">Bookings calendar coming soon...</p>
            </div>
          )}

          {currentView === 'analytics' && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Analytics</h2>
              <p className="text-gray-600">Analytics dashboard coming soon...</p>
            </div>
          )}

          {currentView === 'settings' && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>
              <p className="text-gray-600">Settings page coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
