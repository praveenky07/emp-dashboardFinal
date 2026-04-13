const { db } = require('../db/db');

exports.getHolidays = async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM holidays ORDER BY date ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addHoliday = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can add holidays.' });
    }
    const { date, title, type } = req.body;
    try {
        await db.execute({
            sql: 'INSERT INTO holidays (date, title, type) VALUES (?, ?, ?)',
            args: [date, title, type || 'Company']
        });
        res.status(201).json({ message: 'Holiday added successfully.' });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'A holiday on this date already exists.' });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.editHoliday = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can edit holidays.' });
    }
    const { id } = req.params;
    const { date, title, type } = req.body;
    try {
        await db.execute({
            sql: 'UPDATE holidays SET date = ?, title = ?, type = ? WHERE id = ?',
            args: [date, title, type, id]
        });
        res.json({ message: 'Holiday updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteHoliday = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can delete holidays.' });
    }
    const { id } = req.params;
    try {
        await db.execute({
            sql: 'DELETE FROM holidays WHERE id = ?',
            args: [id]
        });
        res.json({ message: 'Holiday deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAttendanceStats = async (req, res) => {
    const userId = req.user.id;
    // We can accept a month and year or default to current month
    const { year, month } = req.query; // e.g. year=2026, month=04
    
    let targetYear = year ? parseInt(year) : new Date().getFullYear();
    let targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    try {
        // Calculate total days in month
        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
        
        let weekends = 0;
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(targetYear, targetMonth - 1, i);
            const dayOfWeek = d.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                weekends++;
            }
        }

        // Get holidays in this month
        const monthStr = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`;
        const holidaysResult = await db.execute({
            sql: 'SELECT date FROM holidays WHERE date LIKE ?',
            args: [`${monthStr}-%`]
        });
        
        // Ensure a holiday doesn't fall on a weekend so we don't double subtract
        let validHolidays = 0;
        holidaysResult.rows.forEach(r => {
            const hd = new Date(r.date);
            const dayOfWeek = hd.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                validHolidays++;
            }
        });

        const workingDays = daysInMonth - weekends - validHolidays;

        // Get present days (unique dates in attendance table for this user in this month)
        const attendanceResult = await db.execute({
            sql: "SELECT COUNT(DISTINCT date) as presentCount FROM attendance WHERE user_id = ? AND date LIKE ? AND status != 'On Leave'",
            args: [userId, `${monthStr}-%`]
        });

        const presentDays = attendanceResult.rows[0].presentCount || 0;

        res.json({
            workingDays,
            presentDays,
            totalDays: daysInMonth,
            weekends,
            holidays: holidaysResult.rows.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
