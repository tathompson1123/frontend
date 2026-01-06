import { useState, useEffect } from 'react';
import { Clock, Save, Phone, Mail, MapPin, Navigation, Plus, X } from 'lucide-react';

export default function BusinessInformation({ businessHours, setBusinessHours, apiUrl, user }) {
  const [hours, setHours] = useState({
    monday: { open: true, start: '09:00', end: '17:00' },
    tuesday: { open: true, start: '09:00', end: '17:00' },
    wednesday: { open: true, start: '09:00', end: '17:00' },
    thursday: { open: true, start: '09:00', end: '17:00' },
    friday: { open: true, start: '09:00', end: '17:00' },
    saturday: { open: false, start: '09:00', end: '17:00' },
    sunday: { open: false, start: '09:00', end: '17:00' }
  });

  const [businessInfo, setBusinessInfo] = useState({
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    serviceAreaType: 'zipcodes', // 'zipcodes' or 'radius'
    serviceZipCodes: [],
    serviceRadius: 25,
    centerZipCode: ''
  });

  const [newZipCode, setNewZipCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 47.6062, lng: -122.3321 }); // Default to Seattle
  const [isLoadingMap, setIsLoadingMap] = useState(false);

  // Load existing data
  useEffect(() => {
    fetchBusinessInfo();
    
    if (businessHours && businessHours.length > 0) {
      const hoursObj = {};
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      businessHours.forEach(day => {
        const dayName = dayNames[day.day_of_week];
        hoursObj[dayName] = {
          open: day.is_open,
          start: day.open_time || '09:00',
          end: day.close_time || '17:00'
        };
      });
      setHours(hoursObj);
    }
  }, [businessHours]);

  // Update map when center zip code changes
  useEffect(() => {
    if (businessInfo.serviceAreaType === 'radius' && businessInfo.centerZipCode && businessInfo.centerZipCode.length === 5) {
      geocodeZipCode(businessInfo.centerZipCode);
    }
  }, [businessInfo.centerZipCode, businessInfo.serviceAreaType]);

  const geocodeZipCode = async (zipCode) => {
    setIsLoadingMap(true);
    try {
      // Using Nominatim (OpenStreetMap) geocoding API - free and no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=US&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'BusinessManagementApp/1.0' // Required by Nominatim
          }
        }
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        setMapCenter({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        });
      }
    } catch (error) {
      console.error('Error geocoding zip code:', error);
    } finally {
      setIsLoadingMap(false);
    }
  };

  const fetchBusinessInfo = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/business-info?userId=${user.id}`);
      const data = await response.json();
      
      if (data.businessInfo) {
        const info = {
          phone: data.businessInfo.phone || '',
          email: data.businessInfo.email || '',
          address: data.businessInfo.address || '',
          city: data.businessInfo.city || '',
          state: data.businessInfo.state || '',
          zipCode: data.businessInfo.zip_code || '',
          serviceAreaType: data.businessInfo.service_area_type || 'zipcodes',
          serviceZipCodes: data.businessInfo.service_zip_codes || [],
          serviceRadius: data.businessInfo.service_radius || 25,
          centerZipCode: data.businessInfo.center_zip_code || ''
        };
        setBusinessInfo(info);
        
        // Initialize map with center zip code if radius mode
        if (info.serviceAreaType === 'radius' && info.centerZipCode) {
          geocodeZipCode(info.centerZipCode);
        }
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Save business hours
      const dayMapping = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
      };

      const hoursArray = Object.entries(hours).map(([dayName, dayData]) => ({
        day_of_week: dayMapping[dayName],
        is_open: dayData.open,
        open_time: dayData.open ? dayData.start : null,
        close_time: dayData.open ? dayData.end : null
      }));

      const hoursResponse = await fetch(`${apiUrl}/api/business-hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          hours: hoursArray
        })
      });

      if (!hoursResponse.ok) throw new Error('Failed to save hours');

      // Save business information
      const infoResponse = await fetch(`${apiUrl}/api/business-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          phone: businessInfo.phone,
          email: businessInfo.email,
          address: businessInfo.address,
          city: businessInfo.city,
          state: businessInfo.state,
          zipCode: businessInfo.zipCode,
          serviceAreaType: businessInfo.serviceAreaType,
          serviceZipCodes: businessInfo.serviceZipCodes,
          serviceRadius: businessInfo.serviceRadius,
          centerZipCode: businessInfo.centerZipCode
        })
      });

      if (!infoResponse.ok) throw new Error('Failed to save business information');
      
      alert('Business information saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save business information: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addZipCode = () => {
    const zipCode = newZipCode.trim();
    if (zipCode && zipCode.length === 5 && !isNaN(zipCode)) {
      if (!businessInfo.serviceZipCodes.includes(zipCode)) {
        setBusinessInfo({
          ...businessInfo,
          serviceZipCodes: [...businessInfo.serviceZipCodes, zipCode]
        });
        setNewZipCode('');
      } else {
        alert('This zip code is already added');
      }
    } else {
      alert('Please enter a valid 5-digit zip code');
    }
  };

  const removeZipCode = (zipCode) => {
    setBusinessInfo({
      ...businessInfo,
      serviceZipCodes: businessInfo.serviceZipCodes.filter(z => z !== zipCode)
    });
  };

  // Calculate radius in pixels for map display
  // Approximate: 1 degree latitude ≈ 69 miles
  const getRadiusPixels = () => {
    const milesPerDegree = 69;
    const radiusDegrees = businessInfo.serviceRadius / milesPerDegree;
    // Map is 400px wide, showing roughly 1 degree of lat/lng
    const pixelsPerDegree = 200;
    return radiusDegrees * pixelsPerDegree;
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
          <h2 className="text-2xl font-bold text-gray-900">Business Information</h2>
          <p className="text-gray-600 mt-1">Manage your business details, hours, and service areas</p>
        </div>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-600" />
          Contact Information
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Phone Number
            </label>
            <input
              type="tel"
              value={businessInfo.phone}
              onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Email
            </label>
            <input
              type="email"
              value={businessInfo.email}
              onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
              placeholder="contact@business.com"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          Business Location
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              value={businessInfo.address}
              onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
              placeholder="123 Main Street"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={businessInfo.city}
                onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                placeholder="Seattle"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={businessInfo.state}
                onChange={(e) => setBusinessInfo({ ...businessInfo, state: e.target.value })}
                placeholder="WA"
                maxLength="2"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zip Code
              </label>
              <input
                type="text"
                value={businessInfo.zipCode}
                onChange={(e) => setBusinessInfo({ ...businessInfo, zipCode: e.target.value })}
                placeholder="98001"
                maxLength="5"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Service Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-orange-600" />
          Service Area
        </h3>

        {/* Area Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How would you like to define your service area?
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="areaType"
                value="zipcodes"
                checked={businessInfo.serviceAreaType === 'zipcodes'}
                onChange={(e) => setBusinessInfo({ ...businessInfo, serviceAreaType: e.target.value })}
                className="w-4 h-4 text-purple-600"
              />
              <span className="font-medium">Specific Zip Codes</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="areaType"
                value="radius"
                checked={businessInfo.serviceAreaType === 'radius'}
                onChange={(e) => setBusinessInfo({ ...businessInfo, serviceAreaType: e.target.value })}
                className="w-4 h-4 text-purple-600"
              />
              <span className="font-medium">Radius from Location</span>
            </label>
          </div>
        </div>

        {/* Zip Codes Option */}
        {businessInfo.serviceAreaType === 'zipcodes' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Zip Codes
            </label>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newZipCode}
                onChange={(e) => setNewZipCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addZipCode()}
                placeholder="Enter zip code"
                maxLength="5"
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addZipCode}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {businessInfo.serviceZipCodes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {businessInfo.serviceZipCodes.map(zipCode => (
                  <div
                    key={zipCode}
                    className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium flex items-center gap-2"
                  >
                    {zipCode}
                    <button
                      onClick={() => removeZipCode(zipCode)}
                      className="hover:bg-purple-200 rounded-full p-1 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No zip codes added yet</p>
            )}
          </div>
        )}

        {/* Radius Option with Interactive Map */}
        {businessInfo.serviceAreaType === 'radius' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Center Zip Code
              </label>
              <input
                type="text"
                value={businessInfo.centerZipCode}
                onChange={(e) => setBusinessInfo({ ...businessInfo, centerZipCode: e.target.value })}
                placeholder="98001"
                maxLength="5"
                className="w-full md:w-64 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
              <p className="text-sm text-gray-500 mt-1">Usually your business zip code</p>
            </div>

            {/* Interactive Map with Radius Circle */}
            <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-200">
              <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
                {isLoadingMap && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
                
                {/* OpenStreetMap iframe */}
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng - 0.5},${mapCenter.lat - 0.3},${mapCenter.lng + 0.5},${mapCenter.lat + 0.3}&layer=mapnik&marker=${mapCenter.lat},${mapCenter.lng}`}
                  className="w-full h-full border-0"
                  title="Service Area Map"
                />
                
                {/* Radius circle overlay */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 5 }}
                >
                  <circle
                    cx="50%"
                    cy="50%"
                    r={getRadiusPixels()}
                    fill="rgba(147, 51, 234, 0.2)"
                    stroke="rgba(147, 51, 234, 0.8)"
                    strokeWidth="3"
                    strokeDasharray="10,5"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="8"
                    fill="#9333ea"
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              
              <div className="mt-2 text-center text-sm text-gray-600">
                <p>Purple circle shows your {businessInfo.serviceRadius}-mile service radius</p>
                {businessInfo.centerZipCode && (
                  <p className="text-xs mt-1">Centered at zip code: {businessInfo.centerZipCode}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Radius: <span className="text-purple-600 font-bold">{businessInfo.serviceRadius} miles</span>
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={businessInfo.serviceRadius}
                onChange={(e) => setBusinessInfo({ ...businessInfo, serviceRadius: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5 miles</span>
                <span>100 miles</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>Service Area:</strong> {businessInfo.serviceRadius} mile radius from {businessInfo.centerZipCode || 'your location'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Business Hours */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Business Hours
        </h3>
        
        {days.map((day) => (
          <div key={day} className="border-b border-gray-200 last:border-b-0 py-4">
            <div className="flex items-center gap-6">
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
                  <input
                    type="time"
                    value={hours[day].start}
                    onChange={(e) => setHours({
                      ...hours,
                      [day]: { ...hours[day], start: e.target.value }
                    })}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />

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

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="flex gap-3">
          <div className="flex-shrink-0">💡</div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Tips for Business Information</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Contact info appears on your website and booking page</li>
              <li>• Service area determines where customers can book from</li>
              <li>• The map shows your service radius in real-time</li>
              <li>• Business hours control when customers can schedule appointments</li>
              <li>• Keep your information up to date for best customer experience</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Save business hours
      const dayMapping = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
      };

      const hoursArray = Object.entries(hours).map(([dayName, dayData]) => ({
        day_of_week: dayMapping[dayName],
        is_open: dayData.open,
        open_time: dayData.open ? dayData.start : null,
        close_time: dayData.open ? dayData.end : null
      }));

      const hoursResponse = await fetch(`${apiUrl}/api/business-hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          hours: hoursArray
        })
      });

      if (!hoursResponse.ok) throw new Error('Failed to save hours');

      // Save business information
      const infoResponse = await fetch(`${apiUrl}/api/business-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          phone: businessInfo.phone,
          email: businessInfo.email,
          address: businessInfo.address,
          city: businessInfo.city,
          state: businessInfo.state,
          zipCode: businessInfo.zipCode,
          serviceAreaType: businessInfo.serviceAreaType,
          serviceZipCodes: businessInfo.serviceZipCodes,
          serviceRadius: businessInfo.serviceRadius,
          centerZipCode: businessInfo.centerZipCode
        })
      });

      if (!infoResponse.ok) throw new Error('Failed to save business information');
      
      alert('Business information saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save business information: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addZipCode = () => {
    const zipCode = newZipCode.trim();
    if (zipCode && zipCode.length === 5 && !isNaN(zipCode)) {
      if (!businessInfo.serviceZipCodes.includes(zipCode)) {
        setBusinessInfo({
          ...businessInfo,
          serviceZipCodes: [...businessInfo.serviceZipCodes, zipCode]
        });
        setNewZipCode('');
      } else {
        alert('This zip code is already added');
      }
    } else {
      alert('Please enter a valid 5-digit zip code');
    }
  };

  const removeZipCode = (zipCode) => {
    setBusinessInfo({
      ...businessInfo,
      serviceZipCodes: businessInfo.serviceZipCodes.filter(z => z !== zipCode)
    });
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
          <h2 className="text-2xl font-bold text-gray-900">Business Information</h2>
          <p className="text-gray-600 mt-1">Manage your business details, hours, and service areas</p>
        </div>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-600" />
          Contact Information
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Phone Number
            </label>
            <input
              type="tel"
              value={businessInfo.phone}
              onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Email
            </label>
            <input
              type="email"
              value={businessInfo.email}
              onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
              placeholder="contact@business.com"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          Business Location
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              value={businessInfo.address}
              onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
              placeholder="123 Main Street"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={businessInfo.city}
                onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                placeholder="Seattle"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={businessInfo.state}
                onChange={(e) => setBusinessInfo({ ...businessInfo, state: e.target.value })}
                placeholder="WA"
                maxLength="2"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zip Code
              </label>
              <input
                type="text"
                value={businessInfo.zipCode}
                onChange={(e) => setBusinessInfo({ ...businessInfo, zipCode: e.target.value })}
                placeholder="98001"
                maxLength="5"
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Service Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-orange-600" />
          Service Area
        </h3>

        {/* Area Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How would you like to define your service area?
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="areaType"
                value="zipcodes"
                checked={businessInfo.serviceAreaType === 'zipcodes'}
                onChange={(e) => setBusinessInfo({ ...businessInfo, serviceAreaType: e.target.value })}
                className="w-4 h-4 text-purple-600"
              />
              <span className="font-medium">Specific Zip Codes</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="areaType"
                value="radius"
                checked={businessInfo.serviceAreaType === 'radius'}
                onChange={(e) => setBusinessInfo({ ...businessInfo, serviceAreaType: e.target.value })}
                className="w-4 h-4 text-purple-600"
              />
              <span className="font-medium">Radius from Location</span>
            </label>
          </div>
        </div>

        {/* Zip Codes Option */}
        {businessInfo.serviceAreaType === 'zipcodes' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Zip Codes
            </label>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newZipCode}
                onChange={(e) => setNewZipCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addZipCode()}
                placeholder="Enter zip code"
                maxLength="5"
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addZipCode}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {businessInfo.serviceZipCodes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {businessInfo.serviceZipCodes.map(zipCode => (
                  <div
                    key={zipCode}
                    className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium flex items-center gap-2"
                  >
                    {zipCode}
                    <button
                      onClick={() => removeZipCode(zipCode)}
                      className="hover:bg-purple-200 rounded-full p-1 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No zip codes added yet</p>
            )}
          </div>
        )}

        {/* Radius Option */}
        {businessInfo.serviceAreaType === 'radius' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Center Zip Code
              </label>
              <input
                type="text"
                value={businessInfo.centerZipCode}
                onChange={(e) => setBusinessInfo({ ...businessInfo, centerZipCode: e.target.value })}
                placeholder="98001"
                maxLength="5"
                className="w-full md:w-64 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              />
              <p className="text-sm text-gray-500 mt-1">Usually your business zip code</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Radius: <span className="text-purple-600 font-bold">{businessInfo.serviceRadius} miles</span>
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={businessInfo.serviceRadius}
                onChange={(e) => setBusinessInfo({ ...businessInfo, serviceRadius: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5 miles</span>
                <span>100 miles</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>Service Area:</strong> {businessInfo.serviceRadius} mile radius from {businessInfo.centerZipCode || 'your location'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Business Hours */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Business Hours
        </h3>
        
        {days.map((day) => (
          <div key={day} className="border-b border-gray-200 last:border-b-0 py-4">
            <div className="flex items-center gap-6">
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
                  <input
                    type="time"
                    value={hours[day].start}
                    onChange={(e) => setHours({
                      ...hours,
                      [day]: { ...hours[day], start: e.target.value }
                    })}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />

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

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="flex gap-3">
          <div className="flex-shrink-0">💡</div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Tips for Business Information</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Contact info appears on your website and booking page</li>
              <li>• Service area determines where customers can book from</li>
              <li>• Business hours control when customers can schedule appointments</li>
              <li>• Keep your information up to date for best customer experience</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
