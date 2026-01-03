import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// All subscription routes require the user to be logged in
router.use(verifyJWT);

// Route: Toggle subscription for a specific channel
// POST /api/v1/subscriptions/c/:channelId
router.route("/c/:channelId").post(toggleSubscription);

// Route: Get the list of subscribers for a specific channel
// GET /api/v1/subscriptions/c/:channelId
router.route("/c/:channelId").get(getUserChannelSubscribers);

// Route: Get the list of channels a specific user has subscribed to
// GET /api/v1/subscriptions/u/:subscriberId
router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router;