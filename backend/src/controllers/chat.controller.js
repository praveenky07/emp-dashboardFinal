const { db } = require('../db/db');

exports.getConversations = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.execute({
            sql: `
                SELECT c.id, c.type, c.name, 
                       (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message,
                       (SELECT timestamp FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message_time
                FROM conversations c 
                JOIN conversation_members cm ON c.id = cm.conversation_id 
                WHERE cm.user_id = ?
                ORDER BY last_message_time DESC
            `,
            args: [userId]
        });

        // For direct messages, fetch the other user's name
        for (let conv of result.rows) {
            if (conv.type === 'direct') {
                const otherUser = await db.execute({
                    sql: `
                        SELECT u.id, u.name, u.role, u.profile_image 
                        FROM users u 
                        JOIN conversation_members cm ON u.id = cm.user_id
                        WHERE cm.conversation_id = ? AND u.id != ?
                    `,
                    args: [conv.id, userId]
                });
                if (otherUser.rows.length > 0) {
                    conv.otherUser = otherUser.rows[0];
                    conv.name = otherUser.rows[0].name; // Set name for UI ease
                }
            }
        }
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrCreateDirectConversation = async (req, res) => {
    const userId = req.user.id;
    const { targetUserId } = req.params;

    try {
        // Check if direct conversation exists
        let result = await db.execute({
            sql: `
                SELECT c.id 
                FROM conversations c
                JOIN conversation_members cm1 ON c.id = cm1.conversation_id
                JOIN conversation_members cm2 ON c.id = cm2.conversation_id
                WHERE c.type = 'direct' AND cm1.user_id = ? AND cm2.user_id = ?
            `,
            args: [userId, targetUserId]
        });

        if (result.rows.length > 0) {
            return res.json({ id: result.rows[0].id, type: 'direct' });
        }

        // Create new direct conversation
        try {
            const tx = await db.transaction('write');
            const insertResult = await tx.execute({
                sql: "INSERT INTO conversations (type) VALUES ('direct')"
            });
            
            const convIdStr = insertResult.lastInsertRowid.toString();

            await tx.execute({
                sql: "INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)",
                args: [convIdStr, userId]
            });
            await tx.execute({
                sql: "INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)",
                args: [convIdStr, targetUserId]
            });
            await tx.commit();
            
            return res.json({ id: convIdStr, type: 'direct' });
        } catch (txnError) {
             console.error("DIRECT TXN ERROR:", txnError.message);
             throw txnError;
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createGroupConversation = async (req, res) => {
    const userId = req.user.id;
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'Manager' && req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Only admin/manager can create groups.' });
    }
    const { name, members, createdBy } = req.body;
    
    console.log("Group Data:", { name, members, createdBy });

    if (!members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: 'Please select at least one member.' });
    }

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Group name is required.' });
    }

    try {
            const tx = await db.transaction('write');
            
            // 1. Insert conversation
            const insertResult = await tx.execute({
                sql: "INSERT INTO conversations (type, name) VALUES (?, ?)",
                args: ['group', name]
            });
            
            const conversationId = insertResult.lastInsertRowid.toString();
            const creatorId = createdBy || userId;

            // 2. Insert creator
            await tx.execute({
                sql: "INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)",
                args: [conversationId, creatorId]
            });

            // 3. Insert all members
            const uniqueMembers = Array.from(new Set(members));
            for (const uid of uniqueMembers) {
                if (String(uid) !== String(creatorId)) {
                    await tx.execute({
                        sql: "INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)",
                        args: [conversationId, uid]
                    });
                }
            }
            
            await tx.commit();
            return res.json({ id: conversationId, type: 'group', name, success: true });
        } catch (error) {
            console.error("GROUP CREATE ERROR:", error.message);
            res.status(500).json({ error: error.message });
        }
};

exports.getChatHistory = async (req, res) => {
    const { conversationId } = req.params;

    try {
        const result = await db.execute({
            sql: `
                SELECT m.*, u.name as sender_name 
                FROM messages m 
                JOIN users u ON m.sender_id = u.id 
                WHERE m.conversation_id = ? 
                ORDER BY m.timestamp ASC
            `,
            args: [conversationId]
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
