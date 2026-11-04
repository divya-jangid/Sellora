
const Wishlist = require('../model/wishlistmodel');

// CREATE OR GET WISHLIST
const createWishlist = async (req, res) => {
    try {
        const userId = req.user.id;

        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: userId
            });
        }

        return res.status(200).json({
            message: 'Wishlist fetched successfully',
            status: true,
            data: wishlist
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};

// GET WISHLIST
const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;

        const wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            return res.status(404).json({
                message: 'Wishlist not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'Wishlist fetched successfully',
            status: true,
            data: wishlist
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};

module.exports = {
    createWishlist,
    getWishlist
};
