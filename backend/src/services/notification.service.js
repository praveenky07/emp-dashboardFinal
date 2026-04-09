const { db } = require('../db/db');
const { getIo } = require('../socket');

/**
 * Professional Notification Service for EMP PRO
 * Handles DB persistence and Real-Time Socket delivery
 */
exports.createNotification = async (userId, type, message, metadata = {}) => {
    try {
        const metadataStr = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
        
        const result = await db.execute({
            sql: `INSERT INTO notifications (user_id, type, message, metadata, is_read) 
                  VALUES (?, ?, ?, ?, 0)`,
            args: [userId, type, message, metadataStr]
        });

        const notificationId = result.lastInsertRowid?.toString();
        const notification = {
            id: notificationId,
            user_id: userId,
            type,
            message,
            metadata: metadataStr,
            is_read: 0,
            created_at: new Date().toISOString()
        };

        // Real-time delivery
        const io = getIo();
        if (io) {
            console.log(`[NOTIFY] Sending real-time alert to User:${userId} - ${type}`);
            io.emit('new_notification', notification);
        }

        return notification;
    } catch (error) {
        console.error('[NOTIFY] Critical failure in notification delivery:', error);
        return null;
    }
};
