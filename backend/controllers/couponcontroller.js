const Coupon = require('../model/couponModel')


// CREATE COUPON
const createCoupon = async (req, res) => {
    try {
        const {
            code,
            description,
            discountType,
            discountValue,
            minimumOrderAmount,
            maximumDiscount,
            startDate,
            expiryDate,
            usageLimit,
            perUserLimit,
            applicableCategories,
            applicableProducts,
            status
        } = req.body;

        if (
            !code ||
            !discountType ||
            discountValue === undefined ||
            !startDate ||
            !expiryDate
        ) {
            return res.status(400).json({
                message: 'Please provide all required fields',
                status: false
            });
        }

        if (!['percentage', 'fixed'].includes(discountType)) {
            return res.status(400).json({
                message: 'Invalid discount type',
                status: false
            });
        }

        if (
            Number(discountValue) <= 0 ||
            (discountType === 'percentage' && Number(discountValue) > 100)
        ) {
            return res.status(400).json({
                message: 'Invalid discount value',
                status: false
            });
        }

        if (new Date(expiryDate) <= new Date(startDate)) {
            return res.status(400).json({
                message: 'Expiry date must be after start date',
                status: false
            });
        }

        const existingCoupon = await Coupon.findOne({
            code: code.trim().toUpperCase()
        });

        if (existingCoupon) {
            return res.status(409).json({
                message: 'Coupon already exists',
                status: false
            });
        }

        const coupon = await Coupon.create({
            code,
            description,
            discountType,
            discountValue,
            minimumOrderAmount,
            maximumDiscount,
            startDate,
            expiryDate,
            usageLimit,
            perUserLimit,
            applicableCategories,
            applicableProducts,
            status
        });

        return res.status(201).json({
            message: 'Coupon created successfully',
            status: true,
            coupon
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
}

const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find()
            .populate('applicableCategories')
            .populate('applicableProducts')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'Coupons fetched successfully',
            status: true,
            coupons
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
}

const getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id)
            .populate('applicableCategories')
            .populate('applicableProducts');

        if (!coupon) {
            return res.status(404).json({
                message: 'Coupon not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'Coupon fetched successfully',
            status: true,
            coupon
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
}


const updateCoupon = async (req, res) => {
    try {
        const {
            code,
            description,
            discountType,
            discountValue,
            minimumOrderAmount,
            maximumDiscount,
            startDate,
            expiryDate,
            usageLimit,
            perUserLimit,
            applicableCategories,
            applicableProducts,
            status
        } = req.body;

        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            {
                code,
                description,
                discountType,
                discountValue,
                minimumOrderAmount,
                maximumDiscount,
                startDate,
                expiryDate,
                usageLimit,
                perUserLimit,
                applicableCategories,
                applicableProducts,
                status
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!coupon) {
            return res.status(404).json({
                message: 'Coupon not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'Coupon updated successfully',
            status: true,
            coupon
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);

        if (!coupon) {
            return res.status(404).json({
                message: 'Coupon not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'Coupon deleted successfully',
            status: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};

module.exports = { createCoupon, getAllCoupons, getCouponById, updateCoupon, deleteCoupon }
