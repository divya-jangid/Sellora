const express = require('express');
const router = express.Router();

const {
    addToWishlist,
    getWishlistItems,
    removeFromWishlist
} = require('../controllers/wishlistitemcontroller');

const userAuth = require('../middleware/userAuth');

// ADD PRODUCT TO WISHLIST
router.post('/add', userAuth, addToWishlist);

// GET WISHLIST ITEMS
router.get('/get', userAuth, getWishlistItems);

// REMOVE PRODUCT FROM WISHLIST
router.delete('/delete/:wishlistItemId', userAuth, removeFromWishlist);

module.exports = router;