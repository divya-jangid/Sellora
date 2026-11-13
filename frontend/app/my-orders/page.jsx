
'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'

const API = 'http://localhost:8000'

export default function MyOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const getOrders = async () => {
            try {
                const res = await axios.get(
                    `${API}/order/my-orders`,
                    { withCredentials: true }
                )

                setOrders(res.data.data || res.data.orders || [])

            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Orders load nahi ho paaye.'
                )
            } finally {
                setLoading(false)
            }
        }

        getOrders()
    }, [])

    const badgeStyle = (status) => {
        const value = status?.toLowerCase()

        if (['success', 'delivered', 'paid'].includes(value)) {
            return 'bg-green-50 text-green-700 border border-green-200'
        }

        if (['failed', 'cancelled'].includes(value)) {
            return 'bg-red-50 text-red-700 border border-red-200'
        }

        return 'bg-amber-50 text-amber-700 border border-amber-200'
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#faf8ff] px-4">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
                    <p className="mt-4 text-sm font-medium text-purple-700">
                        Loading your orders...
                    </p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#faf8ff] px-4">
                <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
                    <p className="text-3xl">⚠️</p>
                    <h2 className="mt-3 text-lg font-bold text-gray-800">
                        Unable to Load Orders
                    </h2>
                    <p className="mt-2 text-sm text-red-600">
                        {error}
                    </p>
                    <Link
                        href="/"
                        className="mt-5 inline-flex rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
                    >
                        Back to Shopping
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-[#faf8ff] px-3 py-6 sm:px-6 sm:py-10 lg:px-8">

            <div className="mx-auto max-w-5xl">

                {/* Page Header */}
                <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <p className="text-xs font-bold uppercase tracking-[2px] text-purple-600">
                            Sellora / Account
                        </p>

                        <h1 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                            My Orders
                        </h1>

                        <p className="mt-1 text-sm text-gray-500 sm:text-base">
                            Track and manage all your purchases
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-100 transition hover:-translate-y-0.5 hover:bg-purple-700"
                    >
                        <span>←</span> Continue Shopping
                    </Link>
                </div>

                {/* Orders Count */}
                {orders.length > 0 && (
                    <div className="mb-5 flex items-center justify-between rounded-xl border border-purple-100 bg-white px-4 py-3 shadow-sm">
                        <p className="text-sm font-semibold text-gray-700">
                            Your Order History
                        </p>

                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                        </span>
                    </div>
                )}

                {/* Empty Orders */}
                {orders.length === 0 ? (
                    <div className="rounded-2xl border border-purple-100 bg-white px-5 py-14 text-center shadow-sm sm:px-10">

                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 text-4xl">
                            🛍️
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-gray-900">
                            No orders yet!
                        </h2>

                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                            Looks like you haven't placed any orders yet. Explore our products and find something you love.
                        </p>

                        <Link
                            href="/"
                            className="mt-6 inline-flex items-center justify-center rounded-xl bg-purple-600 px-7 py-3 text-sm font-bold text-white shadow-md shadow-purple-100 transition hover:bg-purple-700"
                        >
                            Start Shopping →
                        </Link>
                    </div>
                ) : (

                    /* Orders List */
                    <div className="space-y-5">

                        {orders.map((order) => {

                            const partner = order.deliveryPartner
                            const deliveryStatus = order.delivery?.deliveryStatus

                            return (
                                <div
                                    key={order._id}
                                    className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm transition duration-300 hover:shadow-md"
                                >

                                    {/* Order Header */}
                                    <div className="flex flex-col gap-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">

                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                Order ID
                                            </p>

                                            <h2 className="mt-1 break-all text-sm font-bold text-gray-900 sm:text-base">
                                                {order.orderNumber || order._id}
                                            </h2>

                                            {order.createdAt && (
                                                <p className="mt-1.5 text-xs text-gray-500">
                                                    Ordered on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-medium text-gray-500">
                                                Order Status:
                                            </span>

                                            <span className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${badgeStyle(order.orderStatus)}`}>
                                                {order.orderStatus || 'Processing'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Information */}
                                    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 sm:gap-3 sm:p-5">

                                        <div className="rounded-xl bg-purple-50/70 p-4">
                                            <p className="text-xs font-medium text-gray-500">
                                                Total Amount
                                            </p>

                                            <p className="mt-2 text-xl font-extrabold text-purple-700">
                                                ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-gray-50 p-4">
                                            <p className="text-xs font-medium text-gray-500">
                                                Payment Method
                                            </p>

                                            <p className="mt-2 text-sm font-bold text-gray-800">
                                                {order.paymentMethod === 'COD'
                                                    ? 'Cash on Delivery'
                                                    : order.paymentMethod === 'online'
                                                        ? 'Online Payment'
                                                        : order.paymentMethod || 'N/A'}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-gray-50 p-4">
                                            <p className="text-xs font-medium text-gray-500">
                                                Payment Status
                                            </p>

                                            <span className={`mt-2 inline-block rounded-full px-3 py-1.5 text-xs font-bold ${badgeStyle(order.paymentStatus)}`}>
                                                {order.paymentStatus || 'PENDING'}
                                            </span>
                                        </div>

                                    </div>

                                    {/* Delivery Tracking */}
                                    <div className="mx-4 mb-4 rounded-xl border border-purple-100 bg-purple-50/60 p-4 sm:mx-5 sm:p-5">

                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                                                🚚
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 sm:text-base">
                                                    Delivery Tracking
                                                </h3>

                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    Latest delivery information
                                                </p>
                                            </div>
                                        </div>

                                        {deliveryStatus ? (
                                            <div className="rounded-lg bg-white p-3">
                                                <p className="text-xs font-medium text-gray-500">
                                                    Current Delivery Status
                                                </p>

                                                <span className={`mt-2 inline-block rounded-full px-3 py-1.5 text-xs font-bold capitalize ${badgeStyle(deliveryStatus)}`}>
                                                    {deliveryStatus.replaceAll('_', ' ')}
                                                </span>

                                                {deliveryStatus === 'DELIVERED' && (
                                                    <p className="mt-3 text-sm font-medium text-green-700">
                                                        ✓ Your order has been delivered successfully.
                                                    </p>
                                                )}

                                                {deliveryStatus === 'CANCELLED' && (
                                                    <p className="mt-3 text-sm text-red-600">
                                                        Delivery cancelled. A new delivery partner may be assigned.
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="rounded-lg bg-white p-3 text-sm text-gray-600">
                                                Delivery partner has not been assigned yet.
                                            </p>
                                        )}
                                    </div>

                                    {/* Delivery Partner */}
                                    <div className="mx-4 mb-4 rounded-xl border border-gray-100 p-4 sm:mx-5 sm:p-5">

                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-xl">
                                                👤
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 sm:text-base">
                                                    Delivery Partner
                                                </h3>

                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    Your order delivery contact
                                                </p>
                                            </div>
                                        </div>

                                        {partner ? (
                                            <div className="flex flex-col gap-4 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">

                                                <div className="min-w-0">
                                                    <p className="text-xs text-gray-500">
                                                        Partner Name
                                                    </p>

                                                    <p className="mt-1 break-words font-bold text-gray-900">
                                                        {partner.name}
                                                    </p>

                                                    <p className="mt-3 text-xs text-gray-500">
                                                        Phone Number
                                                    </p>

                                                    <p className="mt-1 font-semibold text-gray-800">
                                                        {partner.phone || 'Not available'}
                                                    </p>
                                                </div>

                                                {partner.phone && (
                                                    <a
                                                        href={`tel:${partner.phone}`}
                                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700 sm:w-auto"
                                                    >
                                                        <span>📞</span>
                                                        Call Partner
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                                                Delivery partner has not been assigned yet.
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-3 border-t border-gray-100 p-4 sm:flex-row sm:justify-end sm:px-5 sm:py-4">

                                        <Link
                                            href={`/order-details/${order._id}`}
                                            className="inline-flex w-full items-center justify-center rounded-xl border border-purple-200 bg-white px-5 py-3 text-sm font-bold text-purple-700 transition hover:bg-purple-50 sm:w-auto"
                                        >
                                            View Details →
                                        </Link>

                                        <Link
                                            href={`/track-order/${order._id}`}
                                            className="inline-flex w-full items-center justify-center rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-purple-700 sm:w-auto"
                                        >
                                            Track Order
                                        </Link>

                                    </div>

                                </div>
                            )
                        })}

                    </div>
                )}

            </div>
        </main>
    )
}
