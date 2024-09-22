const razorpay = require("razorpay");
require("dotenv").config();


exports.createRazorpayInstance = () => {

    return new razorpay({

        key_id: process.env.RAZORPAY_KEY,
        key_secret: process.env.RAZORPAY_SECRET

    });

};

