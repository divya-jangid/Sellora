
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

      slug: {
       type: String,
       required: true,
       unique: true,
       lowercase: true,
       trim: true
  },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },

    subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory'
},

   brand:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Brand',
        required:true
    },

    description: {
        type: String,
        required: true
    },

    image: {
        type: String,
        default: ''
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

const Product = mongoose.model('Product', productSchema)

module.exports = Product
