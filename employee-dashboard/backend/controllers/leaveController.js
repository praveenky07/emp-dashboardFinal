const db = require('../db');

exports.applyLeave = async (req, res) => {
    try {
        const { leave_type, start_date, end_date, reason } = req.body;
        const employee_id = req.user.id;

        if (!leave_type || !start_date || !end_date) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const sql = `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason) 
                     VALUES (?, ?, ?, ?, ?)`;
        const result = await db.runAsync(sql, [employee_id, leave_type, start_date, end_date, reason]);

        res.status(201).json({
            message: "Leave applied successfully",
            leaveId: result.lastID
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error applying for leave" });
    }
};

exports.getAllLeaves = async (req, res) => {
    try {
        let sql = `
            SELECT l.*, e.name as employee_name
            FROM leaves l
            JOIN employees e ON l.employee_id = e.id
        `;
        let params = [];

        if (req.user.role === 'Employee') {
            sql += ` WHERE l.employee_id = ?`;
            params.push(req.user.id);
        }

        sql += ` ORDER BY l.id DESC`;
        const leaves = await db.allAsync(sql, params);
        res.json(leaves);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching leaves" });
    }
};

exports.updateLeaveStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const id = req.params.id;

        // Managers and Admins only
        if (req.user.role === 'Employee') {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!status || !['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const sql = `UPDATE leaves SET status = ? WHERE id = ?`;
        await db.runAsync(sql, [status, id]);

        res.json({ message: `Leave ${status.toLowerCase()} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating leave status" });
    }
};
