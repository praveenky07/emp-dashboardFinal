import { io } from "socket.io-client";

// Get URL from env - prioritize LOCAL for testing but fallback to provided URLs
const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_BASE_URL?.replace("/api", "");

console.log("[DEBUG] Connecting socket to:", SOCKET_URL);

// Create instance immediately so 'import socket' is never null
const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: true,
    auth: {
        token: localStorage.getItem("token"),
    },
});

socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
});

socket.on("connect_error", (err) => {
    console.error("⚠️ Socket error:", err.message);
});

// Helper for manual connection/re-auth
export const connectSocket = (token) => {
    if (token) {
        socket.auth.token = token;
    }
    if (!socket.connected) {
        socket.connect();
    }
    return socket;
};

// Helper for manual disconnection
export const disconnectSocket = () => {
    socket.disconnect();
    console.log("🔌 Socket manually disconnected");
};

export default socket;

