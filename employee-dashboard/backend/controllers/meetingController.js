const db = require('../db');

exports.logMeeting = async (req, res) => {
    try {
        const { title, description, meeting_date, duration } = req.body;
        const employee_id = req.user.id; // Using logged in user ID

        if (!title || !meeting_date) {
            return res.status(400).json({ message: 'Title and date are required' });
        }

        const sql = `INSERT INTO meetings (employee_id, title, description, meeting_date, duration)
                     VALUES (?, ?, ?, ?, ?)`;
        const result = await db.runAsync(sql, [employee_id, title, description, meeting_date, duration]);

        res.status(201).json({
            message: 'Meeting logged successfully',
            meetingId: result.lastID
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging meeting' });
    }
};

exports.getMyMeetings = async (req, res) => {
    try {
        const meetings = await db.allAsync(
            'SELECT * FROM meetings WHERE employee_id = ? ORDER BY meeting_date DESC',
            [req.user.id]
        );
        res.json(meetings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching meetings' });
    }
};

exports.getAllMeetings = async (req, res) => {
    try {
        const meetings = await db.allAsync(`
            SELECT m.*, e.name as employee_name
            FROM meetings m
            JOIN employees e ON m.employee_id = e.id
            ORDER BY m.meeting_date DESC
        `);
        res.json(meetings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching all meetings' });
    }
};
