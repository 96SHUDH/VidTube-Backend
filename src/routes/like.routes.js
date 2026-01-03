import { Router } from 'express';
import {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT); 

// Route for toggling likes on Videos
router.route("/toggle/v/:videoId").post(toggleVideoLike);

// Route for toggling likes on Comments
router.route("/toggle/c/:commentId").post(toggleCommentLike);

// Route for toggling likes on Tweets
router.route("/toggle/t/:tweetId").post(toggleTweetLike);

// Route to get all videos liked by the current user
router.route("/videos").get(getLikedVideos);

export default router;