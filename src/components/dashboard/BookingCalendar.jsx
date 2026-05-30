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
  ChevronDown,
  CheckCircle,
  TrendingUp,
  Loader2,
  DollarSign,
  Lightbulb,
  LayoutGrid,
  List,
  Trash2,
  CreditCard,
  Palette,
  Target
} from 'lucide-react';

export default function BookingCalendar({ apiUrl, user, services, employees, authFetch }) {
  const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}${period}`;
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [bookingUpsells, setBookingUpsells] = useState(null);
  const [upsellLoading, setUpsellLoading] = useState(false);
  const [upsellForId, setUpsellForId] = useState(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerPickerTab, setCustomerPickerTab] = useState('customers');
  const [customerPickerSearch, setCustomerPickerSearch] = useState('');
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [existingLeads, setExistingLeads] = useState([]);
  const [loadingPicker, setLoadingPicker] = useState(false);
  const [calendarView, setCalendarView] = useState(() => {
    if (window.innerWidth < 768) return 'day';
    return localStorage.getItem('calendarDefaultView') || 'week';
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allBookings, setAllBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);
  const mobileTodayRef = useRef(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showCreateBookingModal, setShowCreateBookingModal] = useState(false);
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [sendUpdateEmail, setSendUpdateEmail] = useState(false);
  const [serviceTab, setServiceTab] = useState('main');
  const [newBooking, setNewBooking] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    serviceId: '',
    additionalServices: [],
    employeeId: '',
    groupId: '',
    bookingDate: '',
    startTime: '',
    notes: '',
    referralSource: '',
    // Per-booking price override. Auto-fills from the selected service unless the user
    // has edited it manually (priceTouched). The service catalog price isn't affected.
    price: '',
    priceTouched: false
  });
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [bookingFormSnapshot, setBookingFormSnapshot] = useState(null);

  const isBookingDirty = () => bookingFormSnapshot && JSON.stringify(newBooking) !== bookingFormSnapshot;

  const closeBookingModal = (force = false) => {
    if (!force && isBookingDirty()) {
      if (!confirm('You have unsaved changes. Are you sure you want to close? Your changes will be lost.')) return;
    }
    setShowCreateBookingModal(false);
    setIsEditingBooking(false);
    setEditingBookingId(null);
    setServiceTab('main');
    setShowCustomerPicker(false);
    setCustomerPickerSearch('');
    setNewBooking({
      customerId: '', customerName: '', customerEmail: '', customerPhone: '',
      customerAddress: '', serviceId: '', additionalServices: [],
      employeeId: '', groupId: '', bookingDate: '', startTime: '', notes: '',
      referralSource: '', price: '', priceTouched: false
    });
    setBookingFormSnapshot(null);
  };
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    fetchAllBookings();
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/groups`);
      const data = await response.json();
      if (data.groups) {
        setGroups(data.groups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  useEffect(() => {
    const scrollToBusinessHours = async () => {
      try {
        const response = await authFetch(`${apiUrl}/api/business-hours`);
        const data = await response.json();
        const today = new Date().getDay();
        const todayHours = data.hours?.find(h => h.day_of_week === today);
        let startHour = 9;
        if (todayHours && todayHours.is_open && todayHours.open_time) {
          startHour = parseInt(todayHours.open_time.split(':')[0]);
        }
        const timeSlotContainer = document.querySelector('.time-slots-container');
        if (timeSlotContainer) {
          timeSlotContainer.scrollTop = startHour * 81;
        }
      } catch (error) {
        console.error('Error fetching business hours for scroll:', error);
        const timeSlotContainer = document.querySelector('.time-slots-container');
        if (timeSlotContainer) {
          timeSlotContainer.scrollTop = 9 * 81;
        }
      }
    };
    setTimeout(scrollToBusinessHours, 100);
  }, []);

  useEffect(() => {
    if (calendarView === 'week' && window.innerWidth < 768) {
      setTimeout(() => {
        mobileTodayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [calendarView, currentDate]);

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
      const response = await authFetch(`${apiUrl}/api/bookings`);
      const data = await response.json();
      if (data.bookings) {
        const sorted = data.bookings.sort((a, b) => 
          new Date(b.booking_date) - new Date(a.booking_date)
        );
        setAllBookings(sorted);
        setFilteredBookings(sorted);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    if (!confirm('Mark this booking as completed? This will trigger automated review requests.')) return;
    try {
      const response = await authFetch(`${apiUrl}/api/bookings/${bookingId}/complete`, {
        method: 'PUT'
      });
      const data = await response.json();
      if (data.success) {
        showToast('✅ Booking completed! Automated review sequence started.');
        fetchAllBookings();
      } else {
        showToast('Failed to mark as completed: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error completing booking:', error);
      showToast('Failed to mark as completed', 'error');
    }
  };

  const openCustomerPicker = async () => {
    setShowCustomerPicker(true);
    if (existingCustomers.length > 0 || existingLeads.length > 0) return;
    setLoadingPicker(true);
    try {
      const [custRes, leadRes] = await Promise.all([
        authFetch(`${apiUrl}/api/customers`),
        authFetch(`${apiUrl}/api/leads`),
      ]);
      const custData = await custRes.json();
      const leadData = await leadRes.json();
      setExistingCustomers(custData.customers || []);
      setExistingLeads(leadData.leads || []);
    } catch (err) {
      console.error('Failed to load customers/leads:', err.message);
    } finally {
      setLoadingPicker(false);
    }
  };

  const selectFromPicker = (person) => {
    setNewBooking(prev => ({
      ...prev,
      customerName: person.name || '',
      customerEmail: person.email || '',
      customerPhone: person.phone || '',
      customerAddress: person.address || prev.customerAddress,
    }));
    setShowCustomerPicker(false);
    setCustomerPickerSearch('');
  };

  const fetchBookingUpsells = async (booking) => {
    const serviceName = booking.items?.[0]?.service_name || '';
    const servicePrice = booking.items?.[0]?.price || booking.total_amount;
    if (!serviceName) return;
    setUpsellLoading(true);
    setBookingUpsells(null);
    setUpsellForId(booking.id);
    try {
      const res = await authFetch(`${apiUrl}/api/market-research/upsells/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName, servicePrice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setBookingUpsells(data.upsells || []);
    } catch (err) {
      console.error('Upsell fetch error:', err.message);
    } finally {
      setUpsellLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedBooking) return;
    try {
      const response = await authFetch(`${apiUrl}/api/bookings/${selectedBooking.id}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ notes: bookingNotes })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSelectedBooking({ ...selectedBooking, job_notes: bookingNotes });
        setAllBookings(allBookings.map(b => 
          b.id === selectedBooking.id ? { ...b, job_notes: bookingNotes } : b
        ));
        setFilteredBookings(filteredBookings.map(b => 
          b.id === selectedBooking.id ? { ...b, job_notes: bookingNotes } : b
        ));
        setEditingNotes(false);
        showToast('Notes saved successfully!');
      } else {
        showToast('Failed to save notes: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      showToast('Failed to save notes: ' + error.message, 'error');
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to delete this booking? This cannot be undone.')) return;
    try {
      const response = await authFetch(`${apiUrl}/api/bookings/${bookingId}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('Booking deleted', 'success');
        setShowBookingModal(false);
        setSelectedBooking(null);
        fetchAllBookings();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to delete booking', 'error');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      showToast('Failed to delete booking', 'error');
    }
  };

  const sendCardOnFileLink = async (bookingId) => {
    try {
      const response = await authFetch(`${apiUrl}/api/bookings/${bookingId}/send-card-link`, { method: 'POST' });
      if (response.ok) {
        showToast('Card on file link sent to customer', 'success');
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to send card link', 'error');
      }
    } catch (error) {
      console.error('Error sending card link:', error);
      showToast('Failed to send card link', 'error');
    }
  };

  const handleCreateBooking = async () => {
    if (!newBooking.customerName || !newBooking.serviceId || !newBooking.bookingDate || !newBooking.startTime) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    setCreatingBooking(true);
    try {
      if (isEditingBooking && editingBookingId) {
        // Only send price when it parses to a valid non-negative number; otherwise let the
        // backend fall back to the service's catalog price.
        const parsedEditPrice = parseFloat(newBooking.price);
        const editPriceField = (newBooking.price !== '' && Number.isFinite(parsedEditPrice) && parsedEditPrice >= 0)
          ? parsedEditPrice : undefined;

        const response = await authFetch(`${apiUrl}/api/bookings/${editingBookingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            serviceId: newBooking.serviceId,
            additionalServiceIds: newBooking.additionalServices,
            bookingDate: newBooking.bookingDate,
            startTime: newBooking.startTime,
            employeeId: newBooking.employeeId || null,
            groupId: newBooking.groupId || null,
            customerInfo: {
              name: newBooking.customerName,
              email: newBooking.customerEmail,
              phone: newBooking.customerPhone,
              address: newBooking.customerAddress
            },
            notes: newBooking.notes,
            sendEmail: sendUpdateEmail,
            price: editPriceField
          })
        });
        const data = await response.json();
        if (data.success) {
          showToast('Booking updated successfully!');
          closeBookingModal(true);
          fetchAllBookings();
        } else {
          showToast(data.error || 'Failed to update booking', 'error');
        }
      } else {
        // Only send price when it parses to a valid non-negative number; otherwise let the
        // backend fall back to the service's catalog price.
        const parsedPrice = parseFloat(newBooking.price);
        const priceField = (newBooking.price !== '' && Number.isFinite(parsedPrice) && parsedPrice >= 0)
          ? parsedPrice : undefined;

        const response = await authFetch(`${apiUrl}/api/bookings/create`, {
          method: 'POST',
          body: JSON.stringify({
            serviceId: newBooking.serviceId,
            bookingDate: newBooking.bookingDate,
            startTime: newBooking.startTime,
            employeeId: newBooking.employeeId || null,
            groupId: newBooking.groupId || null,
            customerInfo: {
              name: newBooking.customerName,
              email: newBooking.customerEmail,
              phone: newBooking.customerPhone,
              address: newBooking.customerAddress
            },
            customerNotes: newBooking.notes,
            referralSource: newBooking.referralSource?.trim() || null,
            price: priceField
          })
        });
        const data = await response.json();
        if (data.success) {
          showToast('Booking created successfully!');
          closeBookingModal(true);
          fetchAllBookings();
        } else {
          showToast(data.error || 'Failed to create booking', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving booking:', error);
      showToast('Failed to save booking', 'error');
    } finally {
      setCreatingBooking(false);
    }
  };

  // Get the week range based on currentDate
  const getWeekRange = () => {
    const d = new Date(currentDate);
    const dayOfWeek = d.getDay();
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayOfWeek);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
  };

  // Filter bookings to current week + search query
  const getWeekBookings = () => {
    const { start, end } = getWeekRange();
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

    let filtered = allBookings.filter(booking => {
      const bookingDate = booking.booking_date.split('T')[0];
      return bookingDate >= startStr && bookingDate <= endStr;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.customer_name?.toLowerCase().includes(q) ||
        booking.customer_email?.toLowerCase().includes(q) ||
        booking.customer_phone?.includes(q) ||
        booking.service_name?.toLowerCase().includes(q)
      );
    }

    // Sort: active first, then completed at bottom
    return filtered.sort((a, b) => {
      const aCompleted = a.status === 'completed' || a.status === 'cancelled';
      const bCompleted = b.status === 'completed' || b.status === 'cancelled';
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      return new Date(a.booking_date + 'T' + (a.start_time || '00:00')) - new Date(b.booking_date + 'T' + (b.start_time || '00:00'));
    });
  };

  // Get the month range based on currentDate
  const getMonthRange = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { start, end };
  };

  // Filter bookings to current month + search query
  const getMonthBookings = () => {
    const { start, end } = getMonthRange();
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

    let filtered = allBookings.filter(booking => {
      const bookingDate = booking.booking_date.split('T')[0];
      return bookingDate >= startStr && bookingDate <= endStr;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.customer_name?.toLowerCase().includes(q) ||
        booking.customer_email?.toLowerCase().includes(q) ||
        booking.customer_phone?.includes(q) ||
        booking.service_name?.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => {
      const aCompleted = a.status === 'completed' || a.status === 'cancelled';
      const bCompleted = b.status === 'completed' || b.status === 'cancelled';
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      return new Date(a.booking_date + 'T' + (a.start_time || '00:00')) - new Date(b.booking_date + 'T' + (b.start_time || '00:00'));
    });
  };

  // Get calendar grid days for month view (includes padding days from prev/next months)
  const getMonthGridDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    const days = [];
    const current = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  // Recompute filtered bookings when week/month or search changes
  useEffect(() => {
    setFilteredBookings(calendarView === 'month' ? getMonthBookings() : getWeekBookings());
  }, [currentDate, allBookings, searchQuery, calendarView]);

  const [collapsedCompleted, setCollapsedCompleted] = useState(true);

  const handleSearchBookings = (query) => {
    setSearchQuery(query);
  };

  // Booking card for sidebar list
  const BookingCard = ({ booking, selectedBooking, setSelectedBooking, setBookingNotes, setShowBookingModal, setEditingNotes, formatTime, handleCompleteBooking, setIsEditingBooking, setEditingBookingId, setNewBooking, setShowCreateBookingModal, compact }) => {
    const isCompleted = booking.status === 'completed' || booking.status === 'cancelled';
    // Flag bookings that are past their date but still "confirmed" (not yet marked complete)
    const isPastDue = !isCompleted && booking.status === 'confirmed' && booking.booking_date && (() => {
      const p = booking.booking_date.toString().slice(0, 10).split('-');
      return new Date(p[0], p[1] - 1, p[2]) < new Date(new Date().toDateString());
    })();
    return (
      <div
        className={`w-full rounded-lg border transition-all ${
          selectedBooking?.id === booking.id
            ? 'bg-blue-50 border-blue-300'
            : isCompleted
            ? 'bg-gray-50 border-gray-100 opacity-60'
            : isPastDue
            ? 'bg-orange-50 border-orange-300'
            : 'bg-white border-gray-200 hover:border-gray-300'
        } ${compact ? 'p-2' : 'p-3'}`}
      >
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className={`font-semibold text-gray-900 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                {booking.customer_name}
              </p>
              {isPastDue && (
                <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                  Past Due
                </span>
              )}
            </div>
            {!compact && (
              <p className="text-xs text-gray-600 truncate">
                {booking.items?.[0]?.service_name || 'Service'}
              </p>
            )}
          </div>
          <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
            booking.status === 'completed' ? 'bg-gray-100 text-gray-500' :
            booking.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            booking.status === 'cancelled' ? 'bg-red-100 text-red-500' :
            'bg-gray-100 text-gray-700'
          }`}>
            {booking.status === 'completed' ? '✓' : booking.status}
          </span>
        </div>

        {!compact && (
          <div className="space-y-1 mb-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              {(() => { const p = booking.booking_date.toString().slice(0,10).split('-'); return new Date(p[0], p[1]-1, p[2]).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); })()}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Clock className="w-3 h-3" />
              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
            </div>
            {booking.employee_name && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <User className="w-3 h-3" />
                {booking.employee_name}
              </div>
            )}
          </div>
        )}

        <div className={`grid gap-1 ${compact ? 'grid-cols-1' : 'grid-cols-3'}`}>
          <button
            type="button"
            onClick={() => {
              setSelectedBooking(booking);
              setBookingNotes(booking.job_notes || '');
              setShowBookingModal(true);
              setEditingNotes(false);
            }}
            className={`px-2 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition ${compact ? '' : ''}`}
          >
            View
          </button>
          {!compact && (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsEditingBooking(true);
                  setEditingBookingId(booking.id);
                  setSendUpdateEmail(false);
                  // Pre-fill the price input from the booking's primary line so what's shown
                  // reflects what's actually saved (which may already be a custom price). If
                  // the saved price differs from the service's catalog price, treat as "touched"
                  // so the Reset chip shows.
                  const primaryItem = booking.items?.[0];
                  const itemPrice = primaryItem ? parseFloat(primaryItem.service_price || 0) : 0;
                  const svcForPrice = services.find(s => s.id == primaryItem?.service_id);
                  const listedForPrice = svcForPrice ? parseFloat(svcForPrice.price) : itemPrice;
                  const isCustomPrice = Number.isFinite(itemPrice) && Math.abs(itemPrice - listedForPrice) > 0.001;
                  const editForm = {
                    customerId: booking.customer_id,
                    customerName: booking.customer_name,
                    customerEmail: booking.customer_email || '',
                    customerPhone: booking.customer_phone || '',
                    customerAddress: booking.customer_address || '',
                    serviceId: booking.items?.[0]?.service_id ? Number(booking.items[0].service_id) : '',
                    additionalServices: (booking.items || []).slice(1).map(i => Number(i.service_id)),
                    employeeId: booking.employee_id ? String(booking.employee_id) : '',
                    groupId: booking.group_id ? String(booking.group_id) : '',
                    bookingDate: booking.booking_date.split('T')[0],
                    startTime: (booking.start_time || '').slice(0, 5),
                    notes: booking.job_notes || booking.customer_notes || '',
                    price: itemPrice > 0 ? itemPrice.toFixed(2) : '',
                    priceTouched: isCustomPrice
                  };
                  setNewBooking(editForm);
                  setBookingFormSnapshot(JSON.stringify(editForm));
                  setShowCreateBookingModal(true);
                }}
                className="px-2 py-1.5 bg-amber-600 text-white text-xs font-medium rounded hover:bg-amber-700 transition"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleCompleteBooking(booking.id)}
                className={`px-2 py-1.5 text-xs font-medium rounded transition ${
                  booking.status === 'completed'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                disabled={booking.status === 'completed'}
              >
                {booking.status === 'completed' ? '✓' : 'Done'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

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
                  const selectedDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                  setCurrentDate(selectedDate);
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
    <div className="flex flex-col gap-4 md:flex-row md:gap-6">
      <div className="hidden md:flex w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex-col h-[calc(100vh-140px)]">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 mb-1">
            {calendarView === 'month' ? "This Month's Bookings" : "This Week's Bookings"}
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            {calendarView === 'month'
              ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : (() => {
                  const { start, end } = getWeekRange();
                  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                })()}
          </p>
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
              {(() => {
                const activeBookings = filteredBookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled');
                const completedBookings = filteredBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');
                return (
                  <>
                    {activeBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} selectedBooking={selectedBooking} setSelectedBooking={setSelectedBooking} setBookingNotes={setBookingNotes} setShowBookingModal={setShowBookingModal} setEditingNotes={setEditingNotes} formatTime={formatTime} handleCompleteBooking={handleCompleteBooking} setIsEditingBooking={setIsEditingBooking} setEditingBookingId={setEditingBookingId} setNewBooking={setNewBooking} setShowCreateBookingModal={setShowCreateBookingModal} compact={false} />
                    ))}
                    {completedBookings.length > 0 && (
                      <>
                        <button
                          onClick={() => setCollapsedCompleted(!collapsedCompleted)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition"
                        >
                          <span>Completed ({completedBookings.length})</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${collapsedCompleted ? '' : 'rotate-180'}`} />
                        </button>
                        {!collapsedCompleted && completedBookings.map((booking) => (
                          <BookingCard key={booking.id} booking={booking} selectedBooking={selectedBooking} setSelectedBooking={setSelectedBooking} setBookingNotes={setBookingNotes} setShowBookingModal={setShowBookingModal} setEditingNotes={setEditingNotes} formatTime={formatTime} handleCompleteBooking={handleCompleteBooking} setIsEditingBooking={setIsEditingBooking} setEditingBookingId={setEditingBookingId} setNewBooking={setNewBooking} setShowCreateBookingModal={setShowCreateBookingModal} compact={true} />
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <div className="w-full md:flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-[75vh] md:h-[calc(100vh-140px)]">
        {/* Mobile-only navigation strip */}
        <div className="md:hidden flex-shrink-0 p-4 border-b border-gray-200 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => { const d = new Date(currentDate); if (calendarView === 'month') d.setMonth(d.getMonth()-1); else if (calendarView === 'day') d.setDate(d.getDate()-1); else d.setDate(d.getDate()-7); setCurrentDate(d); }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm font-bold text-gray-900 text-center flex-1">
              {calendarView === 'day'
                ? currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                : calendarView === 'month'
                ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : (() => { const s = new Date(currentDate); s.setDate(s.getDate() - s.getDay()); const e = new Date(s); e.setDate(e.getDate()+6); return `${s.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${e.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`; })()}
            </span>
            <button
              type="button"
              onClick={() => { const d = new Date(currentDate); if (calendarView === 'month') d.setMonth(d.getMonth()+1); else if (calendarView === 'day') d.setDate(d.getDate()+1); else d.setDate(d.getDate()+7); setCurrentDate(d); }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
              {['day','week','month'].map(v => (
                <button key={v} type="button" onClick={() => setCalendarView(v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${calendarView===v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>
                  {v.charAt(0).toUpperCase()+v.slice(1)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { setBookingFormSnapshot(JSON.stringify(newBooking)); setShowCreateBookingModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-amber-600 text-white rounded-lg text-xs font-semibold hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Booking
            </button>
          </div>
        </div>

        {/* Desktop controls */}
        <div className="hidden md:flex items-center justify-between mb-0 flex-shrink-0 p-6 pb-0">
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
                  if (calendarView === 'month') {
                    newDate.setMonth(currentDate.getMonth() - 1);
                  } else if (calendarView === 'day') {
                    newDate.setDate(currentDate.getDate() - 1);
                  } else {
                    newDate.setDate(currentDate.getDate() - 7);
                  }
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
                  if (calendarView === 'month') {
                    newDate.setMonth(currentDate.getMonth() + 1);
                  } else if (calendarView === 'day') {
                    newDate.setDate(currentDate.getDate() + 1);
                  } else {
                    newDate.setDate(currentDate.getDate() + 7);
                  }
                  setCurrentDate(newDate);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>Default:</span>
                <button
                  type="button"
                  onClick={() => { localStorage.setItem('calendarDefaultView', 'week'); setCalendarView('week'); }}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition ${calendarView !== 'month' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  Week
                </button>
                <button
                  type="button"
                  onClick={() => { localStorage.setItem('calendarDefaultView', 'month'); setCalendarView('month'); }}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition ${calendarView === 'month' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  Month
                </button>
              </div>
              <div className="flex items-center gap-2">
                {employees && employees.length > 0 && (
                  <div className="relative group">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-lg cursor-default select-none">
                      <Palette className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs font-medium text-gray-600">Team</span>
                    </div>
                    {/* Hover legend — appears above the pill */}
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Team Colors</p>
                      <div className="space-y-1.5">
                        {employees.map(employee => (
                          <div key={employee.id} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: employee.color || '#3b82f6' }} />
                            <span className="text-xs text-gray-700 truncate">{employee.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setCalendarView('day')}
                    className={`md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                      calendarView === 'day'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarView('week')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                      calendarView === 'week'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarView('month')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                      calendarView === 'month'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Month
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setBookingFormSnapshot(JSON.stringify(newBooking));
                setShowCreateBookingModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Booking
            </button>
          </div>
        </div>

        {calendarView === 'week' && (
          <>
          {/* Mobile: vertical day-by-day agenda for the week */}
          <div className="md:hidden flex-1 overflow-y-auto p-3 space-y-4">
            {[0,1,2,3,4,5,6].map(offset => {
              const base = new Date(currentDate);
              base.setDate(base.getDate() - base.getDay() + offset);
              const dateStr = `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}-${String(base.getDate()).padStart(2,'0')}`;
              const today = new Date();
              const isToday = base.toDateString() === today.toDateString();
              const dayBookings = allBookings.filter(b => b.booking_date.split('T')[0] === dateStr).sort((a,b) => a.start_time.localeCompare(b.start_time));
              return (
                <div key={offset} ref={isToday ? mobileTodayRef : null}>
                  <div className={`text-xs font-bold uppercase mb-2 px-1 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                    {base.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    {isToday && <span className="ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full normal-case">Today</span>}
                  </div>
                  {dayBookings.length === 0
                    ? <p className="text-xs text-gray-400 px-1 pb-2">No bookings</p>
                    : dayBookings.map(booking => (
                      <BookingCard key={booking.id} booking={booking} selectedBooking={selectedBooking} setSelectedBooking={setSelectedBooking} setBookingNotes={setBookingNotes} setShowBookingModal={setShowBookingModal} setEditingNotes={setEditingNotes} formatTime={formatTime} handleCompleteBooking={handleCompleteBooking} setIsEditingBooking={setIsEditingBooking} setEditingBookingId={setEditingBookingId} setNewBooking={setNewBooking} setShowCreateBookingModal={setShowCreateBookingModal} compact={false} />
                    ))
                  }
                </div>
              );
            })}
          </div>
          {/* Desktop: time grid */}
          <div className="hidden md:flex border border-gray-200 rounded-lg flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto time-slots-container scroll-smooth">
              <div className="grid grid-cols-8 border-b border-gray-200 sticky top-0 bg-white z-20 min-w-[640px]">
                <div className="bg-gray-50 p-3 text-sm font-medium text-gray-500 border-r border-gray-200">
                  Time
                </div>
                {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();
                  const day = currentDate.getDate();
                  const baseDate = new Date(year, month, day);
                  const dayOfWeek = baseDate.getDay();
                  const date = new Date(year, month, day - dayOfWeek + offset);
                  const today = new Date();
                  const isToday = date.getFullYear() === today.getFullYear() &&
                                 date.getMonth() === today.getMonth() &&
                                 date.getDate() === today.getDate();

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

              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-gray-100 min-w-[640px]">
                  <div className="bg-gray-50 p-3 text-sm text-gray-600 border-r border-gray-200">
                    {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
                  </div>
                  {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();
                    const day = currentDate.getDate();
                    const baseDate = new Date(year, month, day);
                    const dayOfWeek = baseDate.getDay();
                    const date = new Date(year, month, day - dayOfWeek + offset);
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

                    const dayBookings = allBookings.filter(booking => {
                      const bookingDateOnly = booking.booking_date.split('T')[0];
                      if (bookingDateOnly !== dateStr) return false;
                      const startHour = parseInt(booking.start_time.split(':')[0]);
                      return startHour === hour;
                    });

                    return (
                      <div
                        key={offset}
                        className={`p-2 min-h-[80px] hover:bg-gray-50 transition relative ${offset !== 6 ? 'border-r border-gray-200' : ''}`}
                      >
                        {dayBookings.map((booking, bookingIndex) => {
                          const [startHour, startMin] = booking.start_time.split(':').map(Number);
                          const [endHour, endMin] = booking.end_time.split(':').map(Number);
                          const startMinutes = startHour * 60 + startMin;
                          const endMinutes = endHour * 60 + endMin;
                          const durationMinutes = endMinutes - startMinutes;
                          const heightPerMinute = 80 / 60;
                          const blockHeight = durationMinutes * heightPerMinute;
                          const topOffset = startMin * heightPerMinute;
                          const employee = employees?.find(emp => emp.id === booking.employee_id);
                          const employeeColor = employee?.color || '#3b82f6';
                          const employeeName = employee?.name || 'Unassigned';
                          const total = dayBookings.length;
                          const colWidthPct = 100 / total;
                          const leftPct = (bookingIndex / total) * 100;

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
                              className="absolute rounded text-white text-xs cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all overflow-hidden shadow-md border-l-4 z-10"
                              style={{
                                top: `${topOffset}px`,
                                height: `${Math.max(blockHeight, 40)}px`,
                                backgroundColor: employeeColor,
                                borderLeftColor: employeeColor,
                                filter: 'brightness(0.95)',
                                left: `calc(${leftPct}% + 4px)`,
                                width: `calc(${colWidthPct}% - 8px)`
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
                                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          </>
        )}

        {calendarView === 'month' && (
          <>
          {/* Mobile: vertical list — days with bookings only */}
          {(() => {
            const monthDays = getMonthGridDays().filter(d => d.getMonth() === currentDate.getMonth());
            const daysWithBookings = monthDays.map(day => {
              const dateStr = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
              return { day, dateStr, bookings: allBookings.filter(b => b.booking_date.split('T')[0] === dateStr).sort((a,b) => a.start_time.localeCompare(b.start_time)) };
            }).filter(d => d.bookings.length > 0);
            const today = new Date();
            return (
              <div className="md:hidden flex-1 overflow-y-auto p-3 space-y-4">
                {daysWithBookings.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No bookings this month</p>
                  </div>
                ) : daysWithBookings.map(({ day, bookings }) => {
                  const isToday = day.toDateString() === today.toDateString();
                  return (
                    <div key={day.toISOString()}>
                      <div className={`text-xs font-bold uppercase mb-2 px-1 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                        {day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        {isToday && <span className="ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full normal-case">Today</span>}
                      </div>
                      {bookings.map(booking => (
                        <BookingCard key={booking.id} booking={booking} selectedBooking={selectedBooking} setSelectedBooking={setSelectedBooking} setBookingNotes={setBookingNotes} setShowBookingModal={setShowBookingModal} setEditingNotes={setEditingNotes} formatTime={formatTime} handleCompleteBooking={handleCompleteBooking} setIsEditingBooking={setIsEditingBooking} setEditingBookingId={setEditingBookingId} setNewBooking={setNewBooking} setShowCreateBookingModal={setShowCreateBookingModal} compact={false} />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })()}
          {/* Desktop: month grid */}
          <div className="hidden md:flex border border-gray-200 rounded-lg flex-1 flex-col overflow-hidden">
            <div className="overflow-x-auto flex-1 flex flex-col">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 min-w-[420px]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className={`p-3 text-center text-sm font-medium text-gray-600 ${day !== 'Sat' ? 'border-r border-gray-200' : ''}`}>
                  {day}
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-7 auto-rows-fr min-w-[420px]" style={{ minHeight: '100%' }}>
                {getMonthGridDays().map((day, idx) => {
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const today = new Date();
                  const isToday = day.getFullYear() === today.getFullYear() &&
                                 day.getMonth() === today.getMonth() &&
                                 day.getDate() === today.getDate();
                  const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                  const dayBookings = allBookings.filter(b => b.booking_date.split('T')[0] === dateStr);
                  const maxVisible = 3;

                  return (
                    <div
                      key={idx}
                      className={`min-h-[110px] p-1.5 border-b border-r border-gray-100 ${
                        !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                      } ${isToday ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 px-1 ${
                        isToday
                          ? 'text-white bg-blue-600 rounded-full w-7 h-7 flex items-center justify-center'
                          : !isCurrentMonth
                          ? 'text-gray-300'
                          : 'text-gray-900'
                      }`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {dayBookings.slice(0, maxVisible).map(booking => {
                          const employee = employees?.find(emp => emp.id === booking.employee_id);
                          const employeeColor = employee?.color || '#3b82f6';
                          const isCompleted = booking.status === 'completed' || booking.status === 'cancelled';
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
                              className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate transition hover:brightness-110 ${
                                isCompleted ? 'opacity-50' : ''
                              }`}
                              style={{
                                backgroundColor: employeeColor + '20',
                                color: employeeColor,
                                borderLeft: `3px solid ${employeeColor}`
                              }}
                              title={`${booking.customer_name} — ${formatTime(booking.start_time)}`}
                            >
                              {formatTime(booking.start_time)} {booking.customer_name}
                            </button>
                          );
                        })}
                        {dayBookings.length > maxVisible && (
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentDate(new Date(day));
                              setCalendarView('week');
                            }}
                            className="w-full text-left px-1.5 py-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                          >
                            +{dayBookings.length - maxVisible} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>
          </div>
          </>
        )}

        {calendarView === 'day' && (() => {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;
          const dayBookings = allBookings
            .filter(b => b.booking_date.split('T')[0] === dateStr)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
          return (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {dayBookings.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No bookings for {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                </div>
              ) : dayBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} selectedBooking={selectedBooking} setSelectedBooking={setSelectedBooking} setBookingNotes={setBookingNotes} setShowBookingModal={setShowBookingModal} setEditingNotes={setEditingNotes} formatTime={formatTime} handleCompleteBooking={handleCompleteBooking} setIsEditingBooking={setIsEditingBooking} setEditingBookingId={setEditingBookingId} setNewBooking={setNewBooking} setShowCreateBookingModal={setShowCreateBookingModal} compact={false} />
              ))}
            </div>
          );
        })()}
      </div>

      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 pt-5 pb-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                  <p className="text-sm text-gray-600 mt-1">Booking #{selectedBooking.booking_number}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedBooking(null);
                    setEditingNotes(false);
                    setBookingUpsells(null);
                    setUpsellForId(null);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedBooking.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleCompleteBooking(selectedBooking.id);
                      setShowBookingModal(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Complete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingBooking(true);
                    setEditingBookingId(selectedBooking.id);
                    setSendUpdateEmail(false);
                    // Same price pre-fill as the calendar-event Edit button above.
                    const primaryItem = selectedBooking.items?.[0];
                    const itemPrice = primaryItem ? parseFloat(primaryItem.service_price || 0) : 0;
                    const svcForPrice = services.find(s => s.id == primaryItem?.service_id);
                    const listedForPrice = svcForPrice ? parseFloat(svcForPrice.price) : itemPrice;
                    const isCustomPrice = Number.isFinite(itemPrice) && Math.abs(itemPrice - listedForPrice) > 0.001;
                    const editForm = {
                      customerId: selectedBooking.customer_id,
                      customerName: selectedBooking.customer_name,
                      customerEmail: selectedBooking.customer_email || '',
                      customerPhone: selectedBooking.customer_phone || '',
                      customerAddress: selectedBooking.customer_address || '',
                      serviceId: selectedBooking.items?.[0]?.service_id ? Number(selectedBooking.items[0].service_id) : '',
                      additionalServices: (selectedBooking.items || []).slice(1).map(i => Number(i.service_id)),
                      employeeId: selectedBooking.employee_id ? String(selectedBooking.employee_id) : '',
                      groupId: selectedBooking.group_id ? String(selectedBooking.group_id) : '',
                      bookingDate: selectedBooking.booking_date.split('T')[0],
                      startTime: (selectedBooking.start_time || '').slice(0, 5),
                      notes: selectedBooking.job_notes || selectedBooking.customer_notes || '',
                      price: itemPrice > 0 ? itemPrice.toFixed(2) : '',
                      priceTouched: isCustomPrice
                    };
                    setNewBooking(editForm);
                    setBookingFormSnapshot(JSON.stringify(editForm));
                    setShowBookingModal(false);
                    setShowCreateBookingModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                {selectedBooking.customer_email && (
                  <button
                    type="button"
                    onClick={() => sendCardOnFileLink(selectedBooking.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition"
                  >
                    <CreditCard className="w-4 h-4" />
                    Send Card Link
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteBooking(selectedBooking.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <select
                  value={selectedBooking.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    try {
                      const res = await authFetch(`${apiUrl}/api/bookings/${selectedBooking.id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setSelectedBooking({ ...selectedBooking, status: newStatus });
                        setAllBookings(allBookings.map(b => b.id === selectedBooking.id ? { ...b, status: newStatus } : b));
                        setFilteredBookings(filteredBookings.map(b => b.id === selectedBooking.id ? { ...b, status: newStatus } : b));
                      }
                    } catch {}
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    selectedBooking.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                    selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    selectedBooking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="confirmed_card_on_file">Confirmed + Card on File</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
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
                      {(() => { const p = selectedBooking.booking_date.toString().slice(0,10).split('-'); return new Date(p[0], p[1]-1, p[2]).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); })()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time
                    </label>
                    <p className="text-gray-900 font-medium">
                      {formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}
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

              <div className="bg-amber-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-amber-600" />
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
                    {(() => {
                      const itemsSubtotal = selectedBooking.items.reduce((sum, it) => sum + (parseFloat(it.price) || 0), 0);
                      const subtotal = parseFloat(selectedBooking.subtotal) || itemsSubtotal || 0;
                      const totalAmount = parseFloat(selectedBooking.total_amount) || subtotal;
                      const taxRate = parseFloat(selectedBooking.tax_rate) || 0;
                      const taxAmount = parseFloat(selectedBooking.tax_amount) || (taxRate > 0 ? subtotal * taxRate : (totalAmount > subtotal + 0.005 ? totalAmount - subtotal : 0));
                      const total = taxAmount > 0 ? subtotal + taxAmount : totalAmount;
                      return (
                        <div className="pt-3 border-t border-amber-200 space-y-1">
                          {taxAmount > 0 && (
                            <>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="text-gray-700">${subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Tax{taxRate > 0 ? ` (${(taxRate * 100).toFixed(1)}%)` : ''}</span>
                                <span className="text-gray-700">${taxAmount.toFixed(2)}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-gray-600">No service details available</p>
                )}
              </div>

              {/* Customer notes from online booking form */}
              {selectedBooking.customer_notes && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900">Note from Customer</h3>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{selectedBooking.customer_notes}</p>
                </div>
              )}

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
                    placeholder="Add internal notes about this job..."
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
                      <p className="text-gray-400 italic">No internal notes added yet</p>
                    )}
                  </div>
                )}
              </div>
              {/* Upsell Recommendations */}
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-gray-900">Upsell Recommendations</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchBookingUpsells(selectedBooking)}
                    disabled={upsellLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium disabled:opacity-50"
                  >
                    {upsellLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    ) : bookingUpsells && upsellForId === selectedBooking.id ? (
                      <><TrendingUp className="w-4 h-4" /> Regenerate</>
                    ) : (
                      <><Lightbulb className="w-4 h-4" /> Get Upsell Ideas</>
                    )}
                  </button>
                </div>

                {!bookingUpsells && !upsellLoading && (
                  <p className="text-sm text-gray-500 italic">Click "Get Upsell Ideas" to see what to offer this customer based on their booking.</p>
                )}

                {upsellLoading && (
                  <div className="flex items-center gap-3 py-4 text-purple-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Generating upsell scripts for {selectedBooking.items?.[0]?.service_name}...</span>
                  </div>
                )}

                {bookingUpsells && upsellForId === selectedBooking.id && !upsellLoading && (
                  <div className="space-y-3">
                    {bookingUpsells.map((u, i) => (
                      <div key={i} className="bg-white rounded-lg p-4 border border-purple-100">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{u.name}</h4>
                          <span className="flex items-center gap-1 text-green-600 font-bold text-sm bg-green-50 px-2 py-1 rounded-full">
                            <DollarSign className="w-3 h-3" />+${u.price}
                          </span>
                        </div>
                        <p className="text-xs text-purple-600 font-medium mb-2">
                          When: {u.timing}
                        </p>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 font-semibold mb-1">Say this:</p>
                          <p className="text-sm text-gray-800 italic">"{u.script}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                onClick={() => closeBookingModal()}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer / Lead Picker */}
              <div>
                <button
                  type="button"
                  onClick={openCustomerPicker}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:bg-blue-50 transition text-sm font-medium"
                >
                  <Search className="w-4 h-4" />
                  Select from existing Customers or Leads
                </button>

                {showCustomerPicker && (
                  <div className="mt-2 border border-gray-200 rounded-xl bg-white shadow-lg overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                      {['customers', 'leads'].map(tab => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setCustomerPickerTab(tab)}
                          className={`flex-1 py-2 text-sm font-medium capitalize transition ${
                            customerPickerTab === tab
                              ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => { setShowCustomerPicker(false); setCustomerPickerSearch(''); }}
                        className="px-3 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Search */}
                    <div className="p-2 border-b border-gray-100">
                      <input
                        type="text"
                        value={customerPickerSearch}
                        onChange={(e) => setCustomerPickerSearch(e.target.value)}
                        placeholder="Search by name, email, or phone…"
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                        autoFocus
                      />
                    </div>

                    {/* List */}
                    <div className="max-h-48 overflow-y-auto">
                      {loadingPicker ? (
                        <div className="py-6 text-center text-gray-400 text-sm">Loading…</div>
                      ) : (() => {
                        const list = (customerPickerTab === 'customers' ? existingCustomers : existingLeads)
                          .filter(p => {
                            const q = customerPickerSearch.toLowerCase();
                            return !q || (p.name || '').toLowerCase().includes(q) ||
                              (p.email || '').toLowerCase().includes(q) ||
                              (p.phone || '').includes(q);
                          });
                        if (list.length === 0) return (
                          <div className="py-6 text-center text-gray-400 text-sm">No {customerPickerTab} found</div>
                        );
                        return list.map((p, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => selectFromPicker(p)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition border-b border-gray-50 last:border-0"
                          >
                            <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400">{[p.email, p.phone].filter(Boolean).join(' · ')}</p>
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={newBooking.customerEmail}
                      onChange={(e) => setNewBooking({ ...newBooking, customerEmail: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newBooking.customerPhone}
                      onChange={(e) => setNewBooking({ ...newBooking, customerPhone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address (optional)</label>
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
                      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-600 rounded-full">1</span>
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

                {serviceTab === 'main' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Main Service <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newBooking.serviceId}
                      onChange={(e) => {
                        const newId = Number(e.target.value) || e.target.value;
                        // Auto-fill the price from the newly-selected service unless the
                        // user already typed a custom one.
                        const svc = services.find(s => s.id == newId);
                        const autoPrice = svc && !newBooking.priceTouched
                          ? parseFloat(svc.price).toFixed(2)
                          : newBooking.price;
                        setNewBooking({ ...newBooking, serviceId: newId, price: autoPrice });
                      }}
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
                    {newBooking.serviceId && (() => {
                      const svc = services.find(s => s.id == newBooking.serviceId);
                      const listed = svc ? parseFloat(svc.price) : 0;
                      const current = parseFloat(newBooking.price || '0');
                      const isCustom = newBooking.priceTouched && Number.isFinite(current) && current !== listed;
                      return (
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-green-700" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 mb-1">{svc?.name}</h4>
                              <div className="text-sm text-gray-600 mb-3">Duration: {svc?.duration_hours}h</div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Price for this booking
                              </label>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 flex items-center bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus-within:border-green-500">
                                  <span className="text-base font-semibold text-gray-500 mr-1">$</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={newBooking.price}
                                    onChange={(e) => {
                                      // Digits + a single decimal, max 2 decimals.
                                      const cleaned = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                                      const parts = cleaned.split('.');
                                      const limited = parts.length === 2 ? `${parts[0]}.${parts[1].slice(0, 2)}` : cleaned;
                                      setNewBooking({ ...newBooking, price: limited, priceTouched: true });
                                    }}
                                    placeholder="0.00"
                                    className="flex-1 bg-transparent outline-none text-base font-semibold text-gray-900"
                                  />
                                </div>
                                {isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => setNewBooking({ ...newBooking, price: listed.toFixed(2), priceTouched: false })}
                                    className="px-3 py-2 text-xs font-semibold text-green-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                    title="Reset to the service's listed price"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                              <p className="mt-1.5 text-xs text-gray-500">
                                Listed at ${listed.toFixed(2)}. Edit for one-off adjustments — the service price itself isn't affected.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {serviceTab === 'additional' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Additional Services (Optional)
                    </label>
                    <div className="border border-gray-300 rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
                      {!services || services.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No services available</div>
                      ) : services.filter(s => s.id != newBooking.serviceId).length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          {newBooking.serviceId ? 'No other services available' : 'Please select a main service first'}
                        </div>
                      ) : (
                        services.filter(s => s.id != newBooking.serviceId).map(service => (
                          <label
                            key={service.id}
                            className="flex items-center gap-3 p-3 bg-white hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={newBooking.additionalServices && newBooking.additionalServices.some(id => id == service.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewBooking({
                                    ...newBooking,
                                    additionalServices: [...(newBooking.additionalServices || []), service.id]
                                  });
                                } else {
                                  setNewBooking({
                                    ...newBooking,
                                    additionalServices: (newBooking.additionalServices || []).filter(id => id != service.id)
                                  });
                                }
                              }}
                              className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{service.name}</div>
                              <div className="text-xs text-gray-600">${service.price} • {service.duration_hours}h</div>
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
                          const service = services.find(s => s.id == serviceId);
                          return (
                            <div key={serviceId} className="flex items-center justify-between bg-green-50 rounded-lg p-2">
                              <div>
                                <div className="font-medium text-sm text-gray-900">{service?.name}</div>
                                <div className="text-xs text-gray-600">${service?.price} • {service?.duration_hours}h</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewBooking({
                                    ...newBooking,
                                    additionalServices: newBooking.additionalServices.filter(id => id != serviceId)
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

                {newBooking.serviceId && (
                  <div className="mt-4 bg-green-100 rounded-lg p-3">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="font-medium text-gray-700">Total Services:</span>
                      <span className="font-bold text-gray-900">{1 + newBooking.additionalServices.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="font-medium text-gray-700">Total Duration:</span>
                      <span className="font-bold text-gray-900">
                        {(() => {
                          const mainService = services.find(s => s.id == newBooking.serviceId);
                          const mainDuration = parseFloat(mainService?.duration_hours) || 0;
                          const additionalDuration = newBooking.additionalServices.reduce((total, id) => {
                            const service = services.find(s => s.id == id);
                            return total + (parseFloat(service?.duration_hours) || 0);
                          }, 0);
                          return (mainDuration + additionalDuration).toFixed(1);
                        })()}h
                      </span>
                    </div>
                    {(() => {
                      const mainService = services.find(s => s.id == newBooking.serviceId);
                      const mainPrice = parseFloat(mainService?.price) || 0;
                      const additionalPrice = newBooking.additionalServices.reduce((total, id) => {
                        const service = services.find(s => s.id == id);
                        return total + (parseFloat(service?.price) || 0);
                      }, 0);
                      const subtotal = mainPrice + additionalPrice;
                      const taxRate = parseFloat(user?.default_tax_rate) || 0;
                      const taxAmount = subtotal * taxRate;
                      const total = subtotal + taxAmount;
                      return (
                        <div className="pt-2 border-t border-green-200 space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Subtotal:</span>
                            <span className="text-gray-700">${subtotal.toFixed(2)}</span>
                          </div>
                          {taxRate > 0 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500">Tax ({(taxRate * 100).toFixed(1)}%):</span>
                              <span className="text-gray-700">${taxAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-gray-700">Total:</span>
                            <span className="font-bold text-green-700 text-lg">${total.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  Schedule
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Team Member or Group (optional)
                    </label>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Individual Team Member</label>
                        <select
                          value={newBooking.employeeId}
                          onChange={(e) => setNewBooking({ ...newBooking, employeeId: e.target.value, groupId: '' })}
                          disabled={!!newBooking.groupId}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 ${
                            newBooking.groupId ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="">Select team member</option>
                          {employees.map(employee => (
                            <option key={employee.id} value={employee.id}>{employee.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Or Assign to Group</label>
                        <select
                          value={newBooking.groupId}
                          onChange={(e) => setNewBooking({ ...newBooking, groupId: e.target.value, employeeId: '' })}
                          disabled={!!newBooking.employeeId}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 ${
                            newBooking.employeeId ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="">Select group</option>
                          {groups.map(group => (
                            <option key={group.id} value={group.id}>
                              {group.name} ({group.employee_ids?.length || 0} members)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {!newBooking.employeeId && !newBooking.groupId && (
                      <p className="text-xs text-gray-500 mt-1">Leave empty to auto-assign an available team member</p>
                    )}
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
                    <select
                      value={newBooking.startTime}
                      onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                      required
                    >
                      <option value="">Select time</option>
                      {(() => {
                        const times = [];
                        for (let hour = 6; hour <= 22; hour++) {
                          for (let minute = 0; minute < 60; minute += 15) {
                            const timeValue = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                            const period = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                            const displayTime = `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
                            times.push(<option key={timeValue} value={timeValue}>{displayTime}</option>);
                          }
                        }
                        return times;
                      })()}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Job Notes (optional)
                </h3>
                <textarea
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                  placeholder="Add any notes about this booking..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {!isEditingBooking && (
                <div className="bg-indigo-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    How did they find you? (optional)
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">For ROI tracking on manual bookings — e.g. Google, Instagram, Referral</p>
                  <input
                    type="text"
                    value={newBooking.referralSource}
                    onChange={(e) => setNewBooking({ ...newBooking, referralSource: e.target.value })}
                    placeholder="Google, Instagram, Word of mouth..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {isEditingBooking && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sendUpdateEmail}
                    onChange={e => setSendUpdateEmail(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Send booking updated email to customer</span>
                </label>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => closeBookingModal()}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateBooking}
                  disabled={creatingBooking}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingBooking ? 'Saving...' : isEditingBooking ? 'Save Changes' : 'Create Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed top-4 right-4 z-[60] animate-slide-in">
          <div className={`rounded-lg shadow-lg px-6 py-4 flex items-center gap-3 min-w-[300px] ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
