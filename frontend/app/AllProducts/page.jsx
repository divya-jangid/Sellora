
'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useLocationContext } from '@/context/LocationContext'
import { toast } from 'react-hot-toast'

const API = 'http://localhost:8000/product/public'

const ProductsPage = () => {

    const router = useRouter()

    const { selectedStore, locationLoading } = useLocationContext()

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

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState(null)

    // SEARCH AND SORTING
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [order, setOrder] = useState('desc')

    const [addingProduct, setAddingProduct] = useState(null)
    const [updatingItem, setUpdatingItem] = useState(null)
    const [wishlistAction, setWishlistAction] = useState(null)

    const limit = 10

    // GET ALL PRODUCTS
    const getProducts = useCallback(async () => {

        if (locationLoading) return

        if (!selectedStore?._id) {
            setProducts([])
            setPagination(null)
            setLoading(false)
            return
        }

        try {

            setLoading(true)

            const res = await axios.get(API, {
                params: {
                    storeId: selectedStore._id,
                    page,
                    limit,
                    search: search.trim(),
                    sortBy,
                    order
                },
                headers: {
                    'Cache-Control': 'no-cache'
                }
            })

            setProducts(res.data?.data || [])
            setPagination(res.data?.pagination || null)

        } catch (error) {

            console.log(
                'GET PRODUCTS ERROR:',
                error.response?.data || error.message
            )

            setProducts([])
            setPagination(null)

            toast.error(
                error.response?.data?.message ||
                'Unable to fetch products.'
            )

        } finally {
            setLoading(false)
        }

    }, [
        selectedStore?._id,
        locationLoading,
        page,
        search,
        sortBy,
        order
    ])

    useEffect(() => {
        getProducts()
    }, [getProducts])

    // FIND WISHLIST ITEM
    const getWishlistItem = (productId) => {

        return wishlistItems.find((item) => {

            const id =
                typeof item.product === 'object'
                    ? item.product?._id
                    : item.product

            return String(id) === String(productId)
        })
    }

    // TOGGLE WISHLIST
    const toggleWishlist = async (productId) => {

        if (!productId) return

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
                    'Unable to update wishlist.'
                )
            }

        } finally {
            setWishlistAction(null)
        }
    }

    // FIND CART ITEM
    const getCartItem = (variantId) => {

        return cartItems.find((item) => {

            const id =
                typeof item.variant === 'object'
                    ? item.variant?._id
                    : item.variant

            return String(id) === String(variantId)
        })
    }

    // ADD TO CART
    const addToCart = async (product, variant) => {

        try {

            setAddingProduct(variant._id)

            await addProductToCart(
                product._id,
                1,
                variant._id
            )

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
                    error.message ||
                    'Unable to add product to cart.'
                )
            }

        } finally {
            setAddingProduct(null)
        }
    }

    // UPDATE CART QUANTITY
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

    // BUY NOW
    const handleBuyNow = (product, variant) => {

        try {

            const buyNowData = {
                productId: product._id,
                variantId: variant._id,
                product,
                variant: {
                    _id: variant._id,
                    name: variant.name,
                    sellingPrice: variant.sellingPrice,
                    mrp: variant.mrp
                },
                quantity: 1
            }

            sessionStorage.setItem(
                'buyNowProduct',
                JSON.stringify(buyNowData)
            )

            router.push(
                `/checkout?mode=buy-now&t=${Date.now()}`
            )

        } catch (error) {

            console.log('BUY NOW ERROR:', error)
            toast.error('Unable to proceed to checkout.')
        }
    }

    // PAGE CHANGE
    const changePage = (newPage) => {

        if (
            newPage < 1 ||
            (pagination && newPage > pagination.totalPages)
        ) {
            return
        }

        setPage(newPage)

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    // SEARCH CHANGE
    const handleSearch = (value) => {
        setSearch(value)
        setPage(1)
    }

    // SORT CHANGE
    const handleSort = (value) => {

        const [field, direction] = value.split('-')

        setSortBy(field)
        setOrder(direction)
        setPage(1)
    }

    return (

        <main className="min-h-screen bg-purple-50 px-4 py-8 sm:px-8">

            <div className="mx-auto max-w-7xl">

                {/* PAGE HEADING */}
                <div className="mb-8">

                    <p className="mb-2 text-sm font-semibold text-purple-600">
                        FRESH FINDS FOR YOU
                    </p>

                    <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                        All Products
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Explore all available products at your selected store.
                    </p>

                </div>

                {/* LOCATION LOADING */}
                {locationLoading ? (

                    <div className="py-16 text-center text-gray-500">
                        Loading your location...
                    </div>

                ) : !selectedStore?._id ? (

                    <div className="rounded-2xl bg-white px-5 py-16 text-center shadow-sm">

                        <h2 className="text-lg font-semibold text-gray-800">
                            Please select your location
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                            Select your store to see available products.
                        </p>

                    </div>

                ) : (

                    <>

                        {/* SEARCH AND SORTING */}
                        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

                            {/* SEARCH */}
                            <div className="relative">

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search products, brands, categories..."
                                    className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 pr-10 text-sm text-gray-800 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                />

                                {search && (

                                    <button
                                        type="button"
                                        onClick={() => handleSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-700"
                                    >
                                        ✕
                                    </button>

                                )}

                            </div>

                            {/* SORTING */}
                            <select
                                value={`${sortBy}-${order}`}
                                onChange={(e) => handleSort(e.target.value)}
                                className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                            >

                                <option value="createdAt-desc">
                                    Newest First
                                </option>

                                <option value="createdAt-asc">
                                    Oldest First
                                </option>

                                <option value="name-asc">
                                    Name A-Z
                                </option>

                                <option value="name-desc">
                                    Name Z-A
                                </option>

                                <option value="price-asc">
                                    Price: Low to High
                                </option>

                                <option value="price-desc">
                                    Price: High to Low
                                </option>

                            </select>

                        </div>

                        {loading ? (

                            <div className="py-16 text-center text-purple-700">
                                Loading products...
                            </div>

                        ) : products.length === 0 ? (

                            <div className="rounded-2xl bg-white px-5 py-16 text-center shadow-sm">

                                <h2 className="text-lg font-semibold text-gray-800">
                                    {search
                                        ? `No products found for "${search}"`
                                        : 'No products available'
                                    }
                                </h2>

                                <p className="mt-2 text-sm text-gray-500">
                                    {search
                                        ? 'Try searching with another product name.'
                                        : 'Products will appear here when available in your store.'
                                    }
                                </p>

                                {search && (

                                    <button
                                        type="button"
                                        onClick={() => handleSearch('')}
                                        className="mt-4 rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                                    >
                                        Clear Search
                                    </button>

                                )}

                            </div>

                        ) : (

                            <>

                                {/* PRODUCT COUNT */}
                                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">

                                    <p className="text-sm text-gray-600">
                                        Showing {products.length} products
                                        {pagination && ` of ${pagination.totalProducts}`}
                                    </p>

                                    <p className="text-sm text-purple-700">
                                        Page {pagination?.currentPage || page}
                                        {' '}of{' '}
                                        {pagination?.totalPages || 1}
                                    </p>

                                </div>

                                {/* PRODUCT GRID */}
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

                                    {products.map((product) => {

                                        const variants = (product.variants || []).filter(
                                            variant => variant.status === 'active'
                                        )

                                        const variant = variants[0]

                                        if (!variant) return null

                                        const cartItem = getCartItem(variant._id)

                                        const quantity = Number(
                                            cartItem?.quantity || 0
                                        )

                                        const productId = product._id

                                        const image = Array.isArray(variant.images)
                                            ? variant.images[0]
                                            : variant.images

                                        const isWishlisted = Boolean(
                                            getWishlistItem(productId)
                                        )

                                        const isAdding =
                                            addingProduct === variant._id

                                        const isUpdating =
                                            updatingItem === cartItem?._id

                                        return (

                                            <div
                                                key={product._id}
                                                className="group overflow-hidden rounded-2xl border border-purple-100 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                                            >

                                                {/* IMAGE */}
                                                <div className="relative">

                                                    <Link href={`/product/${product.slug}`}>

                                                        <div className="flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-purple-50 sm:h-44">

                                                            {image ? (

                                                                <img
                                                                    src={image}
                                                                    alt={product.name}
                                                                    className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105"
                                                                />

                                                            ) : (

                                                                <p className="text-sm text-gray-400">
                                                                    No image
                                                                </p>

                                                            )}

                                                        </div>

                                                    </Link>

                                                    {/* WISHLIST */}
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            wishlistAction === productId ||
                                                            wishlistLoading
                                                        }
                                                        onClick={() => toggleWishlist(productId)}
                                                        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl shadow-md transition hover:scale-110 disabled:opacity-50"
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
                                                <Link href={`/product/${product.slug}`}>

                                                    <p className="mb-2 mt-3 line-clamp-2 min-h-10 text-sm font-semibold text-gray-800 hover:text-purple-700">
                                                        {product.name}
                                                    </p>

                                                    <p className="text-sm text-gray-500">
                                                        {product.brand?.name || 'Sellora'}
                                                    </p>

                                                    <p className="mt-1 text-sm text-gray-500">
                                                        {variant.name}
                                                    </p>

                                                    <div className="mb-3 mt-1 flex items-center gap-2">

                                                        <p className="text-base font-bold text-purple-800">
                                                            ₹{variant.sellingPrice}
                                                        </p>

                                                        {variant.mrp > variant.sellingPrice && (

                                                            <p className="text-xs text-gray-400 line-through">
                                                                ₹{variant.mrp}
                                                            </p>

                                                        )}

                                                    </div>

                                                </Link>

                                                {/* ADD TO CART */}
                                                {!cartItem ? (

                                                    <button
                                                        type="button"
                                                        disabled={isAdding}
                                                        onClick={() => addToCart(product, variant)}
                                                        className="w-full rounded-lg border border-purple-600 px-2 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-600 hover:text-white disabled:opacity-50"
                                                    >
                                                        {isAdding ? 'ADDING...' : 'ADD TO CART'}
                                                    </button>

                                                ) : (

                                                    <div className="flex w-full items-center justify-between rounded-lg bg-purple-600 p-1 text-white">

                                                        <button
                                                            type="button"
                                                            disabled={isUpdating}
                                                            onClick={() => updateQuantity(cartItem, quantity - 1)}
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
                                                            onClick={() => updateQuantity(cartItem, quantity + 1)}
                                                            className="h-8 w-8 rounded-md text-xl font-bold hover:bg-purple-700 disabled:opacity-50"
                                                        >
                                                            +
                                                        </button>

                                                    </div>

                                                )}

                                                {/* BUY NOW */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleBuyNow(product, variant)}
                                                    className="mt-2 w-full rounded-lg bg-purple-100 px-2 py-2 text-xs font-bold text-purple-700 transition hover:bg-purple-200"
                                                >
                                                    BUY NOW
                                                </button>

                                            </div>
                                        )
                                    })}

                                </div>

                                {/* PAGINATION */}
                                {pagination && pagination.totalPages > 1 && (

                                    <div className="mt-10 flex flex-wrap items-center justify-center gap-2">

                                        <button
                                            type="button"
                                            disabled={!pagination.hasPrevPage || loading}
                                            onClick={() => changePage(page - 1)}
                                            className="rounded-lg border border-purple-300 bg-white px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Previous
                                        </button>

                                        {Array.from(
                                            { length: pagination.totalPages },
                                            (_, index) => index + 1
                                        ).map((pageNumber) => (

                                            <button
                                                key={pageNumber}
                                                type="button"
                                                disabled={loading}
                                                onClick={() => changePage(pageNumber)}
                                                className={`h-10 min-w-10 rounded-lg px-3 text-sm font-semibold ${
                                                    page === pageNumber
                                                        ? 'bg-purple-600 text-white'
                                                        : 'border border-purple-300 bg-white text-purple-700 hover:bg-purple-100'
                                                }`}
                                            >
                                                {pageNumber}
                                            </button>

                                        ))}

                                        <button
                                            type="button"
                                            disabled={!pagination.hasNextPage || loading}
                                            onClick={() => changePage(page + 1)}
                                            className="rounded-lg border border-purple-300 bg-white px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Next
                                        </button>

                                    </div>

                                )}

                            </>

                        )}

                    </>

                )}

            </div>

        </main>
    )
}

export default ProductsPage
