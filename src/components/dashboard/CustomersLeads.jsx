import { useState, useEffect } from 'react';
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
  MoreVertical
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

  // Get current  from active table
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

  const exportToCSV = () => {
  const data = activeTab === 'leads' ? getCurrentLeads() : customers;
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = activeTab === '' 
      ? ['ID', 'Name', 'Status', 'Phone', 'Email', 'Source', 'Notes']
      : ['ID', 'Name', 'Phone', 'Email', 'Service Booked', 'Service Date', 'Left Review', 'Notes'];

    const csvRows = [];
    csvRows.push(headers.join(','));

    data.forEach(record => {
      const values = activeTab === ''
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
    const tableName = activeTab === '' 
      ? leadTables.find(t => t.id === activeLeadTable)?.name || ''
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
        const rows = text.split('\n').map(row => row.trim()).filter(row => row);
        
        if (rows.length < 2) {
          alert('CSV file is empty or invalid');
          return;
        }

        const dataRows = rows.slice(1);
        let successCount = 0;
        let errorCount = 0;

        for (const row of dataRows) {
          const values = row.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g).map(val => 
            val.replace(/^"|"$/g, '').trim()
          );

          if (activeTab === '') {
            const [id, name, status, phone, email, source, notes] = values;
            
            try {
              const response = await authFetch(`${apiUrl}/api/`, {
                method: 'POST',
                body: JSON.stringify({
                  name: name || '',
                  status: status || 'new',
                  phone: phone || '',
                  email: email || '',
                  source: source || 'manual',
                  notes: notes || '',
                  table_id: activeLeadTable
                })
              });

              if (response.ok) {
                successCount++;
              } else {
                errorCount++;
              }
            } catch (error) {
              console.error('Error importing lead:', error);
              errorCount++;
            }
          } else {
            const [id, name, phone, email, last_service, last_service_date, left_review, notes] = values;
            
            try {
              const response = await authFetch(`${apiUrl}/api/customers`, {
                method: 'POST',
                body: JSON.stringify({
                  name: name || '',
                  phone: phone || '',
                  email: email || '',
                  last_service: last_service || '',
                  last_service_date: last_service_date || null,
                  left_review: left_review || 'N',
                  notes: notes || ''
                })
              });

              if (response.ok) {
                successCount++;
              } else {
                errorCount++;
              }
            } catch (error) {
              console.error('Error importing customer:', error);
              errorCount++;
            }
          }
        }

        alert(`Import complete!\nSuccess: ${successCount}\nErrors: ${errorCount}`);
        
        if (activeTab === 'leads') {
          fetchLeads();
        } else {
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
              name: 'Jane Doe',
              phone: '+1987654321',
              email: 'jane.doe@example.com',
              last_service: 'Paint Correction',
              last_service_date: '2024-01-15',
              left_review: 'Y',
              notes: 'Great customer, always on time'
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

  const loadSmsConversation = async (leadId) => {
    try {
      const response = await authFetch(`${apiUrl}/api/leads/${leadId}/sms-conversation`);
      const data = await response.json();
      setSmsConversation(data.messages || []);
    } catch (error) {
      console.error('Error loading SMS conversation:', error);
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
    { key: 'status', label: 'Stage', width: '180px', editable: true, type: 'select', options: ['new', 'contacted_email', 'contacted_sms', 'qualified', 'converted', 'not_interested'] },
    { key: 'phone', label: 'Phone', width: '150px', editable: true },
    { key: 'email', label: 'Email', width: '250px', editable: true },
    { key: 'source', label: 'Source', width: '150px', editable: true, type: 'select', options: ['ai_chat_agent', 'lead_form', 'manual'] },
    { key: 'notes', label: 'Notes', width: '300px', editable: true },
  ];

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

      {/* Table */}
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
    </div>
  );
}

// Keep existing table components
function LeadsTable({ leads, columns, editingCell, editValue, handleCellEdit, setEditValue, saveCellEdit, cancelCellEdit, deleteLead }) {
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
       {leads.map((lead, idx) => (
  <tr key={lead.id} className="hover:bg-gray-50">
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
          <div onClick={() => col.editable && handleCellEdit(lead.id, col.key, lead[col.key])} className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[24px]">
            {col.key === 'status' ? (
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(lead[col.key])}`}>{formatLabel(lead[col.key])}</span>
            ) : col.key === 'source' ? (
              <span className={`px-2 py-1 rounded-full text-xs ${getSourceColor(lead[col.key])}`}>{formatLabel(lead[col.key])}</span>
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
        {/* ⬇️ ADD SMS BUTTON HERE ⬇️ */}
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
        {/* ⬆️ END SMS BUTTON ⬆️ */}
        
        <button onClick={() => deleteLead(lead.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
))}
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
                      customer[col.key] ? new Date(customer[col.key]).toLocaleDateString() : <span className="text-gray-400">-</span>
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
    qualified: 'bg-purple-100 text-purple-700',
    converted: 'bg-emerald-100 text-emerald-700',
    not_interested: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

function getSourceColor(source) {
  const colors = {
    ai_chat_agent: 'bg-purple-100 text-purple-700',
    lead_form: 'bg-blue-100 text-blue-700',
    manual: 'bg-gray-100 text-gray-700',
  };
  return colors[source] || 'bg-gray-100 text-gray-700';
}

function formatLabel(value) {
  if (!value) return '-';
  return value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
