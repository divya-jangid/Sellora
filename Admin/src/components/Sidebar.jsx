
import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    ShoppingBag,
    LayoutGrid,
    Folder,
    ShieldCheck,
    Tags,
    Palette,
    Store,
    FileText,
    LogOut,
    ChevronRight,
    Package,
    Truck,
    ClipboardList,
    History
} from 'lucide-react'

import axios from 'axios'
import { toast } from 'react-hot-toast'

const Sidebar = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const [user, setUser] = useState(null)
    const [permissions, setPermissions] = useState([])
    const [loading, setLoading] = useState(true)

    // SIDEBAR REF
    const sidebarRef = useRef(null)

    // GET LOGGED-IN USER
    useEffect(() => {
        const checkUser = async () => {
            try {
                const res = await axios.get(
                    'http://localhost:8000/user/check-user',
                    { withCredentials: true }
                )

                const loggedInUser = res.data.user

                setUser(loggedInUser)
                setPermissions(loggedInUser.permissions || [])
            } catch (error) {
                console.log(error.response?.data || error.message)
                navigate('/')
            } finally {
                setLoading(false)
            }
        }

        checkUser()
    }, [navigate])

    // RESTORE SIDEBAR SCROLL POSITION
    useEffect(() => {
        if (!loading && sidebarRef.current) {
            const savedPosition =
                sessionStorage.getItem('sidebarScrollTop')

            sidebarRef.current.scrollTop =
                Number(savedPosition) || 0
        }
    }, [loading, location.pathname])

    // LOGOUT
    const handleLogout = async () => {
        try {
            await axios.post(
                'http://localhost:8000/admin/logout',
                {},
                { withCredentials: true }
            )

            sessionStorage.removeItem('sidebarScrollTop')

            setUser(null)
            setPermissions([])
            toast.success('Logout Successfully!', {
                duration: 3000
            })

            navigate('/')
        } catch (error) {
            console.log(error.response?.data || error.message)
        }
    }

    // ALL MENU ITEMS
    const menuItems = [
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard,
            permission: 'dashboard_view'
        },
        {
            name: 'User',
            path: '/user',
            icon: Users,
            permission: 'users_view'
        },
        {
            name: 'Products',
            path: '/products',
            icon: ShoppingCart,
            permission: 'products_view'
        },
        {
            name: 'Categories',
            path: '/category',
            icon: LayoutGrid,
            permission: 'categories_view'
        },
        {
            name: 'SubCategories',
            path: '/subcategories',
            icon: Folder,
            permission: 'subcategories_view'
        },
        {
            name: 'Role',
            path: '/role',
            icon: ShieldCheck,
            permission: 'roles_view'
        },
        {
            name: 'Brands',
            path: '/brand',
            icon: Tags,
            permission: 'brands_view'
        },
        {
            name: 'ProductVariant',
            path: '/productvariant',
            icon: Palette,
            permission: 'productvariant_view'
        },
        {
            name: 'Store',
            path: '/store',
            icon: Store,
            permission: 'store_view'
        },
        {
            name: 'Template',
            path: '/template',
            icon: FileText,
            permission: 'template_view'
        },
        {
            name: 'Inventory',
            path: '/inventory',
            icon: Package,
            permission: 'storeinventory_view'
        },
        {
            name: 'Orders',
            path: '/orders',
            icon: ShoppingBag,
            permission: 'orders_view'
        }
       
       
    ]

    // CHECK ROLE
    const roleName = (user?.roleName || '')
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .trim()

    const isSuperAdmin = roleName === 'super admin'

    // SHOW ONLY ALLOWED MENU ITEMS
    const filteredMenuItems = menuItems.filter((item) => {

        if (item.permission === 'roles_view') {
            return isSuperAdmin || permissions.includes('roles_view')
        }

        if (isSuperAdmin) {
            return true
        }

        return permissions.includes(item.permission)
    })

    if (loading) {
        return (
            <aside className="w-64 h-full flex-shrink-0 bg-slate-950 text-white flex items-center justify-center">
                Loading menu...
            </aside>
        )
    }

    return (
        <aside
            ref={sidebarRef}
            onScroll={(e) => {
                sessionStorage.setItem(
                    'sidebarScrollTop',
                    e.currentTarget.scrollTop
                )
            }}
            className="w-64 h-full flex-shrink-0 flex flex-col overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl"
        >

            {/* LOGO */}
            <div className="px-6 py-7 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <span className="text-2xl font-bold text-white">
                            S
                        </span>
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold tracking-wide">
                            Sellora
                        </h1>
                        <p className="text-xs text-indigo-300 mt-1">
                            Admin Panel
                        </p>
                    </div>
                </div>
            </div>

            {/* MENU */}
            <div className="flex-1 px-4 py-6">
                <p className="text-xs uppercase tracking-[2px] text-slate-500 font-semibold px-4 mb-4">
                    Main Menu
                </p>

                <div className="flex flex-col gap-2">
                    {filteredMenuItems.map((item) => {
                        const Icon = item.icon
                        const active = location.pathname === item.path

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${active
                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-950/50'
                                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon
                                        size={19}
                                        strokeWidth={2}
                                        className={
                                            active
                                                ? 'text-white'
                                                : 'text-indigo-300 group-hover:text-white'
                                        }
                                    />

                                    <span className="text-sm font-medium">
                                        {item.name}
                                    </span>
                                </div>

                                <ChevronRight
                                    size={16}
                                    className={`transition-transform ${active
                                        ? 'text-white'
                                        : 'text-slate-600 group-hover:text-white group-hover:translate-x-1'
                                        }`}
                                />
                            </Link>
                        )
                    })}

                    {filteredMenuItems.length === 0 && (
                        <p className="px-4 py-3 text-sm text-slate-400">
                            No pages assigned to your role.
                        </p>
                    )}
                </div>
            </div>

            {/* LOGOUT */}
            <div className="px-4 py-5 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-rose-400 bg-rose-500/10 border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all duration-200"
                >
                    <div className="flex items-center gap-3">
                        <LogOut size={19} />
                        <span className="text-sm font-semibold">
                            Logout
                        </span>
                    </div>

                    <ChevronRight size={16} />
                </button>
            </div>

        </aside>
    )
}

export default Sidebar
