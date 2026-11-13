
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

const API = 'http://localhost:8000'

const orderSteps = [
    {
        status: 'placed',
        label: 'Order Placed',
        description: 'We received your order.',
        icon: '✓'
    },
    {
        status: 'confirmed',
        label: 'Confirmed',
        description: 'Your order is confirmed.',
        icon: '✓'
    },
    {
        status: 'processing',
        label: 'Processing',
        description: 'We are preparing your items.',
        icon: '▣'
    },
    {
        status: 'shipped',
        label: 'Shipped',
        description: 'Your order is on its way.',
        icon: '➜'
    },
    {
        status: 'delivered',
        label: 'Delivered',
        description: 'Your order has arrived.',
        icon: '⌂'
    }
]

const deliveryStatusLabels = {
    ASSIGNED: 'Delivery Partner Assigned',
    ACCEPTED: 'Delivery Partner Accepted',
    PICKED_UP: 'Order Picked Up',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    FAILED: 'Delivery Attempt Failed'
}

const formatDate = (date) => {
    if (!date) return null

    const parsedDate = new Date(date)

    if (isNaN(parsedDate.getTime())) return null

    return parsedDate.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const formatAmount = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`
}

function InfoItem({ label, value }) {
    return (
        <div className="min-w-0">
            <p className="text-xs font-medium text-gray-400 mb-1">
                {label}
            </p>
            <p className="text-sm font-semibold text-gray-800 break-words">
                {value || 'N/A'}
            </p>
        </div>
    )
}

export default function TrackOrder() {
    const params = useParams()
    const id = params?.id

    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState('')
    const [lastUpdated, setLastUpdated] = useState(null)

    const fetchOrder = useCallback(async (isManual = false) => {
        try {
            if (isManual) {
                setRefreshing(true)
            }

            const res = await axios.get(
                `${API}/order/details/${id}`,
                { withCredentials: true }
            )

            if (res.data.status) {
                setOrder(res.data.order)
                setError('')
                setLastUpdated(new Date())
            } else {
                setError('Unable to fetch order details.')
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load order details. Please try again.'
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [id])

    useEffect(() => {
        if (!id) return

        fetchOrder()

        const interval = setInterval(() => {
            fetchOrder()
        }, 10000)

        return () => clearInterval(interval)
    }, [id, fetchOrder])

    if (loading) {
        return (
            <div className="min-h-[75vh] bg-[#f7f6fb] flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-sm font-medium text-gray-500">
                        Loading your order...
                    </p>
                </div>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="min-h-[75vh] bg-[#f7f6fb] flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-3xl mx-auto">
                        !
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mt-5">
                        Order Not Found
                    </h2>

                    <p className="text-sm text-gray-500 mt-2">
                        {error || 'We could not find this order.'}
                    </p>

                    <Link
                        href="/my-orders"
                        className="inline-flex mt-6 px-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition"
                    >
                        Back to My Orders
                    </Link>
                </div>
            </div>
        )
    }

    const currentOrderStatus = order.orderStatus?.toLowerCase()
    const deliveryStatus = order.delivery?.deliveryStatus

    const currentOrderIndex = orderSteps.findIndex(
        step => step.status === currentOrderStatus
    )

    const isCancelled = currentOrderStatus === 'cancelled'
    const isFailed = deliveryStatus === 'FAILED'
    const isDelivered = currentOrderStatus === 'delivered'

    const orderDates = {
        placed: order.placedAt || order.createdAt,
        confirmed: order.confirmedAt,
        processing: order.processingAt,
        shipped: order.shippedAt,
        delivered: order.deliveredAt
    }

    const deliveryDates = {
        ASSIGNED: order.delivery?.createdAt,
        ACCEPTED: order.delivery?.pickupTime,
        PICKED_UP: order.delivery?.pickedUpAt,
        OUT_FOR_DELIVERY: order.delivery?.outForDeliveryAt,
        DELIVERED: order.delivery?.deliveredAt
    }

    const currentDeliveryDate = deliveryDates[deliveryStatus]

    const statusColors = {
        placed: 'bg-blue-50 text-blue-700 border-blue-100',
        confirmed: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        processing: 'bg-amber-50 text-amber-700 border-amber-100',
        shipped: 'bg-purple-50 text-purple-700 border-purple-100',
        delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        cancelled: 'bg-red-50 text-red-700 border-red-100'
    }

    const progressWidth = currentOrderIndex >= 0
        ? `${(currentOrderIndex / (orderSteps.length - 1)) * 100}%`
        : '0%'

    return (
        <main className="min-h-screen bg-[#f7f6fb] py-7 md:py-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
                    <Link href="/" className="hover:text-purple-600 transition">
                        Home
                    </Link>
                    <span>/</span>
                    <Link href="/my-orders" className="hover:text-purple-600 transition">
                        My Orders
                    </Link>
                    <span>/</span>
                    <span className="text-gray-600 font-medium">
                        Track Order
                    </span>
                </div>

                {/* Page Heading */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-8 h-[3px] rounded-full bg-purple-600" />
                            <span className="text-xs font-bold tracking-[0.16em] text-purple-600 uppercase">
                                Sellora Orders
                            </span>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                            Track your order
                        </h1>

                        <p className="text-sm text-gray-500 mt-1">
                            Stay updated with your order journey.
                        </p>
                    </div>

                   
                </div>

                {/* Order Summary */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(31,20,60,0.04)] overflow-hidden mb-6">
                    <div className="p-5 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Order ID
                                </p>
                                <h2 className="text-base md:text-lg font-bold text-gray-900 mt-1 break-all">
                                    #{order.orderNumber || order._id}
                                </h2>
                            </div>

                            <span className={`w-fit inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold capitalize ${
                                isCancelled
                                    ? statusColors.cancelled
                                    : statusColors[currentOrderStatus] || 'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {currentOrderStatus?.replaceAll('_', ' ') || 'Pending'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-4 border-t border-gray-100 pt-5">
                            <InfoItem
                                label="Order Date"
                                value={formatDate(order.createdAt)}
                            />

                            <InfoItem
                                label="Total Amount"
                                value={formatAmount(order.totalAmount)}
                            />

                            <InfoItem
                                label="Payment Method"
                                value={order.paymentMethod}
                            />

                            <div>
                                <p className="text-xs font-medium text-gray-400 mb-1">
                                    Payment Status
                                </p>
                                <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full ${
                                    order.paymentStatus?.toLowerCase() === 'paid'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-amber-50 text-amber-700'
                                }`}>
                                    {order.paymentStatus || 'Pending'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#faf9fd] border-t border-gray-100 px-5 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-gray-500">
                            Need complete order details?
                        </span>

                        <Link
                            href={`/order-details/${order._id}`}
                            className="text-xs font-bold text-purple-700 hover:text-purple-900 transition"
                        >
                            View Order Details →
                        </Link>
                    </div>
                </section>

                {/* Cancelled Order */}
                {isCancelled && (
                    <section className="bg-white border border-red-100 rounded-2xl p-5 md:p-6 mb-6 shadow-sm">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 shrink-0 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-lg">
                                !
                            </div>

                            <div>
                                <h3 className="font-bold text-red-700">
                                    This order has been cancelled
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {order.cancelReason || 'This order is no longer being processed.'}
                                </p>
                                {order.cancelledAt && (
                                    <p className="text-xs text-gray-400 mt-2">
                                        Cancelled on {formatDate(order.cancelledAt)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Order Progress */}
                    <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(31,20,60,0.04)] p-5 md:p-7">
                        <div className="flex items-center justify-between gap-3 mb-7">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Order Progress
                                </h2>
                                <p className="text-xs text-gray-400 mt-1">
                                    Follow each step until delivery.
                                </p>
                            </div>

                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-lg">
                                ◷
                            </div>
                        </div>

                        {isCancelled ? (
                            <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
                                Order tracking is unavailable because this order has been cancelled.
                            </div>
                        ) : (
                            <>
                                {/* Desktop Stepper */}
                                <div className="hidden sm:block pt-2 pb-4">
                                    <div className="relative">
                                        <div className="absolute top-5 left-[10%] right-[10%] h-[3px] bg-gray-100 rounded-full" />

                                        <div
                                            className="absolute top-5 left-[10%] h-[3px] bg-purple-600 rounded-full transition-all duration-500"
                                            style={{ width: `calc(${progressWidth} * 0.8)` }}
                                        />

                                        <div className="relative grid grid-cols-5">
                                            {orderSteps.map((step, index) => {
                                                const completed = currentOrderIndex >= index
                                                const active = currentOrderIndex === index

                                                return (
                                                    <div key={step.status} className="flex flex-col items-center text-center">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] text-sm font-bold z-10 transition-all ${
                                                            completed
                                                                ? 'bg-purple-600 border-purple-100 text-white shadow-[0_0_0_4px_rgba(124,58,237,0.08)]'
                                                                : 'bg-white border-gray-200 text-gray-300'
                                                        } ${active ? 'ring-4 ring-purple-100' : ''}`}>
                                                            {completed ? '✓' : index + 1}
                                                        </div>

                                                        <p className={`text-xs font-bold mt-4 ${
                                                            completed ? 'text-purple-800' : 'text-gray-400'
                                                        }`}>
                                                            {step.label}
                                                        </p>

                                                        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed max-w-[100px]">
                                                            {step.description}
                                                        </p>

                                                        {orderDates[step.status] && (
                                                            <p className="text-[10px] text-gray-400 mt-2">
                                                                {formatDate(orderDates[step.status])}
                                                            </p>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Stepper */}
                                <div className="sm:hidden space-y-0">
                                    {orderSteps.map((step, index) => {
                                        const completed = currentOrderIndex >= index
                                        const active = currentOrderIndex === index
                                        const isLast = index === orderSteps.length - 1

                                        return (
                                            <div key={step.status} className="flex gap-4 min-h-[88px]">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                                        completed
                                                            ? 'bg-purple-600 border-purple-600 text-white'
                                                            : 'bg-white border-gray-200 text-gray-400'
                                                    } ${active ? 'ring-4 ring-purple-100' : ''}`}>
                                                        {completed ? '✓' : index + 1}
                                                    </div>

                                                    {!isLast && (
                                                        <div className={`w-[2px] flex-1 my-1 ${
                                                            currentOrderIndex > index
                                                                ? 'bg-purple-500'
                                                                : 'bg-gray-100'
                                                        }`} />
                                                    )}
                                                </div>

                                                <div className="pb-5 pt-0.5 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className={`text-sm font-bold ${
                                                            completed ? 'text-gray-900' : 'text-gray-400'
                                                        }`}>
                                                            {step.label}
                                                        </p>

                                                        {active && (
                                                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-full">
                                                                CURRENT
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {step.description}
                                                    </p>

                                                    {orderDates[step.status] && (
                                                        <p className="text-[11px] text-purple-600 font-medium mt-1.5">
                                                            {formatDate(orderDates[step.status])}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}

                        <div className="mt-3 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Order status is updated automatically.
                        </div>
                    </section>

                    {/* Delivery Information */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(31,20,60,0.04)] p-5 md:p-6 h-fit">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl">
                                🚚
                            </div>

                            <div>
                                <h2 className="font-bold text-gray-900">
                                    Delivery Updates
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Delivery partner information
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl bg-[#faf9fd] border border-purple-50 p-4">
                            {isFailed ? (
                                <>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600">
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                        Delivery Attempt Failed
                                    </span>

                                    <p className="text-sm font-semibold text-gray-800 mt-2">
                                        We couldn't complete your delivery.
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        Please check your order updates for further information.
                                    </p>
                                </>
                            ) : order.delivery ? (
                                <>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700">
                                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                        {deliveryStatusLabels[deliveryStatus] || 'Delivery in Progress'}
                                    </span>

                                    <p className="text-base font-bold text-gray-900 mt-3">
                                        {deliveryStatus === 'DELIVERED'
                                            ? 'Your order has been delivered!'
                                            : deliveryStatus === 'OUT_FOR_DELIVERY'
                                                ? 'Your order is on its way!'
                                                : 'Your delivery is being arranged.'}
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        {deliveryStatus === 'DELIVERED'
                                            ? 'Thank you for shopping with Sellora.'
                                            : 'We will keep you updated as your delivery progresses.'}
                                    </p>

                                    {currentDeliveryDate && (
                                        <div className="mt-4 pt-3 border-t border-purple-100">
                                            <p className="text-[11px] text-gray-400 font-medium">
                                                Last delivery update
                                            </p>
                                            <p className="text-xs font-semibold text-gray-700 mt-1">
                                                {formatDate(currentDeliveryDate)}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        Awaiting Assignment
                                    </span>

                                    <p className="text-sm font-bold text-gray-800 mt-3">
                                        Delivery partner will be assigned soon.
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        Your order is being prepared. Delivery details will appear here once assigned.
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="mt-5 space-y-3">
                            <div className="flex items-center justify-between gap-3 text-xs">
                                <span className="text-gray-400">Order Status</span>
                                <span className="font-semibold text-gray-700 capitalize">
                                    {currentOrderStatus?.replaceAll('_', ' ') || 'Pending'}
                                </span>
                            </div>

                            <div className="h-px bg-gray-100" />

                            <div className="flex items-center justify-between gap-3 text-xs">
                                <span className="text-gray-400">Delivery Status</span>
                                <span className="font-semibold text-gray-700 text-right">
                                    {deliveryStatusLabels[deliveryStatus] || 'Not Assigned'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-5 rounded-xl border border-gray-100 p-3 flex gap-2.5 items-start">
                            <span className="text-purple-600 text-base">ⓘ</span>
                            <p className="text-[11px] leading-relaxed text-gray-500">
                                Tracking information refreshes automatically every 10 seconds.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Bottom Actions */}
                <div className="mt-7 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Link
                        href="/my-orders"
                        className="text-sm font-semibold text-gray-600 hover:text-purple-700 transition"
                    >
                        ← Back to My Orders
                    </Link>

                    <Link
                        href={`/order-details/${order._id}`}
                        className="w-full sm:w-auto text-center px-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold shadow-[0_5px_15px_rgba(124,58,237,0.18)] hover:bg-purple-700 hover:shadow-[0_7px_18px_rgba(124,58,237,0.25)] transition"
                    >
                        View Full Order Details →
                    </Link>
                </div>

                {/* Last Updated */}
                <p className="text-center text-[11px] text-gray-400 mt-6">
                    {lastUpdated
                        ? `Last updated at ${lastUpdated.toLocaleTimeString('en-IN')}`
                        : 'Waiting for latest updates'}
                </p>
            </div>
        </main>
    )
}
