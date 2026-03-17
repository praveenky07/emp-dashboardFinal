import React, { useState, useEffect } from 'react';
import { Clock, Plus, X } from 'lucide-react';
import { attendanceAPI, employeeAPI } from '../api/api';
import AttendanceTable from '../components/AttendanceTable';
import { format } from 'date-fns';

const Attendance = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || '';

  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState('checkin'); // 'checkin' or 'checkout'

  const [formData, setFormData] = useState({
    employee_id: role === 'Employee' ? user.id : '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const attRes = await attendanceAPI.getAll();
      setRecords(attRes.data);
      
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (type === 'checkin') {
        await attendanceAPI.checkIn({
          employee_id: role === 'Employee' ? undefined : formData.employee_id,
          date: formData.date,
          check_in_time: formData.time
        });
      } else {
        // Find checkin record to calculate hours
        const targetEmpId = role === 'Employee' ? user.id : parseInt(formData.employee_id);
        const checkinRec = records.find(r => r.employee_id === targetEmpId && r.date === formData.date);
        
        if (!checkinRec) {
          alert('No check-in record found for today.');
          return;
        }
        
        const checkinTime = new Date(checkinRec.check_in);
        const checkoutTime = new Date(formData.time);
        const diffHrs = (checkoutTime - checkinTime) / (1000 * 60 * 60);
        
        await attendanceAPI.checkOut({
          employee_id: role === 'Employee' ? undefined : formData.employee_id,
          date: formData.date,
          check_out_time: formData.time,
          work_hours: diffHrs > 0 ? diffHrs : 0
        });
      }
      fetchData();
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Attendance Tracking</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => { setType('checkin'); setShowModal(true); }}>
            Check In
          </button>
          <button className="btn btn-danger" onClick={() => { setType('checkout'); setShowModal(true); }}>
            Check Out
          </button>
        </div>
      </div>

      <AttendanceTable records={records} />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{type === 'checkin' ? 'Employee Check-In' : 'Employee Check-Out'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              {role !== 'Employee' && (
                <div className="form-group">
                  <label>Select Employee</label>
                  <select 
                    value={formData.employee_id} 
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    required
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Date</label>
                  <input type="date" value={formData.date} readOnly />
                </div>
                <div>
                  <label>Time</label>
                  <input 
                    type="datetime-local" 
                    value={formData.time} 
                    onChange={(e) => setFormData({...formData, time: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Confirm {type === 'checkin' ? 'Check-In' : 'Check-Out'}
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

export default Attendance;
