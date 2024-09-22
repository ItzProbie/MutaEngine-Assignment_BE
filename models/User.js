const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userName:{
        type : String,
        required:true,
        trim:true
    },
    email:{
        type : String,
        required:true,
        trim:true
    },
    password:{
        type : String,
        required:true,
    },
    accountType:{
        type:String,
        enum:["Basic" , "Premium"],
        required : true,
        default : "Basic"
    },
    subscriptionExpiry:{
        type:Date
    },
    totalDataSize:{
        type : Number,
        required:true,
        default : 0
    },
    media:[
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Media",
            default: []
        },
    ],
    resetPasswordToken:{
        type :String,
    },
    resetPasswordExpire : {
        type : Date
    }

},{ timestamps: true });

module.exports = mongoose.model("User" , userSchema);