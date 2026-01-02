import React, { useState } from 'react';
import { Globe, CreditCard, Puzzle, Settings, LogOut, Menu, X, Sparkles, Briefcase, Users, Clock } from 'lucide-react';
// import BusinessHoursPage from './BusinessHoursPage';
// import ServicesPage from './ServicesPage';
// import EmployeesPage from './EmployeesPage';

const Dashboard = ({ user, onLogout, generatedWebsite }) => {
  const [currentPage, setCurrentPage] = useState('website');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile

  const navigationItems = [
    { id: 'website', label: 'Website', icon: Globe },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'employees', label: 'Team', icon: Users },
    { id: 'hours', label: 'Business Hours', icon: Clock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Puzzle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0
        fixed lg:static
        w-64 bg-white border-r border-gray-200 
        transition-transform duration-300 
        flex flex-col 
        h-screen
        z-50
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              SORCE
            </span>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setCurrentPage(item.id);
                      setSidebarOpen(false); // Close on mobile after selecting
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-purple-50 text-purple-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full mt-3 flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {navigationItems.find(item => item.id === currentPage)?.label}
            </h1>
          </div>
        </div>

        {/* Content area */}
        <div className="p-8">
          {currentPage === 'website' && <WebsitePage generatedWebsite={generatedWebsite} />}
          {currentPage === 'services' && <div className="text-center py-12"><p className="text-gray-600">Services page coming soon...</p></div>}
          {currentPage === 'employees' && <div className="text-center py-12"><p className="text-gray-600">Team page coming soon...</p></div>}
          {currentPage === 'hours' && <div className="text-center py-12"><p className="text-gray-600">Business Hours page coming soon...</p></div>}
          {currentPage === 'billing' && <BillingPage user={user} />}
          {currentPage === 'integrations' && <IntegrationsPage />}
          {currentPage === 'settings' && <SettingsPage user={user} />}
        </div>
      </div>
    </div>
  );
};

// Website Page Component
const WebsitePage = ({ generatedWebsite }) => {
  return (
    <div className="max-w-6xl">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Website</h2>
            <p className="text-gray-600">View and manage your AI-generated website</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">
              Edit Website
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-medium">
              Publish Live
            </button>
          </div>
        </div>

        {generatedWebsite ? (
          <div>
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">Preview URL:</p>
              <a href="#" className="text-purple-600 font-medium hover:underline">
                https://your-website.sorce.ai
              </a>
            </div>
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <iframe
                srcDoc={generatedWebsite}
                className="w-full h-full"
                title="Website Preview"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Website Yet</h3>
            <p className="text-gray-600 mb-6">Create your first website to get started</p>
            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-semibold">
              Create Website
            </button>
          </div>
        )}
      </div>

      {/* Website Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 text-sm mb-1">Total Visitors</p>
          <p className="text-3xl font-bold text-gray-900">1,234</p>
          <p className="text-green-600 text-sm mt-2">↑ 12% from last month</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 text-sm mb-1">Bookings</p>
          <p className="text-3xl font-bold text-gray-900">47</p>
          <p className="text-green-600 text-sm mt-2">↑ 8% from last month</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 text-sm mb-1">Conversion Rate</p>
          <p className="text-3xl font-bold text-gray-900">3.8%</p>
          <p className="text-green-600 text-sm mt-2">↑ 0.4% from last month</p>
        </div>
      </div>
    </div>
  );
};

// Billing Page Component
const BillingPage = ({ user }) => {
  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Plan</h2>
        
        <div className="border-2 border-purple-200 bg-purple-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Pro Plan</h3>
              <p className="text-gray-600">$59.95 / month</p>
            </div>
            <span className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold">
              Active
            </span>
          </div>
          <p className="text-gray-700 mb-4">Next billing date: January 31, 2025</p>
          <button className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition font-medium">
            Change Plan
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>
        <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">•••• •••• •••• 4242</p>
              <p className="text-sm text-gray-600">Expires 12/25</p>
            </div>
          </div>
          <button className="text-purple-600 font-medium hover:underline">
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

// Integrations Page Component
const IntegrationsPage = () => {
  const integrations = [
    { name: 'Google Analytics', description: 'Track website visitors', connected: true },
    { name: 'Stripe', description: 'Accept payments online', connected: false },
    { name: 'Mailchimp', description: 'Email marketing automation', connected: false },
    { name: 'Zapier', description: 'Connect 5,000+ apps', connected: false },
  ];

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Integrations</h2>
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.name} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
              <div>
                <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                <p className="text-sm text-gray-600">{integration.description}</p>
              </div>
              <button className={`px-4 py-2 rounded-lg font-medium transition ${
                integration.connected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}>
                {integration.connected ? 'Connected' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Settings Page Component
const SettingsPage = ({ user }) => {
  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              defaultValue={user?.name}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              defaultValue={user?.email}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold">
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Danger Zone</h2>
        <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold">
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
