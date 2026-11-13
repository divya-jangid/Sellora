
const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: ''
    },

    image: {
        type: String,
        required: true
    },

    link: {
        type: String,
        default: ''
    },

    position: {
        type: String,
        enum: ['home', 'category', 'offer'],
        default: 'home'
    },

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }

}, { timestamps: true });

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
