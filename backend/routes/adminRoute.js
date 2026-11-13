const express = require('express')
const router = express.Router()

const {signup, login, logout, getMyProfile, updateMyProfile, changePassword } = require('../controllers/admincontroller')
const adminAuth = require('../middleware/adminAuth')

router.post('/signup',signup)
router.post('/login',login)
router.post('/logout', logout)
router.get('/my-profile', adminAuth, getMyProfile)
router.put('/my-profile', adminAuth, updateMyProfile)
router.put('/change-password', adminAuth, changePassword)


module.exports = router