const { db } = require('../db/db');

exports.addAdjustment = async (req, res) => {
    const { user_id, amount, type, description, month, year } = req.body;
    try {
        await db.execute({
            sql: 'INSERT INTO salary_adjustments (user_id, amount, type, description, month, year) VALUES (?, ?, ?, ?, ?, ?)',
            args: [user_id, amount, type, description, month, year]
        });
        res.json({ message: 'Salary adjustment added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAdjustmentsForMonth = async (req, res) => {
    const { user_id, month, year } = req.query;
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM salary_adjustments WHERE user_id = ? AND month = ? AND year = ?',
            args: [user_id, month, year]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
