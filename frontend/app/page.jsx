'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Banner from '@/components/Banner'
import CategoryNavbar from '@/components/CategoryNavbar'
import { useCart } from '@/context/CartContext'
import { toast } from 'react-hot-toast'

const Page = () => {
    const router = useRouter()

    const [variants, setVariants] = useState([])
    const [wishlistAction, setWishlistAction] = useState(null)
    const [addingProduct, setAddingProduct] = useState(null)
    const [updatingItem, setUpdatingItem] = useState(null)

    const {
        cartItems,
        addToCart: addProductToCart,
        updateCartItem,
        removeCartItem,
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        loadingWishlist: wishlistLoading
    } = useCart()

    // GET FEATURED PRODUCT VARIANTS
    const getVariants = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/productvariant/public'
            )

            const variantData =
                res.data?.variants ||
                res.data?.data?.variants ||
                res.data?.data ||
                []

            setVariants(Array.isArray(variantData) ? variantData : [])

        } catch (err) {
            console.log(
                'GET VARIANTS ERROR:',
                err.response?.data || err.message
            )
        }
    }

    // FIND PRODUCT IN WISHLIST
    const getWishlistItem = (productId) => {
        return wishlistItems.find((wishlistItem) => {
            const id =
                typeof wishlistItem.product === 'object'
                    ? wishlistItem.product?._id
                    : wishlistItem.product

            return String(id) === String(productId)
        })
    }

    // ADD OR REMOVE FROM WISHLIST
    const toggleWishlist = async (productId) => {
        const existingItem = getWishlistItem(productId)

        try {
            setWishlistAction(productId)

            if (existingItem) {
                await removeFromWishlist(existingItem._id)
                toast.success('Removed from wishlist!')
            } else {
                await addToWishlist(productId)
                toast.success('Added to wishlist!')
            }
        } catch (err) {
            console.log(
                'WISHLIST ERROR:',
                err.response?.data || err.message
            )

            if (
                err.response?.status === 401 ||
                err.response?.status === 403
            ) {
                toast.error('Please login to use wishlist.')
            } else {
                toast.error(
                    err.response?.data?.message ||
                    'Unable to update wishlist.'
                )
            }
        } finally {
            setWishlistAction(null)
        }
    }

    // FIND VARIANT IN CART
    const getCartItem = (variantId) => {
        return cartItems.find((cartItem) => {
            const id =
                typeof cartItem.variant === 'object'
                    ? cartItem.variant?._id
                    : cartItem.variant

            return String(id) === String(variantId)
        })
    }

    // ADD TO CART
    const addToCart = async (item) => {
        try {
            setAddingProduct(item._id)

            const productId =
                typeof item.product === 'object'
                    ? item.product?._id
                    : item.product

            await addProductToCart(productId, 1, item._id)

            toast.success('Product added to cart!')
        } catch (error) {
            console.log(
                'ADD CART ERROR:',
                error.response?.data || error.message
            )

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                toast.error('Please login to add items to your cart.')
            } else {
                toast.error(
                    error.response?.data?.message ||
                    'Unable to add product to cart.'
                )
            }
        } finally {
            setAddingProduct(null)
        }
    }


    // BUY NOW

    // BUY NOW
    const handleBuyNow = (item) => {
        try {
            const product =
                typeof item.product === 'object'
                    ? item.product
                    : null

            const productId = product?._id

            if (!productId) {
                toast.error('Product not found.')
                return
            }

            // SAVE ONLY SELECTED BUY NOW PRODUCT
            const buyNowData = {
                productId: productId,
                variantId: item._id,
                product: product,
                variant: {
                    _id: item._id,
                    name: item.name,
                    sellingPrice: item.sellingPrice,
                    mrp: item.mrp
                },
                quantity: 1
            }

            sessionStorage.setItem(
                'buyNowProduct',
                JSON.stringify(buyNowData)
            )

            // DIRECT CHECKOUT
            const requestId = Date.now()

            router.push(
                `/checkout?mode=buy-now&t=${requestId}`
            )

        } catch (error) {
            console.log('BUY NOW ERROR:', error)
            toast.error('Unable to proceed to checkout.')
        }
    }

    
    // UPDATE CART QUANTITY / REMOVE ITEM
    const updateQuantity = async (cartItem, newQuantity) => {
        try {
            setUpdatingItem(cartItem._id)

            if (newQuantity < 1) {
                await removeCartItem(cartItem._id)
                toast.success('Product removed from cart!')
                return
            }

            await updateCartItem(cartItem._id, newQuantity)

            toast.success('Cart updated!')
        } catch (error) {
            console.log(
                'UPDATE CART ERROR:',
                error.response?.data || error.message
            )

            toast.error(
                error.response?.data?.message ||
                'Unable to update cart.'
            )
        } finally {
            setUpdatingItem(null)
        }
    }

    useEffect(() => {
        getVariants()
    }, [])

    // ONLY FEATURED ACTIVE VARIANTS
    const featuredVariants = variants.filter(
        (variant) =>
            variant.isFeatured === true &&
            variant.status === 'active'
    )

    return (
        <>
            <Banner />
            <CategoryNavbar />

            <main className="min-h-screen bg-purple-50 px-4 py-8 sm:px-8">
                <div className="mx-auto max-w-7xl">

                    <div className="mb-8">
                        <p className="mb-2 text-sm font-semibold text-purple-600">
                            FRESH FINDS FOR YOU
                        </p>

                        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                            Featured Products
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Discover your everyday essentials.
                        </p>
                    </div>

                    {featuredVariants.length === 0 ? (
                        <div className="rounded-2xl bg-white px-5 py-16 text-center shadow-sm">
                            <p className="text-lg font-semibold text-gray-700">
                                No featured products available
                            </p>

                            <p className="mt-2 text-sm text-gray-500">
                                Featured variants will appear here once available.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">

                            {featuredVariants.map((item) => {
                                const product =
                                    typeof item.product === 'object'
                                        ? item.product
                                        : null

                                const productId = product?._id

                                const cartItem = getCartItem(item._id)
                                const quantity = Number(cartItem?.quantity || 0)

                                const isAdding = addingProduct === item._id
                                const isUpdating = updatingItem === cartItem?._id

                                const isWishlisted = Boolean(
                                    productId && getWishlistItem(productId)
                                )

                                const isWishlistAction =
                                    wishlistAction === productId

                                const image =
                                    Array.isArray(item.images)
                                        ? item.images[0]
                                        : item.images

                                return (
                                    <div
                                        key={item._id}
                                        className="group overflow-hidden rounded-2xl border border-purple-100 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        {/* PRODUCT IMAGE AND HEART */}
                                        <div className="relative">
                                            <Link href={`/product/${product?.slug || ''}`}>
                                                <div className="flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-purple-50 sm:h-44">
                                                    {image ? (
                                                        <img
                                                            src={image}
                                                            alt={product?.name || item.name || 'Product'}
                                                            className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <p className="text-sm text-gray-400">
                                                            No image
                                                        </p>
                                                    )}
                                                </div>
                                            </Link>

                                            <button
                                                type="button"
                                                disabled={
                                                    isWishlistAction ||
                                                    wishlistLoading ||
                                                    !productId
                                                }
                                                onClick={() =>
                                                    toggleWishlist(productId)
                                                }
                                                aria-label={
                                                    isWishlisted
                                                        ? 'Remove from wishlist'
                                                        : 'Add to wishlist'
                                                }
                                                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl shadow-md transition hover:scale-110 disabled:opacity-50"
                                            >
                                                <span
                                                    className={
                                                        isWishlisted
                                                            ? 'text-pink-600'
                                                            : 'text-gray-500'
                                                    }
                                                >
                                                    {isWishlisted ? '♥' : '♡'}
                                                </span>
                                            </button>
                                        </div>

                                        {/* PRODUCT DETAILS */}
                                        <Link href={`/product/${product?.slug || ''}`}>
                                            <p className="mb-2 mt-3 line-clamp-2 min-h-10 cursor-pointer text-sm font-semibold text-gray-800 hover:text-purple-700">
                                                {product?.name || 'Product'}
                                            </p>

                                            <p className="text-sm text-gray-500">
                                                {item.name}
                                            </p>

                                            <div className="mb-3 mt-1 flex items-center gap-2">
                                                <p className="text-base font-bold text-purple-800">
                                                    ₹{item.sellingPrice}
                                                </p>

                                                {item.mrp > item.sellingPrice && (
                                                    <p className="text-xs text-gray-400 line-through">
                                                        ₹{item.mrp}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>

                                        {/* ADD TO CART / QUANTITY CONTROLS */}
                                        {!cartItem ? (
                                            <button
                                                type="button"
                                                disabled={isAdding}
                                                onClick={() => addToCart(item)}
                                                className="w-full rounded-lg border border-purple-600 px-2 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-600 hover:text-white disabled:opacity-50"
                                            >
                                                {isAdding ? 'ADDING...' : 'ADD TO CART'}
                                            </button>
                                        ) : (
                                            <div className="flex w-full items-center justify-between rounded-lg bg-purple-600 p-1 text-white">
                                                <button
                                                    type="button"
                                                    disabled={isUpdating}
                                                    onClick={() =>
                                                        updateQuantity(
                                                            cartItem,
                                                            quantity - 1
                                                        )
                                                    }
                                                    className="h-8 w-8 rounded-md text-xl font-bold hover:bg-purple-700 disabled:opacity-50"
                                                >
                                                    −
                                                </button>

                                                <span className="min-w-6 text-center font-bold">
                                                    {quantity}
                                                </span>

                                                <button
                                                    type="button"
                                                    disabled={isUpdating}
                                                    onClick={() =>
                                                        updateQuantity(
                                                            cartItem,
                                                            quantity + 1
                                                        )
                                                    }
                                                    className="h-8 w-8 rounded-md text-xl font-bold hover:bg-purple-700 disabled:opacity-50"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}

                                        {/* BUY NOW BUTTON */}
                                        <button
                                            type="button"
                                            disabled={isAdding}
                                            onClick={() => handleBuyNow(item)}
                                            className="mt-2 w-full rounded-lg bg-purple-100 px-2 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-200 disabled:opacity-50"
                                        >
                                            {isAdding ? 'PLEASE WAIT...' : 'BUY NOW'}
                                        </button>
                                    </div>
                                )
                            })}

                        </div>
                    )}
                </div>
            </main>
        </>
    )
}

export default Page