const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    sku: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    barcode: {
        type: String,
        default: '',
        trim: true
    },

    unitValue: {
        type: Number,
        required: true,
        min: 0
    },

    unit: {
        type: String,
        required: true,
        trim: true
    },

    mrp: {
        type: Number,
        required: true,
        min: 0
    },

    sellingPrice: {
    type: Number,
    required: true,
    min: 0,
    validate: {
        validator: function (value) {
            return value <= this.mrp;
        },
        message: 'Selling Price cannot be greater than MRP'
    }
},

    discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    weight: {
        type: Number,
        default: 0,
        min: 0
    },

    dimensions: {
        length: { type: Number, default: 0, min: 0 },
        width: { type: Number, default: 0, min: 0 },
        height: { type: Number, default: 0, min: 0 }
    },

    images: {
        type: [String],
        default: []
    },

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
       
    isFeatured: {
    type: Boolean,
    default: false
},

}, { timestamps: true });

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema )

module.exports = ProductVariant