const express = require("express");
const router = express.Router();

const {createOrder , verifyPayment} = require("../controllers/Payment");
const { auth } = require("../middlewares/Auth");

router.post("/createOrder" , auth , createOrder);
router.post("/verifyPayment" , verifyPayment);

module.exports = router;
        