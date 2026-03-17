const db = require('../db');

const BonusModel = {
    getAll: () => {
        const sql = `SELECT b.*, e.name as employee_name FROM bonuses b JOIN employees e ON b.employee_id = e.id ORDER BY b.date_given DESC`;
        return db.allAsync(sql);
    },
    create: (data) => {
        const { employee_id, bonus_amount, bonus_reason, date_given } = data;
        const sql = `INSERT INTO bonuses (employee_id, bonus_amount, bonus_reason, date_given) VALUES (?, ?, ?, ?)`;
        return db.runAsync(sql, [employee_id, bonus_amount, bonus_reason, date_given]);
    }
};

module.exports = BonusModel;
