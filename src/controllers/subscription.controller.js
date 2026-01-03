import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { io } from "../socket.js"; // Importing io from the new separated socket file

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    
    // 1. Validation: Check if channelId is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    // A user cannot subscribe to their own channel
    if (channelId.toString() === req.user?._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    // 2. Check if the subscription already exists
    const subscriptionInstance = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId,
    });

    if (subscriptionInstance) {
        // 3. If exists, unsubscribe (delete)
        await Subscription.findByIdAndDelete(subscriptionInstance._id);

        return res
            .status(200)
            .json(new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully"));
    }

    // 4. If not exists, subscribe (create)
    const newSubscription = await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
    });

    // --- REAL-TIME NOTIFICATION LOGIC ---
    if (newSubscription && io) {
        const notificationPayload = {
            type: "SUBSCRIPTION",
            message: `${req.user?.username} subscribed to your channel!`,
            sender: {
                _id: req.user?._id,
                username: req.user?.username,
                avatar: req.user?.avatar
            }
        };

        // Emit notification to the channel owner's private room
        io.to(channelId.toString()).emit("notification_received", notificationPayload);
    }
    // ------------------------------------

    return res
        .status(200)
        .json(new ApiResponse(200, { subscribed: true }, "Subscribed successfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriber: {
                    $first: "$subscriberDetails"
                }
            }
        },
        {
            $project: {
                subscriber: 1,
                createdAt: 1
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid Subscriber ID")
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscribedChannel: {
                    $first: "$subscribedChannel"
                }
            }
        },
        {
            $project: {
                subscribedChannel: 1,
                createdAt: 1
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully"))
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}