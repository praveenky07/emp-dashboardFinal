const { db } = require('../db/db');

exports.getMyTaxDeclarations = async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM tax_declarations WHERE user_id = ? ORDER BY financial_year DESC',
            args: [req.user.id]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createTaxDeclaration = async (req, res) => {
    const { financial_year, section_80c, section_80d, house_rent, other_investments } = req.body;
    try {
        await db.execute({
            sql: 'INSERT INTO tax_declarations (user_id, financial_year, section_80c, section_80d, house_rent, other_investments) VALUES (?, ?, ?, ?, ?, ?)',
            args: [req.user.id, financial_year, section_80c, section_80d, house_rent, other_investments]
        });
        res.json({ message: 'Tax declaration submitted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTaxDeclaration = async (req, res) => {
    const { id, section_80c, section_80d, house_rent, other_investments } = req.body;
    try {
        await db.execute({
            sql: 'UPDATE tax_declarations SET section_80c = ?, section_80d = ?, house_rent = ?, other_investments = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
            args: [section_80c, section_80d, house_rent, other_investments, 'Pending', id, req.user.id]
        });
        res.json({ message: 'Tax declaration updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllDeclarations = async (req, res) => {
    // Admin/Manager only
    try {
        const result = await db.execute(`
            SELECT t.*, u.name as user_name 
            FROM tax_declarations t 
            JOIN users u ON t.user_id = u.id 
            ORDER BY t.updated_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.approveTaxDeclaration = async (req, res) => {
    // Admin only
    const { id, status } = req.body;
    try {
        await db.execute({
            sql: 'UPDATE tax_declarations SET status = ? WHERE id = ?',
            args: [status, id]
        });
        res.json({ message: `Declaration ${status}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
