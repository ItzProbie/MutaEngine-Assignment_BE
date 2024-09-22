const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
    name:{
        type:String,
        required : true
    },
    userId:{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    fileType: {
        type:String,
        enum:["Image" , "Video"],
        required : true
    },
    publicAcessUrl: {
        type:String,
    },
    size: {
        type:Number,
        required:true
    },
    uploadDate: {
        type:Date,
        default:Date.now()
    }
});

module.exports = mongoose.model("Media" , mediaSchema);