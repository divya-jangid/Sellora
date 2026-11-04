
const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'order',
            required: true
            
        },

        deliveryPartner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DeliveryPartner',
            required: true
        },

        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true
        },

        pickupTime: {
            type: Date,
            default: null
        },

        pickedUpAt: {
            type: Date,
            default: null
        },

        outForDeliveryAt: {
            type: Date,
            default: null
        },

        deliveredAt: {
            type: Date,
            default: null
        },

        deliveryStatus: {
            type: String,
            enum: [
               'ASSIGNED',
               'ACCEPTED',
               'PICKED_UP',
               'OUT_FOR_DELIVERY',
               'DELIVERED',
               'FAILED',
               'CANCELLED'
            ],
            default: 'ASSIGNED'
        },

        deliveryOtp: {
            type: String,
            default: null
        },

     otpAttempts: {
    type: Number,
    default: 0
},

otpBlockedUntil: {
    type: Date,
    default: null
},

        deliveryAddress: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Address',
            required: true
        },

        customerLocation: {
            latitude: {
                type: Number,
                default: null
            },
            longitude: {
                type: Number,
                default: null
            }
        },

        notes: {
            type: String,
            default: '',
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Delivery = mongoose.model('Delivery', deliverySchema);

module.exports = Delivery;
