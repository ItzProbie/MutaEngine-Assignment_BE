const nodemailer = require("nodemailer");
const fs = require("fs")
// require('dotenv').config();

// exports.mailSender = async(email , title , body) => {
//     try{

//         let transporter = nodemailer.createTransport({
//             host : process.env.MAIL_HOST,
//             auth : {
//                 user : process.env.MAIL_USER,
//                 pass : process.env.MAIL_PASS
//             }

//         })

//         let info = await transporter.sendMail({
//             from : "Assignment@MetaEngine",
//             to : `${email}`,
//             subject : `${title}`,
//             html : `${body}`
//         })

//     }catch(err){
//         console.log(err);
//     }
// };

exports.mailSender = async (email, title, body, pdfPath = null) => {
    try {
        // Create a transporter
        let transporter = nodemailer.createTransport({
            host : process.env.MAIL_HOST,
            auth : {
                user : process.env.MAIL_USER,
                pass : process.env.MAIL_PASS
            }
        });

        // Prepare the mail options
        let mailOptions = {
            from: "Assignment@MetaEngine",
            to: email,
            subject: title,
            html: body
        };

        // If a PDF path is provided, add it as an attachment
        if (pdfPath) {
            // Check if the PDF file exists
            if (fs.existsSync(pdfPath)) {
                mailOptions.attachments = [
                    {
                        filename: 'invoice.pdf', // Name of the PDF file
                        path: pdfPath // Path to the PDF file
                    }
                ];
            } else {
                console.error("PDF file does not exist:", pdfPath);
                return; // Exit if the PDF doesn't exist
            }
        }

        // Send the email
        let info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.messageId);

    } catch (err) {
        console.error("Error sending email:", err);
    }
};
