import React, { useState, useEffect } from 'react';
import { Coffee, Play, Square, X } from 'lucide-react';
import { breakAPI, employeeAPI } from '../api/api';
import { format } from 'date-fns';

const BreakTracker = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || '';

  const [breaks, setBreaks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState('start'); // 'start' or 'end'

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
      const breakRes = await breakAPI.getAll();
      setBreaks(breakRes.data);
      
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
      if (type === 'start') {
        await breakAPI.start({
          employee_id: role === 'Employee' ? undefined : formData.employee_id,
          date: formData.date,
          break_start: formData.time
        });
      } else {
        const targetEmpId = role === 'Employee' ? user.id : parseInt(formData.employee_id);
        const activeBreak = breaks.find(b => b.employee_id === targetEmpId && b.date === formData.date && !b.break_end);
        
        if (!activeBreak) {
          alert('No active break found to end.');
          return;
        }

        const start = new Date(activeBreak.break_start);
        const end = new Date(formData.time);
        const duration = (end - start) / (1000 * 60); // minutes

        await breakAPI.end({
          employee_id: role === 'Employee' ? undefined : formData.employee_id,
          date: formData.date,
          break_end: formData.time,
          break_duration: duration > 0 ? duration : 0
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
        <h1>Break Tracker</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => { setType('start'); setShowModal(true); }}>
            <Play size={16} style={{ marginRight: '0.5rem' }} /> Start Break
          </button>
          <button className="btn btn-danger" onClick={() => { setType('end'); setShowModal(true); }}>
            <Square size={16} style={{ marginRight: '0.5rem' }} /> End Break
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {breaks.map((b) => (
              <tr key={b.id}>
                <td>{b.employee_name}</td>
                <td>{b.date}</td>
                <td>{new Date(b.break_start).toLocaleTimeString()}</td>
                <td>{b.break_end ? new Date(b.break_end).toLocaleTimeString() : <span className="badge badge-warning">On Break</span>}</td>
                <td>{b.break_duration ? `${b.break_duration.toFixed(0)} mins` : '-'}</td>
              </tr>
            ))}
            {breaks.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No break records today.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{type === 'start' ? 'Start Break' : 'End Break'}</h3>
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
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
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
                  <input type="datetime-local" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Confirm {type === 'start' ? 'Start' : 'End'} Break
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

export default BreakTracker;
