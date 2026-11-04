
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'order',
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

        productName: {
            type: String,
            required: true,
            trim: true
        },

        variantName: {
            type: String,
            default: ''
        },

        sku: {
            type: String,
            default: ''
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        discount: {
            type: Number,
            default: 0,
            min: 0
        },

        tax: {
            type: Number,
            default: 0,
            min: 0
        },

        totalPrice: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

const OrderItem = mongoose.model('order_item', orderItemSchema);

module.exports = OrderItem;
