const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },

        description: {
            type: String,
            default: '',
            trim: true
        },

        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
            required: true
        },

        discountValue: {
            type: Number,
            required: true,
            min: 0
        },

        minimumOrderAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        maximumDiscount: {
            type: Number,
            default: null,
            min: 0
        },

        startDate: {
            type: Date,
            required: true
        },

        expiryDate: {
            type: Date,
            required: true
        },

        usageLimit: {
            type: Number,
            default: null,
            min: 1
        },

        usedCount: {
            type: Number,
            default: 0,
            min: 0
        },

        perUserLimit: {
            type: Number,
            default: 1,
            min: 1
        },

        applicableCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category'
            }
        ],

        applicableProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            }
        ],

        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        }
    },
    {
        timestamps: true
    }
)

const Coupon = mongoose.model('Coupon', couponSchema)

module.exports = Coupon 