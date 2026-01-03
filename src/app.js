import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

// --- 1. IMPORT ALL ROUTES ---
import healthcheckRouter from "./routes/healthcheck.routes.js"
import userRouter from "./routes/user.routes.js"
import commentRouter from "./routes/comment.routes.js";
import videoRouter from "./routes/video.routes.js";
import likeRouter from "./routes/like.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";

// --- 2. IMPORT MIDDLEWARE (Only once!) ---
import { errorHandler } from "./middlewares/error.middleware.js"

const app = express()

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true
    })
)

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// --- 3. ROUTES ---
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/subscription", subscriptionRouter);

// --- 4. ERROR HANDLER (Last) ---
app.use(errorHandler)

export { app }