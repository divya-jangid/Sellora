
'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const API = 'http://localhost:8000'

export default function OrderDetails() {
    const { id } = useParams()

    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!id) return

        let isMounted = true

        const getOrderDetails = async (isInitial = false) => {
            try {
                if (isInitial) {
                    setLoading(true)
                    setError('')
                }

                const res = await axios.get(
                    `${API}/order/details/${id}`,
                    { withCredentials: true }
                )

                if (isMounted) {
                    setOrder(res.data.order)
                    setError('')
                }
            } catch (err) {
                if (isMounted && isInitial) {
                    setError(
                        err.response?.data?.message ||
                        'Order details load nahi ho paaye.'
                    )
                }
            } finally {
                if (isMounted && isInitial) {
                    setLoading(false)
                }
            }
        }

        // First API call
        getOrderDetails(true)

        // Auto refresh every 10 seconds
        const interval = setInterval(() => {
            getOrderDetails(false)
        }, 10000)

        return () => {
            isMounted = false
            clearInterval(interval)
        }
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <p className="text-gray-600">
                    Loading order details...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <p className="text-red-500">{error}</p>
            </div>
        )
    }

    if (!order) return null

    const deliverySteps = [
        'ASSIGNED',
        'ACCEPTED',
        'PICKED_UP',
        'OUT_FOR_DELIVERY',
        'DELIVERED'
    ]

    const currentStatus = order.delivery?.deliveryStatus

    const currentStep = deliverySteps.indexOf(currentStatus)

    const isFailed = ['FAILED', 'CANCELLED'].includes(currentStatus)

    // Cancellation allowed only for placed and confirmed orders
    const canCancelOrder = ['placed', 'confirmed'].includes(
        order.orderStatus
    )

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">

                <h1 className="text-2xl font-bold text-gray-800 mb-6">
                    Order Details
                </h1>

                {/* Order Information */}
                <div className="bg-white rounded-lg shadow p-5 mb-6">

                    <h2 className="text-lg font-semibold mb-4">
                        Order Information
                    </h2>

                    <div className="space-y-3 text-gray-700">

                        <p>
                            <strong>Order Number:</strong>{' '}
                            {order.orderNumber}
                        </p>

                        <p>
                            <strong>Order Date:</strong>{' '}
                            {new Date(order.createdAt).toLocaleDateString()}
                        </p>

                        {/* Order Status + Cancel Button */}
                        <div className="flex flex-wrap items-center justify-between gap-3">

                            <p>
                                <strong>Order Status:</strong>{' '}
                                <span className="capitalize">
                                    {order.orderStatus}
                                </span>
                            </p>

                            {canCancelOrder && (
                                <Link
                                    href={`/cancel-order/${order._id}`}
                                    className="rounded-lg bg-red-100 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-200 transition"
                                >
                                    Cancel Order
                                </Link>
                            )}

                        </div>

                        <p>
                            <strong>Payment Method:</strong>{' '}
                            {order.paymentMethod}
                        </p>

                        <p>
                            <strong>Payment Status:</strong>{' '}
                            {order.paymentStatus}
                        </p>

                        <p>
                            <strong>Total Amount:</strong>{' '}
                            ₹{order.totalAmount}
                        </p>

                    </div>
                </div>

                {/* Store Details */}
                <div className="bg-white rounded-lg shadow p-5 mb-6">

                    <h2 className="text-lg font-semibold mb-4">
                        Store Details
                    </h2>

                    <p>
                        {order.store?.name || 'Store information unavailable'}
                    </p>

                    <p>{order.store?.phone || ''}</p>

                </div>

                {/* Delivery Address */}
                <div className="bg-white rounded-lg shadow p-5 mb-6">

                    <h2 className="text-lg font-semibold mb-4">
                        Delivery Address
                    </h2>

                    <p>{order.address?.name || ''}</p>

                    <p>{order.address?.phone || ''}</p>

                    <p>{order.address?.address || ''}</p>

                </div>

                {/* Ordered Products */}
                <div className="bg-white rounded-lg shadow p-5 mb-6">

                    <h2 className="text-lg font-semibold mb-4">
                        Ordered Products
                    </h2>

                    {order.items?.length > 0 ? (
                        order.items.map((item) => (
                            <div
                                key={item._id}
                                className="border-b py-3 last:border-b-0"
                            >

                                <p className="font-medium text-gray-800">
                                    {item.product?.name || 'Product'}
                                </p>

                                <p className="text-gray-600">
                                    Quantity: {item.quantity}
                                </p>

                                <p className="text-gray-600">
                                    Price: ₹{item.price}
                                </p>

                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">
                            No products found.
                        </p>
                    )}

                </div>

                {/* Delivery Tracking */}
                <div className="bg-white rounded-lg shadow p-5 mb-6">

                    <h2 className="text-lg font-semibold mb-4">
                        Delivery Tracking
                    </h2>

                    {!order.delivery ? (
                        <p className="text-yellow-600 font-medium">
                            Waiting for delivery partner assignment.
                        </p>
                    ) : (
                        <>

                            <p className="font-medium mb-5">
                                Current Status:{' '}
                                <span className="text-green-600">
                                    {currentStatus}
                                </span>
                            </p>

                            {isFailed ? (
                                <p className="text-red-500 font-medium">
                                    Delivery {currentStatus.toLowerCase()}.
                                </p>
                            ) : (
                                <div className="space-y-4">

                                    {deliverySteps.map((step, index) => {
                                        const completed = currentStep >= index

                                        return (
                                            <div
                                                key={step}
                                                className="flex items-center gap-3"
                                            >

                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                                        completed
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-gray-200 text-gray-500'
                                                    }`}
                                                >
                                                    {completed ? '✓' : index + 1}
                                                </div>

                                                <p
                                                    className={`font-medium ${
                                                        completed
                                                            ? 'text-green-600'
                                                            : 'text-gray-400'
                                                    }`}
                                                >
                                                    {step.replaceAll('_', ' ')}
                                                </p>

                                            </div>
                                        )
                                    })}

                                </div>
                            )}

                        </>
                    )}

                </div>

                <p className="text-center text-sm text-gray-400">
                    Order status refreshes automatically every 10 seconds.
                </p>

            </div>
        </div>
    )
}
