
const express = require('express');
const router = express.Router();

const {
    createStore,
    getAllStores,
    updateStore,
    deleteStore,
    updateStoreStatus,
    getNearestStore
} = require('../controllers/storecontroller');

const adminAuth = require('../middleware/adminAuth');
const checkPermission = require('../middleware/checkPermission');

router.post(
    '/create',
    adminAuth,
    checkPermission('store_create'),
    createStore
);

router.get(
    '/get-all',
    adminAuth,
    checkPermission('store_view'),
    getAllStores
);

router.put(
    '/update/:id',
    adminAuth,
    checkPermission('store_edit'),
    updateStore
);

router.delete(
    '/delete/:id',
    adminAuth,
    checkPermission('store_delete'),
    deleteStore
)

router.put(
    '/update-status/:id',
    adminAuth,
    checkPermission('store_edit'),
    updateStoreStatus
)

// CUSTOMER - FIND NEAREST STORE
router.post('/find-nearest', getNearestStore);

module.exports = router;
