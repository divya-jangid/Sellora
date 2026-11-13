
import React, { useState, useRef, useEffect } from 'react'
import {
    UserRound,
    LockKeyhole,
    LogOut,
    ChevronDown,
    Menu
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

const Header = ({ onMenuClick }) => {

    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    const roleName = user?.roleName || user?.role?.name || 'User'

    const [showProfile, setShowProfile] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfile(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    return (
        <nav className="relative z-40 min-h-16 sm:min-h-20 bg-gradient-to-r from-white via-indigo-50/50 to-violet-50 border-b border-indigo-100 shadow-sm flex items-center justify-between gap-2 px-3 sm:px-5 lg:px-8 py-2 flex-shrink-0">

            {/* Left Section */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">

                {/* Mobile Hamburger */}
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-lg text-indigo-700 hover:bg-indigo-100 transition shrink-0"
                    aria-label="Open sidebar menu"
                >
                    <Menu size={24} />
                </button>

                {/* Logo */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">

                    <div className="w-9 h-9 sm:w-12 sm:h-12 shrink-0 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <span className="text-white text-xl sm:text-2xl font-bold">
                            S
                        </span>
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-transparent tracking-tight">
                            Sellora
                        </h1>

                        <p className="text-[9px] sm:text-xs text-slate-500 font-medium tracking-wide whitespace-nowrap">
                            SHOP <span className="text-indigo-400">•</span> SELL <span className="text-indigo-400">•</span> GROW
                        </p>
                    </div>

                </div>

            </div>

            {/* Profile */}
            <div className="relative shrink-0" ref={dropdownRef}>

                <button
                    type="button"
                    onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center gap-1.5 sm:gap-3 hover:bg-indigo-100/60 rounded-xl p-1.5 sm:p-2 transition"
                >

                    <div className="hidden sm:block text-right max-w-[160px]">
                        <p className="text-sm font-bold text-slate-800 truncate">
                            {userName || 'User'}
                        </p>

                        <div className="flex items-center justify-end gap-1.5 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>

                            <p className="text-xs font-medium text-indigo-600 capitalize truncate">
                                {roleName}
                            </p>
                        </div>
                    </div>

                    <div className="w-9 h-9 sm:w-12 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-200 border border-indigo-200 flex items-center justify-center shadow-sm">
                        <span className="text-xl sm:text-2xl">👤</span>
                    </div>

                    <ChevronDown
                        size={16}
                        className={`text-slate-500 transition-transform shrink-0 ${
                            showProfile ? 'rotate-180' : ''
                        }`}
                    />

                </button>

                {/* Dropdown */}
                {showProfile && (
                    <div className="absolute right-0 top-full mt-2 sm:mt-3 w-[min(240px,calc(100vw-24px))] bg-white rounded-xl shadow-xl border border-indigo-100 py-2 z-50">

                        <div className="px-4 py-3 border-b border-slate-100">
                            <p className="font-bold text-slate-800 truncate">
                                {userName || 'User'}
                            </p>

                            <p className="text-xs text-slate-500 capitalize truncate">
                                {roleName}
                            </p>
                        </div>

                        <Link
                            to="/my-profile"
                            onClick={() => setShowProfile(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 transition"
                        >
                            <UserRound size={18} />
                            My Profile
                        </Link>

                        <Link
                            to="/change-password"
                            onClick={() => setShowProfile(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 transition"
                        >
                            <LockKeyhole size={18} />
                            Change Password
                        </Link>

                        <div className="border-t border-slate-100 mt-1 pt-1">
                            <button
                                onClick={async () => {
                                    await logout()
                                    setShowProfile(false)
                                    navigate('/', { replace: true })
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>

                    </div>
                )}

            </div>

        </nav>
    )
}

export default Header
