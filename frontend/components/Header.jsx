
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { useCart } from '@/context/CartContext'
import toast from 'react-hot-toast'
import VerifyResetOTP from './VerifyResetOTP'

import {
  ShoppingCart,
  Heart,
  MapPin,
  UserRound,
  ChevronDown,
  Menu,
  X,
  Package,
  LogOut,
  MapPinned
} from 'lucide-react'

import Login from './Login'
import Signup from './Signup'
import VerifyEmail from './VerifyEmail'
import ResetPassword from './ResetPassword'
import ForgotPassword from './Forgotpassword'
import { useLocationContext } from '@/context/LocationContext'

function Header() {

  const {
    selectedStore,
    customerLocation,
    openLocationModal
  } = useLocationContext()

  const searchParams = useSearchParams()
  const router = useRouter()

  const [showModal, setShowModal] = useState(false)
  const [currentForm, setCurrentForm] = useState('login')
  const [email, setEmail] = useState('')

  const { cartItems = [], wishlistCount } = useCart()
  const cartCount = cartItems.length

  const [user, setUser] = useState(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Check logged-in customer
  const checkUser = async () => {
    try {
      const res = await axios.get(
        'http://localhost:8000/user/check-user',
        { withCredentials: true }
      )

      if (res.data.status) {
        setUser(res.data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    }
  }

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (searchParams.get('login') === 'true') {
      setShowModal(true)
      setCurrentForm('login')
    }
  }, [searchParams])

  // Signup successful: open OTP verification
  const handleSignupSuccess = (userEmail) => {
    setEmail(userEmail)
    setCurrentForm('verify')
  }

  // OTP verification successful: open login
  const handleVerificationSuccess = () => {
    toast.success('Email verified successfully!')
    setCurrentForm('login')
  }

  const closeModal = () => {
    setShowModal(false)
    setCurrentForm('login')
    setEmail('')

    if (searchParams.get('login') === 'true') {
      router.replace('/')
    }
  }

  const handleLoginSuccess = async () => {
    setShowModal(false)
    await checkUser()
  }

  const handleLogout = async () => {
    try {
      await axios.post(
        'http://localhost:8000/user/logout',
        {},
        { withCredentials: true }
      )

      toast.success('Logout successful!')
      setUser(null)
      setShowProfileMenu(false)
      setShowMobileMenu(false)
      router.replace('/')
    } catch (error) {
      console.log('Logout error:', error)
    }
  }

  const closeMobileMenu = () => {
    setShowMobileMenu(false)
    setShowProfileMenu(false)
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-purple-100 shadow-[0_4px_20px_rgba(91,33,182,0.07)]">

        {/* Main Header */}
        <div className="max-w-[1500px] mx-auto px-3 sm:px-5 lg:px-8">

          <div className="min-h-[72px] lg:min-h-[88px] flex items-center justify-between gap-3">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200">
                <span className="text-white text-2xl sm:text-3xl font-extrabold">
                  S
                </span>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">
                  Sellora
                </h1>

                <p className="hidden sm:block text-[9px] font-semibold tracking-[2px] text-slate-400">
                  SHOP • SELL • GROW
                </p>
              </div>
            </Link>

            {/* Location - Desktop */}
            <button
              onClick={openLocationModal}
              className="hidden md:flex items-center gap-3 max-w-[290px] rounded-2xl px-3 py-2.5 text-left border border-purple-100 bg-gradient-to-r from-purple-50/80 to-white hover:border-purple-300 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <MapPin size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Delivering to
                </p>

                <p className="text-sm font-bold text-purple-800 truncate">
                  {selectedStore?.name || 'Select Location'}
                </p>

                <p className="text-xs text-slate-500 truncate max-w-[210px]">
                  {customerLocation?.address || selectedStore?.address || 'Choose your delivery address'}
                </p>
              </div>

              <ChevronDown size={16} className="text-purple-500 shrink-0" />
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3">

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center gap-2 rounded-xl border border-purple-100 px-3 xl:px-4 py-2.5 text-purple-700 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all"
              >
                <ShoppingCart size={19} />

                <span className="text-sm font-semibold">
                  My Cart
                </span>

                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-red-500 px-1 text-[10px] font-bold text-white shadow">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative flex items-center gap-2 rounded-xl border border-purple-100 px-3 xl:px-4 py-2.5 text-purple-700 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all"
              >
                <Heart size={19} />

                <span className="text-sm font-semibold">
                  Wishlist
                </span>

                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-red-500 px-1 text-[10px] font-bold text-white shadow">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Profile */}
              {user ? (
                <div className="relative">

                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 rounded-xl border border-purple-100 px-3 py-2 bg-purple-50/60 hover:bg-purple-100 transition"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold shadow-sm">
                      {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>

                    <span className="max-w-[100px] truncate text-sm font-bold text-purple-800">
                    </span>

                    <ChevronDown
                      size={16}
                      className={`text-purple-600 transition-transform ${showProfileMenu ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-2xl border border-purple-100 bg-white py-2 shadow-xl shadow-purple-100/70">

                      <div className="border-b border-purple-50 px-4 py-3">
                        <p className="font-bold text-slate-800">
                          {user.firstName || 'User'}
                        </p>
                        <p className="text-xs text-slate-400">
                          Welcome to Sellora
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          router.push('/profile')
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-purple-50 transition"
                      >
                        <UserRound size={18} className="text-purple-600" />
                        My Profile
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          router.push('/my-orders')
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-purple-50 transition"
                      >
                        <Package size={18} className="text-purple-600" />
                        My Orders
                      </button>

                      <hr className="my-1 border-purple-100" />

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>

                    </div>
                  )}

                </div>
              ) : (
                <button
                  onClick={() => {
                    setCurrentForm('login')
                    setShowModal(true)
                  }}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-purple-200 hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg transition-all"
                >
                  Sign In
                </button>
              )}

            </div>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center gap-2">

              {/* Mobile Cart */}
              <Link
                href="/cart"
                aria-label="My Cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
              >
                <ShoppingCart size={20} />

                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label="Toggle menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-200 transition"
              >
                {showMobileMenu ? <X size={21} /> : <Menu size={21} />}
              </button>

            </div>

          </div>

        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-purple-100 bg-white shadow-xl">

            <div className="max-w-[1500px] mx-auto px-4 py-4 space-y-3">

              {/* Mobile Location */}
              <button
                onClick={() => {
                  closeMobileMenu()
                  openLocationModal()
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-purple-100 bg-purple-50/70 p-3 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <MapPinned size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Delivering to
                  </p>

                  <p className="truncate text-sm font-bold text-purple-800">
                    {selectedStore?.name || 'Select Location'}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {customerLocation?.address || selectedStore?.address || 'Choose your delivery address'}
                  </p>
                </div>

                <ChevronDown size={17} className="text-purple-500" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                onClick={closeMobileMenu}
                className="flex items-center justify-between rounded-xl border border-purple-100 px-4 py-3 text-purple-700 hover:bg-purple-50 transition"
              >
                <span className="flex items-center gap-3 text-sm font-semibold">
                  <Heart size={19} />
                  My Wishlist
                </span>

                {wishlistCount > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Sign In */}
              {!user && (
                <button
                  onClick={() => {
                    closeMobileMenu()
                    setCurrentForm('login')
                    setShowModal(true)
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-purple-200"
                >
                  Sign In / Register
                </button>
              )}

              {/* Mobile Profile */}
              {user && (
                <div className="rounded-xl border border-purple-100 overflow-hidden">

                  <div className="flex items-center gap-3 bg-purple-50 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 font-bold text-white">
                      {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-purple-800">
                        {user.firstName || 'Profile'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Welcome to Sellora
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      closeMobileMenu()
                      router.push('/profile')
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-purple-50"
                  >
                    <UserRound size={18} className="text-purple-600" />
                    My Profile
                  </button>

                  <button
                    onClick={() => {
                      closeMobileMenu()
                      router.push('/my-orders')
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-purple-50"
                  >
                    <Package size={18} className="text-purple-600" />
                    My Orders
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 border-t border-purple-100 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>

                </div>
              )}

            </div>

          </div>
        )}

      </header>

      {/* Login / Signup Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4">

          <div className="relative my-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl sm:rounded-3xl border border-purple-100 bg-white p-5 sm:p-8 shadow-2xl">

            <button
              onClick={closeModal}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-lg text-purple-600 hover:bg-purple-100 transition"
              aria-label="Close modal"
            >
              ✕
            </button>

            {currentForm === 'signup' && (
              <Signup
                setCurrentForm={setCurrentForm}
                onSignupSuccess={handleSignupSuccess}
              />
            )}

            {currentForm === 'verify' && (
              <VerifyEmail
                email={email}
                onVerificationSuccess={handleVerificationSuccess}
              />
            )}

            {currentForm === 'login' && (
              <Login
                setCurrentForm={setCurrentForm}
                currentForm={currentForm}
                setShowModal={setShowModal}
                setUser={setUser}
              />
            )}

            {currentForm === 'forget' && (
              <ForgotPassword
                setCurrentForm={setCurrentForm}
                currentForm={currentForm}
              />
            )}


            {currentForm === 'verify-reset-otp' && (
              <VerifyResetOTP
                setCurrentForm={setCurrentForm}
              />
            )}

            {currentForm === 'reset' && (
              <ResetPassword
                setCurrentForm={setCurrentForm}
                currentForm={currentForm}
                setShowModal={setShowModal}
              />
            )}

          </div>
        </div>
      )}

    </>
  )
}

export default Header
