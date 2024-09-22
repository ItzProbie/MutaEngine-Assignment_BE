const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");
const redisClient = require("../config/redisClient");

exports.auth = async(req,res,next) => {
    try{

        //extract token
        const token = req.body.token   ||
                      (req.header("Authorization") && req.header("Authorization").replace("Bearer ", ""));
        
        if(!token){
            return res.status(401).json({
                success : false,
                mesage : "Auth Failed"
            });
        }

        //verify token
        try{
            
            const decode = jwt.verify(token , process.env.JWT_SECRET);
            
            req.user = decode;
            // console.log(decode);
            

        }catch(err){
            return res.status(401).json({
                success :false,
                message : "token is invalid"
            });
        }
        next();

    }catch(err){
        console.log(err);
        return res.status(401).json({
            success :false,
            message : "Something went wrong while validating the token",
            error : err.mesage
        });
    }
};

exports.isPremiumUser = async(req,res,next) => {
    try{

        //check the data using payload
        if(req.user.accountType !== "Premium"){
            return res.status(401).json({
                success : false,
                message : "Upgrade to premium to use this feature"
            });
        }

        next();

    }catch(err){
        return res.status(500).json({
            success : false,
            mesage : "User role cant be verified , plz try again",
            error : err.message,
        });
    }
};

exports.checkImageUploadLimits = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        const numOfFiles = (user?.media) ? user.media.length : 0;
        const { totalDataSize } = user;
        const file = req?.files.imageFile;

        
        // console.log(file);

        if(!file){
            return res.status(400).json({
                success : false,
                message : "Missing File"
            });
        }

        const redisKey = `upload_count:${user._id}`;
        const exists = await redisClient.exists(redisKey);

        if(!exists) {
          
            await redisClient.set(redisKey, 1, 'EX', 7200); // 7200 seconds = 2 hours
        
        }else {
            
            const uploadCount = parseInt(await redisClient.get(redisKey));
            const ttl = await redisClient.ttl(redisKey);

            // If the user has reached the upload limit, deny further uploads
            if (uploadCount >= 10) {
                return res.status(403).json({
                    success: false,
                    message: "Upload limit reached. You cannot upload more images.",
                    timeRemaining: `${ttl} seconds` // Send remaining time in seconds
                });
            }
            // Increment the upload count
            await redisClient.incr(redisKey);
        }


        const fileSize = file.size;

        const maxFiles = (user.accountType === "Premium") ? process.env.PREMIUM_MAX_FILE_CNT : process.env.BASIC_FILE_CNT;
        const maxFileSize =  (user.accountType === "Premium") ? process.env.PREMIUM_MAX_FILE_SIZE : process.env.BASIC_MAX_FILE_SIZE;
        const totalAllowedSize =  (user.accountType === "Premium") ? process.env.PREMIUM_TOTAL_FILE_SIZE : process.env.BASIC_TOTAL_FILE_SIZE;

        // Check if the number of files exceeds the limit
        if (numOfFiles > maxFiles) {
            return res.status(403).json({
                success: false,
                message: `Limit reached. You can only upload up to ${maxFiles} files.`
            });
        }
        
        
        if(totalDataSize + fileSize > totalAllowedSize * 1024 * 1024 ){
            return res.status(403).json({
                success: false,
                message: `Limit reached. You can only upload up to ${totalAllowedSize} mb of files.`
            });
        }

        // Check if file size exceeds
        if (fileSize > maxFileSize * 1024 * 1024) { 
            return res.status(403).json({
                success: false,
                message: `File size exceeds the ${maxFileSize}MB limit.`
            });
        }

        next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "An error occurred while checking upload limits.",
            error: err.message,
        });
    }
};

exports.checkVideoUploadLimits = async(req , res , next) => {

    try {
        const user = await User.findById(req.user.id);
        const numOfFiles = (user.media) ? user.media.length : 0;
        const { totalDataSize } = user;
        const file = req.files.videoFile;      
        // console.log(file);

        const redisKey = `upload_count:${user._id}`;
        const exists = await redisClient.exists(redisKey);

        if(!exists) {
          
            await redisClient.set(redisKey, 1, 'EX', 7200); // 7200 seconds = 2 hours
        
        }else {
            
            const uploadCount = parseInt(await redisClient.get(redisKey));
            const ttl = await redisClient.ttl(redisKey);

            // If the user has reached the upload limit, deny further uploads
            if (uploadCount >= 10) {
                return res.status(403).json({
                    success: false,
                    message: "Upload limit reached. You cannot upload more images.",
                    timeRemaining: `${ttl} seconds` // Send remaining time in seconds
                });
            }
            // Increment the upload count
            await redisClient.incr(redisKey);
        }

        if(!file){
            return res.status(400).json({
                success : false,
                message : "Missing File"
            });
        }

        const fileSize = file.size;

        const maxFiles = (user.accountType === "Premium") ? process.env.PREMIUM_MAX_FILE_CNT : process.env.BASIC_FILE_CNT;
        const totalAllowedSize =  (user.accountType === "Premium") ? process.env.PREMIUM_TOTAL_FILE_SIZE : process.env.BASIC_TOTAL_FILE_SIZE;
        const maxFileSize =  process.env.VIDEO_MAX_FILE_SIZE;

        // Check if the number of files exceeds the limit
        if (numOfFiles > maxFiles) {
            return res.status(403).json({
                success: false,
                message: `Limit reached. You can only upload up to ${maxFiles} files.`
            });
        }
        
        
        if(totalDataSize + fileSize > totalAllowedSize * 1024 * 1024 ){
            return res.status(403).json({
                success: false,
                message: `Limit reached. You can only upload up to ${totalAllowedSize} mb of files.`
            });
        }

        // Check if file size exceeds
        if (fileSize > maxFileSize * 1024 * 1024) { 
            return res.status(403).json({
                success: false,
                message: `File size exceeds the ${maxFileSize}MB limit.`
            });
        }

        next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "An error occurred while checking upload limits.",
            error: err.message,
        });
    }

}
