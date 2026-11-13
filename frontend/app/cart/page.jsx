
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

const CartPage = () => {

    const router = useRouter()

    const {
        cart,
        cartItems,
        loadingCart,
        getCart,
        updateCartItem,
        removeCartItem
    } = useCart()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [updatingItem, setUpdatingItem] = useState(null)

    const items = cartItems || []

    // HANDLE CHECKOUT
    const handleCheckout = () => {
        sessionStorage.removeItem('buyNowProduct')
        router.push('/checkout')
    }

    // INCREASE OR DECREASE QUANTITY
    const updateQuantity = async (itemId, quantity) => {
        if (quantity < 1) return

        try {
            setError('')
            setUpdatingItem(itemId)

            await updateCartItem(itemId, quantity)
        } catch (err) {
            console.error(
                'UPDATE CART ERROR:',
                err.response?.data || err.message
            )

            toast.error(
                err.response?.data?.message ||
                'Unable to update quantity'
            )
        } finally {
            setUpdatingItem(null)
        }
    }

    // REMOVE PRODUCT FROM CART
    const removeProduct = async (itemId) => {

        try {
            setError('')
            setUpdatingItem(itemId)

            await removeCartItem(itemId)
        } catch (err) {
            console.error(
                'REMOVE CART ERROR:',
                err.response?.data || err.message
            )

            toast.error(
                err.response?.data?.message ||
                'Unable to remove product'
            )
        } finally {
            setUpdatingItem(null)
        }
    }

    // RETRY LOADING CART
    const retryGetCart = async () => {
        try {
            setLoading(true)
            setError('')
            await getCart()
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Unable to load cart. Please check your login and backend.'
            )
        } finally {
            setLoading(false)
        }
    }

    // LOADING SCREEN
    if (loadingCart || loading) {
        return (
            <main className="flex min-h-[65vh] items-center justify-center bg-[#faf8ff] px-4">
                <div className="text-center">
                    <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600"></div>

                    <h2 className="text-lg font-bold text-gray-800">
                        Loading your cart...
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Please wait while we prepare your cart.
                    </p>
                </div>
            </main>
        )
    }

    // ERROR SCREEN
    if (error) {
        return (
            <main className="flex min-h-[65vh] items-center justify-center bg-[#faf8ff] px-4 py-10">
                <div className="w-full max-w-md rounded-3xl border border-purple-100 bg-white p-7 text-center shadow-sm sm:p-9">

                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl text-red-500">
                        !
                    </div>

                    <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                        Could not load cart
                    </h1>

                    <p className="mt-3 text-sm text-gray-500">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={retryGetCart}
                        className="mt-6 w-full rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
                    >
                        Try Again
                    </button>

                    <Link
                        href="/"
                        className="mt-4 block text-sm font-semibold text-purple-700 hover:text-purple-900"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </main>
        )
    }

    // EMPTY CART
    if (items.length === 0) {
        return (
            <main className="min-h-[70vh] bg-[#faf8ff] px-4 py-12 sm:py-20">
                <div className="mx-auto max-w-lg rounded-3xl border border-purple-100 bg-white px-5 py-12 text-center shadow-sm sm:px-10">

                    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-purple-50 text-5xl">
                        🛒
                    </div>

                    <p className="text-xs font-bold uppercase tracking-[3px] text-purple-600">
                        Sellora Shopping
                    </p>

                    <h1 className="mt-3 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                        Your Cart is Empty
                    </h1>

                    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
                        Looks like you haven't added anything to your cart yet. Explore our products and find something you love!
                    </p>

                    <Link
                        href="/"
                        className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-purple-100 transition hover:bg-purple-700 sm:w-auto"
                    >
                        Start Shopping
                    </Link>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#faf8ff] px-3 py-7 sm:px-5 sm:py-10 lg:px-8">

            <div className="mx-auto max-w-7xl">

                {/* PAGE HEADER */}
                <div className="mb-7 flex flex-col justify-between gap-4 sm:mb-9 sm:flex-row sm:items-end">

                    <div>
                        <p className="text-xs font-bold uppercase tracking-[3px] text-purple-600">
                            Sellora Shopping
                        </p>

                        <h1 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl md:text-4xl">
                            My Shopping Cart
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            {items.length}{' '}
                            {items.length === 1 ? 'product' : 'products'} in your cart
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex w-fit items-center gap-2 rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:border-purple-400 hover:bg-purple-50"
                    >
                        <span>←</span>
                        Continue Shopping
                    </Link>

                </div>

                {/* MAIN CONTENT */}
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">

                    {/* CART PRODUCTS */}
                    <div className="space-y-4 lg:col-span-2">

                        <div className="flex items-center justify-between rounded-xl border border-purple-100 bg-white px-4 py-3">
                            <h2 className="text-sm font-bold text-gray-800 sm:text-base">
                                Cart Items
                            </h2>

                            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                                {items.length} Items
                            </span>
                        </div>

                        {items.map((item) => {

                            const variant = item.variant

                            const variantImage =
                                variant?.images?.[0] ||
                                item.product?.image

                            const variantDetails = variant
                                ? [
                                    variant.name,
                                    variant.unitValue && variant.unit
                                        ? `${variant.unitValue} ${variant.unit}`
                                        : null
                                ].filter(Boolean).join(' - ')
                                : null

                            return (
                                <div
                                    key={item._id}
                                    className="relative flex flex-col gap-4 rounded-2xl border border-purple-100 bg-white p-3 shadow-sm transition hover:border-purple-200 hover:shadow-md sm:p-5"
                                >

                                    {/* PRODUCT INFORMATION */}
                                    <div className="flex min-w-0 gap-3 sm:gap-5">

                                        {/* PRODUCT IMAGE */}
                                        <Link
                                            href={`/product/${item.product?._id || ''}`}
                                            className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#faf8ff] sm:h-32 sm:w-32 sm:rounded-2xl"
                                        >
                                            {variantImage ? (
                                                <img
                                                    src={variantImage}
                                                    alt={item.product?.name || 'Product'}
                                                    className="h-full w-full object-contain p-2 transition duration-300 hover:scale-105"
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    No image
                                                </span>
                                            )}
                                        </Link>

                                        {/* PRODUCT DETAILS */}
                                        <div className="flex min-w-0 flex-1 flex-col">

                                            <h3 className="line-clamp-2 text-sm font-bold leading-5 text-gray-900 sm:text-base sm:leading-6">
                                                {item.product?.name || 'Product unavailable'}
                                            </h3>

                                            {variantDetails && (
                                                <p className="mt-1 line-clamp-2 text-xs font-medium text-purple-700 sm:text-sm">
                                                    {variantDetails}
                                                </p>
                                            )}

                                            <p className="mt-2 text-xs text-gray-500 sm:text-sm">
                                                Price: ₹{item.price}
                                            </p>

                                            <p className="mt-auto pt-2 text-sm font-extrabold text-purple-800 sm:text-base">
                                                Item Total: ₹{item.totalPrice}
                                            </p>

                                        </div>

                                    </div>

                                    {/* DIVIDER */}
                                    <div className="border-t border-gray-100"></div>

                                    {/* QUANTITY AND REMOVE */}
                                    <div className="flex flex-wrap items-center justify-between gap-3">

                                        <div>
                                            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                                Quantity
                                            </p>

                                            <div className="flex h-10 items-center rounded-xl border border-purple-200 bg-[#faf8ff]">

                                                <button
                                                    type="button"
                                                    disabled={
                                                        item.quantity <= 1 ||
                                                        updatingItem === item._id
                                                    }
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item._id,
                                                            item.quantity - 1
                                                        )
                                                    }
                                                    className="flex h-full w-10 items-center justify-center rounded-l-xl text-xl font-bold text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    −
                                                </button>

                                                <span className="min-w-10 text-center text-sm font-bold text-gray-800">
                                                    {updatingItem === item._id
                                                        ? '...'
                                                        : item.quantity}
                                                </span>

                                                <button
                                                    type="button"
                                                    disabled={updatingItem === item._id}
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item._id,
                                                            item.quantity + 1
                                                        )
                                                    }
                                                    className="flex h-full w-10 items-center justify-center rounded-r-xl text-xl font-bold text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    +
                                                </button>

                                            </div>
                                        </div>

                                        {/* REMOVE BUTTON */}
                                        <button
                                            type="button"
                                            disabled={updatingItem === item._id}
                                            onClick={() => removeProduct(item._id)}
                                            className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40 sm:text-sm"
                                        >
                                            <span>🗑</span>
                                            {updatingItem === item._id
                                                ? 'Please wait...'
                                                : 'Remove'}
                                        </button>

                                    </div>

                                </div>
                            )
                        })}

                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-purple-700 transition hover:text-purple-900"
                        >
                            ← Continue Shopping
                        </Link>

                    </div>

                    {/* ORDER SUMMARY */}
                    <div className="lg:sticky lg:top-6">

                        <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">

                            <div className="border-b border-purple-100 bg-purple-50 px-5 py-4">
                                <h2 className="text-lg font-extrabold text-gray-900">
                                    Order Summary
                                </h2>

                                <p className="mt-1 text-xs text-gray-500">
                                    Review your order details
                                </p>
                            </div>

                            <div className="p-5 sm:p-6">

                                <div className="space-y-4">

                                    <div className="flex justify-between gap-4 text-sm text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="font-semibold text-gray-800">
                                            ₹{cart?.subtotal ?? 0}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4 text-sm text-gray-600">
                                        <span>Discount</span>
                                        <span className="font-semibold text-green-600">
                                            - ₹{cart?.discount ?? 0}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4 text-sm text-gray-600">
                                        <span>Delivery Fee</span>
                                        <span className="font-semibold text-gray-800">
                                            ₹{cart?.deliveryFee ?? 0}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4 text-sm text-gray-600">
                                        <span>Tax</span>
                                        <span className="font-semibold text-gray-800">
                                            ₹{cart?.tax ?? 0}
                                        </span>
                                    </div>

                                </div>

                                <div className="my-5 border-t border-dashed border-purple-200"></div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-base font-extrabold text-gray-900">
                                        Total Amount
                                    </span>

                                    <span className="text-xl font-extrabold text-purple-700 sm:text-2xl">
                                        ₹{cart?.totalAmount ?? 0}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCheckout}
                                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-100 transition duration-300 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-purple-200"
                                >
                                    Proceed to Checkout
                                    <span>→</span>
                                </button>

                                <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-gray-400">
                                    <span>🔒</span>
                                    Secure and safe checkout
                                </div>

                            </div>

                        </div>

                        {/* BOTTOM NOTE */}
                        <div className="mt-4 rounded-xl border border-purple-100 bg-white p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">💜</span>

                                <div>
                                    <p className="text-sm font-bold text-gray-800">
                                        Happy Shopping!
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-gray-500">
                                        Thank you for choosing Sellora. We hope you enjoy your shopping experience.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

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

export default CartPage
