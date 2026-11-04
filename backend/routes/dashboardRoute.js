const express = require('express')
const router = express.Router()

const adminAuth = require('../middleware/adminAuth')
const { getDashboardData } = require('../controllers/dashboard')

router.get('/stats', adminAuth, getDashboardData)

module.exports = router