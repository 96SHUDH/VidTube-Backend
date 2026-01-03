import mongoose from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const commentsAggregation = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
                owner: { $first: "$owner" }
            }
        },
        {
            $sort: { createdAt: -1 } // Show newest comments first
        },
        {
            $skip: (pageNum - 1) * limitNum
        },
        {
            $limit: limitNum
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                commentsAggregation,
                "Comments fetched successfully"
            )
        );
});

const addComment = asyncHandler(async (req, res) => {
    // 1. Get videoId from params
    const { videoId } = req.params
    // 2. Get comment content from body
    const { content } = req.body

    // 3. Validation
    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required")
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID")
    }

    // 4. Create the comment document
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id // From verifyJWT middleware
    })

    if (!comment) {
        throw new ApiError(500, "Something went wrong while adding the comment")
    }

    // 5. Return response
    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    // 1. Get the comment ID from the URL and content from the body
    const { commentId } = req.params
    const { content } = req.body

    // 2. Validate input
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required to update a comment")
    }

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment ID")
    }


    // 3. Find the comment
    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // 4. Check Ownership: Ensure the person updating is the one who wrote it
    // We convert comment.owner to string because it is an ObjectId
    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to edit this comment")
    }

    // 5. Update the comment
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content
            }
        },
        { new: true } // Returns the document AFTER update
    )

    if (!updatedComment) {
        throw new ApiError(500, "Something went wrong while updating the comment")
    }

    // 6. Return response
    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully"))


})

const deleteComment = asyncHandler(async (req, res) => {
    // 1. Get the commentId from the URL params
    const { commentId } = req.params

    // 2. Validate the commentId
    if (!commentId || !mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment ID")
    }

    // 3. Find the comment in the database
    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // 4. Owner Validation (Security Check)
    // Check if the user trying to delete is the one who created it
    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this comment")
    }

    // 5. Delete the comment
    await Comment.findByIdAndDelete(commentId)

    // 6. Return response
    return res
        .status(200)
        .json(new ApiResponse(200, { commentId }, "Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }