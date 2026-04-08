const { Server } = require("socket.io");
let io;

// Track online active sessions
const onlineUsers = new Map();

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log(`[SOCKET] User connected: ${socket.id}`);

        socket.on("userOnline", (userId) => {
            onlineUsers.set(userId, socket.id);
            // Broadcast the list of online user IDs
            io.emit('activeUsersUpdated', Array.from(onlineUsers.keys()));
            console.log(`[SOCKET] User ${userId} is now online.`);
        });

        socket.on("join_room", (room) => {
            socket.join(room);
            console.log(`[SOCKET] Socket ${socket.id} joined room ${room}`);
        });

        socket.on("private_message", async ({ senderId, receiverId, message, file_url, file_type, senderName }) => {
            try {
                const { db } = require('../db/db');
                await db.execute({
                    sql: 'INSERT INTO messages (sender_id, receiver_id, message, file_url, file_type) VALUES (?, ?, ?, ?, ?)',
                    args: [senderId, receiverId, message || '', file_url || null, file_type || null]
                });

                // Create notification for receiver
                await db.execute({
                    sql: 'INSERT INTO notifications (user_id, type, message, metadata) VALUES (?, ?, ?, ?)',
                    args: [receiverId, 'message', `${senderName || 'Someone'} sent you a message`, JSON.stringify({ senderId, type: 'private' })]
                });

                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("private_message", { senderId, message, file_url, file_type, senderName });
                    io.to(receiverSocketId).emit("new_notification", {
                        type: 'message',
                        message: `${senderName || 'Someone'} sent you a message`,
                        senderId
                    });
                }
            } catch (err) { console.error('Socket private message error:', err); }
        });

        socket.on("group_message", async ({ senderId, groupId, message, senderName, file_url, file_type }) => {
            try {
                const { db } = require('../db/db');
                await db.execute({
                    sql: 'INSERT INTO group_messages (group_id, sender_id, message, file_url, file_type) VALUES (?, ?, ?, ?, ?)',
                    args: [groupId, senderId, message || '', file_url || null, file_type || null]
                });
                io.to(groupId).emit("group_message", { senderId, groupId, message, senderName, file_url, file_type });
            } catch (err) { console.error('Socket group message error:', err); }
        });

        socket.on("disconnect", () => {

             // Find and remove the user from mapping
             let disconnectedUserId = null;
             for (const [userId, sId] of onlineUsers.entries()) {
                 if (sId === socket.id) {
                     disconnectedUserId = userId;
                     onlineUsers.delete(userId);
                     break;
                 }
             }
             if (disconnectedUserId) {
                 io.emit('activeUsersUpdated', Array.from(onlineUsers.keys()));
                 console.log(`[SOCKET] User disconnected: ${socket.id}`);
             }
        });
        
        // Handle explicit logout disconnection correctly dropping online user tracking instantly
        socket.on("userOffline", (userId) => {
            onlineUsers.delete(userId);
            io.emit('activeUsersUpdated', Array.from(onlineUsers.keys()));
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIo };
