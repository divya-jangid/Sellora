
const express = require('express')
const router = express.Router()

const {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
} = require('../controllers/categorycontroller')

const upload = require('../middleware/upload')
const adminAuth = require('../middleware/adminAuth')
const checkPermission = require('../middleware/checkPermission')

// CREATE CATEGORY
router.post(
    '/create',
    adminAuth,
    checkPermission('categories_create'),
    upload.single('image'),
    createCategory
)

// GET ALL CATEGORIES
router.get(
    '/get-all',
    adminAuth,
    checkPermission('categories_view'),
    getAllCategories
)

router.get('/public', getAllCategories)

// UPDATE CATEGORY
router.put(
    '/update/:id',
    adminAuth,
    checkPermission('categories_edit'),
    upload.single('image'),
    updateCategory
)

// DELETE CATEGORY
router.delete(
    '/delete/:id',
    adminAuth,
    checkPermission('categories_delete'),
    deleteCategory
)

// UPDATE CATEGORY STATUS
router.put(
    '/status/:id',
    adminAuth,
    checkPermission('categories_edit'),
    updateCategory
)

module.exports = router
