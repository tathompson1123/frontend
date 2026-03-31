import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Users, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';

export default function PublicBooking({ businessId, apiUrl }) {
  const [step, setStep] = useState(1); // 1: Service, 2: Date/Time, 3: Team, 4: Contact Info
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [groups, setGroups] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);
  const [businessInfo, setBusinessInfo] = useState(null);
  
  const [selectedService, setSelectedService] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [additionalServices, setAdditionalServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [assignmentType, setAssignmentType] = useState('any'); // 'any', 'employee', 'group'
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [bookingNumber, setBookingNumber] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchBusinessData();
  }, [businessId]);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      
      // Fetch services
      const servicesRes = await fetch(`${apiUrl}/api/public/services?businessId=${businessId}`);
      const servicesData = await servicesRes.json();
      setServices(servicesData.services || []);

      // Fetch employees
      const employeesRes = await fetch(`${apiUrl}/api/public/employees?businessId=${businessId}`);
      const employeesData = await employeesRes.json();
      setEmployees(employeesData.employees || []);

      // Fetch groups
      const groupsRes = await fetch(`${apiUrl}/api/public/groups?businessId=${businessId}`);
      const groupsData = await groupsRes.json();
      setGroups(groupsData.groups || []);

      // Fetch business hours
      const hoursRes = await fetch(`${apiUrl}/api/public/business-hours?businessId=${businessId}`);
      const hoursData = await hoursRes.json();
      setBusinessHours(hoursData.businessHours || []);

      // Fetch business info
      const infoRes = await fetch(`${apiUrl}/api/public/business-info?businessId=${businessId}`);
      const infoData = await infoRes.json();
      setBusinessInfo(infoData.business || null);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching business data:', error);
      setError('Failed to load booking information. Please try again.');
      setLoading(false);
    }
  };

  // Fetch available time slots when date or service changes
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedService, selectedVariant, additionalServices]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const allServiceIds = [selectedService.id, ...additionalServices].join(',');
      const variantParam = selectedVariant ? `&variantId=${selectedVariant.id}` : '';

      const response = await fetch(
        `${apiUrl}/api/public/availability?businessId=${businessId}&serviceIds=${allServiceIds}&date=${selectedDate}${variantParam}`
      );
      
      const data = await response.json();
      setAvailableSlots(data.slots || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setError('Failed to load available times.');
      setLoading(false);
    }
  };

  const calculateTotalDuration = () => {
    if (!selectedService) return 0;
    const baseDuration = selectedVariant && selectedVariant.duration_hours
      ? parseFloat(selectedVariant.duration_hours)
      : parseFloat(selectedService.duration_hours) || 0;
    let total = baseDuration;
    additionalServices.forEach(serviceId => {
      const service = services.find(s => s.id == serviceId);
      if (service) total += parseFloat(service.duration_hours) || 0;
    });
    return total;
  };

  const calculateTotalPrice = () => {
    if (!selectedService) return 0;
    const basePrice = selectedVariant
      ? parseFloat(selectedVariant.price)
      : parseFloat(selectedService.price) || 0;
    let total = basePrice;
    additionalServices.forEach(serviceId => {
      const service = services.find(s => s.id == serviceId);
      if (service) total += parseFloat(service.price) || 0;
    });
    return total;
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setSelectedVariant(null);
    setAdditionalServices([]);
    // If service has variants, go to variant selection step (step 1.5 = step 2)
    // Otherwise skip to date/time (step 3)
    if (service.variants && service.variants.length > 0) {
      setStep(2);
    } else {
      setStep(3);
    }
  };

  const toggleAdditionalService = (serviceId) => {
    if (additionalServices.includes(serviceId)) {
      setAdditionalServices(additionalServices.filter(id => id !== serviceId));
    } else {
      setAdditionalServices([...additionalServices, serviceId]);
    }
  };

  const handleSubmitBooking = async () => {
    // Validate customer info
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bookingData = {
        businessId,
        serviceId: selectedService.id,
        variantId: selectedVariant ? selectedVariant.id : null,
        additionalServiceIds: additionalServices,
        bookingDate: selectedDate,
        startTime: selectedTime,
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: customerInfo.address
        },
        customerNotes: customerInfo.notes,
        assignmentType,
        employeeId: assignmentType === 'employee' ? selectedEmployee : null,
        groupId: assignmentType === 'group' ? selectedGroup : null
      };

      const response = await fetch(`${apiUrl}/api/public/bookings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setBookingNumber(data.bookingNumber);
        setLoading(false);
      } else {
        setError(data.error || 'Failed to create booking');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('Failed to submit booking. Please try again.');
      setLoading(false);
    }
  };

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      
      // Check if business is open on this day
      const hoursForDay = businessHours.find(h => h.day_of_week === dayOfWeek);
      if (hoursForDay && hoursForDay.is_open) {
        dates.push(date);
      }
    }
    
    return dates;
  };

  // Success Screen
  if (success) {
    const formatTime12 = (t) => {
      if (!t) return '';
      const [h, m] = t.split(':').map(Number);
      const p = h >= 12 ? 'PM' : 'AM';
      return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${p}`;
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-10 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-1">You're All Set!</h2>
            <p className="text-green-100">Your booking has been confirmed</p>
          </div>

          <div className="px-8 py-8">
            {/* Booking Number */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6 text-center border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Booking Number</p>
              <p className="text-2xl font-bold text-gray-900 tracking-wide">{bookingNumber}</p>
            </div>

            {/* Booking Details */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date & Time</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    {' at '}{formatTime12(selectedTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Service</p>
                  <p className="font-semibold text-gray-900">{selectedService?.name}</p>
                </div>
                <p className="text-lg font-bold text-green-600">${calculateTotalPrice().toFixed(2)}</p>
              </div>
            </div>

            {/* Confirmation message */}
            <p className="text-sm text-gray-500 text-center mb-6">
              A confirmation has been sent to <span className="font-semibold text-gray-700">{customerInfo.email}</span>
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              {businessInfo?.website_url && (
                <a
                  href={businessInfo.website_url}
                  className="w-full bg-gradient-to-r from-blue-600 to-amber-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Browse Our Website
                </a>
              )}
              <button
                onClick={() => window.location.reload()}
                className={`w-full px-6 py-3.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                  businessInfo?.website_url
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gradient-to-r from-blue-600 to-amber-600 text-white hover:shadow-lg'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Book Another Service
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !services.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading booking information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {businessInfo?.business_name || 'Book Online'}
          </h1>
          <p className="text-gray-600 text-lg">
            Choose your service and pick a convenient time
          </p>
        </div>

        {/* Progress Steps */}
        {(() => {
          const hasVariants = selectedService?.variants?.length > 0;
          const stepLabels = hasVariants
            ? ['Service', 'Type', 'Date & Time', 'Team', 'Contact']
            : ['Service', 'Date & Time', 'Team', 'Contact'];
          // Map display step numbers to actual step state values
          const stepValues = hasVariants ? [1, 2, 3, 4, 5] : [1, 3, 4, 5];
          return (
            <div className="flex items-center justify-center mb-12 flex-wrap gap-y-2">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center">
                  <div className={`flex items-center ${step >= stepValues[i] ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${step >= stepValues[i] ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                      {i + 1}
                    </div>
                    <span className="ml-2 font-semibold hidden sm:inline text-sm">{label}</span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`w-12 h-1 mx-2 ${step > stepValues[i] ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Your Service</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {services.filter(s => !s.is_addon).map(service => (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-blue-600 hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <div className="flex items-center justify-between">
                    {service.variants && service.variants.length > 0 ? (
                      <div>
                        <span className="text-2xl font-bold text-blue-600">
                          from ${Math.min(...service.variants.map(v => parseFloat(v.price))).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">· {service.variants.length} options</span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-blue-600">${parseFloat(service.price).toFixed(2)}</span>
                    )}
                    <span className="text-gray-500">{service.duration_hours}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Variant / Service Type Selection (only when service has variants) */}
        {step === 2 && selectedService?.variants?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button onClick={() => { setStep(1); setSelectedService(null); setSelectedVariant(null); }} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Services
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedService.name}</h2>
            <p className="text-gray-600 mb-6">Choose your option to continue</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {selectedService.variants.map(variant => (
                <button
                  key={variant.id}
                  onClick={() => { setSelectedVariant(variant); setStep(3); }}
                  className="border-2 border-gray-200 rounded-xl p-5 text-left hover:border-blue-600 hover:shadow-lg transition"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{variant.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-2xl font-bold text-blue-600">${parseFloat(variant.price).toFixed(2)}</span>
                    {variant.duration_hours && <span className="text-gray-500 text-sm">{variant.duration_hours}h</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Date, Time & Add-ons */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button
              onClick={() => selectedService?.variants?.length > 0 ? setStep(2) : setStep(1)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {selectedService?.variants?.length > 0 ? 'Back to Service Type' : 'Back to Services'}
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Date & Time</h2>

            {/* Selected Service Summary */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900">{selectedService?.name}{selectedVariant ? ` — ${selectedVariant.name}` : ''}</h3>
                  <p className="text-sm text-gray-600">
                    {calculateTotalDuration().toFixed(1)}h · ${calculateTotalPrice().toFixed(2)}
                  </p>
                </div>
                <button onClick={() => { setSelectedService(null); setSelectedVariant(null); setStep(1); }} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                  Change
                </button>
              </div>
            </div>

            {/* Add-ons */}
            {services.filter(s => s.is_addon && s.id !== selectedService?.id).length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Add-ons (Optional)</h3>
                <div className="space-y-2">
                  {services
                    .filter(s => s.is_addon && s.id !== selectedService?.id)
                    .map(service => (
                      <label key={service.id} className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition">
                        <input
                          type="checkbox"
                          checked={additionalServices.includes(service.id)}
                          onChange={() => toggleAdditionalService(service.id)}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                        <div className="ml-4 flex-1">
                          <span className="font-semibold text-gray-900">{service.name}</span>
                          <span className="text-gray-500 ml-2">+${parseFloat(service.price).toFixed(2)}</span>
                        </div>
                        <span className="text-gray-500">{service.duration_hours}h</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {/* Total Summary */}
            {additionalServices.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total:</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">${calculateTotalPrice().toFixed(2)}</div>
                    <div className="text-sm text-gray-600">{calculateTotalDuration().toFixed(1)} hours</div>
                  </div>
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div className="mb-6">
              <label className="block font-bold text-gray-900 mb-3">Select Date</label>
              <select
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime(''); // Reset time when date changes
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none"
                required
              >
                <option value="">Choose a date...</option>
                {getAvailableDates().map(date => {
                  const dateStr = date.toISOString().split('T')[0];
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                  const dateDisplay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                  
                  return (
                    <option key={dateStr} value={dateStr}>
                      {dayName}, {dateDisplay}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div className="mb-6">
                <label className="block font-bold text-gray-900 mb-3">
                  Select Time
                  {loading && <span className="text-sm text-gray-500 ml-2">(Loading...)</span>}
                </label>
                
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {availableSlots.map(slot => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`px-4 py-3 rounded-lg font-semibold transition ${
                          selectedTime === slot.time
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        {slot.displayTime}
                      </button>
                    ))}
                  </div>
                ) : loading ? (
                  <p className="text-gray-500">Loading available times...</p>
                ) : (
                  <p className="text-gray-500">No available times for this date. Please choose another date.</p>
                )}
              </div>
            )}

            {selectedDate && selectedTime && (
              <button
                onClick={() => setStep(4)}
                className="w-full bg-gradient-to-r from-blue-600 to-amber-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:shadow-lg transition flex items-center justify-center"
              >
                Continue to Team Selection
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        )}

        {/* Step 4: Team Selection */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button
              onClick={() => setStep(3)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Date & Time
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Team Member or Group</h2>

            {/* No Preference Option */}
            <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition mb-4">
              <input
                type="radio"
                name="assignment"
                checked={assignmentType === 'any'}
                onChange={() => {
                  setAssignmentType('any');
                  setSelectedEmployee('');
                  setSelectedGroup('');
                }}
                className="w-5 h-5 text-blue-600"
              />
              <div className="ml-4">
                <span className="font-semibold text-gray-900">No Preference</span>
                <p className="text-sm text-gray-600">We'll assign the best available team member</p>
              </div>
            </label>

            {/* Employee Selection */}
            {employees.length > 0 && (
              <div className="mb-4">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition mb-2">
                  <input
                    type="radio"
                    name="assignment"
                    checked={assignmentType === 'employee'}
                    onChange={() => {
                      setAssignmentType('employee');
                      setSelectedGroup('');
                    }}
                    className="w-5 h-5 text-blue-600"
                  />
                  <User className="w-5 h-5 ml-4 text-gray-600" />
                  <span className="ml-3 font-semibold text-gray-900">Specific Team Member</span>
                </label>

                {assignmentType === 'employee' && (
                  <div className="ml-12 space-y-2">
                    {employees.map(emp => (
                      <label
                        key={emp.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="employee"
                          checked={selectedEmployee == emp.id}
                          onChange={() => setSelectedEmployee(emp.id)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ml-3"
                          style={{ backgroundColor: emp.color || '#3b82f6' }}
                        >
                          {emp.name.charAt(0)}
                        </div>
                        <span className="ml-3 font-medium text-gray-900">{emp.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Group Selection */}
            {groups.length > 0 && (
              <div className="mb-4">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition mb-2">
                  <input
                    type="radio"
                    name="assignment"
                    checked={assignmentType === 'group'}
                    onChange={() => {
                      setAssignmentType('group');
                      setSelectedEmployee('');
                    }}
                    className="w-5 h-5 text-blue-600"
                  />
                  <Users className="w-5 h-5 ml-4 text-gray-600" />
                  <span className="ml-3 font-semibold text-gray-900">Specific Group</span>
                </label>

                {assignmentType === 'group' && (
                  <div className="ml-12 space-y-2">
                    {groups.map(group => (
                      <label
                        key={group.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="group"
                          checked={selectedGroup == group.id}
                          onChange={() => setSelectedGroup(group.id)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <Users className="w-5 h-5 ml-3 text-amber-600" />
                        <span className="ml-3 font-medium text-gray-900">{group.name}</span>
                        <span className="ml-2 text-sm text-gray-500">({group.employee_ids?.length || 0} members)</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setStep(5)}
              disabled={assignmentType === 'employee' && !selectedEmployee || assignmentType === 'group' && !selectedGroup}
              className="w-full bg-gradient-to-r from-blue-600 to-amber-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Continue to Contact Info
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}

        {/* Step 5: Contact Information */}
        {step === 5 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button
              onClick={() => setStep(4)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Team Selection
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Contact Information</h2>

            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-semibold">{selectedService?.name}{selectedVariant ? ` — ${selectedVariant.name}` : ''}</span>
                </div>
                {additionalServices.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Additional:</span>
                    <span className="font-semibold">{additionalServices.length} service(s)</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-semibold">{new Date(selectedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-semibold">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{calculateTotalDuration().toFixed(1)} hours</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-900 font-bold">Total:</span>
                  <span className="text-green-600 font-bold text-lg">${calculateTotalPrice().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block font-semibold text-gray-900 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-2">
                  Service Address (Optional)
                </label>
                <input
                  type="text"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none"
                  placeholder="123 Main St, City, State"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-900 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none"
                  rows={3}
                  placeholder="Any special requests or information we should know..."
                />
              </div>
            </div>

            <button
              onClick={handleSubmitBooking}
              disabled={loading || !customerInfo.name || !customerInfo.email || !customerInfo.phone}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Confirming Booking...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirm Booking
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              By confirming, you agree to receive booking confirmations via email and SMS
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
