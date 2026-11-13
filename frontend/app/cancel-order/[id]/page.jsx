
'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

const API = 'http://localhost:8000'

const cancellationReasons = [
    'Ordered by mistake',
    'Found a better price',
    'Delivery is taking too long',
    'Want to change delivery address',
    'Want to change payment method',
    'Product no longer needed',
    'Other'
]

export default function CancelOrder() {
    const { id } = useParams()
    const router = useRouter()

    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedReason, setSelectedReason] = useState('')
    const [otherReason, setOtherReason] = useState('')
    const [cancelLoading, setCancelLoading] = useState(false)
    const [error, setError] = useState('')

    // Fetch order details
    useEffect(() => {
        if (!id) return

        const getOrderDetails = async () => {
            try {
                const res = await axios.get(
                    `${API}/order/details/${id}`,
                    { withCredentials: true }
                )

                setOrder(res.data.order)
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Order details load nahi ho paaye.'
                )
            } finally {
                setLoading(false)
            }
        }

        getOrderDetails()
    }, [id])

    // Confirm cancellation
    const handleCancelOrder = async () => {
        if (!selectedReason) {
            toast.error('Please select a cancellation reason.')
            return
        }

        if (selectedReason === 'Other' && !otherReason.trim()) {
            toast.error('Please enter your cancellation reason.')
            return
        }

        const cancellationReason =
            selectedReason === 'Other'
                ? otherReason.trim()
                : selectedReason

    

        try {
            setCancelLoading(true)

            const res = await axios.put(
                `${API}/order/cancel/${id}`,
                { cancellationReason },
                { withCredentials: true }
            )

            toast.success(res.data.message || 'Order cancelled successfully.')

            router.push('/my-orders')

        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                'Order cancel nahi ho paaya.'
            )
        } finally {
            setCancelLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-purple-50">
                <p className="text-purple-700 font-medium">
                    Loading order details...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center gap-4">
                <p className="text-red-600">{error}</p>

                <Link
                    href="/my-orders"
                    className="text-purple-700 font-semibold hover:underline"
                >
                    Back to My Orders
                </Link>
            </div>
        )
    }

    if (!order) return null

    const canCancel = ['placed', 'confirmed'].includes(
        order.orderStatus?.toLowerCase()
    )

    if (!canCancel) {
        return (
            <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center gap-4 px-4">
                <h2 className="text-xl font-bold text-gray-800">
                    Order cannot be cancelled
                </h2>

                <p className="text-gray-600 text-center">
                    This order is already {order.orderStatus}.
                </p>

                <Link
                    href={`/order-details/${id}`}
                    className="rounded-lg bg-purple-600 px-5 py-2.5 text-white font-semibold"
                >
                    Back to Order Details
                </Link>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-purple-50 px-4 py-8">

            <div className="mx-auto max-w-3xl">

                {/* Header */}
                <div className="mb-6">
                    <Link
                        href={`/order-details/${id}`}
                        className="text-sm font-medium text-purple-700 hover:underline"
                    >
                        ← Back to Order Details
                    </Link>

                    <h1 className="mt-4 text-2xl font-bold text-gray-900">
                        Cancel Order
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Please tell us why you want to cancel this order.
                    </p>
                </div>

                {/* Order Summary */}
                <div className="mb-6 rounded-xl border border-purple-100 bg-white p-5 shadow-sm">

                    <h2 className="mb-4 text-lg font-semibold text-gray-800">
                        Order Summary
                    </h2>

                    <div className="space-y-3 text-sm">

                        <div className="flex justify-between gap-3">
                            <span className="text-gray-500">
                                Order Number
                            </span>

                            <span className="font-semibold text-gray-800 text-right">
                                {order.orderNumber || order._id}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">
                                Order Date
                            </span>

                            <span className="font-medium text-gray-800">
                                {new Date(order.createdAt).toLocaleDateString('en-IN')}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">
                                Payment Method
                            </span>

                            <span className="font-medium text-gray-800">
                                {order.paymentMethod === 'COD'
                                    ? 'Cash on Delivery'
                                    : order.paymentMethod}
                            </span>
                        </div>

                        <div className="flex justify-between border-t pt-3">
                            <span className="font-semibold text-gray-700">
                                Total Amount
                            </span>

                            <span className="font-bold text-purple-700">
                                ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                            </span>
                        </div>

                    </div>

                    {/* Products */}
                    <div className="mt-5 border-t pt-4">

                        <h3 className="mb-3 font-semibold text-gray-800">
                            Ordered Products
                        </h3>

                        {order.items?.length > 0 ? (
                            order.items.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex justify-between gap-3 border-b py-3 last:border-b-0"
                                >
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {item.product?.name || 'Product'}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                            Quantity: {item.quantity}
                                        </p>
                                    </div>

                                    <p className="font-semibold text-gray-700">
                                        ₹{item.price}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500">
                                No products found.
                            </p>
                        )}

                    </div>

                </div>

                {/* Cancellation Reason */}
                <div className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm">

                    <h2 className="text-lg font-semibold text-gray-800">
                        Reason for Cancellation
                    </h2>

                    <p className="mt-1 mb-4 text-sm text-gray-500">
                        Select the reason that best describes your cancellation.
                    </p>

                    <div className="space-y-3">

                        {cancellationReasons.map((reason) => (
                            <label
                                key={reason}
                                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                                    selectedReason === reason
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-gray-200 hover:border-purple-300'
                                }`}
                            >

                                <input
                                    type="radio"
                                    name="cancellationReason"
                                    value={reason}
                                    checked={selectedReason === reason}
                                    onChange={() => setSelectedReason(reason)}
                                    className="h-4 w-4 accent-purple-600"
                                />

                                <span className="text-sm font-medium text-gray-700">
                                    {reason}
                                </span>

                            </label>
                        ))}

                    </div>

                    {/* Other Reason */}
                    {selectedReason === 'Other' && (
                        <div className="mt-4">

                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Enter Your Reason
                            </label>

                            <textarea
                                value={otherReason}
                                onChange={(e) => setOtherReason(e.target.value)}
                                placeholder="Please tell us your reason..."
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-purple-500"
                            />

                        </div>
                    )}

                    {/* Payment Information */}
                    <div className="mt-5 rounded-lg bg-yellow-50 p-4">

                        <h3 className="font-semibold text-gray-800">
                            Payment Information
                        </h3>

                        {order.paymentMethod === 'COD' ? (
                            <p className="mt-1 text-sm text-gray-600">
                                Since this is a Cash on Delivery order, no payment has been collected yet.
                            </p>
                        ) : (
                            <p className="mt-1 text-sm text-gray-600">
                                Your payment status is {order.paymentStatus}. Refund processing is not currently handled by this cancellation feature. Please contact support for payment assistance.
                            </p>
                        )}

                    </div>

                    {/* Buttons */}
                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                        <Link
                            href={`/order-details/${id}`}
                            className="rounded-lg border border-gray-300 px-5 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Go Back
                        </Link>

                        <button
                            onClick={handleCancelOrder}
                            disabled={cancelLoading}
                            className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {cancelLoading
                                ? 'Cancelling...'
                                : 'Confirm Cancellation'}
                        </button>

                    </div>

                </div>

            </div>

        </main>
    )
}
