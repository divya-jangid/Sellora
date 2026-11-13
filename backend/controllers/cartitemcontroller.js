
const CartItem = require('../model/cartitemModel')
const Cart = require('../model/cartmodel')
const Inventory = require('../model/inventorymodel')

// UPDATE CART ITEM QUANTITY
const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id
        const { quantity } = req.body
        const id = req.params.id || req.params.cartItemId

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: 'Quantity must be a positive integer',
                status: false
            })
        }

        const cartItem = await CartItem.findById(id)

        if (!cartItem) {
            return res.status(404).json({
                message: 'Cart item not found',
                status: false
            })
        }

        // CHECK CART OWNERSHIP
        const cart = await Cart.findOne({
            _id: cartItem.cart,
            user: userId
        })

        if (!cart) {
            return res.status(404).json({
                message: 'Cart not found',
                status: false
            })
        }

        // CHECK SELECTED STORE INVENTORY
        const inventory = await Inventory.findOne({
            store: cart.store,
            product: cartItem.product,
            variant: cartItem.variant || null,
            status: 'active'
        })

        if (!inventory || inventory.availableQuantity <= 0) {
            return res.status(400).json({
                message: 'Product is out of stock',
                status: false
            })
        }

        // CHECK AVAILABLE QUANTITY
        if (quantity > inventory.availableQuantity) {
            return res.status(400).json({
                message: `Only ${inventory.availableQuantity} items available`,
                status: false
            })
        }

        cartItem.quantity = quantity
        cartItem.totalPrice = cartItem.price * quantity

        await cartItem.save()

        // FETCH CART ITEMS
        const items = await CartItem.find({
            cart: cart._id
        })

        // RECALCULATE CART TOTAL
        cart.subtotal = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        )

        // REMOVE OLD COUPON AFTER CART CHANGE
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
            message: 'Cart item updated successfully',
            status: true,
            data: {
                cartItem,
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


// REMOVE CART ITEM
const removeCartItem = async (req, res) => {
    try {
        const userId = req.user.id
        const cartItemId =
            req.params.cartItemId || req.params.id

        const cartItem = await CartItem.findById(cartItemId)

        if (!cartItem) {
            return res.status(404).json({
                message: 'Cart item not found',
                status: false
            })
        }

        // CHECK CART OWNERSHIP
        const cart = await Cart.findOne({
            _id: cartItem.cart,
            user: userId
        })

        if (!cart) {
            return res.status(404).json({
                message: 'Cart not found',
                status: false
            })
        }

        await CartItem.findByIdAndDelete(cartItemId)

        // FETCH REMAINING ITEMS
        const cartItems = await CartItem.find({
            cart: cart._id
        })

        // RECALCULATE CART TOTAL
        cart.subtotal = cartItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        )

        // REMOVE OLD COUPON
        cart.discount = 0
        cart.coupon = null

        cart.deliveryFee =
            cartItems.length === 0 || cart.subtotal >= 999
                ? 0
                : 30

        cart.totalAmount = Number(
            (
                cart.subtotal +
                cart.deliveryFee +
                (cart.tax || 0)
            ).toFixed(2)
        )

        await cart.save()

        return res.status(200).json({
            message: 'Item removed successfully',
            status: true,
            data: {
                cartItems,
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
    updateCartItem,
    removeCartItem
}
