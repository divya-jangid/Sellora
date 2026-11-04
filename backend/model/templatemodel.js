
const mongoose = require('mongoose')

const templateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    subject: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }

}, {
    timestamps: true
})

const Template = mongoose.model('Template', templateSchema)

module.exports = Template
