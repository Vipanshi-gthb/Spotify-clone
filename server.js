require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/db/db");
const { initListeningRoomsSocket } = require("./src/sockets/listeningRoom.socket");

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => callback(null, true),
        credentials: true
    }
});

initListeningRoomsSocket(io);

server.listen(3000, () => {
    console.log("Server is running on port 3000 (with Socket.IO)");
});