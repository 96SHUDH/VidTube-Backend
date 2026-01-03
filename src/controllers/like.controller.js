import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"Invalid Video Id")
    }

    //check if the user has already liked this video

    const likedAlready = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    if (likedAlready) {
        //If liked, remove the like (Toggle off)
        await Like.findByIdAndDelete(likedAlready._id)

        return res 
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Removed like from video"))
        
    }

    //If not liked, create a new like (Toggle On)
    const newLike = await Like.create({
        video: videoId,
        likedBy: req.user?._id
    })

    return res
        .status(200)
    .json(new ApiResponse(200, { isLiked: true}, "Liked the video successfully"))

});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment ID is required");
    }

    //1. check if the user has already liked this specific comment

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    });

    if (existingLike) {
        //2. If it exists, the user is "unliking" it. Delete the record.
        await Like.findByIdAndDelete(existingLike._id);

        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Removed like from comment"));
        
    }

    // 3. If it doesn't exist, create a new Like record
    const newLike = await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }, "comment Liked successfully"));

});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    
    //1. Validation: Is the Id valid?
    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    //2. check if the user has already liked this tweet

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    });

    if (existingLike) {
        //3. If liked, REMOVE the tlike (Toggle off)
        await Like.findByIdAndDelete(existingLike._id);

        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Tweet unlike successfully"));
        
    }

    // 4. If not liked, create a new Like (Toggle on)
    const newLike = await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Tweet Liked successfully"));
}
);

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: { $exists: true, $ne: null } // Ensure we only get video likes
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
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
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                video: { $first: "$video" }
            }
        },
        {
            $match: {
                video: { $ne: null } // Filter out likes for videos that might have been deleted
            }
        },
        {
            $project: {
                _id: 1,
                video: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}