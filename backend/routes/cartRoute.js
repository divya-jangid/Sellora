
const express = require('express')
const router = express.Router()

const userAuth = require('../middleware/userAuth')

const {
    addToCart,
    getCart,
    applyCoupon,
    removeCoupon 
} = require('../controllers/cartcontroller')

router.post('/add', userAuth, addToCart)
router.get('/get', userAuth, getCart)
router.post('/apply-coupon', userAuth,applyCoupon)
router.delete('/remove-coupon', userAuth, removeCoupon)

module.exports = router
