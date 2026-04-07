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
            // Broadcast the count globally
            io.emit('activeUsersUpdated', onlineUsers.size);
            console.log(`[SOCKET] User ${userId} is now online. Total online: ${onlineUsers.size}`);
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
                 io.emit('activeUsersUpdated', onlineUsers.size);
                 console.log(`[SOCKET] User disconnected: ${socket.id}. Total online: ${onlineUsers.size}`);
             }
        });
        
        // Handle explicit logout disconnection correctly dropping online user tracking instantly
        socket.on("userOffline", (userId) => {
            onlineUsers.delete(userId);
            io.emit('activeUsersUpdated', onlineUsers.size);
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
