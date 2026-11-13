
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const API = 'http://localhost:8000'

export default function Profile() {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  // GET PROFILE
  useEffect(() => {
    const getProfile = async () => {
      try {
        const res = await axios.get(
          `${API}/user/check-user`,
          { withCredentials: true }
        )

        if (res.data.status) {
          const profile = res.data.user

          setUser(profile)
          setName(
            [profile.firstName, profile.lastName]
              .filter(Boolean)
              .join(' ')
          )
          setPhone(profile.phone || '')
        } else {
          setError('Please login first')
        }
      } catch (err) {
        setError(
          err.response?.data?.message || 'Unable to load profile'
        )
      } finally {
        setLoading(false)
      }
    }

    getProfile()
  }, [])

  // UPDATE PROFILE
  const handleUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Please enter your name')
      return
    }

    if (!phone.trim()) {
      setError('Please enter your phone number')
      return
    }

    const nameParts = trimmedName.split(/\s+/)

    const updatedForm = {
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '),
      phone: phone.trim()
    }

    try {
      setSaving(true)

      const res = await axios.put(
        `${API}/user/my-profile`,
        updatedForm,
        { withCredentials: true }
      )

      if (res.data.status) {
        const updatedUser = {
          ...user,
          ...res.data.user
        }

        setUser(updatedUser)

        setName(
          [updatedUser.firstName, updatedUser.lastName]
            .filter(Boolean)
            .join(' ')
        )

        setPhone(updatedUser.phone || '')
        setEditMode(false)
        setSuccess('Profile updated successfully!')
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to update profile'
      )
    } finally {
      setSaving(false)
    }
  }

  // DEACTIVATE ACCOUNT
  const handleDeactivateAccount = async () => {
    try {
      setDeactivating(true)
      setError('')

      const res = await axios.put(
        `${API}/user/deactivate-account`,
        {},
        { withCredentials: true }
      )

      if (res.data.success) {
        setShowDeactivateModal(false)
        setUser(null)
        router.replace('/?login=true')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to deactivate account'
      )

      setShowDeactivateModal(false)
    } finally {
      setDeactivating(false)
    }
  }

  // LOADING
  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#faf8ff] px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600" />
          <p className="mt-4 text-sm font-medium text-purple-700">
            Loading your profile...
          </p>
        </div>
      </div>
    )
  }

  // NOT LOGGED IN
  if (!user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#faf8ff] px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-4xl">
          👤
        </div>

        <h2 className="mt-5 text-2xl font-bold text-gray-800">
          Login Required
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          {error || 'Please login to view your profile.'}
        </p>

        <button
          onClick={() => router.push('/?login=true')}
          className="mt-6 rounded-xl bg-purple-600 px-8 py-3 font-semibold text-white shadow-md shadow-purple-200 transition hover:bg-purple-700"
        >
          Sign In
        </button>
      </div>
    )
  }

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    'Sellora User'

  const initial = user.firstName?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-[#faf8ff] px-4 py-7 sm:px-6 sm:py-10">

      <div className="mx-auto max-w-5xl">

        {/* TOP NAVIGATION */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-purple-700 transition hover:text-purple-900"
          >
            <span className="text-lg">←</span>
            Back to Home
          </button>

          <span className="rounded-full border border-purple-100 bg-white px-4 py-2 text-xs font-semibold tracking-wide text-purple-700">
            SELLORA ACCOUNT
          </span>
        </div>

        {/* PROFILE HERO */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-purple-600 to-violet-500 px-6 py-9 text-white shadow-xl shadow-purple-200 sm:px-10 sm:py-12">

          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[35px] border-white/10" />
          <div className="absolute -bottom-28 right-36 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">

            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white/30 bg-white text-4xl font-bold text-purple-700 shadow-lg sm:h-28 sm:w-28 sm:text-5xl">
              {initial}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-purple-100">
                Welcome back!
              </p>

              <h1 className="mt-1 break-words text-2xl font-bold sm:text-3xl">
                {fullName}
              </h1>

              <p className="mt-2 break-all text-sm text-purple-100">
                {user.email}
              </p>

              <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-green-300" />
                Active Account
              </span>
            </div>

          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <span>✓</span>
            <p>{success}</p>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* LEFT SECTION */}
          <div className="space-y-6 lg:col-span-2">

            <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">

              {/* SECTION HEADER */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-5 sm:px-7">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Personal Information
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage your personal details
                  </p>
                </div>

                {!editMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setError('')
                      setSuccess('')
                      setEditMode(true)
                    }}
                    className="rounded-lg border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                  >
                    ✎ Edit Profile
                  </button>
                )}
              </div>

              <div className="p-5 sm:p-7">

                {editMode ? (
                  <form onSubmit={handleUpdate} className="space-y-5">

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Full Name
                      </label>

                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Email Address
                      </label>

                      <input
                        type="email"
                        value={user.email || ''}
                        readOnly
                        className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500"
                      />

                      <p className="mt-2 text-xs text-gray-400">
                        Email address cannot be changed here.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Phone Number
                      </label>

                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
                        required
                      />
                    </div>

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => {
                          setEditMode(false)
                          setError('')

                          setName(
                            [user.firstName, user.lastName]
                              .filter(Boolean)
                              .join(' ')
                          )

                          setPhone(user.phone || '')
                        }}
                        className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white shadow-md shadow-purple-100 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                  </form>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                    <div className="rounded-xl bg-[#faf8ff] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Full Name
                      </p>
                      <p className="mt-2 break-words font-semibold text-gray-800">
                        {fullName}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#faf8ff] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Email Address
                      </p>
                      <p className="mt-2 break-all font-semibold text-gray-800">
                        {user.email || 'Not provided'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#faf8ff] p-4 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Phone Number
                      </p>
                      <p className="mt-2 font-semibold text-gray-800">
                        {user.phone || 'Not provided'}
                      </p>
                    </div>

                  </div>
                )}

              </div>
            </div>

            {/* QUICK LINKS */}
            <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-lg font-bold text-gray-800">
                Your Account
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage your orders and delivery details
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={() => router.push('/my-orders')}
                  className="group flex items-center gap-4 rounded-xl border border-gray-100 p-4 text-left transition hover:border-purple-200 hover:bg-purple-50"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-2xl transition group-hover:scale-105">
                    📦
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800">
                      My Orders
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Track your orders
                    </p>
                  </div>

                  <span className="text-lg text-purple-500">→</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/address')}
                  className="group flex items-center gap-4 rounded-xl border border-gray-100 p-4 text-left transition hover:border-purple-200 hover:bg-purple-50"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-2xl transition group-hover:scale-105">
                    📍
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800">
                      My Addresses
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Manage delivery addresses
                    </p>
                  </div>

                  <span className="text-lg text-purple-500">→</span>
                </button>

              </div>
            </div>

          </div>

          {/* RIGHT SECTION */}
          <div className="space-y-6">

            <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                🛍️
              </div>

              <h3 className="mt-4 text-lg font-bold text-gray-800">
                Welcome to Sellora
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Shop your everyday essentials and enjoy a smooth shopping experience.
              </p>

              <button
                onClick={() => router.push('/')}
                className="mt-5 w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Continue Shopping →
              </button>
            </div>

            {/* DEACTIVATE ACCOUNT */}
            {!editMode && (
              <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-xl">
                  ⚠️
                </div>

                <h3 className="mt-4 font-bold text-gray-800">
                  Deactivate Account
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Deactivating your account will cancel your eligible active orders and log you out of Sellora.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    setShowDeactivateModal(true)
                  }}
                  className="mt-5 w-full rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white"
                >
                  Deactivate My Account
                </button>
              </div>
            )}

          </div>

        </div>

        {/* FOOTER NOTE */}
        <p className="mt-8 text-center text-xs text-gray-400">
          © 2026 Sellora. Your account, your shopping experience.
        </p>

      </div>

      {/* DEACTIVATION MODAL */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="border-b border-red-100 bg-red-50 px-6 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                ⚠️
              </div>

              <h2 className="mt-4 text-xl font-bold text-gray-800">
                Deactivate Account?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Are you sure you want to deactivate your Sellora account?
                All your eligible active orders will be cancelled and your account will become inactive.
              </p>
            </div>

            <div className="p-6">
              <p className="rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-600">
                This action will log you out of your account.
              </p>

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">

                <button
                  type="button"
                  disabled={deactivating}
                  onClick={() => setShowDeactivateModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Keep Account
                </button>

                <button
                  type="button"
                  disabled={deactivating}
                  onClick={handleDeactivateAccount}
                  className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deactivating ? 'Deactivating...' : 'Yes, Deactivate'}
                </button>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
