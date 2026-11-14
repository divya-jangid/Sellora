
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useLocationContext } from '@/context/LocationContext'
import { toast } from 'react-hot-toast'

const API = 'http://localhost:8000'
const LIMIT = 10

export default function CategoryPage() {

    const params = useParams()
    const categorySlug = params.categorySlug || params.categoryId

    const router = useRouter()
    const searchParams = useSearchParams()

    const subcategorySlug = searchParams.get('subcategory') || 'all'

    const { selectedStore, locationLoading } = useLocationContext()

    const storeId = selectedStore?._id

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

    // SEARCH, SORTING AND PAGINATION
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    const [sortBy, setSortBy] = useState('createdAt')
    const [order, setOrder] = useState('desc')

    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState(null)

    // SEARCH DEBOUNCE
    useEffect(() => {

        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim())
        }, 500)

        return () => clearTimeout(timer)

    }, [search])

    // FETCH CATEGORY, SUBCATEGORY AND PRODUCTS
    useEffect(() => {

        let isMounted = true

        const getCategoryData = async () => {

            if (locationLoading) return

            if (!storeId) {
                setCategory(null)
                setSubcategories([])
                setProducts([])
                setVariants([])
                setPagination(null)
                setLoading(false)
                setErrorMessage('Please select your location first.')
                return
            }

            try {

                setLoading(true)
                setErrorMessage('')

                const [
                    categoryRes,
                    subcategoryRes,
                    productRes
                ] = await Promise.all([

                    axios.get(`${API}/category/public`, {
                        params: { storeId }
                    }),

                    axios.get(`${API}/subcategory/public`, {
                        params: { storeId }
                    }),

                    axios.get(`${API}/product/public`, {
                        params: {
                            storeId,
                            categorySlug,

                            ...(subcategorySlug !== 'all' && {
                                subcategorySlug
                            }),

                            page,
                            limit: LIMIT,
                            search: debouncedSearch,
                            sortBy,
                            order
                        }
                    })

                ])

                // CATEGORY RESPONSE
                const categories =
                    categoryRes.data?.data?.categories ||
                    categoryRes.data?.categories ||
                    categoryRes.data?.data ||
                    []

                // SUBCATEGORY RESPONSE
                const allSubcategories =
                    subcategoryRes.data?.data?.subcategories ||
                    subcategoryRes.data?.subcategories ||
                    subcategoryRes.data?.data ||
                    []

                // PRODUCT RESPONSE
                const allProducts =
                    productRes.data?.data?.products ||
                    productRes.data?.products ||
                    productRes.data?.data ||
                    []

                console.log('ALL PRODUCTS:', allProducts)

                console.log(
                    'FIRST PRODUCT:',
                    allProducts[0]
                )

                console.log(
                    'PRODUCT KEYS:',
                    Object.keys(allProducts[0] || {})
                )

                if (
                    !Array.isArray(categories) ||
                    !Array.isArray(allSubcategories) ||
                    !Array.isArray(allProducts)
                ) {
                    throw new Error('Invalid API response')
                }

                // FIND CATEGORY
                const selectedCategory = categories.find(
                    item => String(item.slug) === String(categorySlug)
                )

                if (!selectedCategory) {

                    if (isMounted) {
                        setCategory(null)
                        setSubcategories([])
                        setProducts([])
                        setVariants([])
                        setPagination(null)
                    }

                    return
                }

                const categoryId = String(selectedCategory._id)

                // CATEGORY SUBCATEGORIES
                const categorySubcategories = allSubcategories.filter(item => {

                    const id = item.category?._id || item.category

                    return String(id) === categoryId
                })

                // ALL ACTIVE VARIANTS
                const categoryVariants = allProducts.flatMap(product => {

                    return (product.variants || [])
                        .filter(variant => variant.status === 'active')
                        .map(variant => ({
                            ...variant,
                            product: product._id
                        }))

                })

                if (isMounted) {

                    setCategory(selectedCategory)
                    setSubcategories(categorySubcategories)
                    setProducts(allProducts)
                    setVariants(categoryVariants)

                    setPagination(
                        productRes.data?.pagination || null
                    )
                }

            } catch (error) {

                console.log('CATEGORY FETCH ERROR:', error)
                console.log('ERROR RESPONSE:', error.response?.data)

                if (isMounted) {

                    setCategory(null)
                    setSubcategories([])
                    setProducts([])
                    setVariants([])
                    setPagination(null)

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

    }, [
        categorySlug,
        subcategorySlug,
        storeId,
        locationLoading,
        page,
        debouncedSearch,
        sortBy,
        order
    ])

    // CHANGE SUBCATEGORY
    const handleSubcategoryChange = item => {

        setPage(1)

        if (item.slug === 'all') {

            router.push(`/category/${categorySlug}`)

        } else {

            router.push(`/subcategory/${item._id}`)
        }
    }

    // SELECTED SUBCATEGORY
    const selectedSubcategory = subcategories.find(
        item => item.slug === subcategorySlug
    )

    // SEARCH
    const handleSearch = value => {
        setSearch(value)
        setPage(1)
    }

    // SORTING
    const handleSort = value => {

        const [field, direction] = value.split('-')

        setSortBy(field)
        setOrder(direction)
        setPage(1)
    }

    // PAGINATION
    const changePage = newPage => {

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

    // GET PRODUCT VARIANTS
    const getProductVariants = productId => {

        return variants.filter(variant => {

            const id = variant.product?._id || variant.product

            return String(id) === String(productId)
        })
    }

    // CHECK VARIANT STOCK
    const isVariantInStock = variant => {
        return variant && Number(variant.availableQuantity) > 0
    }

    // GET DEFAULT VARIANT
    const getDefaultVariant = productId => {

        const productVariants = getProductVariants(productId)

        if (!productVariants.length) return null

        return [...productVariants].sort((a, b) => {

            const stockA = isVariantInStock(a) ? 1 : 0
            const stockB = isVariantInStock(b) ? 1 : 0

            if (stockA !== stockB) {
                return stockB - stockA
            }

            return Number(a.sellingPrice) - Number(b.sellingPrice)

        })[0]
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
                toast.error('Product variant not available.')
                return
            }

            const variant = variants.find(
                item => String(item._id) === String(variantId)
            )

            if (!isVariantInStock(variant)) {
                toast.error('This variant is out of stock.')
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

            if (!isVariantInStock(variant)) {
                toast.error('This variant is out of stock.')
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

            toast.error(
                error.response?.data?.message ||
                'Unable to update wishlist.'
            )
        }
    }

    // FILTERED PRODUCTS
    const filteredProducts = products

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

    // LOCATION LOADING
    if (locationLoading) {

        return (
            <main className="flex min-h-[60vh] items-center justify-center bg-[#faf8ff] px-4">

                <div className="text-center">

                    <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600"></div>

                    <h2 className="text-lg font-bold text-gray-800">
                        Finding your location
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Please wait while we prepare your store...
                    </p>

                </div>

            </main>
        )
    }

    // LOADING
    if (loading && !category) {

        return (
            <main className="flex min-h-[60vh] items-center justify-center bg-[#faf8ff] px-4">

                <div className="text-center">

                    <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600"></div>

                    <h2 className="text-lg font-bold text-gray-800">
                        Loading category
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Getting products for you...
                    </p>

                </div>

            </main>
        )
    }

    // API ERROR
    if (errorMessage) {

        return (
            <main className="flex min-h-[60vh] items-center justify-center bg-[#faf8ff] px-4">

                <div className="w-full max-w-md rounded-3xl border border-purple-100 bg-white p-8 text-center shadow-sm">

                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-4xl">
                        !
                    </div>

                    <h2 className="text-xl font-bold text-gray-900">
                        Unable to Load Category
                    </h2>

                    <p className="mt-3 text-sm text-gray-500">
                        {errorMessage}
                    </p>

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-purple-700"
                    >
                        Try Again
                    </button>

                </div>

            </main>
        )
    }

    // CATEGORY NOT FOUND
    if (!category) {

        return (
            <main className="flex min-h-[60vh] items-center justify-center bg-[#faf8ff] px-4">

                <div className="w-full max-w-md rounded-3xl border border-purple-100 bg-white p-8 text-center shadow-sm">

                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 text-4xl">
                        🛍️
                    </div>

                    <h2 className="text-xl font-bold text-gray-900">
                        Category Not Found
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        This category is currently unavailable.
                    </p>

                    <Link
                        href="/"
                        className="mt-6 inline-flex rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-purple-700"
                    >
                        Go to Home
                    </Link>

                </div>

            </main>
        )
    }

    // INVALID SUBCATEGORY
    if (subcategorySlug !== 'all' && !selectedSubcategory) {

        return (
            <main className="flex min-h-[60vh] items-center justify-center bg-[#faf8ff] px-4">

                <div className="w-full max-w-md rounded-3xl border border-purple-100 bg-white p-8 text-center shadow-sm">

                    <h2 className="text-xl font-bold text-gray-900">
                        Subcategory Not Found
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        This subcategory is not available in this collection.
                    </p>

                    <button
                        onClick={() => handleSubcategoryChange('all')}
                        className="mt-6 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-purple-700"
                    >
                        View All Products
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

                    <span className="text-purple-700">
                        {category.name}
                    </span>

                    {subcategorySlug !== 'all' && (
                        <>
                            <span>/</span>
                            <span className="text-purple-700">
                                {selectedSubcategory.name}
                            </span>
                        </>
                    )}

                </div>

                {/* SUBCATEGORY FILTER */}
                <section className="mb-8">

                    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">

                        <div>

                            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                                Shop by Subcategory
                            </h2>

                            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                                Explore different collections
                            </p>

                        </div>

                        <span className="rounded-full border border-purple-100 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm">
                            {subcategories.length} Collections
                        </span>

                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4">

                        {/* ALL */}
                        <button
                            onClick={() => handleSubcategoryChange('all')}
                            className="group flex w-24 shrink-0 flex-col items-center sm:w-28"
                        >

                            <div className={`h-20 w-20 rounded-full border-[3px] p-1 transition sm:h-24 sm:w-24 ${subcategorySlug === 'all'
                                    ? 'border-purple-600 bg-purple-100 shadow-lg shadow-purple-100'
                                    : 'border-transparent bg-white shadow-sm group-hover:border-purple-200'
                                }`}>

                                <div className="flex h-full items-center justify-center rounded-full bg-purple-50 text-3xl transition group-hover:bg-purple-100">
                                    🛍️
                                </div>

                            </div>

                            <span className={`mt-2 text-xs font-bold sm:text-sm ${subcategorySlug === 'all'
                                    ? 'text-purple-700'
                                    : 'text-gray-600'
                                }`}>
                                All Products
                            </span>

                        </button>

                        {/* SUBCATEGORIES */}
                        {subcategories.map(item => (

                            <button
                                key={item._id}
                                onClick={() => handleSubcategoryChange(item)}
                                className="group flex w-24 shrink-0 flex-col items-center sm:w-28"
                            >

                                <div className={`h-20 w-20 rounded-full border-[3px] p-1 transition sm:h-24 sm:w-24 ${subcategorySlug === item.slug
                                        ? 'border-purple-600 bg-purple-100 shadow-lg shadow-purple-100'
                                        : 'border-transparent bg-white shadow-sm group-hover:border-purple-200'
                                    }`}>

                                    <img
                                        src={item.image || '/placeholder.png'}
                                        alt={item.name}
                                        loading="lazy"
                                        className="h-full w-full rounded-full bg-purple-50 object-cover"
                                    />

                                </div>

                                <span className={`mt-2 line-clamp-2 text-center text-xs font-bold sm:text-sm ${subcategorySlug === item.slug
                                        ? 'text-purple-700'
                                        : 'text-gray-600'
                                    }`}>
                                    {item.name}
                                </span>

                            </button>

                        ))}

                    </div>

                </section>

                {/* PRODUCTS SECTION */}
                <section>

                    {/* SIDEBAR + PRODUCTS */}
                    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">

                        {/* LEFT SIDEBAR */}
                        <aside className="h-fit rounded-2xl border border-purple-100 bg-white p-4 shadow-sm lg:sticky lg:top-24">

                            <div className="mb-4 flex items-center justify-between">

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
                                        className="w-full rounded-xl border border-purple-100 bg-[#faf8ff] py-2.5 pl-10 pr-9 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-50"
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

                                <div className="space-y-3">

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
                                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-gray-600 transition hover:bg-purple-50 hover:text-purple-700"
                                        >

                                            <input
                                                type="radio"
                                                name="productSorting"
                                                value={item.value}
                                                checked={`${sortBy}-${order}` === item.value}
                                                onChange={e => handleSort(e.target.value)}
                                                className="h-4 w-4 shrink-0 accent-purple-600"
                                            />

                                            {item.label}

                                        </label>

                                    ))}

                                </div>

                            </div>

                        </aside>

                        {/* RIGHT SIDE PRODUCTS */}
                        <div className="min-w-0">

                            {/* HEADING */}
                            <div className="mb-5">

                                <h2 className="text-xl font-extrabold text-gray-900 sm:text-2xl">
                                    {subcategorySlug === 'all'
                                        ? `All ${category.name} Products`
                                        : `${selectedSubcategory.name} Products`}
                                </h2>

                                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                                    Find your favourite products at great prices
                                </p>

                            </div>

                            {/* PRODUCT COUNT */}
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

                                <p className="text-xs text-gray-600 sm:text-sm">
                                    Showing <span className="font-bold text-gray-900">{displayCards.length}</span> products
                                    {pagination?.totalProducts !== undefined &&
                                        ` of ${pagination.totalProducts}`}
                                </p>

                                <span className="rounded-full border border-purple-100 bg-white px-4 py-2 text-xs font-semibold text-purple-700 shadow-sm sm:text-sm">
                                    Page {pagination?.currentPage || page} of {pagination?.totalPages || 1}
                                </span>

                            </div>

                            {/* UPDATING INDICATOR */}
                            {loading && (

                                <div className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-purple-50 py-3 text-sm font-medium text-purple-700">

                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600"></span>

                                    Updating products...

                                </div>

                            )}

                            {/* PRODUCT GRID */}
                            {displayCards.length === 0 ? (

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

                                    {displayCards.map(card => {

                                        const product = card.product
                                        const variant = card.variant
                                        const inStock = isVariantInStock(variant)

                                        const cartItem = variant
                                            ? getCartItem(product._id, variant._id)
                                            : null

                                        const image =
                                            variant?.images?.[0] ||
                                            product.image ||
                                            '/placeholder.png'

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
                                                className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-purple-100 bg-white p-2 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100 sm:p-3"
                                            >

                                                {/* IMAGE */}
                                                <div className="relative overflow-hidden rounded-xl bg-[#faf8ff]">

                                                    <Link
                                                        href={`/product/${product.slug}`}
                                                        className="block"
                                                    >

                                                        <img
                                                            src={image}
                                                            alt={product.name}
                                                            loading="lazy"
                                                            className="h-28 w-full object-contain p-2 transition duration-300 group-hover:scale-105 sm:h-32 lg:h-36"
                                                        />

                                                    </Link>

                                                    {/* WISHLIST */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleWishlist(product._id)}
                                                        aria-label={
                                                            isInWishlist(product._id)
                                                                ? 'Remove from wishlist'
                                                                : 'Add to wishlist'
                                                        }
                                                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-purple-50 bg-white/95 text-xl shadow-sm backdrop-blur-sm transition hover:scale-110 hover:bg-pink-50 sm:h-9 sm:w-9"
                                                    >
                                                        {isInWishlist(product._id)
                                                            ? <span className="text-pink-600">♥</span>
                                                            : <span className="text-gray-500">♡</span>}
                                                    </button>

                                                    {/* DISCOUNT */}
                                                    {card.type === 'variant' && discount > 0 && (

                                                        <span className="absolute bottom-2 left-2 rounded-full bg-green-100 px-2 py-1 text-[9px] font-bold text-green-700 sm:text-[10px]">
                                                            {discount}% OFF
                                                        </span>

                                                    )}

                                                </div>

                                                {/* PRODUCT DETAILS */}
                                                <div className="flex flex-1 flex-col">

                                                    <Link href={`/product/${product.slug}`}>

                                                        <h3 className="mt-2 line-clamp-2 min-h-[36px] text-xs font-bold leading-4 text-gray-800 transition group-hover:text-purple-700 sm:text-sm sm:leading-5">
                                                            {product.name}
                                                        </h3>

                                                    </Link>

                                                    {/* ALL CATEGORY VIEW */}
                                                    {card.type === 'product' && (

                                                        <>

                                                            {/* PRODUCT PRICE + VARIANT */}
                                                            {variant ? (

                                                                <div className="mt-2">

                                                                    <p className="text-base font-extrabold text-purple-700 sm:text-lg">
                                                                        ₹{sellingPrice}
                                                                    </p>

                                                                    <p className="mt-1 text-xs text-gray-500">
                                                                        {variant.name}
                                                                    </p>

                                                                </div>

                                                            ) : (

                                                                <div className="mt-2">
                                                                    <p className="mt-1 text-xs font-bold text-red-500">
                                                                        OUT OF STOCK
                                                                    </p>
                                                                </div>

                                                            )}

                                                            {/* CART BUTTONS */}
                                                            <div className="mt-auto pt-3">

                                                                {!variant || !inStock ? (

                                                                    <button
                                                                        type="button"
                                                                        disabled
                                                                        className="w-full cursor-not-allowed rounded-xl border border-red-200 bg-red-50 py-2.5 text-[10px] font-extrabold text-red-500 sm:text-xs"
                                                                    >
                                                                        OUT OF STOCK
                                                                    </button>

                                                                ) : cartItem ? (

                                                                    <div className="flex items-center justify-between rounded-xl bg-purple-600 p-1 text-white">

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDecrease(cartItem)}
                                                                            className="h-8 w-8 rounded-lg text-xl font-bold transition hover:bg-purple-700"
                                                                        >
                                                                            −
                                                                        </button>

                                                                        <span className="text-sm font-bold">
                                                                            {cartItem.quantity}
                                                                        </span>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleIncrease(cartItem)}
                                                                            className="h-8 w-8 rounded-lg text-xl font-bold transition hover:bg-purple-700"
                                                                        >
                                                                            +
                                                                        </button>

                                                                    </div>

                                                                ) : (

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleAddToCart(product._id, variant._id)}
                                                                        className="w-full rounded-xl border border-purple-600 bg-white py-2.5 text-[10px] font-extrabold text-purple-700 transition hover:bg-purple-600 hover:text-white sm:text-xs"
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

                                                            <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                                                                {variant.name}
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-gray-400 sm:text-xs">
                                                                {variant.unitValue} {variant.unit}
                                                            </p>

                                                            <div className="mt-2 flex flex-wrap items-center gap-2">

                                                                <span className="text-base font-extrabold text-purple-700 sm:text-lg">
                                                                    ₹{sellingPrice}
                                                                </span>

                                                                {mrp > sellingPrice && (

                                                                    <span className="text-xs text-gray-400 line-through sm:text-sm">
                                                                        ₹{mrp}
                                                                    </span>

                                                                )}

                                                            </div>

                                                            {/* STOCK + CART BUTTONS */}
                                                            <div className="mt-auto pt-3">

                                                                {!inStock ? (

                                                                    <button
                                                                        type="button"
                                                                        disabled
                                                                        className="w-full cursor-not-allowed rounded-xl border border-red-200 bg-red-50 py-2.5 text-[10px] font-extrabold text-red-500 sm:text-xs"
                                                                    >
                                                                        OUT OF STOCK
                                                                    </button>

                                                                ) : cartItem ? (

                                                                    <div className="flex items-center justify-between rounded-xl border border-purple-500 px-3 py-1.5">

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDecrease(cartItem)}
                                                                            className="font-bold text-purple-700"
                                                                        >
                                                                            -
                                                                        </button>

                                                                        <span className="text-sm font-bold text-gray-800">
                                                                            {cartItem.quantity}
                                                                        </span>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleIncrease(cartItem)}
                                                                            className="font-bold text-purple-700"
                                                                        >
                                                                            +
                                                                        </button>

                                                                    </div>

                                                                ) : (

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleAddToCart(product._id, variant._id)}
                                                                        className="w-full rounded-xl border border-purple-600 py-2.5 text-[10px] font-extrabold text-purple-700 transition hover:bg-purple-600 hover:text-white sm:text-xs"
                                                                    >
                                                                        ADD TO CART
                                                                    </button>

                                                                )}

                                                                {/* BUY NOW */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleBuyNow(product, variant)}
                                                                    disabled={!inStock}
                                                                    className={`mt-2 w-full rounded-xl py-2.5 text-[10px] font-extrabold transition sm:text-xs ${!inStock
                                                                            ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                                                                            : 'bg-purple-600 text-white hover:bg-purple-700'
                                                                        }`}
                                                                >
                                                                    BUY NOW
                                                                </button>

                                                            </div>

                                                        </>

                                                    )}

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
