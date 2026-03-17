const db = require('../db');

const BreakModel = {
    getAll: () => {
        const sql = `SELECT b.*, e.name as employee_name FROM breaks b JOIN employees e ON b.employee_id = e.id ORDER BY b.date DESC, b.break_start DESC`;
        return db.allAsync(sql);
    },
    create: (data) => {
        const { employee_id, break_start, date } = data;
        return db.runAsync(`INSERT INTO breaks (employee_id, break_start, date) VALUES (?, ?, ?)`, [employee_id, break_start, date]);
    },
    findActive: (employee_id, date) => {
        return db.getAsync(`SELECT * FROM breaks WHERE employee_id = ? AND date = ? AND break_end IS NULL ORDER BY break_start DESC LIMIT 1`, [employee_id, date]);
    },
    endBreak: (id, break_end, break_duration) => {
        return db.runAsync(`UPDATE breaks SET break_end = ?, break_duration = ? WHERE id = ?`, [break_end, break_duration, id]);
    }
};

module.exports = BreakModel;
