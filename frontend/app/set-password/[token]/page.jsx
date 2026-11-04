
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import axios from 'axios'
import { toast } from  'react-hot-toast'

export default function SetPassword() {
  const { token } = useParams()
  const router = useRouter()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordStrength = () => {
    if (!newPassword) return 0

    let score = 0
    if (newPassword.length >= 8) score++
    if (/[A-Z]/.test(newPassword)) score++
    if (/[0-9]/.test(newPassword)) score++
    if (/[^A-Za-z0-9]/.test(newPassword)) score++

    return score
  }

  const strength = passwordStrength()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast.success('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.success('Passwords do not match')
      return
    }

    try {
      setLoading(true)

      const res = await axios.post(
        `http://localhost:8000/user/set-password/${token}`,
        { newPassword }
      )

      toast.success(res.data.message || 'Password set successfully')
      router.push('/')

    } catch (error) {
      toast.success(
        error.response?.data?.message || 'Unable to set password'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4 py-12">

      <div className="w-full max-w-md">

        {/* LOGO */}
        <div className="text-center mb-7">
          <h1 className="text-3xl font-extrabold text-purple-700 tracking-tight">
            Sellora
          </h1>

          <p className="text-gray-500 text-sm mt-2">
            SHOP • SELL • GROW
          </p>
        </div>

        {/* PASSWORD CARD */}
        <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 border border-purple-100 p-7 sm:p-9">

          {/* ICON */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-purple-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm10-11V7a4 4 0 00-8 0v3"
                />
              </svg>
            </div>
          </div>

          {/* HEADING */}
          <div className="text-center mb-7">
            <h2 className="text-2xl font-bold text-gray-900">
              Set Your Password
            </h2>

            <p className="text-gray-500 text-sm mt-2 leading-6">
              Create a secure password for your Sellora account and get started.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* NEW PASSWORD */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-700 text-sm"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* PASSWORD STRENGTH */}
              {newPassword && (
                <div className="mt-3">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className={`h-1.5 flex-1 rounded-full ${
                          strength >= item
                            ? strength <= 1
                              ? 'bg-red-400'
                              : strength <= 2
                              ? 'bg-yellow-400'
                              : strength === 3
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    {strength <= 1
                      ? 'Weak password'
                      : strength === 2
                      ? 'Medium password'
                      : strength === 3
                      ? 'Good password'
                      : 'Strong password'}
                  </p>
                </div>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-700 text-sm"
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>

              {confirmPassword && (
                <p className={`text-xs mt-2 ${
                  newPassword === confirmPassword
                    ? 'text-green-600'
                    : 'text-red-500'
                }`}>
                  {newPassword === confirmPassword
                    ? 'Passwords match'
                    : 'Passwords do not match'}
                </p>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-purple-200 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting Password...' : 'Set Password'}
            </button>

          </form>

          {/* FOOTER */}
          <div className="mt-7 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Secure account setup powered by Sellora
            </p>
          </div>

        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Sellora. All rights reserved.
        </p>

      </div>
    </div>
  )
}
