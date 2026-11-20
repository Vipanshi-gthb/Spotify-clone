const mongoose = require("mongoose");

const songStorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    song: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "music",
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    note: {
        type: String,
        maxlength: 300,
        default: ""
    },
    reactions: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
                required: true
            },
            emoji: {
                type: String,
                required: true
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const songStoryModel = mongoose.model("songStory", songStorySchema);

module.exports = songStoryModel;
