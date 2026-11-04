const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },

    firstName: {
        type: String,
        required: true,
        trim: true
    },

    lastName: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },


    profileImage: {
        type: String,
        default: ''
    },

    isEmailVerified: {
        type: Boolean,
        default: false
    },

    emailVerificationOTP: {
    type: String,
    default: null
},

emailVerificationOTPExpiry: {
    type: Date,
    default: null
},

passwordResetOTP: {
    type: String,
    default: null
},

passwordResetOTPExpiry: {
    type: Date,
    default: null
},
// TEMPLATE SECTION  

passwordSetupToken: {
    type: String,
    default: null
},

passwordSetupExpiry: {
    type: Date,
    default: null
},
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    

    status: {
        type: String,
        enum: ['active', 'inactive', 'blocked'],
        default: 'active'
    },

    lastLoginAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;