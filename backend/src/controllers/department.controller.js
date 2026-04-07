const { db } = require('../db/db');

// Get all departments
exports.getAllDepartments = async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM departments ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new department
exports.createDepartment = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Department name is required' });

    try {
        const result = await db.execute({
            sql: 'INSERT INTO departments (name) VALUES (?)',
            args: [name]
        });
        res.status(201).json({ 
            message: 'Department created successfully', 
            id: result.lastInsertRowid?.toString() 
        });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Department name already exists' });
        }
        res.status(500).json({ error: error.message });
    }
};

// Update department
exports.updateDepartment = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Department name is required' });

    try {
        await db.execute({
            sql: 'UPDATE departments SET name = ? WHERE id = ?',
            args: [name, id]
        });
        res.json({ message: 'Department updated successfully' });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Department name already exists' });
        }
        res.status(500).json({ error: error.message });
    }
};

// Delete department
exports.deleteDepartment = async (req, res) => {
    const { id } = req.params;

    try {
        // Check if department is being used by employees
        const employees = await db.execute({
            sql: 'SELECT COUNT(*) as count FROM employees WHERE department_id = ?',
            args: [id]
        });

        if (employees.rows[0].count > 0) {
            return res.status(400).json({ error: 'Cannot delete department as it is currently assigned to employees.' });
        }

        await db.execute({
            sql: 'DELETE FROM departments WHERE id = ?',
            args: [id]
        });
        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
