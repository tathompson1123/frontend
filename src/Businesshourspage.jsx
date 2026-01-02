import React, { useState, useEffect } from 'react';
import { Clock, Save, AlertCircle } from 'lucide-react';

const BusinessHoursPage = ({ userId }) => {
  const [hours, setHours] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      // Fetch business hours
      const hoursResponse = await fetch(`${API_URL}/api/business-hours?userId=${userId}`);
      const hoursData = await hoursResponse.json();
      setHours(hoursData.businessHours || []);

      // Fetch booking settings
      const settingsResponse = await fetch(`${API_URL}/api/booking-settings?userId=${userId}`);
      const settingsData = await settingsResponse.json();
      setSettings(settingsData.settings || {});
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHourChange = (dayIndex, field, value) => {
    setHours(prev => {
      const updated = [...prev];
      const day = updated[dayIndex];
      
      if (field === 'is_open') {
        day.is_open = value;
        if (!value) {
          day.open_time = null;
          day.close_time = null;
        }
      } else {
        day[field] = value;
      }
      
      return updated;
    });
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Save business hours
      await fetch(`${API_URL}/api/business-hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, hours })
      });

      // Save booking settings
      await fetch(`${API_URL}/api/booking-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...settings })
      });

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Business Hours & Booking Settings</h2>
        <p className="text-gray-600">Configure when customers can book appointments</p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <AlertCircle className="w-5 h-5" />
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Hours */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Weekly Schedule</h3>
            </div>

            <div className="space-y-4">
              {hours.map((day, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-32">
                    <span className="font-semibold text-gray-900">{day.day_name || daysOfWeek[day.day_of_week]}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={day.is_open}
                      onChange={(e) => handleHourChange(index, 'is_open', e.target.checked)}
                      className="w-5 h-5 text-purple-600 rounded"
                    />
                    <span className="text-sm text-gray-600">Open</span>
                  </div>

                  {day.is_open && (
                    <>
                      <input
                        type="time"
                        value={day.open_time || '09:00'}
                        onChange={(e) => handleHourChange(index, 'open_time', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <span className="text-gray-600">to</span>
                      <input
                        type="time"
                        value={day.close_time || '17:00'}
                        onChange={(e) => handleHourChange(index, 'close_time', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </>
                  )}

                  {!day.is_open && (
                    <span className="text-gray-400 italic">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Settings */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Rules</h3>

            <div className="space-y-6">
              {/* Time Slot Interval */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time Slot Interval
                </label>
                <select
                  value={settings.time_slot_interval || 30}
                  onChange={(e) => handleSettingChange('time_slot_interval', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Gap between available time slots</p>
              </div>

              {/* Buffer Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Buffer Between Jobs
                </label>
                <select
                  value={settings.buffer_time || 15}
                  onChange={(e) => handleSettingChange('buffer_time', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value={0}>No buffer</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Travel time between appointments</p>
              </div>

              {/* Max Advance Booking */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Book Ahead (Days)
                </label>
                <input
                  type="number"
                  value={settings.max_advance_booking || 60}
                  onChange={(e) => handleSettingChange('max_advance_booking', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  min="1"
                  max="365"
                />
                <p className="text-xs text-gray-500 mt-1">How far customers can book</p>
              </div>

              {/* Deposit Settings */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={settings.require_deposit || false}
                    onChange={(e) => handleSettingChange('require_deposit', e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                  <span className="font-semibold text-gray-900">Require Deposit</span>
                </div>

                {settings.require_deposit && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Deposit Percentage
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.deposit_percentage || 25}
                        onChange={(e) => handleSettingChange('deposit_percentage', parseFloat(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        min="0"
                        max="100"
                      />
                      <span className="text-gray-600">%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto Confirm */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.auto_confirm !== false}
                    onChange={(e) => handleSettingChange('auto_confirm', e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                  <div>
                    <span className="font-semibold text-gray-900 block">Auto-Confirm Bookings</span>
                    <span className="text-xs text-gray-500">Instant confirmation without approval</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessHoursPage;
