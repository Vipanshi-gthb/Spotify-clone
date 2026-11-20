const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

async function registerUser(req, res){

    const {username, email, password, role = "user"} = req.body;

    const isUserAlreadyExists = await userModel.findOne({
        $or: [
            {username},
            {email}
        ]
    })

    if(isUserAlreadyExists){
        return res.status(409).json({
            msg : "User already exists"
        })
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        username,
        email,
        password : hash,
        role
    })

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
    })
}

async function loginUser(req, res){
    const {username, email, password} = req.body;

    const user = await userModel.findOne({
        $or:[
            {username},
            {email}
        ]
    })

    if(!user){
        return res.status(401).json({
            msg : "Invalid Credentials"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid){
        return res.status(401).json({
            msg : "Invalid Credentials"
        })
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
    })
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
        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
}

module.exports = { registerUser, loginUser, logoutUser, getMe };