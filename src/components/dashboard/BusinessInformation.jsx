import { useState, useEffect, useRef } from 'react';
import { Clock, Save, Phone, Mail, MapPin, Navigation, Plus, X, Briefcase, Users, Edit, Upload, Send, ShieldOff, Smartphone, MessageSquare, Shield, Trash2, FolderOpen, Link, Timer, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function TimeInput({ value, onChange, className }) {
  const toDisplay = (hhmm) => {
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return hhmm;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  };

  const [display, setDisplay] = useState(toDisplay(value));

  useEffect(() => { setDisplay(toDisplay(value)); }, [value]);

  const parseTime = (input) => {
    const str = input.trim().toLowerCase().replace(/\s+/g, '');
    const match = str.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/);
    if (!match) return null;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2] || '0');
    const period = match[3];
    if (minutes < 0 || minutes > 59) return null;
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    if (hours > 23) return null;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleBlur = () => {
    const parsed = parseTime(display);
    if (parsed) {
      setDisplay(toDisplay(parsed));
      onChange(parsed);
    } else {
      setDisplay(toDisplay(value));
    }
  };

  return (
    <input
      type="text"
      value={display}
      onChange={(e) => setDisplay(e.target.value)}
      onBlur={handleBlur}
      placeholder="9:00 AM"
      className={className}
    />
  );
}

function SortableServiceCard({ service, isAddon, categories, allServices, onEdit, onDelete, onOpenAddons }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: service.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 999 : 'auto',
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${isAddon ? 'border-l-4 border-l-violet-400' : ''} hover:shadow-md transition-shadow`}
    >
      <div className="flex gap-6">
        {service.media_url && (
          <div className="flex-shrink-0">
            {service.media_type === 'image' ? (
              <img src={service.media_url} alt={service.name} className="w-32 h-32 object-cover rounded-lg" />
            ) : (
              <video src={service.media_url} className="w-32 h-32 object-cover rounded-lg" controls />
            )}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
            <button type="button" onClick={() => onEdit(service)} className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
              <Edit className="w-4 h-4" />
            </button>
            {isAddon ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">Add-on</span>
            ) : (
              service.category_id && categories.find(c => c.id === service.category_id) && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  {categories.find(c => c.id === service.category_id).name}
                </span>
              )
            )}
          </div>
          {service.description && <p className="text-gray-600 mb-4">{service.description}</p>}
          <div className="flex gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4" />
              <span>{service.duration_hours} {service.duration_hours === 1 ? 'hour' : 'hours'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 font-semibold">
              <span className="text-green-600">${service.price}</span>
            </div>
            {service.buffer_minutes > 0 && (
              <div className="flex items-center gap-2 text-gray-500">
                <Timer className="w-4 h-4" />
                <span>{service.buffer_minutes}min buffer</span>
              </div>
            )}
          </div>
          {!isAddon && allServices.filter(s => s.is_addon).length > 0 && (
            <button type="button" onClick={() => onOpenAddons(service)} className="mt-3 text-sm text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5" />
              Configure add-ons for this service
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2 items-center">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing touch-none"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(service.id)}
            className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BusinessInformation({
  businessHours,
  setBusinessHours,
  services,
  setServices,
  fetchServices,
  employees,
  setEmployees,
  fetchEmployees,
  apiUrl,
  user,
  authFetch,
  onDirtyChange,
  saveRef,
  initialTab
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'info');

  // Drag-and-drop sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Business Info State
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
    phone: '', email: '', address: '', city: '', state: '', zipCode: '',
    serviceAreaType: 'zipcodes', serviceZipCodes: [], serviceRadius: 25, centerZipCode: ''
  });

  const [newZipCode, setNewZipCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // { type: 'success'|'error', message: string }
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const addressSearchTimeout = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 47.6062, lng: -122.3321 });
  const [isLoadingMap, setIsLoadingMap] = useState(false);

  // Leaflet map refs
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletCircleRef = useRef(null);
  const centerMarkerRef = useRef(null);
  const [leafletReady, setLeafletReady] = useState(!!window.L);

  // Services State
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '', description: '', durationHours: '', price: '', mediaUrl: '', mediaType: '',
    categoryId: '', bufferMinutes: '', isAddon: false
  });
  const [isSavingService, setIsSavingService] = useState(false);
  const [serviceVariants, setServiceVariants] = useState([]);
  const [variantForm, setVariantForm] = useState({ name: '', price: '', durationHours: '' });
  const [editingVariant, setEditingVariant] = useState(null);
  const [isSavingVariant, setIsSavingVariant] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [serviceSubTab, setServiceSubTab] = useState('categories');

  // Categories State
  const [categories, setCategories] = useState([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', imageUrl: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Addons State
  const [showAddonsModal, setShowAddonsModal] = useState(false);
  const [addonsService, setAddonsService] = useState(null);
  const [addonSelections, setAddonSelections] = useState([]);
  const [isSavingAddons, setIsSavingAddons] = useState(false);

  // Team State
  const colorPalette = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
    '#14b8a6', '#f97316', '#06b6d4', '#84cc16', '#f43f5e', '#6366f1',
  ];

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({ 
    name: '', email: '', phone: '', color: '#3b82f6',
    workDays: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
    workHours: { startTime: '09:00', endTime: '17:00' }
  });
  const [isSavingEmployee, setIsSavingEmployee] = useState(false);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupForm, setGroupForm] = useState({ name: '', selectedEmployees: [] });
  const [editingGroup, setEditingGroup] = useState(null);
  const [invitingEmployeeId, setInvitingEmployeeId] = useState(null);

  // Permissions State
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionsEmployee, setPermissionsEmployee] = useState(null);
  const [permissionsForm, setPermissionsForm] = useState({});
  const [permissionTemplates, setPermissionTemplates] = useState([]);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const PERMISSION_DEFS = [
    { key: 'view_bookings', label: 'View Bookings', desc: 'See assigned bookings & schedule' },
    { key: 'manage_bookings', label: 'Manage Bookings', desc: 'Update booking status, add notes' },
    { key: 'view_customers', label: 'View Customers', desc: 'See customer contact info' },
    { key: 'view_all_bookings', label: 'View All Bookings', desc: 'See bookings assigned to other employees' },
    { key: 'send_messages', label: 'Send Messages', desc: 'Send SMS to customers' },
    { key: 'process_payments', label: 'Process Payments', desc: 'Use tap-to-pay, create invoices' },
    { key: 'view_reports', label: 'View Reports', desc: 'Access business reports & analytics' },
  ];

  const DEFAULT_PERMS = {
    view_bookings: true, manage_bookings: true, view_customers: true,
    view_all_bookings: false, send_messages: true, process_payments: false, view_reports: false
  };

  const openPermissionsModal = async (employee) => {
    setPermissionsEmployee(employee);
    setPermissionsForm(employee.permissions || DEFAULT_PERMS);
    setShowPermissionsModal(true);
    // Fetch templates
    try {
      const res = await authFetch(`${apiUrl}/api/employees/permission-templates`);
      if (res.ok) {
        const data = await res.json();
        setPermissionTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const savePermissions = async () => {
    if (!permissionsEmployee) return;
    setSavingPermissions(true);
    try {
      const res = await authFetch(`${apiUrl}/api/employees/${permissionsEmployee.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: permissionsForm })
      });
      if (res.ok) {
        if (fetchEmployees) await fetchEmployees();
        setShowPermissionsModal(false);
      } else {
        alert('Failed to save permissions');
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
      alert('Failed to save permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const applyTemplate = (template) => {
    setPermissionsForm(template.permissions || DEFAULT_PERMS);
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) return;
    try {
      const res = await authFetch(`${apiUrl}/api/employees/permission-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: templateName.trim(), permissions: permissionsForm })
      });
      if (res.ok) {
        const data = await res.json();
        setPermissionTemplates(prev => [...prev, data.template]);
        setShowSaveTemplate(false);
        setTemplateName('');
      }
    } catch (err) {
      console.error('Error saving template:', err);
    }
  };

  const deleteTemplate = async (templateId) => {
    try {
      const res = await authFetch(`${apiUrl}/api/employees/permission-templates/${templateId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPermissionTemplates(prev => prev.filter(t => t.id !== templateId));
      }
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  // App Settings - Status update templates
  const [statusTemplates, setStatusTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(null);
  const [appSettingsSubTab, setAppSettingsSubTab] = useState('messages');
  // Email Reminders
  const [reminders, setReminders] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [savingReminder, setSavingReminder] = useState(null);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderHours, setNewReminderHours] = useState('');

  const statusLabels = {
    in_progress: 'Job Started',
    completed: 'Job Completed',
    no_show: 'No Show',
    progress_update: 'Progress Update'
  };

  useEffect(() => {
    if (activeTab === 'app-settings') {
      fetchStatusTemplates();
      fetchReminders();
    }
    if (activeTab === 'services') {
      fetchCategories();
    }
  }, [activeTab]);

  const fetchStatusTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await authFetch(`${apiUrl}/api/status-templates`);
      const data = await res.json();
      setStatusTemplates(data.templates || []);
    } catch (err) { console.error(err); }
    finally { setLoadingTemplates(false); }
  };

  const handleSaveTemplate = async (status, messageTemplate, enabled) => {
    setSavingTemplate(status);
    try {
      const res = await authFetch(`${apiUrl}/api/status-templates/${status}`, {
        method: 'PUT',
        body: JSON.stringify({ messageTemplate, enabled })
      });
      if (res.ok) {
        fetchStatusTemplates();
      }
    } catch (err) { console.error(err); }
    finally { setSavingTemplate(null); }
  };

  const fetchReminders = async () => {
    setLoadingReminders(true);
    try {
      const res = await authFetch(`${apiUrl}/api/booking-reminders`);
      const data = await res.json();
      setReminders(data.reminders || []);
    } catch (err) { console.error(err); }
    finally { setLoadingReminders(false); }
  };

  const handleUpdateReminder = async (id, updates) => {
    setSavingReminder(id);
    try {
      const res = await authFetch(`${apiUrl}/api/booking-reminders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setReminders(prev => prev.map(r => r.id === id ? data.reminder : r));
      }
    } catch (err) { console.error(err); }
    finally { setSavingReminder(null); }
  };

  const handleAddReminder = async () => {
    const hours = parseInt(newReminderHours);
    if (!hours || hours < 1) return;
    try {
      const res = await authFetch(`${apiUrl}/api/booking-reminders`, {
        method: 'POST',
        body: JSON.stringify({ hours_before: hours })
      });
      if (res.ok) {
        const data = await res.json();
        setReminders(prev => [...prev, data.reminder].sort((a, b) => b.hours_before - a.hours_before));
        setNewReminderHours('');
        setShowAddReminder(false);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteReminder = async (id) => {
    if (!confirm('Delete this reminder?')) return;
    try {
      await authFetch(`${apiUrl}/api/booking-reminders/${id}`, { method: 'DELETE' });
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleSendInvite = async (employeeId) => {
    setInvitingEmployeeId(employeeId);
    try {
      const res = await authFetch(`${apiUrl}/api/employees/${employeeId}/invite`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Invite sent!');
        fetchEmployees();
      } else {
        alert(data.error || 'Failed to send invite');
      }
    } catch (err) {
      console.error('Error sending invite:', err);
      alert('Failed to send invite');
    } finally {
      setInvitingEmployeeId(null);
    }
  };

  const handleRevokeAccess = async (employeeId, employeeName) => {
    if (!confirm(`Revoke mobile app access for ${employeeName}? They will need a new invite to log in again.`)) return;
    try {
      const res = await authFetch(`${apiUrl}/api/employees/${employeeId}/revoke`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Access revoked');
        fetchEmployees();
      }
    } catch (err) {
      console.error('Error revoking access:', err);
    }
  };

  const getNextColor = () => {
    const usedColors = employees.map(emp => emp.color);
    const availableColor = colorPalette.find(color => !usedColors.includes(color));
    return availableColor || colorPalette[employees.length % colorPalette.length];
  };

  useEffect(() => {
    fetchBusinessInfo();
    if (businessHours && businessHours.length > 0) {
      const hoursObj = {};
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      businessHours.forEach(day => {
        // Handle both day_name (string) and day_of_week (number) formats
        const dayName = day.day_name || dayNames[day.day_of_week];
        if (dayName) {
          hoursObj[dayName] = { open: day.is_open, start: day.open_time || '09:00', end: day.close_time || '17:00' };
        }
      });
      setHours(prev => ({ ...prev, ...hoursObj }));
    }
  }, [businessHours]);

  useEffect(() => {
    if (user?.id) fetchGroups();
  }, [user]);

  useEffect(() => {
    if (businessInfo.serviceAreaType === 'radius' && businessInfo.centerZipCode && businessInfo.centerZipCode.length === 5) {
      geocodeZipCode(businessInfo.centerZipCode);
    }
  }, [businessInfo.centerZipCode, businessInfo.serviceAreaType]);

  // Load Leaflet CSS + JS from CDN once
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletReady(true);
      document.head.appendChild(script);
    }
  }, []);

  // Initialize Leaflet map when entering radius mode; destroy when leaving
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current) return;

    if (businessInfo.serviceAreaType !== 'radius') {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletCircleRef.current = null;
        centerMarkerRef.current = null;
      }
      return;
    }

    if (leafletMapRef.current) return; // already initialized

    const L = window.L;
    const center = [mapCenter.lat, mapCenter.lng];
    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 10,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    const circle = L.circle(center, {
      radius: businessInfo.serviceRadius * 1609.34,
      color: '#9333ea',
      fillColor: '#9333ea',
      fillOpacity: 0.15,
      weight: 3,
      dashArray: '10, 5',
    }).addTo(map);

    const marker = L.circleMarker(center, {
      radius: 7,
      color: 'white',
      fillColor: '#9333ea',
      fillOpacity: 1,
      weight: 2,
    }).addTo(map);

    leafletMapRef.current = map;
    leafletCircleRef.current = circle;
    centerMarkerRef.current = marker;

    map.fitBounds(circle.getBounds(), { padding: [30, 30] });

    return () => {
      map.remove();
      leafletMapRef.current = null;
      leafletCircleRef.current = null;
      centerMarkerRef.current = null;
    };
  }, [leafletReady, businessInfo.serviceAreaType, mapCenter]);

  // Update circle radius when slider changes
  useEffect(() => {
    if (!leafletCircleRef.current || !leafletMapRef.current) return;
    leafletCircleRef.current.setRadius(businessInfo.serviceRadius * 1609.34);
    leafletMapRef.current.fitBounds(leafletCircleRef.current.getBounds(), { padding: [30, 30] });
  }, [businessInfo.serviceRadius]);

  // Fly to new center when zip code geocodes
  useEffect(() => {
    if (!leafletMapRef.current || !leafletCircleRef.current) return;
    const latlng = [mapCenter.lat, mapCenter.lng];
    leafletCircleRef.current.setLatLng(latlng);
    if (centerMarkerRef.current) centerMarkerRef.current.setLatLng(latlng);
    // Use setView for reliable panning, then fit to circle bounds
    leafletMapRef.current.setView(latlng, leafletMapRef.current.getZoom(), { animate: true });
    // Defer fitBounds to next tick so Leaflet recalculates the circle bounds after setLatLng
    setTimeout(() => {
      if (leafletMapRef.current && leafletCircleRef.current) {
        leafletMapRef.current.fitBounds(leafletCircleRef.current.getBounds(), { padding: [30, 30] });
      }
    }, 50);
  }, [mapCenter]);

  const geocodeZipCode = async (zipCode) => {
    setIsLoadingMap(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=US&format=json&limit=1`, {
        headers: { 'User-Agent': 'BusinessManagementApp/1.0' }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        setMapCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      }
    } catch (error) {
      console.error('Error geocoding zip code:', error);
    } finally {
      setIsLoadingMap(false);
    }
  };

  const stateAbbreviations = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH',
    'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC',
    'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA',
    'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN',
    'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
    'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
  };

  const handleAddressInput = (value) => {
    setBusinessInfo(prev => ({ ...prev, address: value }));
    if (addressSearchTimeout[0]) clearTimeout(addressSearchTimeout[0]);
    if (value.length < 3) { setAddressSuggestions([]); setShowAddressSuggestions(false); return; }
    addressSearchTimeout[0] = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&countrycodes=us&limit=6`,
          { headers: { 'User-Agent': 'BusinessManagementApp/1.0' } }
        );
        const data = await res.json();
        setAddressSuggestions(data);
        setShowAddressSuggestions(data.length > 0);
      } catch (err) {
        console.error('Address autocomplete error:', err);
      }
    }, 350);
  };

  const selectAddressSuggestion = (suggestion) => {
    const a = suggestion.address;
    const streetNumber = a.house_number || '';
    const road = a.road || a.pedestrian || a.footway || '';
    const streetAddress = [streetNumber, road].filter(Boolean).join(' ');
    const city = a.city || a.town || a.village || a.hamlet || a.suburb || '';
    const stateRaw = a.state || '';
    const state = stateAbbreviations[stateRaw] || stateRaw.slice(0, 2).toUpperCase();
    const zip = (a.postcode || '').slice(0, 5);
    setBusinessInfo(prev => ({ ...prev, address: streetAddress, city, state, zipCode: zip }));
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
  };

  const fetchBusinessInfo = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/business-info`);
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
        if (info.serviceAreaType === 'radius' && info.centerZipCode) {
          geocodeZipCode(info.centerZipCode);
        }
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/groups`);
      const data = await response.json();
      if (data.groups) setGroups(data.groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const hoursArray = Object.entries(hours).map(([dayName, dayData]) => ({
        day_name: dayName,
        is_open: dayData.open,
        open_time: dayData.open ? dayData.start : null,
        close_time: dayData.open ? dayData.end : null
      }));

      const hoursResponse = await authFetch(`${apiUrl}/api/business-hours`, {
        method: 'POST',
        body: JSON.stringify({ hours: hoursArray })
      });
      if (!hoursResponse.ok) {
        const errData = await hoursResponse.json().catch(() => ({}));
        throw new Error(errData.error || `Hours save failed (${hoursResponse.status})`);
      }

      const infoResponse = await authFetch(`${apiUrl}/api/business-info`, {
        method: 'POST',
        body: JSON.stringify({
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
      if (!infoResponse.ok) {
        const errData = await infoResponse.json().catch(() => ({}));
        throw new Error(errData.error || `Info save failed (${infoResponse.status})`);
      }

      setSaveStatus({ type: 'success', message: 'Business information saved!' });
      if (onDirtyChange) onDirtyChange(false);
      window.dispatchEvent(new CustomEvent('business-info-updated'));
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus({ type: 'error', message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Keep saveRef pointing to current handleSaveAll for parent "Save & Leave"
  useEffect(() => {
    if (saveRef) saveRef.current = handleSaveAll;
    return () => { if (saveRef) saveRef.current = null; };
  });

  // Clean up dirty state on unmount
  useEffect(() => {
    return () => { if (onDirtyChange) onDirtyChange(false); };
  }, []);

  const markDirty = () => { if (onDirtyChange) onDirtyChange(true); };

  const addZipCode = () => {
    const zipCode = newZipCode.trim();
    if (zipCode && zipCode.length === 5 && !isNaN(zipCode)) {
      if (!businessInfo.serviceZipCodes.includes(zipCode)) {
        setBusinessInfo({ ...businessInfo, serviceZipCodes: [...businessInfo.serviceZipCodes, zipCode] });
        setNewZipCode('');
        markDirty();
      } else {
        alert('This zip code is already added');
      }
    } else {
      alert('Please enter a valid 5-digit zip code');
    }
  };

  const removeZipCode = (zipCode) => {
    setBusinessInfo({ ...businessInfo, serviceZipCodes: businessInfo.serviceZipCodes.filter(z => z !== zipCode) });
    markDirty();
  };


  // Category Functions
  const fetchCategories = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/service-categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) { console.error('Error fetching categories:', err); }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    setIsSavingCategory(true);
    try {
      const url = editingCategory
        ? `${apiUrl}/api/service-categories/${editingCategory.id}`
        : `${apiUrl}/api/service-categories`;
      const res = await authFetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        body: JSON.stringify(categoryForm)
      });
      if (!res.ok) throw new Error('Failed to save category');
      setCategoryForm({ name: '', description: '', imageUrl: '' });
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Failed to save category');
    } finally { setIsSavingCategory(false); }
  };

  const handleCategoryImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCategoryForm(prev => ({ ...prev, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category? Services in it will become uncategorized.')) return;
    try {
      await authFetch(`${apiUrl}/api/service-categories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (err) { console.error('Error deleting category:', err); }
  };

  // Addon Functions
  const openAddonsModal = async (service) => {
    setAddonsService(service);
    try {
      const res = await authFetch(`${apiUrl}/api/services/${service.id}/addons`);
      if (res.ok) {
        const data = await res.json();
        setAddonSelections((data.addons || []).map(a => a.id));
      }
    } catch (err) { console.error(err); setAddonSelections([]); }
    setShowAddonsModal(true);
  };

  const handleSaveAddons = async () => {
    if (!addonsService) return;
    setIsSavingAddons(true);
    try {
      await authFetch(`${apiUrl}/api/services/${addonsService.id}/addons`, {
        method: 'PUT',
        body: JSON.stringify({ addonServiceIds: addonSelections })
      });
      setShowAddonsModal(false);
      setAddonsService(null);
    } catch (err) {
      console.error('Error saving addons:', err);
      alert('Failed to save add-ons');
    } finally { setIsSavingAddons(false); }
  };

  // Services Functions
  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
      setServiceForm({ ...serviceForm, mediaUrl: reader.result, mediaType });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    setIsSavingService(true);
    setSaveError('');
    try {
      const url = editingService 
        ? `${apiUrl}/api/services/${editingService.id}`
        : `${apiUrl}/api/services`;
      
      const response = await authFetch(url, {
        method: editingService ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: serviceForm.name,
          description: serviceForm.description,
          durationHours: parseFloat(serviceForm.durationHours),
          price: parseFloat(serviceForm.price),
          mediaUrl: serviceForm.mediaUrl,
          mediaType: serviceForm.mediaType,
          categoryId: serviceForm.categoryId ? parseInt(serviceForm.categoryId) : null,
          bufferMinutes: serviceForm.bufferMinutes ? parseInt(serviceForm.bufferMinutes) : 0,
          isAddon: serviceForm.isAddon
        })
      });

      if (!response.ok) throw new Error('Failed to save service');
      setShowAddService(false);
      setEditingService(null);
      setServiceForm({ name: '', description: '', durationHours: '', price: '', mediaUrl: '', mediaType: '', categoryId: '', bufferMinutes: '', isAddon: false });
      setServiceVariants([]);
      setShowVariantForm(false);
      setEditingVariant(null);
      fetchServices();
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSavingService(false);
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      durationHours: service.duration_hours,
      price: service.price,
      mediaUrl: service.media_url || '',
      mediaType: service.media_type || '',
      categoryId: service.category_id || '',
      bufferMinutes: service.buffer_minutes || '',
      isAddon: service.is_addon || false
    });
    setServiceSubTab(service.is_addon ? 'addons' : 'main');
    // Fetch variants for this service
    if (!service.is_addon) {
      fetchServiceVariants(service.id);
    } else {
      setServiceVariants([]);
    }
    setShowVariantForm(false);
    setEditingVariant(null);
    setVariantForm({ name: '', price: '', durationHours: '' });
    setShowAddService(true);
  };

  const fetchServiceVariants = async (serviceId) => {
    try {
      const res = await authFetch(`${apiUrl}/api/services/${serviceId}/variants`);
      const data = await res.json();
      setServiceVariants(data.variants || []);
    } catch (e) {
      setServiceVariants([]);
    }
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    if (!editingService) return;
    setIsSavingVariant(true);
    try {
      const url = editingVariant
        ? `${apiUrl}/api/services/variants/${editingVariant.id}`
        : `${apiUrl}/api/services/${editingService.id}/variants`;
      const method = editingVariant ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        body: JSON.stringify({
          name: variantForm.name,
          price: parseFloat(variantForm.price),
          durationHours: variantForm.durationHours ? parseFloat(variantForm.durationHours) : null
        })
      });
      if (!res.ok) throw new Error('Failed to save variant');
      setVariantForm({ name: '', price: '', durationHours: '' });
      setEditingVariant(null);
      setShowVariantForm(false);
      fetchServiceVariants(editingService.id);
    } catch (e) {
      // silent
    } finally {
      setIsSavingVariant(false);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!confirm('Delete this service type?')) return;
    try {
      await authFetch(`${apiUrl}/api/services/variants/${variantId}`, { method: 'DELETE' });
      fetchServiceVariants(editingService.id);
    } catch (e) {
      // silent
    }
  };

  const handleDeleteService = async (id) => {
    if (!confirm('Are you sure you want to delete this service? This cannot be undone.')) return;
    try {
      await authFetch(`${apiUrl}/api/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: false })
      });
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const handleDragEnd = async (event, isAddon) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sorted = [...services]
      .filter(s => s.is_addon === isAddon)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
    const oldIndex = sorted.findIndex(s => s.id === active.id);
    const newIndex = sorted.findIndex(s => s.id === over.id);
    const reordered = arrayMove(sorted, oldIndex, newIndex);
    // Optimistic update
    setServices(prev => prev.map(s => {
      const idx = reordered.findIndex(r => r.id === s.id);
      return idx !== -1 ? { ...s, sort_order: idx } : s;
    }));
    try {
      await Promise.all(
        reordered.map((s, idx) =>
          authFetch(`${apiUrl}/api/services/${s.id}`, { method: 'PUT', body: JSON.stringify({ sortOrder: idx }) })
        )
      );
    } catch (e) {
      console.error('Reorder error:', e);
      fetchServices();
    }
  };

  // Team Functions
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) { alert('Please enter a group name'); return; }
    if (groupForm.selectedEmployees.length === 0) { alert('Please select at least one team member'); return; }
    try {
      const url = editingGroup ? `${apiUrl}/api/groups/${editingGroup.id}` : `${apiUrl}/api/groups`;
      const response = await authFetch(url, {
        method: editingGroup ? 'PUT' : 'POST',
        body: JSON.stringify({ name: groupForm.name, employeeIds: groupForm.selectedEmployees })
      });
      if (!response.ok) throw new Error('Failed to save group');
      setShowCreateGroupModal(false);
      setEditingGroup(null);
      setGroupForm({ name: '', selectedEmployees: [] });
      fetchGroups();
    } catch (error) {
      console.error('Error saving group:', error);
      alert('Failed to save group');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      const response = await authFetch(`${apiUrl}/api/groups/${groupId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete group');
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group');
    }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setIsSavingEmployee(true);
    try {
      const url = editingEmployee ? `${apiUrl}/api/employees/${editingEmployee.id}` : `${apiUrl}/api/employees`;
      const response = await authFetch(url, {
        method: editingEmployee ? 'PUT' : 'POST',
        body: JSON.stringify(employeeForm)
      });
      if (!response.ok) throw new Error('Failed to save employee');
      setShowAddEmployee(false);
      setEditingEmployee(null);
      setEmployeeForm({ 
        name: '', email: '', phone: '', color: getNextColor(),
        workDays: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
        workHours: { startTime: '09:00', endTime: '17:00' }
      });
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
    } finally {
      setIsSavingEmployee(false);
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone || '',
      color: employee.color || '#3b82f6',
      workDays: employee.work_days || { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
      workHours: employee.work_hours || { startTime: '09:00', endTime: '17:00' }
    });
    setShowAddEmployee(true);
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Business Settings</h1>
            <p className="text-gray-600 mt-1">Manage your business information, services, and team</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-8 py-4 font-semibold transition-all relative ${activeTab === 'info' ? 'text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Business Info
              </div>
              {activeTab === 'info' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-8 py-4 font-semibold transition-all relative ${activeTab === 'services' ? 'text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Services ({services.length})
              </div>
              {activeTab === 'services' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-8 py-4 font-semibold transition-all relative ${activeTab === 'team' ? 'text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team ({employees.length})
              </div>
              {activeTab === 'team' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
            <button
              onClick={() => setActiveTab('app-settings')}
              className={`px-8 py-4 font-semibold transition-all relative ${activeTab === 'app-settings' ? 'text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                App Settings
              </div>
              {activeTab === 'app-settings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
          </div>
        </div>
      </div>

      {/* Business Info Tab */}
      {activeTab === 'info' && (
        <div className="space-y-6" onInput={markDirty} onChange={markDirty}>
          <div className="flex items-center justify-between gap-4">
            {saveStatus ? (
              <div className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${saveStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {saveStatus.type === 'success' ? '✓ ' : '✗ '}{saveStatus.message}
              </div>
            ) : <div className="flex-1" />}
            <button type="button" onClick={handleSaveAll} disabled={isSaving} className="bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              Contact Information
            </h3>
            {/* Phone row — half input, half assigned number */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Phone Number</label>
                <input type="tel" value={businessInfo.phone} onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })} placeholder="(555) 123-4567" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMS Agent Number</label>
                {(user?.twilio_phone_number) ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <Smartphone className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-800 font-mono text-sm font-medium">{user?.twilio_phone_number}</span>
                    <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full ml-auto">Twilio</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm">No SMS number assigned</span>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1.5">This is your dedicated number for sending automated SMS messages to leads and customers. It gets assigned when SMS is activated for your account.</p>
              </div>
            </div>

            {/* Email row — half input, half sendgrid setup */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                <input type="email" value={businessInfo.email} onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })} placeholder="contact@business.com" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Confirmations</label>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 text-sm font-semibold">Active</span>
                  <span className="text-xs text-green-500 ml-auto">Booking emails sent on your behalf</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Booking confirmations are sent from SORCE on behalf of your business. Customer replies go directly to your business email.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Business Location
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <input
                  type="text"
                  value={businessInfo.address}
                  onChange={(e) => handleAddressInput(e.target.value)}
                  onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
                  onFocus={() => addressSuggestions.length > 0 && setShowAddressSuggestions(true)}
                  placeholder="123 Main Street"
                  autoComplete="off"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                />
                {showAddressSuggestions && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {addressSuggestions.map((s) => {
                      const a = s.address;
                      const street = [a.house_number, a.road || a.pedestrian || a.footway].filter(Boolean).join(' ');
                      const city = a.city || a.town || a.village || a.hamlet || '';
                      const state = a.state || '';
                      const zip = (a.postcode || '').slice(0, 5);
                      return (
                        <li
                          key={s.place_id}
                          onMouseDown={() => selectAddressSuggestion(s)}
                          className="px-4 py-3 hover:bg-amber-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <p className="text-sm font-medium text-gray-900">{street || s.display_name.split(',')[0]}</p>
                          <p className="text-xs text-gray-500">{[city, state, zip].filter(Boolean).join(', ')}</p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input type="text" value={businessInfo.city} onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })} placeholder="Seattle" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input type="text" value={businessInfo.state} onChange={(e) => setBusinessInfo({ ...businessInfo, state: e.target.value })} placeholder="WA" maxLength="2" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                  <input type="text" value={businessInfo.zipCode} onChange={(e) => setBusinessInfo({ ...businessInfo, zipCode: e.target.value })} placeholder="98001" maxLength="5" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-orange-600" />
              Service Area (Informational)
            </h3>
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200 mb-4">
              <p className="text-sm text-gray-700"><strong>Note:</strong> This service area is displayed on your website for informational purposes. Customers from anywhere can still book your services online.</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">How would you like to define your service area?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="areaType" value="zipcodes" checked={businessInfo.serviceAreaType === 'zipcodes'} onChange={(e) => setBusinessInfo({ ...businessInfo, serviceAreaType: e.target.value })} className="w-4 h-4 text-amber-600" />
                  <span className="font-medium">Specific Zip Codes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="areaType" value="radius" checked={businessInfo.serviceAreaType === 'radius'} onChange={(e) => setBusinessInfo({ ...businessInfo, serviceAreaType: e.target.value })} className="w-4 h-4 text-amber-600" />
                  <span className="font-medium">Radius from Location</span>
                </label>
              </div>
            </div>

            {businessInfo.serviceAreaType === 'zipcodes' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Zip Codes</label>
                <div className="flex gap-2 mb-4">
                  <input type="text" value={newZipCode} onChange={(e) => setNewZipCode(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addZipCode()} placeholder="Enter zip code" maxLength="5" className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                  <button type="button" onClick={addZipCode} className="bg-amber-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-amber-700 transition flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                {businessInfo.serviceZipCodes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {businessInfo.serviceZipCodes.map(zipCode => (
                      <div key={zipCode} className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-medium flex items-center gap-2">
                        {zipCode}
                        <button onClick={() => removeZipCode(zipCode)} className="hover:bg-amber-200 rounded-full p-1 transition">
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

            {businessInfo.serviceAreaType === 'radius' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Center Zip Code</label>
                  <input type="text" value={businessInfo.centerZipCode} onChange={(e) => setBusinessInfo({ ...businessInfo, centerZipCode: e.target.value })} placeholder="98001" maxLength="5" className="w-full md:w-64 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                  <p className="text-sm text-gray-500 mt-1">Usually your business zip code</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-200">
                  <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
                    {isLoadingMap && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75" style={{ zIndex: 1000 }}>
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-600 mx-auto mb-2"></div>
                          <p className="text-gray-600">Loading map...</p>
                        </div>
                      </div>
                    )}
                    <div ref={mapContainerRef} className="w-full h-full" />
                  </div>
                  <div className="mt-2 text-center text-sm text-gray-600">
                    <p>Purple circle shows your {businessInfo.serviceRadius}-mile service radius</p>
                    {businessInfo.centerZipCode && <p className="text-xs mt-1">Centered at zip code: {businessInfo.centerZipCode}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Radius: <span className="text-amber-600 font-bold">{businessInfo.serviceRadius} miles</span></label>
                  <input type="range" min="5" max="100" step="5" value={businessInfo.serviceRadius} onChange={(e) => setBusinessInfo({ ...businessInfo, serviceRadius: parseInt(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5 miles</span>
                    <span>100 miles</span>
                  </div>
                </div>
              </div>
            )}
          </div>

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
                      <input type="checkbox" checked={hours[day].open} onChange={(e) => setHours({ ...hours, [day]: { ...hours[day], open: e.target.checked } })} className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                      <span className="font-semibold text-gray-900">{dayLabels[day]}</span>
                    </label>
                  </div>
                  {hours[day].open ? (
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex items-center gap-1">
                        <TimeInput value={hours[day].start} onChange={(v) => setHours({ ...hours, [day]: { ...hours[day], start: v } })} className="w-28 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-center" />
                        <button
                          type="button"
                          onClick={() => {
                            const newHours = { ...hours };
                            days.forEach(d => { if (newHours[d].open) newHours[d].start = hours[day].start; });
                            setHours(newHours);
                          }}
                          className="p-1.5 text-xs text-amber-600 hover:bg-amber-100 rounded transition-colors"
                          title="Apply to all open days"
                        >
                          All
                        </button>
                      </div>
                      <span className="text-gray-500 font-medium">to</span>
                      <div className="flex items-center gap-1">
                        <TimeInput value={hours[day].end} onChange={(v) => setHours({ ...hours, [day]: { ...hours[day], end: v } })} className="w-28 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-center" />
                        <button
                          type="button"
                          onClick={() => {
                            const newHours = { ...hours };
                            days.forEach(d => { if (newHours[d].open) newHours[d].end = hours[day].end; });
                            setHours(newHours);
                          }}
                          className="p-1.5 text-xs text-amber-600 hover:bg-amber-100 rounded transition-colors"
                          title="Apply to all open days"
                        >
                          All
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newHours = { ...hours };
                          days.forEach(d => {
                            if (newHours[d].open) {
                              newHours[d].start = hours[day].start;
                              newHours[d].end = hours[day].end;
                            }
                          });
                          setHours(newHours);
                        }}
                        className="ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 rounded transition-colors font-medium"
                        title="Apply both times to all open days"
                      >
                        Apply to all
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1"><span className="text-gray-500 italic">Closed</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex gap-3">
              <div className="flex-shrink-0">💡</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Tips for Business Information</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Contact info appears on your website and booking page</li>
                  <li>• Service area is shown on your website for customer reference</li>
                  <li>• Customers can book from anywhere - service area doesn't restrict bookings</li>
                  <li>• Business hours control when customers can schedule appointments</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={handleSaveAll} disabled={isSaving} className="bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Services</h2>
            <p className="text-gray-600 mt-1">Manage your service offerings</p>
          </div>

          <div className="flex gap-6">
          {/* Left side — Management */}
          <div className="flex-1 min-w-0 space-y-6">

          {/* Categories / Main Services / Add-ons Sub-tabs */}
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setServiceSubTab('categories')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                serviceSubTab === 'categories'
                  ? 'border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Categories
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                serviceSubTab === 'categories' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {categories.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setServiceSubTab('main')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                serviceSubTab === 'main'
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Main Services
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                serviceSubTab === 'main' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {services.filter(s => !s.is_addon).length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setServiceSubTab('addons')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                serviceSubTab === 'addons'
                  ? 'border-violet-500 text-violet-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Add-ons / Upsells
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                serviceSubTab === 'addons' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {services.filter(s => s.is_addon).length}
              </span>
            </button>
          </div>

          {/* Add button below tabs */}
          {serviceSubTab !== 'categories' && (
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => {
                  setServiceForm({ name: '', description: '', durationHours: '', price: '', mediaUrl: '', mediaType: '', categoryId: '', bufferMinutes: '', isAddon: serviceSubTab === 'addons' });
                  setEditingService(null);
                  setServiceVariants([]);
                  setVariantForm({ name: '', price: '', durationHours: '' });
                  setEditingVariant(null);
                  setShowVariantForm(false);
                  setShowAddService(true);
                }}
                className="bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {serviceSubTab === 'addons' ? 'Add Add-on' : 'Add Service'}
              </button>
            </div>
          )}

          {/* Category Manager */}
          {serviceSubTab === 'categories' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-amber-600" />
                  Service Categories
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ name: '', description: '', imageUrl: '' });
                    setShowCategoryModal(true);
                  }}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              </div>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No categories yet. Add one to organize your services for online booking.</p>
              ) : (
                <div className="grid gap-3">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-900">{cat.name}</span>
                        {cat.description && <p className="text-sm text-gray-500 mt-0.5">{cat.description}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          {services.filter(s => s.category_id === cat.id && !s.is_addon).length} services
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryForm({ name: cat.name, description: cat.description || '', imageUrl: cat.image_url || '' });
                            setShowCategoryModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit category"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Category Add/Edit Modal */}
          {showCategoryModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <form onSubmit={(e) => { handleSaveCategory(e); setShowCategoryModal(false); }} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name *</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="e.g., Interior Detailing, Lawn Maintenance"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder="Brief description of this category..."
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category Image *</label>
                    <p className="text-xs text-gray-500 mb-3">This image is shown in the online booking flow when customers select a category.</p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {categoryForm.imageUrl ? (
                        <div className="space-y-4">
                          <img src={categoryForm.imageUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover" />
                          <button
                            type="button"
                            onClick={() => setCategoryForm({ ...categoryForm, imageUrl: '' })}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <label className="cursor-pointer">
                            <span className="text-amber-600 hover:text-amber-700 font-medium">Upload an image</span>
                            <input type="file" accept="image/*" onChange={handleCategoryImageUpload} className="hidden" />
                          </label>
                          <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryModal(false);
                        setEditingCategory(null);
                        setCategoryForm({ name: '', description: '', imageUrl: '' });
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCategory || !categoryForm.imageUrl}
                      className="flex-1 bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {isSavingCategory ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Main Services Sub-tab */}
          {serviceSubTab === 'main' && (
            <>
              {services.filter(s => !s.is_addon).length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                  <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No main services yet</h3>
                  <p className="text-gray-600 mb-6">Add your first service to get started</p>
                  <button
                    type="button"
                    onClick={() => {
                      setServiceForm({ name: '', description: '', durationHours: '', price: '', mediaUrl: '', mediaType: '', categoryId: '', bufferMinutes: '', isAddon: false });
                      setShowAddService(true);
                    }}
                    className="bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Create First Service
                  </button>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, false)}>
                  <SortableContext
                    items={[...services].filter(s => !s.is_addon).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id).map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid gap-4">
                      {[...services].filter(s => !s.is_addon).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id).map((service) => (
                        <SortableServiceCard
                          key={service.id}
                          service={service}
                          isAddon={false}
                          categories={categories}
                          allServices={services}
                          onEdit={handleEditService}
                          onDelete={handleDeleteService}
                          onOpenAddons={openAddonsModal}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </>
          )}

          {/* Add-ons Sub-tab */}
          {serviceSubTab === 'addons' && (
            <>
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-start gap-3">
                <div className="text-violet-600 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </div>
                <p className="text-sm text-violet-800">
                  Add-on services are upsells offered to customers during online booking after they select a main service. Go to a main service and click "Configure add-ons" to link them.
                </p>
              </div>
              {services.filter(s => s.is_addon).length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                  <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No add-on services yet</h3>
                  <p className="text-gray-600 mb-6">Create add-on services that can be upsold with your main services</p>
                  <button
                    type="button"
                    onClick={() => {
                      setServiceForm({ name: '', description: '', durationHours: '', price: '', mediaUrl: '', mediaType: '', categoryId: '', bufferMinutes: '', isAddon: true });
                      setShowAddService(true);
                    }}
                    className="bg-gradient-to-r from-violet-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Create First Add-on
                  </button>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, true)}>
                  <SortableContext
                    items={[...services].filter(s => s.is_addon).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id).map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid gap-4">
                      {[...services].filter(s => s.is_addon).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id).map((service) => (
                        <SortableServiceCard
                          key={service.id}
                          service={service}
                          isAddon={true}
                          categories={categories}
                          allServices={services}
                          onEdit={handleEditService}
                          onDelete={handleDeleteService}
                          onOpenAddons={openAddonsModal}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </>
          )}

          {/* Addons Configuration Modal */}
          {showAddonsModal && addonsService && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Configure Add-ons for "{addonsService.name}"
                </h2>
                <p className="text-sm text-gray-500 mb-6">Select which services should be offered as add-ons when a customer books this service.</p>
                <div className="space-y-2 mb-6">
                  {services.filter(s => s.id !== addonsService.id && s.is_addon).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No add-on services available. Mark a service as "Add-on" first.</p>
                  ) : (
                    services.filter(s => s.id !== addonsService.id && s.is_addon).map(s => (
                      <label key={s.id} className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        addonSelections.includes(s.id) ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="checkbox"
                          checked={addonSelections.includes(s.id)}
                          onChange={(e) => {
                            setAddonSelections(prev =>
                              e.target.checked ? [...prev, s.id] : prev.filter(id => id !== s.id)
                            );
                          }}
                          className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">{s.name}</span>
                          <span className="text-green-600 ml-2 text-sm">${s.price}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => { setShowAddonsModal(false); setAddonsService(null); }}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAddons}
                    disabled={isSavingAddons}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isSavingAddons ? 'Saving...' : 'Save Add-ons'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showAddService && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </h2>
                  <button type="button" onClick={() => { setShowAddService(false); setEditingService(null); setServiceVariants([]); setShowVariantForm(false); setEditingVariant(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleSaveService} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Service Name *</label>
                    <input
                      type="text"
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                      placeholder="e.g., Ceramic Coating, Paint Correction"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                      placeholder="Describe what's included in this service..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (hours) *</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={serviceForm.durationHours}
                        onChange={(e) => setServiceForm({ ...serviceForm, durationHours: e.target.value })}
                        placeholder="2"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={serviceForm.price}
                        onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                        placeholder="150.00"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  {/* Category + Buffer Time */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                      <select
                        value={serviceForm.categoryId}
                        onChange={(e) => setServiceForm({ ...serviceForm, categoryId: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                      >
                        <option value="">Uncategorized</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Buffer Time (minutes)</label>
                      <input
                        type="number"
                        min="0"
                        step="15"
                        value={serviceForm.bufferMinutes}
                        onChange={(e) => setServiceForm({ ...serviceForm, bufferMinutes: e.target.value })}
                        placeholder="0"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Break time after this service before next booking</p>
                    </div>
                  </div>

                  {/* Service Type Indicator */}
                  <div className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                    serviceForm.isAddon ? 'border-violet-200 bg-violet-50' : 'border-amber-200 bg-amber-50'
                  }`}>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      serviceForm.isAddon ? 'bg-violet-200 text-violet-800' : 'bg-amber-200 text-amber-800'
                    }`}>
                      {serviceForm.isAddon ? 'ADD-ON' : 'MAIN SERVICE'}
                    </div>
                    <p className="text-xs text-gray-600">
                      {serviceForm.isAddon
                        ? 'This will appear as an upsell option when linked to a main service'
                        : 'This will appear in the booking flow for customers to select'}
                    </p>
                  </div>

                  {/* Service Types / Variants — only for main services */}
                  {!serviceForm.isAddon && (
                    <div className="border-2 border-blue-100 rounded-xl p-4 bg-blue-50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-gray-800">Service Types (Optional)</h3>
                          <p className="text-xs text-gray-500 mt-0.5">e.g. Sedan, SUV, Minivan — each with its own price</p>
                        </div>
                        {editingService && (
                          <button
                            type="button"
                            onClick={() => { setShowVariantForm(true); setEditingVariant(null); setVariantForm({ name: '', price: '', durationHours: '' }); }}
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-100 px-3 py-1.5 rounded-lg"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Type
                          </button>
                        )}
                      </div>

                      {!editingService && (
                        <p className="text-xs text-gray-500 italic">Save this service first, then edit it to add service types.</p>
                      )}

                      {editingService && serviceVariants.length === 0 && !showVariantForm && (
                        <p className="text-xs text-gray-500 italic">No types added yet. Click "Add Type" to create options like Sedan, SUV, etc.</p>
                      )}

                      {editingService && serviceVariants.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {serviceVariants.map(v => (
                            <div key={v.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-blue-200">
                              {editingVariant?.id === v.id ? (
                                <form onSubmit={handleSaveVariant} className="flex items-center gap-2 flex-1">
                                  <input
                                    type="text"
                                    value={variantForm.name}
                                    onChange={e => setVariantForm({ ...variantForm, name: e.target.value })}
                                    placeholder="Name"
                                    required
                                    className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={variantForm.price}
                                    onChange={e => setVariantForm({ ...variantForm, price: e.target.value })}
                                    placeholder="Price"
                                    required
                                    className="w-20 text-xs px-2 py-1 border border-gray-300 rounded"
                                  />
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    value={variantForm.durationHours}
                                    onChange={e => setVariantForm({ ...variantForm, durationHours: e.target.value })}
                                    placeholder="Hrs"
                                    className="w-14 text-xs px-2 py-1 border border-gray-300 rounded"
                                  />
                                  <button type="submit" disabled={isSavingVariant} className="text-xs font-semibold text-green-600 hover:text-green-800">Save</button>
                                  <button type="button" onClick={() => { setEditingVariant(null); setVariantForm({ name: '', price: '', durationHours: '' }); }} className="text-xs text-gray-500">Cancel</button>
                                </form>
                              ) : (
                                <>
                                  <div className="flex-1">
                                    <span className="text-sm font-semibold text-gray-900">{v.name}</span>
                                    <span className="text-xs text-gray-500 ml-2">${parseFloat(v.price).toFixed(2)}{v.duration_hours ? ` · ${v.duration_hours}h` : ''}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => { setEditingVariant(v); setVariantForm({ name: v.name, price: v.price, durationHours: v.duration_hours || '' }); setShowVariantForm(false); }} className="p-1 text-blue-500 hover:bg-blue-100 rounded">
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onClick={() => handleDeleteVariant(v.id)} className="p-1 text-red-400 hover:bg-red-50 rounded">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {editingService && showVariantForm && (
                        <form onSubmit={handleSaveVariant} className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            value={variantForm.name}
                            onChange={e => setVariantForm({ ...variantForm, name: e.target.value })}
                            placeholder="Type name (e.g. Sedan)"
                            required
                            className="flex-1 text-xs px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
                          />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={variantForm.price}
                            onChange={e => setVariantForm({ ...variantForm, price: e.target.value })}
                            placeholder="Price"
                            required
                            className="w-20 text-xs px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
                          />
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={variantForm.durationHours}
                            onChange={e => setVariantForm({ ...variantForm, durationHours: e.target.value })}
                            placeholder="Hrs"
                            className="w-14 text-xs px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
                          />
                          <button type="submit" disabled={isSavingVariant} className="text-xs font-semibold text-green-600 hover:text-green-800 whitespace-nowrap">
                            {isSavingVariant ? '...' : 'Add'}
                          </button>
                          <button type="button" onClick={() => setShowVariantForm(false)} className="text-xs text-gray-500">
                            Cancel
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Service Image/Video (Optional)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {serviceForm.mediaUrl ? (
                        <div className="space-y-4">
                          {serviceForm.mediaType === 'image' ? (
                            <img src={serviceForm.mediaUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                          ) : (
                            <video src={serviceForm.mediaUrl} controls className="max-h-48 mx-auto rounded-lg" />
                          )}
                          <button
                            type="button"
                            onClick={() => setServiceForm({ ...serviceForm, mediaUrl: '', mediaType: '' })}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <label className="cursor-pointer">
                            <span className="text-amber-600 hover:text-amber-700 font-medium">Upload a file</span>
                            <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" />
                          </label>
                          <p className="text-xs text-gray-500 mt-2">PNG, JPG, MP4 up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {saveError && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-700">{saveError}</div>
                  )}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddService(false);
                        setEditingService(null);
                        setServiceForm({ name: '', description: '', durationHours: '', price: '', mediaUrl: '', mediaType: '', categoryId: '', bufferMinutes: '', isAddon: false });
                        setServiceVariants([]);
                        setShowVariantForm(false);
                        setEditingVariant(null);
                        setSaveError('');
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingService}
                      className="flex-1 bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {isSavingService ? 'Saving...' : (editingService ? 'Update Service' : 'Create Service')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          </div>

          {/* Right side — Booking Preview */}
          <div className="w-[380px] flex-shrink-0">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Phone frame header */}
                <div className="bg-gray-900 px-4 py-3 flex items-center justify-center gap-2">
                  <div className="w-16 h-1 bg-gray-700 rounded-full"></div>
                </div>
                <div className="bg-gray-50 px-2 py-2 border-b border-gray-200">
                  <div className="bg-white rounded-lg px-3 py-1.5 text-center text-xs text-gray-400 font-medium">Book Online Preview</div>
                </div>

                {/* Preview content */}
                <div className="p-5 max-h-[600px] overflow-y-auto" style={{ background: '#fff' }}>
                  {/* Step dots */}
                  <div className="flex items-center justify-center gap-1.5 mb-4">
                    {['categories', 'main', 'addons'].map((tab, i) => (
                      <div key={tab} className={`w-2 h-2 rounded-full transition-colors ${
                        (serviceSubTab === 'categories' && i === 0) ||
                        (serviceSubTab === 'main' && i === 1) ||
                        (serviceSubTab === 'addons' && i === 2)
                          ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    ))}
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                    <div className="w-2 h-2 rounded-full bg-gray-200" />
                  </div>

                  {/* Categories Preview */}
                  {serviceSubTab === 'categories' && (
                    <>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Our Services</h3>
                      <p className="text-sm text-gray-500 mb-4">Select a category to get started</p>
                      {categories.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          Add categories to see them here
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {categories.map(cat => (
                            <div
                              key={cat.id}
                              className="relative rounded-xl h-24 overflow-hidden cursor-default flex flex-col justify-end p-3"
                              style={{
                                background: cat.image_url
                                  ? `url(${cat.image_url}) center/cover`
                                  : '#374151'
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl" />
                              <span className="relative z-10 text-white font-bold text-sm">{cat.name}</span>
                              <span className="relative z-10 text-white/70 text-xs mt-0.5">
                                {services.filter(s => s.category_id === cat.id && !s.is_addon).length} services
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Services Preview */}
                  {serviceSubTab === 'main' && (
                    <>
                      <button className="text-sm text-gray-500 mb-3 flex items-center gap-1 hover:text-gray-700">{'\u2190'} Back</button>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Select a Service</h3>
                      <p className="text-sm text-gray-500 mb-4">Choose a service to book</p>
                      {services.filter(s => !s.is_addon).length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          Add services to see them here
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {services.filter(s => !s.is_addon).map(svc => (
                            <div key={svc.id} className="border-2 border-gray-200 rounded-xl p-3 hover:border-blue-400 transition-colors cursor-default">
                              <div className="flex items-center gap-3">
                                {svc.media_url ? (
                                  <img src={svc.media_url} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <Briefcase className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-gray-900 truncate">{svc.name}</div>
                                  {svc.description && <div className="text-xs text-gray-500 truncate">{svc.description}</div>}
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-sm font-bold text-blue-600">${parseFloat(svc.price).toFixed(2)}</span>
                                    <span className="text-xs text-gray-400">{svc.duration_hours}h</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Add-ons Preview */}
                  {serviceSubTab === 'addons' && (
                    <>
                      <button className="text-sm text-gray-500 mb-3 flex items-center gap-1 hover:text-gray-700">{'\u2190'} Back</button>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Add Extras</h3>
                      <p className="text-sm text-gray-500 mb-4">Enhance your experience</p>
                      {services.filter(s => s.is_addon).length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          <Plus className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          Add add-on services to see them here
                        </div>
                      ) : (
                        <>
                          <div className="divide-y divide-gray-100">
                            {services.filter(s => s.is_addon).map(addon => (
                              <div key={addon.id} className="flex items-center py-3 gap-3">
                                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-600 accent-blue-600 cursor-default" readOnly />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-gray-900">{addon.name}</div>
                                  {addon.description && <div className="text-xs text-gray-500">{addon.description}</div>}
                                </div>
                                <span className="text-sm font-bold text-blue-600 flex-shrink-0">+${parseFloat(addon.price).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t-2 border-gray-100 flex justify-between items-center">
                            <div>
                              <span className="text-xs text-gray-500">Total</span>
                              <div className="text-lg font-bold text-gray-900">$0.00</div>
                            </div>
                            <div className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold">
                              Continue {'\u2192'}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Phone frame bottom */}
                <div className="bg-gray-900 px-4 py-2 flex justify-center">
                  <div className="w-28 h-1 bg-gray-700 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          </div>

        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
              <p className="text-gray-600 mt-1">Manage your employees and their schedules</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowGroupsModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Groups
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddEmployee(true);
                  setEmployeeForm({
                    name: '', email: '', phone: '', color: getNextColor(),
                    workDays: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
                    workHours: { startTime: '09:00', endTime: '17:00' }
                  });
                }}
                className="bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Employee
              </button>
            </div>
          </div>

          {employees.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-600 mb-6">Add your first employee to get started</p>
              <button
                type="button"
                onClick={() => {
                  setShowAddEmployee(true);
                  setEmployeeForm({
                    name: '', email: '', phone: '', color: getNextColor(),
                    workDays: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
                    workHours: { startTime: '09:00', endTime: '17:00' }
                  });
                }}
                className="bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Add First Employee
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {employees.map((employee) => (
                <div key={employee.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: employee.color }}>
                      {employee.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{employee.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${employee.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {employee.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{employee.email || <span className="text-gray-400 italic">No email</span>}</p>
                      <p className="text-sm text-gray-600">{employee.phone || <span className="text-gray-400 italic">No phone</span>}</p>
                      {employee.work_hours && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Work Schedule:</p>
                          <p className="text-sm text-gray-600">{employee.work_hours.startTime} - {employee.work_hours.endTime}</p>
                          {employee.work_days && (
                            <div className="flex gap-1 mt-2">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                                const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][i];
                                const isWorking = employee.work_days[dayKey];
                                return (
                                  <span key={day} className={`text-xs px-2 py-1 rounded ${isWorking ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                    {day}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {employee.invite_status === 'accepted' && (
                        <button type="button" onClick={() => openPermissionsModal(employee)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Configure Permissions">
                          <Shield className="w-5 h-5" />
                        </button>
                      )}
                      <button type="button" onClick={() => handleEditEmployee(employee)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile App Access */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">
                        {employee.invite_status === 'accepted' ? (
                          <span className="text-green-600">App Connected</span>
                        ) : employee.invite_status === 'pending' ? (
                          <span className="text-amber-600">Invite Pending</span>
                        ) : (
                          'No App Access'
                        )}
                      </span>
                    </div>
                    {employee.invite_status === 'accepted' ? (
                      <button
                        onClick={() => handleRevokeAccess(employee.id, employee.name)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                      >
                        <ShieldOff className="w-3.5 h-3.5" />
                        Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendInvite(employee.id)}
                        disabled={invitingEmployeeId === employee.id || !employee.email}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition disabled:opacity-50"
                        title={!employee.email ? 'Add an email to send invite' : ''}
                      >
                        <Send className="w-3.5 h-3.5" />
                        {invitingEmployeeId === employee.id ? 'Sending...' : employee.invite_status === 'pending' ? 'Resend' : 'Invite to App'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showAddEmployee && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
                <form onSubmit={handleSaveEmployee} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                    <input type="text" value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <input type="tel" value={employeeForm.phone} onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Calendar Color *</label>
                    <p className="text-xs text-gray-500 mb-3">This color will identify bookings assigned to this team member on the calendar</p>
                    <div className="flex items-center gap-4">
                      <input type="color" value={employeeForm.color} onChange={(e) => setEmployeeForm({ ...employeeForm, color: e.target.value })} className="w-20 h-12 rounded-lg border-2 border-gray-200 cursor-pointer" />
                      <div className="flex-1">
                        <input type="text" value={employeeForm.color} onChange={(e) => setEmployeeForm({ ...employeeForm, color: e.target.value })} placeholder="#3b82f6" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none font-mono text-sm" />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {colorPalette.slice(0, 8).map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEmployeeForm({ ...employeeForm, color })}
                            className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${employeeForm.color === color ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900' : 'border-gray-200'}`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Work Days *</label>
                    <div className="grid grid-cols-7 gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                        const dayKey = day.toLowerCase();
                        return (
                          <label key={day} className="flex flex-col items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={employeeForm.workDays[dayKey]}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, workDays: { ...employeeForm.workDays, [dayKey]: e.target.checked } })}
                              className="mb-1"
                            />
                            <span className="text-xs text-gray-600">{day.slice(0, 3)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time *</label>
                      <input type="time" value={employeeForm.workHours.startTime} onChange={(e) => setEmployeeForm({ ...employeeForm, workHours: { ...employeeForm.workHours, startTime: e.target.value } })} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
                      <input type="time" value={employeeForm.workHours.endTime} onChange={(e) => setEmployeeForm({ ...employeeForm, workHours: { ...employeeForm.workHours, endTime: e.target.value } })} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => { setShowAddEmployee(false); setEditingEmployee(null); }} className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                    <button type="submit" disabled={isSavingEmployee} className="flex-1 bg-gradient-to-r from-amber-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                      {isSavingEmployee ? 'Saving...' : (editingEmployee ? 'Update Employee' : 'Add Employee')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showGroupsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Team Groups</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage crews and team groupings</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => { setShowCreateGroupModal(true); setGroupForm({ name: '', selectedEmployees: [] }); setEditingGroup(null); }} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create Group
                    </button>
                    <button type="button" onClick={() => setShowGroupsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <X className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {groups.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No groups yet</h3>
                      <p className="text-gray-600 mb-6">Create your first team group or crew</p>
                      <button type="button" onClick={() => { setShowCreateGroupModal(true); setGroupForm({ name: '', selectedEmployees: [] }); setEditingGroup(null); }} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                        Create First Group
                      </button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {groups.map((group) => (
                        <div key={group.id} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">{group.employee_ids?.length || 0} member{group.employee_ids?.length !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => { setEditingGroup(group); setGroupForm({ name: group.name, selectedEmployees: group.employee_ids || [] }); setShowCreateGroupModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button type="button" onClick={() => handleDeleteGroup(group.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {group.employee_ids && group.employee_ids.length > 0 ? (
                              group.employee_ids.map(empId => {
                                const employee = employees.find(e => e.id === empId);
                                return employee ? (
                                  <div key={empId} className="flex items-center gap-2 bg-white rounded-lg p-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: employee.color }}>
                                      {employee.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{employee.name}</span>
                                  </div>
                                ) : null;
                              })
                            ) : (
                              <p className="text-sm text-gray-500 italic">No members in this group</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showCreateGroupModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-900">{editingGroup ? 'Edit Group' : 'Create New Group'}</h2>
                  <p className="text-sm text-gray-600 mt-1">{editingGroup ? 'Update group details' : 'Create a team group or crew'}</p>
                </div>
                <form onSubmit={handleSaveGroup} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Group Name <span className="text-red-500">*</span></label>
                    <input type="text" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="e.g., Crew 2, Morning Team, Installation Crew" required className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Select Team Members <span className="text-red-500">*</span></label>
                    <div className="border-2 border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                      {employees.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No employees available</div>
                      ) : (
                        employees.map((employee) => (
                          <label key={employee.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                            <input
                              type="checkbox"
                              checked={groupForm.selectedEmployees.includes(employee.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setGroupForm({ ...groupForm, selectedEmployees: [...groupForm.selectedEmployees, employee.id] });
                                } else {
                                  setGroupForm({ ...groupForm, selectedEmployees: groupForm.selectedEmployees.filter(id => id !== employee.id) });
                                }
                              }}
                              className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: employee.color }}>
                              {employee.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{employee.name}</div>
                              {employee.email && <div className="text-xs text-gray-600">{employee.email}</div>}
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                    {groupForm.selectedEmployees.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">{groupForm.selectedEmployees.length} member{groupForm.selectedEmployees.length !== 1 ? 's' : ''} selected</div>
                    )}
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button type="button" onClick={() => { setShowCreateGroupModal(false); setEditingGroup(null); setGroupForm({ name: '', selectedEmployees: [] }); }} className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-600 to-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                      {editingGroup ? 'Update Group' : 'Create Group'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* App Settings Tab */}
      {activeTab === 'app-settings' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Sub-tab nav */}
          <div className="flex border-b border-gray-200 px-6 pt-2">
            <button
              onClick={() => setAppSettingsSubTab('messages')}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors mr-4 ${appSettingsSubTab === 'messages' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              Customer Update Messages
            </button>
            <button
              onClick={() => setAppSettingsSubTab('reminders')}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${appSettingsSubTab === 'reminders' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              Email Reminders
            </button>
          </div>

          <div className="p-6">
          {appSettingsSubTab === 'messages' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Customer Update Messages</h3>
              <p className="text-sm text-gray-600">
                Configure automatic text message prompts sent to customers when employees update booking status.
                Messages are sent from the employee's phone via their native messaging app.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 font-medium mb-1">Available Variables</p>
              <div className="flex flex-wrap gap-2">
                {['{{customerFirstName}}', '{{employeeFirstName}}', '{{businessName}}', '{{serviceName}}'].map(v => (
                  <code key={v} className="px-2 py-1 bg-white rounded text-xs font-mono text-amber-700 border border-amber-200">{v}</code>
                ))}
              </div>
            </div>

            {loadingTemplates ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {statusTemplates.map(template => (
                  <div key={template.status} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-gray-900">
                          {statusLabels[template.status] || template.status}
                        </h4>
                        {template.status === 'progress_update' && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">Pro</span>
                        )}
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={template.enabled}
                          onChange={(e) => handleSaveTemplate(template.status, template.message_template, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>
                    <textarea
                      value={template.message_template}
                      onChange={(e) => {
                        setStatusTemplates(prev => prev.map(t =>
                          t.status === template.status ? { ...t, message_template: e.target.value } : t
                        ));
                      }}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors text-sm resize-none"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => handleSaveTemplate(template.status, template.message_template, template.enabled)}
                        disabled={savingTemplate === template.status}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {savingTemplate === template.status ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Email Reminders Sub-tab */}
          {appSettingsSubTab === 'reminders' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Booking Email Reminders</h3>
                <p className="text-sm text-gray-600">
                  Automatically send reminder emails to customers before their appointment. Defaults are 5 days, 3 days, and 24 hours before.
                </p>
              </div>

              {loadingReminders ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : (
                <div className="space-y-4">
                  {reminders.map(reminder => (
                    <div key={reminder.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={reminder.enabled}
                              onChange={(e) => handleUpdateReminder(reminder.id, { enabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {reminder.hours_before >= 48
                                ? `${reminder.hours_before / 24} days before`
                                : `${reminder.hours_before} hours before`}
                            </p>
                            <p className="text-xs text-gray-500">{reminder.label}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Custom Message (Optional)</label>
                        <textarea
                          value={reminder.custom_message || ''}
                          onChange={(e) => setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, custom_message: e.target.value } : r))}
                          placeholder="Leave blank for default reminder message. Use {{customerName}}, {{serviceName}}, {{date}}, {{time}}, {{businessName}}"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm resize-none"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleUpdateReminder(reminder.id, { custom_message: reminder.custom_message })}
                            disabled={savingReminder === reminder.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            <Save className="w-3 h-3" />
                            {savingReminder === reminder.id ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add custom reminder */}
                  {showAddReminder ? (
                    <div className="flex items-center gap-3 p-4 border-2 border-dashed border-blue-200 rounded-xl">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Hours before appointment</label>
                        <input
                          type="number"
                          min="1"
                          value={newReminderHours}
                          onChange={(e) => setNewReminderHours(e.target.value)}
                          placeholder="e.g. 48 = 2 days before"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                        />
                      </div>
                      <div className="flex gap-2 mt-5">
                        <button onClick={handleAddReminder} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Add</button>
                        <button onClick={() => { setShowAddReminder(false); setNewReminderHours(''); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddReminder(true)}
                      className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Custom Reminder
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && permissionsEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Permissions</h2>
                <p className="text-sm text-gray-600 mt-1">{permissionsEmployee.name}</p>
              </div>
              <button onClick={() => setShowPermissionsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Template Selector */}
              {permissionTemplates.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Apply a Template</p>
                  <div className="flex flex-wrap gap-2">
                    {permissionTemplates.map(t => (
                      <div key={t.id} className="flex items-center gap-1">
                        <button
                          onClick={() => applyTemplate(t)}
                          className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                          {t.name}
                        </button>
                        <button
                          onClick={() => deleteTemplate(t.id)}
                          className="p-1 text-red-400 hover:text-red-600 transition"
                          title="Delete template"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Permission Toggles */}
              <div className="space-y-3">
                {PERMISSION_DEFS.map(perm => (
                  <div key={perm.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 mr-4">
                      <p className="text-sm font-semibold text-gray-900">{perm.label}</p>
                      <p className="text-xs text-gray-500">{perm.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissionsForm[perm.key] || false}
                        onChange={(e) => setPermissionsForm(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Save as Template */}
              {showSaveTemplate ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Template name..."
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-purple-500 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && saveAsTemplate()}
                  />
                  <button onClick={saveAsTemplate} disabled={!templateName.trim()} className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50">
                    Save
                  </button>
                  <button onClick={() => { setShowSaveTemplate(false); setTemplateName(''); }} className="px-3 py-2 text-gray-500 hover:text-gray-700">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSaveTemplate(true)}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                  Save current settings as template
                </button>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={savePermissions}
                  disabled={savingPermissions}
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {savingPermissions ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
