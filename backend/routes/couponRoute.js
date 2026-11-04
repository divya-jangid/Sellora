const express = require('express')
const router = express.Router()

const { createCoupon, getAllCoupons, getCouponById, updateCoupon, deleteCoupon } = require('../controllers/couponcontroller')

router.post('/create',createCoupon)
router.get('/get-all',getAllCoupons)
router.get('/get-by-id/:id',getCouponById)
router.put('/update/:id',updateCoupon)
router.delete('/delete/:id',deleteCoupon)

module.exports = router