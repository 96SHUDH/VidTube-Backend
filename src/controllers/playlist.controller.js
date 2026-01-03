import mongoose, {isValidObjectId} from "mongoose"
import { Playlist } from "../models/playlist.models.js"
import {Video} from "../models/video.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"



const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    // 1. Validation: Check if name and description exist
    if (!name || !description) {
        throw new ApiError(400, "Name and description are required")
    }

    // 2. Create the playlist in the database
    // Note: owner comes from req.user?._id (provided by verifyJWT middleware)
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
        videos: [] // Initialize with an empty array of videos
    })

    if (!playlist) {
        throw new ApiError(500, "Something went wrong while creating the playlist")
    }

    // 3. Return success response
    return res
        .status(201)
        .json(new ApiResponse(201, playlist, "Playlist created successfully"))

});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!userId?.trim()) {
        throw new ApiError(400, "User ID is required")
    }

    // Optional: Check if the ID is a valid MongoDB ObjectId to prevent casting errors
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid User ID format")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "playlistVideos"
            }
        },
        {
            $addFields: {
                totalVideos: { $size: "$playlistVideos" },
                totalViews: { $sum: "$playlistVideos.views" }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
    ])
    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "User playlists fetched successfully"))
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // 1. Validation: Check if playlistId is a valid MongoDB ObjectId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID")
    }

    // 2. Fetch playlist and populate nested details
    // We want the video details and the owner's basic info
    const playlist = await Playlist.findById(playlistId)
        .populate({
            path: "videos",
            select: "title thumbnail duration views owner",
            populate: {
                path: "owner",
                select: "username fullname avatar"
            }
        })
        .populate("owner", "username fullname avatar");
    
    // 3. Check if playlist exists
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // 4. Return response
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));

});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    
    // 1. Validation: Check if IDs are valid
    if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Playlist or Video ID")
    }

    // 2. Find the playlist
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // 3. Authorization: Check if the logged-in user owns this playlist
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to add videos to this playlist")
    }

    // 4. Check if the video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // 5. Update the playlist using $addToSet (prevents duplicates)
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId,
            },
        },
        { new: true }
    )
    if (!updatedPlaylist) {
        throw new ApiError(500, "Something went wrong while adding video to playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully"))
    
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    // 1. Validation
    if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Playlist or Video ID")
    }

    // 2. Fetch the playlist first to check ownership
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // 3. Authorization Check (CRITICAL)
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to remove videos from this playlist")
    }

    // 4. Perform the update
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        { new: true }
    )

    // 5. Return response
    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully"))
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    
    // 1. Validation: Check if playlistId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID")
    }

    // 2. Find the playlist
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    // 3. Authorization: Check if the current user is the owner of the playlist
    // We convert both to strings for a clean comparison
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this playlist")
    }

    // 4. Delete the playlist
    await Playlist.findByIdAndDelete(playlistId)

    // 5. Return success response
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist deleted successfully"))
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    
    // 1. Validation: Ensure at least one field is provided for the update
    if (!name && !description) {
        throw new ApiError(400, "Name or description is required to update the playlist")
    }

    // 2. Validate Playlist ID format
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, "Playlist not found")

    //  Add ownership check
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Only the owner can update this playlist")
    }

    // 3. Update the playlist in the database
    // We use { new: true } to get the updated document back
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        { new: true }
    )

    

    // 5. Return success response
    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
        )
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}