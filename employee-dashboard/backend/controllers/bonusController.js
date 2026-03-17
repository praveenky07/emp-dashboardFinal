const db = require('../db');

exports.assignBonus = async (req, res) => {
    try {
        const { employee_id, bonus_amount, bonus_reason, date_given } = req.body;

        if (!employee_id || !bonus_amount || !date_given) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const sql = `INSERT INTO bonuses (employee_id, bonus_amount, bonus_reason, date_given) 
                     VALUES (?, ?, ?, ?)`;
        const result = await db.runAsync(sql, [employee_id, bonus_amount, bonus_reason, date_given]);

        res.status(201).json({
            message: "Bonus assigned successfully",
            bonusId: result.lastID
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error assigning bonus" });
    }
};

exports.getAllBonuses = async (req, res) => {
    try {
        let sql = `
            SELECT b.*, e.name as employee_name
            FROM bonuses b
            JOIN employees e ON b.employee_id = e.id
        `;
        let params = [];

        if (req.user.role === 'Employee') {
            sql += ` WHERE b.employee_id = ?`;
            params.push(req.user.id);
        }

        sql += ` ORDER BY b.date_given DESC`;
        const bonuses = await db.allAsync(sql, params);
        res.json(bonuses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching bonuses" });
    }
};
