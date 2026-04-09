const { db } = require('../db/db');
const { logActivity } = require('../db/logs');
const { getIo } = require('../socket');
const { emitAttendanceStarted, emitAttendanceEnded } = require('../socket/events');

exports.clockIn = async (req, res) => {
    const userId = req.user.id;
    const date = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    try {
        // 1. Check for open sessions (global)
        const openSession = await db.execute({
            sql: 'SELECT id FROM attendance WHERE user_id = ? AND clock_out IS NULL',
            args: [userId]
        });
        
        if (openSession.rows.length > 0) {
            return res.status(400).json({ error: 'You have an active session. Please clock out first.' });
        }

        // 2. Check for existing record today (to prevent duplicates per day)
        const existingToday = await db.execute({
            sql: 'SELECT id, status FROM attendance WHERE user_id = ? AND date = ?',
            args: [userId, date]
        });

        if (existingToday.rows.length > 0) {
            const record = existingToday.rows[0];
            if (record.status === 'On Leave') {
                return res.status(400).json({ error: 'You are marked as "On Leave" today. Manual clock-in disabled.' });
            }
            // If they already clocked out today, we allow re-clocking in by UPDATING the existing row 
            // OR we can block it. Standard enterprise usually blocks or resumes. 
            // We will block to ensure data cleaness as requested (one cycle per day for this version).
            return res.status(400).json({ error: 'Attendance for today already logged.' });
        }

        // 3. Insert New Record (Enforced by UNIQUE constraint in DB too)
        await db.execute({
            sql: 'INSERT INTO attendance (user_id, date, clock_in, status) VALUES (?, ?, ?, ?)',
            args: [userId, date, now, 'Present']
        });

        await logActivity(userId, 'clock_in', { date });
        try { emitAttendanceStarted(getIo(), { userId, time: now, date }); } catch(e) {}

        res.json({ message: 'Clocked in successfully', time: now });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.clockOut = async (req, res) => {
    const userId = req.user.id;
    const now = new Date().toISOString();

    try {
        const result = await db.execute({
            sql: 'SELECT * FROM attendance WHERE user_id = ? AND clock_out IS NULL LIMIT 1',
            args: [userId]
        });

        const record = result.rows[0];
        if (!record) return res.status(400).json({ error: 'No active session found.' });

        const clockInTime = new Date(record.clock_in);
        const clockOutTime = new Date(now);
        const totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
        
        // Logical rule: Half Day < 5 hrs, Present >= 5 hrs
        const status = totalHours >= 5 ? 'Present' : 'Half Day';

        await db.execute({
            sql: 'UPDATE attendance SET clock_out = ?, total_hours = ?, status = ? WHERE id = ?',
            args: [now, totalHours.toFixed(2), status, record.id]
        });

        await logActivity(userId, 'clock_out', { totalHours: totalHours.toFixed(2) });
        try { emitAttendanceEnded(getIo(), { userId, time: now, totalHours }); } catch(e) {}
        
        res.json({ message: 'Clocked out successfully', totalHours: totalHours.toFixed(2) });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getMyAttendance = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC LIMIT 31',
            args: [userId]
        });
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getAdminAttendance = async (req, res) => {
    try {
        const result = await db.execute({
            sql: `
                SELECT a.*, u.name as user_name, u.role as user_role
                FROM attendance a 
                JOIN users u ON a.user_id = u.id 
                ORDER BY a.date DESC LIMIT 500
            `
        });
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getTeamAttendance = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.execute({
            sql: `
                SELECT a.*, u.name as user_name 
                FROM attendance a 
                JOIN users u ON a.user_id = u.id 
                WHERE u.manager_id = ? 
                ORDER BY a.date DESC LIMIT 100
            `,
            args: [userId]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
