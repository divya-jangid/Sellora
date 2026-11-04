
const express = require('express')
const router = express.Router()

const {
    createBrand,
    getAllBrands,
    updateBrand,
    deleteBrand
} = require('../controllers/brandcontroller')

const upload = require('../middleware/upload')
const adminAuth = require('../middleware/adminAuth')
const checkPermission = require('../middleware/checkPermission')

// CREATE BRAND
router.post(
    '/create',
    adminAuth,
    checkPermission('brands_create'),
    upload.single('logo'),
    createBrand
)

// GET ALL BRANDS
router.get(
    '/get-all',
    adminAuth,
    checkPermission('brands_view'),
    getAllBrands
)

// UPDATE BRAND
router.put(
    '/update/:id',
    adminAuth,
    checkPermission('brands_edit'),
    upload.single('logo'),
    updateBrand
)

// UPDATE BRAND STATUS
router.put(
    '/status/:id',
    adminAuth,
    checkPermission('brands_edit'),
    updateBrand
)

// DELETE BRAND
router.delete(
    '/delete/:id',
    adminAuth,
    checkPermission('brands_delete'),
    deleteBrand
)

module.exports = router
