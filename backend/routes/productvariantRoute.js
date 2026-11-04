
const express = require('express');
const router = express.Router();

const {
    createProductVariant,
    getAllProductVariants,
    updateProductVariant,
    deleteProductVariant
} = require('../controllers/productvariantcontroller');

const upload = require('../middleware/upload');
const adminAuth = require('../middleware/adminAuth');
const checkPermission = require('../middleware/checkPermission');

// CREATE VARIANT
router.post(
    '/create',
    adminAuth,
    checkPermission('productvariant_create'),
    upload.array('images', 5),
    createProductVariant
);

// GET ALL VARIANTS - ADMIN
router.get(
    '/get-all',
    adminAuth,
    checkPermission('productvariant_view'),
    getAllProductVariants
);

// GET VARIANTS - PUBLIC
router.get('/public', getAllProductVariants);

// UPDATE VARIANT
router.put(
    '/update/:id',
    adminAuth,
    checkPermission('productvariant_edit'),
    upload.array('images', 5),
    updateProductVariant
);

// DELETE VARIANT
router.delete(
    '/delete/:id',
    adminAuth,
    checkPermission('productvariant_delete'),
    deleteProductVariant
);

module.exports = router;
