const express = require('express')
const router = express.Router()

const {
    createInventory,
    getAllInventory,
    getLowStockInventory ,
    updateInventory,
    deleteInventory
} = require('../controllers/inventorycontroller')

const adminAuth = require('../middleware/adminAuth')
const checkPermission = require('../middleware/checkPermission')

// CREATE INVENTORY
router.post(
    '/create',
    adminAuth,
    checkPermission('storeinventory_create'),
    createInventory
)

// GET ALL INVENTORY
router.get(
    '/get-all',
    adminAuth,
    checkPermission('storeinventory_view'),
    getAllInventory
)

// PUBLIC INVENTORY
router.get('/public', getAllInventory)

router.get('/low-stock', adminAuth, checkPermission('storeinventory_view'), getLowStockInventory)

// UPDATE INVENTORY
router.put(
    '/update/:id',
    adminAuth,
    checkPermission('storeinventory_edit'),
    updateInventory
)

// DELETE INVENTORY
router.delete(
    '/delete/:id',
    adminAuth,
    checkPermission('storeinventory_delete'),
    deleteInventory
)


module.exports = router