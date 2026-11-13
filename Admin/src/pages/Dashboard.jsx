
'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'

const Dashboard = () => {
    const { user } = useAuth()

    const [dashboardData, setDashboardData] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [isAvailable, setIsAvailable] = useState(false)
    const [availabilityLoading, setAvailabilityLoading] = useState(false)
    const [showLowStock, setShowLowStock] = useState(false)

    const DELIVERY_PARTNER_API = 'http://localhost:8000/deliverypartner'

    const normalizeRole = (role = '') => {
        return role.toLowerCase().trim().replace(/[\s_-]/g, '')
    }

    const role = normalizeRole(
        user?.roleName || user?.role?.name || ''
    )

    const isDeliveryPartner = role === 'deliverypartner'

    const canViewLowStock = [
        'superadmin',
        'admin',
        'storemanager'
    ].includes(role)

    // FETCH DASHBOARD DATA
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true)
                setError('')

                const dashboardRes = await axios.get(
                    'http://localhost:8000/dashboard/stats',
                    { withCredentials: true }
                )

                if (dashboardRes.data.success || dashboardRes.data.status) {
                    setDashboardData(dashboardRes.data.data || {})
                } else {
                    throw new Error(
                        dashboardRes.data.message || 'Unable to fetch dashboard data'
                    )
                }

            } catch (error) {
                console.error('Dashboard error:', error)

                setError(
                    error.response?.data?.message ||
                    error.message ||
                    'Something went wrong'
                )
            } finally {
                setLoading(false)
            }
        }

        fetchDashboard()
    }, [])

    // FETCH DELIVERY PARTNER AVAILABILITY
    useEffect(() => {
        if (!isDeliveryPartner) return

        const fetchAvailability = async () => {
            try {
                const res = await axios.get(
                    `${DELIVERY_PARTNER_API}/my-availability`,
                    { withCredentials: true }
                )

                const data = res.data.data || res.data

                setIsAvailable(
                    data.isAvailable ?? data.deliveryPartner?.isAvailable ?? false
                )

            } catch (error) {
                console.error('Availability error:', error)
            }
        }

        fetchAvailability()
    }, [isDeliveryPartner])

    // TOGGLE AVAILABILITY
    const handleAvailability = async () => {
        try {
            setAvailabilityLoading(true)

            const res = await axios.put(
                `${DELIVERY_PARTNER_API}/availability-status`,
                { isAvailable: !isAvailable },
                { withCredentials: true }
            )

            if (res.data.success || res.data.status) {
                const data = res.data.data || res.data

                setIsAvailable(
                    data.isAvailable ?? data.deliveryPartner?.isAvailable ?? !isAvailable
                )
            } else {
                throw new Error(
                    res.data.message || 'Unable to update availability'
                )
            }

        } catch (error) {
            console.error('Availability update error:', error)

            toast.error(
                error.response?.data?.message ||
                error.message ||
                'Unable to update availability'
            )
        } finally {
            setAvailabilityLoading(false)
        }
    }

    const lowStockProducts = dashboardData.lowStockProducts || []
    const lowStockCount = lowStockProducts.length

    // ROLE-WISE DASHBOARD CARDS
    const getDashboardCards = () => {

        // SUPER ADMIN AND ADMIN
        if (role === 'superadmin' || role === 'admin') {
            return [
                {
                    title: 'Total Users',
                    value: dashboardData.totalUsers ?? 0,
                    icon: '👥',
                    iconBg: 'bg-indigo-50'
                },
                {
                    title: 'Total Products',
                    value: dashboardData.totalProducts ?? 0,
                    icon: '📦',
                    iconBg: 'bg-emerald-50'
                },
                {
                    title: 'Active Products',
                    value: dashboardData.activeProducts ?? 0,
                    icon: '✅',
                    iconBg: 'bg-sky-50'
                },
                {
                    title: 'Out of Stock',
                    value: dashboardData.outOfStockProducts ?? 0,
                    icon: '⚠️',
                    iconBg: 'bg-amber-50'
                },
                {
                    title: 'Total Stores',
                    value: dashboardData.totalStores ?? 0,
                    icon: '🏬',
                    iconBg: 'bg-violet-50'
                },
                {
                    title: 'Active Stores',
                    value: dashboardData.activeStores ?? 0,
                    icon: '🏪',
                    iconBg: 'bg-emerald-50'
                },
                {
                    title: 'Total Orders',
                    value: dashboardData.totalOrders ?? 0,
                    icon: '🛒',
                    iconBg: 'bg-indigo-50'
                },
                {
                    title: 'Pending Orders',
                    value: dashboardData.pendingOrders ?? 0,
                    icon: '⏳',
                    iconBg: 'bg-amber-50'
                },
                {
                    title: 'Delivered Orders',
                    value: dashboardData.deliveredOrders ?? 0,
                    icon: '🚚',
                    iconBg: 'bg-emerald-50'
                },
                {
                    title: 'Cancelled Orders',
                    value: dashboardData.cancelledOrders ?? 0,
                    icon: '❌',
                    iconBg: 'bg-rose-50'
                },
                {
                    title: 'Total Inventory',
                    value: dashboardData.totalInventory ?? 0,
                    icon: '📋',
                    iconBg: 'bg-sky-50'
                },
                {
                    title: 'Low Stock Items',
                    value: dashboardData.lowStockItems ?? 0,
                    icon: '⚠️',
                    iconBg: 'bg-amber-50'
                }
            ]
        }

        // STORE MANAGER
        if (role === 'storemanager') {
            return [
                {
                    title: 'Total Orders',
                    value: dashboardData.totalOrders ?? 0,
                    icon: '🛒',
                    iconBg: 'bg-indigo-50'
                },
                {
                    title: 'Pending Orders',
                    value: dashboardData.pendingOrders ?? 0,
                    icon: '⏳',
                    iconBg: 'bg-amber-50'
                },
                {
                    title: 'Delivered Orders',
                    value: dashboardData.deliveredOrders ?? 0,
                    icon: '🚚',
                    iconBg: 'bg-emerald-50'
                },
                {
                    title: 'Cancelled Orders',
                    value: dashboardData.cancelledOrders ?? 0,
                    icon: '❌',
                    iconBg: 'bg-rose-50'
                },
                {
                    title: 'Total Products',
                    value: dashboardData.totalProducts ?? 0,
                    icon: '📦',
                    iconBg: 'bg-sky-50'
                },
                {
                    title: 'Total Inventory',
                    value: dashboardData.totalInventory ?? 0,
                    icon: '📋',
                    iconBg: 'bg-indigo-50'
                },
                {
                    title: 'Low Stock Items',
                    value: dashboardData.lowStockItems ?? 0,
                    icon: '⚠️',
                    iconBg: 'bg-amber-50'
                },
                {
                    title: 'Out of Stock Items',
                    value: dashboardData.outOfStockItems ?? 0,
                    icon: '❌',
                    iconBg: 'bg-rose-50'
                }
            ]
        }

        // DELIVERY PARTNER
        if (role === 'deliverypartner') {
            return [
                {
                    title: 'Assigned Orders',
                    value: dashboardData.assignedOrders ?? 0,
                    icon: '📦',
                    iconBg: 'bg-indigo-50'
                },
                {
                    title: 'Pending Deliveries',
                    value: dashboardData.pendingDeliveries ?? 0,
                    icon: '⏳',
                    iconBg: 'bg-amber-50'
                },
                {
                    title: 'Delivered Orders',
                    value: dashboardData.deliveredOrders ?? 0,
                    icon: '🚚',
                    iconBg: 'bg-emerald-50'
                },
                {
                    title: 'Cancelled Orders',
                    value: dashboardData.cancelledOrders ?? 0,
                    icon: '❌',
                    iconBg: 'bg-rose-50'
                }
            ]
        }

        return []
    }

    const cards = getDashboardCards()
    const roleName = user?.roleName || user?.role?.name || 'User'

    return (
        <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-slate-50 min-h-screen">

            <main className="w-full min-w-0 p-3 sm:p-5 md:p-6 lg:p-8">

                {/* WELCOME SECTION */}
                <div className="relative mb-5 sm:mb-7 lg:mb-8 overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 p-4 sm:p-6 lg:p-8 text-white shadow-lg shadow-indigo-200">

                    <div className="relative z-10">

                        <p className="mb-2 text-xs sm:text-sm font-medium text-indigo-100 break-words">
                            {roleName.toUpperCase()} DASHBOARD
                        </p>

                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight break-words">
                            Hello {user?.firstName || 'User'}! 👋
                        </h1>

                        <p className="mt-2 sm:mt-3 max-w-xl text-xs sm:text-sm lg:text-base leading-5 sm:leading-6 text-indigo-100">
                            Welcome to your {roleName} dashboard.
                            {dashboardData.storeName
                                ? ` You are managing ${dashboardData.storeName}.`
                                : ' Here is your dashboard overview.'}
                        </p>

                    </div>

                    <div className="absolute -right-10 -top-16 h-32 w-32 sm:h-48 sm:w-48 rounded-full bg-white/10" />
                    <div className="absolute -bottom-20 right-10 sm:right-24 h-28 w-28 sm:h-40 sm:w-40 rounded-full bg-white/10" />

                </div>

                {/* DELIVERY PARTNER AVAILABILITY */}
                {isDeliveryPartner && (
                    <div className="mb-5 sm:mb-7 lg:mb-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

                        <div className="min-w-0">

                            <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                                Delivery Availability
                            </h2>

                            <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                {isAvailable
                                    ? 'You are available to receive new delivery orders.'
                                    : 'You are currently unavailable for new delivery orders.'}
                            </p>

                            <p className={`mt-2 text-sm font-semibold ${
                                isAvailable ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                                ● {isAvailable ? 'Available' : 'Unavailable'}
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={handleAvailability}
                            disabled={availabilityLoading}
                            className={`w-full sm:w-auto shrink-0 rounded-lg px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                isAvailable
                                    ? 'bg-rose-500 hover:bg-rose-600'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                        >
                            {availabilityLoading
                                ? 'Please wait...'
                                : isAvailable
                                    ? 'Go Unavailable'
                                    : 'Go Available'}
                        </button>

                    </div>
                )}

                {/* LOADING */}
                {loading && (
                    <div className="rounded-xl bg-white p-6 sm:p-8 text-center shadow-sm">
                        <p className="text-sm sm:text-base text-slate-600">
                            Loading dashboard data...
                        </p>
                    </div>
                )}

                {/* ERROR */}
                {!loading && error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5 text-sm sm:text-base text-red-600 break-words">
                        {error}
                    </div>
                )}

                {/* DASHBOARD CARDS */}
                {!loading && !error && (
                    <>
                        {cards.length > 0 ? (

                            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">

                                {cards.map((item) => {

                                    const isLowStockCard = item.title === 'Low Stock Items'
                                    const canExpand = isLowStockCard && lowStockCount > 0

                                    return (
                                        <div
                                            key={item.title}
                                            className={`min-w-0 rounded-xl border bg-white p-4 sm:p-5 shadow-sm transition ${
                                                canExpand
                                                    ? 'cursor-pointer border-slate-200 hover:-translate-y-1 hover:shadow-md'
                                                    : 'border-slate-200'
                                            } ${
                                                isLowStockCard && showLowStock
                                                    ? 'border-amber-400 ring-2 ring-amber-100'
                                                    : ''
                                            }`}
                                            onClick={
                                                canExpand
                                                    ? () => setShowLowStock(prev => !prev)
                                                    : undefined
                                            }
                                            role={canExpand ? 'button' : undefined}
                                            tabIndex={canExpand ? 0 : undefined}
                                            onKeyDown={
                                                canExpand
                                                    ? (e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault()
                                                            setShowLowStock(prev => !prev)
                                                        }
                                                    }
                                                    : undefined
                                            }
                                            aria-expanded={canExpand ? showLowStock : undefined}
                                        >

                                            <div className="flex items-center justify-between gap-2">

                                                <div className="min-w-0">

                                                    <p className="text-xs sm:text-sm font-medium text-slate-500 break-words">
                                                        {item.title}
                                                    </p>

                                                    <h2 className="mt-2 text-xl sm:text-2xl font-bold text-slate-800">
                                                        {item.value}
                                                    </h2>

                                                    {isLowStockCard && (
                                                        <p className="mt-1 text-[10px] sm:text-xs text-indigo-600">
                                                            {lowStockCount === 0
                                                                ? 'All products well stocked'
                                                                : showLowStock
                                                                    ? 'Click to hide details'
                                                                    : 'Click to view details'}
                                                        </p>
                                                    )}

                                                </div>

                                                <div className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl text-xl sm:text-2xl ${item.iconBg}`}>
                                                    {item.icon}
                                                </div>

                                            </div>

                                        </div>
                                    )
                                })}

                            </div>

                        ) : (

                            <div className="rounded-xl bg-white p-6 sm:p-8 text-center shadow-sm">
                                <p className="text-sm sm:text-base text-slate-600">
                                    No dashboard data available for this role.
                                </p>
                            </div>

                        )}

                        {/* LOW STOCK DETAILS */}
                        {canViewLowStock && showLowStock && lowStockCount > 0 && (
                            <div className="mt-5 sm:mt-7 lg:mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">

                                    <div className="min-w-0">

                                        <h2 className="text-base sm:text-lg font-bold text-slate-800">
                                            Low Stock Products
                                        </h2>

                                        <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                            Products that have reached their reorder level.
                                        </p>

                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3">

                                        <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs sm:text-sm font-semibold text-amber-700">
                                            {lowStockCount} Items
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => setShowLowStock(false)}
                                            className="rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:bg-slate-100"
                                        >
                                            Close ✕
                                        </button>

                                    </div>

                                </div>

                                <div className="w-full overflow-x-auto">

                                    <table className="w-full min-w-[700px] text-left text-xs sm:text-sm">

                                        <thead className="bg-slate-50 text-slate-600">
                                            <tr>
                                                <th className="px-4 sm:px-5 py-3 sm:py-4 font-semibold">Product</th>
                                                <th className="px-4 sm:px-5 py-3 sm:py-4 font-semibold">Variant</th>
                                                <th className="px-4 sm:px-5 py-3 sm:py-4 font-semibold">Store</th>
                                                <th className="px-4 sm:px-5 py-3 sm:py-4 font-semibold">Available Stock</th>
                                                <th className="px-4 sm:px-5 py-3 sm:py-4 font-semibold">Reorder Level</th>
                                                <th className="px-4 sm:px-5 py-3 sm:py-4 font-semibold">Status</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">

                                            {lowStockProducts.map((item) => (
                                                <tr
                                                    key={item._id}
                                                    className="transition hover:bg-slate-50"
                                                >

                                                    <td className="px-4 sm:px-5 py-3 sm:py-4 font-medium text-slate-800">
                                                        {item.product?.name || 'N/A'}
                                                    </td>

                                                    <td className="px-4 sm:px-5 py-3 sm:py-4 text-slate-600">
                                                        {item.variant?.name || 'N/A'}
                                                    </td>

                                                    <td className="px-4 sm:px-5 py-3 sm:py-4 text-slate-600">
                                                        {item.store?.name || 'N/A'}
                                                    </td>

                                                    <td className="px-4 sm:px-5 py-3 sm:py-4">
                                                        <span className="font-bold text-rose-600">
                                                            {item.availableQuantity}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 sm:px-5 py-3 sm:py-4 text-slate-600">
                                                        {item.reorderLevel}
                                                    </td>

                                                    <td className="px-4 sm:px-5 py-3 sm:py-4">
                                                        <span className="inline-flex whitespace-nowrap rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                                            Low Stock
                                                        </span>
                                                    </td>

                                                </tr>
                                            ))}

                                        </tbody>

                                    </table>

                                </div>

                            </div>
                        )}

                    </>
                )}

            </main>

        </div>
    )
}

export default Dashboard
