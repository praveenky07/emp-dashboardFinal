const db = require('../db');
const bcrypt = require('bcrypt');

exports.getAllEmployees = async (req, res) => {
    try {
        // Managers and Admins can see all
        let sql = 'SELECT id, name, email, username, role, department, salary, joining_date FROM employees ORDER BY id DESC';
        const employees = await db.allAsync(sql);
        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching employees' });
    }
};

exports.getEmployeeById = async (req, res) => {
    try {
        const id = req.params.id;
        
        // Employee can only see themselves
        if (req.user.role === 'Employee' && req.user.id != id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const employee = await db.getAsync('SELECT id, name, email, username, role, department, salary, joining_date FROM employees WHERE id = ?', [id]);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching employee' });
    }
};

exports.createEmployee = async (req, res) => {
    try {
        const { name, email, username, password, role, department, salary, joining_date } = req.body;
        
        if (!name || !email || !username || !password || !role || !department || !salary || !joining_date) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `INSERT INTO employees (name, email, username, password, role, department, salary, joining_date)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const result = await db.runAsync(sql, [name, email, username, hashedPassword, role, department, salary, joining_date]);
        
        res.status(201).json({
            message: 'Employee created successfully',
            employeeId: result.lastID
        });
    } catch (error) {
        console.error(error);
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: 'Email or Username already exists' });
        }
        res.status(500).json({ message: 'Error creating employee' });
    }
};

exports.updateEmployee = async (req, res) => {
    try {
        const { name, email, username, password, role, department, salary, joining_date } = req.body;
        const id = req.params.id;

        const employee = await db.getAsync('SELECT * FROM employees WHERE id = ?', [id]);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        let hashedPassword = employee.password;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const sql = `UPDATE employees 
                     SET name = ?, email = ?, username = ?, password = ?, role = ?, department = ?, salary = ?, joining_date = ?
                     WHERE id = ?`;
        await db.runAsync(sql, [
            name || employee.name, 
            email || employee.email, 
            username || employee.username,
            hashedPassword,
            role || employee.role, 
            department || employee.department, 
            salary || employee.salary, 
            joining_date || employee.joining_date, 
            id
        ]);
        
        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        console.error(error);
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: 'Email or Username already exists' });
        }
        res.status(500).json({ message: 'Error updating employee' });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const id = req.params.id;
        const employee = await db.getAsync('SELECT * FROM employees WHERE id = ?', [id]);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        await db.runAsync('DELETE FROM employees WHERE id = ?', [id]);
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting employee' });
    }
};
