
const Wishlist = require('../model/wishlistmodel');
const WishlistItem = require('../model/wishlistitemmodel');
const Product = require('../model/productmodel');

// ADD PRODUCT TO WISHLIST
const addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, variant } = req.body;

        if (!productId) {
            return res.status(400).json({
                message: 'Product ID is required',
                status: false
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: 'Product not found',
                status: false
            });
        }

        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            wishlist = await Wishlist.create({ user: userId });
        }

        const existingItem = await WishlistItem.findOne({
            wishlist: wishlist._id,
            product: productId,
            variant: variant || null
        });

        if (existingItem) {
            return res.status(400).json({
                message: 'Product already in wishlist',
                status: false
            });
        }

        const wishlistItem = await WishlistItem.create({
            wishlist: wishlist._id,
            product: productId,
            variant: variant || null
        });

        return res.status(201).json({
            message: 'Product added to wishlist',
            status: true,
            data: wishlistItem
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};

// GET WISHLIST ITEMS
const getWishlistItems = async (req, res) => {
    try {
        const userId = req.user.id;

        const wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            return res.status(200).json({
                message: 'Wishlist is empty',
                status: true,
                data: []
            });
        }

        const items = await WishlistItem.find({
            wishlist: wishlist._id
        })
            .populate('product')
            .populate('variant');

        return res.status(200).json({
            message: 'Wishlist items fetched successfully',
            status: true,
            data: items
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};

// REMOVE PRODUCT FROM WISHLIST
const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { wishlistItemId } = req.params;

        const wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            return res.status(404).json({
                message: 'Wishlist not found',
                status: false
            });
        }

        const item = await WishlistItem.findOneAndDelete({
            _id: wishlistItemId,
            wishlist: wishlist._id
        });

        if (!item) {
            return res.status(404).json({
                message: 'Wishlist item not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'Product removed from wishlist',
            status: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};

module.exports = {
    addToWishlist,
    getWishlistItems,
    removeFromWishlist
};
