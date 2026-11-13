
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useCart } from '@/context/CartContext'
import { useLocationContext } from '@/context/LocationContext'

export default function ProductDetailPage() {
    const params = useParams()
    const productSlug = params?.productId

    console.log('PRODUCT SLUG:', productSlug)
    const router = useRouter()

    const { selectedStore } = useLocationContext()
    const storeId = selectedStore?._id

    const [product, setProduct] = useState(null)
    const [variants, setVariants] = useState([])
    const [selectedVariant, setSelectedVariant] = useState(null)

    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [wishlistLoading, setWishlistLoading] = useState(false)

    const {
        cartItems = [],
        addToCart,
        updateCartItem,
        removeCartItem,
        wishlistItems = [],
        addToWishlist,
        removeFromWishlist
    } = useCart()

    // GET PRODUCT ACCORDING TO SELECTED STORE
    useEffect(() => {
        let isMounted = true

        console.log('CURRENT URL:', window.location.pathname)
        console.log('PARAMS:', params)

        const getProduct = async () => {
            try {
                if (!storeId || !productSlug) return

                setLoading(true)
                setProduct(null)
                setVariants([])
                setSelectedVariant(null)

                const isMongoId = /^[0-9a-fA-F]{24}$/.test(
                    String(productSlug)
                )

                const params = {
                    storeId,
                    ...(isMongoId
                        ? { productId: productSlug }
                        : { productSlug })
                }

                const res = await axios.get(
                    'http://localhost:8000/product/public',
                    { params }
                )

                let selectedProduct = res.data?.data

                if (Array.isArray(selectedProduct)) {
                    selectedProduct = selectedProduct.find(
                        (item) =>
                            String(item._id) === String(productSlug) ||
                            item.slug === productSlug
                    )
                }

                if (!selectedProduct?._id) {
                    if (isMounted) {
                        setProduct(null)
                        setVariants([])
                    }
                    return
                }

                // Only active variants with available stock
                const availableVariants = (
                    selectedProduct.variants || []
                ).filter((variant) =>
                    variant.status === 'active' &&
                    Number(variant.availableQuantity) > 0
                )

                if (isMounted) {
                    setProduct(selectedProduct)
                    setVariants(availableVariants)

                    if (availableVariants.length > 0) {
                        setSelectedVariant(availableVariants[0])
                    }
                }

            } catch (error) {
                console.log(
                    'GET PRODUCT ERROR:',
                    error.response?.data || error.message
                )

                if (isMounted) {
                    setProduct(null)
                    setVariants([])
                    setSelectedVariant(null)
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        getProduct()

        return () => {
            isMounted = false
        }
    }, [productSlug, storeId])

    // CHECK WHETHER PRODUCT HAS VARIANTS
    const hasVariants = Boolean(product?.variants?.length)

    // FIND CART ITEM
    const cartItem = cartItems.find((item) => {
        const productIdInCart =
            typeof item.product === 'object'
                ? item.product?._id
                : item.product

        const variantIdInCart =
            typeof item.variant === 'object'
                ? item.variant?._id
                : item.variant

        return (
            String(productIdInCart) === String(product?._id) &&
            String(variantIdInCart || '') ===
            String(selectedVariant?._id || '')
        )
    })

    const quantity = Number(cartItem?.quantity || 0)

    // CURRENT AVAILABLE STOCK FROM STORE INVENTORY
    const currentStock = Number(
        selectedVariant?.availableQuantity ??
        product?.availableQuantity ??
        0
    )

    // FIND WISHLIST ITEM
    const wishlistItem = wishlistItems.find((item) => {
        const id =
            typeof item.product === 'object'
                ? item.product?._id
                : item.product

        return String(id) === String(product?._id)
    })

    const isWishlisted = Boolean(wishlistItem)

    // ADD / REMOVE WISHLIST
    const toggleWishlist = async () => {
        if (!product?._id) return

        try {
            setWishlistLoading(true)

            if (wishlistItem) {
                await removeFromWishlist(wishlistItem._id)
                toast.success('Removed from wishlist!')
            } else {
                await addToWishlist(product._id)
                toast.success('Added to wishlist!')
            }

        } catch (error) {
            console.log(
                'WISHLIST ERROR:',
                error.response?.data || error.message
            )

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                toast.error('Please login to use wishlist.')
            } else {
                toast.error(
                    error.response?.data?.message ||
                    'Unable to update wishlist'
                )
            }
        } finally {
            setWishlistLoading(false)
        }
    }

    // ADD TO CART
    const handleAddToCart = async () => {
        if (currentStock <= 0) {
            toast.error('Product is out of stock!')
            return
        }

        if (hasVariants && !selectedVariant) {
            toast.error('Please select an available variant!')
            return
        }

        try {
            setAdding(true)

            await addToCart(
                product._id,
                1,
                selectedVariant?._id || null
            )

            toast.success('Product added to cart!')

        } catch (error) {
            console.log(
                'ADD TO CART ERROR:',
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
                    'Unable to add product to cart'
                )
            }
        } finally {
            setAdding(false)
        }
    }

    // BUY NOW - DOES NOT ADD PRODUCT TO CART
    const handleBuyNow = () => {
        if (currentStock <= 0) {
            toast.error('Product is out of stock!')
            return
        }

        if (hasVariants && !selectedVariant) {
            toast.error('Please select an available variant!')
            return
        }

        const buyNowData = {
            productId: product._id,
            variantId: selectedVariant?._id || null,
            quantity: 1,

            product: {
                _id: product._id,
                name: product.name,
                price: product.price,
                image: product.image,
                availableQuantity: currentStock
            },

            variant: selectedVariant
                ? {
                    _id: selectedVariant._id,
                    name: selectedVariant.name,
                    sellingPrice: selectedVariant.sellingPrice,
                    mrp: selectedVariant.mrp,
                    availableQuantity: currentStock,
                    images: selectedVariant.images
                }
                : null
        }

        sessionStorage.setItem(
            'buyNowProduct',
            JSON.stringify(buyNowData)
        )

        router.push('/checkout?mode=buy-now')
    }

    // UPDATE CART QUANTITY
    const updateQuantity = async (newQuantity) => {
        if (!cartItem?._id) return

        if (newQuantity > currentStock) {
            toast.error('Available stock limit reached!')
            return
        }

        try {
            setUpdating(true)

            if (newQuantity <= 0) {
                await removeCartItem(cartItem._id)
                toast.success('Product removed from cart!')
            } else {
                await updateCartItem(cartItem._id, newQuantity)
                toast.success('Cart updated!')
            }

        } catch (error) {
            console.log(
                'UPDATE QUANTITY ERROR:',
                error.response?.data || error.message
            )

            toast.error(
                error.response?.data?.message ||
                'Unable to update quantity'
            )
        } finally {
            setUpdating(false)
        }
    }

    // LOCATION NOT SELECTED
    if (!storeId) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center bg-[#faf8ff] px-4">
                <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                    <div className="mb-4 text-5xl">📍</div>
                    <p className="text-lg font-bold text-gray-800">
                        Please select your location first.
                    </p>
                </div>
            </div>
        )
    }

    // LOADING
    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center bg-[#faf8ff]">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
                    <p className="font-medium text-gray-500">
                        Loading product...
                    </p>
                </div>
            </div>
        )
    }

    // PRODUCT NOT FOUND
    if (!product) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center bg-[#faf8ff] px-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
                    <div className="mb-4 text-5xl">🛍️</div>

                    <h2 className="text-xl font-bold text-gray-800">
                        Product not found
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        This product is not available in your selected store.
                    </p>

                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="mt-6 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        )
    }

    const currentPrice = Number(
        selectedVariant?.sellingPrice ?? product.price ?? 0
    )

    const currentMrp = Number(
        selectedVariant?.mrp ?? 0
    )

    const currentImage =
        selectedVariant?.images?.[0] ||
        product.image

    const discountPercentage =
        currentMrp > currentPrice
            ? Math.round(
                ((currentMrp - currentPrice) / currentMrp) * 100
            )
            : 0

    return (
        <main className="min-h-screen bg-[#faf8ff] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
            <div className="mx-auto max-w-7xl">

                {/* BREADCRUMB */}
                <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <button
                        onClick={() => router.push('/')}
                        className="transition hover:text-purple-700"
                    >
                        Home
                    </button>
                    <span>/</span>
                    <span className="font-medium text-purple-700">
                        Product Details
                    </span>
                </div>

                {/* PRODUCT MAIN SECTION */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">

                    {/* LEFT - PRODUCT IMAGE */}
                    <div className="relative overflow-hidden rounded-3xl border border-purple-100 bg-white p-4 shadow-sm sm:p-7">

                        <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-2xl bg-[#f8f5ff] p-5 sm:min-h-[430px] sm:p-8">

                            {currentImage ? (
                                <img
                                    src={currentImage}
                                    alt={product.name}
                                    className="max-h-[380px] w-full object-contain transition duration-500 hover:scale-105"
                                />
                            ) : (
                                <p className="text-gray-400">
                                    No image available
                                </p>
                            )}

                            {/* WISHLIST BUTTON */}
                            <button
                                type="button"
                                onClick={toggleWishlist}
                                disabled={wishlistLoading}
                                aria-label={
                                    isWishlisted
                                        ? 'Remove from wishlist'
                                        : 'Add to wishlist'
                                }
                                className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-3xl shadow-md transition hover:scale-110 disabled:opacity-50"
                            >
                                <span className={
                                    isWishlisted
                                        ? 'text-pink-600'
                                        : 'text-gray-500'
                                }>
                                    {isWishlisted ? '♥' : '♡'}
                                </span>
                            </button>

                            {/* DISCOUNT BADGE */}
                            {discountPercentage > 0 && (
                                <span className="absolute left-4 top-4 rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white shadow-sm">
                                    {discountPercentage}% OFF
                                </span>
                            )}
                        </div>

                        {/* IMAGE FOOTER */}
                        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 sm:gap-6 sm:text-sm">
                            <span className="flex items-center gap-2">
                                <span className="text-lg text-green-600">✓</span>
                                Quality Products
                            </span>

                            <span className="flex items-center gap-2">
                                <span className="text-lg text-green-600">✓</span>
                                Secure Shopping
                            </span>
                        </div>
                    </div>

                    {/* RIGHT - PRODUCT DETAILS */}
                    <div className="flex flex-col rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-8 lg:p-9">

                        <div className="mb-5">
                            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-purple-600">
                                SELLORA • PRODUCT DETAILS
                            </p>

                            <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl lg:text-4xl">
                                {product.name}
                            </h1>
                        </div>

                        {/* PRICE */}
                        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-6">
                            <span className="text-3xl font-extrabold text-purple-800 sm:text-4xl">
                                ₹{currentPrice}
                            </span>

                            {currentMrp > currentPrice && (
                                <>
                                    <span className="text-lg text-gray-400 line-through">
                                        ₹{currentMrp}
                                    </span>

                                    <span className="rounded-lg bg-green-50 px-3 py-1.5 text-sm font-bold text-green-700">
                                        Save {discountPercentage}%
                                    </span>
                                </>
                            )}
                        </div>

                        {/* VARIANTS */}
                        {hasVariants && (
                            <div className="border-b border-gray-100 py-6">
                                <h2 className="mb-4 text-base font-bold text-gray-900">
                                    Select Variant
                                </h2>

                                {variants.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {variants.map((variant) => (
                                            <button
                                                key={variant._id}
                                                type="button"
                                                onClick={() => setSelectedVariant(variant)}
                                                className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${selectedVariant?._id === variant._id
                                                        ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-100'
                                                        : 'border-gray-200 bg-white text-gray-700 hover:border-purple-400'
                                                    }`}
                                            >
                                                {variant.name}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">
                                        All variants are currently out of stock.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* DESCRIPTION */}
                        <div className="py-6">
                            <h2 className="mb-3 text-base font-bold text-gray-900">
                                Product Description
                            </h2>

                            <p className="text-sm leading-7 text-gray-600 sm:text-base">
                                {product.description || 'No description available.'}
                            </p>
                        </div>

                        {/* STOCK STATUS */}
                        <div className="mb-6 flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                            <span className={`h-2.5 w-2.5 rounded-full ${currentStock > 0
                                    ? 'bg-green-500'
                                    : 'bg-red-500'
                                }`}></span>

                            <span className="text-sm font-medium text-gray-700">
                                Availability:
                            </span>

                            <span className={`text-sm font-bold ${currentStock > 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}>
                                {currentStock > 0
                                    ? 'In Stock'
                                    : 'Out of Stock'}
                            </span>
                        </div>

                        {/* CART AND BUY NOW */}
                        <div className="mt-auto space-y-3">

                            {!cartItem ? (
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={
                                        adding ||
                                        currentStock <= 0 ||
                                        (hasVariants && !selectedVariant)
                                    }
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3.5 text-base font-bold text-white shadow-md shadow-purple-100 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {adding ? (
                                        <>
                                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-xl">+</span>
                                            {currentStock <= 0
                                                ? 'Out of Stock'
                                                : 'Add to Cart'}
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="flex w-full items-center justify-between rounded-xl bg-purple-600 p-2 text-white">
                                    <button
                                        type="button"
                                        disabled={updating}
                                        onClick={() => updateQuantity(quantity - 1)}
                                        className="flex h-11 w-12 items-center justify-center rounded-lg text-2xl font-bold transition hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        −
                                    </button>

                                    <span className="font-bold">
                                        {updating ? '...' : quantity}
                                    </span>

                                    <button
                                        type="button"
                                        disabled={
                                            updating ||
                                            quantity >= currentStock
                                        }
                                        onClick={() => updateQuantity(quantity + 1)}
                                        className="flex h-11 w-12 items-center justify-center rounded-lg text-2xl font-bold transition hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        +
                                    </button>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleBuyNow}
                                disabled={
                                    currentStock <= 0 ||
                                    (hasVariants && !selectedVariant)
                                }
                                className="w-full rounded-xl border-2 border-purple-600 bg-white px-6 py-3.5 font-bold text-purple-700 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Buy Now
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push('/')}
                                className="w-full py-3 text-sm font-semibold text-gray-500 transition hover:text-purple-700"
                            >
                                ← Continue Shopping
                            </button>
                        </div>

                    </div>
                </div>

                {/* BOTTOM TRUST SECTION */}
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

                    <div className="flex items-center gap-4 rounded-2xl border border-purple-100 bg-white p-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-xl text-purple-600">
                            ✓
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-800">
                                Quality Products
                            </h3>
                            <p className="mt-1 text-xs text-gray-500">
                                Carefully selected products
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-2xl border border-purple-100 bg-white p-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-xl text-purple-600">
                            ♡
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-800">
                                Easy Shopping
                            </h3>
                            <p className="mt-1 text-xs text-gray-500">
                                Simple and convenient ordering
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-2xl border border-purple-100 bg-white p-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-xl text-purple-600">
                            ✓
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-800">
                                Secure Checkout
                            </h3>
                            <p className="mt-1 text-xs text-gray-500">
                                Safe and secure ordering
                            </p>
                        </div>
                    </div>

                </div>

            </div>
        </main>
    )
}
