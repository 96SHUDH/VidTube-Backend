import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    // 1. Get content from the request body
    const { content } = req.body

    // 2. Validation: Check if content is empty
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required to create a tweet")
    }

    // 3. Create the tweet object in the database
    // req.user._id comes from your verifyJWT middleware
    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })

    // 4. Check if tweet was actually created
    if (!tweet) {
        throw new ApiError(500, "Something went wrong while creating the tweet")
    }

    // 5. Return success response
    return res
        .status(201)
        .json(new ApiResponse(201, tweet, "Tweet created successfully"))
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
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
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $sort: {
                createdAt: -1 // Show latest tweets first
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "User tweets fetched successfully"))
});

const updateTweet = asyncHandler(async (req, res) => {
    // 1. Get tweetId from params and content from body
    const { tweetId } = req.params
    const { content } = req.body

    // 2. Validation
    if (!content || content?.trim() === "") {
        throw new ApiError(400, "Content is required to update tweet")
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID")
    }

    // 3. Find the tweet
    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    // 4. Access Control: Check if the logged-in user is the owner
    // We convert both to strings to ensure an accurate comparison
    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to update this tweet")
    }

    // 5. Perform the update
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        { new: true } // returns the document after update
    )

    if (!updatedTweet) {
        throw new ApiError(500, "Something went wrong while updating tweet")
    }

    // 6. Send Response
    return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))
});

const deleteTweet = asyncHandler(async (req, res) => {
    // 1. Get the tweetId from the URL params
    const { tweetId } = req.params;

    // 2. Validate if tweetId is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    // 3. Find the tweet in the database
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    // 4. Authorization Check: Check if the person deleting is the owner
    // We use .toString() because the owner field is an ObjectId
    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this tweet");
    }

    // 5. Delete the tweet
    await Tweet.findByIdAndDelete(tweetId);

    // 6. Return response
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}