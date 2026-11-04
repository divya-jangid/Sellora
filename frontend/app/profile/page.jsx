
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-purple-50">
        <p className="text-purple-700">Loading profile...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-purple-50 p-6">
        <p className="text-red-600">
          {error || 'Please login first'}
        </p>

        <button
          onClick={() => router.push('/?login=true')}
          className="rounded-lg bg-purple-600 px-5 py-3 text-white hover:bg-purple-700"
        >
          Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-purple-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">

        <button
          onClick={() => router.push('/')}
          className="mb-6 text-purple-700 hover:underline"
        >
          ← Back to Home
        </button>

        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">

          {/* Profile Header */}
          <div className="bg-purple-600 px-6 py-8 text-center text-white">
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-bold text-purple-600">
              {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="mt-2 text-purple-100">
              Welcome to Sellora
            </p>
          </div>

          {/* Profile Details */}
          <div className="space-y-5 p-6 sm:p-8">

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {success}
              </p>
            )}

            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-5">

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-lg border border-purple-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email || ''}
                    readOnly
                    className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Email address cannot be changed here.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full rounded-lg border border-purple-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-lg bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>

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
                    className="flex-1 rounded-lg border border-purple-200 py-3 font-semibold text-purple-700 hover:bg-purple-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Name */}
                <div className="rounded-xl border border-purple-100 p-4">
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {[user.firstName, user.lastName]
                      .filter(Boolean)
                      .join(' ') || 'Not provided'}
                  </p>
                </div>

                {/* Email */}
                <div className="rounded-xl border border-purple-100 p-4">
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="mt-1 break-words font-semibold text-gray-800">
                    {user.email || 'Not provided'}
                  </p>
                </div>

                {/* Phone */}
                <div className="rounded-xl border border-purple-100 p-4">
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {user.phone || 'Not provided'}
                  </p>
                </div>

                {/* Edit Profile */}
                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    setSuccess('')
                    setEditMode(true)
                  }}
                  className="w-full rounded-lg border border-purple-600 py-3 font-semibold text-purple-700 transition hover:bg-purple-50"
                >
                  Edit Profile
                </button>

                {/* My Orders */}
                <button
                  type="button"
                  onClick={() => router.push('/my-orders')}
                  className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-700"
                >
                  View My Orders
                </button>

              </>
            )}

            {/* My Addresses — outside editMode condition */}
            <button
              type="button"
              onClick={() => router.push('/address')}
              className="flex w-full items-center justify-between rounded-xl border border-purple-200 bg-purple-50 p-4 text-left transition hover:border-purple-400 hover:bg-purple-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl">
                  📍
                </div>

                <div>
                  <p className="font-semibold text-gray-800">
                    My Addresses
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage your delivery addresses
                  </p>
                </div>
              </div>

              <span className="text-xl text-purple-600">→</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}
