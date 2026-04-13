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
            const sid = String(userId);
            onlineUsers.set(sid, socket.id);
            // Broadcast the list of online user IDs
            io.emit('activeUsersUpdated', Array.from(onlineUsers.keys()));
            console.log(`[SOCKET] User ${sid} (${socket.id}) is now online.`);
        });

        socket.on("join_room", (room) => {
            socket.join(room);
            console.log(`[SOCKET] Socket ${socket.id} joined room ${room}`);
        });

        socket.on("private_message", async ({ senderId, conversationId, receiverId, message, file_url, file_type, senderName }) => {
            try {
                const { db } = require('../db/db');
                await db.execute({
                    sql: 'INSERT INTO messages (conversation_id, sender_id, message, file_url, file_type) VALUES (?, ?, ?, ?, ?)',
                    args: [conversationId, senderId, message || '', file_url || null, file_type || null]
                });

                // Create notification for receiver
                await db.execute({
                    sql: 'INSERT INTO notifications (user_id, type, message, metadata) VALUES (?, ?, ?, ?)',
                    args: [receiverId, 'message', `${senderName || 'Someone'} sent you a message`, JSON.stringify({ senderId, type: 'private' })]
                });

                const receiverSocketId = onlineUsers.get(String(receiverId));
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("new_message", { conversationId, senderId, message, file_url, file_type, senderName, timestamp: new Date().toISOString() });
                    io.to(receiverSocketId).emit("new_notification", {
                        type: 'message',
                        message: `${senderName || 'Someone'} sent you a message`,
                        senderId
                    });
                }
            } catch (err) { console.error('Socket private message error:', err); }
        });

        socket.on("group_message", async ({ senderId, conversationId, message, senderName, file_url, file_type }) => {
            try {
                const { db } = require('../db/db');
                await db.execute({
                    sql: 'INSERT INTO messages (conversation_id, sender_id, message, file_url, file_type) VALUES (?, ?, ?, ?, ?)',
                    args: [conversationId, senderId, message || '', file_url || null, file_type || null]
                });
                io.to(`conversation_${conversationId}`).emit("new_message", { conversationId, senderId, message, senderName, file_url, file_type, timestamp: new Date().toISOString() });
            } catch (err) { console.error('Socket group message error:', err); }
        });

        socket.on("disconnect", () => {
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
        
        socket.on("userOffline", (userId) => {
            onlineUsers.delete(String(userId));
            io.emit('activeUsersUpdated', Array.from(onlineUsers.keys()));
        });

        // WebRTC/Signaling
        socket.on("call-user", (data) => {
            const receiverSocketId = onlineUsers.get(String(data.to));
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("incoming-call", {
                    from: data.from,
                    name: data.name,
                    roomId: data.roomId,
                    type: data.type
                });
            }
        });

        socket.on("reject-call", (data) => {
            const receiverSocketId = onlineUsers.get(String(data.from));
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("call-rejected");
            }
        });

        socket.on("end-call", (data) => {
            const receiverSocketId = onlineUsers.get(String(data.to));
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("call-ended");
            }
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
