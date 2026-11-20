const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

// In-memory active rooms store: Map<string, Room>
const activeRooms = new Map();

// Helper to generate a clean 6-character room code
function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "ROOM-";
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Helper to escape HTML characters in chat messages
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getCalculatedPlayback(playback) {
    if (!playback.isPlaying || !playback.currentSong) {
        return {
            ...playback,
            currentPosition: playback.position
        };
    }
    const elapsedSeconds = (Date.now() - playback.lastUpdated) / 1000;
    return {
        ...playback,
        currentPosition: Math.max(0, playback.position + elapsedSeconds)
    };
}

function getSanitizedRoomState(room) {
    const participantsList = Array.from(room.participants.values()).map(p => ({
        userId: p.userId,
        username: p.username,
        isHost: p.isHost
    }));

    return {
        roomCode: room.roomCode,
        name: room.name,
        hostId: room.hostId,
        hostName: room.hostName,
        createdAt: room.createdAt,
        participants: participantsList,
        playback: getCalculatedPlayback(room.playback),
        messages: room.messages.slice(-50)
    };
}

function initListeningRoomsSocket(io) {
    // Authentication Middleware for Socket.IO
    io.use(async (socket, next) => {
        try {
            let token = socket.handshake.auth?.token;

            // Fallback: check cookie from headers
            if (!token && socket.handshake.headers.cookie) {
                const cookieMatch = socket.handshake.headers.cookie.match(/(?:^|;\s*)token=([^;]*)/);
                if (cookieMatch) {
                    token = cookieMatch[1];
                }
            }

            if (!token) {
                return next(new Error("Authentication error: No token provided."));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.id).select("-password");

            if (!user) {
                return next(new Error("Authentication error: User not found."));
            }

            socket.user = {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                role: user.role
            };

            next();
        } catch (err) {
            console.error("Socket authentication failed:", err.message);
            return next(new Error("Authentication error: " + err.message));
        }
    });

    io.on("connection", (socket) => {
        const user = socket.user;
        let currentRoomCode = null;

        // 1. CREATE ROOM
        socket.on("create-room", ({ roomName }) => {
            try {
                let roomCode = generateRoomCode();
                while (activeRooms.has(roomCode)) {
                    roomCode = generateRoomCode();
                }

                const newRoom = {
                    roomCode,
                    name: roomName ? roomName.trim().slice(0, 40) : `${user.username}'s Room`,
                    hostId: user.id,
                    hostName: user.username,
                    createdAt: new Date(),
                    participants: new Map(),
                    playback: {
                        currentSong: null,
                        isPlaying: false,
                        position: 0,
                        lastUpdated: Date.now(),
                        queue: [],
                        queueIndex: -1
                    },
                    messages: []
                };

                newRoom.participants.set(socket.id, {
                    socketId: socket.id,
                    userId: user.id,
                    username: user.username,
                    isHost: true
                });

                activeRooms.set(roomCode, newRoom);
                currentRoomCode = roomCode;

                socket.join(roomCode);

                socket.emit("room-created", { roomCode });
                socket.emit("room-state", getSanitizedRoomState(newRoom));
                broadcastPublicRooms();
            } catch (err) {
                socket.emit("error-message", { message: "Failed to create room: " + err.message });
            }
        });

        // 2. JOIN ROOM
        socket.on("join-room", ({ roomCode }) => {
            try {
                const code = roomCode ? roomCode.trim().toUpperCase() : "";
                const room = activeRooms.get(code);

                if (!room) {
                    return socket.emit("error-message", { message: `Room "${code}" not found. Please verify the room code.` });
                }

                // If already in a room, leave old one first
                if (currentRoomCode && currentRoomCode !== code) {
                    handleLeaveRoom(currentRoomCode);
                }

                currentRoomCode = code;
                socket.join(code);

                const isHost = room.hostId === user.id;

                room.participants.set(socket.id, {
                    socketId: socket.id,
                    userId: user.id,
                    username: user.username,
                    isHost
                });

                // Send complete synchronized state to joined user
                socket.emit("room-state", getSanitizedRoomState(room));

                // Notify other participants
                socket.to(code).emit("user-joined", {
                    userId: user.id,
                    username: user.username,
                    isHost
                });

                io.to(code).emit("room-members", Array.from(room.participants.values()).map(p => ({
                    userId: p.userId,
                    username: p.username,
                    isHost: p.isHost
                })));

                broadcastPublicRooms();
            } catch (err) {
                socket.emit("error-message", { message: "Failed to join room: " + err.message });
            }
        });

        // 3. LEAVE ROOM
        socket.on("leave-room", () => {
            if (currentRoomCode) {
                handleLeaveRoom(currentRoomCode);
                currentRoomCode = null;
            }
        });

        // 4. PLAY SONG (Host Only)
        socket.on("play-song", ({ song, position = 0 }) => {
            if (!currentRoomCode) return;
            const room = activeRooms.get(currentRoomCode);
            if (!room) return;

            if (room.hostId !== user.id) {
                return socket.emit("error-message", { message: "Only the host can control playback." });
            }

            if (song) {
                room.playback.currentSong = song;
            }

            room.playback.isPlaying = true;
            room.playback.position = position;
            room.playback.lastUpdated = Date.now();

            io.to(currentRoomCode).emit("playback-update", getCalculatedPlayback(room.playback));
            broadcastPublicRooms();
        });

        // 5. PAUSE SONG (Host Only)
        socket.on("pause-song", ({ position }) => {
            if (!currentRoomCode) return;
            const room = activeRooms.get(currentRoomCode);
            if (!room) return;

            if (room.hostId !== user.id) {
                return socket.emit("error-message", { message: "Only the host can pause playback." });
            }

            room.playback.isPlaying = false;
            room.playback.position = typeof position === "number" ? position : (getCalculatedPlayback(room.playback).currentPosition);
            room.playback.lastUpdated = Date.now();

            io.to(currentRoomCode).emit("playback-update", getCalculatedPlayback(room.playback));
        });

        // 6. SEEK SONG (Host Only)
        socket.on("seek-song", ({ position }) => {
            if (!currentRoomCode) return;
            const room = activeRooms.get(currentRoomCode);
            if (!room) return;

            if (room.hostId !== user.id) {
                return socket.emit("error-message", { message: "Only the host can seek audio." });
            }

            room.playback.position = Math.max(0, position);
            room.playback.lastUpdated = Date.now();

            io.to(currentRoomCode).emit("playback-update", getCalculatedPlayback(room.playback));
        });

        // 7. NEXT SONG (Host Only)
        socket.on("next-song", () => {
            if (!currentRoomCode) return;
            const room = activeRooms.get(currentRoomCode);
            if (!room || room.hostId !== user.id) return;

            if (room.playback.queue.length > 0) {
                const nextIdx = room.playback.queueIndex + 1;
                if (nextIdx < room.playback.queue.length) {
                    room.playback.queueIndex = nextIdx;
                    room.playback.currentSong = room.playback.queue[nextIdx];
                    room.playback.isPlaying = true;
                    room.playback.position = 0;
                    room.playback.lastUpdated = Date.now();

                    io.to(currentRoomCode).emit("playback-update", getCalculatedPlayback(room.playback));
                    io.to(currentRoomCode).emit("queue-updated", {
                        queue: room.playback.queue,
                        queueIndex: room.playback.queueIndex
                    });
                }
            }
        });

        // 8. PREVIOUS SONG (Host Only)
        socket.on("previous-song", () => {
            if (!currentRoomCode) return;
            const room = activeRooms.get(currentRoomCode);
            if (!room || room.hostId !== user.id) return;

            if (room.playback.queue.length > 0) {
                const prevIdx = room.playback.queueIndex - 1;
                if (prevIdx >= 0) {
                    room.playback.queueIndex = prevIdx;
                    room.playback.currentSong = room.playback.queue[prevIdx];
                    room.playback.isPlaying = true;
                    room.playback.position = 0;
                    room.playback.lastUpdated = Date.now();

                    io.to(currentRoomCode).emit("playback-update", getCalculatedPlayback(room.playback));
                    io.to(currentRoomCode).emit("queue-updated", {
                        queue: room.playback.queue,
                        queueIndex: room.playback.queueIndex
                    });
                } else {
                    room.playback.position = 0;
                    room.playback.lastUpdated = Date.now();
                    io.to(currentRoomCode).emit("playback-update", getCalculatedPlayback(room.playback));
                }
            }
        });

        // 9. ADD TO QUEUE (Open to all participants)
        socket.on("add-to-queue", ({ song }) => {
            if (!currentRoomCode || !song) return;
            const room = activeRooms.get(currentRoomCode);
            if (!room) return;

            const queuedSong = {
                ...song,
                addedBy: user.username,
                addedAt: new Date()
            };

            room.playback.queue.push(queuedSong);

            // If nothing is currently playing, start playing this song
            if (!room.playback.currentSong) {
                room.playback.currentSong = queuedSong;
                room.playback.queueIndex = room.playback.queue.length - 1;
                room.playback.isPlaying = true;
                room.playback.position = 0;
                room.playback.lastUpdated = Date.now();

                io.to(currentRoomCode).emit("playback-update", getCalculatedPlayback(room.playback));
            }

            io.to(currentRoomCode).emit("queue-updated", {
                queue: room.playback.queue,
                queueIndex: room.playback.queueIndex,
                addedBy: user.username
            });
        });

        // 10. REMOVE FROM QUEUE (Host Only)
        socket.on("remove-from-queue", ({ index }) => {
            if (!currentRoomCode) return;
            const room = activeRooms.get(currentRoomCode);
            if (!room || room.hostId !== user.id) return;

            if (index >= 0 && index < room.playback.queue.length) {
                room.playback.queue.splice(index, 1);
                if (index < room.playback.queueIndex) {
                    room.playback.queueIndex--;
                }
                io.to(currentRoomCode).emit("queue-updated", {
                    queue: room.playback.queue,
                    queueIndex: room.playback.queueIndex
                });
            }
        });

        // 11. SEND CHAT MESSAGE
        socket.on("send-message", ({ text }) => {
            if (!currentRoomCode || !text) return;
            const room = activeRooms.get(currentRoomCode);
            if (!room) return;

            const sanitizedText = escapeHtml(text.trim()).slice(0, 500);
            if (!sanitizedText) return;

            const messageObj = {
                id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
                senderId: user.id,
                senderName: user.username,
                text: sanitizedText,
                timestamp: new Date()
            };

            room.messages.push(messageObj);
            if (room.messages.length > 100) {
                room.messages.shift();
            }

            io.to(currentRoomCode).emit("receive-message", messageObj);
        });

        // 12. SEND LIVE REACTION
        const VALID_EMOJIS = ["❤️", "😂", "🔥", "👏", "🎵", "🥹"];
        socket.on("send-reaction", ({ emoji }) => {
            if (!currentRoomCode || !VALID_EMOJIS.includes(emoji)) return;

            io.to(currentRoomCode).emit("receive-reaction", {
                id: Date.now() + "_" + Math.random(),
                senderId: user.id,
                senderName: user.username,
                emoji
            });
        });

        // 13. GET PUBLIC ROOMS LIST
        socket.on("get-public-rooms", () => {
            socket.emit("public-rooms-list", getPublicRoomsList());
        });

        // Helper to leave a room
        function handleLeaveRoom(code) {
            const room = activeRooms.get(code);
            if (!room) return;

            room.participants.delete(socket.id);
            socket.leave(code);

            socket.to(code).emit("user-left", {
                userId: user.id,
                username: user.username
            });

            if (room.participants.size === 0) {
                // Room is empty -> clean up
                activeRooms.delete(code);
                broadcastPublicRooms();
            } else {
                // If the host left, transfer host role to the first remaining participant
                if (room.hostId === user.id) {
                    const nextHost = room.participants.values().next().value;
                    if (nextHost) {
                        nextHost.isHost = true;
                        room.hostId = nextHost.userId;
                        room.hostName = nextHost.username;

                        io.to(code).emit("host-transferred", {
                            newHostId: nextHost.userId,
                            newHostName: nextHost.username
                        });
                    }
                }

                io.to(code).emit("room-members", Array.from(room.participants.values()).map(p => ({
                    userId: p.userId,
                    username: p.username,
                    isHost: p.isHost
                })));
                broadcastPublicRooms();
            }
        }

        function getPublicRoomsList() {
            const list = [];
            for (const room of activeRooms.values()) {
                list.push({
                    roomCode: room.roomCode,
                    name: room.name,
                    hostName: room.hostName,
                    participantCount: room.participants.size,
                    currentSong: room.playback.currentSong ? {
                        title: room.playback.currentSong.title,
                        artist: room.playback.currentSong.artist?.username || "Artist"
                    } : null
                });
            }
            return list;
        }

        function broadcastPublicRooms() {
            io.emit("public-rooms-list", getPublicRoomsList());
        }

        // DISCONNECT
        socket.on("disconnect", () => {
            if (currentRoomCode) {
                handleLeaveRoom(currentRoomCode);
            }
        });
    });
}

module.exports = { initListeningRoomsSocket };
