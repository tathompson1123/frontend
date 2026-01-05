import { useState, useEffect, useRef } from 'react';
import {
  User,
  Phone,
  FileText,
  Edit2,
  Save,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  Clock,
  Plus,
  X,
  Mail,
  MapPin,
  Users,
  Briefcase,
  ChevronDown
} from 'lucide-react';

export default function BookingCalendar({ apiUrl, user, services, employees }) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [calendarView, setCalendarView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allBookings, setAllBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);
  
  const [showCreateBookingModal, setShowCreateBookingModal] = useState(false);
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [serviceTab, setServiceTab] = useState('main'); // 'main' or 'additional'
  const [newBooking, setNewBooking] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    serviceId: '',
    additionalServices: [], // Array of additional service IDs
    employeeId: '',
    bookingDate: '',
    startTime: '',
    notes: ''
  });
  const [creatingBooking, setCreatingBooking] = useState(false);

  useEffect(() => {
    fetchAllBookings();
  }, []);

  // Scroll to business start time on mount
  useEffect(() => {
    const scrollToBusinessHours = async () => {
      try {
        // Fetch business hours to get start time
        const response = await fetch(`${apiUrl}/api/business-hours?userId=${user.id}`);
        const data = await response.json();
        
        // Get today's day of week (0 = Sunday, 6 = Saturday)
        const today = new Date().getDay();
        const todayHours = data.businessHours?.find(h => h.day_of_week === today);
        
        let startHour = 9; // Default to 9am if no business hours found
        
        if (todayHours && todayHours.is_open && todayHours.open_time) {
          // Parse the open time (format: "HH:MM")
          startHour = parseInt(todayHours.open_time.split(':')[0]);
        }
        
        const timeSlotContainer = document.querySelector('.time-slots-container');
        if (timeSlotContainer) {
          // Each hour is approximately 81px (80px + 1px border)
          timeSlotContainer.scrollTop = startHour * 81;
        }
      } catch (error) {
        console.error('Error fetching business hours for scroll:', error);
        // Fallback to 9am
        const timeSlotContainer = document.querySelector('.time-slots-container');
        if (timeSlotContainer) {
          timeSlotContainer.scrollTop = 9 * 81;
        }
      }
    };
    
    // Delay slightly to ensure DOM is ready
    setTimeout(scrollToBusinessHours, 100);
  }, []);

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllBookings = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/bookings?userId=${user.id}`);
      const data = await response.json();
      
      console.log('📅 Fetched bookings:', data.bookings?.length || 0);
      
      if (data.bookings) {
        const sorted = data.bookings.sort((a, b) => 
          new Date(b.booking_date) - new Date(a.booking_date)
        );
        console.log('📅 Sample booking:', sorted[0]);
        setAllBookings(sorted);
        setFilteredBookings(sorted);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedBooking) return;
    
    try {
      console.log('💾 Saving notes for booking:', selectedBooking.id);
      console.log('💾 User ID:', user.id);
      console.log('💾 Notes:', bookingNotes);
      
      const response = await fetch(`${apiUrl}/api/bookings/${selectedBooking.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          notes: bookingNotes
        })
      });
      
      console.log('💾 Response status:', response.status);
      
      const data = await response.json();
      console.log('💾 Save response:', data);
      
      if (response.ok && data.success) {
        setSelectedBooking({ ...selectedBooking, job_notes: bookingNotes });
        setAllBookings(allBookings.map(b => 
          b.id === selectedBooking.id ? { ...b, job_notes: bookingNotes } : b
        ));
        setFilteredBookings(filteredBookings.map(b => 
          b.id === selectedBooking.id ? { ...b, job_notes: bookingNotes } : b
        ));
        setEditingNotes(false);
        alert('✅ Notes saved successfully!');
      } else {
        console.error('Save failed:', data);
        console.error('Full response:', response);
        alert('Failed to save notes: ' + (data.error || data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes: ' + error.message);
    }
  };

  const handleCreateBooking = async () => {
    if (!newBooking.customerName || !newBooking.serviceId || !newBooking.bookingDate || !newBooking.startTime) {
      alert('Please fill in all required fields');
      return;
    }

    setCreatingBooking(true);

    try {
      if (isEditingBooking && editingBookingId) {
        // Update existing booking
        const response = await fetch(`${apiUrl}/api/bookings/${editingBookingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            serviceId: newBooking.serviceId,
            additionalServiceIds: newBooking.additionalServices,
            bookingDate: newBooking.bookingDate,
            startTime: newBooking.startTime,
            employeeId: newBooking.employeeId || null,
            customerInfo: {
              name: newBooking.customerName,
              email: newBooking.customerEmail,
              phone: newBooking.customerPhone,
              address: newBooking.customerAddress
            },
            notes: newBooking.notes
          })
        });

        const data = await response.json();

        if (data.success) {
          alert('✅ Booking updated successfully!');
          setNewBooking({
            customerId: '',
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            customerAddress: '',
            serviceId: '',
            employeeId: '',
            bookingDate: '',
            startTime: '',
            notes: ''
          });
          setShowCreateBookingModal(false);
          setIsEditingBooking(false);
          setEditingBookingId(null);
          fetchAllBookings();
        } else {
          alert(data.error || 'Failed to update booking');
        }
      } else {
        // Create new booking
        const response = await fetch(`${apiUrl}/api/bookings/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            serviceId: newBooking.serviceId,
            bookingDate: newBooking.bookingDate,
            startTime: newBooking.startTime,
            employeeId: newBooking.employeeId || null,
            customerInfo: {
              name: newBooking.customerName,
              email: newBooking.customerEmail,
              phone: newBooking.customerPhone,
              address: newBooking.customerAddress
            },
            customerNotes: newBooking.notes
          })
        });

        const data = await response.json();

        if (data.success) {
          alert('✅ Booking created successfully!');
          setNewBooking({
            customerId: '',
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            customerAddress: '',
            serviceId: '',
            employeeId: '',
            bookingDate: '',
            startTime: '',
            notes: ''
          });
          setShowCreateBookingModal(false);
          fetchAllBookings();
        } else {
          alert(data.error || 'Failed to create booking');
        }
      }
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Failed to save booking');
    } finally {
      setCreatingBooking(false);
    }
  };
  
  const handleSearchBookings = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredBookings(allBookings);
      return;
    }
    
    const filtered = allBookings.filter(booking => 
      booking.customer_name?.toLowerCase().includes(query.toLowerCase()) ||
      booking.customer_email?.toLowerCase().includes(query.toLowerCase()) ||
      booking.customer_phone?.includes(query) ||
      booking.service_name?.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredBookings(filtered);
  };

  // Mini calendar for date picker
  const MiniCalendar = () => {
    const [pickerDate, setPickerDate] = useState(new Date(currentDate));
    
    const getMonthDays = () => {
      const year = pickerDate.getFullYear();
      const month = pickerDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      const days = [];
      const currentDay = new Date(startDate);
      
      for (let i = 0; i < 42; i++) {
        days.push(new Date(currentDay));
        currentDay.setDate(currentDay.getDate() + 1);
      }
      
      return days;
    };
    
    const monthDays = getMonthDays();
    
    return (
      <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 w-80">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => {
              const newDate = new Date(pickerDate);
              newDate.setMonth(pickerDate.getMonth() - 1);
              setPickerDate(newDate);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="font-bold text-gray-900">
            {pickerDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button
            type="button"
            onClick={() => {
              const newDate = new Date(pickerDate);
              newDate.setMonth(pickerDate.getMonth() + 1);
              setPickerDate(newDate);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-600 py-1">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === pickerDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = day.toDateString() === currentDate.toDateString();
            
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentDate(new Date(day));
                  setShowDatePicker(false);
                }}
                className={`
                  p-2 text-sm rounded-lg transition
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                  ${isToday ? 'bg-blue-100 font-bold' : ''}
                  ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
                `}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex gap-6">
      {/* Left Sidebar - Previous Bookings */}
      <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-140px)]">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">All Bookings</h3>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchBookings(e.target.value)}
              placeholder="Search bookings..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No bookings found</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`w-full p-3 rounded-lg border transition-all ${
                    selectedBooking?.id === booking.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {booking.customer_name}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {booking.items?.[0]?.service_name || 'Service'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {new Date(booking.booking_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      {booking.start_time} - {booking.end_time}
                    </div>
                    {booking.employee_name && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <User className="w-3 h-3" />
                        {booking.employee_name}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setBookingNotes(booking.job_notes || '');
                        setShowBookingModal(true);
                        setEditingNotes(false);
                      }}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Populate the form with booking data for editing
                        setIsEditingBooking(true);
                        setEditingBookingId(booking.id);
                        setNewBooking({
                          customerId: booking.customer_id,
                          customerName: booking.customer_name,
                          customerEmail: booking.customer_email || '',
                          customerPhone: booking.customer_phone || '',
                          customerAddress: booking.customer_address || '',
                          serviceId: booking.items?.[0]?.service_id || '',
                          employeeId: booking.employee_id || '',
                          bookingDate: booking.booking_date,
                          startTime: booking.start_time,
                          notes: booking.job_notes || booking.customer_notes || ''
                        });
                        setShowCreateBookingModal(true);
                      }}
                      className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Calendar View */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-[calc(100vh-140px)]">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative" ref={datePickerRef}>
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 text-2xl font-bold text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition"
              >
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                <ChevronDown className="w-5 h-5" />
              </button>
              {showDatePicker && <MiniCalendar />}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setDate(currentDate.getDate() - 7);
                  setCurrentDate(newDate);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setDate(currentDate.getDate() + 7);
                  setCurrentDate(newDate);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Team Member Legend */}
          {employees && employees.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap px-2 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs font-medium text-gray-600">Team:</span>
              {employees.map(employee => (
                <div key={employee.id} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: employee.color || '#3b82f6' }}
                  />
                  <span className="text-xs text-gray-700">{employee.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCreateBookingModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Booking
            </button>
          </div>
        </div>

        {/* Week View Calendar */}
        {calendarView === 'week' && (
          <div className="border border-gray-200 rounded-lg flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto time-slots-container scroll-smooth">
              {/* Header Row */}
              <div className="grid grid-cols-8 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="bg-gray-50 p-3 text-sm font-medium text-gray-500 border-r border-gray-200">
                Time
              </div>
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const date = new Date(currentDate);
                date.setDate(currentDate.getDate() - currentDate.getDay() + offset);
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={offset}
                    className={`bg-gray-50 p-3 text-center ${
                      isToday ? 'bg-blue-50' : ''
                    } ${offset !== 6 ? 'border-r border-gray-200' : ''}`}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-bold ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

              {/* Time Slots */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((hour) => {
                console.log(`🕐 Rendering hour: ${hour}:00`);
                
                return (
                <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
                  <div className="bg-gray-50 p-3 text-sm text-gray-600 border-r border-gray-200">
                    {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
                  </div>
                  {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                    const date = new Date(currentDate);
                    date.setDate(currentDate.getDate() - currentDate.getDay() + offset);
                    const dateStr = date.toISOString().split('T')[0];
                    
                    console.log(`📅 Checking date: ${dateStr} for hour ${hour}`);
                    console.log(`📊 Total bookings in state: ${allBookings.length}`);
                    
                    const dayBookings = allBookings.filter(booking => {
                      // Extract just the date part from the booking date (removes time/timezone)
                      const bookingDateOnly = booking.booking_date.split('T')[0];
                      console.log(`  🔍 Booking date: ${booking.booking_date}, Extracted: ${bookingDateOnly}, Checking: ${dateStr}, Match: ${bookingDateOnly === dateStr}`);
                      if (bookingDateOnly !== dateStr) return false;
                      const startHour = parseInt(booking.start_time.split(':')[0]);
                      console.log(`  ⏰ Booking time: ${booking.start_time}, Hour: ${startHour}, Match: ${startHour === hour}`);
                      return startHour === hour;
                    });

                    // Debug: log if we find bookings for this slot
                    if (dayBookings.length > 0) {
                      console.log(`✅ Found ${dayBookings.length} booking(s) for ${dateStr} at ${hour}:00`, dayBookings);
                    }

                    return (
                      <div
                        key={offset}
                        className={`p-2 min-h-[80px] hover:bg-gray-50 transition relative ${offset !== 6 ? 'border-r border-gray-200' : ''}`}
                      >
                        {dayBookings.map((booking) => {
                          // Calculate the height based on booking duration
                          const [startHour, startMin] = booking.start_time.split(':').map(Number);
                          const [endHour, endMin] = booking.end_time.split(':').map(Number);
                          
                          const startMinutes = startHour * 60 + startMin;
                          const endMinutes = endHour * 60 + endMin;
                          const durationMinutes = endMinutes - startMinutes;
                          
                          // Each hour is 80px tall, so calculate proportional height
                          const heightPerMinute = 80 / 60; // 80px per hour / 60 minutes
                          const blockHeight = durationMinutes * heightPerMinute;
                          
                          // Calculate top offset for minutes past the hour
                          const topOffset = startMin * heightPerMinute;
                          
                          // Get employee color
                          const employee = employees?.find(emp => emp.id === booking.employee_id);
                          const employeeColor = employee?.color || '#3b82f6';
                          const employeeName = employee?.name || 'Unassigned';
                          
                          return (
                            <button
                              key={booking.id}
                              type="button"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setBookingNotes(booking.job_notes || '');
                                setShowBookingModal(true);
                                setEditingNotes(false);
                              }}
                              className="absolute left-2 right-2 rounded text-white text-xs cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all overflow-hidden shadow-md border-l-4 z-10"
                              style={{
                                top: `${topOffset}px`,
                                height: `${Math.max(blockHeight, 40)}px`, // Minimum 40px height
                                backgroundColor: employeeColor,
                                borderLeftColor: employeeColor,
                                filter: 'brightness(0.95)'
                              }}
                            >
                              <div className="p-2 h-full flex flex-col pointer-events-none">
                                <div className="font-semibold truncate">
                                  {booking.customer_name}
                                </div>
                                <div className="truncate opacity-90 text-[10px]">
                                  {booking.items?.[0]?.service_name}
                                </div>
                                <div className="flex items-center gap-1 mt-auto">
                                  <User className="w-3 h-3 opacity-75" />
                                  <span className="text-[10px] opacity-90 truncate">{employeeName}</span>
                                </div>
                                <div className="text-[10px] opacity-75">
                                  {booking.start_time} - {booking.end_time}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal - keeping exactly the same */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Booking #{selectedBooking.booking_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedBooking(null);
                  setEditingNotes(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full font-medium ${
                  selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  selectedBooking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-600" />
                  <h3 className="font-bold text-gray-900">Customer Information</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-gray-900 font-medium">{selectedBooking.customer_name}</p>
                  </div>
                  
                  {selectedBooking.customer_email && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <p className="text-gray-900">{selectedBooking.customer_email}</p>
                    </div>
                  )}
                  
                  {selectedBooking.customer_phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone
                      </label>
                      <p className="text-gray-900">{selectedBooking.customer_phone}</p>
                    </div>
                  )}
                  
                  {selectedBooking.customer_address && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Address
                      </label>
                      <p className="text-gray-900">{selectedBooking.customer_address}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-gray-900">Booking Details</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date</label>
                    <p className="text-gray-900 font-medium">
                      {new Date(selectedBooking.booking_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time
                    </label>
                    <p className="text-gray-900 font-medium">
                      {selectedBooking.start_time} - {selectedBooking.end_time}
                    </p>
                  </div>

                  {(selectedBooking.employee_name || selectedBooking.employee_id) && (() => {
                    const employee = employees?.find(emp => emp.id === selectedBooking.employee_id);
                    const employeeName = selectedBooking.employee_name || employee?.name || 'Assigned';
                    const employeeColor = employee?.color || '#3b82f6';
                    
                    return (
                      <div>
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Team Member
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: employeeColor }}
                          />
                          <p className="text-gray-900 font-medium">{employeeName}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-gray-900">Service Details</h3>
                </div>
                
                {selectedBooking.items && selectedBooking.items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedBooking.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{item.service_name}</p>
                          <p className="text-sm text-gray-600">
                            Duration: {item.duration} hour{item.duration !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <p className="font-bold text-gray-900">${parseFloat(item.price).toFixed(2)}</p>
                      </div>
                    ))}
                    
                    <div className="pt-3 border-t border-purple-200 flex justify-between items-center">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-gray-900">
                        ${parseFloat(selectedBooking.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">No service details available</p>
                )}
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-gray-900">Job Notes</h3>
                  </div>
                  
                  {!editingNotes ? (
                    <button
                      type="button"
                      onClick={() => setEditingNotes(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Notes
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveNotes}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBookingNotes(selectedBooking.job_notes || '');
                          setEditingNotes(false);
                        }}
                        className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                
                {editingNotes ? (
                  <textarea
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Add notes about this job..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 resize-none"
                  />
                ) : (
                  <div className="bg-white rounded-lg p-4 min-h-[100px]">
                    {selectedBooking.job_notes || bookingNotes ? (
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {selectedBooking.job_notes || bookingNotes}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">No notes added yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Booking Modal - keeping exactly the same */}
      {showCreateBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditingBooking ? 'Edit Booking' : 'Create New Booking'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {isEditingBooking ? 'Update booking details' : 'Add a new booking to the calendar'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateBookingModal(false);
                  setIsEditingBooking(false);
                  setEditingBookingId(null);
                  setServiceTab('main');
                  setNewBooking({
                    customerId: '',
                    customerName: '',
                    customerEmail: '',
                    customerPhone: '',
                    customerAddress: '',
                    serviceId: '',
                    additionalServices: [],
                    employeeId: '',
                    bookingDate: '',
                    startTime: '',
                    notes: ''
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Customer Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newBooking.customerName}
                      onChange={(e) => setNewBooking({ ...newBooking, customerName: e.target.value })}
                      placeholder="John Smith"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newBooking.customerEmail}
                      onChange={(e) => setNewBooking({ ...newBooking, customerEmail: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newBooking.customerPhone}
                      onChange={(e) => setNewBooking({ ...newBooking, customerPhone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address (optional)
                    </label>
                    <input
                      type="text"
                      value={newBooking.customerAddress}
                      onChange={(e) => setNewBooking({ ...newBooking, customerAddress: e.target.value })}
                      placeholder="123 Main St, City, ST 12345"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Services
                </h3>
                
                {/* Service Tabs */}
                <div className="flex gap-2 mb-4 border-b border-gray-300">
                  <button
                    type="button"
                    onClick={() => setServiceTab('main')}
                    className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                      serviceTab === 'main'
                        ? 'text-green-700 border-b-2 border-green-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Main Service
                    {newBooking.serviceId && (
                      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-600 rounded-full">
                        1
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceTab('additional')}
                    className={`px-4 py-2 font-medium text-sm transition-colors relative ${
                      serviceTab === 'additional'
                        ? 'text-green-700 border-b-2 border-green-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Additional Services
                    {newBooking.additionalServices.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-600 rounded-full">
                        {newBooking.additionalServices.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Main Service Tab Content */}
                {serviceTab === 'main' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Main Service <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newBooking.serviceId}
                      onChange={(e) => setNewBooking({ ...newBooking, serviceId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 mb-4"
                      required
                    >
                      <option value="">Select main service</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name} - ${service.price} ({service.duration_hours}h)
                        </option>
                      ))}
                    </select>

                    {newBooking.serviceId && (
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-green-700" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {services.find(s => s.id === newBooking.serviceId)?.name}
                            </h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>Duration: {services.find(s => s.id === newBooking.serviceId)?.duration_hours}h</div>
                              <div className="font-semibold text-green-700">
                                ${services.find(s => s.id === newBooking.serviceId)?.price}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Services Tab Content */}
                {serviceTab === 'additional' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Additional Services (Optional)
                    </label>
                    <div className="border border-gray-300 rounded-lg bg-white max-h-64 overflow-y-auto">
                      {services.filter(s => s.id !== newBooking.serviceId).length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          {newBooking.serviceId 
                            ? 'No other services available' 
                            : 'Please select a main service first'}
                        </div>
                      ) : (
                        services.filter(s => s.id !== newBooking.serviceId).map(service => (
                          <label
                            key={service.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={newBooking.additionalServices.includes(service.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewBooking({
                                    ...newBooking,
                                    additionalServices: [...newBooking.additionalServices, service.id]
                                  });
                                } else {
                                  setNewBooking({
                                    ...newBooking,
                                    additionalServices: newBooking.additionalServices.filter(id => id !== service.id)
                                  });
                                }
                              }}
                              className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{service.name}</div>
                              <div className="text-xs text-gray-600">
                                ${service.price} • {service.duration_hours}h
                              </div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>

                    {newBooking.additionalServices.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium text-gray-700 mb-1">
                          Selected ({newBooking.additionalServices.length}):
                        </div>
                        {newBooking.additionalServices.map(serviceId => {
                          const service = services.find(s => s.id === serviceId);
                          return (
                            <div key={serviceId} className="flex items-center justify-between bg-green-50 rounded-lg p-2">
                              <div>
                                <div className="font-medium text-sm text-gray-900">{service?.name}</div>
                                <div className="text-xs text-gray-600">
                                  ${service?.price} • {service?.duration_hours}h
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewBooking({
                                    ...newBooking,
                                    additionalServices: newBooking.additionalServices.filter(id => id !== serviceId)
                                  });
                                }}
                                className="text-red-600 hover:text-red-700 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Total Summary */}
                {newBooking.serviceId && (
                  <div className="mt-4 bg-green-100 rounded-lg p-3">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="font-medium text-gray-700">Total Services:</span>
                      <span className="font-bold text-gray-900">
                        {1 + newBooking.additionalServices.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="font-medium text-gray-700">Total Duration:</span>
                      <span className="font-bold text-gray-900">
                        {(() => {
                          const mainService = services.find(s => s.id === newBooking.serviceId);
                          const additionalDuration = newBooking.additionalServices.reduce((total, id) => {
                            const service = services.find(s => s.id === id);
                            return total + (service?.duration_hours || 0);
                          }, 0);
                          return ((mainService?.duration_hours || 0) + additionalDuration).toFixed(1);
                        })()}h
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-green-200">
                      <span className="font-bold text-gray-700">Total Price:</span>
                      <span className="font-bold text-green-700 text-lg">
                        ${(() => {
                          const mainService = services.find(s => s.id === newBooking.serviceId);
                          const additionalPrice = newBooking.additionalServices.reduce((total, id) => {
                            const service = services.find(s => s.id === id);
                            return total + (parseFloat(service?.price) || 0);
                          }, 0);
                          return ((parseFloat(mainService?.price) || 0) + additionalPrice).toFixed(2);
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  Schedule
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team Member (optional)
                    </label>
                    <select
                      value={newBooking.employeeId}
                      onChange={(e) => setNewBooking({ ...newBooking, employeeId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    >
                      <option value="">Auto-assign</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newBooking.bookingDate}
                      onChange={(e) => setNewBooking({ ...newBooking, bookingDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={newBooking.startTime}
                      onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 cursor-pointer"
                      required
                      step="900"
                      min="06:00"
                      max="22:00"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Job Notes (optional)
                </h3>
                
                <textarea
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                  placeholder="Add any notes about this booking..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateBookingModal(false);
                    setIsEditingBooking(false);
                    setEditingBookingId(null);
                    setNewBooking({
                      customerId: '',
                      customerName: '',
                      customerEmail: '',
                      customerPhone: '',
                      customerAddress: '',
                      serviceId: '',
                      employeeId: '',
                      bookingDate: '',
                      startTime: '',
                      notes: ''
                    });
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateBooking}
                  disabled={creatingBooking}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingBooking ? 'Saving...' : isEditingBooking ? 'Save Changes' : 'Create Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
