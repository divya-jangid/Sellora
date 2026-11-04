
const express = require('express');
const router = express.Router();

const {
    createStore,
    getAllStores,
    updateStore,
    deleteStore
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
);

module.exports = router;
