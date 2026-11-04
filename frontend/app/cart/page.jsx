
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'

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

    //  handleCheckout

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

            setError(
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

            setError(
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
            setError(
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
            <div className="flex min-h-screen items-center justify-center bg-purple-50">
                <p className="text-lg font-semibold text-purple-700">
                    Loading your cart...
                </p>
            </div>
        )
    }

    // ERROR SCREEN
    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-purple-50 px-4">
                <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Could not load cart
                    </h1>

                    <p className="mt-3 text-gray-600">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={retryGetCart}
                        className="mt-6 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700"
                    >
                        Try Again
                    </button>

                    <Link
                        href="/"
                        className="mt-4 block font-semibold text-purple-700"
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
            <main className="min-h-screen bg-purple-50 px-4 py-16">
                <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
                    <div className="mb-4 text-6xl">🛒</div>

                    <h1 className="text-3xl font-bold text-purple-900">
                        Your Cart
                    </h1>

                    <p className="mt-3 text-gray-500">
                        Your cart is empty. Add some products to get started!
                    </p>

                    <Link
                        href="/"
                        className="mt-6 inline-block rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-purple-50 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-6xl">

                <div className="mb-8">
                    <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
                        Sellora Shopping
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
                        My Cart
                    </h1>

                    <p className="mt-2 text-gray-500">
                        {items.length}{' '}
                        {items.length === 1 ? 'product' : 'products'} in your cart
                    </p>
                </div>

                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">

                    {/* CART PRODUCTS */}
                    <div className="space-y-4 lg:col-span-2">

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
                                    className="flex flex-col gap-4 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                                >
                                    {/* PRODUCT IMAGE */}
                                    <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-purple-50 sm:w-28">
                                        {variantImage ? (
                                            <img
                                                src={variantImage}
                                                alt={item.product?.name || 'Product'}
                                                className="h-full w-full object-contain p-2"
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-400">
                                                No image
                                            </span>
                                        )}
                                    </div>

                                    {/* PRODUCT DETAILS */}
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-semibold text-gray-800">
                                            {item.product?.name || 'Product unavailable'}
                                        </h2>

                                        {variantDetails && (
                                            <p className="mt-1 text-sm font-medium text-purple-700">
                                                Variant: {variantDetails}
                                            </p>
                                        )}

                                        <p className="mt-1 text-sm text-gray-500">
                                            Price: ₹{item.price}
                                        </p>

                                        <p className="mt-2 font-bold text-purple-800">
                                            Item Total: ₹{item.totalPrice}
                                        </p>
                                    </div>

                                    {/* QUANTITY AND REMOVE */}
                                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">

                                        {/* QUANTITY */}
                                        <div className="flex items-center rounded-lg border border-purple-200">
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
                                                className="px-3 py-2 text-lg font-bold text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                −
                                            </button>

                                            <span className="min-w-9 text-center font-semibold">
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
                                                className="px-3 py-2 text-lg font-bold text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* REMOVE */}
                                        <button
                                            type="button"
                                            disabled={updatingItem === item._id}
                                            onClick={() => removeProduct(item._id)}
                                            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                        >
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
                            className="inline-block px-2 py-3 font-semibold text-purple-700 hover:text-purple-900"
                        >
                            ← Continue Shopping
                        </Link>
                    </div>

                    {/* ORDER SUMMARY */}
                    <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm lg:sticky lg:top-6">
                        <h2 className="border-b border-gray-100 pb-4 text-xl font-bold text-gray-900">
                            Order Summary
                        </h2>

                        <div className="mt-4 space-y-4">
                            <div className="flex justify-between gap-4 text-gray-600">
                                <span>Subtotal</span>
                                <span>₹{cart?.subtotal ?? 0}</span>
                            </div>

                            <div className="flex justify-between gap-4 text-gray-600">
                                <span>Discount</span>
                                <span>- ₹{cart?.discount ?? 0}</span>
                            </div>

                            <div className="flex justify-between gap-4 text-gray-600">
                                <span>Delivery Fee</span>
                                <span>₹{cart?.deliveryFee ?? 0}</span>
                            </div>

                            <div className="flex justify-between gap-4 text-gray-600">
                                <span>Tax</span>
                                <span>₹{cart?.tax ?? 0}</span>
                            </div>

                            <div className="flex justify-between gap-4 border-t border-gray-100 pt-4 text-lg font-bold text-purple-900">
                                <span>Total Amount</span>
                                <span>₹{cart?.totalAmount ?? 0}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleCheckout}
                            className="mt-6 block w-full rounded-xl bg-purple-600 px-5 py-3 text-center font-semibold text-white hover:bg-purple-700"
                        >
                            Proceed to Checkout
                        </button>

                        <p className="mt-3 text-center text-xs text-gray-500">
                            Your order total is calculated from your cart.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default CartPage
