const express = require('express');
const router = express.Router();

const { placeOrder, getOrders, getMyOrders , cancelOrder , 
    getOrderById, getAllOrders, updateOrderStatus, getAdminOrderDetails } = require('../controllers/ordercontroller');
const userAuth = require('../middleware/userAuth')
const adminAuth = require('../middleware/adminAuth')
const checkPermission = require('../middleware/checkPermission')

router.post('/place', userAuth, placeOrder)
router.get('/get-order', userAuth, getOrders)
router.get('/my-orders', userAuth, getMyOrders);
router.put('/cancel/:id', userAuth, cancelOrder)
router.get('/details/:id', userAuth, getOrderById)
router.put('/update-status', updateOrderStatus)
router.get(
    '/get-all',
    adminAuth,
    checkPermission('orders_view'),
    getAllOrders
)

router.get(
    '/admin-details/:id',
    adminAuth,
    checkPermission('orders_view'),
    getAdminOrderDetails
)

module.exports = router