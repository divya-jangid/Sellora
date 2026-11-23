
'use client'

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback
} from 'react'

import api from '@/api/api'
import { useLocationContext } from '../context/LocationContext'

const CartContext = createContext()


export const CartProvider = ({ children }) => {

    const { selectedStore } = useLocationContext()

    const storeId = selectedStore?._id

    const [cartItems, setCartItems] = useState([])

    const [cart, setCart] = useState({
        items: [],
        subtotal: 0,
        totalAmount: 0
    })

    const [loadingCart, setLoadingCart] = useState(true)

    const [wishlistItems, setWishlistItems] = useState([])
    const [loadingWishlist, setLoadingWishlist] = useState(false)

    const wishlistCount = wishlistItems.length

    // GET CART
    const getCart = useCallback(async () => {

        if (!storeId) {
            setCartItems([])
            setCart({
                items: [],
                subtotal: 0,
                discount: 0,
                deliveryFee: 0,
                tax: 0,
                totalAmount: 0
            })

            setLoadingCart(false)
            return
        }

        try {

            setLoadingCart(true)

            const res = await api.get(`cart/get`, {
                params: {
                    storeId
                }
            })

            const data = res.data?.data || {}
            const items = data.items || []

            setCart({
                ...data,
                items
            })

            setCartItems(
                res.data?.status && Array.isArray(items)
                    ? items
                    : []
            )

            return res.data

        } catch (error) {
            console.log(
                'GET CART ERROR:',
                error.response?.data || error.message
            )

            setCartItems([])

            setCart({
                items: [],
                subtotal: 0,
                discount: 0,
                deliveryFee: 0,
                tax: 0,
                totalAmount: 0
            })

            throw error
        } finally {
            setLoadingCart(false)
        }

    }, [storeId])


    // ADD TO CART
    const addToCart = async (
        productId,
        quantity = 1,
        variantId = null
    ) => {

        try {

            if (!storeId) {
                throw new Error('Please select your location first')
            }

            const res = await api.post(
                `cart/add`,
                {
                    productId,
                    quantity,
                    variantId,
                    storeId
                }
            )

            await getCart()

            return res.data

        } catch (error) {

            console.log(
                'ADD CART ERROR:',
                error.response?.data || error.message
            )

            // USER NOT LOGGED IN
            if (error.response?.status === 401) {
                window.dispatchEvent(
                    new Event('open-login-modal')
                )
            }

            throw error
        }
    }


    // UPDATE CART QUANTITY
    const updateCartItem = async (itemId, quantity) => {

        try {

            if (quantity <= 0) {
                return await removeCartItem(itemId)
            }

            const res = await api.put(
                `cartitem/update/${itemId}`,
                { quantity }
            )

            await getCart()

            return res.data

        } catch (error) {

            console.log(
                'UPDATE CART ERROR:',
                error.response?.data || error.message
            )

            throw error
        }
    }


    // REMOVE CART ITEM
    const removeCartItem = async (itemId) => {

        try {

            const res = await api.delete(
                `cartitem/delete/${itemId}`,
                {
                    withCredentials: true
                }
            )

            await getCart()

            return res.data

        } catch (error) {

            console.log(
                'REMOVE CART ERROR:',
                error.response?.data || error.message
            )

            throw error
        }
    }


    // GET WISHLIST
    const getWishlist = async () => {

        try {

            setLoadingWishlist(true)

            const res = await api.get(
                `wishlist-item/get`
            )

            setWishlistItems(
                Array.isArray(res.data?.data)
                    ? res.data.data
                    : []
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

            const res = await api.post(
                `wishlist-item/add`,
                { productId }
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

            const res = await api.delete(
                `wishlist-item/delete/${wishlistItemId}`
               
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


    // FETCH CART WHEN STORE CHANGES
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
