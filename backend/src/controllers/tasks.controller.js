const { db } = require('../db/db');

exports.createTask = async (req, res) => {
    const { title, description, priority, due_date, assigned_to } = req.body;
    try {
        await db.execute({
            sql: 'INSERT INTO tasks (title, description, priority, due_date, assigned_to, assigned_by) VALUES (?, ?, ?, ?, ?, ?)',
            args: [title, description, priority || 'Medium', due_date, assigned_to, req.user.id]
        });
        res.status(201).json({ message: 'Task assigned successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMyTasks = async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM tasks WHERE assigned_to = ? ORDER BY created_at DESC',
            args: [req.user.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getManagedTasks = async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT t.*, u.name as assigned_to_name FROM tasks t JOIN users u ON t.assigned_to = u.id WHERE t.assigned_by = ? ORDER BY t.created_at DESC',
            args: [req.user.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTaskStatus = async (req, res) => {
    const { id, status } = req.body;
    try {
        await db.execute({
            sql: 'UPDATE tasks SET status = ? WHERE id = ? AND (assigned_to = ? OR assigned_by = ?)',
            args: [status, id, req.user.id, req.user.id]
        });
        res.json({ message: 'Task status updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
