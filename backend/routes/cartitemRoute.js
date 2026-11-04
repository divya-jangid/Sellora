const express = require('express');
const router = express.Router();

const { updateCartItem, removeCartItem } = require('../controllers/cartitemcontroller');

const userAuth = require('../middleware/userAuth')

router.put('/update/:id', userAuth, updateCartItem);
router.delete('/delete/:cartItemId', userAuth, removeCartItem);


module.exports = router;