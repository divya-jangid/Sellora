'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

const orderSteps = [
    { status: 'placed', label: 'Order Placed', description: 'We have received your order.' },
    { status: 'confirmed', label: 'Order Confirmed', description: 'Your order has been confirmed.' },
    { status: 'processing', label: 'Processing', description: 'Your order is being prepared.' },
    { status: 'shipped', label: 'Shipped', description: 'Your order is on its way.' },
    { status: 'delivered', label: 'Delivered', description: 'Your order has been delivered.' }
]

const deliverySteps = [
    { status: 'ASSIGNED', label: 'Delivery Partner Assigned' },
    { status: 'ACCEPTED', label: 'Delivery Partner Accepted' },
    { status: 'PICKED_UP', label: 'Order Picked Up' },
    { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { status: 'DELIVERED', label: 'Delivered' }
]

function formatDate(date) {
    if (!date) return null

    return new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export default function TrackOrder() {
    const { id } = useParams()
    const router = useRouter()

    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchOrder = async () => {
        try {
            const res = await axios.get(
                `http://localhost:8000/order/details/${id}`,
                { withCredentials: true }
            )

            if (res.data.status) {
                setOrder(res.data.order)
                setError('')
            }
        } catch (err) {
            console.log(err)
            setError(
                err.response?.data?.message || 'Unable to fetch order details'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!id) return

        fetchOrder()

        const interval = setInterval(() => {
            fetchOrder()
        }, 10000)

        return () => clearInterval(interval)
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg font-semibold text-purple-700">
                    Loading tracking details...
                </p>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-red-500 font-semibold">
                    {error || 'Order not found'}
                </p>

                <Link
                    href="/my-orders"
                    className="bg-purple-600 text-white px-5 py-2 rounded-lg"
                >
                    Back to My Orders
                </Link>
            </div>
        )
    }

    const currentOrderStatus = order.orderStatus?.toLowerCase()
    const deliveryStatus = order.delivery?.deliveryStatus

    const currentOrderIndex = orderSteps.findIndex(
        step => step.status === currentOrderStatus
    )

    const currentDeliveryIndex = deliverySteps.findIndex(
        step => step.status === deliveryStatus
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

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">

            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">

                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                            Track Your Order
                        </h1>

                        <p className="text-gray-500 mt-1">
                            Order #{order.orderNumber}
                        </p>
                    </div>

                    <Link
                        href={`/order-details/${order._id}`}
                        className="text-purple-700 font-semibold hover:underline"
                    >
                        Order Details
                    </Link>

                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                        Order Information
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <div>
                            <p className="text-sm text-gray-500">Order Number</p>
                            <p className="font-semibold text-gray-800">
                                {order.orderNumber}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Order Date</p>
                            <p className="font-semibold text-gray-800">
                                {formatDate(order.createdAt) || 'Not available'}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Total Amount</p>
                            <p className="font-semibold text-gray-800">
                                ₹{order.totalAmount}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Payment Method</p>
                            <p className="font-semibold text-gray-800">
                                {order.paymentMethod || 'Not available'}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Payment Status</p>
                            <p className="font-semibold text-gray-800">
                                {order.paymentStatus || 'Not available'}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Order Status</p>
                            <p className="font-semibold text-purple-700 capitalize">
                                {order.orderStatus}
                            </p>
                        </div>

                    </div>

                </div>

                {/* Cancelled Order */}
                {isCancelled && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">

                        <h2 className="text-lg font-bold text-red-600">
                            Order Cancelled
                        </h2>

                        <p className="text-gray-700 mt-2">
                            {order.cancellationReason || 'This order has been cancelled.'}
                        </p>

                        <p className="text-sm text-gray-500 mt-2">
                            {formatDate(order.cancelledAt)}
                        </p>

                    </div>
                )}

                {/* Failed Delivery */}
                {!isCancelled && isFailed && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">

                        <h2 className="text-lg font-bold text-red-600">
                            Delivery Failed
                        </h2>

                        <p className="text-gray-600 mt-2">
                            The delivery attempt was unsuccessful.
                        </p>

                    </div>
                )}

                {/* Order Timeline */}
                {!isCancelled && (
                    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

                        <h2 className="text-xl font-bold text-gray-800 mb-6">
                            Order Tracking
                        </h2>

                        <div className="space-y-6">

                            {orderSteps.map((step, index) => {

                                const completed =
                                    currentOrderIndex !== -1 &&
                                    index <= currentOrderIndex

                                const stepDate = orderDates[step.status]

                                return (
                                    <div key={step.status} className="flex gap-4">

                                        <div className="flex flex-col items-center">

                                            <div
                                                className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${
                                                    completed
                                                        ? 'bg-green-500'
                                                        : 'bg-gray-300'
                                                }`}
                                            >
                                                {completed ? '✓' : index + 1}
                                            </div>

                                            {index !== orderSteps.length - 1 && (
                                                <div
                                                    className={`w-1 h-12 ${
                                                        completed
                                                            ? 'bg-green-500'
                                                            : 'bg-gray-200'
                                                    }`}
                                                />
                                            )}

                                        </div>

                                        <div className="pb-4">

                                            <h3
                                                className={`font-semibold ${
                                                    completed
                                                        ? 'text-green-600'
                                                        : 'text-gray-500'
                                                }`}
                                            >
                                                {step.label}
                                            </h3>

                                            <p className="text-sm text-gray-500">
                                                {step.description}
                                            </p>

                                            {stepDate && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDate(stepDate)}
                                                </p>
                                            )}

                                        </div>

                                    </div>
                                )
                            })}

                        </div>

                    </div>
                )}

                {/* Delivery Timeline */}
                {!isCancelled && order.delivery && (
                    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

                        <h2 className="text-xl font-bold text-gray-800 mb-6">
                            Delivery Tracking
                        </h2>

                        <div className="space-y-6">

                            {deliverySteps.map((step, index) => {

                                const completed =
                                    currentDeliveryIndex !== -1 &&
                                    index <= currentDeliveryIndex

                                const stepDate = deliveryDates[step.status]

                                return (
                                    <div key={step.status} className="flex gap-4">

                                        <div className="flex flex-col items-center">

                                            <div
                                                className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${
                                                    completed
                                                        ? 'bg-purple-600'
                                                        : 'bg-gray-300'
                                                }`}
                                            >
                                                {completed ? '✓' : index + 1}
                                            </div>

                                            {index !== deliverySteps.length - 1 && (
                                                <div
                                                    className={`w-1 h-12 ${
                                                        completed
                                                            ? 'bg-purple-600'
                                                            : 'bg-gray-200'
                                                    }`}
                                                />
                                            )}

                                        </div>

                                        <div className="pb-4">

                                            <h3
                                                className={`font-semibold ${
                                                    completed
                                                        ? 'text-purple-700'
                                                        : 'text-gray-500'
                                                }`}
                                            >
                                                {step.label}
                                            </h3>

                                            {stepDate && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDate(stepDate)}
                                                </p>
                                            )}

                                        </div>

                                    </div>
                                )
                            })}

                        </div>

                    </div>
                )}

                {!order.delivery && !isCancelled && !isDelivered && (
                    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">

                        <h2 className="font-bold text-gray-800">
                            Delivery Tracking
                        </h2>

                        <p className="text-gray-500 text-sm mt-2">
                            Delivery partner has not been assigned yet.
                        </p>

                    </div>
                )}

                {/* Refresh Information */}
                <p className="text-center text-sm text-gray-400 mb-6">
                    Tracking information refreshes automatically every 10 seconds.
                </p>

                {/* Back Button */}
                <div className="text-center">

                    <Link
                        href="/my-orders"
                        className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold"
                    >
                        Back to My Orders
                    </Link>

                </div>

            </div>

        </div>
    )
}