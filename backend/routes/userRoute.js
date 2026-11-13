
const express = require('express')
const router = express.Router()

const {
    userSignup,
    verifyEmail,
    forgotPassword ,
    resetPassword,
    verifyResetOTP,
    userLogin,
    checkUser,
    createUser,
    getAllUsers,
    updateUser,
    deleteUser,
    updateMyProfile,
    deactivateMyAccount,
    logout,
    setPassword,
    updateUserStatus
} = require('../controllers/usercontroller')

const adminAuth = require('../middleware/adminAuth')
const checkPermission = require('../middleware/checkPermission')
const userAuth = require('../middleware/userAuth')

// Signup and login: public routes
router.post('/signup', userSignup)
router.post('/login', userLogin)

// Check logged-in user
router.get('/check-user', checkUser)

// User management: protected routes
router.post(
    '/create',
    adminAuth,
    checkPermission('users_create'),
    createUser
)

router.get(
    '/get-all',
    adminAuth,
    checkPermission('users_view'),
    getAllUsers
)

router.put(
    '/update/:id',
    adminAuth,
    checkPermission('users_edit'),
    updateUser
)

router.delete(
    '/delete/:id',
    adminAuth,
    checkPermission('users_delete'),    
    deleteUser
)

router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/verify-reset-otp', verifyResetOTP)

router.put('/my-profile', userAuth, updateMyProfile)

router.put('/deactivate-account', userAuth, deactivateMyAccount);

router.post('/verify-email', verifyEmail)

router.post('/logout', logout)
router.post('/set-password/:token', setPassword)
router.put(
    '/update-status/:id',
    adminAuth,
    checkPermission('users_edit'),
    updateUserStatus
)

module.exports = router
