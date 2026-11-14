
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

    // GEOJSON LOCATION
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
            required: true
        },

        coordinates: {
            type: [Number],
            required: true
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


// 2dsphere index for geospatial queries
storeSchema.index({ location: '2dsphere' });

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;
