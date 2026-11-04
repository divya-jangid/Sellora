
'use client'

import { useLayoutEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { toast } from 'react-hot-toast'

function ResetPassword({setShowModal}) {

const [email , setEmail] =  useState("")
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)


  useLayoutEffect(()=>{
    setEmail(localStorage.getItem("email"))
},[])


  const handleSubmit = async (e) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast.success('Password must be at least 8 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.success('Passwords do not match')
      return
    }

    try {
      setLoading(true)

      const res = await axios.post(
        'http://localhost:8000/user/reset-password',
        {
          email,
          otp,
          newPassword
        },
        { withCredentials: true }
      )

      if (res.data.status) {
     setShowModal(false)
      } else {
        toast.success(res.data.message || 'Password reset failed')
      }
    } catch (error) {
      console.log('Reset Password Error:', error.response?.data || error.message)
      toast.success(error.response?.data?.message || 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-purple-100 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-purple-900">
        Reset Password
      </h2>

      <p className="mb-6 mt-2 text-gray-500">
        Enter the OTP sent to your email and choose a new password.
      </p>

      {!email ? (
        <div>
          <p className="text-sm text-red-600">
            Email is missing. Please start from Forgot Password.
          </p>

          <button
            type="button"
            onClick={() => router.push('/forgot-password')}
            className="mt-4 w-full rounded-lg bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700"
          >
            Go to Forgot Password
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              readOnly
              className="w-full rounded-lg border bg-gray-50 px-4 py-3 text-gray-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              OTP
            </label>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="Enter 6-digit OTP"
              required
              className="w-full rounded-lg border border-purple-200 px-4 py-3 text-center tracking-widest outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              minLength={8}
              required
              className="w-full rounded-lg border border-purple-200 px-4 py-3 outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              minLength={8}
              required
              className="w-full rounded-lg border border-purple-200 px-4 py-3 outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/forgot-password')}
            className="w-full py-2 text-sm font-medium text-purple-600 hover:underline"
          >
            Request a New OTP
          </button>
        </form>
      )}
    </div>
  )
}

export default ResetPassword
