import React from 'react';

const AttendanceTable = ({ records }) => {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Date</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Work Hours</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec) => (
            <tr key={rec.id}>
              <td>{rec.employee_name}</td>
              <td>{rec.date}</td>
              <td>{new Date(rec.check_in).toLocaleTimeString()}</td>
              <td>{rec.check_out ? new Date(rec.check_out).toLocaleTimeString() : <span className="badge badge-warning">Active</span>}</td>
              <td>{rec.work_hours ? `${rec.work_hours.toFixed(2)}h` : '-'}</td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No attendance records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
