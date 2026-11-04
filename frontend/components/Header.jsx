
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { useCart } from '@/context/CartContext'
import toast from 'react-hot-toast'

import Login from './Login'
import Signup from './Signup'
import VerifyEmail from './VerifyEmail'
import ResetPassword from './ResetPassword'
import ForgotPassword from './Forgotpassword'

function Header() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [showModal, setShowModal] = useState(false)
  const [currentForm, setCurrentForm] = useState('login')
  const [email, setEmail] = useState('')

  const { cartItems = [], wishlistCount } = useCart()
  const cartCount = cartItems.length

  const [user, setUser] = useState(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

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
      router.replace('/')
    } catch (error) {
      console.log('Logout error:', error)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between bg-white px-8 py-4 shadow">
        <h1
          onClick={() => router.push('/')}
          className="cursor-pointer text-2xl font-bold text-purple-600"
        >
          Sellora
        </h1>

        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-lg border border-purple-300 px-4 py-2 text-purple-700 hover:bg-purple-50"
          >
            <span>🛒</span>
            <span>My Cart</span>

            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            href="/wishlist"
            className="relative flex items-center gap-2 rounded-lg border border-purple-300 px-4 py-2 text-purple-700 hover:bg-purple-50"
          >
            <span>♡ Wishlist</span>

            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 rounded-lg border border-purple-200 px-4 py-2 text-purple-700 hover:bg-purple-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 font-semibold">
                  {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </span>

                <span>{user.firstName || 'Profile'}</span>
                <span>⌄</span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 z-40 mt-2 w-48 rounded-xl border bg-white py-2 shadow-lg">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      router.push('/profile')
                    }}
                    className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-purple-50"
                  >
                    My Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      router.push('/my-orders')
                    }}
                    className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-purple-50"
                  >
                    My Orders
                  </button>

                  <hr className="my-2" />

                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                  >
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
              className="rounded-lg bg-purple-600 px-5 py-2 text-white hover:bg-purple-700"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-8">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-xl text-gray-500"
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
