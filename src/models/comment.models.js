import mongoose, { Schema } from "mongoose";  
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: [true, "Comment content is required"],
            trim: true // Removes accidental leading/trailing spaces
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: true,
            index: true // Speeds up the getVideoComments query
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
    },
    { 
        timestamps: true 
    }
);

// This plugin allows you to use Comment.aggregatePaginate() in your controllers
commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model("Comment", commentSchema);