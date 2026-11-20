const { ImageKit } = require("@imagekit/nodejs");

let imageKitClientInstance = null;

function getImageKitClient() {
    if (imageKitClientInstance) {
        return imageKitClientInstance;
    }

    const privateKey = process.env.IMAGE_KIT_PRIVATE_KEY || process.env.IMAGEKIT_PRIVATE_KEY;

    if (!privateKey) {
        throw new Error(
            "ImageKit private key is missing or empty. Please set IMAGE_KIT_PRIVATE_KEY in your .env file."
        );
    }

    imageKitClientInstance = new ImageKit({
        privateKey
    });

    return imageKitClientInstance;
}

async function uploadFile(file) {
    const client = getImageKitClient();
    const result = await client.files.upload({
        file,
        fileName: "music_" + Date.now(),
        folder: "yt-complete-backend/music"
    });

    return result;
}

async function uploadImage(file, customFileName) {
    const client = getImageKitClient();
    const result = await client.files.upload({
        file,
        fileName: customFileName || ("story_" + Date.now()),
        folder: "yt-complete-backend/stories"
    });

    return result;
}

module.exports = { uploadFile, uploadImage, getImageKitClient };
