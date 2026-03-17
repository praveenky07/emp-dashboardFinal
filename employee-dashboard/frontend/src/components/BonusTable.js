import React from 'react';

const BonusTable = ({ bonuses }) => {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Amount</th>
            <th>Reason</th>
            <th>Date Given</th>
          </tr>
        </thead>
        <tbody>
          {bonuses.map((b) => (
            <tr key={b.id}>
              <td>{b.employee_name}</td>
              <td>${parseFloat(b.bonus_amount).toLocaleString()}</td>
              <td>{b.bonus_reason}</td>
              <td>{b.date_given}</td>
            </tr>
          ))}
          {bonuses.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No bonuses assigned yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BonusTable;
