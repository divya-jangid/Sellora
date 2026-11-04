const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true
        },  

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },  

        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true
        },

        address: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Address',
            required: true
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0
        },

        discount: {
            type: Number,
            default: 0,
            min: 0
        },

        deliveryFee: {
            type: Number,
            default: 0,
            min: 0
        },

        tax: {
            type: Number,
            default: 0,
            min: 0
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        coupon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Coupon',
            default: null
        },

        paymentMethod: {
            type: String,
            enum: ['COD', 'online'],
            default: 'COD'
        },

        paymentStatus: {
            type: String,
            enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
            default: 'PENDING'
        },

        orderStatus: {
            type: String,
            enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'placed'
        },

        deliveryPartner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        estimatedDeliveryTime: {
            type: Date,
            default: null
        },

        placedAt: {
            type: Date,
            default: Date.now
        },

        confirmedAt: {
            type: Date,
            default: null
        },

        processingAt: {
    type: Date,
    default: null
},

shippedAt: {
    type: Date,
    default: null
},

        deliveredAt: {
            type: Date,
            default: null
        },

        cancelledAt: {
            type: Date,
            default: null
        },

        cancellationReason: {
            type: String,
            default: ''
        }
    },
    { timestamps: true }
);

const Order = mongoose.model('order', orderSchema)

module.exports = Order