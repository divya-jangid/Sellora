const express = require('express')
const router = express.Router()

const { addAddress, getAddresses, updateAddress, deleteAddress, setDefaultAddress } = require('../controllers/addresscontroller')
const userAuth = require('../middleware/userAuth')

router.post('/add', userAuth, addAddress)
router.get('/get', userAuth, getAddresses)
router.put('/update/:id', userAuth, updateAddress)
router.delete('/delete/:id', userAuth, deleteAddress)
router.put('/set-default/:addressId', userAuth, setDefaultAddress)

module.exports = router