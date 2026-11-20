const songStoryModel = require("../models/songStory.model");
const musicModel = require("../models/music.model");
const { uploadImage } = require("../services/storage.service");

// Allowed reactions
const ALLOWED_REACTIONS = ["❤️", "🔥", "🥹", "😍", "👏"];

async function createStory(req, res) {
    try {
        const { songId, note } = req.body;
        const file = req.file;

        if (!songId) {
            return res.status(400).json({ msg: "Please select a song for your story." });
        }

        if (!file) {
            return res.status(400).json({ msg: "Please upload a photograph for your story." });
        }

        // Validate that song exists
        const songExists = await musicModel.findById(songId);
        if (!songExists) {
            return res.status(404).json({ msg: "Selected song does not exist." });
        }

        if (note && note.length > 300) {
            return res.status(400).json({ msg: "Note exceeds the maximum limit of 300 characters." });
        }

        // Upload image to ImageKit
        const uploadResult = await uploadImage(file.buffer.toString("base64"), `story_${Date.now()}_${file.originalname}`);

        const story = await songStoryModel.create({
            user: req.user.id,
            song: songId,
            imageUrl: uploadResult.url,
            note: note ? note.trim() : "",
            reactions: []
        });

        const populatedStory = await songStoryModel.findById(story._id)
            .populate("user", "username email")
            .populate({
                path: "song",
                populate: { path: "artist", select: "username email" }
            });

        return res.status(201).json({
            msg: "Story published successfully!",
            story: populatedStory
        });
    } catch (err) {
        console.error("Create story error:", err);
        return res.status(500).json({ msg: "Failed to publish story", error: err.message });
    }
}

async function getAllStories(req, res) {
    try {
        const stories = await songStoryModel.find()
            .sort({ createdAt: -1 })
            .populate("user", "username email")
            .populate({
                path: "song",
                populate: { path: "artist", select: "username email" }
            });

        return res.status(200).json({
            msg: "Stories fetched successfully",
            stories: stories || []
        });
    } catch (err) {
        console.error("Get all stories error:", err);
        return res.status(500).json({ msg: "Failed to fetch stories", error: err.message });
    }
}

async function getStoryById(req, res) {
    try {
        const { id } = req.params;
        const story = await songStoryModel.findById(id)
            .populate("user", "username email")
            .populate({
                path: "song",
                populate: { path: "artist", select: "username email" }
            });

        if (!story) {
            return res.status(404).json({ msg: "Story not found." });
        }

        return res.status(200).json({
            msg: "Story fetched successfully",
            story
        });
    } catch (err) {
        console.error("Get story by id error:", err);
        return res.status(500).json({ msg: "Failed to fetch story", error: err.message });
    }
}

async function deleteStory(req, res) {
    try {
        const { id } = req.params;
        const story = await songStoryModel.findById(id);

        if (!story) {
            return res.status(404).json({ msg: "Story not found." });
        }

        // Verify ownership
        if (story.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({ msg: "Unauthorized: You can only delete your own stories." });
        }

        await songStoryModel.findByIdAndDelete(id);

        return res.status(200).json({
            msg: "Story deleted successfully",
            storyId: id
        });
    } catch (err) {
        console.error("Delete story error:", err);
        return res.status(500).json({ msg: "Failed to delete story", error: err.message });
    }
}

async function reactToStory(req, res) {
    try {
        const { id } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;

        if (!emoji || !ALLOWED_REACTIONS.includes(emoji)) {
            return res.status(400).json({ msg: "Invalid reaction emoji. Supported: " + ALLOWED_REACTIONS.join(" ") });
        }

        const story = await songStoryModel.findById(id);
        if (!story) {
            return res.status(404).json({ msg: "Story not found." });
        }

        // Find existing reaction from this user
        const existingIndex = story.reactions.findIndex(
            (r) => r.user.toString() === userId.toString()
        );

        if (existingIndex !== -1) {
            if (story.reactions[existingIndex].emoji === emoji) {
                // Same emoji clicked again -> Toggle off / remove reaction
                story.reactions.splice(existingIndex, 1);
            } else {
                // Different emoji -> Update reaction
                story.reactions[existingIndex].emoji = emoji;
            }
        } else {
            // New reaction
            story.reactions.push({
                user: userId,
                emoji
            });
        }

        await story.save();

        return res.status(200).json({
            msg: "Reaction updated successfully",
            reactions: story.reactions
        });
    } catch (err) {
        console.error("React to story error:", err);
        return res.status(500).json({ msg: "Failed to update reaction", error: err.message });
    }
}

module.exports = {
    createStory,
    getAllStories,
    getStoryById,
    deleteStory,
    reactToStory
};
