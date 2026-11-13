
'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const API = 'http://localhost:8000'

const deliverySteps = [
    'ASSIGNED',
    'ACCEPTED',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'DELIVERED'
]

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


                if (isMounted && res.data.status) {
                    console.log('Full Order:', res.data.order)
                    console.log('Delivery Address:', res.data.order.address)

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

        getOrderDetails(true)

        const interval = setInterval(() => {
            getOrderDetails(false)
        }, 10000)

        return () => {
            isMounted = false
            clearInterval(interval)
        }
    }, [id])

    const formatDate = (date) => {
        if (!date) return null

        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const badgeStyle = (status) => {
        const value = status?.toLowerCase()

        if (['delivered', 'success', 'paid'].includes(value)) {
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
                        Loading order details...
                    </p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#faf8ff] px-4">
                <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
                    <p className="text-3xl">⚠️</p>
                    <p className="mt-3 font-semibold text-red-600">
                        {error}
                    </p>

                    <Link
                        href="/my-orders"
                        className="mt-5 inline-flex rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-700"
                    >
                        Back to My Orders
                    </Link>
                </div>
            </div>
        )
    }

    if (!order) return null

    const currentStatus = order.delivery?.deliveryStatus

    const currentStep = deliverySteps.indexOf(currentStatus)

    const isFailed = ['FAILED', 'CANCELLED'].includes(currentStatus)

    const canCancelOrder = ['placed', 'confirmed'].includes(
        order.orderStatus?.toLowerCase()
    )

    const deliveryDates = {
        ASSIGNED: order.delivery?.createdAt,
        ACCEPTED: order.delivery?.pickupTime,
        PICKED_UP: order.delivery?.pickedUpAt,
        OUT_FOR_DELIVERY: order.delivery?.outForDeliveryAt,
        DELIVERED: order.delivery?.deliveredAt
    }

    const partner = order.deliveryPartner

    return (
        <main className="min-h-screen bg-[#faf8ff] px-3 py-6 sm:px-6 sm:py-9 lg:px-8">

            <div className="mx-auto max-w-6xl">

                {/* Breadcrumb */}
                <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400 sm:text-sm">
                    <Link href="/" className="hover:text-purple-600">
                        Home
                    </Link>
                    <span>/</span>
                    <Link href="/my-orders" className="hover:text-purple-600">
                        My Orders
                    </Link>
                    <span>/</span>
                    <span className="text-purple-700">
                        Order Details
                    </span>
                </div>

                {/* Page Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <p className="text-xs font-bold uppercase tracking-[2px] text-purple-600">
                            Sellora / Order Management
                        </p>

                        <h1 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                            Order Details
                        </h1>

                        <p className="mt-1 break-all text-sm text-gray-500">
                            Order #{order.orderNumber}
                        </p>
                    </div>

                    <Link
                        href="/my-orders"
                        className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-purple-200 bg-white px-5 py-3 text-sm font-bold text-purple-700 transition hover:bg-purple-50"
                    >
                        ← Back to My Orders
                    </Link>

                </div>

                {/* Order Status Banner */}
                <div className="mb-6 overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">

                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">

                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-2xl">
                                📦
                            </div>

                            <div>
                                <h2 className="font-bold text-gray-900">
                                    Your Order
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">
                                    Placed on {formatDate(order.createdAt) || 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-semibold text-gray-500">
                                Order Status
                            </span>

                            <span className={`rounded-full px-4 py-2 text-xs font-bold capitalize ${badgeStyle(order.orderStatus)}`}>
                                {order.orderStatus || 'Processing'}
                            </span>

                            {canCancelOrder && (
                                <Link
                                    href={`/cancel-order/${order._id}`}
                                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                                >
                                    Cancel Order
                                </Link>
                            )}
                        </div>

                    </div>

                    <div className="grid grid-cols-1 border-t border-gray-100 sm:grid-cols-3">

                        <div className="p-4 sm:border-r sm:border-gray-100 sm:px-6">
                            <p className="text-xs font-medium text-gray-500">
                                Order Number
                            </p>
                            <p className="mt-1 break-all text-sm font-bold text-gray-900">
                                {order.orderNumber}
                            </p>
                        </div>

                        <div className="border-t border-gray-100 p-4 sm:border-r sm:border-t-0 sm:px-6">
                            <p className="text-xs font-medium text-gray-500">
                                Payment Method
                            </p>
                            <p className="mt-1 text-sm font-bold text-gray-900">
                                {order.paymentMethod === 'COD'
                                    ? 'Cash on Delivery'
                                    : order.paymentMethod === 'online'
                                        ? 'Online Payment'
                                        : order.paymentMethod || 'N/A'}
                            </p>
                        </div>

                        <div className="border-t border-gray-100 p-4 sm:border-t-0 sm:px-6">
                            <p className="text-xs font-medium text-gray-500">
                                Payment Status
                            </p>
                            <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold capitalize ${badgeStyle(order.paymentStatus)}`}>
                                {order.paymentStatus || 'PENDING'}
                            </span>
                        </div>

                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                    {/* Left Content */}
                    <div className="space-y-6 lg:col-span-2">

                        {/* Ordered Products */}
                        <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">

                            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                                <h2 className="font-bold text-gray-900">
                                    Ordered Products
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">
                                    Products included in your order
                                </p>
                            </div>

                            <div className="divide-y divide-gray-100 px-4 sm:px-6">

                                {order.items?.length > 0 ? (
                                    order.items.map((item) => (
                                        <div
                                            key={item._id}
                                            className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
                                        >

                                            <div className="min-w-0">
                                                <p className="break-words text-sm font-bold text-gray-900 sm:text-base">
                                                    {item.product?.name || 'Product'}
                                                </p>

                                                <p className="mt-2 text-xs text-gray-500">
                                                    Quantity: <span className="font-semibold text-gray-700">{item.quantity}</span>
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between gap-4 sm:justify-end">
                                                <p className="text-xs text-gray-500">
                                                    Item Price
                                                </p>

                                                <p className="text-base font-extrabold text-purple-700">
                                                    ₹{Number(item.price || 0).toLocaleString('en-IN')}
                                                </p>
                                            </div>

                                        </div>
                                    ))
                                ) : (
                                    <p className="py-8 text-center text-sm text-gray-500">
                                        No products found.
                                    </p>
                                )}

                            </div>

                            {/* Total */}
                            <div className="flex items-center justify-between border-t border-gray-100 bg-purple-50/60 px-4 py-5 sm:px-6">
                                <p className="text-sm font-bold text-gray-700">
                                    Total Amount
                                </p>

                                <p className="text-xl font-extrabold text-purple-700">
                                    ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                                </p>
                            </div>

                        </section>

                        {/* Delivery Tracking */}
                        <section className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm sm:p-6">

                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-xl">
                                    🚚
                                </div>

                                <div>
                                    <h2 className="font-bold text-gray-900">
                                        Delivery Tracking
                                    </h2>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Track your order delivery progress
                                    </p>
                                </div>
                            </div>

                            {!order.delivery ? (
                                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                                    <p className="text-sm font-semibold text-amber-700">
                                        ⏳ Waiting for delivery partner assignment.
                                    </p>
                                </div>
                            ) : (
                                <>

                                    {/* Current Status */}
                                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-purple-50 p-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">
                                                Current Delivery Status
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-gray-900">
                                                {currentStatus?.replaceAll('_', ' ') || 'Processing'}
                                            </p>
                                        </div>

                                        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${badgeStyle(currentStatus)}`}>
                                            {currentStatus || 'Processing'}
                                        </span>
                                    </div>

                                    {/* Failed / Cancelled */}
                                    {isFailed ? (
                                        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                                            <p className="text-sm font-semibold text-red-600">
                                                Delivery {currentStatus?.toLowerCase()}.
                                                {currentStatus === 'CANCELLED' &&
                                                    ' Please wait for a new delivery partner assignment.'
                                                }
                                            </p>
                                        </div>
                                    ) : (

                                        /* Delivery Timeline */
                                        <div className="relative">

                                            {/* Desktop Timeline */}
                                            <div className="hidden grid-cols-5 gap-2 sm:grid">

                                                {deliverySteps.map((step, index) => {

                                                    const completed = currentStep >= index

                                                    return (
                                                        <div
                                                            key={step}
                                                            className="relative flex flex-col items-center text-center"
                                                        >

                                                            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-sm font-bold shadow-sm"
                                                                style={{
                                                                    backgroundColor: completed ? '#16a34a' : '#e5e7eb',
                                                                    color: completed ? '#ffffff' : '#6b7280'
                                                                }}
                                                            >
                                                                {completed ? '✓' : index + 1}
                                                            </div>

                                                            <p className={`mt-3 text-xs font-bold ${completed ? 'text-green-700' : 'text-gray-400'
                                                                }`}>
                                                                {step.replaceAll('_', ' ')}
                                                            </p>

                                                            {deliveryDates[step] && (
                                                                <p className="mt-2 text-[10px] leading-4 text-gray-400">
                                                                    {formatDate(deliveryDates[step])}
                                                                </p>
                                                            )}

                                                        </div>
                                                    )
                                                })}

                                            </div>

                                            {/* Mobile Timeline */}
                                            <div className="space-y-5 sm:hidden">

                                                {deliverySteps.map((step, index) => {

                                                    const completed = currentStep >= index

                                                    return (
                                                        <div
                                                            key={step}
                                                            className="flex items-start gap-3"
                                                        >

                                                            <div className="flex flex-col items-center">
                                                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${completed
                                                                    ? 'bg-green-500 text-white'
                                                                    : 'bg-gray-100 text-gray-400'
                                                                    }`}>
                                                                    {completed ? '✓' : index + 1}
                                                                </div>

                                                                {index !== deliverySteps.length - 1 && (
                                                                    <div className={`mt-1 h-7 w-0.5 ${completed ? 'bg-green-400' : 'bg-gray-200'
                                                                        }`}></div>
                                                                )}
                                                            </div>

                                                            <div className="min-w-0 pt-1">
                                                                <p className={`text-sm font-bold ${completed ? 'text-green-700' : 'text-gray-400'
                                                                    }`}>
                                                                    {step.replaceAll('_', ' ')}
                                                                </p>

                                                                {deliveryDates[step] && (
                                                                    <p className="mt-1 text-xs text-gray-400">
                                                                        {formatDate(deliveryDates[step])}
                                                                    </p>
                                                                )}
                                                            </div>

                                                        </div>
                                                    )
                                                })}

                                            </div>

                                        </div>
                                    )}

                                </>
                            )}

                        </section>

                        {/* Delivery Partner */}
                        <section className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm sm:p-6">

                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-xl">
                                    👤
                                </div>

                                <div>
                                    <h2 className="font-bold text-gray-900">
                                        Delivery Partner Details
                                    </h2>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Your delivery contact information
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
                                            {partner.firstName} {partner.lastName}
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
                                            📞 Call Partner
                                        </a>
                                    )}

                                </div>
                            ) : (
                                <div className="rounded-xl bg-gray-50 p-4">
                                    <p className="text-sm text-gray-600">
                                        Delivery partner has not been assigned yet.
                                    </p>
                                </div>
                            )}

                        </section>

                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">

                        {/* Store Details */}
                        <section className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">

                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-xl">
                                    🏬
                                </div>

                                <h2 className="font-bold text-gray-900">
                                    Store Details
                                </h2>
                            </div>

                            <p className="break-words font-bold text-gray-900">
                                {order.store?.name || 'Store information unavailable'}
                            </p>

                            {order.store?.phone && (
                                <p className="mt-3 text-sm text-gray-600">
                                    📞 {order.store.phone}
                                </p>
                            )}

                            {order.store?.address && (
                                <p className="mt-2 break-words text-sm leading-6 text-gray-500">
                                    📍 {order.store.address}
                                </p>
                            )}

                        </section>

                        {/* Delivery Address */}
                        <section className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">

                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-xl">
                                    📍
                                </div>

                                <h2 className="font-bold text-gray-900">
                                    Delivery Address
                                </h2>
                            </div>

                            <p className="font-bold text-gray-900">
                                {order.address?.name || 'N/A'}
                            </p>

                            {order.address?.phone && (
                                <p className="mt-2 text-sm text-gray-600">
                                    📞 {order.address.phone}
                                </p>
                            )}

                            <p className="text-sm text-gray-600">
                                {[
                                    order.address?.houseNumber,
                                    order.address?.street,
                                    order.address?.landmark,
                                    order.address?.city,
                                    order.address?.state,
                                    order.address?.pincode,
                                    order.address?.country
                                ].filter(Boolean).join(', ') || 'Address unavailable'}
                            </p>
                        </section>

                        {/* Payment Summary */}
                        <section className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">

                            <h2 className="mb-4 font-bold text-gray-900">
                                Payment Summary
                            </h2>

                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-gray-500">
                                    Payment Method
                                </p>

                                <p className="text-right text-sm font-semibold text-gray-800">
                                    {order.paymentMethod === 'COD'
                                        ? 'Cash on Delivery'
                                        : order.paymentMethod === 'online'
                                            ? 'Online'
                                            : order.paymentMethod || 'N/A'}
                                </p>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-3">
                                <p className="text-sm text-gray-500">
                                    Payment Status
                                </p>

                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badgeStyle(order.paymentStatus)}`}>
                                    {order.paymentStatus || 'PENDING'}
                                </span>
                            </div>

                            <div className="my-4 border-t border-dashed border-gray-200"></div>

                            <div className="flex items-center justify-between gap-3">
                                <p className="font-bold text-gray-800">
                                    Total Paid
                                </p>

                                <p className="text-xl font-extrabold text-purple-700">
                                    ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                                </p>
                            </div>

                        </section>

                    </div>

                </div>

                {/* Auto Refresh Info */}
                <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-center text-xs text-gray-400">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Order status refreshes automatically every 10 seconds.
                </div>

                {/* Bottom Button */}
                <div className="mt-5 flex justify-center">
                    <Link
                        href="/my-orders"
                        className="inline-flex w-full items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-purple-100 transition hover:bg-purple-700 sm:w-auto"
                    >
                        ← Back to My Orders
                    </Link>
                </div>

            </div>
        </main>
    )
}
