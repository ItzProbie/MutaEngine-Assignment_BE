const mongoose = require('mongoose');
const {mailSender} = require("../utils/mailSender");
const  {otpTemplate} = require("../mailTemplates/emailVerificationTemplate");
const otpSchema = new mongoose.Schema({
    email:{
        type :String,
        required : true
    },
    otp:{
        type :String,
        required : true,
    },
    createdAt:{
        type : Date,
        default : Date.now(),
        expires : 5*60
    }
});

//EMAIL SEND
async function sendVerificationMail(email,otp){
    try{

        const mailResponse  = await mailSender(email , "Verification mail" , otpTemplate(otp));
        console.log('mail sent successfully');

    }catch(err){
        console.log("error occurred while sending mails" , err);
        throw err;
    }
}

//PREMIDDLEWARE
otpSchema.pre("save", async function (next) {

	// Only send an email when a new document is created
	if (this.isNew) {
		await sendVerificationMail(this.email, this.otp);
	}
	next();
    
});

module.exports = mongoose.model("OTP" , otpSchema);