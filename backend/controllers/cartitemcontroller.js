
const CartItem = require('../model/cartitemModel')
const Cart = require('../model/cartmodel')
const Inventory = require('../model/inventorymodel')

// UPDATE CART ITEM QUANTITY

const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id
        const quantity = Number(req.body.quantity)
        const id = req.params.id || req.params.cartItemId

        // VALIDATE QUANTITY
        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: 'Quantity must be a positive integer',
                status: false
            })
        }

        if (!id) {
            return res.status(400).json({
                message: 'Cart item ID is required',
                status: false
            })
        }

        // FIND CART ITEM
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
            variant: cartItem.variant || null
        })

        if (!inventory) {
            return res.status(404).json({
                message: 'Product is not available in this store',
                status: false
            })
        }

        const availableStock = Number(
            inventory.availableQuantity || 0
        )

        // CHECK STOCK
        if (availableStock <= 0) {
            return res.status(400).json({
                message: 'Product is out of stock',
                status: false
            })
        }

        // CHECK REQUESTED QUANTITY
        if (quantity > availableStock) {
            return res.status(400).json({
                message: `Only ${availableStock} items available`,
                status: false
            })
        }

        // UPDATE CART ITEM
        cartItem.quantity = quantity
        cartItem.totalPrice = Number(
            (Number(cartItem.price) * quantity).toFixed(2)
        )

        await cartItem.save()

        // FETCH CART ITEMS
        const items = await CartItem.find({
            cart: cart._id
        })

        // RECALCULATE CART SUBTOTAL
        cart.subtotal = items.reduce(
            (sum, item) =>
                sum + (Number(item.price) * Number(item.quantity)),
            0
        )

        // REMOVE OLD COUPON AFTER CART CHANGE
        cart.discount = 0
        cart.coupon = null

        // DELIVERY FEE
        cart.deliveryFee =
            items.length === 0 || cart.subtotal >= 999 ? 0 : 30

        // CALCULATE TOTAL
        cart.totalAmount = Number(
            (
                cart.subtotal +
                cart.deliveryFee +
                Number(cart.tax || 0)
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
        console.log('UPDATE CART ITEM ERROR:', error)

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

        if (!cartItemId) {
            return res.status(400).json({
                message: 'Cart item ID is required',
                status: false
            })
        }

        // FIND CART ITEM
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

        // REMOVE CART ITEM
        await CartItem.findByIdAndDelete(cartItemId)

        // FETCH REMAINING ITEMS
        const cartItems = await CartItem.find({
            cart: cart._id
        })

        // RECALCULATE SUBTOTAL
        cart.subtotal = cartItems.reduce(
            (sum, item) =>
                sum +
                (Number(item.price) * Number(item.quantity)),
            0
        )

        // REMOVE OLD COUPON
        cart.discount = 0
        cart.coupon = null

        // RECALCULATE DELIVERY FEE
        cart.deliveryFee =
            cartItems.length === 0 || cart.subtotal >= 999
                ? 0
                : 30

        // RECALCULATE TOTAL
        cart.totalAmount = Number(
            (
                cart.subtotal +
                cart.deliveryFee +
                Number(cart.tax || 0)
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
        console.log('REMOVE CART ITEM ERROR:', error)

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
