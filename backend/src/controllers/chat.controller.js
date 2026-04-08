const { db } = require('../db/db');

exports.getChatHistory = async (req, res) => {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    try {
        const result = await db.execute({
            sql: `
                SELECT * FROM messages 
                WHERE (sender_id = ? AND receiver_id = ?) 
                OR (sender_id = ? AND receiver_id = ?) 
                ORDER BY created_at ASC
            `,
            args: [userId, otherUserId, otherUserId, userId]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getGroupHistory = async (req, res) => {
    const { groupId } = req.params;

    try {
        const result = await db.execute({
            sql: `
                SELECT gm.*, u.name as sender_name 
                FROM group_messages gm 
                JOIN users u ON gm.sender_id = u.id 
                WHERE gm.group_id = ? 
                ORDER BY gm.created_at ASC
            `,
            args: [groupId]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getChatUsers = async (req, res) => {
    const userId = req.user.id;
    try {
        // Fetch all users except self
        const result = await db.execute({
            sql: 'SELECT id, name, role FROM users WHERE id != ?',
            args: [userId]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            args: [userId]
        });
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.markNotificationsRead = async (req, res) => {
    const userId = req.user.id;
    try {
        await db.execute({
            sql: 'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
            args: [userId]
        });
        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
