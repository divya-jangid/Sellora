
const express = require('express')
const router = express.Router()

const {
    createRole,
    getRole,
    updateRole,
    deleteRole
} = require('../controllers/rolecontroller')

const adminAuth = require('../middleware/adminAuth')
const checkPermission = require('../middleware/checkPermission')

// Only Super Admin can manage roles and permissions

router.post(
    '/create',
    adminAuth,
    checkPermission('roles_create'),
    createRole
)

router.get(
    '/get-role',
    adminAuth,
    checkPermission('roles_view'),
    getRole
)

router.put(
    '/update/:id',
    adminAuth,
    checkPermission('roles_edit'),
    updateRole
)

router.delete(
    '/delete/:id',
    adminAuth,
    checkPermission('roles_delete'),
    deleteRole
)

module.exports = router
