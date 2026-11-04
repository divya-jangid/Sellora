
'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'

import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import Card from '../components/Card'

const Dashboard = () => {
    const [user, setUser] = useState(null)
    const [dashboardData, setDashboardData] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Normalize role name
    const normalizeRole = (role = '') => {
        return role.toLowerCase().trim().replace(/[\s_-]/g, '')
    }

    // Fetch user and dashboard data
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true)
                setError('')

                // Get logged-in user
                const userRes = await axios.get(
                    'http://localhost:8000/user/check-user',
                    { withCredentials: true }
                )

                if (!userRes.data.status) {
                    throw new Error('Unable to fetch user details')
                }

                const loggedInUser = userRes.data.user
                setUser(loggedInUser)

                // Get dashboard statistics
                const dashboardRes = await axios.get(
                    'http://localhost:8000/dashboard/stats',
                    { withCredentials: true }
                )

                if (dashboardRes.data.success) {
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

    // Role-wise cards
    const getDashboardCards = () => {
        const role = normalizeRole(
            user?.roleName || user?.role?.name || ''
        )

        // Super Admin and Admin
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
                }
            ]
        }

        // Store Manager
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

        // Delivery Partner
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
        <div className="h-screen flex flex-col overflow-hidden bg-slate-50">

            <Header />

            <div className="flex flex-1 min-h-0 overflow-hidden">

                <Sidebar />

                <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">

                    {/* Welcome Section */}
                    <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 p-6 sm:p-8 text-white shadow-lg shadow-indigo-200">

                        <div className="relative z-10">
                            <p className="mb-2 text-sm font-medium text-indigo-100">
                                {roleName.toUpperCase()} DASHBOARD
                            </p>

                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Hello {user?.firstName || 'User'}! 👋
                            </h1>

                            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                                Welcome to your {roleName} dashboard.
                                {dashboardData.storeName
                                    ? ` You are managing ${dashboardData.storeName}.`
                                    : ' Here is your dashboard overview.'}
                            </p>
                        </div>

                        <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
                        <div className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/10" />

                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                            <p className="text-slate-600">
                                Loading dashboard data...
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Dashboard Cards */}
                    {!loading && !error && (
                        <>
                            {cards.length > 0 ? (
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                                    {cards.map((item) => (
                                        <Card
                                            key={item.title}
                                            title={item.title}
                                            value={item.value}
                                            icon={item.icon}
                                            iconBg={item.iconBg}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                                    <p className="text-slate-600">
                                        No dashboard data available for this role.
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                </main>

            </div>

            <Footer />

        </div>
    )
}

export default Dashboard
