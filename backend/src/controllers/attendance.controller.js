const { db } = require('../db/db');
const { logActivity } = require('../db/logs');
const { getIo } = require('../socket');
const { emitAttendanceStarted, emitAttendanceEnded } = require('../socket/events');

exports.clockIn = async (req, res) => {
    const userId = req.user.id;
    const date = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    try {
        // Prevent multiple clock-ins
        const check = await db.execute({
            sql: 'SELECT id FROM attendance WHERE user_id = ? AND clock_out IS NULL',
            args: [userId]
        });
        
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'Already clocked in' });
        }

        await db.execute({
            sql: 'INSERT INTO attendance (user_id, date, clock_in, status) VALUES (?, ?, ?, ?)',
            args: [userId, date, now, 'Present']
        });

        await logActivity(userId, 'clock_in', { date });
        
        // Socket broadcast
        try {
            emitAttendanceStarted(getIo(), { userId, time: now, date });
        } catch(e) { console.error('Socket error emitting attendanceStarted', e); }

        res.json({ message: 'Clocked in successfully', time: now });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.clockOut = async (req, res) => {
    const userId = req.user.id;
    const date = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    try {
        const result = await db.execute({
            sql: 'SELECT * FROM attendance WHERE user_id = ? AND clock_out IS NULL ORDER BY id DESC LIMIT 1',
            args: [userId]
        });

        const record = result.rows[0];
        if (!record) {
            return res.status(400).json({ error: 'No active clock-in found for today' });
        }

        const clockInTime = new Date(record.clock_in);
        const clockOutTime = new Date(now);
        const totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
        
        // Status logic: Present (> 6 hrs), Half Day (< 6 hrs)
        const status = totalHours >= 6 ? 'Present' : 'Half Day';

        await db.execute({
            sql: 'UPDATE attendance SET clock_out = ?, total_hours = ?, status = ? WHERE id = ?',
            args: [now, totalHours.toFixed(2), status, record.id]
        });

        await logActivity(userId, 'clock_out', { totalHours: totalHours.toFixed(2) });
        
        try {
            emitAttendanceEnded(getIo(), { userId, time: now, totalHours });
        } catch(e) { console.error('Socket error on clockOut', e); }
        
        res.json({ message: 'Clocked out successfully', totalHours: totalHours.toFixed(2) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMyAttendance = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC LIMIT 30',
            args: [userId]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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

exports.getAdminAttendance = async (req, res) => {
    try {
        const result = await db.execute({
            sql: `
                SELECT a.*, u.name as user_name 
                FROM attendance a 
                JOIN users u ON a.user_id = u.id 
                ORDER BY a.date DESC LIMIT 500
            `
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
