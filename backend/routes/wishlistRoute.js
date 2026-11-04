const express = require('express');
const router = express.Router();

const {
    createWishlist,
    getWishlist
} = require('../controllers/wishlistcontroller');

const userAuth = require('../middleware/userAuth');

// ADD PRODUCT
router.post('/create', userAuth, createWishlist);

// GET WISHLIST
router.get('/get', userAuth, getWishlist);

// REMOVE PRODUCT

module.exports = router;
