const Media = require("../models/Media");
const User = require("../models/User");
const { uploadFileToCloudinary, deleteImageFromCloudinary, deleteVideoFromCloudinary } = require("../utils/cloudinary")

//image uploader handler
exports.imageUpload = async(req,res) => {

    try{

        const {id} = req.user;
        const name = req.body.name; 

        console.log(name);
        

        const file = req.files.imageFile;      

        //validation
        if(!name){
            return res.status(400).json({
                success : false,
                message : "Incomplete Details"
            });
        }

        const supportedTypes = ["jpg" , "jpeg" , "png"];
        
        const fileType = file.name.split('.')[1].toLowerCase();

        if(!isFileTypeSupported(fileType , supportedTypes)){

            return res.status(400).json({
                success : false,
                message : 'File format not supported'
            });

        }

        const response = await uploadFileToCloudinary(file , "MutaEngine");        

        const fileData = await Media.create({
            name ,
            userId : id,
            fileType : "Image",
            publicAcessUrl : response.secure_url,
            size : response.bytes
        });

        //add it to the user profile
        await User.findByIdAndUpdate(
            id,
            {
                $push: { media: fileData._id },
                $inc: { totalDataSize: fileData.size }, // Increment totalDataSize if needed
            },
            { new: true }  
        );
        

        return res.status(200).json({
            success : true,
            url : response.secure_url,
            message : "Image Uploaded Successfully"
        });

    }catch(err){
        console.error(err);
        return res.status(500).json({
            success : false,
            message : err.message
        });
    }

}

//video upload handler
exports.videoUpload = async(req , res) => {

    try{

        const {id} = req.user;
        const name = req.body.name;
        console.log(name);
        
        const file = req.files.videoFile;      

        //validation
        if(!name){
            return res.status(400).json({
                success : false,
                message : "Incomplete Details"
            });
        }

        const supportedTypes = ["mp4" , "mov" , "gif"];
        const fileType = file.name.split('.')[1].toLowerCase();

        if(!isFileTypeSupported(fileType , supportedTypes)){

            return res.status(400).json({
                success : false,
                message : 'File format not supported'
            });

        }

        const response = await uploadFileToCloudinary(file , "MutaEngine");
        // console.log(response);

        const fileData = await Media.create({
            name ,
            userId : id,
            fileType : "Video",
            publicAcessUrl : response.secure_url,
            size : response.bytes
        });

        //add it to the user profile
        await User.findByIdAndUpdate(
            id,
            {
                $push: { media: fileData._id }, 
                $inc: { totalDataSize: fileData.size }, //increment totalDataSize if needed
            }
        );     

        return res.status(200).json({
            success : true , 
            url : response.secure_url,
            message : "Video Uploaded Successfully"
        });

    }catch(err){
        console.error(err);
        return res.status(500).json({
            success : false,
            message : err.message
        });
        
    }

}

//image deleter
exports.deleteImage = async(req , res) => {

    try{

        const {mediaId} = req.params;

        if(!mediaId){
            return res.status(400).json({
                success : false,
                message : "Invalid Media ID"
            });
        }

        const media = await Media.findById(mediaId);

        if(!media || media.fileType !== 'Image'){
            return res.status(404).json({
                success : false,
                message : "File invalid"
            });
        }

        if(String(media.userId) !== String(req.user.id)){
            return  res.status(401).json({
                success : false,
                message : "Unauthorized"
            });
        }

        const imageId = media.publicAcessUrl.split('/').reverse()[0].split('.')[0];

        const deleteMedia = await deleteImageFromCloudinary(imageId);

        if(deleteMedia.result !== 'ok'){
            return res.status(502).json({
                success: false,
                message: "Failed to delete file from Cloudinary",
            });
        }

        await User.findByIdAndUpdate(
            media.userId, 
            { 
                $pull: { media: media._id } ,  // $pull removes the specified mediaId from the media array
                $inc: { totalDataSize: -media.size }, // Decrease totalDataSize by the size of the media
            }
        );

        await Media.findByIdAndDelete(media._id);

        return res.status(200).json({
            success : true,
            message : "File deleted successfully"
        });
        

    }catch(err){

        console.error(err);
        return res.status(500).json({
            success : false,
            message : err.message
        });

    }

}

//video deleter
exports.deleteVideo = async(req , res) => {

    try{

        const {mediaId} = req.params;

        if(!mediaId){
            return res.status(400).json({
                success : false,
                message : "Invalid Media ID"
            });
        }

        const media = await Media.findById(mediaId);

        if(!media || media.fileType !== 'Video'){
            return res.status(404).json({
                success : false,
                message : "File invalid"
            });
        }

        if(String(media.userId) !== String(req.user.id)){
            return  res.status(401).json({
                success : false,
                message : "Unauthorized"
            });
        }

        const videoId = media.publicAcessUrl.split('/').reverse()[0].split('.')[0];

        const deleteMedia = await deleteVideoFromCloudinary(videoId);

        if(deleteMedia.result !== 'ok'){
            return res.status(502).json({
                success: false,
                message: "Failed to delete file from Cloudinary",
            });
        }

        await User.findByIdAndUpdate(
            media.userId, 
            { 
                $pull: { media: media._id } ,  // $pull removes the specified mediaId from the media array
                $inc: { totalDataSize: -media.size }, // Decrease totalDataSize by the size of the media
            }
        );

        await Media.findByIdAndDelete(media._id);

        return res.status(200).json({
            success : true,
            message : "File deleted successfully"
        });
        

    }catch(err){

        console.error(err);
        return res.status(500).json({
            success : false,
            message : err.message
        });

    }

}

// fecth all media
exports.getAllMedia = async(req,res) => {

    try {
        // Find the user by ID and select specific fields
        const user = await User.findById(req.user.id)
            .select('userName email media accountType') 
            .populate({
                path: 'media',
                select: 'name fileType publicAcessUrl size uploadDate' // Select fields from Media
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const response = {
            id: user._id,
            email: user.email,
            name: user.userName,
            accountType: user.accountType,
            media: user.media // This will already be populated
        };
        
        return res.status(200).json({
            success: true,
            user: response,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }

}

function isFileTypeSupported(type , supportedTypes){
    return supportedTypes.includes(type);
}

