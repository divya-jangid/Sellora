
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
  MapPinned,
  Search,
  Loader2,
  LockKeyhole 
} from 'lucide-react'

import Login from './Login'
import Signup from './Signup'
import VerifyEmail from './VerifyEmail'
import ResetPassword from './ResetPassword'
import ForgotPassword from './Forgotpassword'
import { useLocationContext } from '@/context/LocationContext'

function SearchBar({
  search,
  setSearch,
  searchResults,
  searchLoading,
  showSearchResults,
  setShowSearchResults,
  selectedStore,
  locationLoading,
  openLocationModal,
  handleProductClick
}) {
  return (
    <div className="relative w-full">

      <div className="relative flex items-center">

        <Search
          size={20}
          className="absolute left-4 text-purple-500"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setShowSearchResults(true)}
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              searchResults.length > 0
            ) {
              handleProductClick(searchResults[0].slug)
            }

            if (e.key === 'Escape') {
              setShowSearchResults(false)
            }
          }}
          placeholder="Search for milk, fruits, snacks..."
          className="w-full rounded-2xl border border-purple-100 bg-purple-50/50 py-3 pl-12 pr-11 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
        />

        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setSearchResults([])
            }}
            className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-purple-100 hover:text-purple-700"
          >
            <X size={17} />
          </button>
        )}

      </div>

      {/* SEARCH RESULTS DROPDOWN */}
      {showSearchResults && search.trim() && (
        <div className="absolute left-0 top-full z-[80] mt-2 w-full overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-2xl shadow-purple-200/50">

          {locationLoading ? (
            <div className="flex items-center justify-center gap-2 p-5 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin text-purple-600" />
              Loading location...
            </div>
          ) : !selectedStore?._id ? (
            <button
              type="button"
              onClick={() => {
                setShowSearchResults(false)
                openLocationModal()
              }}
              className="w-full p-5 text-center text-sm font-semibold text-purple-700 hover:bg-purple-50"
            >
              Please select your delivery location first
            </button>
          ) : searchLoading ? (
            <div className="flex items-center justify-center gap-2 p-5 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin text-purple-600" />
              Searching products...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-[380px] overflow-y-auto">

              <p className="border-b border-purple-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Search Results ({searchResults.length})
              </p>

              {searchResults.map((product) => {

                const variant = product.variants?.[0]

                return (
                  <button
                    type="button"
                    key={product._id}
                    onClick={() => handleProductClick(product.slug)}
                    className="flex w-full items-center gap-3 border-b border-slate-50 p-3 text-left transition hover:bg-purple-50"
                  >

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-purple-100 bg-purple-50">

                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Package size={24} className="text-purple-300" />
                      )}

                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-bold text-slate-800">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {product.category?.name || 'Grocery'}
                      </p>

                      <p className="mt-1 text-sm font-bold text-purple-700">
                        {variant
                          ? `₹${variant.sellingPrice}`
                          : 'Price unavailable'}
                      </p>

                    </div>

                    <ChevronDown
                      size={17}
                      className="-rotate-90 shrink-0 text-purple-400"
                    />

                  </button>
                )
              })}

            </div>
          ) : (
            <div className="p-6 text-center">

              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
                <Search size={22} className="text-purple-500" />
              </div>

              <p className="text-sm font-bold text-slate-700">
                No products found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Try searching with another product name
              </p>

            </div>
          )}

        </div>
      )}

    </div>
  )
}

function Header() {

  const {
    selectedStore,
    customerLocation,
    openLocationModal,
    locationLoading
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
  const [showLoginRequired, setShowLoginRequired] = useState(false)


  // SEARCH STATES
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)



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

    const openLoginModal = () => {
      setShowLoginRequired(true)
    }

    window.addEventListener(
      'open-login-modal',
      openLoginModal
    )

    return () => {
      window.removeEventListener(
        'open-login-modal',
        openLoginModal
      )
    }

  }, [])



  useEffect(() => {
    if (searchParams.get('login') === 'true') {
      setShowModal(true)
      setCurrentForm('login')
    }
  }, [searchParams])

  // PRODUCT SEARCH
  useEffect(() => {

    if (!search.trim()) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    if (locationLoading) return

    if (!selectedStore?._id) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    const timer = setTimeout(async () => {

      try {
        setSearchLoading(true)

        const res = await axios.get(
          'http://localhost:8000/product/public',
          {
            params: {
              storeId: selectedStore._id,
              search: search.trim(),
              limit: 10
            }
          }
        )

        setSearchResults(
          Array.isArray(res.data.data) ? res.data.data : []
        )

      } catch (error) {
        console.log('PRODUCT SEARCH ERROR:', error)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }

    }, 300)

    return () => clearTimeout(timer)

  }, [search, selectedStore, locationLoading])

  // OPEN PRODUCT DETAIL
  const handleProductClick = (slug) => {
    setSearch('')
    setSearchResults([])
    setShowSearchResults(false)
    setShowMobileMenu(false)

    router.push(`/product/${slug}`)
  }

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
      <header className="sticky top-0 z-50 w-full border-b border-purple-100 bg-white/95 shadow-[0_4px_20px_rgba(91,33,182,0.07)] backdrop-blur-xl">

        {/* MAIN HEADER */}
        <div className="mx-auto max-w-[1500px] px-3 sm:px-5 lg:px-8">

          <div className="flex min-h-[72px] items-center justify-between gap-3 lg:min-h-[88px]">

            {/* LOGO */}
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 shadow-lg shadow-purple-200 sm:h-12 sm:w-12 sm:rounded-2xl">
                <span className="text-2xl font-extrabold text-white sm:text-3xl">
                  S
                </span>
              </div>

              <div>
                <h1 className="bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent sm:text-2xl">
                  Sellora
                </h1>

                <p className="hidden text-[9px] font-semibold tracking-[2px] text-slate-400 sm:block">
                  SHOP • SELL • GROW
                </p>
              </div>
            </Link>

            {/* LOCATION - DESKTOP */}
            <button
              onClick={openLocationModal}
              className="hidden max-w-[250px] items-center gap-3 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50/80 to-white px-3 py-2.5 text-left transition-all duration-200 hover:border-purple-300 hover:shadow-md md:flex"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <MapPin size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Delivering to
                </p>

                <p className="truncate text-sm font-bold text-purple-800">
                  {selectedStore?.name || 'Select Location'}
                </p>

                <p className="max-w-[180px] truncate text-xs text-slate-500">
                  {customerLocation?.address || selectedStore?.address || 'Choose your delivery address'}
                </p>
              </div>

              <ChevronDown size={16} className="shrink-0 text-purple-500" />
            </button>

            {/* DESKTOP SEARCH */}
            <div className="hidden min-w-[180px] max-w-[430px] flex-1 lg:block">
              <SearchBar
                search={search}
                setSearch={setSearch}
                searchResults={searchResults}
                searchLoading={searchLoading}
                showSearchResults={showSearchResults}
                setShowSearchResults={setShowSearchResults}
                selectedStore={selectedStore}
                locationLoading={locationLoading}
                openLocationModal={openLocationModal}
                handleProductClick={handleProductClick}
              />
            </div>

            {/* DESKTOP NAVIGATION */}
            <div className="hidden items-center gap-2 xl:gap-3 lg:flex">

              {/* CART */}
              <Link
                href="/cart"
                className="relative flex items-center gap-2 rounded-xl border border-purple-100 bg-white px-3 py-2.5 text-purple-700 transition-all hover:border-purple-300 hover:bg-purple-50 xl:px-4"
              >
                <ShoppingCart size={19} />

                <span className="text-sm font-semibold">
                  My Cart
                </span>

                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-red-500 px-1 text-[10px] font-bold text-white shadow">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* WISHLIST */}
              <Link
                href="/wishlist"
                className="relative flex items-center gap-2 rounded-xl border border-purple-100 bg-white px-3 py-2.5 text-purple-700 transition-all hover:border-purple-300 hover:bg-purple-50 xl:px-4"
              >
                <Heart size={19} />

                <span className="text-sm font-semibold">
                  Wishlist
                </span>

                {wishlistCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-red-500 px-1 text-[10px] font-bold text-white shadow">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* PROFILE */}
              {user ? (
                <div className="relative">

                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 rounded-xl border border-purple-100 bg-purple-50/60 px-3 py-2 transition hover:bg-purple-100"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 font-bold text-white shadow-sm">
                      {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>

                    <span className="max-w-[100px] truncate text-sm font-bold text-purple-800">
                      {user.firstName || 'Profile'}
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
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-purple-50"
                      >
                        <UserRound size={18} className="text-purple-600" />
                        My Profile
                      </button>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          router.push('/my-orders')
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-purple-50"
                      >
                        <Package size={18} className="text-purple-600" />
                        My Orders
                      </button>

                      <hr className="my-1 border-purple-100" />

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
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
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-purple-200 transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg"
                >
                  Sign In
                </button>
              )}

            </div>

            {/* MOBILE ACTIONS */}
            <div className="flex items-center gap-2 lg:hidden">

              <Link
                href="/cart"
                aria-label="My Cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-700 transition hover:bg-purple-100"
              >
                <ShoppingCart size={20} />

                {cartCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label="Toggle menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-200 transition"
              >
                {showMobileMenu ? <X size={21} /> : <Menu size={21} />}
              </button>

            </div>

          </div>

          {/* MOBILE SEARCH */}
          <div className="pb-3 lg:hidden">
            <SearchBar
              search={search}
              setSearch={setSearch}
              searchResults={searchResults}
              searchLoading={searchLoading}
              showSearchResults={showSearchResults}
              setShowSearchResults={setShowSearchResults}
              selectedStore={selectedStore}
              locationLoading={locationLoading}
              openLocationModal={openLocationModal}
              handleProductClick={handleProductClick}
            />
          </div>

        </div>

        {/* MOBILE NAVIGATION */}
        {showMobileMenu && (
          <div className="border-t border-purple-100 bg-white shadow-xl lg:hidden">

            <div className="mx-auto max-w-[1500px] space-y-3 px-4 py-4">

              {/* MOBILE LOCATION */}
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

              {/* WISHLIST */}
              <Link
                href="/wishlist"
                onClick={closeMobileMenu}
                className="flex items-center justify-between rounded-xl border border-purple-100 px-4 py-3 text-purple-700 transition hover:bg-purple-50"
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

              {/* SIGN IN */}
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

              {/* MOBILE PROFILE */}
              {user && (
                <div className="overflow-hidden rounded-xl border border-purple-100">

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



      {/* LOGIN REQUIRED POPUP */}
      {showLoginRequired && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-7 text-center shadow-2xl">

            <button
              onClick={() => setShowLoginRequired(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100"
            >
              ✕
            </button>

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <LockKeyhole size={36} />
            </div>

            <h2 className="mb-2 text-2xl font-bold text-slate-900">
              Login Required
            </h2>

            <p className="mb-7 text-sm leading-6 text-slate-500">
              Please login to your Sellora account to add products to your cart and enjoy shopping.
            </p>

            <button
              onClick={() => {
                setShowLoginRequired(false)
                setCurrentForm('login')
                setShowModal(true)
              }}
              className="w-full rounded-xl bg-purple-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700"
            >
              Login to Continue
            </button>

            <p className="mt-5 text-sm text-slate-500">
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setShowLoginRequired(false)
                  setCurrentForm('login')
                  setShowModal(true)
                }}
                className="font-semibold text-purple-600 hover:underline"
              >
                Login
              </button>
            </p>

          </div>
        </div>
      )}


      {/* LOGIN / SIGNUP MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4">

          <div className="relative my-auto max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-purple-100 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-8">

            <button
              onClick={closeModal}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-lg text-purple-600 transition hover:bg-purple-100"
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
