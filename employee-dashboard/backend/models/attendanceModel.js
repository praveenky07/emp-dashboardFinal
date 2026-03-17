const db = require('../db');

const AttendanceModel = {
    getAll: () => {
        const sql = `SELECT a.*, e.name as employee_name FROM attendance a JOIN employees e ON a.employee_id = e.id ORDER BY a.date DESC, a.check_in DESC`;
        return db.allAsync(sql);
    },
    getByEmployeeAndDate: (employee_id, date) => {
        return db.getAsync('SELECT * FROM attendance WHERE employee_id = ? AND date = ?', [employee_id, date]);
    },
    create: (data) => {
        const { employee_id, check_in, date } = data;
        return db.runAsync(`INSERT INTO attendance (employee_id, check_in, date) VALUES (?, ?, ?)`, [employee_id, check_in, date]);
    },
    updateCheckout: (id, check_out, work_hours) => {
        return db.runAsync(`UPDATE attendance SET check_out = ?, work_hours = ? WHERE id = ?`, [check_out, work_hours, id]);
    }
};

module.exports = AttendanceModel;
