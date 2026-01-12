import { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  Phone, 
  Search,
  Sparkles,
  Save,
  X,
  GripVertical,
  Plus,
  Trash2,
  Filter
} from 'lucide-react';

export default function CustomersLeads({ user, setCurrentView, apiUrl, authFetch }) {
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({});

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
        // Add sample data if empty for demonstration
        const fetchedLeads = data.leads || [];
        if (fetchedLeads.length === 0) {
          setLeads([
            {
              id: 1,
              name: 'John Smith',
              status: 'new',
              phone: '+1234567890',
              email: 'john.smith@example.com',
              source: 'lead_form',
              notes: 'Interested in HVAC installation'
            }
          ]);
        } else {
          setLeads(fetchedLeads);
        }
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      // Show sample data on error for demonstration
      setLeads([
        {
          id: 1,
          name: 'John Smith',
          status: 'new',
          phone: '+1234567890',
          email: 'john.smith@example.com',
          source: 'lead_form',
          notes: 'Interested in HVAC installation'
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
        // Add sample data if empty for demonstration
        const fetchedCustomers = data.customers || [];
        if (fetchedCustomers.length === 0) {
          setCustomers([
            {
              id: 1,
              name: 'Jane Doe',
              phone: '+1987654321',
              email: 'jane.doe@example.com',
              last_service: 'HVAC Maintenance',
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
      // Show sample data on error for demonstration
      setCustomers([
        {
          id: 1,
          name: 'Jane Doe',
          phone: '+1987654321',
          email: 'jane.doe@example.com',
          last_service: 'HVAC Maintenance',
          last_service_date: '2024-01-15',
          left_review: 'Y',
          notes: 'Great customer, always on time'
        }
      ]);
    }
  };

  const updateLeadField = async (leadId, field, value) => {
    try {
      const response = await authFetch(`${apiUrl}/api/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value })
      });
      if (response.ok) {
        setLeads(leads.map(l => l.id === leadId ? { ...l, [field]: value } : l));
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
        // Add new lead
        const response = await authFetch(`${apiUrl}/api/leads`, {
          method: 'POST',
          body: JSON.stringify({
            name: newRecord.name || '',
            email: newRecord.email || '',
            phone: newRecord.phone || '',
            status: newRecord.status || 'new',
            source: newRecord.source || 'manual',
            notes: newRecord.notes || ''
          })
        });

        if (response.ok) {
          const data = await response.json();
          setLeads([...leads, data.lead]);
          setShowAddModal(false);
          setNewRecord({});
        } else {
          alert('Failed to add lead');
        }
      } else {
        // Add new customer
        const response = await authFetch(`${apiUrl}/api/customers`, {
          method: 'POST',
          body: JSON.stringify({
            name: newRecord.name || '',
            email: newRecord.email || '',
            phone: newRecord.phone || '',
            last_service: newRecord.last_service || '',
            last_service_date: newRecord.last_service_date || '',
            left_review: newRecord.left_review || 'N',
            notes: newRecord.notes || ''
          })
        });

        if (response.ok) {
          const data = await response.json();
          setCustomers([...customers, data.customer]);
          setShowAddModal(false);
          setNewRecord({});
        } else {
          alert('Failed to add customer');
        }
      }
    } catch (error) {
      console.error('Error adding record:', error);
      alert('Failed to add record');
    }
  };

  const deleteLead = async (leadId) => {
    if (!confirm('Delete this lead?')) return;
    try {
      const response = await authFetch(`${apiUrl}/api/leads/${leadId}`, { method: 'DELETE' });
      if (response.ok) setLeads(leads.filter(l => l.id !== leadId));
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const deleteCustomer = async (customerId) => {
    if (!confirm('Delete this customer?')) return;
    try {
      const response = await authFetch(`${apiUrl}/api/customers/${customerId}`, { method: 'DELETE' });
      if (response.ok) setCustomers(customers.filter(c => c.id !== customerId));
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const filteredLeads = leads.filter(lead =>
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
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted_email' || l.status === 'contacted_sms').length,
    converted: leads.filter(l => l.status === 'converted').length,
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
                Leads ({leadStats.total})
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
    </div>
  );
}

function LeadsTable({ leads, columns, editingCell, editValue, handleCellEdit, setEditValue, saveCellEdit, cancelCellEdit, deleteLead }) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads yet</h3>
        <p className="text-gray-600">Start adding leads to see them here</p>
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
              <button onClick={() => deleteLead(lead.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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
