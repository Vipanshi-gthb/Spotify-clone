const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.route");
const musicRoutes = require("./routes/music.route");
const songStoryRoutes = require("./routes/songStory.route");

const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "http://localhost:5173");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/stories", songStoryRoutes);

module.exports = app;
