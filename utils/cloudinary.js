
const cloudinary = require("cloudinary").v2;

exports.uploadFileToCloudinary = async(file , folder) => {

    try{

        const options = {folder};
        options.resource_type = "auto"

        return await cloudinary.uploader.upload(file.tempFilePath , options);

    }catch(err){
        console.log(err);               
    }
}

exports.deleteImageFromCloudinary = async(imageId) => {

    try{

        const del = await cloudinary.uploader.destroy(`MutaEngine/${imageId}` , {invalidate : true , resource_type : "image"});
        return del;

    }catch(err){
        console.log(err);
    }

}

//TEST THIS 
exports.deleteVideoFromCloudinary = async(videoId) => {

    try{

        const del = await cloudinary.uploader.destroy(`MutaEngine/${videoId}` , {invalidate : true , resource_type : "video"});
        return del;

    }catch(err){
        console.log(err);
    }

}