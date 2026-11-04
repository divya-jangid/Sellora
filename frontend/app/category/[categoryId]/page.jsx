
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { toast } from 'react-hot-toast'

const API = 'http://localhost:8000'

export default function CategoryPage() {
    const params = useParams()
    const categorySlug = params.categorySlug || params.categoryId

    const router = useRouter()
    const searchParams = useSearchParams()

    const subcategorySlug = searchParams.get('subcategory') || 'all'

    const {
        cartItems = [],
        addToCart: addCartItem,
        updateCartItem,
        removeCartItem,
        wishlistItems = [],
        addToWishlist,
        removeFromWishlist
    } = useCart()

    const [category, setCategory] = useState(null)
    const [subcategories, setSubcategories] = useState([])
    const [products, setProducts] = useState([])
    const [variants, setVariants] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    // FETCH CATEGORY, SUBCATEGORY, PRODUCTS AND VARIANTS
    useEffect(() => {
        let isMounted = true

        const getCategoryData = async () => {
            try {
                setLoading(true)
                setErrorMessage('')

                const [
                    categoryRes,
                    subcategoryRes,
                    productRes,
                    variantRes
                ] = await Promise.all([
                    axios.get(`${API}/category/public`),
                    axios.get(`${API}/subcategory/public`),
                    axios.get(`${API}/product/public`),

                    // FETCH VARIANTS BASED ON CATEGORY AND SUBCATEGORY SLUG
                    axios.get(`${API}/productvariant/public`, {
                        params: {
                            categorySlug: categorySlug,
                            subcategorySlug: subcategorySlug
                        }
                    })
                ])

                const categories =
                    categoryRes.data?.data?.categories ||
                    categoryRes.data?.categories ||
                    categoryRes.data?.data ||
                    []

                const allSubcategories =
                    subcategoryRes.data?.data?.subcategories ||
                    subcategoryRes.data?.subcategories ||
                    subcategoryRes.data?.data ||
                    []

                const allProducts =
                    productRes.data?.data?.products ||
                    productRes.data?.products ||
                    productRes.data?.data ||
                    []

                // PRODUCT VARIANT API RESPONSE
                const allVariants =
                    variantRes.data?.data?.variants ||
                    variantRes.data?.variants ||
                    variantRes.data?.data ||
                    []

                if (
                    !Array.isArray(categories) ||
                    !Array.isArray(allSubcategories) ||
                    !Array.isArray(allProducts) ||
                    !Array.isArray(allVariants)
                ) {
                    throw new Error('Invalid API response')
                }

                // FIND SELECTED CATEGORY
                const selectedCategory = categories.find(
                    item => String(item.slug) === String(categorySlug)
                )

                if (!selectedCategory) {
                    if (isMounted) {
                        setCategory(null)
                        setSubcategories([])
                        setProducts([])
                        setVariants([])
                    }
                    return
                }

                const categoryId = String(selectedCategory._id)

                // FILTER SUBCATEGORIES BY CATEGORY
                const categorySubcategories = allSubcategories.filter(item => {
                    const id = item.category?._id || item.category
                    return String(id) === categoryId
                })

                // FILTER PRODUCTS BY CATEGORY
                const categoryProducts = allProducts.filter(item => {
                    const id = item.category?._id || item.category
                    return String(id) === categoryId
                })

                // API ALREADY RETURNS CATEGORY/SUBCATEGORY FILTERED VARIANTS
                // NO NEED TO FETCH ALL VARIANTS AND FILTER THEM AGAIN

                if (isMounted) {
                    setCategory(selectedCategory)
                    setSubcategories(categorySubcategories)
                    setProducts(categoryProducts)
                    setVariants(allVariants)
                }

            } catch (error) {
                console.log('CATEGORY FETCH ERROR:', error)
                console.log('ERROR RESPONSE:', error.response?.data)

                if (isMounted) {
                    setErrorMessage(
                        error.response?.data?.message ||
                        error.message ||
                        'Unable to load category.'
                    )
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        if (categorySlug) {
            getCategoryData()
        } else {
            setLoading(false)
            setErrorMessage('Category slug is missing.')
        }

        return () => {
            isMounted = false
        }

    }, [categorySlug, subcategorySlug])

    // CHANGE SUBCATEGORY
    const handleSubcategoryChange = slug => {
        if (slug === 'all') {
            router.push(`/category/${categorySlug}`)
        } else {
            router.push(
                `/category/${categorySlug}?subcategory=${encodeURIComponent(slug)}`
            )
        }
    }

    // SELECTED SUBCATEGORY
    const selectedSubcategory = subcategories.find(
        item => item.slug === subcategorySlug
    )

    // FILTER PRODUCTS BY SUBCATEGORY
    const filteredProducts = subcategorySlug === 'all'
        ? products
        : products.filter(item => {
            const id = item.subCategory?._id || item.subCategory

            return String(id) === String(selectedSubcategory?._id)
        })

    // GET PRODUCT VARIANTS
    const getProductVariants = productId => {
        return variants.filter(variant => {
            const id = variant.product?._id || variant.product

            return String(id) === String(productId)
        })
    }

    // GET DEFAULT VARIANT (LOWEST PRICE)
    const getDefaultVariant = productId => {
        const productVariants = getProductVariants(productId)

        if (!productVariants.length) {
            return null
        }

        return [...productVariants].sort(
            (a, b) => Number(a.sellingPrice) - Number(b.sellingPrice)
        )[0]
    }

    // FIND CART ITEM
    const getCartItem = (productId, variantId) => {
        return cartItems.find(cartItem => {
            const cartProductId =
                cartItem.product?._id || cartItem.product

            const cartVariantId =
                cartItem.variant?._id || cartItem.variant

            return (
                String(cartProductId) === String(productId) &&
                String(cartVariantId) === String(variantId)
            )
        })
    }

    // ADD TO CART
    const handleAddToCart = async (productId, variantId) => {
        try {
            if (!variantId) {
                toast.error('Product is currently unavailable.')
                return
            }

            await addCartItem(productId, 1, variantId)

            toast.success('Product added to cart!')
        } catch (error) {
            console.log('ADD CART ERROR:', error)

            toast.error(
                error.response?.data?.message ||
                'Unable to add product to cart.'
            )
        }
    }

    // BUY NOW
    const handleBuyNow = (product, variant) => {
        try {
            if (!product || !variant) {
                toast.error('Product variant not available.')
                return
            }

            const buyNowData = {
                productId: product._id,
                variantId: variant._id,
                quantity: 1,

                product: {
                    _id: product._id,
                    name: product.name,
                    image: product.image,
                    stock: product.stock
                },

                variant: {
                    _id: variant._id,
                    name: variant.name,
                    unitValue: variant.unitValue,
                    unit: variant.unit,
                    sellingPrice: variant.sellingPrice,
                    mrp: variant.mrp,
                    images: variant.images
                }
            }

            sessionStorage.setItem(
                'buyNowProduct',
                JSON.stringify(buyNowData)
            )

            router.push(`/checkout?mode=buy-now&t=${Date.now()}`)

        } catch (error) {
            console.log('BUY NOW ERROR:', error)
            toast.error('Unable to proceed to checkout.')
        }
    }

    // INCREASE QUANTITY
    const handleIncrease = async cartItem => {
        try {
            await updateCartItem(
                cartItem._id,
                cartItem.quantity + 1
            )
        } catch (error) {
            console.log('INCREASE ERROR:', error)
            toast.error('Unable to update quantity.')
        }
    }

    // DECREASE QUANTITY
    const handleDecrease = async cartItem => {
        try {
            if (cartItem.quantity <= 1) {
                await removeCartItem(cartItem._id)
            } else {
                await updateCartItem(
                    cartItem._id,
                    cartItem.quantity - 1
                )
            }
        } catch (error) {
            console.log('DECREASE ERROR:', error)
            toast.error('Unable to update quantity.')
        }
    }

    // CHECK WISHLIST
    const isInWishlist = productId => {
        return wishlistItems.some(item => {
            const id = item.product?._id || item.product

            return String(id) === String(productId)
        })
    }

    // ADD / REMOVE WISHLIST
    const handleWishlist = async productId => {
        try {
            const wishlistItem = wishlistItems.find(item => {
                const id = item.product?._id || item.product

                return String(id) === String(productId)
            })

            if (wishlistItem) {
                await removeFromWishlist(wishlistItem._id)
                toast.success('Removed from wishlist')
            } else {
                await addToWishlist(productId)
                toast.success('Added to wishlist')
            }
        } catch (error) {
            console.log('WISHLIST ERROR:', error)
            toast.error('Unable to update wishlist.')
        }
    }

    // LOADING
    if (loading) {
        return (
            <p className="p-8 text-center">
                Loading category...
            </p>
        )
    }

    // API ERROR
    if (errorMessage) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-600">
                    {errorMessage}
                </p>

                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 rounded-lg bg-purple-600 px-5 py-2 text-white"
                >
                    Try Again
                </button>
            </div>
        )
    }

    // CATEGORY NOT FOUND
    if (!category) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold">
                    Category not found
                </h2>

                <Link
                    href="/"
                    className="mt-4 inline-block text-purple-600"
                >
                    Go to Home
                </Link>
            </div>
        )
    }

    // INVALID SUBCATEGORY
    if (subcategorySlug !== 'all' && !selectedSubcategory) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold">
                    Subcategory not found
                </h2>

                <button
                    onClick={() => handleSubcategoryChange('all')}
                    className="mt-4 rounded-lg bg-purple-600 px-5 py-2 text-white"
                >
                    View All Products
                </button>
            </div>
        )
    }

    // PREPARE DISPLAY CARDS
    const displayCards = subcategorySlug === 'all'
        ? filteredProducts.map(product => ({
            type: 'product',
            product,
            variant: getDefaultVariant(product._id)
        }))
        : filteredProducts.flatMap(product =>
            getProductVariants(product._id).map(variant => ({
                type: 'variant',
                product,
                variant
            }))
        )

    return (
        <main className="min-h-screen bg-purple-50 px-4 py-8 md:px-10">
            <div className="mx-auto max-w-7xl">

                {/* CATEGORY TITLE */}
                <h1 className="text-3xl font-bold text-gray-900">
                    {category.name}
                </h1>

                <p className="mt-2 text-gray-600">
                    Explore products by category
                </p>

                {/* SUBCATEGORY FILTER */}
                <div className="mt-8">
                    <h2 className="mb-4 text-xl font-semibold text-gray-900">
                        Shop by Subcategory
                    </h2>

                    <div className="flex gap-5 overflow-x-auto pb-4">

                        {/* ALL */}
                        <button
                            onClick={() => handleSubcategoryChange('all')}
                            className="flex shrink-0 flex-col items-center"
                        >
                            <div
                                className={`h-24 w-24 rounded-full border-2 p-1 transition ${
                                    subcategorySlug === 'all'
                                        ? 'border-purple-600 bg-purple-100'
                                        : 'border-transparent bg-white'
                                }`}
                            >
                                <div className="flex h-full items-center justify-center rounded-full bg-purple-100 text-3xl">
                                    🛍️
                                </div>
                            </div>

                            <span className="mt-1 text-sm font-medium text-gray-700">
                                All
                            </span>
                        </button>

                        {/* SUBCATEGORIES */}
                        {subcategories.map(item => (
                            <button
                                key={item._id}
                                onClick={() => handleSubcategoryChange(item.slug)}
                                className="flex shrink-0 flex-col items-center"
                            >
                                <div
                                    className={`h-24 w-24 rounded-full border-2 p-1 transition ${
                                        subcategorySlug === item.slug
                                            ? 'border-purple-600 bg-purple-100'
                                            : 'border-transparent bg-white'
                                    }`}
                                >
                                    <img
                                        src={item.image || '/placeholder.png'}
                                        alt={item.name}
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                </div>

                                <span className="mt-1 text-sm font-medium text-gray-700">
                                    {item.name}
                                </span>
                            </button>
                        ))}

                    </div>
                </div>

                {/* PRODUCTS / VARIANTS */}
                <section className="mt-8">

                    <h2 className="mb-5 text-2xl font-bold text-gray-900">
                        {subcategorySlug === 'all'
                            ? `All ${category.name} Products`
                            : `${selectedSubcategory.name} Products`}
                    </h2>

                    {displayCards.length === 0 ? (
                        <div className="rounded-xl bg-white p-8 text-center text-gray-600 shadow-sm">
                            No products or variants available.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

                            {displayCards.map(card => {
                                const product = card.product
                                const variant = card.variant

                                // CART ITEM
                                const cartItem = variant
                                    ? getCartItem(product._id, variant._id)
                                    : null

                                // VARIANT IMAGE
                                const image =
                                    variant?.images?.[0] ||
                                    product.image ||
                                    '/placeholder.png'

                                // PRICE
                                const sellingPrice = variant
                                    ? Number(variant.sellingPrice)
                                    : null

                                const mrp = variant
                                    ? Number(variant.mrp)
                                    : null

                                const discount = mrp > 0 && sellingPrice < mrp
                                    ? Math.round(
                                        ((mrp - sellingPrice) / mrp) * 100
                                    )
                                    : 0

                                return (
                                    <div
                                        key={
                                            card.type === 'product'
                                                ? product._id
                                                : variant._id
                                        }
                                        className="relative rounded-2xl border border-purple-100 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                    >

                                        {/* WISHLIST */}
                                        <button
                                            onClick={() => handleWishlist(product._id)}
                                            className="absolute right-3 top-3 z-10 rounded-full bg-white px-2 py-1 text-xl shadow"
                                        >
                                            {isInWishlist(product._id) ? '❤️' : '♡'}
                                        </button>

                                        {/* DISCOUNT */}
                                        {card.type === 'variant' && discount > 0 && (
                                            <span className="absolute left-3 top-3 rounded bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                                                {discount}% OFF
                                            </span>
                                        )}

                                        {/* PRODUCT IMAGE AND NAME */}
                                        <Link href={`/product/${product._id}`}>
                                            <img
                                                src={image}
                                                alt={product.name}
                                                className="h-36 w-full rounded-xl object-contain"
                                            />

                                            <h3 className="mt-3 line-clamp-2 font-semibold text-gray-800">
                                                {product.name}
                                            </h3>
                                        </Link>

                                        {/* ALL PRODUCTS VIEW */}
                                        {card.type === 'product' && (
                                            <>
                                                {variant ? (
                                                    <div className="mt-2">
                                                        <p className="font-bold text-gray-900">
                                                            Starting ₹{sellingPrice}
                                                        </p>

                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {variant.name}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="mt-2 text-sm text-gray-500">
                                                        Currently unavailable
                                                    </p>
                                                )}

                                                {/* ADD TO CART */}
                                                <div className="mt-3">
                                                    {!variant ? (
                                                        <button
                                                            disabled
                                                            className="w-full cursor-not-allowed rounded-lg bg-gray-300 py-2 text-sm font-semibold text-gray-500"
                                                        >
                                                            OUT OF STOCK
                                                        </button>
                                                    ) : cartItem ? (
                                                        <div className="flex items-center justify-between rounded-lg bg-purple-600 px-3 py-2 text-white">
                                                            <button
                                                                onClick={() => handleDecrease(cartItem)}
                                                            >
                                                                −
                                                            </button>

                                                            <span className="font-semibold">
                                                                {cartItem.quantity}
                                                            </span>

                                                            <button
                                                                onClick={() => handleIncrease(cartItem)}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                handleAddToCart(product._id, variant._id)
                                                            }
                                                            className="w-full rounded-lg border border-purple-600 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-600 hover:text-white"
                                                        >
                                                            ADD TO CART
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {/* SUBCATEGORY VARIANT VIEW */}
                                        {card.type === 'variant' && (
                                            <>
                                                <p className="mt-1 text-sm text-gray-600">
                                                    {variant.name}
                                                </p>

                                                <p className="text-xs text-gray-500">
                                                    {variant.unitValue} {variant.unit}
                                                </p>

                                                {/* PRICE */}
                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    <span className="font-bold text-gray-900">
                                                        ₹{sellingPrice}
                                                    </span>

                                                    {mrp > sellingPrice && (
                                                        <span className="text-sm text-gray-400 line-through">
                                                            ₹{mrp}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* CART */}
                                                <div className="mt-3">
                                                    {cartItem ? (
                                                        <div className="flex items-center justify-between rounded-lg bg-purple-600 px-3 py-2 text-white">
                                                            <button
                                                                onClick={() => handleDecrease(cartItem)}
                                                            >
                                                                −
                                                            </button>

                                                            <span className="font-semibold">
                                                                {cartItem.quantity}
                                                            </span>

                                                            <button
                                                                onClick={() => handleIncrease(cartItem)}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                handleAddToCart(product._id, variant._id)
                                                            }
                                                            className="w-full rounded-lg border border-purple-600 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-600 hover:text-white"
                                                        >
                                                            ADD TO CART
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleBuyNow(product, variant)}
                                                        className="mt-2 w-full rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                                                    >
                                                        BUY NOW
                                                    </button>
                                                </div>
                                            </>
                                        )}

                                    </div>
                                )
                            })}

                        </div>
                    )}

                </section>
            </div>
        </main>
    )
}
