
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useCart } from '@/context/CartContext'

export default function ProductDetailPage() {
    const params = useParams()
    const productSlug = params?.productId
    const router = useRouter()

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

    useEffect(() => {
        let isMounted = true

        const getProduct = async () => {
            try {
                setLoading(true)
                setProduct(null)
                setVariants([])
                setSelectedVariant(null)

                if (!productSlug) return

                const isMongoId = /^[0-9a-fA-F]{24}$/.test(productSlug)

                const res = await axios.get(
                    'http://localhost:8000/product/public',
                    {
                        params: isMongoId
                            ? { productId: productSlug }
                            : { productSlug }
                    }
                )

                let selectedProduct = res.data?.data

                if (Array.isArray(selectedProduct)) {
                    selectedProduct = selectedProduct[0]
                }

                if (!selectedProduct?._id) {
                    if (isMounted) setProduct(null)
                    return
                }

                if (isMongoId && selectedProduct.slug) {
                    router.replace(`/product/${selectedProduct.slug}`)
                    return
                }

                if (isMounted) {
                    setProduct(selectedProduct)
                }

                const variantRes = await axios.get(
                    'http://localhost:8000/productvariant/public',
                    {
                        params: {
                            productId: selectedProduct._id
                        }
                    }
                )

                const productVariants = Array.isArray(variantRes.data?.data)
                    ? variantRes.data.data
                    : []

                if (isMounted) {
                    setVariants(productVariants)

                    if (productVariants.length > 0) {
                        setSelectedVariant(productVariants[0])
                    }
                }

            } catch (error) {
                console.log(
                    'GET PRODUCT ERROR:',
                    error.response?.data || error.message
                )

                if (isMounted) {
                    setProduct(null)
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
    }, [productSlug, router])

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
        if (product.stock <= 0) {
            toast.error('Product is out of stock!')
            return
        }

        if (variants.length > 0 && !selectedVariant) {
            toast.error('Please select a variant!')
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
                stock: product.stock
            },
            variant: selectedVariant
                ? {
                    _id: selectedVariant._id,
                    name: selectedVariant.name,
                    sellingPrice: selectedVariant.sellingPrice
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

    if (loading) {
        return (
            <p className="p-8 text-center">
                Loading product...
            </p>
        )
    }

    if (!product) {
        return (
            <div className="p-8 text-center">
                <p className="text-lg font-semibold">
                    Product not found.
                </p>
            </div>
        )
    }

    const currentPrice = Number(
        selectedVariant?.sellingPrice ?? product.price
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
        <main className="min-h-screen bg-purple-50 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-6xl">
                <div className="grid gap-8 rounded-3xl bg-white p-5 shadow-sm sm:p-8 md:grid-cols-2">

                    {/* PRODUCT IMAGE */}
                    <div className="relative flex min-h-72 items-center justify-center rounded-2xl bg-purple-50 p-5">
                        {currentImage ? (
                            <img
                                src={currentImage}
                                alt={product.name}
                                className="max-h-96 w-full object-contain"
                            />
                        ) : (
                            <p className="text-gray-400">
                                No image available
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={toggleWishlist}
                            disabled={wishlistLoading}
                            aria-label={
                                isWishlisted
                                    ? 'Remove from wishlist'
                                    : 'Add to wishlist'
                            }
                            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-3xl shadow-md transition hover:scale-110 disabled:opacity-50"
                        >
                            <span className={
                                isWishlisted
                                    ? 'text-pink-600'
                                    : 'text-gray-500'
                            }>
                                {isWishlisted ? '♥' : '♡'}
                            </span>
                        </button>
                    </div>

                    {/* PRODUCT DETAILS */}
                    <div className="flex flex-col justify-center">
                        <p className="mb-3 text-sm font-semibold text-purple-600">
                            SELLORA • PRODUCT DETAILS
                        </p>

                        <h1 className="text-3xl font-bold text-gray-900">
                            {product.name}
                        </h1>

                        {/* PRICE */}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <p className="text-3xl font-bold text-purple-800">
                                ₹{currentPrice}
                            </p>

                            {currentMrp > currentPrice && (
                                <>
                                    <p className="text-lg text-gray-400 line-through">
                                        ₹{currentMrp}
                                    </p>

                                    <span className="rounded-lg bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                                        {discountPercentage}% OFF
                                    </span>
                                </>
                            )}
                        </div>

                        {/* VARIANTS */}
                        {variants.length > 0 && (
                            <div className="mt-6">
                                <h2 className="mb-3 font-semibold text-gray-800">
                                    Select Variant
                                </h2>

                                <div className="flex flex-wrap gap-3">
                                    {variants.map((variant) => (
                                        <button
                                            key={variant._id}
                                            type="button"
                                            onClick={() => setSelectedVariant(variant)}
                                            className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                                selectedVariant?._id === variant._id
                                                    ? 'border-purple-600 bg-purple-100 text-purple-700'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-purple-400'
                                            }`}
                                        >
                                            {variant.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* DESCRIPTION */}
                        <div className="mt-5">
                            <h2 className="font-semibold text-gray-800">
                                Product Description
                            </h2>

                            <p className="mt-2 leading-7 text-gray-600">
                                {product.description || 'No description available.'}
                            </p>
                        </div>

                        {/* AVAILABILITY */}
                        <p className="mt-5 text-sm text-gray-600">
                            Availability:{' '}
                            <span className={
                                product.stock > 0
                                    ? 'font-semibold text-green-600'
                                    : 'font-semibold text-red-600'
                            }>
                                {product.stock > 0
                                    ? 'In Stock'
                                    : 'Out of Stock'}
                            </span>
                        </p>

                        {/* CART AND BUY NOW BUTTONS */}
                        <div className="mt-7 flex flex-wrap items-center gap-3">
                            {quantity === 0 ? (
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={
                                        adding ||
                                        product.stock <= 0 ||
                                        (variants.length > 0 && !selectedVariant)
                                    }
                                    className="rounded-xl bg-purple-600 px-6 py-3 font-bold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {adding
                                        ? 'Adding...'
                                        : product.stock <= 0
                                            ? 'Out of Stock'
                                            : 'Add to Cart'}
                                </button>
                            ) : (
                                <div className="flex w-fit items-center gap-5 rounded-xl bg-purple-600 p-2 text-white">
                                    <button
                                        type="button"
                                        disabled={updating}
                                        onClick={() => updateQuantity(quantity - 1)}
                                        className="h-10 w-10 rounded-lg text-2xl font-bold hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        −
                                    </button>

                                    <span className="min-w-6 text-center font-bold">
                                        {updating ? '...' : quantity}
                                    </span>

                                    <button
                                        type="button"
                                        disabled={updating}
                                        onClick={() => updateQuantity(quantity + 1)}
                                        className="h-10 w-10 rounded-lg text-2xl font-bold hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        +
                                    </button>
                                </div>
                            )}

                            {/* BUY NOW */}
                            <button
                                type="button"
                                onClick={handleBuyNow}
                                disabled={
                                    product.stock <= 0 ||
                                    (variants.length > 0 && !selectedVariant)
                                }
                                className="rounded-xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Buy Now
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => router.push('/')}
                            className="mt-4 w-fit text-sm font-semibold text-purple-700 hover:underline"
                        >
                            Continue Shopping →
                        </button>
                    </div>
                </div>
            </div>
        </main>
    )
}
