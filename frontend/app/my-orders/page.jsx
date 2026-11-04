
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

                // Backend response ke according orders
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

        if (['success', 'delivered'].includes(value)) {
            return 'bg-green-100 text-green-700'
        }

        if (['failed', 'cancelled'].includes(value)) {
            return 'bg-red-100 text-red-700'
        }

        return 'bg-yellow-100 text-yellow-800'
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-purple-50">
                <p className="font-medium text-purple-700">
                    Loading orders...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-purple-50 p-6 text-center text-red-600">
                {error}
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-purple-50 px-4 py-8 sm:px-6">

            <div className="mx-auto max-w-4xl">

                {/* Header */}
                <div className="mb-7 flex items-center justify-between">

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            My Orders
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Track your recent purchases
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                    >
                        Shop More
                    </Link>

                </div>

                {/* No Orders */}
                {orders.length === 0 ? (

                    <div className="rounded-xl bg-white p-8 text-center shadow-sm">

                        <p className="text-4xl">🛍️</p>

                        <h2 className="mt-3 text-lg font-semibold text-gray-800">
                            No orders yet
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Your placed orders will appear here.
                        </p>

                        <Link
                            href="/"
                            className="mt-4 inline-block font-semibold text-purple-700 hover:underline"
                        >
                            Start Shopping →
                        </Link>

                    </div>

                ) : (

                    <div className="space-y-3">

                        {orders.map((order) => {

                            const partner = order.deliveryPartner

                            return (

                                <div
                                    key={order._id}
                                    className="rounded-xl border border-purple-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
                                >

                                    {/* Order Header */}
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                        <div className="min-w-0">

                                            <p className="text-xs text-gray-500">
                                                Order ID
                                            </p>

                                            <h2 className="mt-1 break-all text-sm font-bold text-gray-800">
                                                {order.orderNumber || order._id}
                                            </h2>

                                            {order.createdAt && (
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            )}

                                        </div>

                                        <span
                                            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${badgeStyle(order.orderStatus)}`}
                                        >
                                            {order.orderStatus || 'Processing'}
                                        </span>

                                    </div>

                                    {/* Order Information */}
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-3">

                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Total Amount
                                            </p>

                                            <p className="mt-1 text-lg font-bold text-purple-700">
                                                ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Payment
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-gray-800">
                                                {order.paymentMethod === 'COD'
                                                    ? 'Cash on Delivery'
                                                    : order.paymentMethod === 'online'
                                                        ? 'Online Payment'
                                                        : order.paymentMethod || 'N/A'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Payment Status
                                            </p>

                                            <span
                                                className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${badgeStyle(order.paymentStatus)}`}
                                            >
                                                {order.paymentStatus || 'PENDING'}
                                            </span>
                                        </div>

                                    </div>

                                    {/* Delivery Partner Details */}
                                    <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 p-4">

                                        <h3 className="mb-3 font-semibold text-gray-800">
                                            🚚 Delivery Partner
                                        </h3>

                                        {partner ? (

                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                                <div>
                                                    <p className="text-xs text-gray-500">
                                                        Partner Name
                                                    </p>

                                                    <p className="mt-1 font-semibold text-gray-900">
                                                        {partner.name}
                                                    </p>

                                                    <p className="mt-2 text-xs text-gray-500">
                                                        Phone Number
                                                    </p>

                                                    <p className="mt-1 font-medium text-gray-800">
                                                        {partner.phone || 'Not available'}
                                                    </p>
                                                </div>

                                                {partner.phone && (
                                                    <a
                                                        href={`tel:${partner.phone}`}
                                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                                                    >
                                                        📞 Call Partner
                                                    </a>
                                                )}

                                            </div>

                                        ) : (

                                            <p className="text-sm text-gray-600">
                                                Delivery partner has not been assigned yet.
                                            </p>

                                        )}

                                    </div>

                                    {/* Delivery Partner Details */}
                                    <div className="mt-4 rounded-lg border border-purple-100 bg-purple-50 p-4">
                                        <h3 className="font-semibold text-gray-800">
                                            Delivery Partner Details
                                        </h3>

                                        {order.deliveryPartner ? (
                                            <>
                                                <p className="mt-2 text-sm text-gray-700">
                                                    Name: {order.deliveryPartner.name}
                                                </p>

                                                <p className="mt-1 text-sm text-gray-700">
                                                    Phone: {order.deliveryPartner.phone || 'Not available'}
                                                </p>

                                                {order.deliveryPartner.phone && (
                                                    <a
                                                        href={`tel:${order.deliveryPartner.phone}`}
                                                        className="mt-3 inline-block rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white"
                                                    >
                                                        Call Delivery Partner
                                                    </a>
                                                )}
                                            </>
                                        ) : (
                                            <p className="mt-2 text-sm text-gray-500">
                                                Delivery partner not assigned yet.
                                            </p>
                                        )}
                                    </div>

                                    {/* View Details Button */}
                                    <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">

                                        <Link
                                            href={`/order-details/${order._id}`}
                                            className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
                                        >
                                            View Details →
                                        </Link>

                                    </div>

                                    <Link
                                        href={`/track-order/${order._id}`}
                                        className="mt-3 inline-block rounded-lg bg-purple-600 px-4 py-2 text-sm text-white"
                                    >
                                        Track Order
                                    </Link>

                                </div>

                            )
                        })}

                    </div>

                )}

            </div>

        </main>
    )
}
