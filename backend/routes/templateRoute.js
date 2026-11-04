
const express = require('express');
const router = express.Router();

const {
    createTemplate,
    getTemplate,
    updateTemplate,
    deleteTemplate,
    sendTemplateEmail

} = require('../controllers/templatecontroller');

const adminAuth = require('../middleware/adminAuth');
const checkPermission = require('../middleware/checkPermission');

router.post(
    '/create',
    adminAuth,
    checkPermission('template_create'),
    createTemplate
);

router.get(
    '/get-all',
    adminAuth,
    checkPermission('template_view'),
    getTemplate
);

router.put(
    '/update/:id',
    adminAuth,
    checkPermission('template_edit'),
    updateTemplate
);

router.delete(
    '/delete/:id',
    adminAuth,
    checkPermission('template_delete'),
    deleteTemplate
);

// SEND TEMPLATE EMAIL
router.post(
    '/send-email',
    adminAuth,
    checkPermission('template_send'),
    sendTemplateEmail
);

module.exports = router;
