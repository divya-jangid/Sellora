
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        type: {
            type: String,
            enum: ['home', 'work', 'other'],
            default: 'home'
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        houseNumber: {
            type: String,
            required: true,
            trim: true
        },

        street: {
            type: String,
            required: true,
            trim: true
        },

        landmark: {
            type: String,
            default: '',
            trim: true
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        state: {
            type: String,
            required: true,
            trim: true
        },

        country: {
            type: String,
            required: true,
            trim: true,
            default: 'India'
        },

        pincode: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            latitude: {
                type: Number,
                default: null
            },
            longitude: {
                type: Number,
                default: null
            }
        },

        isDefault: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const Address = mongoose.model('Address',addressSchema)

module.exports = Address
