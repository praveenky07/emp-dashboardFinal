import React from 'react';

const LeaveTable = ({ leaves, onStatusUpdate }) => {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map((l) => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return (
              <tr key={l.id}>
                <td>{l.employee_name}</td>
                <td>{l.leave_type}</td>
                <td>{l.start_date}</td>
                <td>{l.end_date}</td>
                <td>{l.reason}</td>
                <td>
                  <span className={`badge badge-${l.status === 'Approved' ? 'success' : l.status === 'Rejected' ? 'danger' : 'warning'}`}>
                    {l.status}
                  </span>
                </td>
                <td>
                  {(user.role === 'Admin' || user.role === 'Manager') && l.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => onStatusUpdate(l.id, 'Approved')}>
                        Approve
                      </button>
                      <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => onStatusUpdate(l.id, 'Rejected')}>
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {leaves.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No leave requests found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveTable;
