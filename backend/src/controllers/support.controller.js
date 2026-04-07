const { db } = require('../db/db');

exports.getMyRegularizationRequests = async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM regularization_requests WHERE user_id = ? ORDER BY date DESC',
            args: [req.user.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createRegularizationRequest = async (req, res) => {
    const { date, actual_in, actual_out, reason } = req.body;
    try {
        await db.execute({
            sql: 'INSERT INTO regularization_requests (user_id, date, actual_in, actual_out, reason) VALUES (?, ?, ?, ?, ?)',
            args: [req.user.id, date, actual_in, actual_out, reason]
        });
        res.json({ message: 'Regularization request submitted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllRegularizationRequests = async (req, res) => {
    // Managers only
    try {
        const result = await db.execute(`
            SELECT r.*, u.name as user_name 
            FROM regularization_requests r 
            JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateRegularizationStatus = async (req, res) => {
    const { id, status } = req.body;
    try {
        await db.execute({
            sql: 'UPDATE regularization_requests SET status = ? WHERE id = ?',
            args: [status, id]
        });
        res.json({ message: `Request ${status}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
