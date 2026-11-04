
'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import axios from 'axios'

const CartContext = createContext()

const API = 'http://localhost:8000/cart'
const CART_ITEM_API = 'http://localhost:8000/cartitem'
const WISHLIST_API = 'http://localhost:8000/wishlist-item'

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([])
    const [cart, setCart] = useState({ items: [], subtotal: 0, totalAmount: 0 })
    const [loadingCart, setLoadingCart] = useState(true)

    const [wishlistItems, setWishlistItems] = useState([])
    const [loadingWishlist, setLoadingWishlist] = useState(false)

    const wishlistCount = wishlistItems.length

    // GET CART
    const getCart = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/get`, {
                withCredentials: true
            })

            const data = res.data?.data || {}
            const items = data.items || data.cart?.items || []

            setCart({
                ...data,
                items
            })

            setCartItems(
                res.data?.status && Array.isArray(items) ? items : []
            )

            return res.data
        } catch (error) {
            console.log('GET CART ERROR:', error.response?.data || error.message)

            setCartItems([])
            setCart({
                items: [],
                subtotal: 0,
                totalAmount: 0
            })

            throw error
        } finally {
            setLoadingCart(false)
        }
    }, [])

    // ADD TO CART
    // ADD TO CART
    const addToCart = async (productId, quantity = 1, variantId = null) => {
        try {
            const res = await axios.post(
                `${API}/add`,
                {
                    productId,
                    quantity,
                    variantId
                },
                {
                    withCredentials: true
                }
            )

            await getCart()
            return res.data

        } catch (error) {
            console.log(
                'ADD CART ERROR:',
                error.response?.data || error.message
            )

            throw error
        }
    }
    // UPDATE CART QUANTITY
    const updateCartItem = async (itemId, quantity) => {
        try {
            if (quantity <= 0) {
                return await removeCartItem(itemId)
            }

            const res = await axios.put(
                `${CART_ITEM_API}/update/${itemId}`,
                { quantity },
                { withCredentials: true }
            )

            await getCart()
            return res.data
        } catch (error) {
            console.log('UPDATE CART ERROR:', error.response?.data || error.message)
            throw error
        }
    }

    // REMOVE CART ITEM
    const removeCartItem = async (itemId) => {
        try {
            const res = await axios.delete(
                `${CART_ITEM_API}/delete/${itemId}`,
                { withCredentials: true }
            )

            await getCart()
            return res.data
        } catch (error) {
            console.log('REMOVE CART ERROR:', error.response?.data || error.message)
            throw error
        }
    }

    // GET WISHLIST
    const getWishlist = async () => {
        try {
            setLoadingWishlist(true)

            const res = await axios.get(
                `${WISHLIST_API}/get`,
                { withCredentials: true }
            )

            setWishlistItems(
                Array.isArray(res.data?.data) ? res.data.data : []
            )

            return res.data
        } catch (error) {
            console.log(
                'GET WISHLIST ERROR:',
                error.response?.data || error.message
            )
            setWishlistItems([])
            throw error
        } finally {
            setLoadingWishlist(false)
        }
    }

    // ADD TO WISHLIST
    const addToWishlist = async (productId) => {
        try {
            const res = await axios.post(
                `${WISHLIST_API}/add`,
                { productId },
                { withCredentials: true }
            )

            await getWishlist()
            return res.data
        } catch (error) {
            console.log(
                'ADD WISHLIST ERROR:',
                error.response?.data || error.message
            )
            throw error
        }
    }

    // REMOVE FROM WISHLIST
    const removeFromWishlist = async (wishlistItemId) => {
        try {
            const res = await axios.delete(
                `${WISHLIST_API}/delete/${wishlistItemId}`,
                { withCredentials: true }
            )

            await getWishlist()
            return res.data
        } catch (error) {
            console.log(
                'REMOVE WISHLIST ERROR:',
                error.response?.data || error.message
            )
            throw error
        }
    }

    // FETCH CART WHEN APP LOADS
    useEffect(() => {
        getCart().catch(() => { })
    }, [getCart])

    // FETCH WISHLIST WHEN APP LOADS
    useEffect(() => {
        getWishlist().catch(() => { })
    }, [])

    // TOTAL CART QUANTITY
    const cartCount = cartItems.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    )

    return (
        <CartContext.Provider
            value={{
                // Cart
                cart,
                cartItems,
                cartCount,
                loadingCart,
                getCart,
                addToCart,
                updateCartItem,
                removeCartItem,

                // Wishlist
                wishlistItems,
                wishlistCount,
                loadingWishlist,
                getWishlist,
                addToWishlist,
                removeFromWishlist
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => useContext(CartContext)
