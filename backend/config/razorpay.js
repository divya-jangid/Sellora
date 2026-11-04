const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_TEST_API,
    key_secret: process.env.RAZORPAY_SECRET_API
});

module.exports = razorpay