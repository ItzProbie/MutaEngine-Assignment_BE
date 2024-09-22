const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.urlencoded({ extended: true }));
require("dotenv").config();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());
const fileupload = require("express-fileupload");
app.use(fileupload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));

const db = require("./config/database");
db.connect();

const cloudinary = require("./config/cloudinary");
cloudinary.cloudinaryConnect();

const mediaRoutes = require("./routes/Media");
const userRoutes   = require("./routes/User");
const paymentRoutes   = require("./routes/Payment");

app.use('/api/v1/media' , mediaRoutes);
app.use('/api/v1/auth' , userRoutes);
app.use('/api/v1/payment' , paymentRoutes);



app.listen(PORT , () => {
    console.log(`App started @ Port ${PORT}`);    
})





