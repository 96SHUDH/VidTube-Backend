import dotenv from "dotenv";
import http from "http";
import { app } from "./app.js";
import connectDB from "./db/index.js";
import { initializeSocket } from "./socket.js";

// 1. Load env variables first
dotenv.config({
    path: "./.env"
});

// 2. Create the HTTP server wrapper for Express
const server = http.createServer(app);

// 3. Bind Socket.io to this server instance
initializeSocket(server);

const PORT = process.env.PORT || 8000;

connectDB()
    .then(() => {
        // 4. IMPORTANT: Listen on 'server', not 'app'
        server.listen(PORT, () => {
            console.log(`✅ Server is running on port: ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("Mongodb connection error", err);
    });