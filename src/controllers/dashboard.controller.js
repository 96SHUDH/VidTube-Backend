import mongoose from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // 1. Get userId from the logged-in user (Secure)
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    const stats = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        // Lookup for total subscribers
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // Lookup for videos to get views and video count
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "video",
                            as: "likes"
                        }
                    },
                    {
                        $addFields: {
                            likesCount: { $size: "$likes" }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalSubscribers: { $size: "$subscribers" },
                totalVideos: { $size: "$videos" },
                totalViews: { $sum: "$videos.views" },
                totalLikes: { $sum: "$videos.likesCount" }
            }
        },
        {
            $project: {
                totalSubscribers: 1,
                totalVideos: 1,
                totalViews: 1,
                totalLikes: 1,
                username: 1,
                fullname: 1,
                avatar: 1
            }
        }
    ]);
    
    if (!stats || stats.length === 0) {
        throw new ApiError(500, "Stats could not be calculated");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, stats[0], "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // 2. Change: Use req.user?._id for a private dashboard view
    const userId = req.user?._id; 
    const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query;

    const videoAggregate = Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    // 3. This requires 'videoSchema.plugin(aggregatePaginate)' in video.models.js
    const videos = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export {
    getChannelStats, 
    getChannelVideos
}