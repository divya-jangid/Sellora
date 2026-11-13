    const express = require('express')
    const router = express.Router()

    const { createProduct ,getAllProducts, getFeaturedProducts, 
        updateProduct, deleteProduct , updateProductStatus } = 
        require('../controllers/productcontroller')

    const upload = require('../middleware/upload')
    const adminAuth = require('../middleware/adminAuth')
    const checkPermission = require('../middleware/checkPermission')

    router.post('/create',adminAuth, checkPermission('products_create'),  upload.single('image') , createProduct)
    router.get('/get-all', adminAuth, checkPermission('products_view'), getAllProducts)

    // PUBLIC PRODUCTS FOR CUSTOMER LANDING PAGE
    router.get('/public', getAllProducts)
    router.get('/featured', getFeaturedProducts);

    router.put('/update/:id', adminAuth, checkPermission('products_edit'), updateProduct)
    router.delete('/delete/:id',  adminAuth, checkPermission('products_delete'), deleteProduct)

    router.put(
        '/update-status/:id',
        adminAuth,
        checkPermission('products_edit'),
        updateProductStatus
    )

    module.exports = router