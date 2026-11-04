const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },

    subtotal: {
      type: Number,
      default: 0
    },

    discount: {
      type: Number,
      default: 0
    },

    deliveryFee: {
      type: Number,
      default: 0
    },

    tax: {
      type: Number,
      default: 0
    },

    totalAmount: {
      type: Number,
      default: 0
    },

    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null
    }
  },
  { timestamps: true }
)

const Cart = mongoose.model('Cart', cartSchema)

module.exports = Cart