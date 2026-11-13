
const express = require('express');
const router = express.Router();

const {
    assignDeliveryPartner,
    getAvailableDeliveryPartners,
    updateDeliveryStatus,
    updateMyDeliveryStatus,
    getMyDeliveries,
    getMyEarnings,
    verifyDeliveryOtp,
    resendDeliveryOtp
} = require('../controllers/deliverycontroller');

const adminAuth = require('../middleware/adminAuth');
const checkPermission = require('../middleware/checkPermission');
const userAuth = require('../middleware/userAuth');

// Assign Delivery Partner
router.post(
    '/assign',
    adminAuth,
    checkPermission('orders_assign'),
    assignDeliveryPartner
);

// Get Available Delivery Partners
router.get(
    '/available-partners',
    adminAuth,
    checkPermission('orders_view'),
    getAvailableDeliveryPartners
);

// Admin Update Delivery Status
router.put(
    '/update-status/:id',
    adminAuth,
    checkPermission('deliverypartners_manage'),
    updateDeliveryStatus
);

// Delivery Partner Update Own Status
router.put(
    '/my-delivery-status',
    userAuth,
    updateMyDeliveryStatus
);

// Get My Deliveries
router.get(
    '/my-deliveries',
    userAuth,
    getMyDeliveries
);

// Get My Earnings
router.get(
    '/my-earnings',
    userAuth,
    getMyEarnings
);

// Verify Delivery OTP
router.post(
    '/verify-delivery-otp',
    userAuth,
    verifyDeliveryOtp
);

// Resend Delivery OTP
router.post(
    '/resend-delivery-otp',
    userAuth,
    resendDeliveryOtp
);

module.exports = router;
