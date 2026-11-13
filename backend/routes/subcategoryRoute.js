const express = require('express');
const router = express.Router();

const {
    createSubCategory,
    getAllSubCategories,
    updateSubCategory,
    deleteSubCategory,
    updateSubCategoryStatus 
} = require('../controllers/subcategorycontroller');

const upload = require('../middleware/upload');
const adminAuth = require('../middleware/adminAuth');
const checkPermission = require('../middleware/checkPermission');

// CREATE SUBCATEGORY
router.post(
    '/create',
    adminAuth,
    checkPermission('subcategories_create'),
    upload.single('image'),
    createSubCategory
);

// GET ALL SUBCATEGORIES
router.get(
    '/get-all',
    adminAuth,
    checkPermission('subcategories_view'),
    getAllSubCategories
)

router.get('/public', getAllSubCategories)

// UPDATE SUBCATEGORY
router.put(
    '/update/:id',
    adminAuth,
    checkPermission('subcategories_edit'),
    upload.single('image'),
    updateSubCategory
);

// DELETE SUBCATEGORY
router.delete(
    '/delete/:id',
    adminAuth,
    checkPermission('subcategories_delete'),
    deleteSubCategory
);

// UPDATE SUBCATEGORY STATUS

router.put(
    '/status/:id',
    adminAuth,
    checkPermission('subcategories_edit'),
    updateSubCategoryStatus
)

module.exports = router;