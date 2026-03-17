const db = require('../db');

exports.checkIn = async (req, res) => {
    try {
        const { date, check_in_time } = req.body;
        // Employees can only check in for themselves
        const employee_id = req.user.role === 'Employee' ? req.user.id : req.body.employee_id;

        if (!employee_id || !date || !check_in_time) {
            return res.status(400).json({ message: 'Employee ID, date, and check_in time are required' });
        }

        const existing = await db.getAsync(
            'SELECT * FROM attendance WHERE employee_id = ? AND date = ?', 
            [employee_id, date]
        );

        if (existing) {
            return res.status(400).json({ message: 'Employee already checked in today' });
        }

        const sql = `INSERT INTO attendance (employee_id, check_in, date) VALUES (?, ?, ?)`;
        const result = await db.runAsync(sql, [employee_id, check_in_time, date]);

        res.status(201).json({ 
            message: 'Checked in successfully',
            attendanceId: result.lastID 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error during check in' });
    }
};

exports.checkOut = async (req, res) => {
    try {
        const { date, check_out_time, work_hours } = req.body;
        const employee_id = req.user.role === 'Employee' ? req.user.id : req.body.employee_id;

        if (!employee_id || !date || !check_out_time || work_hours === undefined) {
             return res.status(400).json({ message: 'Required fields missing' });
        }

        const attendance = await db.getAsync(
            'SELECT * FROM attendance WHERE employee_id = ? AND date = ?', 
            [employee_id, date]
        );

        if (!attendance) {
            return res.status(404).json({ message: 'No check-in record found for today' });
        }

        if (attendance.check_out) {
            return res.status(400).json({ message: 'Already checked out today' });
        }

        const sql = `UPDATE attendance SET check_out = ?, work_hours = ? WHERE id = ?`;
        await db.runAsync(sql, [check_out_time, work_hours, attendance.id]);

        res.json({ message: 'Checked out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error during check out' });
    }
};

exports.getAllAttendance = async (req, res) => {
    try {
        let sql = `
            SELECT a.*, e.name as employee_name
            FROM attendance a
            JOIN employees e ON a.employee_id = e.id
        `;
        let params = [];
        
        if (req.user.role === 'Employee') {
            sql += ` WHERE a.employee_id = ?`;
            params.push(req.user.id);
        }

        sql += ` ORDER BY a.date DESC, a.check_in DESC`;
        const records = await db.allAsync(sql, params);
        res.json(records);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching attendance records' });
    }
};
