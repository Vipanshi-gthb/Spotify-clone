const jwt = require("jsonwebtoken");

async function authArtist(req, res, next){

    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);

    if(!token){
        return res.status(401).json({
            msg : "Unauthorized"
        })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(decoded.role !== "artist"){
            return res.status(403).json({
                msg : "You don't have the access",
            })
        }

        req.user = decoded;

        next();
    }
    catch(err){
        console.log(err);

        return res.status(401).json({
            msg : "Unauthorized"
        })
    }
}
async function authUser(req, res, next){

    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);

    if(!token){
        return res.status(401).json({
            msg : "Unauthorized"
        })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(decoded.role !== "user" && decoded.role !== "artist"){
            return res.status(403).json({
                msg : "You don't have the access",
            })
        }

        req.user = decoded;

        next();
    }
    catch(err){
        console.log(err);

        return res.status(401).json({
            msg : "Unauthorized"
        })
    }
}

module.exports = { authArtist, authUser };