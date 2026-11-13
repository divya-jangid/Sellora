const express = require('express')
const router = express.Router()

const {
    getAllDeliveryPartners,
    updateDeliveryPartnerStatus,
    getPendingReassignment,
    updateOnlineStatus ,
    updateAvailability ,
    getMyAvailability 
} = require('../controllers/deliverypartnercontroller')

const adminAuth = require('../middleware/adminAuth')
const userAuth = require('../middleware/userAuth');
const checkPermission = require('../middleware/checkPermission')

// Get All Delivery Partners
router.get(
    '/get-all',
    adminAuth,
    checkPermission('deliverypartners_view'),
    getAllDeliveryPartners
)

// Update Delivery Partner Status
router.put(
    '/update-status/:id',
    adminAuth,
    checkPermission('deliverypartners_manage'),
    updateDeliveryPartnerStatus
)


router.get(
    '/pending-reassignment',
    adminAuth,
    checkPermission('deliverypartners_manage'),
    getPendingReassignment
);


// Delivery Partner Online / Offline
router.put(
    '/online-status',
    userAuth,
    updateOnlineStatus
)

// Delivery Partner Availability
router.put(
    '/availability-status',
    userAuth,
    updateAvailability
)

router.get(
    '/my-availability',
    userAuth,
    getMyAvailability
)

module.exports = router