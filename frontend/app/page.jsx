
'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Banner from '@/components/Banner'
import CategoryNavbar from '@/components/CategoryNavbar'
import { useCart } from '@/context/CartContext'
import { toast } from 'react-hot-toast'
import { useLocationContext } from '@/context/LocationContext'

const Page = () => {
    const router = useRouter()

    const { selectedStore, locationLoading } = useLocationContext()

    const storeId = selectedStore?._id

    const [variants, setVariants] = useState([])
    const [wishlistAction, setWishlistAction] = useState(null)
    const [addingProduct, setAddingProduct] = useState(null)
    const [updatingItem, setUpdatingItem] = useState(null)
    const [loadingProducts, setLoadingProducts] = useState(true)

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

    // GET STORE-WISE FEATURED PRODUCTS
    const getVariants = async (currentStoreId) => {
        try {
            setLoadingProducts(true)

            const res = await axios.get(
                'http://localhost:8000/product/featured',
                {
                    headers: {
                        'Cache-Control': 'no-cache'
                    },
                    params: {
                        storeId: currentStoreId,
                        t: Date.now()
                    }
                }
            )

            const featuredProducts = res.data?.data || []

            const featuredVariantData = featuredProducts.flatMap((product) => {
                return (product.variants || [])
                    .filter((variant) => variant.status === 'active')
                    .map((variant) => ({
                        ...variant,
                        product
                    }))
            })

            setVariants(featuredVariantData)

        } catch (err) {
            console.log(
                'GET FEATURED PRODUCTS ERROR:',
                err.response?.data || err.message
            )

            setVariants([])
        } finally {
            setLoadingProducts(false)
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
        } 
        catch (error) {
            console.log(
                'ADD CART ERROR:',
                error.response?.data || error.message
            )

            if (error.response?.status === 401) {
                // Login Required popup CartContext se open hoga
            } else if (error.response?.status === 403) {
                toast.error('You are not allowed to add items to cart.')
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
    const handleBuyNow = (item) => {
        try {
            const product =
                typeof item.product === 'object'
                    ? item.product
                    : null

            const productId = product?._id

            console.log('PRODUCT DATA>>>>:', product)
            console.log('PRODUCT SLUG>>>>>>>>>>>>:', product?.slug)

            if (!productId) {
                toast.error('Product not found.')
                return
            }

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

        if (locationLoading) return

        if (!storeId) {
            setVariants([])
            setLoadingProducts(false)
            return
        }

        getVariants(storeId)

    }, [storeId, locationLoading])


    const featuredVariants = variants.filter(
        (variant) => variant.status === 'active'
    )

    return (
        <>
            <Banner />
            <CategoryNavbar />

            <main className="min-h-screen bg-[#faf9ff]">

                <div className="mx-auto max-w-[1500px] px-3 py-8 sm:px-6 sm:py-10 lg:px-10">

                    {/* SECTION HEADING */}
                    <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

                        <div>
                            <div className="mb-3 flex items-center gap-2">
                                <span className="h-1 w-8 rounded-full bg-purple-600"></span>

                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">
                                    Handpicked for you
                                </p>
                            </div>

                            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
                                Featured Products
                                <span className="ml-2 text-purple-600">💜</span>
                            </h2>

                            <p className="mt-2 text-sm text-gray-500 sm:text-base">
                                Discover products you'll love, at prices you'll enjoy.
                            </p>
                        </div>

                        <Link
                            href="/AllProducts"
                            className="inline-flex w-fit items-center gap-2 rounded-xl border border-purple-200 bg-white px-5 py-3 text-sm font-bold text-purple-700 shadow-sm transition duration-300 hover:border-purple-600 hover:bg-purple-600 hover:text-white"
                        >
                            View All Products
                            <span className="text-lg">→</span>
                        </Link>

                    </section>

                    <div className="mb-7 h-px w-full bg-gradient-to-r from-purple-200 via-purple-100 to-transparent"></div>

                    {/* LOADING */}
                    {loadingProducts ? (

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">

                            {Array.from({ length: 12 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="animate-pulse rounded-2xl border border-purple-100 bg-white p-3 shadow-sm"
                                >
                                    <div className="h-36 rounded-xl bg-purple-100 sm:h-44"></div>
                                    <div className="mt-4 h-4 w-4/5 rounded bg-gray-200"></div>
                                    <div className="mt-3 h-3 w-2/3 rounded bg-gray-100"></div>
                                    <div className="mt-4 h-5 w-1/2 rounded bg-purple-100"></div>
                                    <div className="mt-4 h-9 rounded-lg bg-purple-100"></div>
                                    <div className="mt-2 h-9 rounded-lg bg-gray-100"></div>
                                </div>
                            ))}

                        </div>

                    ) : featuredVariants.length === 0 ? (

                        <div className="rounded-3xl border border-purple-100 bg-white px-5 py-16 text-center shadow-sm">

                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 text-4xl">
                                🛍️
                            </div>

                            <h3 className="mt-5 text-xl font-bold text-gray-800">
                                No Featured Products Yet
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                                We're getting some amazing products ready for you.
                                Please check back soon!
                            </p>

                            <Link
                                href="/AllProducts"
                                className="mt-6 inline-flex rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-purple-700"
                            >
                                Explore All Products →
                            </Link>

                        </div>

                    ) : (

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">

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
                                        className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-purple-100 bg-white p-2.5 shadow-[0_3px_15px_rgba(91,33,182,0.04)] transition duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-[0_12px_30px_rgba(91,33,182,0.12)] sm:p-3"
                                    >

                                        {/* PRODUCT IMAGE */}
                                        <div className="relative overflow-hidden rounded-xl bg-[#f7f3ff]">

                                            <Link href={`/product/${product?.slug || ''}`}>
                                                <div className="flex h-36 cursor-pointer items-center justify-center p-3 sm:h-44 lg:h-48">

                                                    {image ? (
                                                        <img
                                                            src={image}
                                                            alt={product?.name || item.name || 'Product'}
                                                            loading="lazy"
                                                            className="h-full w-full object-contain transition duration-500 group-hover:scale-110"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-400">
                                                            No image available
                                                        </span>
                                                    )}

                                                </div>
                                            </Link>



                                            {/* WISHLIST */}
                                            <button
                                                type="button"
                                                disabled={
                                                    isWishlistAction ||
                                                    wishlistLoading ||
                                                    !productId
                                                }
                                                onClick={() => toggleWishlist(productId)}
                                                aria-label={
                                                    isWishlisted
                                                        ? 'Remove from wishlist'
                                                        : 'Add to wishlist'
                                                }
                                                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xl shadow-md transition hover:scale-110 hover:bg-purple-50 disabled:opacity-50 sm:h-9 sm:w-9"
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
                                        <div className="flex flex-1 flex-col">

                                            <Link href={`/product/${product?.slug || ''}`}>

                                                <h3 className="mb-1 mt-3 line-clamp-2 min-h-10 text-xs font-bold leading-5 text-gray-800 transition hover:text-purple-700 sm:text-sm">
                                                    {product?.name || 'Product'}
                                                </h3>

                                                <p className="line-clamp-1 text-[11px] text-gray-500 sm:text-xs">
                                                    {item.name}
                                                </p>

                                            </Link>

                                            {/* PRICE */}
                                            <div className="mb-3 mt-2 flex flex-wrap items-center gap-1.5">

                                                <span className="text-sm font-extrabold text-purple-800 sm:text-base">
                                                    ₹{item.sellingPrice}
                                                </span>

                                                {item.mrp > item.sellingPrice && (
                                                    <span className="text-[10px] text-gray-400 line-through sm:text-xs">
                                                        ₹{item.mrp}
                                                    </span>
                                                )}

                                            </div>

                                            {/* CART ACTIONS */}
                                            <div className="mt-auto">

                                                {!cartItem ? (

                                                    <button
                                                        type="button"
                                                        disabled={isAdding}
                                                        onClick={() => addToCart(item)}
                                                        className="w-full rounded-lg bg-purple-600 px-1.5 py-2.5 text-[10px] font-extrabold tracking-wide text-white transition hover:bg-purple-700 hover:shadow-md hover:shadow-purple-200 disabled:opacity-50 sm:text-xs"
                                                    >
                                                        {isAdding ? 'ADDING...' : '+ ADD TO CART'}
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
                                                            className="h-7 w-7 rounded-md text-lg font-bold transition hover:bg-purple-700 disabled:opacity-50 sm:h-8 sm:w-8"
                                                        >
                                                            −
                                                        </button>

                                                        <span className="min-w-6 text-center text-xs font-bold sm:text-sm">
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
                                                            className="h-7 w-7 rounded-md text-lg font-bold transition hover:bg-purple-700 disabled:opacity-50 sm:h-8 sm:w-8"
                                                        >
                                                            +
                                                        </button>

                                                    </div>

                                                )}

                                                {/* BUY NOW */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleBuyNow(item)}
                                                    className="mt-2 w-full rounded-lg border border-purple-200 bg-purple-50 px-1.5 py-2.5 text-[10px] font-extrabold tracking-wide text-purple-700 transition hover:border-purple-600 hover:bg-purple-100 sm:text-xs"
                                                >
                                                    BUY NOW →
                                                </button>

                                            </div>

                                        </div>

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
