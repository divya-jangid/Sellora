
const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema(
    {
        wishlist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Wishlist',
            required: true
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },

        variant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductVariant',
            default: null
        }
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false
        }
    }
);

const WishlistItem = mongoose.model('WishlistItem', wishlistItemSchema);

module.exports = WishlistItem;
