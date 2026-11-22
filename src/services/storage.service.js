const fs = require("fs");
const path = require("path");
const { ImageKit } = require("@imagekit/nodejs");

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

let imageKitClientInstance = null;

function getImageKitClient() {
    if (imageKitClientInstance) {
        return imageKitClientInstance;
    }

    const privateKey = process.env.IMAGE_KIT_PRIVATE_KEY || process.env.IMAGEKIT_PRIVATE_KEY;

    if (!privateKey || privateKey.includes("your_imagekit_private_key_here")) {
        return null;
    }

    imageKitClientInstance = new ImageKit({
        privateKey
    });

    return imageKitClientInstance;
}

async function uploadFile(file, customFileName) {
    const fileName = customFileName || ("music_" + Date.now() + ".mp3");
    const client = getImageKitClient();

    if (client) {
        try {
            const result = await client.files.upload({
                file,
                fileName,
                folder: "yt-complete-backend/music"
            });
            return result;
        } catch (err) {
            console.warn("ImageKit upload failed, falling back to local storage:", err.message);
        }
    }

    // Local file fallback
    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file, "base64");
    const safeName = Date.now() + "_" + fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, buffer);

    return {
        url: `/uploads/${safeName}`
    };
}

async function uploadImage(file, customFileName) {
    const fileName = customFileName || ("story_" + Date.now() + ".jpg");
    const client = getImageKitClient();

    if (client) {
        try {
            const result = await client.files.upload({
                file,
                fileName,
                folder: "yt-complete-backend/stories"
            });
            return result;
        } catch (err) {
            console.warn("ImageKit upload failed, falling back to local storage:", err.message);
        }
    }

    // Local file fallback
    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file, "base64");
    const safeName = Date.now() + "_" + fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, buffer);

    return {
        url: `/uploads/${safeName}`
    };
}

module.exports = { uploadFile, uploadImage, getImageKitClient };
