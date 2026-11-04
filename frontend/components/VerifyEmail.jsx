
'use client'

import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

function VerifyEmail({ email, onVerificationSuccess }) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    try {
      setLoading(true)

      const res = await axios.post(
        'http://localhost:8000/user/verify-email',
        {
          email,
          otp
        },
        {
          withCredentials: true
        }
      )

      if (res.data.status) {
        toast.success(
          res.data.message || 'Email verified successfully!'
        )

        onVerificationSuccess()
      } else {
        toast.error(
          res.data.message || 'OTP verification failed'
        )
      }

    } catch (error) {
      console.log(
        'Verify Email Error:',
        error.response?.data || error.message
      )

      toast.error(
        error.response?.data?.message ||
        'OTP verification failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-purple-900">
        Verify Your Email
      </h2>

      <p className="mb-6 mt-2 text-gray-500">
        Enter the 6-digit OTP sent to {email}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          placeholder="Enter 6-digit OTP"
          maxLength={6}
          inputMode="numeric"
          required
          className="w-full rounded-lg border border-purple-200 px-4 py-3 text-center text-xl tracking-widest outline-none focus:border-purple-500"
        />

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>
    </div>
  )
}

export default VerifyEmail