const {createRazorpayInstance} = require("../config/razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodemailer = require('nodemailer');
const pdfMake = require('pdfmake');
const fs = require('fs');
const {mailSender} = require("../utils/mailSender");
const path = require("path");
const pdf = require('html-pdf');

const razorpayInstance = createRazorpayInstance();

exports.createOrder = async(req , res) => {

    try{
    //fetch all details using id from db for security
    const userId = req.user.id;
    console.log(userId);
    
        console.log(req.user);
        
    //validation checks
    if(!userId){
        return res.status(400).json({
            success : false,
            message : "Invalid userId"
        });
    }

    const user = await User.findById(userId);

    if(!user){
        return res.status(404).json({
            success : false,
            message : "Invalid User"
        });
    }

    const amount =  parseInt(process.env.PREMIUM_PLAN_COST);

    //create an order
    const options = {
        amount : amount*100,
        currency: "INR",
        receipt: `${Date.now().toString().slice(-10)}-premium-${userId.slice(0, 20)}`,
        notes: {
            userId: userId 
        }
    }    

    

        razorpayInstance.orders.create(options , (err , order) => {
            if(err){
                console.error(err);
                return res.status(500).json({
                    success : false,
                    mssg : err.message
                });
            }
            return res.status(200).json(order);
        })

    }catch(err){
        console.error(err);        
        return res.status(500).json({
            success : false,
            message : err.message
        });
    }

}

function generateInvoice({
    SubscriptionValidTill,
    payment_id,
    order_id,
    email,
    name
}) {
    return new Promise((resolve, reject) => {

        let htmlPath = path.join(__dirname, '../mailTemplates/invoiceTemplate.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Replace placeholders with actual values
        html = html
            .replace(/{{name}}/g, name)
            .replace(/{{email}}/g, email)
            .replace(/{{order_id}}/g, order_id)
            .replace(/{{payment_id}}/g, payment_id)
            .replace(/{{subscription_valid_till}}/g, SubscriptionValidTill);

        const options = {
            format: 'Letter'
        };

        const currentDate = new Date().toISOString().slice(0, 10); // Get the date in YYYY-MM-DD format
        const sanitizedEmail = email.replace(/[@.]/g, '_'); // Replace "@" and "." in email to make it filename-friendly
        const invoiceFileName = `./invoice_${currentDate}_${sanitizedEmail}_${payment_id}.pdf`;

        pdf.create(html, options).toFile(invoiceFileName, function(err, resp) {
            if (err) {
                reject(err);
            } else {
                console.log('PDF generated successfully:', resp);
                resolve(invoiceFileName);
            }
        });
    });
}

exports.verifyPayment = async(req , res) => {

     try{

        const {order_id , payment_id , signature} = req.body;

         const today = new Date();

           

        //create hmac object
        const hmac = crypto.createHmac("sha256" , process.env.RAZORPAY_SECRET);
   
        hmac.update( order_id + "|" + payment_id );
   
        const generateSignature = hmac.digest("hex");
   
        if(generateSignature === signature){
           
           //db ops
           const order = await razorpayInstance.orders.fetch(order_id);
           const userId = order.notes.userId;
   
           const updatedUser = await User.findByIdAndUpdate(
               userId,
               { accountType: "Premium" },
               { new: true }
           );
           console.log(updatedUser);

            const subscriptionValidTill = new Date(today);
            subscriptionValidTill.setMonth(subscriptionValidTill.getMonth() + 3);

            const formatDate = (date) => date.toISOString().split('T')[0];
            generateInvoice({
                SubscriptionValidTill: formatDate(subscriptionValidTill),
                payment_id,
                order_id,
                email: updatedUser.email,
                name: updatedUser.userName
            })
            .then(pdfPath => {
                const title = 'Your Invoice';
                const body = '<h1>Invoice Details</h1><p>Please find your invoice attached.</p>';
                return mailSender('pjkkulkarnipiyush024@gmail.com', title, body, pdfPath);
            })
            .then(() => console.log('Mail sent!'))
            .catch(err => console.error('Error:', err));

           
           if (!updatedUser) {
               return res.status(404).json({
                   success: false,
                   message: "Payment Failed"
               });
           }
   
           const payload = {
               email : updatedUser.email,
               id : updatedUser._id,
               accountType : updatedUser.accountType,
           }
           const token = jwt.sign(payload , process.env.JWT_SECRET , {
               expiresIn : "4h",
           });
   

          //  const today = new Date();

          //   // Calculate subscriptionValidTill (3 months from today)
          //   const subscriptionValidTill = new Date(today);
          //   subscriptionValidTill.setMonth(subscriptionValidTill.getMonth() + 3);

            // const formatDate = (date) => date.toISOString().split('T')[0];

            // // Update userData with dynamic dates
            // const userData = {
            //     userName: updatedUser.userName,
            //     email: updatedUser.email,
            //     subscriptionValidTill: formatDate(subscriptionValidTill), // 3 months from today
            //     invoiceGenerationDate: formatDate(today) // Today's date
            // };
          
          // Define the PDF template
        //   const template = fs.readFileSync('.\controllers\template.html', 'utf8');

        // const templatePath = path.resolve(__dirname+'/template.html');

        // // Read the PDF template
        // const template = fs.readFileSync(templatePath, 'utf8');
          
        //   // Define the PDF generation options
        //   const pdfOptions = {
        //     content: template,
        //     defaultStyle: {
        //       font: 'Arial'
        //     },
        //     data: userData // Pass the user data to pdfMake
        //   };
          
        //   // Generate the PDF
        //   pdfMake.createPdf(pdfOptions).write('output.pdf', (err) => {
        //     if (err) {
        //       console.error(err);
        //       return;
        //     }
          
        //     // Create a mail options object
        //     const mailOptions = {
        //       from: "Assignment@MetaEngine",
        //       to: `${updatedUser.email}`,
        //       subject: 'Invoice',
        //       text: 'Please find the attached invoice PDF for your premium subscription',
        //       attachments: [
        //         {
        //           filename: 'output.pdf',
        //           path: 'output.pdf',
        //           contentType: 'application/pdf'
        //         }
        //       ]
        //     };
          
        //     // Send the email with the PDF attachment
        //     transporter.sendMail(mailOptions, (err, info) => {
        //       if (err) {
        //         console.error(err);
        //       } else {
        //         console.log(`Email sent: ${info.response}`);
        //       }
        //     });
        //   });
          


           return res.status(200).json({
               success : true,
               token , 
               name : updatedUser.userName,
               dp : updatedUser.image,
               message : "Payment verified"
           });
   
   
        }
        else{
   
           return res.status(400).json({
               success : false,
               message : "Paymeny Failed"
           });
   
        }

     }catch(err){
        console.error(err);
        return res.status(500).json({
            success : false,
            message : err.message
        })
     }

}
