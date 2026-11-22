const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

async function registerUser(req, res){
    try {
        const {username, email, password, role = "user"} = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                msg: "Username, email, and password are required."
            });
        }

        const isUserAlreadyExists = await userModel.findOne({
            $or: [
                {username},
                {email}
            ]
        });

        if(isUserAlreadyExists){
            return res.status(409).json({
                msg : "User already exists"
            });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email,
            password : hash,
            role
        });

        const token = jwt.sign({
            id : user._id,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token);

        res.status(200).json({
            msg : "User registered successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch(err) {
        console.error("Registration error:", err);
        return res.status(500).json({
            msg: "Server error occurred during registration."
        });
    }
}

async function loginUser(req, res){
    try {
        const {username, email, password} = req.body;

        if ((!username && !email) || !password) {
            return res.status(400).json({
                msg: "Please provide an email or username, and a password."
            });
        }

        const queryConditions = [];
        if (username) queryConditions.push({ username });
        if (email) queryConditions.push({ email });

        const user = await userModel.findOne({
            $or: queryConditions
        });

        if(!user){
            return res.status(401).json({
                msg : "Invalid Credentials"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            return res.status(401).json({
                msg : "Invalid Credentials"
            });
        }

        const token = jwt.sign({
            id: user._id,
            role: user.role,
        }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token);

        res.status(200).json({
            msg: "Logged in successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            }
        });
    } catch(err) {
        console.error("Login error:", err);
        return res.status(500).json({
            msg: "Server error occurred during login."
        });
    }
}

async function logoutUser(req, res){
    res.clearCookie("token");
    res.status(200).json({
        msg : "User logged out successfully",
    })
}

async function getMe(req, res){
    try {
        const user = await userModel.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.status(200).json({
            user: {
                id: user._id,
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
}

module.exports = { registerUser, loginUser, logoutUser, getMe };