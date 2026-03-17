import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const EmployeeTable = ({ employees, onEdit, onDelete }) => {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Salary</th>
            <th>Joining Date</th>
            <th>Details</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const isAdmin = user.role === 'Admin';
            
            return (
              <tr key={emp.id}>
                <td>{emp.name}</td>
                <td>{emp.email}</td>
                <td>{emp.role}</td>
                <td>{emp.department}</td>
                <td>${emp.salary.toLocaleString()}</td>
                <td>{emp.joining_date}</td>
                <td>
                  <button 
                    className="btn-link" 
                    onClick={() => window.location.href = `/employee/${emp.id}`}
                    style={{ fontWeight: 'bold', fontSize: '0.8rem' }}
                  >
                    PROTOCOL DETAILS
                  </button>
                </td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  {isAdmin && (
                    <>
                      <button onClick={() => onEdit(emp)} style={{ color: 'var(--primary-color)' }}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => onDelete(emp.id)} style={{ color: 'var(--danger)' }}>
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {employees.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No employees found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
