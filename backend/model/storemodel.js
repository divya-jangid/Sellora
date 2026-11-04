const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },

    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    phone: {
        type: String,
        required: true,
        trim: true
    },

    address: {
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

    serviceRadius: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }

}, { timestamps: true });

const Store = mongoose.model('Store', storeSchema)

module.exports = Store 