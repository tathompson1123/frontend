import { useState, useEffect } from 'react';
import { Clock, Save } from 'lucide-react';

export default function BusinessHours({ businessHours, setBusinessHours, apiUrl, user, authFetch }) {
  const [hours, setHours] = useState({
    monday: { open: true, start: '09:00', end: '17:00' },
    tuesday: { open: true, start: '09:00', end: '17:00' },
    wednesday: { open: true, start: '09:00', end: '17:00' },
    thursday: { open: true, start: '09:00', end: '17:00' },
    friday: { open: true, start: '09:00', end: '17:00' },
    saturday: { open: false, start: '09:00', end: '17:00' },
    sunday: { open: false, start: '09:00', end: '17:00' }
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (businessHours && businessHours.length > 0) {
      const hoursObj = {};

      businessHours.forEach(day => {
        // Handle both day_name (string) and day_of_week (number) formats
        const dayName = day.day_name || ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day.day_of_week];
        if (dayName) {
          hoursObj[dayName] = {
            open: day.is_open,
            start: day.open_time || '09:00',
            end: day.close_time || '17:00'
          };
        }
      });
      setHours(prev => ({ ...prev, ...hoursObj }));
    }
  }, [businessHours]);

  const handleSaveHours = async () => {
    setIsSaving(true);
    try {
      // Convert hours object to array format that server expects
      const hoursArray = Object.entries(hours).map(([dayName, dayData]) => ({
        day_name: dayName,
        is_open: dayData.open,
        open_time: dayData.open ? dayData.start : null,
        close_time: dayData.open ? dayData.end : null
      }));

      console.log('Sending hours data:', hoursArray);

      const response = await authFetch(`${apiUrl}/api/business-hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: hoursArray })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save hours');
      }
      
      const data = await response.json();
      alert('Business hours saved successfully!');
      
      // Optionally refetch business hours to update the component
      // setBusinessHours(data.hours);
    } catch (error) {
      console.error('Error saving hours:', error);
      alert('Failed to save business hours: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Hours</h2>
          <p className="text-gray-600 mt-1">Set your weekly availability</p>
        </div>
        <button
          type="button"
          onClick={handleSaveHours}
          disabled={isSaving}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save Hours'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {days.map((day) => (
          <div key={day} className="border-b border-gray-200 last:border-b-0">
            <div className="p-6 flex items-center gap-6">
              <div className="w-32">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hours[day].open}
                    onChange={(e) => setHours({
                      ...hours,
                      [day]: { ...hours[day], open: e.target.checked }
                    })}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-semibold text-gray-900">{dayLabels[day]}</span>
                </label>
              </div>

              {hours[day].open ? (
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={hours[day].start}
                      onChange={(e) => setHours({
                        ...hours,
                        [day]: { ...hours[day], start: e.target.value }
                      })}
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <span className="text-gray-500 font-medium">to</span>

                  <input
                    type="time"
                    value={hours[day].end}
                    onChange={(e) => setHours({
                      ...hours,
                      [day]: { ...hours[day], end: e.target.value }
                    })}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <span className="text-gray-500 italic">Closed</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="flex gap-3">
          <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Tips for Setting Business Hours</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• These hours will be displayed on your website and booking page</li>
              <li>• Customers can only book appointments during your open hours</li>
              <li>• You can always adjust these hours as your business needs change</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
