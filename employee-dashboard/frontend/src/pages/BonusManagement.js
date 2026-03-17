import React, { useState, useEffect } from 'react';
import { Gift, Plus, X } from 'lucide-react';
import { bonusAPI, employeeAPI } from '../api/api';
import { format } from 'date-fns';
import BonusTable from '../components/BonusTable';

const BonusManagement = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || '';

  const [bonuses, setBonuses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: '',
    bonus_amount: '',
    bonus_reason: '',
    date_given: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const bonusRes = await bonusAPI.getAll();
      setBonuses(bonusRes.data);
      
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
      await bonusAPI.assign(formData);
      fetchData();
      setShowModal(false);
      setFormData({ employee_id: '', bonus_amount: '', bonus_reason: '', date_given: format(new Date(), 'yyyy-MM-dd') });
    } catch (err) {
      alert('Failed to assign bonus');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{role === 'Employee' ? 'My Bonuses' : (role === 'Admin' ? 'Bonus Management' : 'Productivity Metrics')}</h1>
        {role === 'Admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} style={{ marginRight: '0.5rem' }} /> Assign Bonus
          </button>
        )}
      </div>

      <BonusTable bonuses={bonuses} />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Assign Bonus</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
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
                <label>Bonus Amount ($)</label>
                <input 
                  type="number" 
                  value={formData.bonus_amount} 
                  onChange={(e) => setFormData({...formData, bonus_amount: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Reason</label>
                <input 
                  type="text" 
                  value={formData.bonus_reason} 
                  onChange={(e) => setFormData({...formData, bonus_reason: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Date Given</label>
                <input 
                  type="date" 
                  value={formData.date_given} 
                  onChange={(e) => setFormData({...formData, date_given: e.target.value})} 
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Assign Bonus
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

export default BonusManagement;
