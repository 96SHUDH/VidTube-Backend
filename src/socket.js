import { Server } from "socket.io";

export let io; 

export const initializeSocket = (server) => {
    io = new Server(server, {
        path: "/socket.io/",
        transports: ["websocket", "polling"], // Allow both for Postman compatibility
        cors: {
            origin: process.env.CORS_ORIGIN || "*",
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("🚀 Socket Connected Successfully! ID:", socket.id);
    });
};