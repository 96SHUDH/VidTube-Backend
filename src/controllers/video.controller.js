import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const pipeline = [];

    // 1. Search by text query (Title or Description)
    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        });
    }

    // 2. Filter by userId (if specifically looking for a user's videos)
    if (userId) {
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    // 3. Filter only published videos
    pipeline.push({ $match: { isPublished: true } });

    // 4. Sort dynamically
    // sortType can be 'asc' (1) or 'desc' (-1)
    pipeline.push({
        $sort: {
            [sortBy]: sortType === "asc" ? 1 : -1
        }
    });

    // 5. Pagination logic
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // 6. Join with Owner details
    pipeline.push(
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
        { $unwind: "$owner" } // Convert owner array to object
    
    );

    const videos = await Video.aggregate(pipeline);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    
    // 1. Validation: Check if title and description are provided
    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Title and description are required")
    }

    // 2. Get video and thumbnail local paths from req.files (Multer)
    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    // 3. Upload video and thumbnail to Cloudinary
    // Note: Video uploads take longer; Cloudinary returns 'duration' for videos
    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile) {
        throw new ApiError(500, "Video upload failed")
    }

    if (!thumbnail) {
        throw new ApiError(500, "Thumbnail upload failed")
    }

    // 4. Create video document in Database
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        timeDuration: videoFile.duration, // Cloudinary provides this automatically
        isPublished: true,
        owner: req.user?._id // Assumes user is logged in (verifyJWT middleware)
    })

    if (!video) {
        throw new ApiError(500,"Video publishing failed in database")
    }

    return res 
        .status(201)
    .json(new ApiResponse(201,video,"Video published successfully"))

});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    // 1. Validate if videoId is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID")
    }

    // 2. Find the video by ID
    const video = await Video.findById(videoId).populate("owner", "username fullname avatar");

    // 3. Check if video exists
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // 4. Return response
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"))
    
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    // 1. Validation
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    // Ensure at least one field is provided for update
    if (!(title || description || req.file?.path)) {
        throw new ApiError(400, "At least one field (title, description, or thumbnail) is required for update");
    }

    // 2. Find video and verify ownership
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Unauthorized: You cannot edit someone else's video");
    }

    // 3. Handle Thumbnail Update
    const thumbnailLocalPath = req.file?.path;
    
    if (thumbnailLocalPath) {
        // Upload new one
        const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        
        if (!newThumbnail.url) {
            throw new ApiError(500, "Error while uploading new thumbnail");
        }

        // OPTIONAL BUT RECOMMENDED: Delete old thumbnail from Cloudinary
        // Extract publicId: https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg -> sample
        const oldThumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0];
        await deleteFromCloudinary(oldThumbnailPublicId);

        video.thumbnail = newThumbnail.url;
    }

    // 4. Update text fields if provided
    if (title) video.title = title;
    if (description) video.description = description;

    // 5. Save the document
    const updatedVideo = await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    // 1. Validation: Check if videoId is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID")
    }

    // 2. Find the video in the database
    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // 3. Authorization: Only the owner should be able to delete the video
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this video")
    }

    // 4. Delete files from Cloudinary
    // We need to extract the public_id from the URLs to delete them
    const videoPublicId = video.videoFile.split("/").pop().split(".")[0];
    const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0];

    try {
        await deleteFromCloudinary(videoPublicId, "video") // Note: specify 'video' type
        await deleteFromCloudinary(thumbnailPublicId)
    } catch (error) {
        throw new ApiError(500, "Error while deleting files from Cloudinary")
    }

    // 5. Delete the document from MongoDB
    await Video.findByIdAndDelete(videoId)

    // 6. Optional: Remove this video from all users' watchHistory
    await User.updateMany(
        { watchHistory: videoId },
        { $pull: { watchHistory: videoId } }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"))

});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // 1. Validate VideoId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID")
    }

    // 2. Find the video
    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // 3. Security Check: Is the person logged in the owner of this video?
    // Note: toString() is used because req.user._id and video.owner are Objects
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to toggle this video")
    }

    // 4. Toggle the status
    video.isPublished = !video.isPublished

    // 5. Save the updated video
    await video.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: video.isPublished },
                "Video publish status toggled successfully"
            )
        )
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}