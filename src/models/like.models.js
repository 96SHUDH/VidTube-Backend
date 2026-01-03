import mongoose, { Schema } from "mongoose";  

const likesSchema = new Schema(
    {
        //either of 'video','comment' or 'tweet' will be assigned others are null
        videos: {
            type: Schema.Types.ObjectId,
            ref: "Video",
        },

        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
        },
        tweet: {
            type: Schema.Types.ObjectId,
            ref: "Tweet",
            
        },
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);
export const Like = mongoose.model("Like", likesSchema); 

