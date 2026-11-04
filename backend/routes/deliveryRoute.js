const express = require('express');
const router = express.Router();

const {
    assignDeliveryPartner,
    getAvailableDeliveryPartners,
    updateDeliveryStatus ,
    updateMyDeliveryStatus ,
    getMyDeliveries ,
    verifyDeliveryOtp ,
    resendDeliveryOtp 
} = require('../controllers/deliverycontroller');

const adminAuth = require('../middleware/adminAuth');
const checkPermission = require('../middleware/checkPermission')
const userAuth = require('../middleware/userAuth');

// Assign Delivery Partner
router.post(
    '/assign',
    adminAuth,
    checkPermission('orders_assign'),
    assignDeliveryPartner
);

router.get(
    '/available-partners',
    adminAuth,
    checkPermission('orders_view'),
    getAvailableDeliveryPartners
)

router.put(
    '/update-status/:id',
    adminAuth,
    checkPermission('deliverypartners_manage'),
    updateDeliveryStatus
)

router.put(
    '/my-delivery-status',
    userAuth,
    updateMyDeliveryStatus
)

router.get('/my-deliveries', userAuth, getMyDeliveries)



router.post(
    '/verify-delivery-otp',
    userAuth,
    verifyDeliveryOtp
);

router.post('/resend-delivery-otp', adminAuth, resendDeliveryOtp);

module.exports = router;