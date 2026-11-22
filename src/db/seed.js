require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const userModel = require("../models/user.model");
const musicModel = require("../models/music.model");
const albumModel = require("../models/album.model");
const songStoryModel = require("../models/songStory.model");

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/spotify-clone");
        console.log("Connected to MongoDB for comprehensive seeding...");

        const pwHash = await bcrypt.hash("password123", 10);

        // 1. Seed Users
        const testAccounts = [
            {
                username: "test_listener",
                email: "test@test.com",
                password: pwHash,
                role: "user"
            },
            {
                username: "test_artist",
                email: "test_2@test.com",
                password: pwHash,
                role: "artist"
            }
        ];

        const usersMap = {};
        for (const account of testAccounts) {
            let user = await userModel.findOne({ email: account.email });
            if (!user) {
                user = await userModel.create(account);
                console.log(`Created user: ${account.email} (${account.role})`);
            } else {
                console.log(`User already exists: ${account.email}`);
            }
            usersMap[account.email] = user;
        }

        const artistUser = usersMap["test_2@test.com"];
        const listenerUser = usersMap["test@test.com"];

        // 2. Seed Songs
        const sampleSongs = [
            {
                title: "Starry Night Grooves",
                uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                artist: artistUser._id
            },
            {
                title: "Acoustic Sunset",
                uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                artist: artistUser._id
            },
            {
                title: "Cyberpunk Echoes",
                uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
                artist: artistUser._id
            },
            {
                title: "Lo-Fi Midnight Study",
                uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
                artist: artistUser._id
            },
            {
                title: "Summer Euphoria",
                uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
                artist: artistUser._id
            }
        ];

        const createdSongs = [];
        for (const songData of sampleSongs) {
            let song = await musicModel.findOne({ title: songData.title });
            if (!song) {
                song = await musicModel.create(songData);
                console.log(`Created song: ${song.title}`);
            } else {
                console.log(`Song exists: ${song.title}`);
            }
            createdSongs.push(song);
        }

        // 3. Seed Album
        let album = await albumModel.findOne({ title: "Neon Reflections" });
        if (!album) {
            album = await albumModel.create({
                title: "Neon Reflections",
                artist: artistUser._id,
                musics: createdSongs.map(s => s._id)
            });
            console.log(`Created album: ${album.title}`);
        } else {
            console.log(`Album exists: ${album.title}`);
        }

        // 4. Seed Song Stories
        const sampleStories = [
            {
                user: listenerUser._id,
                song: createdSongs[0]._id,
                imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
                note: "Listening to this on repeat while driving through the mountains at sunset. Unforgettable memories with my best friends! 🌄✨",
                reactions: [
                    { user: artistUser._id, emoji: "❤️" },
                    { user: listenerUser._id, emoji: "🔥" }
                ]
            },
            {
                user: artistUser._id,
                song: createdSongs[1]._id,
                imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
                note: "First live concert after college graduation. The energy in the crowd when this drop hit gave me goosebumps all over! 🔥🎶",
                reactions: [
                    { user: listenerUser._id, emoji: "😍" },
                    { user: artistUser._id, emoji: "👏" }
                ]
            }
        ];

        for (const storyData of sampleStories) {
            const existingStory = await songStoryModel.findOne({
                user: storyData.user,
                song: storyData.song
            });
            if (!existingStory) {
                await songStoryModel.create(storyData);
                console.log("Created sample Song Story.");
            } else {
                console.log("Sample Song Story already exists.");
            }
        }

        console.log("Seeding complete! Virtual Listening Rooms and Song Stories are ready.");
    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();
