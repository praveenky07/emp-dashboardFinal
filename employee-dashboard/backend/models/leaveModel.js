const db = require('../db');

const LeaveModel = {
    getAll: () => {
        const sql = `SELECT l.*, e.name as employee_name FROM leaves l JOIN employees e ON l.employee_id = e.id ORDER BY l.id DESC`;
        return db.allAsync(sql);
    },
    create: (data) => {
        const { employee_id, leave_type, start_date, end_date, reason } = data;
        const sql = `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)`;
        return db.runAsync(sql, [employee_id, leave_type, start_date, end_date, reason]);
    },
    updateStatus: (id, status) => {
        return db.runAsync(`UPDATE leaves SET status = ? WHERE id = ?`, [status, id]);
    }
};

module.exports = LeaveModel;
