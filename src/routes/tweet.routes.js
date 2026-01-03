import { Router } from 'express';
import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Apply verifyJWT to all routes in this file
router.use(verifyJWT);

// Route for creating a tweet and getting user tweets
// POST: Create a new tweet
// GET: Fetch all tweets for a specific user
router.route("/tweet").post(createTweet);
router.route("/user/:userId").get(getUserTweets);

// Route for updating and deleting a specific tweet
// PATCH: Edit the tweet text
// DELETE: Remove the tweet
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;