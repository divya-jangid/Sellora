
const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },

        vehicleType: {
            type: String,
            required: true,
            trim: true
        },

        vehicleNumber: {
            type: String,
            required: true,
            trim: true
        },

        drivingLicenseNumber: {
            type: String,
            required: true,
            trim: true
        },

        currentLocation: {
            latitude: {
                type: Number,
                default: null
            },
            longitude: {
                type: Number,
                default: null
            }
        },

        isOnline: {
            type: Boolean,
            default: false
        },

        isAvailable: {
            type: Boolean,
            default: false
        },

        status: {
            type: String,
            enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED'],
            default: 'PENDING'
        },

        totalDeliveries: {
            type: Number,
            default: 0,
            min: 0
        },

        totalEarnings: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

const DeliveryPartner = mongoose.model(
    'DeliveryPartner',
    deliveryPartnerSchema
);

module.exports = DeliveryPartner;
