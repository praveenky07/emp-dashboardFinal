const db = require('../db');

const EmployeeModel = {
    getAll: () => db.allAsync('SELECT * FROM employees ORDER BY id DESC'),
    getById: (id) => db.getAsync('SELECT * FROM employees WHERE id = ?', [id]),
    create: (data) => {
        const { name, email, role, department, salary, joining_date } = data;
        const sql = `INSERT INTO employees (name, email, role, department, salary, joining_date) VALUES (?, ?, ?, ?, ?, ?)`;
        return db.runAsync(sql, [name, email, role, department, salary, joining_date]);
    },
    update: (id, data) => {
        const { name, email, role, department, salary, joining_date } = data;
        const sql = `UPDATE employees SET name = ?, email = ?, role = ?, department = ?, salary = ?, joining_date = ? WHERE id = ?`;
        return db.runAsync(sql, [name, email, role, department, salary, joining_date, id]);
    },
    delete: (id) => db.runAsync('DELETE FROM employees WHERE id = ?', [id])
};

module.exports = EmployeeModel;
