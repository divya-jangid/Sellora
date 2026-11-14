
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
    const [productVariantIds, setProductVariantIds] = useState({})

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

    // GET PRODUCTS, VARIANTS AND STORE INVENTORY
    useEffect(() => {

        const controller = new AbortController()

        const getProducts = async () => {

            if (locationLoading) return

            if (!storeId || !subcategoryId) {
                setProducts([])
                setProductsWithVariants([])
                setProductPrices({})
                setProductVariantIds({})
                setPagination(null)
                setLoading(false)
                return
            }

            try {

                setLoading(true)

                const [productRes, variantRes, inventoryRes] = await Promise.all([

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
                    }),

                    axios.get(`${API}/inventory/public`, {
                        params: { storeId },
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

                const allInventory =
                    inventoryRes.data?.inventory || []

                if (!Array.isArray(allProducts)) {
                    throw new Error('Invalid product API response')
                }

                if (!Array.isArray(allVariants)) {
                    throw new Error('Invalid variant API response')
                }

                if (!Array.isArray(allInventory)) {
                    throw new Error('Invalid inventory API response')
                }

                // CURRENT PAGE PRODUCT IDS
                const currentProductIds = allProducts.map(
                    item => String(item._id)
                )

                // MATCH ACTIVE VARIANTS WITH SELECTED STORE INVENTORY
                const availableVariants = allVariants.filter(variant => {

                    const productId = String(
                        variant.product?._id || variant.product
                    )

                    const variantId = String(variant._id)

                    const inventoryItem = allInventory.find(inv => {

                        const inventoryVariantId = String(
                            inv.variant?._id || inv.variant
                        )

                        return (
                            inventoryVariantId === variantId &&
                            Number(inv.availableQuantity) > 0
                        )
                    })

                    return (
                        currentProductIds.includes(productId) &&
                        variant.status === 'active' &&
                        Boolean(inventoryItem)
                    )
                })

                // PRODUCTS HAVING AVAILABLE VARIANTS
                const variantProductIds = [
                    ...new Set(
                        availableVariants.map(variant =>
                            String(variant.product?._id || variant.product)
                        )
                    )
                ]

                // MINIMUM AVAILABLE VARIANT PRICE AND ID
                const prices = {}
                const variantIds = {}

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
                        variantIds[productId] = variant._id
                    }
                })

                if (!controller.signal.aborted) {

                    setProducts(allProducts)
                    setProductsWithVariants(variantProductIds)
                    setProductPrices(prices)
                    setProductVariantIds(variantIds)
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
                setProductVariantIds({})
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
    const getCartItem = (productId, variantId) => {

        return cartItems.find(cartItem => {

            const id =
                typeof cartItem.product === 'object'
                    ? cartItem.product?._id
                    : cartItem.product

            const cartVariantId =
                typeof cartItem.variant === 'object'
                    ? cartItem.variant?._id
                    : cartItem.variant

            return (
                String(id) === String(productId) &&
                String(cartVariantId) === String(variantId)
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
    const addToCart = async (productId, variantId) => {

        try {

            if (!variantId) {
                toast.error('Product variant not available.')
                return
            }

            setAddingProduct(productId)

            await addCartItem(productId, 1, variantId)

            toast.success('Product added to cart!')

        } catch (error) {

            console.log(
                'ADD CART ERROR:',
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
            <main className="flex min-h-[70vh] items-center justify-center bg-[#faf8ff] px-4">

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
            <main className="flex min-h-[70vh] items-center justify-center bg-[#faf8ff] px-4">

                <div className="w-full max-w-md rounded-3xl border border-purple-100 bg-white p-8 text-center shadow-sm">

                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 text-4xl">
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

        <main className="min-h-screen bg-[#faf8ff] px-3 py-5 sm:px-5 sm:py-7 md:px-8 md:py-9">

            <div className="mx-auto max-w-[1500px]">

                {/* BREADCRUMB */}
                <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500 sm:text-sm">

                    <Link
                        href="/"
                        className="transition hover:text-purple-700"
                    >
                        Home
                    </Link>

                    <span>/</span>

                    <span className="font-semibold text-purple-700">
                        {subcategory.name}
                    </span>

                </div>

                {/* PAGE HEADING */}
                <div className="mb-7 flex flex-col gap-4 border-b border-purple-100 pb-6 sm:flex-row sm:items-end sm:justify-between">

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

                {/* SIDEBAR + PRODUCTS */}
                <section>

                    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">

                        {/* LEFT SIDEBAR */}
                        <aside className="h-fit rounded-2xl border border-purple-100 bg-white p-4 shadow-md lg:sticky lg:top-[100px] lg:max-h-[calc(100vh-120px)] lg:self-start lg:overflow-y-auto">

                            <div className="mb-5 flex items-center justify-between">

                                <h3 className="text-base font-bold text-gray-900">
                                    Filters
                                </h3>

                                <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600">
                                    Products
                                </span>

                            </div>

                            {/* SEARCH */}
                            <div className="mb-5">

                                <h4 className="mb-3 text-sm font-bold text-gray-700">
                                    Search Products
                                </h4>

                                <div className="relative">

                                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-purple-500">
                                        ⌕
                                    </span>

                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => handleSearch(e.target.value)}
                                        placeholder="Search products..."
                                        autoComplete="off"
                                        className="w-full min-w-0 rounded-xl border border-purple-100 bg-[#faf8ff] py-3 pl-10 pr-9 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-50"
                                    />

                                    {search && (

                                        <button
                                            type="button"
                                            onClick={() => handleSearch('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-purple-100 hover:text-purple-700"
                                        >
                                            ✕
                                        </button>

                                    )}

                                </div>

                            </div>

                            <div className="mb-5 border-t border-purple-100"></div>

                            {/* SORTING */}
                            <div>

                                <h4 className="mb-3 text-sm font-bold text-gray-700">
                                    Sort By
                                </h4>

                                <div className="space-y-1">

                                    {[
                                        { label: 'Newest First', value: 'createdAt-desc' },
                                        { label: 'Oldest First', value: 'createdAt-asc' },
                                        { label: 'Name A-Z', value: 'name-asc' },
                                        { label: 'Name Z-A', value: 'name-desc' },
                                        { label: 'Price: Low to High', value: 'price-asc' },
                                        { label: 'Price: High to Low', value: 'price-desc' }
                                    ].map(item => (

                                        <label
                                            key={item.value}
                                            className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-gray-600 transition hover:bg-purple-50 hover:text-purple-700"
                                        >

                                            <input
                                                type="radio"
                                                name="productSorting"
                                                value={item.value}
                                                checked={`${sortBy}-${order}` === item.value}
                                                onChange={e => handleSort(e.target.value)}
                                                className="h-4 w-4 shrink-0 accent-purple-600"
                                            />

                                            <span>{item.label}</span>

                                        </label>

                                    ))}

                                </div>

                            </div>

                        </aside>

                        {/* RIGHT SIDE PRODUCTS */}
                        <div className="min-w-0">

                            {/* PRODUCT HEADING */}
                            <div className="mb-5">

                                <h2 className="text-xl font-extrabold text-gray-900 sm:text-2xl">
                                    {subcategory.name} Products
                                </h2>

                                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                                    Find your favourite products at great prices
                                </p>

                            </div>

                            {/* PRODUCT COUNT */}
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

                                <p className="text-xs text-gray-600 sm:text-sm">
                                    Showing <span className="font-bold text-gray-900">{products.length}</span> products
                                    {pagination?.totalProducts !== undefined &&
                                        ` of ${pagination.totalProducts}`}
                                </p>

                                <span className="rounded-full border border-purple-100 bg-white px-4 py-2 text-xs font-semibold text-purple-700 shadow-sm sm:text-sm">
                                    Page {pagination?.currentPage || page} of {pagination?.totalPages || 1}
                                </span>

                            </div>

                            {/* LOADING INDICATOR */}
                            {loading && (

                                <div className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-purple-50 py-3 text-sm font-medium text-purple-700">

                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600"></span>

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

                                <div className="rounded-3xl border border-purple-100 bg-white px-5 py-14 text-center shadow-sm sm:py-20">

                                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 text-4xl">
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
                                            : 'There are currently no products available in this collection.'}
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

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 xl:gap-5">

                                    {products.map(item => {

                                        const hasVariants =
                                            productsWithVariants.includes(String(item._id))

                                        const variantId =
                                            productVariantIds[String(item._id)]

                                        const cartItem = hasVariants
                                            ? getCartItem(item._id, variantId)
                                            : null

                                        const quantity = Number(cartItem?.quantity || 0)

                                        const isUpdating =
                                            updatingItem === cartItem?._id

                                        const isAdding =
                                            addingProduct === item._id

                                        const wishlistItem = getWishlistItem(item._id)
                                        const isWishlisted = Boolean(wishlistItem)

                                        const displayPrice = hasVariants
                                            ? productPrices[String(item._id)]
                                            : item.price

                                        return (

                                            <div
                                                key={item._id}
                                                className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-purple-100 bg-white p-2 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100 sm:p-3"
                                            >

                                                {/* IMAGE */}
                                                <div className="relative overflow-hidden rounded-xl bg-[#faf8ff]">

                                                    <Link
                                                        href={getProductUrl(item)}
                                                        className="block"
                                                    >

                                                        {item.image ? (

                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                loading="lazy"
                                                                className="h-28 w-full object-contain p-2 transition duration-300 group-hover:scale-105 sm:h-32 lg:h-36"
                                                            />

                                                        ) : (

                                                            <div className="flex h-28 items-center justify-center text-3xl text-purple-200 sm:h-32 lg:h-36">
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
                                                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-purple-50 bg-white/95 text-xl shadow-sm backdrop-blur-sm transition hover:scale-110 hover:bg-pink-50 disabled:opacity-50 sm:h-9 sm:w-9"
                                                    >

                                                        <span className={isWishlisted ? 'text-pink-600' : 'text-gray-500'}>
                                                            {isWishlisted ? '♥' : '♡'}
                                                        </span>

                                                    </button>

                                                    {/* STOCK BADGE */}
                                                    <span className={`absolute bottom-2 left-2 rounded-full px-2 py-1 text-[9px] font-bold sm:text-[10px] ${hasVariants
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-600'
                                                        }`}>
                                                        {hasVariants ? 'IN STOCK' : 'OUT OF STOCK'}
                                                    </span>

                                                </div>

                                                {/* PRODUCT DETAILS */}
                                                <div className="flex flex-1 flex-col">

                                                    <Link href={getProductUrl(item)}>

                                                        <h3 className="mt-2 line-clamp-2 min-h-[36px] text-xs font-bold leading-4 text-gray-800 transition group-hover:text-purple-700 sm:text-sm sm:leading-5">
                                                            {item.name}
                                                        </h3>

                                                    </Link>

                                                    {/* PRICE */}
                                                    <div className="mt-2">

                                                        <p className="text-base font-extrabold text-purple-700 sm:text-lg">
                                                            {displayPrice !== undefined && displayPrice !== null
                                                                ? `₹${displayPrice}`
                                                                : 'Price unavailable'}
                                                        </p>

                                                    </div>

                                                    {/* CART BUTTON */}
                                                    <div className="mt-auto pt-3">

                                                        {hasVariants ? (

                                                            cartItem ? (

                                                                <div className="flex w-full items-center justify-between rounded-xl border border-purple-200 bg-purple-50 px-2 py-2">

                                                                    <button
                                                                        type="button"
                                                                        disabled={isUpdating}
                                                                        onClick={() => updateQuantity(cartItem, quantity - 1)}
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg font-bold text-purple-700 shadow-sm hover:bg-purple-100 disabled:opacity-50"
                                                                    >
                                                                        −
                                                                    </button>

                                                                    <span className="text-sm font-bold text-gray-800">
                                                                        {quantity}
                                                                    </span>

                                                                    <button
                                                                        type="button"
                                                                        disabled={isUpdating}
                                                                        onClick={() => updateQuantity(cartItem, quantity + 1)}
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-lg font-bold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
                                                                    >
                                                                        +
                                                                    </button>

                                                                </div>

                                                            ) : (

                                                                <button
                                                                    type="button"
                                                                    disabled={isAdding}
                                                                    onClick={() => addToCart(item._id, variantId)}
                                                                    className="w-full rounded-xl bg-purple-600 py-2.5 text-[10px] font-extrabold text-white transition hover:bg-purple-700 disabled:opacity-50 sm:text-xs"
                                                                >
                                                                    {isAdding ? 'ADDING...' : 'ADD TO CART'}
                                                                </button>

                                                            )

                                                        ) : (

                                                            <button
                                                                type="button"
                                                                disabled
                                                                className="w-full cursor-not-allowed rounded-xl border border-red-200 bg-red-50 py-2.5 text-[10px] font-extrabold text-red-500 sm:text-xs"
                                                            >
                                                                OUT OF STOCK
                                                            </button>

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

                                <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:mt-10">

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
                                            className={`h-10 min-w-10 rounded-xl px-3 text-xs font-bold transition sm:text-sm ${page === pageNumber
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

                        </div>

                    </div>

                </section>

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
