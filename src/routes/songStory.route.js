const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middlewares/auth.middleware");
const songStoryController = require("../controllers/songStory.controller");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max photo
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files (.jpg, .jpeg, .png, .webp) are allowed!"), false);
        }
    }
});

const router = express.Router();

// Public: Browse feed of stories
router.get("/", songStoryController.getAllStories);

// Public: Get individual story
router.get("/:id", songStoryController.getStoryById);

// Protected: Publish a story
router.post("/", authMiddleware.authUser, upload.single("image"), songStoryController.createStory);

// Protected: Delete own story
router.delete("/:id", authMiddleware.authUser, songStoryController.deleteStory);

// Protected: React to story
router.post("/:id/react", authMiddleware.authUser, songStoryController.reactToStory);

module.exports = router;
