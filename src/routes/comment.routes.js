import { Router } from "express";
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js"

const router = Router();

// Apply verifyJWT to all routes in this file
router.use(verifyJWT);

// Routes for video-specific comments
// URL: /api/v1/comments/:videoId
router.route("/:videoId")
    .get(getVideoComments)
    .post(addComment);

// Routes for specific comment actions
// URL: /api/v1/comments/c/:commentId
router.route("/c/:commentId")
    .delete(deleteComment)
    .patch(updateComment);

export default router;