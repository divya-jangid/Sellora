
const express = require('express');
const router = express.Router();

const {
    createBanner,
    getAllBanners,
    getActiveBanners,
    updateBanner,
    deleteBanner,
    updateBannerStatus 
} = require('../controllers/bannercontroller');

const upload = require('../middleware/upload');
const adminAuth = require('../middleware/adminAuth');
const checkPermission = require('../middleware/checkPermission');

// ADMIN ROUTES
router.post(
    '/create',
    adminAuth,
    checkPermission('banners_create'),
    upload.single('image'),
    createBanner
);

router.get(
    '/get-all',
    adminAuth,
    checkPermission('banners_view'),
    getAllBanners
);

router.put(
    '/update/:id',
    adminAuth,
    checkPermission('banners_edit'),
    upload.single('image'),
    updateBanner
);

router.delete(
    '/delete/:id',
    adminAuth,
    checkPermission('banners_delete'),
    deleteBanner
);

// PUBLIC ROUTE FOR CUSTOMER FRONTEND
router.get('/public', getActiveBanners)

router.put(
    '/update-status/:id',
    adminAuth,
    checkPermission('banners_edit'),
    updateBannerStatus
);

module.exports = router;
