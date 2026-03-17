import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { employeeAPI } from '../api/api';
import EmployeeTable from '../components/EmployeeTable';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'Employee',
    department: '',
    salary: '',
    joining_date: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll();
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await employeeAPI.update(editingEmployee.id, formData);
      } else {
        await employeeAPI.create(formData);
      }
      fetchEmployees();
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save employee');
    }
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      username: emp.username,
      password: '', // Leave blank to keep existing
      role: emp.role,
      department: emp.department,
      salary: emp.salary,
      joining_date: emp.joining_date
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeAPI.delete(id);
        fetchEmployees();
      } catch (err) {
        alert('Failed to delete employee');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setFormData({
      name: '', email: '', username: '', password: '', role: 'Employee', department: '', salary: '', joining_date: ''
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{role === 'Admin' ? 'User Management' : 'Team Directory'}</h1>
        {role === 'Admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add User
          </button>
        )}
      </div>

      <EmployeeTable 
        employees={employees} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingEmployee ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Full Name</label>
                  <input name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div>
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Username</label>
                  <input name="username" value={formData.username} onChange={handleChange} required />
                </div>
                <div>
                  <label>Password {editingEmployee && '(Leave blank to keep)'}</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required={!editingEmployee} />
                </div>
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Role</label>
                  <select name="role" value={formData.role} onChange={handleChange} required>
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label>Department</label>
                  <input name="department" value={formData.department} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Salary</label>
                  <input type="number" name="salary" value={formData.salary} onChange={handleChange} required />
                </div>
                <div>
                  <label>Joining Date</label>
                  <input type="date" name="joining_date" value={formData.joining_date} onChange={handleChange} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                {editingEmployee ? 'Update User' : 'Save User'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 100;
        }
        .modal-content {
          background: white; width: 500px; border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .modal-header {
          padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color);
          display: flex; align-items: center; justify-content: space-between;
        }
      `}</style>
    </div>
  );
};

export default Employees;
