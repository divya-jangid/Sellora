
const mongoose = require('mongoose')

const storeInventorySchema = new mongoose.Schema({

    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },

    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        default: null
    },

    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },

    reservedQuantity: {
        type: Number,
        default: 0,
        min: 0
    },

    availableQuantity: {
        type: Number,
        default: 0,
        min: 0
    },

    reorderLevel: {
        type: Number,
        default: 10,
        min: 0
    },

    maxStockLevel: {
        type: Number,
        default: 100,
        min: 0
    },

    lastRestockedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
})

const Inventory = mongoose.model('StoreInventory', storeInventorySchema)

module.exports = Inventory
