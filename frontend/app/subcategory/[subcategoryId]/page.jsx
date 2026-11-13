
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { useCart } from '@/context/CartContext'
import { useLocationContext } from '@/context/LocationContext'
import { toast } from 'react-hot-toast'

const API = 'http://localhost:8000'
const LIMIT = 10

export default function SubcategoryPage() {

    const { subcategoryId } = useParams()
    const router = useRouter()

    const { selectedStore, locationLoading } = useLocationContext()
    const storeId = selectedStore?._id

    const [products, setProducts] = useState([])
    const [subcategory, setSubcategory] = useState(null)
    const [productsWithVariants, setProductsWithVariants] = useState([])
    const [productPrices, setProductPrices] = useState({})

    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    const [addingProduct, setAddingProduct] = useState(null)
    const [updatingItem, setUpdatingItem] = useState(null)
    const [wishlistLoading, setWishlistLoading] = useState(null)

    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [order, setOrder] = useState('desc')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState(null)

    const {
        cartItems = [],
        addToCart: addCartItem,
        updateCartItem,
        removeCartItem,
        wishlistItems = [],
        addToWishlist,
        removeFromWishlist
    } = useCart()

    // DEBOUNCE SEARCH
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim())
        }, 500)

        return () => clearTimeout(timer)
    }, [search])

    // GET SUBCATEGORY
    useEffect(() => {

        let isMounted = true

        const getSubcategory = async () => {

            if (locationLoading) return

            if (!storeId) {
                setSubcategory(null)
                setErrorMessage('Please select your location first.')
                return
            }

            try {

                setErrorMessage('')

                const response = await axios.get(
                    `${API}/subcategory/public`,
                    { params: { storeId } }
                )

                if (!isMounted) return

                const allSubcategories =
                    response.data?.data?.subcategories ||
                    response.data?.subcategories ||
                    response.data?.data ||
                    []

                const selectedSubcategory = allSubcategories.find(
                    item => String(item._id) === String(subcategoryId)
                )

                setSubcategory(selectedSubcategory || null)

                if (!selectedSubcategory) {
                    setErrorMessage('Subcategory not found.')
                }

            } catch (error) {

                if (isMounted) {
                    setSubcategory(null)
                    setErrorMessage(
                        error.response?.data?.message ||
                        'Unable to load subcategory.'
                    )
                }
            }
        }

        if (subcategoryId) {
            getSubcategory()
        }

        return () => {
            isMounted = false
        }

    }, [subcategoryId, storeId, locationLoading])

    // GET PRODUCTS WITH BACKEND SEARCH, SORT AND PAGINATION
    useEffect(() => {

        const controller = new AbortController()

        const getProducts = async () => {

            if (locationLoading) return

            if (!storeId || !subcategoryId) {
                setProducts([])
                setPagination(null)
                setLoading(false)
                return
            }

            try {

                setLoading(true)

                const [productRes, variantRes] = await Promise.all([

                    axios.get(`${API}/product/public`, {
                        params: {
                            storeId,
                            subCategoryId: subcategoryId,
                            page,
                            limit: LIMIT,
                            search: debouncedSearch,
                            sortBy,
                            order
                        },
                        signal: controller.signal
                    }),

                    axios.get(`${API}/productvariant/public`, {
                        signal: controller.signal
                    })

                ])

                const allProducts =
                    productRes.data?.data?.products ||
                    productRes.data?.products ||
                    productRes.data?.data ||
                    []

                const allVariants =
                    variantRes.data?.data?.variants ||
                    variantRes.data?.variants ||
                    variantRes.data?.data ||
                    []

                if (!Array.isArray(allProducts)) {
                    throw new Error('Invalid product API response')
                }

                const currentProductIds = allProducts.map(
                    item => String(item._id)
                )

                const availableVariants = Array.isArray(allVariants)
                    ? allVariants.filter(variant => {

                        const productId = String(
                            variant.product?._id || variant.product
                        )

                        return (
                            currentProductIds.includes(productId) &&
                            variant.status === 'active' &&
                            Number(variant.availableQuantity) > 0
                        )
                    })
                    : []

                const variantProductIds = [
                    ...new Set(
                        availableVariants.map(variant =>
                            String(variant.product?._id || variant.product)
                        )
                    )
                ]

                const prices = {}

                availableVariants.forEach(variant => {

                    const productId = String(
                        variant.product?._id || variant.product
                    )

                    const price = Number(variant.sellingPrice)

                    if (!Number.isFinite(price) || price <= 0) return

                    if (
                        prices[productId] === undefined ||
                        price < prices[productId]
                    ) {
                        prices[productId] = price
                    }
                })

                if (!controller.signal.aborted) {

                    setProducts(allProducts)
                    setProductsWithVariants(variantProductIds)
                    setProductPrices(prices)
                    setPagination(productRes.data?.pagination || null)
                    setErrorMessage('')
                }

            } catch (error) {

                if (
                    error.code === 'ERR_CANCELED' ||
                    error.name === 'CanceledError'
                ) {
                    return
                }

                console.log(
                    'SUBCATEGORY PRODUCT ERROR:',
                    error.response?.data || error.message
                )

                setProducts([])
                setProductsWithVariants([])
                setProductPrices({})
                setPagination(null)

                setErrorMessage(
                    error.response?.data?.message ||
                    error.message ||
                    'Unable to load products.'
                )

            } finally {

                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }

        getProducts()

        return () => controller.abort()

    }, [
        subcategoryId,
        storeId,
        locationLoading,
        page,
        debouncedSearch,
        sortBy,
        order
    ])

    // SEARCH HANDLER
    const handleSearch = value => {
        setSearch(value)
        setPage(1)
    }

    // SORT HANDLER
    const handleSort = value => {

        const [field, direction] = value.split('-')

        setSortBy(field)
        setOrder(direction)
        setPage(1)
    }

    // PAGINATION
    const changePage = newPage => {

        const totalPages = pagination?.totalPages || 1

        if (
            newPage < 1 ||
            newPage > totalPages ||
            newPage === page
        ) {
            return
        }

        setPage(newPage)

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    // PRODUCT URL
    const getProductUrl = item => `/product/${item._id}`

    // FIND CART ITEM
    const getCartItem = productId => {

        return cartItems.find(cartItem => {

            const id =
                typeof cartItem.product === 'object'
                    ? cartItem.product?._id
                    : cartItem.product

            const variantId =
                typeof cartItem.variant === 'object'
                    ? cartItem.variant?._id
                    : cartItem.variant

            return (
                String(id) === String(productId) &&
                !variantId
            )
        })
    }

    // FIND WISHLIST ITEM
    const getWishlistItem = productId => {

        return wishlistItems.find(item => {

            const id =
                typeof item.product === 'object'
                    ? item.product?._id
                    : item.product

            return String(id) === String(productId)
        })
    }

    // ADD TO CART
    const addToCart = async productId => {

        try {

            setAddingProduct(productId)
            await addCartItem(productId, 1, null)

        } catch (error) {

            console.log(
                'ADD TO CART ERROR:',
                error.response?.data || error.message
            )

            toast.error(
                error.response?.data?.message ||
                'Unable to add product to cart.'
            )

        } finally {
            setAddingProduct(null)
        }
    }

    // UPDATE CART QUANTITY
    const updateQuantity = async (cartItem, newQuantity) => {

        if (!cartItem?._id) return

        try {

            setUpdatingItem(cartItem._id)

            if (newQuantity <= 0) {
                await removeCartItem(cartItem._id)
            } else {
                await updateCartItem(cartItem._id, newQuantity)
            }

        } catch (error) {

            console.log(
                'UPDATE CART ERROR:',
                error.response?.data || error.message
            )

            toast.error(
                error.response?.data?.message ||
                'Unable to update cart quantity.'
            )

        } finally {
            setUpdatingItem(null)
        }
    }

    // TOGGLE WISHLIST
    const toggleWishlist = async productId => {

        try {

            setWishlistLoading(productId)

            const wishlistItem = getWishlistItem(productId)

            if (wishlistItem) {
                await removeFromWishlist(wishlistItem._id)
            } else {
                await addToWishlist(productId)
            }

        } catch (error) {

            console.log(
                'WISHLIST ERROR:',
                error.response?.data || error.message
            )

            toast.error(
                error.response?.data?.message ||
                'Unable to update wishlist.'
            )

        } finally {
            setWishlistLoading(null)
        }
    }

    // INITIAL LOADING
    if (locationLoading || (loading && !subcategory)) {

        return (
            <main className="flex min-h-[70vh] items-center justify-center bg-[#faf9fd] px-4">
                <div className="text-center">
                    <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600" />
                    <h2 className="text-lg font-bold text-gray-800">
                        Loading products...
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Please wait a moment
                    </p>
                </div>
            </main>
        )
    }

    // SUBCATEGORY NOT FOUND
    if (!subcategory) {

        return (
            <main className="flex min-h-[70vh] items-center justify-center bg-[#faf9fd] px-4">
                <div className="w-full max-w-md rounded-2xl border border-purple-100 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-3xl">
                        🛍️
                    </div>

                    <h2 className="text-xl font-bold text-gray-900">
                        Collection Not Found
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        {errorMessage || 'This subcategory is currently unavailable.'}
                    </p>

                    <button
                        onClick={() => router.back()}
                        className="mt-6 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-purple-700"
                    >
                        ← Go Back
                    </button>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#faf9fd] px-3 py-6 sm:px-6 sm:py-9 lg:px-8">

            <div className="mx-auto max-w-7xl">

                {/* BREADCRUMB */}
                <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500 sm:text-sm">
                    <Link href="/" className="transition hover:text-purple-700">
                        Home
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-purple-700">
                        {subcategory.name}
                    </span>
                </div>

                {/* PAGE HEADING - NO BANNER */}
                <div className="mb-6 flex flex-col gap-4 border-b border-purple-100 pb-6 sm:flex-row sm:items-end sm:justify-between">

                    <div>
                        <p className="text-xs font-bold uppercase tracking-[2px] text-purple-600">
                            Explore Collection
                        </p>

                        <h1 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                            {subcategory.name}
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                            {subcategory.description ||
                                'Explore products from this collection and find your favourites.'}
                        </p>
                    </div>

                    <button
                        onClick={() => router.back()}
                        className="inline-flex w-fit items-center gap-2 rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm font-semibold text-purple-700 shadow-sm transition hover:bg-purple-50"
                    >
                        ← Back
                    </button>

                </div>

                {/* SEARCH AND SORT */}
                <section className="mb-7 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm sm:p-5">

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                        <div>
                            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                                Explore Products
                            </h2>

                            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                                Find your favourite products from this collection
                            </p>
                        </div>

                        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:max-w-2xl">

                            {/* SEARCH */}
                            <div className="relative">

                                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-purple-500">
                                    ⌕
                                </span>

                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => handleSearch(e.target.value)}
                                    placeholder="Search products, brands..."
                                    autoComplete="off"
                                    className="w-full rounded-xl border border-gray-200 bg-[#faf9fd] py-3 pl-10 pr-10 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-50"
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => handleSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-purple-100 hover:text-purple-700"
                                    >
                                        ✕
                                    </button>
                                )}

                            </div>

                            {/* SORT */}
                            <select
                                value={`${sortBy}-${order}`}
                                onChange={e => handleSort(e.target.value)}
                                className="w-full cursor-pointer rounded-xl border border-gray-200 bg-[#faf9fd] px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-50"
                            >
                                <option value="createdAt-desc">Newest First</option>
                                <option value="createdAt-asc">Oldest First</option>
                                <option value="name-asc">Name A-Z</option>
                                <option value="name-desc">Name Z-A</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                            </select>

                        </div>
                    </div>
                </section>

                {/* PRODUCT COUNT */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

                    <div>
                        <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                            {subcategory.name} Products
                        </h2>

                        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                            Showing {products.length} products
                            {pagination?.totalProducts !== undefined &&
                                ` of ${pagination.totalProducts}`}
                        </p>
                    </div>

                    <div className="rounded-full border border-purple-100 bg-white px-4 py-2 text-xs font-semibold text-purple-700 shadow-sm sm:text-sm">
                        Page {pagination?.currentPage || page} of {pagination?.totalPages || 1}
                    </div>

                </div>

                {/* LOADING INDICATOR */}
                {loading && (
                    <div className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-purple-100 bg-white py-3 text-sm font-medium text-purple-700">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
                        Updating products...
                    </div>
                )}

                {/* PRODUCT ERROR */}
                {errorMessage && (
                    <p className="mb-5 rounded-xl border border-red-100 bg-red-50 p-3 text-center text-sm text-red-600">
                        {errorMessage}
                    </p>
                )}

                {/* PRODUCTS */}
                {products.length === 0 ? (

                    <div className="rounded-2xl border border-purple-100 bg-white px-5 py-14 text-center shadow-sm sm:py-20">

                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-3xl">
                            🛒
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                            {search
                                ? `No products found for "${search}"`
                                : 'No Products Available'}
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                            {search
                                ? 'Try searching with another product name or brand.'
                                : 'There are currently no products available in this collection. Please check back later.'}
                        </p>

                        {search && (
                            <button
                                onClick={() => handleSearch('')}
                                className="mt-6 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-purple-700"
                            >
                                Clear Search
                            </button>
                        )}

                    </div>

                ) : (

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">

                        {products.map(item => {

                            const hasVariants =
                                productsWithVariants.includes(String(item._id))

                            const cartItem = hasVariants
                                ? null
                                : getCartItem(item._id)

                            const quantity = Number(cartItem?.quantity || 0)

                            const isUpdating =
                                updatingItem === cartItem?._id

                            const wishlistItem = getWishlistItem(item._id)
                            const isWishlisted = Boolean(wishlistItem)

                            const displayPrice = hasVariants
                                ? productPrices[String(item._id)]
                                : item.price

                            return (
                                <div
                                    key={item._id}
                                    className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-100 sm:rounded-3xl sm:p-3.5"
                                >

                                    {/* IMAGE - UNCHANGED */}
                                    <div className="relative overflow-hidden rounded-xl bg-[#faf8ff] sm:rounded-2xl">

                                        <Link href={getProductUrl(item)} className="block">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    loading="lazy"
                                                    className="h-32 w-full object-contain p-2 transition duration-500 group-hover:scale-110 sm:h-40 md:h-44 lg:h-40"
                                                />
                                            ) : (
                                                <div className="flex h-32 items-center justify-center text-3xl text-purple-200 sm:h-40 md:h-44 lg:h-40">
                                                    🛍️
                                                </div>
                                            )}
                                        </Link>

                                        {/* WISHLIST */}
                                        <button
                                            type="button"
                                            onClick={() => toggleWishlist(item._id)}
                                            disabled={wishlistLoading === item._id}
                                            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-purple-50 bg-white/95 text-xl shadow-sm transition hover:scale-110 hover:bg-pink-50 disabled:opacity-50 sm:h-9 sm:w-9"
                                        >
                                            <span className={isWishlisted ? 'text-pink-600' : 'text-gray-500'}>
                                                {isWishlisted ? '♥' : '♡'}
                                            </span>
                                        </button>

                                        {/* STOCK BADGE */}
                                        <span className={`absolute bottom-2 left-2 rounded-full px-2 py-1 text-[9px] font-bold sm:text-[10px] ${
                                            hasVariants
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-50 text-red-600'
                                        }`}>
                                            {hasVariants ? 'IN STOCK' : 'UNAVAILABLE'}
                                        </span>
                                    </div>

                                    {/* DETAILS */}
                                    <div className="flex flex-1 flex-col">

                                        <Link href={getProductUrl(item)}>
                                            <h2 className="mt-3 line-clamp-2 min-h-[40px] text-xs font-bold leading-5 text-gray-800 transition group-hover:text-purple-700 sm:text-sm">
                                                {item.name}
                                            </h2>

                                            <p className="mt-2 text-base font-extrabold text-purple-700 sm:text-lg">
                                                {displayPrice !== undefined && displayPrice !== null
                                                    ? `₹${displayPrice}`
                                                    : 'Price unavailable'}
                                            </p>
                                        </Link>

                                        {/* CART BUTTONS */}
                                        <div className="mt-auto pt-3">

                                            {hasVariants ? (

                                                <button
                                                    type="button"
                                                    onClick={() => router.push(getProductUrl(item))}
                                                    className="w-full rounded-xl border border-purple-600 bg-white px-1.5 py-2.5 text-[10px] font-extrabold tracking-wide text-purple-700 transition hover:bg-purple-600 hover:text-white sm:text-xs"
                                                >
                                                    CHOOSE VARIANT
                                                </button>

                                            ) : quantity === 0 ? (

                                                <button
                                                    type="button"
                                                    disabled
                                                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-1.5 py-2.5 text-[10px] font-bold text-gray-400 sm:text-xs"
                                                >
                                                    OUT OF STOCK
                                                </button>

                                            ) : (

                                                <div className="flex w-full items-center justify-between rounded-xl bg-purple-600 p-1 text-white">

                                                    <button
                                                        type="button"
                                                        disabled={isUpdating}
                                                        onClick={() => updateQuantity(cartItem, quantity - 1)}
                                                        className="h-8 w-8 rounded-lg text-xl font-bold transition hover:bg-purple-700 disabled:opacity-50"
                                                    >
                                                        −
                                                    </button>

                                                    <span className="min-w-6 text-center text-sm font-bold">
                                                        {quantity}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        disabled={isUpdating}
                                                        onClick={() => updateQuantity(cartItem, quantity + 1)}
                                                        className="h-8 w-8 rounded-lg text-xl font-bold transition hover:bg-purple-700 disabled:opacity-50"
                                                    >
                                                        +
                                                    </button>

                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* PAGINATION */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:mt-12">

                        <button
                            type="button"
                            disabled={!pagination.hasPrevPage || loading}
                            onClick={() => changePage(page - 1)}
                            className="rounded-xl border border-purple-200 bg-white px-3 py-2.5 text-xs font-bold text-purple-700 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:text-sm"
                        >
                            ← Previous
                        </button>

                        {Array.from(
                            { length: pagination.totalPages },
                            (_, index) => index + 1
                        ).map(pageNumber => (
                            <button
                                key={pageNumber}
                                type="button"
                                disabled={loading}
                                onClick={() => changePage(pageNumber)}
                                className={`h-10 min-w-10 rounded-xl px-3 text-xs font-bold transition sm:text-sm ${
                                    page === pageNumber
                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                                        : 'border border-purple-200 bg-white text-purple-700 hover:border-purple-400 hover:bg-purple-50'
                                }`}
                            >
                                {pageNumber}
                            </button>
                        ))}

                        <button
                            type="button"
                            disabled={!pagination.hasNextPage || loading}
                            onClick={() => changePage(page + 1)}
                            className="rounded-xl border border-purple-200 bg-white px-3 py-2.5 text-xs font-bold text-purple-700 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:text-sm"
                        >
                            Next →
                        </button>
                    </div>
                )}

                {/* BOTTOM BRANDING */}
                <div className="mt-12 border-t border-purple-100 pt-6 text-center">
                    <p className="text-xs font-bold tracking-[3px] text-purple-600">
                        SHOP • SELL • GROW
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                        Discover more with Sellora
                    </p>
                </div>

            </div>
        </main>
    )
}
