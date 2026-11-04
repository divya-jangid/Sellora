const express = require('express');
const router = express.Router();

const {
    createRazorpayOrder,
    verifyRazorpayPayment ,
    createPayment,
    getPayments
} = require('../controllers/paymentcontroller');

const userAuth = require('../middleware/userAuth');

router.post('/create', userAuth, createPayment);

router.get('/get', userAuth, getPayments);

router.post('/razorpay/create-order', userAuth, createRazorpayOrder)
router.post('/razorpay/verify', userAuth, verifyRazorpayPayment);

module.exports = router;