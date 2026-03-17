const db = require('../db');

exports.startBreak = async (req, res) => {
    try {
        const { date, break_start } = req.body;
        const employee_id = req.user.role === 'Employee' ? req.user.id : req.body.employee_id;
        
        if (!employee_id || !date || !break_start) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const sql = `INSERT INTO breaks (employee_id, break_start, date) VALUES (?, ?, ?)`;
        const result = await db.runAsync(sql, [employee_id, break_start, date]);

        res.status(201).json({
            message: "Break started",
            breakId: result.lastID
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error starting break" });
    }
};

exports.endBreak = async (req, res) => {
    try {
        const { date, break_end, break_duration } = req.body;
        const employee_id = req.user.role === 'Employee' ? req.user.id : req.body.employee_id;

        if (!employee_id || !date || !break_end || break_duration === undefined) {
             return res.status(400).json({ message: "Required fields missing" });
        }

        const activeBreak = await db.getAsync(
            `SELECT * FROM breaks 
             WHERE employee_id = ? AND date = ? AND break_end IS NULL 
             ORDER BY break_start DESC LIMIT 1`,
            [employee_id, date]
        );

        if (!activeBreak) {
            return res.status(404).json({ message: "No active break found to end" });
        }

        const sql = `UPDATE breaks SET break_end = ?, break_duration = ? WHERE id = ?`;
        await db.runAsync(sql, [break_end, break_duration, activeBreak.id]);

        res.json({ message: "Break ended successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error ending break" });
    }
};

exports.getBreaks = async (req, res) => {
    try {
        let sql = `
            SELECT b.*, e.name as employee_name
            FROM breaks b
            JOIN employees e ON b.employee_id = e.id
        `;
        let params = [];

        if (req.user.role === 'Employee') {
            sql += ` WHERE b.employee_id = ?`;
            params.push(req.user.id);
        }

        sql += ` ORDER BY b.date DESC, b.break_start DESC`;
        const breaks = await db.allAsync(sql, params);
        res.json(breaks);
    } catch (error) {
         console.error(error);
         res.status(500).json({ message: "Error fetching breaks" });
    }
};
