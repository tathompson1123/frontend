import { useState, useEffect, useRef } from 'react';
import {
  Users,
  Mail,
  Phone,
  Search,
  Sparkles,
  Save,
  MessageCircle,
  Send,
  X,
  GripVertical,
  Plus,
  Trash2,
  Filter,
  Download,
  Upload,
  FolderOpen,
  Edit2,
  MoreVertical,
  Gift,
  Trophy,
  Star,
  Settings,
  Clock,
  ChevronDown,
  ChevronUp,
  Bell,
  AlertCircle,
  Calendar,
  Flag
} from 'lucide-react';

export default function CustomersLeads({ user, setCurrentView, apiUrl, authFetch }) {
  const [activeTab, setActiveTab] = useState('leads');
  const [leadTables, setLeadTables] = useState([
    { id: 'default', name: 'All Leads', leads: [] }
  ]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [smsConversation, setSmsConversation] = useState([]);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [newSmsMessage, setNewSmsMessage] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  const [activeLeadTable, setActiveLeadTable] = useState('default');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(null);
  const [newTableName, setNewTableName] = useState('');
  const [editingTableName, setEditingTableName] = useState(null);
  const [newRecord, setNewRecord] = useState({});
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertingLead, setConvertingLead] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationSearch, setConversationSearch] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Rewards state
  const [rewardsConfig, setRewardsConfig] = useState({
    enabled: false,
    bookingsRequired: 5,
    rewardDescription: '',
    couponAfterBooking: false,
    couponDescription: '',
    couponFrequency: 'every',
    smsTiming: 'after_completed',
    smsDelayHours: 1,
    smsTemplate: ''
  });
  const [rewardsCustomers, setRewardsCustomers] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [savingRewards, setSavingRewards] = useState(false);
  const [showRewardsConfig, setShowRewardsConfig] = useState(false);

  // Get current leads from active table
  const getCurrentLeads = () => {
    const table = leadTables.find(t => t.id === activeLeadTable);
    return table ? table.leads : [];
  };

  // Update leads in active table
  const setCurrentLeads = (leads) => {
    setLeadTables(leadTables.map(table => 
      table.id === activeLeadTable ? { ...table, leads } : table
    ));
  };

  const loadSmsConversation = async (leadId) => {
    try {
      const response = await authFetch(`${apiUrl}/api/leads/${leadId}/sms-conversation`);
      const data = await response.json();
      setSmsConversation(data.messages || []);
    } catch (error) {
      console.error('Error loading SMS conversation:', error);
    }
  };

  const exportToCSV = () => {
    const data = activeTab === 'leads' ? getCurrentLeads() : customers;
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = activeTab === 'leads' 
      ? ['ID', 'Name', 'Status', 'Phone', 'Email', 'Source', 'Notes']
      : ['ID', 'Name', 'Phone', 'Email', 'Service Booked', 'Service Date', 'Left Review', 'Notes'];

    const csvRows = [];
    csvRows.push(headers.join(','));

    data.forEach(record => {
      const values = activeTab === 'leads'
        ? [
            record.id,
            `"${record.name || ''}"`,
            record.status || '',
            record.phone || '',
            record.email || '',
            record.source || '',
            `"${record.notes || ''}"`
          ]
        : [
            record.id,
            `"${record.name || ''}"`,
            record.phone || '',
            record.email || '',
            `"${record.last_service || ''}"`,
            record.last_service_date || '',
            record.left_review || '',
            `"${record.notes || ''}"`
          ];
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const tableName = activeTab === 'leads' 
      ? leadTables.find(t => t.id === activeLeadTable)?.name || 'leads'
      : 'customers';
    a.download = `${tableName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const importFromCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;

        // Parse CSV properly — handles quoted fields containing commas
        const parseRow = (row) => {
          const vals = [];
          let cur = '', inQuote = false;
          for (let i = 0; i < row.length; i++) {
            const ch = row[i];
            if (ch === '"') { inQuote = !inQuote; }
            else if (ch === ',' && !inQuote) { vals.push(cur.trim()); cur = ''; }
            else { cur += ch; }
          }
          vals.push(cur.trim());
          return vals;
        };

        const lines = text.split('\n').map(r => r.trim()).filter(r => r);
        if (lines.length < 2) { alert('CSV file is empty or invalid'); return; }

        // Use header row to map columns by name (case-insensitive)
        const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
        const col = (row, ...names) => {
          for (const n of names) {
            const idx = headers.indexOf(n);
            if (idx !== -1 && row[idx]) return row[idx];
          }
          return '';
        };

        const dataRows = lines.slice(1);

        if (activeTab === 'leads') {
          const leads = dataRows
            .map(line => {
              const values = parseRow(line);
              const name = col(values, 'name', 'full_name', 'customer_name');
              if (!name) return null;
              return {
                name,
                status: col(values, 'status') || 'new',
                phone: col(values, 'phone', 'phone_number'),
                email: col(values, 'email', 'email_address'),
                source: col(values, 'source') || 'manual',
                notes: col(values, 'notes'),
              };
            })
            .filter(Boolean);

          const response = await authFetch(`${apiUrl}/api/leads/bulk-import`, {
            method: 'POST',
            body: JSON.stringify({ leads })
          });
          const data = await response.json();
          alert(`Import complete!\nImported: ${data.successCount}\nSkipped: ${data.errorCount}`);
          fetchLeads();
        } else {
          const customers = dataRows
            .map(line => {
              const values = parseRow(line);
              const name = col(values, 'name', 'full_name', 'customer_name');
              if (!name) return null;
              return {
                name,
                phone: col(values, 'phone', 'phone_number'),
                email: col(values, 'email', 'email_address'),
                last_service: col(values, 'last_service', 'service'),
                last_service_date: col(values, 'last_service_date', 'last_visit') || null,
                notes: col(values, 'notes'),
              };
            })
            .filter(Boolean);

          const response = await authFetch(`${apiUrl}/api/customers/bulk-import`, {
            method: 'POST',
            body: JSON.stringify({ customers })
          });
          const data = await response.json();
          alert(`Import complete!\nImported: ${data.successCount}\nSkipped: ${data.errorCount}`);
          fetchCustomers();
        }

      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Failed to parse CSV file. Please check the format.');
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  useEffect(() => {
    fetchLeads();
    fetchCustomers();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${apiUrl}/api/leads`);
      if (response.ok) {
        const data = await response.json();
        const fetchedLeads = data.leads || [];
        
        if (fetchedLeads.length === 0) {
          // Demo data
          setLeadTables([
            {
              id: 'default',
              name: 'All Leads',
              leads: [
                {
                  id: 'demo-1',
                  name: 'John Doe - Test Lead',
                  status: 'new',
                  phone: '+1234567890',
                  email: 'johndoe@example.com',
                  source: 'lead_form',
                  notes: 'This is a test lead — add your first real lead to replace it'
                }
              ]
            }
          ]);
        } else {
          // Group leads by table_id
          const tableMap = new Map();
          fetchedLeads.forEach(lead => {
            const tableId = lead.table_id || 'default';
            if (!tableMap.has(tableId)) {
              tableMap.set(tableId, {
                id: tableId,
                name: lead.table_name || 'All Leads',
                leads: []
              });
            }
            tableMap.get(tableId).leads.push(lead);
          });
          
          setLeadTables(Array.from(tableMap.values()));
        }
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeadTables([
        {
          id: 'default',
          name: 'All Leads',
          leads: [
            {
              id: 'demo-1',
              name: 'John Smith',
              status: 'new',
              phone: '+1234567890',
              email: 'john.smith@example.com',
              source: 'lead_form',
              notes: 'Interested in ceramic coating'
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/customers`);
      if (response.ok) {
        const data = await response.json();
        const fetchedCustomers = data.customers || [];
        if (fetchedCustomers.length === 0) {
          setCustomers([
            {
              id: 'demo-1',
              name: 'John Doe - Test Customer',
              phone: '+1234567890',
              email: 'johndoe@example.com',
              last_service: 'Example Service',
              last_service_date: '2024-01-15',
              left_review: 'N',
              notes: 'This is a test customer — add your first real customer to replace it'
            }
          ]);
        } else {
          setCustomers(fetchedCustomers);
        }
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([
        {
          id: 'demo-1',
          name: 'Jane Doe',
          phone: '+1987654321',
          email: 'jane.doe@example.com',
          last_service: 'Paint Correction',
          last_service_date: '2024-01-15',
          left_review: 'Y',
          notes: 'Great customer, always on time'
        }
      ]);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await authFetch(`${apiUrl}/api/chat/conversations`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchConversationMessages = async (convId) => {
    try {
      setLoadingMessages(true);
      const response = await authFetch(`${apiUrl}/api/chat/conversations/${convId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setConversationMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchRewardsData = async () => {
    try {
      setLoadingRewards(true);
      const [configRes, custRes] = await Promise.all([
        authFetch(`${apiUrl}/api/rewards/config`),
        authFetch(`${apiUrl}/api/rewards/customers`)
      ]);
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.config) {
          setRewardsConfig({
            enabled: configData.config.enabled,
            bookingsRequired: configData.config.bookings_required,
            rewardDescription: configData.config.reward_description || '',
            couponAfterBooking: configData.config.coupon_after_booking,
            couponDescription: configData.config.coupon_description || '',
            couponFrequency: configData.config.coupon_frequency || 'every',
            smsTiming: configData.config.sms_timing || 'after_completed',
            smsDelayHours: configData.config.sms_delay_hours || 1,
            smsTemplate: configData.config.sms_template || ''
          });
        }
      }
      if (custRes.ok) {
        const custData = await custRes.json();
        setRewardsCustomers(custData.customers || []);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoadingRewards(false);
    }
  };

  const saveRewardsConfig = async () => {
    try {
      setSavingRewards(true);
      const response = await authFetch(`${apiUrl}/api/rewards/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rewardsConfig)
      });
      if (response.ok) {
        const data = await response.json();
        alert('Rewards settings saved!');
      }
    } catch (error) {
      console.error('Error saving rewards config:', error);
      alert('Failed to save rewards settings');
    } finally {
      setSavingRewards(false);
    }
  };

  const sendManualSms = async () => {
    if (!newSmsMessage.trim() || !selectedLead) return;
    
    setSendingSms(true);
    try {
      const response = await authFetch(`${apiUrl}/api/leads/${selectedLead.id}/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newSmsMessage })
      });
      
      if (response.ok) {
        setNewSmsMessage('');
        await loadSmsConversation(selectedLead.id);
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('Failed to send SMS');
    } finally {
      setSendingSms(false);
    }
  };

  const createLeadTable = () => {
    if (!newTableName.trim()) return;
    
    const newTable = {
      id: `table-${Date.now()}`,
      name: newTableName.trim(),
      leads: []
    };
    
    setLeadTables([...leadTables, newTable]);
    setActiveLeadTable(newTable.id);
    setNewTableName('');
    setShowAddTableModal(false);
  };

  const renameLeadTable = (tableId, newName) => {
    if (!newName.trim()) return;
    
    setLeadTables(leadTables.map(table => 
      table.id === tableId ? { ...table, name: newName.trim() } : table
    ));
    setEditingTableName(null);
  };

  const deleteLeadTable = (tableId) => {
    if (tableId === 'default') {
      alert('Cannot delete the default table');
      return;
    }
    
    if (!confirm('Delete this lead table? All leads in it will be deleted.')) return;
    
    setLeadTables(leadTables.filter(table => table.id !== tableId));
    if (activeLeadTable === tableId) {
      setActiveLeadTable('default');
    }
    setShowTableMenu(null);
  };

  const updateLeadField = async (leadId, field, value) => {
    try {
      const response = await authFetch(`${apiUrl}/api/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value })
      });
      if (response.ok) {
        const currentLeads = getCurrentLeads();
        setCurrentLeads(currentLeads.map(l => l.id === leadId ? { ...l, [field]: value } : l));
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const updateCustomerField = async (customerId, field, value) => {
    try {
      const response = await authFetch(`${apiUrl}/api/customers/${customerId}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value })
      });
      if (response.ok) {
        setCustomers(customers.map(c => c.id === customerId ? { ...c, [field]: value } : c));
      }
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handleCellEdit = (id, field, currentValue) => {
    setEditingCell({ id, field });
    setEditValue(currentValue || '');
  };

  const saveCellEdit = () => {
    if (editingCell) {
      if (activeTab === 'leads') {
        updateLeadField(editingCell.id, editingCell.field, editValue);
      } else {
        updateCustomerField(editingCell.id, editingCell.field, editValue);
      }
      setEditingCell(null);
      setEditValue('');
    }
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const addRecord = async () => {
    try {
      if (activeTab === 'leads') {
        const response = await authFetch(`${apiUrl}/api/leads`, {
          method: 'POST',
          body: JSON.stringify({
            name: newRecord.name || '',
            email: newRecord.email || '',
            phone: newRecord.phone || '',
            status: newRecord.status || 'new',
            source: newRecord.source || 'manual',
            notes: newRecord.notes || '',
            table_id: activeLeadTable
          })
        });

        const data = await response.json();

        if (response.ok) {
          const currentLeads = getCurrentLeads();
          setCurrentLeads([...currentLeads.filter(l => !String(l.id).startsWith('demo')), data.lead]);
          setShowAddModal(false);
          setNewRecord({});
          alert('Lead added successfully!');
          // Mark onboarding step 5 complete
          window.dispatchEvent(new CustomEvent('onboarding-step-complete', {
            detail: { step: 5 }
          }));
        } else {
          alert(`Failed to add lead: ${data.error || 'Unknown error'}`);
        }
      } else {
        const response = await authFetch(`${apiUrl}/api/customers`, {
          method: 'POST',
          body: JSON.stringify({
            name: newRecord.name || '',
            email: newRecord.email || '',
            phone: newRecord.phone || '',
            last_service: newRecord.last_service || '',
            last_service_date: newRecord.last_service_date || null,
            left_review: newRecord.left_review || 'N',
            notes: newRecord.notes || ''
          })
        });

        const data = await response.json();

        if (response.ok) {
          setCustomers([...customers.filter(c => !String(c.id).startsWith('demo')), data.customer]);
          setShowAddModal(false);
          setNewRecord({});
          alert('Customer added successfully!');
          // Mark onboarding step 5 complete
          window.dispatchEvent(new CustomEvent('onboarding-step-complete', {
            detail: { step: 5 }
          }));
        } else {
          alert(`Failed to add customer: ${data.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error adding record:', error);
      alert('Failed to add record. Check console for details.');
    }
  };

  const deleteLead = async (leadId) => {
    if (String(leadId).startsWith('demo')) {
      alert('Cannot delete demo data');
      return;
    }
    if (!confirm('Delete this lead?')) return;
    try {
      const response = await authFetch(`${apiUrl}/api/leads/${leadId}`, { method: 'DELETE' });
      if (response.ok) {
        const currentLeads = getCurrentLeads();
        setCurrentLeads(currentLeads.filter(l => l.id !== leadId));
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const deleteCustomer = async (customerId) => {
    if (String(customerId).startsWith('demo')) {
      alert('Cannot delete demo data');
      return;
    }
    if (!confirm('Delete this customer?')) return;
    try {
      const response = await authFetch(`${apiUrl}/api/customers/${customerId}`, { method: 'DELETE' });
      if (response.ok) setCustomers(customers.filter(c => c.id !== customerId));
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const convertLeadToCustomer = async () => {
    if (!convertingLead) return;

    setIsConverting(true);
    try {
      const response = await authFetch(`${apiUrl}/api/leads/${convertingLead.id}/convert`, {
        method: 'POST',
        body: JSON.stringify({
          notes: convertingLead.notes || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Add new customer to list
        setCustomers([...customers, data.customer]);
        // Remove lead from current table
        const currentLeads = getCurrentLeads();
        setCurrentLeads(currentLeads.filter(l => l.id !== convertingLead.id));
        // Close modal
        setShowConvertModal(false);
        setConvertingLead(null);
        // Switch to customers tab
        setActiveTab('customers');
        alert('Lead converted to customer successfully!');
      } else {
        const error = await response.json();
        alert('Failed to convert: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error converting lead:', error);
      alert('Failed to convert lead');
    } finally {
      setIsConverting(false);
    }
  };

  const currentLeads = getCurrentLeads();
  const filteredLeads = currentLeads.filter(lead =>
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm) ||
    lead.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const leadStats = {
    total: currentLeads.length,
    new: currentLeads.filter(l => l.status === 'new').length,
    contacted: currentLeads.filter(l => l.status === 'contacted_email' || l.status === 'contacted_sms').length,
    converted: currentLeads.filter(l => l.status === 'converted').length,
  };

  const customerStats = {
    total: customers.length,
    active: customers.filter(c => c.total_jobs > 0).length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0),
  };

  const leadColumns = [
    { key: 'name', label: 'Name', width: '200px', editable: true },
    { key: 'created_at', label: 'Date In', width: '140px', editable: false, type: 'datetime' },
    { key: 'status', label: 'Stage', width: '180px', editable: true, type: 'select', options: ['new', 'contacted_email', 'contacted_sms', 'qualified', 'converted', 'not_interested'] },
    { key: 'priority', label: 'Priority', width: '120px', editable: true, type: 'select', options: ['low', 'normal', 'high', 'urgent'] },
    { key: 'follow_up_date', label: 'Follow-Up', width: '140px', editable: true, type: 'date' },
    { key: 'phone', label: 'Phone', width: '150px', editable: true },
    { key: 'email', label: 'Email', width: '250px', editable: true },
    { key: 'source', label: 'Source', width: '150px', editable: true, type: 'select', options: ['ai_chat_agent', 'lead_form', 'manual'] },
    { key: 'notes', label: 'Notes', width: '300px', editable: true },
  ];

  // Returns age info for a lead — used for "Needs Check-Up" flagging
  const getLeadAgeFlag = (lead) => {
    if (!lead.created_at) return null;
    const terminalStatuses = ['converted', 'not_interested'];
    if (terminalStatuses.includes(lead.status)) return null;
    const ageMs = Date.now() - new Date(lead.created_at).getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    if (ageDays >= 14) return { label: 'Needs Check-Up', days: ageDays, level: 'urgent' };
    if (ageDays >= 7) return { label: 'Follow Up', days: ageDays, level: 'warn' };
    return null;
  };

  // Returns true if a lead's follow_up_date is today or in the past
  const isFollowUpOverdue = (lead) => {
    if (!lead.follow_up_date) return false;
    return new Date(lead.follow_up_date) <= new Date();
  };

  const customerColumns = [
    { key: 'name', label: 'Name', width: '200px', editable: true },
    { key: 'phone', label: 'Phone', width: '150px', editable: true },
    { key: 'email', label: 'Email', width: '250px', editable: true },
    { key: 'last_service', label: 'Service Booked', width: '200px', editable: true },
    { key: 'last_service_date', label: 'Service Date', width: '150px', editable: true, type: 'date' },
    { key: 'left_review', label: 'Left Review', width: '120px', editable: true, type: 'select', options: ['Y', 'N'] },
    { key: 'notes', label: 'Notes', width: '300px', editable: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers & Leads</h1>
            <p className="text-gray-600 mt-1">Manage your customer relationships</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => { setActiveTab('leads'); setSearchTerm(''); setEditingCell(null); }}
              className={`px-8 py-4 font-semibold transition-all relative ${activeTab === 'leads' ? 'text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Leads ({leadTables.reduce((sum, t) => sum + t.leads.length, 0)})
              </div>
              {activeTab === 'leads' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
            <button
              onClick={() => { setActiveTab('customers'); setSearchTerm(''); setEditingCell(null); }}
              className={`px-8 py-4 font-semibold transition-all relative ${activeTab === 'customers' ? 'text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Customers ({customerStats.total})
              </div>
              {activeTab === 'customers' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
            <button
              onClick={() => { setActiveTab('conversations'); setSearchTerm(''); setEditingCell(null); fetchConversations(); }}
              className={`px-8 py-4 font-semibold transition-all relative ${activeTab === 'conversations' ? 'text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Conversations
              </div>
              {activeTab === 'conversations' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
            <button
              onClick={() => { setActiveTab('rewards'); setSearchTerm(''); setEditingCell(null); fetchRewardsData(); }}
              className={`px-8 py-4 font-semibold transition-all relative ${activeTab === 'rewards' ? 'text-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Rewards
              </div>
              {activeTab === 'rewards' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
          </div>
        </div>

        {/* Lead Tables Tabs (only show when on leads tab) */}
        {activeTab === 'leads' && (
          <div className="border-b border-gray-200 bg-white px-6">
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {leadTables.map((table) => (
                <div key={table.id} className="relative group">
                  <button
                    onClick={() => setActiveLeadTable(table.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeLeadTable === table.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      {editingTableName === table.id ? (
                        <input
                          type="text"
                          defaultValue={table.name}
                          onBlur={(e) => renameLeadTable(table.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') renameLeadTable(table.id, e.target.value);
                            if (e.key === 'Escape') setEditingTableName(null);
                          }}
                          className="px-2 py-1 border border-blue-500 rounded text-sm w-40"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          {table.name}
                          <span className="text-xs opacity-60">({table.leads.length})</span>
                        </>
                      )}
                    </div>
                  </button>
                  
                  {/* Table Menu */}
                  {activeLeadTable === table.id && table.id !== 'default' && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTableMenu(showTableMenu === table.id ? null : table.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {showTableMenu === table.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-40">
                          <button
                            onClick={() => {
                              setEditingTableName(table.id);
                              setShowTableMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Rename
                          </button>
                          <button
                            onClick={() => deleteLeadTable(table.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add Table Button */}
              <button
                onClick={() => setShowAddTableModal(true)}
                className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all whitespace-nowrap flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Table
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Needs Attention banner — only on Leads tab */}
      {activeTab === 'leads' && (() => {
        const allLeads = leadTables.flatMap(t => t.leads);
        const urgentCount = allLeads.filter(l => getLeadAgeFlag(l)?.level === 'urgent').length;
        const warnCount = allLeads.filter(l => getLeadAgeFlag(l)?.level === 'warn').length;
        const overdueCount = allLeads.filter(l => isFollowUpOverdue(l)).length;
        if (urgentCount === 0 && warnCount === 0 && overdueCount === 0) return null;
        return (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center gap-4 flex-wrap">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-800">Leads need attention:</span>
            {urgentCount > 0 && <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{urgentCount} overdue (14+ days)</span>}
            {warnCount > 0 && <span className="text-sm bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{warnCount} need follow-up (7+ days)</span>}
            {overdueCount > 0 && <span className="text-sm bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{overdueCount} follow-up date passed</span>}
          </div>
        );
      })()}

      {/* Table (leads/customers) */}
      {(activeTab === 'leads' || activeTab === 'customers') && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <label className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={importFromCSV}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                setShowAddModal(true);
                setNewRecord({});
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add {activeTab === 'leads' ? 'Lead' : 'Customer'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading...</p>
            </div>
          ) : activeTab === 'leads' ? (
            <LeadsTable
              leads={filteredLeads}
              columns={leadColumns}
              editingCell={editingCell}
              editValue={editValue}
              handleCellEdit={handleCellEdit}
              setEditValue={setEditValue}
              saveCellEdit={saveCellEdit}
              cancelCellEdit={cancelCellEdit}
              deleteLead={deleteLead}
              setSelectedLead={setSelectedLead}
              loadSmsConversation={loadSmsConversation}
              setShowSmsModal={setShowSmsModal}
              setConvertingLead={setConvertingLead}
              setShowConvertModal={setShowConvertModal}
              updateLeadField={updateLeadField}
              getLeadAgeFlag={getLeadAgeFlag}
              isFollowUpOverdue={isFollowUpOverdue}
            />
          ) : (
            <CustomersTable
              customers={filteredCustomers}
              columns={customerColumns}
              editingCell={editingCell}
              editValue={editValue}
              handleCellEdit={handleCellEdit}
              setEditValue={setEditValue}
              saveCellEdit={saveCellEdit}
              cancelCellEdit={cancelCellEdit}
              deleteCustomer={deleteCustomer}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-sm text-gray-600">
          {activeTab === 'leads' ? filteredLeads.length : filteredCustomers.length} records
        </div>
      </div>
      )}

      {/* Conversations Tab */}
      {activeTab === 'conversations' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex" style={{ height: '700px' }}>
          {/* Conversation List */}
          <div className="w-96 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={conversationSearch}
                  onChange={(e) => setConversationSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-3 text-sm">Loading...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No conversations yet</p>
                  <p className="text-gray-400 text-xs mt-1">Chat conversations from your website will appear here</p>
                </div>
              ) : (
                conversations
                  .filter(c => !conversationSearch || (c.first_message || '').toLowerCase().includes(conversationSearch.toLowerCase()))
                  .map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      fetchConversationMessages(conv.id);
                      setTimeout(() => {
                        if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = 0;
                      }, 50);
                    }}
                    className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition ${
                      selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        Conversation #{conv.id}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        conv.source === 'embed' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {conv.source === 'embed' ? 'Website Chat Agent' : 'SMS Text Agent'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {conv.first_message || 'No messages'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(conv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {new Date(conv.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          conv.outcome === 'booked' ? 'bg-green-100 text-green-700' :
                          conv.outcome === 'no_response' ? 'bg-gray-100 text-gray-500' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {conv.outcome === 'booked' ? 'Booked' :
                           conv.outcome === 'no_response' ? "Didn't respond" :
                           "Didn't book"}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 flex flex-col">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Select a conversation</p>
                  <p className="text-gray-400 text-sm mt-1">Choose a conversation from the list to view messages</p>
                </div>
              </div>
            ) : (
              <>
                {/* Thread Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Conversation #{selectedConversation.id}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(selectedConversation.created_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        {' '} &middot; {selectedConversation.source === 'embed' ? 'Website Chat Agent' : 'SMS Text Agent'}
                      </p>
                    </div>
                    <button
                      onClick={() => { setSelectedConversation(null); setConversationMessages([]); }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
                  {loadingMessages ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : conversationMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400 text-sm">No messages in this conversation</p>
                    </div>
                  ) : (
                    conversationMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            msg.role === 'user'
                              ? 'bg-white border border-gray-200 text-gray-900'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          <div className={`text-xs font-medium mb-1 ${msg.role === 'user' ? 'text-gray-400' : 'text-blue-100'}`}>
                            {msg.role === 'user' ? 'Customer' : 'AI Agent'}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-gray-400' : 'text-blue-200'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {/* Rewards Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <button
              onClick={() => setShowRewardsConfig(!showRewardsConfig)}
              className="w-full flex items-center justify-between p-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Rewards Program Settings</h3>
                  <p className="text-sm text-gray-500">Configure your loyalty rewards program</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${rewardsConfig.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {rewardsConfig.enabled ? 'Active' : 'Inactive'}
                </span>
                {showRewardsConfig ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </button>

            {showRewardsConfig && (
              <div className="px-6 pb-6 space-y-6 border-t border-gray-100 pt-6">
                {/* Enable toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-900">Enable Rewards Program</label>
                    <p className="text-sm text-gray-500">Automatically reward loyal customers</p>
                  </div>
                  <button
                    onClick={() => setRewardsConfig({ ...rewardsConfig, enabled: !rewardsConfig.enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rewardsConfig.enabled ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rewardsConfig.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Milestone Reward */}
                <div className="bg-amber-50 rounded-xl p-5 space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-600" />
                    Milestone Reward
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bookings required to earn reward</label>
                      <input
                        type="number"
                        min="2"
                        max="50"
                        value={rewardsConfig.bookingsRequired}
                        onChange={(e) => setRewardsConfig({ ...rewardsConfig, bookingsRequired: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
                        onBlur={(e) => { if (!e.target.value || parseInt(e.target.value) < 2) setRewardsConfig(c => ({ ...c, bookingsRequired: 5 })); }}
                        onDoubleClick={(e) => e.target.select()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reward description</label>
                      <input
                        type="text"
                        value={rewardsConfig.rewardDescription}
                        onChange={(e) => setRewardsConfig({ ...rewardsConfig, rewardDescription: e.target.value })}
                        placeholder="e.g., Free interior detail, 50% off next service"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Coupon After Booking */}
                <div className="bg-green-50 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Star className="w-5 h-5 text-green-600" />
                      Return Coupon
                    </h4>
                    <button
                      onClick={() => setRewardsConfig({ ...rewardsConfig, couponAfterBooking: !rewardsConfig.couponAfterBooking })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rewardsConfig.couponAfterBooking ? 'bg-green-600' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rewardsConfig.couponAfterBooking ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {rewardsConfig.couponAfterBooking && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Coupon offer</label>
                        <input
                          type="text"
                          value={rewardsConfig.couponDescription}
                          onChange={(e) => setRewardsConfig({ ...rewardsConfig, couponDescription: e.target.value })}
                          placeholder="e.g., 10% off your next booking"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                        <select
                          value={rewardsConfig.couponFrequency}
                          onChange={(e) => setRewardsConfig({ ...rewardsConfig, couponFrequency: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="every">After every booking</option>
                          <option value="every_other">Every other booking</option>
                          <option value="every_third">Every 3rd booking</option>
                          <option value="first_only">First booking only</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* SMS Timing */}
                <div className="bg-blue-50 rounded-xl p-5 space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    SMS Delivery Timing
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">When to send reward/coupon text</label>
                      <select
                        value={rewardsConfig.smsTiming}
                        onChange={(e) => setRewardsConfig({ ...rewardsConfig, smsTiming: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="after_completed">After job is completed</option>
                        <option value="after_booking">Right after booking</option>
                        <option value="delay_after_booking">Delayed after booking</option>
                        <option value="delay_after_completed">Delayed after completion</option>
                      </select>
                    </div>
                    {(rewardsConfig.smsTiming === 'delay_after_booking' || rewardsConfig.smsTiming === 'delay_after_completed') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delay (hours)</label>
                        <input
                          type="number"
                          min="1"
                          max="168"
                          value={rewardsConfig.smsDelayHours}
                          onChange={(e) => setRewardsConfig({ ...rewardsConfig, smsDelayHours: parseInt(e.target.value) || 1 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMS template (optional)</label>
                    <textarea
                      value={rewardsConfig.smsTemplate}
                      onChange={(e) => setRewardsConfig({ ...rewardsConfig, smsTemplate: e.target.value })}
                      placeholder="e.g., Hey {name}! Thanks for being a loyal customer. Here's your reward: {reward}. Book your next appointment today!"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">Use {'{name}'} for customer name, {'{reward}'} for reward description, {'{bookings}'} for booking count</p>
                  </div>
                </div>

                <button
                  onClick={saveRewardsConfig}
                  disabled={savingRewards}
                  className="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {savingRewards ? 'Saving...' : 'Save Rewards Settings'}
                </button>
              </div>
            )}
          </div>

          {/* Customer Rewards Tracker */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                Customer Progress
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Track how close each customer is to earning their reward ({rewardsConfig.bookingsRequired} bookings needed)
              </p>
            </div>

            {loadingRewards ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                <p className="text-gray-500 mt-3 text-sm">Loading...</p>
              </div>
            ) : rewardsCustomers.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No customers with bookings yet</p>
                <p className="text-gray-400 text-xs mt-1">Customers will appear here after their first booking</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {rewardsCustomers.map(customer => {
                  const progress = Math.min((customer.booking_count / rewardsConfig.bookingsRequired) * 100, 100);
                  const earned = customer.booking_count >= rewardsConfig.bookingsRequired;
                  return (
                    <div key={customer.id} className={`p-4 flex items-center gap-4 ${earned ? 'bg-amber-50' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${earned ? 'bg-amber-200' : 'bg-gray-100'}`}>
                        {earned ? <Trophy className="w-5 h-5 text-amber-700" /> : <Users className="w-5 h-5 text-gray-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">{customer.name}</span>
                          {earned && (
                            <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-semibold rounded-full">Reward Earned!</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          {customer.email && <span>{customer.email}</span>}
                          {customer.phone && <span>{customer.phone}</span>}
                          {customer.last_service && <span>Last: {customer.last_service}</span>}
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${earned ? 'bg-amber-500' : 'bg-blue-500'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                            {customer.booking_count} / {rewardsConfig.bookingsRequired}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-900">${Number(customer.lifetime_value || 0).toFixed(0)}</p>
                        <p className="text-xs text-gray-400">lifetime</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddTableModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Lead Table</h2>
              <button onClick={() => setShowAddTableModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table Name *</label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Ceramic Coating Leads"
                  onKeyDown={(e) => e.key === 'Enter' && createLeadTable()}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAddTableModal(false);
                    setNewTableName('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createLeadTable}
                  disabled={!newTableName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Add New {activeTab === 'leads' ? 'Lead' : 'Customer'}
                {activeTab === 'leads' && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    to {leadTables.find(t => t.id === activeLeadTable)?.name}
                  </span>
                )}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewRecord({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {activeTab === 'leads' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newRecord.name || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newRecord.email || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newRecord.phone || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                    <select
                      value={newRecord.status || 'new'}
                      onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="new">New</option>
                      <option value="contacted_email">Contacted (Email)</option>
                      <option value="contacted_sms">Contacted (SMS)</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted</option>
                      <option value="not_interested">Not Interested</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <select
                      value={newRecord.source || 'manual'}
                      onChange={(e) => setNewRecord({ ...newRecord, source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="manual">Manual</option>
                      <option value="lead_form">Lead Form</option>
                      <option value="ai_chat_agent">AI Chat Agent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={newRecord.notes || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Add any notes..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newRecord.name || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newRecord.email || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newRecord.phone || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Booked</label>
                    <input
                      type="text"
                      value={newRecord.last_service || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, last_service: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Paint Correction"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Date</label>
                    <input
                      type="date"
                      value={newRecord.last_service_date || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, last_service_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Left Review</label>
                    <select
                      value={newRecord.left_review || 'N'}
                      onChange={(e) => setNewRecord({ ...newRecord, left_review: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={newRecord.notes || ''}
                      onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Add any notes..."
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewRecord({});
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addRecord}
                  disabled={!newRecord.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add {activeTab === 'leads' ? 'Lead' : 'Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMS Modal */}
      {showSmsModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold">SMS Conversation</h2>
                <p className="text-green-100 mt-1">{selectedLead.name} • {selectedLead.phone}</p>
              </div>
              <button
                onClick={() => {
                  setShowSmsModal(false);
                  setSelectedLead(null);
                  setSmsConversation([]);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {smsConversation.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No SMS messages yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {smsConversation.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          msg.direction === 'outgoing'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                            : 'bg-white text-gray-900 shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p
                          className={`text-xs mt-2 ${
                            msg.direction === 'outgoing' ? 'text-green-100' : 'text-gray-500'
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSmsMessage}
                  onChange={(e) => setNewSmsMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendManualSms()}
                  placeholder="Type your message..."
                  maxLength="320"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                />
                <button
                  onClick={sendManualSms}
                  disabled={sendingSms || !newSmsMessage.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sendingSms ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">{newSmsMessage.length} / 320 characters</p>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Customer Modal */}
      {showConvertModal && convertingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="bg-gradient-to-r from-amber-600 to-blue-600 text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold">Convert to Customer</h2>
              <p className="text-amber-100 mt-1">{convertingLead.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Lead Information</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Name:</span> {convertingLead.name}</p>
                  <p><span className="font-medium">Email:</span> {convertingLead.email || '-'}</p>
                  <p><span className="font-medium">Phone:</span> {convertingLead.phone || '-'}</p>
                  <p><span className="font-medium">Source:</span> {convertingLead.source || 'manual'}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                This will create a new customer record and mark the lead as converted.
              </p>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowConvertModal(false);
                  setConvertingLead(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={convertLeadToCustomer}
                disabled={isConverting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-blue-600 text-white rounded-lg hover:from-amber-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isConverting ? (
                  <>Converting...</>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Convert
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// LeadsTable component
function LeadsTable({ leads, columns, editingCell, editValue, handleCellEdit, setEditValue, saveCellEdit, cancelCellEdit, deleteLead, setSelectedLead, loadSmsConversation, setShowSmsModal, setConvertingLead, setShowConvertModal, updateLeadField, getLeadAgeFlag, isFollowUpOverdue }) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads in this table</h3>
        <p className="text-gray-600">Add your first lead to get started</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
          {columns.map((col) => (
            <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: col.width }}>
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                {col.label}
              </div>
            </th>
          ))}
          <th className="w-12 px-4 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {leads.map((lead, idx) => {
          const ageFlag = getLeadAgeFlag ? getLeadAgeFlag(lead) : null;
          const followUpOverdue = isFollowUpOverdue ? isFollowUpOverdue(lead) : false;
          return (
          <tr key={lead.id} className={`hover:bg-gray-50 ${ageFlag?.level === 'urgent' ? 'bg-red-50' : ageFlag?.level === 'warn' ? 'bg-amber-50' : ''}`}>
            <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
            {columns.map((col) => (
              <td key={col.key} className="px-4 py-3 text-sm">
                {editingCell?.id === lead.id && editingCell?.field === col.key ? (
                  <div className="flex items-center gap-2">
                    {col.type === 'select' ? (
                      <select value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-2 py-1 border border-blue-500 rounded text-sm" autoFocus>
                        <option value="">Select...</option>
                        {col.options.map(opt => <option key={opt} value={opt}>{formatLabel(opt)}</option>)}
                      </select>
                    ) : col.type === 'date' ? (
                      <input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-2 py-1 border border-blue-500 rounded text-sm"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(); if (e.key === 'Escape') cancelCellEdit(); }}
                      />
                    ) : (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-2 py-1 border border-blue-500 rounded text-sm"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(); if (e.key === 'Escape') cancelCellEdit(); }}
                      />
                    )}
                    <button onClick={saveCellEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save className="w-4 h-4" /></button>
                    <button onClick={cancelCellEdit} className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div onClick={() => col.editable && handleCellEdit(lead.id, col.key, lead[col.key] || '')} className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[24px]">
                    {col.key === 'name' ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{lead.name || <span className="text-gray-400">-</span>}</span>
                        {ageFlag && (
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            ageFlag.level === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            <AlertCircle className="w-3 h-3" />
                            {ageFlag.label}
                          </span>
                        )}
                      </div>
                    ) : col.key === 'status' ? (
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(lead[col.key])}`}>{formatLabel(lead[col.key])}</span>
                    ) : col.key === 'priority' ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        lead.priority === 'urgent' ? 'bg-red-100 text-red-700'
                        : lead.priority === 'high' ? 'bg-orange-100 text-orange-700'
                        : lead.priority === 'low' ? 'bg-gray-100 text-gray-500'
                        : 'bg-blue-50 text-blue-600'
                      }`}>{formatLabel(lead.priority || 'normal')}</span>
                    ) : col.key === 'follow_up_date' ? (
                      lead.follow_up_date ? (
                        <span className={`flex items-center gap-1 text-xs font-medium ${followUpOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                          {followUpOverdue && <Bell className="w-3 h-3" />}
                          {new Date(lead.follow_up_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      ) : <span className="text-gray-400 text-xs">Set date</span>
                    ) : col.key === 'source' ? (
                      <span className={`px-2 py-1 rounded-full text-xs ${getSourceColor(lead[col.key])}`}>{formatLabel(lead[col.key])}</span>
                    ) : col.type === 'datetime' ? (
                      lead[col.key] ? (
                        <span className="text-gray-600 text-xs">
                          {new Date(lead[col.key]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      ) : <span className="text-gray-400">-</span>
                    ) : col.key === 'email' ? (
                      <a href={`mailto:${lead[col.key]}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>{lead[col.key]}</a>
                    ) : col.key === 'phone' ? (
                      <a href={`tel:${lead[col.key]}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>{lead[col.key]}</a>
                    ) : (
                      lead[col.key] || <span className="text-gray-400">-</span>
                    )}
                  </div>
                )}
              </td>
            ))}
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                {lead.phone && (
                  <button
                    onClick={() => {
                      setSelectedLead(lead);
                      loadSmsConversation(lead.id);
                      setShowSmsModal(true);
                    }}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                    title="View SMS Conversation"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => {
                    setConvertingLead(lead);
                    setShowConvertModal(true);
                  }}
                  className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                  title="Convert to Customer"
                >
                  <Users className="w-4 h-4" />
                </button>

                <button onClick={() => deleteLead(lead.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete Lead">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          );
        })}
      </tbody>
    </table>
  );
} 

function CustomersTable({ customers, columns, editingCell, editValue, handleCellEdit, setEditValue, saveCellEdit, cancelCellEdit, deleteCustomer }) {
  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers yet</h3>
        <p className="text-gray-600">Convert leads or add bookings</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
          {columns.map((col) => (
            <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: col.width }}>
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                {col.label}
              </div>
            </th>
          ))}
          <th className="w-12 px-4 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {customers.map((customer, idx) => (
          <tr key={customer.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
            {columns.map((col) => (
              <td key={col.key} className="px-4 py-3 text-sm">
                {editingCell?.id === customer.id && editingCell?.field === col.key ? (
                  <div className="flex items-center gap-2">
                    {col.type === 'select' ? (
                      <select value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-2 py-1 border border-blue-500 rounded text-sm" autoFocus>
                        {col.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        type={col.type === 'date' ? 'date' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-2 py-1 border border-blue-500 rounded text-sm"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(); if (e.key === 'Escape') cancelCellEdit(); }}
                      />
                    )}
                    <button onClick={saveCellEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save className="w-4 h-4" /></button>
                    <button onClick={cancelCellEdit} className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div onClick={() => col.editable && handleCellEdit(customer.id, col.key, customer[col.key])} className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[24px]">
                    {col.key === 'left_review' ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${customer[col.key] === 'Y' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {customer[col.key] || 'N'}
                      </span>
                    ) : col.key === 'email' ? (
                      <a href={`mailto:${customer[col.key]}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>{customer[col.key]}</a>
                    ) : col.key === 'phone' ? (
                      <a href={`tel:${customer[col.key]}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>{customer[col.key]}</a>
                    ) : col.key === 'last_service_date' ? (
                      customer[col.key] ? (() => { const d = customer[col.key].toString().slice(0, 10).split('-'); return new Date(d[0], d[1] - 1, d[2]).toLocaleDateString(); })() : <span className="text-gray-400">-</span>
                    ) : (
                      customer[col.key] || <span className="text-gray-400">-</span>
                    )}
                  </div>
                )}
              </td>
            ))}
            <td className="px-4 py-3">
              <button onClick={() => deleteCustomer(customer.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function getStatusColor(status) {
  const colors = {
    new: 'bg-yellow-100 text-yellow-700',
    contacted_email: 'bg-blue-100 text-blue-700',
    contacted_sms: 'bg-green-100 text-green-700',
    qualified: 'bg-amber-100 text-amber-700',
    converted: 'bg-emerald-100 text-emerald-700',
    not_interested: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

function getSourceColor(source) {
  const colors = {
    ai_chat_agent: 'bg-amber-100 text-amber-700',
    lead_form: 'bg-blue-100 text-blue-700',
    manual: 'bg-gray-100 text-gray-700',
  };
  return colors[source] || 'bg-gray-100 text-gray-700';
}

function formatLabel(value) {
  if (!value) return '-';
  return value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
