import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Secure all dashboard routes - only creators can see their own stats
router.use(verifyJWT); 

// Route: /api/v1/dashboard/stats
// Description: Get total subscribers, total views, total likes, etc.
router.route("/stats").get(getChannelStats);

// Route: /api/v1/dashboard/videos
// Description: Get all videos uploaded by the channel with pagination
router.route("/videos").get(getChannelVideos);

export default router;