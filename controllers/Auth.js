const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {mailSender} = require("../utils/mailSender");
const axios = require('axios');
const { oauth2client } = require("../utils/google");
require('dotenv').config();

exports.sendOTP = async(req,res) => {

    try{

        //fetch email
        const  {email} = req.body;        

        if(!email){
          return res.status(400).json({
            success : false,
            message : "Email Missing"
          });
        }
      
        //reregistered user??
        const checkUserPresent = await User.findOne({email});

        if(checkUserPresent){
            return res.status(401).json({
                success : false,
                message : "User already registered"
            });
        }

        //generate otp
        var otp = otpGenerator.generate(6 , {
            upperCaseAlphabets : false,
            lowerCaseAlphabets : false,
            specialChars : false
        });

        // console.log("OTP GENERATED : " , otp);

        //check if otp is unique or not
        let result = await OTP.findOne({otp : otp});

        while(result){
            otp = otpGenerator(6 , {
                upperCaseAlphabets : false,
                lowerCaseAlphabets : false,
                specialChars : false
            }); 
            result = await OTP.findOne({otp : otp});
        }

        const otpPayload = {email,otp};

        //enter otp in db
        const otpBody = await OTP.create(otpPayload);

        res.status(200).json({
            success : true,
            mesage : "OTP SENT SUCCESSFULLY",
        });

    }catch(err)
    {
        console.log(err);
        return res.status(500).jon({
            success : false,
            message : "ERROR WHILE SENDING OTP",
            error : err.message
        });
    }
};
//without  recaptcha
exports.wosignUp = async(req,res) => {

    try {
        // Destructure fields from the request body
        const {
          userName,
          email,
          password,
          otp,
        } = req.body
        // Check if All Details are there or not
        if (
          !userName ||
          !email ||
          !password ||
          !otp
        ) {
          return res.status(403).send({
            success: false,
            message: "All Fields are required",
          })
        }
    
        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "User already exists. Please log in to continue.",
          })
        }
    
        // Find the most recent OTP for the email
        const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1)

        if (response.length === 0) {
          // OTP not found for the email
          return res.status(400).json({
            success: false,
            message: "The OTP is not valid",
          })
        } else if (parseInt(otp) !== parseInt(response[0].otp)) {
          // Invalid OTP
          return res.status(400).json({
            success: false,
            message: "The OTP is not valid",
          })
        }
    
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10)
    
        const user = await User.create({
          userName,
          email,
          password: hashedPassword,
          accountType: user.accountType,
          // image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })
    
        return res.status(200).json({
          success: true,
          user : `${userName}`,
          message: "User registered successfully",
        })
      } catch (error) {
        console.error(error)
        return res.status(500).json({
          success: false,
          message: "User cannot be registered. Please try again.",
        })
      }
}
//without recaptch 
exports.wologin = async(req,res) => {
    try{

        //fetch data from body
        const {email,password} = req.body;
        //validation
        if(!email || !password){
            return res.status(403).json({
                success : false,
                message : "Incomplete login credentials"
            });
        }

        //check if user exists
        const user = await User.findOne({email});

        if(!user){
            return res.status(404).json({
                success : false,
                message : "User not registered"
            });
        }

        //if password matched henerate JWT token
        if(await bcrypt.compare(password , user.password)){
            const payload = {
                email : user.email,
                id : user._id,
                accountType : user.accountType,
            }
            const token = jwt.sign(payload , process.env.JWT_SECRET , {
                expiresIn : "4h",
            });
            // user.token = token;
            // user.password = undefined;

            return res.status(200).json({
                success : true,
                token , 
                name : user.userName,
                dp : user.image,
                accountType: user.accountType,
                message : "Logged in successfully"
            });

        }
        else{
            return res.status(401).json({
                success : false,
                message : "Invalid Mail Password Combination"
            });
        }

    }catch(err){
        console.log(err);
        return res.status(500).json({
            success : false,
            message : "ERROR IN LOGIN , please try again"
        });
    }
};



exports.generateResetPasswordToken = async(req,res) => {

  try{

      const {email} = req.body;
      if(!email){
          return res.status(400).json({
              success : false,
              message : "Email Missing"
          });
      }

      const user = await User.findOne({email});
      if(!user){
          return res.status(404).json({
              successs : false,
              message : "Invalid email"
          });
      }

      const token = crypto.randomBytes(20).toString("hex");
      await User.findByIdAndUpdate(user._id , {
          resetPasswordToken : token , 
          resetPasswordExpire : Date.now() + 5*60*1000
      });

      //#TODO change this to the frontendlink
      const url = `https://muta-engine-assignment-fe.vercel.app/update-password/${token}`;

      await mailSender(
          email , 
          "Password Reset",
          `Your Link for email verification is ${url}. Please click this url to reset your password.`
      );

      return res.status(200).json({
          success : true,
          message : "Mail sent successfully"
      });

  }catch(err){
      console.log(err);
      return res.status(500).json({
          success : false,
          message : "Error while generating resetPasswordToken",
          error : err.message
      })
  }

}

exports.resetPassword = async(req,res) => {

  try{

      const {password , token } = req.body;
      console.log(password , token);
      
      if(!password || !token){
          return res.status(400).json({
              success : false,
              message : "All fields are mandatory"
          });
      }

      const user = await User.findOne({resetPasswordToken : token}).select("resetPasswordToken resetPasswordExpire");
      if(!user){
          return res.status(404).json({
              success : false,
              message : "Invalid Token"
          });
      }

      if(user.resetPasswordExpire < Date.now()){
          return res.json({
              success : false,
              message : "Token expired , plz regenerate your token"
          });
      }

      const hashedPassword = await bcrypt.hash(password , 10);
      user.password = hashedPassword;
      await user.save();

      return res.status(200).json({
          success : true,
          message : "Password Reset Successfull"
      });


  }catch(err){
      console.log(err);
      return res.status(500).json({
          success : false,
          message : "Error while resetting password",
          error : err.message
      })
  }


}


// RECAPTCHA VERIFICATION
exports.signUp = async(req,res) => {

    try {
        

        // Destructure fields from the request body
        const {
            userName,
            email,
            password,
            otp,
            recaptchaValue
          } = req.body

          console.log(recaptchaValue);
          

        if (
          !userName ||
          !email ||
          !password ||
          !otp ||
          !recaptchaValue
        ) {
          return res.status(403).send({
            success: false,
            message: "All Fields are required",
          })
        }

        const recaptchaResponse = await axios({
            url: `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${recaptchaValue}`,
            method: 'POST'
        });

        // console.log(recaptchaResponse);
        

        if (!recaptchaResponse.data.success) {
          return res.status(403).send({
            success: false,
            message: "Recaptcha Failed",
          })
        }

      
         // Check if user already exists
         const existingUser = await User.findOne({ email })
         if (existingUser) {
           return res.status(400).json({
             success: false,
             message: "User already exists. Please log in to continue.",
           })
         }
    
         // Find the most recent OTP for the email
         const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1)

         if (response.length === 0) {
           // OTP not found for the email
           return res.status(400).json({
             success: false,
             message: "The OTP is not valid",
           })
         } else if (otp !== response[0].otp) {
           // Invalid OTP
           return res.status(400).json({
             success: false,
             message: "The OTP is not valid",
           })
         }
    
         // Hash the password
         const hashedPassword = await bcrypt.hash(password, 10)
    
         const user = await User.create({
           userName,
           email,
           password: hashedPassword,
          //  image: `https://api.dicebear.com/5.x/initials/svg?seed=${userName}`,
         })
    


         return res.status(200).json({
           success: true,
           user : `${userName}`,
           message: "User registered successfully",
         })

      } catch (error) {
        console.error(error)
        return res.status(500).json({
          success: false,
          message: "User cannot be registered. Please try again.",
        })
      }
}

exports.login = async(req,res) => {
    try{

        //fetch data from body
        const {email,password , recaptchaValue} = req.body;
        //validation
        if(!email || !password || !recaptchaValue){
            return res.status(403).json({
                success : false,
                message : "Incomplete login credentials"
            });
        }

        const recaptchaResponse = await axios({
            url: `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${recaptchaValue}`,
            method: 'POST'
        });

        // console.log(recaptchaResponse);
        

        if (!recaptchaResponse.data.success) {
          return res.status(403).send({
            success: false,
            message: "Recaptcha Failed",
          })
        }

        //check if user exists

        const user = await User.findOne({email});

        if(!user){
            return res.status(404).json({
                success : false,
                message : "User not registered"
            });
        }

        //if password matched henerate JWT token
        if(await bcrypt.compare(password , user.password)){
            const payload = {
                email : user.email,
                id : user._id,
                accountType : user.accountType,
            }
            const token = jwt.sign(payload , process.env.JWT_SECRET , {
                expiresIn : "4h",
            });
            user.token = token;
            user.password = undefined;

            return res.status(200).json({
                success : true,
                token , 
                name : user.userName,
                accountType: user.accountType,
                message : "Logged in successfully"
            });

        }
        else{
            return res.status(401).json({
                success : false,
                message : "Invalid Mail Password Combination"
            });
        }

    }catch(err){
        console.log(err);
        return res.status(500).json({
            success : false,
            message : "ERROR IN LOGIN , please try again"
        });
    }


};

exports.loginViaGoogle = async(req , res) => {

    try{

        const {code} = req.query;
        console.log(code);
        
        const googleRes = await oauth2client.getToken(code);
        oauth2client.setCredentials(googleRes.tokens);

        const userRes = await axios.get(
          `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
        );
        console.log("google : " , userRes.data);
        
        const {email , name , picture} = userRes.data;

        let user = await User.findOne({email});
        const hashedPassword = crypto.randomBytes(16).toString('hex');

        //IF USER IS NOT KNOWN CREATE USER ENTRY
        if(!user){

            user = await User.create({
              userName: name,
              email,
              password: hashedPassword,
              image: picture,
            });

            const payload = {
              email : user.email,
              id : user._id,
              accountType : user.accountType,
            }
            const token = jwt.sign(payload , process.env.JWT_SECRET , {
                expiresIn : "4h",
            });
            // console.log(payload);
            
            
            return res.status(200).json({
                success : true,
                token , 
                name : user.userName,
                image : user.image || picture,
                email: user.email,
                accountType: user.accountType,
                message : "Logged in successfully"
            });

        }
        // console.log({
        //   success : true,
        //   name : user.firstName,
        //   image : picture,
        //   email: user.email,
        //   message : "Logged in successfully"
        // });
        
        const payload = {
          email : user.email,
          id : user._id,
          accountType : user.accountType,
        }
        const token = jwt.sign(payload , process.env.JWT_SECRET , {
            expiresIn : "4h",
        });

        return res.status(200).json({
          success : true,
          name : user.userName,
          token ,
          image : picture,
          email: user.email,
          accountType: user.accountType,
          message : "Logged in successfully"
      });


    }catch(err){

      console.error(err);
      return res.status(500).json({
          success : false,
          message : err.message
      });

    }

}
