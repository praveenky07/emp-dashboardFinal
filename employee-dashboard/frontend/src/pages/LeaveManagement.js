import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { leaveAPI, employeeAPI } from '../api/api';
import LeaveTable from '../components/LeaveTable';

const LeaveManagement = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || '';

  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: role === 'Employee' ? user.id : '',
    leave_type: 'Annual Leave',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const leaveRes = await leaveAPI.getAll();
      setLeaves(leaveRes.data);
      
      if (role !== 'Employee') {
        const empRes = await employeeAPI.getAll();
        setEmployees(empRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await leaveAPI.apply({
        ...formData,
        employee_id: role === 'Employee' ? user.id : formData.employee_id
      });
      fetchData();
      setShowModal(false);
      setFormData({ 
        employee_id: role === 'Employee' ? user.id : '', 
        leave_type: 'Annual Leave', 
        start_date: '', 
        end_date: '', 
        reason: '' 
      });
    } catch (err) {
      alert('Failed to apply for leave');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await leaveAPI.updateStatus(id, status);
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Leave Management</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} /> Apply Leave
        </button>
      </div>

      <LeaveTable leaves={leaves} onStatusUpdate={handleStatusUpdate} />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Apply for Leave</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleApply} style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label>Employee</label>
                <select 
                  value={formData.employee_id} 
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Leave Type</label>
                <select 
                  value={formData.leave_type} 
                  onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                >
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Maternity Leave">Maternity Leave</option>
                </select>
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Start Date</label>
                  <input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} required />
                </div>
                <div>
                  <label>End Date</label>
                  <input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea 
                  rows="3" 
                  value={formData.reason} 
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal-content { background: white; width: 450px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden; }
        .modal-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; }
      `}</style>
    </div>
  );
};

export default LeaveManagement;
