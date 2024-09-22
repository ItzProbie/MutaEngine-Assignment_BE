const express = require("express")
const router = express.Router()

const { login , signUp , sendOTP , generateResetPasswordToken , resetPassword, loginViaGoogle, wologin , wosignUp} = require("../controllers/Auth");

// Route for user login
router.post("/login", login);
//Route withour recaptch
router.post("/wologin", wologin);

// Route for user signup
router.post("/signup", signUp);
//Route withour recaptch
router.post("/wosignup", wosignUp);

// Route for sending OTP to the user's email
router.post("/sendotp", sendOTP);

// Route for generating a reset password token
router.post("/reset-password-token", generateResetPasswordToken)

// Route for resetting user's password after verification
router.post("/reset-password", resetPassword);

//OAuth login
router.get('/google-login' , loginViaGoogle);

module.exports = router;

