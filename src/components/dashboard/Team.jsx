import { useState } from 'react';
import { Users, Plus, Edit } from 'lucide-react';

export default function Team({ employees, setEmployees, fetchEmployees, apiUrl, user }) {
  // Predefined color palette for auto-assignment
  const colorPalette = [
    '#ef4444', // Red
    '#f59e0b', // Orange
    '#10b981', // Green
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f97316', // Orange-Red
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f43f5e', // Rose
    '#6366f1', // Indigo
  ];

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    color: '#3b82f6',
    workDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    workHours: {
      startTime: '09:00',
      endTime: '17:00'
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  // Get next available color based on existing employees
  const getNextColor = () => {
    const usedColors = employees.map(emp => emp.color);
    const availableColor = colorPalette.find(color => !usedColors.includes(color));
    return availableColor || colorPalette[employees.length % colorPalette.length];
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingEmployee
        ? `${apiUrl}/api/employees/${editingEmployee.id}`
        : `${apiUrl}/api/employees`;

      const response = await fetch(url, {
        method: editingEmployee ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...employeeForm
        })
      });

      if (!response.ok) throw new Error('Failed to save employee');

      setShowAddEmployee(false);
      setEditingEmployee(null);
      // Reset form with next available color for future adds
      setEmployeeForm({ 
        name: '', 
        email: '', 
        phone: '', 
        color: getNextColor(),
        workDays: {
          monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
          saturday: false, sunday: false
        },
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
      workDays: employee.work_days || {
        monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
        saturday: false, sunday: false
      },
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
        <button
          type="button"
          onClick={() => {
            setShowAddEmployee(true);
            // Auto-assign next available color when opening form for new employee
            setEmployeeForm({
              name: '', 
              email: '', 
              phone: '', 
              color: getNextColor(),
              workDays: {
                monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
                saturday: false, sunday: false
              },
              workHours: { startTime: '09:00', endTime: '17:00' }
            });
          }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Employee
        </button>
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
                name: '', 
                email: '', 
                phone: '', 
                color: getNextColor(),
                workDays: {
                  monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
                  saturday: false, sunday: false
                },
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
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      employee.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {employee.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {employee.email && <p className="text-sm text-gray-600">{employee.email}</p>}
                  {employee.phone && <p className="text-sm text-gray-600">{employee.phone}</p>}
                  
                  {employee.work_hours && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Work Schedule:</p>
                      <p className="text-sm text-gray-600">
                        {employee.work_hours.startTime} - {employee.work_hours.endTime}
                      </p>
                      {employee.work_days && (
                        <div className="flex gap-1 mt-2">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                            const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][i];
                            const isWorking = employee.work_days[dayKey];
                            return (
                              <span
                                key={day}
                                className={`text-xs px-2 py-1 rounded ${
                                  isWorking ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {day}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleEditEmployee(employee)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            
            <form onSubmit={handleSaveEmployee} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={employeeForm.phone}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Calendar Color *</label>
                <p className="text-xs text-gray-500 mb-3">This color will identify bookings assigned to this team member on the calendar</p>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={employeeForm.color}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, color: e.target.value })}
                    className="w-20 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={employeeForm.color}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, color: e.target.value })}
                      placeholder="#3b82f6"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-sm"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {colorPalette.slice(0, 8).map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEmployeeForm({ ...employeeForm, color })}
                        className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                          employeeForm.color === color ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900' : 'border-gray-200'
                        }`}
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
                          onChange={(e) => setEmployeeForm({
                            ...employeeForm,
                            workDays: { ...employeeForm.workDays, [dayKey]: e.target.checked }
                          })}
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
                  <input
                    type="time"
                    value={employeeForm.workHours.startTime}
                    onChange={(e) => setEmployeeForm({
                      ...employeeForm,
                      workHours: { ...employeeForm.workHours, startTime: e.target.value }
                    })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
                  <input
                    type="time"
                    value={employeeForm.workHours.endTime}
                    onChange={(e) => setEmployeeForm({
                      ...employeeForm,
                      workHours: { ...employeeForm.workHours, endTime: e.target.value }
                    })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddEmployee(false);
                    setEditingEmployee(null);
                    // Don't reset form here - let it get reset when opening again
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : (editingEmployee ? 'Update Employee' : 'Add Employee')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
