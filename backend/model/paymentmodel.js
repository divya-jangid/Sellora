
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'order',
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        paymentGateway: {
            type: String,
            default: ''
        },

        transactionId: {
            type: String,
            default: null
        },

        razorpayOrderId: {
            type: String,
            default: null
    },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        currency: {
            type: String,
            default: 'INR'
        },

        method: {
            type: String,
            enum: ['COD', 'online', 'card', 'upi', 'netbanking', 'wallet'],
            required: true
        },

        status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },

        gatewayResponse: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },

        paidAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false
        }
    }
);

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
