import { useState, useEffect } from 'react';
import { Users, Plus, Edit } from 'lucide-react';

export default function Team({ employees, setEmployees, fetchEmployees, apiUrl, user, authFetch }) {
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
  const [isSaving, setIsSaving] = useState(false);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupForm, setGroupForm] = useState({ name: '', selectedEmployees: [] });
  const [editingGroup, setEditingGroup] = useState(null);

  const getNextColor = () => {
    const usedColors = employees.map(emp => emp.color);
    const availableColor = colorPalette.find(color => !usedColors.includes(color));
    return availableColor || colorPalette[employees.length % colorPalette.length];
  };

  useEffect(() => {
    if (user?.id) fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/groups`);
      const data = await response.json();
      if (data.groups) setGroups(data.groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

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
    setIsSaving(true);
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
      setIsSaving(false);
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

  return (
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
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
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
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
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
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
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
                  {employee.email && <p className="text-sm text-gray-600">{employee.email}</p>}
                  {employee.phone && <p className="text-sm text-gray-600">{employee.phone}</p>}
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
                <button type="button" onClick={() => handleEditEmployee(employee)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit className="w-5 h-5" />
                </button>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input type="tel" value={employeeForm.phone} onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Calendar Color *</label>
                <p className="text-xs text-gray-500 mb-3">This color will identify bookings assigned to this team member on the calendar</p>
                <div className="flex items-center gap-4">
                  <input type="color" value={employeeForm.color} onChange={(e) => setEmployeeForm({ ...employeeForm, color: e.target.value })} className="w-20 h-12 rounded-lg border-2 border-gray-200 cursor-pointer" />
                  <div className="flex-1">
                    <input type="text" value={employeeForm.color} onChange={(e) => setEmployeeForm({ ...employeeForm, color: e.target.value })} placeholder="#3b82f6" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-sm" />
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
                  <input type="time" value={employeeForm.workHours.startTime} onChange={(e) => setEmployeeForm({ ...employeeForm, workHours: { ...employeeForm.workHours, startTime: e.target.value } })} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
                  <input type="time" value={employeeForm.workHours.endTime} onChange={(e) => setEmployeeForm({ ...employeeForm, workHours: { ...employeeForm.workHours, endTime: e.target.value } })} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => { setShowAddEmployee(false); setEditingEmployee(null); }} className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                  {isSaving ? 'Saving...' : (editingEmployee ? 'Update Employee' : 'Add Employee')}
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
                <button type="button" onClick={() => { setShowCreateGroupModal(true); setGroupForm({ name: '', selectedEmployees: [] }); setEditingGroup(null); }} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Group
                </button>
                <button type="button" onClick={() => setShowGroupsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Users className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {groups.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No groups yet</h3>
                  <p className="text-gray-600 mb-6">Create your first team group or crew</p>
                  <button type="button" onClick={() => { setShowCreateGroupModal(true); setGroupForm({ name: '', selectedEmployees: [] }); setEditingGroup(null); }} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
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
                            <Users className="w-4 h-4" />
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
                <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                  {editingGroup ? 'Update Group' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
