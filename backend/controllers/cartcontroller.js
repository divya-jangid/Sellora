
const Cart = require('../model/cartmodel')
const CartItem = require('../model/cartitemModel')
const Product = require('../model/productmodel')
const Store = require('../model/storemodel')
const Coupon = require('../model/couponModel')
const ProductVariant = require('../model/productvariant')

// ADD TO CART
const addToCart = async (req, res) => {
    try {
        const {
            productId,
            quantity = 1,
            variantId = null
        } = req.body

        const userId = req.user.id

        if (!productId) {
            return res.status(400).json({
                message: 'Product ID is required',
                status: false
            })
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: 'Quantity must be a positive integer',
                status: false
            })
        }

        const store = await Store.findOne({
            status: 'active'
        })

        if (!store) {
            return res.status(404).json({
                message: 'No active store found',
                status: false
            })
        }

        const product = await Product.findOne({
            _id: productId,
            status: 'active'
        })

        if (!product) {
            return res.status(404).json({
                message: 'Product not found',
                status: false
            })
        }

        let price = Number(product.price)

        // CHECK SELECTED VARIANT
        if (variantId) {
            const variant = await ProductVariant.findOne({
                _id: variantId,
                product: productId,
                status: 'active'
            })

            if (!variant) {
                return res.status(404).json({
                    message: 'Product variant not found',
                    status: false
                })
            }

            price = Number(variant.sellingPrice)
        }

        if (!Number.isFinite(price) || price < 0) {
            return res.status(400).json({
                message: 'Invalid product price',
                status: false
            })
        }

        let cart = await Cart.findOne({
            user: userId,
            store: store._id
        })

        if (!cart) {
            cart = await Cart.create({
                user: userId,
                store: store._id
            })
        }

        // SAME PRODUCT + SAME VARIANT = SAME CART ITEM
        // DIFFERENT VARIANT = DIFFERENT CART ITEM
        let cartItem = await CartItem.findOne({
            cart: cart._id,
            product: productId,
            variant: variantId || null
        })

        if (cartItem) {
            cartItem.quantity += quantity
            cartItem.totalPrice = cartItem.price * cartItem.quantity

            await cartItem.save()
        } else {
            cartItem = await CartItem.create({
                cart: cart._id,
                product: productId,
                variant: variantId || null,
                quantity,
                price,
                totalPrice: price * quantity
            })
        }

        const items = await CartItem.find({
            cart: cart._id
        })

        cart.subtotal = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        )

        // CART CHANGE = REMOVE OLD COUPON
        cart.discount = 0
        cart.coupon = null

        cart.deliveryFee =
            cart.subtotal >= 999 ? 0 : 30

        cart.totalAmount = Number(
            (
                cart.subtotal +
                cart.deliveryFee +
                (cart.tax || 0)
            ).toFixed(2)
        )

        await cart.save()

        return res.status(200).json({
            message: 'Product added to cart successfully',
            status: true,
            data: {
                cart,
                cartItem
            }
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}


// GET CART
const getCart = async (req, res) => {
    try {
        const userId = req.user.id

        const cart = await Cart.findOne({
            user: userId
        }).populate('store')

        if (!cart) {
            return res.status(200).json({
                message: 'Your cart is empty',
                status: true,
                data: {
                    items: [],
                    subtotal: 0,
                    discount: 0,
                    deliveryFee: 0,
                    tax: 0,
                    totalAmount: 0
                }
            })
        }

        const items = await CartItem.find({
            cart: cart._id
        })
            .populate('product')
            .populate('variant')

        return res.status(200).json({
            message: 'Cart fetched successfully',
            status: true,
            data: {
                cartId: cart._id,
                store: cart.store,
                items,
                subtotal: cart.subtotal,
                discount: cart.discount,
                deliveryFee: cart.deliveryFee,
                tax: cart.tax,
                totalAmount: cart.totalAmount
            }
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}


// APPLY COUPON
const applyCoupon = async (req, res) => {
    try {
        const userId = req.user.id
        const { code } = req.body

        if (!code || !code.trim()) {
            return res.status(400).json({
                message: 'Please enter coupon code',
                status: false
            })
        }

        const cart = await Cart.findOne({
            user: userId
        })

        if (!cart) {
            return res.status(404).json({
                message: 'Cart not found',
                status: false
            })
        }

        const cartItems = await CartItem.find({
            cart: cart._id
        }).populate('product')

        if (cartItems.length === 0) {
            return res.status(400).json({
                message: 'Your cart is empty',
                status: false
            })
        }

        cart.subtotal = cartItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        )

        cart.deliveryFee =
            cart.subtotal >= 999 ? 0 : 30

        const coupon = await Coupon.findOne({
            code: code.trim().toUpperCase(),
            status: 'active'
        })

        if (!coupon) {
            return res.status(404).json({
                message: 'Invalid coupon code',
                status: false
            })
        }

        const now = new Date()

        if (
            !coupon.startDate ||
            !coupon.expiryDate ||
            now < new Date(coupon.startDate) ||
            now > new Date(coupon.expiryDate)
        ) {
            return res.status(400).json({
                message: 'Coupon is not valid at this time',
                status: false
            })
        }

        if (
            coupon.usageLimit != null &&
            coupon.usedCount >= coupon.usageLimit
        ) {
            return res.status(400).json({
                message: 'Coupon usage limit reached',
                status: false
            })
        }

        if (
            cart.subtotal <
            (coupon.minimumOrderAmount || 0)
        ) {
            return res.status(400).json({
                message: `Minimum order amount is ₹${coupon.minimumOrderAmount}`,
                status: false
            })
        }

        let applicableItems = cartItems

        const hasProductRestriction =
            (coupon.applicableProducts || []).length > 0

        const hasCategoryRestriction =
            (coupon.applicableCategories || []).length > 0

        if (hasProductRestriction || hasCategoryRestriction) {
            applicableItems = cartItems.filter((item) => {
                const product = item.product

                if (!product) return false

                const productMatches =
                    hasProductRestriction &&
                    coupon.applicableProducts.some(
                        (id) => String(id) === String(product._id)
                    )

                const categoryId =
                    product.category?._id || product.category

                const categoryMatches =
                    hasCategoryRestriction &&
                    coupon.applicableCategories.some(
                        (id) => String(id) === String(categoryId)
                    )

                return productMatches || categoryMatches
            })
        }

        if (applicableItems.length === 0) {
            return res.status(400).json({
                message: 'Coupon is not applicable to cart products',
                status: false
            })
        }

        const applicableSubtotal = applicableItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        )

        let discount = 0

        if (coupon.discountType === 'percentage') {
            discount =
                (applicableSubtotal * coupon.discountValue) / 100

            if (coupon.maximumDiscount != null) {
                discount = Math.min(
                    discount,
                    coupon.maximumDiscount
                )
            }
        } else if (coupon.discountType === 'fixed') {
            discount = coupon.discountValue
        } else {
            return res.status(400).json({
                message: 'Invalid coupon discount type',
                status: false
            })
        }

        discount = Math.min(discount, applicableSubtotal)
        discount = Math.round(discount * 100) / 100

        cart.discount = discount
        cart.coupon = coupon._id

        cart.totalAmount = Number(
            (
                cart.subtotal -
                cart.discount +
                cart.deliveryFee +
                (cart.tax || 0)
            ).toFixed(2)
        )

        await cart.save()

        return res.status(200).json({
            message: 'Coupon applied successfully',
            status: true,
            data: {
                coupon,
                subtotal: cart.subtotal,
                discount: cart.discount,
                deliveryFee: cart.deliveryFee,
                tax: cart.tax || 0,
                totalAmount: cart.totalAmount
            }
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}


// REMOVE COUPON
const removeCoupon = async (req, res) => {
    try {
        const userId = req.user.id

        const cart = await Cart.findOne({
            user: userId
        })

        if (!cart) {
            return res.status(404).json({
                message: 'Cart not found',
                status: false
            })
        }

        const items = await CartItem.find({
            cart: cart._id
        })

        cart.subtotal = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        )

        cart.discount = 0
        cart.coupon = null

        cart.deliveryFee =
            items.length === 0 || cart.subtotal >= 999 ? 0 : 30

        cart.totalAmount = Number(
            (
                cart.subtotal +
                cart.deliveryFee +
                (cart.tax || 0)
            ).toFixed(2)
        )

        await cart.save()

        return res.status(200).json({
            message: 'Coupon removed successfully',
            status: true,
            data: {
                subtotal: cart.subtotal,
                discount: cart.discount,
                deliveryFee: cart.deliveryFee,
                tax: cart.tax || 0,
                totalAmount: cart.totalAmount
            }
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}


module.exports = {
    addToCart,
    getCart,
    applyCoupon,
    removeCoupon
}
