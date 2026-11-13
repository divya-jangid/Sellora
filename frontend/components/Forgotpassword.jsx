
'use client'

import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

function ForgotPassword({ setCurrentForm }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)


  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      const normalizedEmail = email.trim().toLowerCase()

      const res = await axios.post(
        'http://localhost:8000/user/forgot-password',
        { email: normalizedEmail },
        { withCredentials: true }
      )

      if (res.data.status) {
        localStorage.setItem('email', normalizedEmail)

        toast.success(res.data.message || 'OTP sent successfully!')

        setCurrentForm('verify-reset-otp')

      } else {
        toast.error(res.data.message || 'Unable to send OTP.')
      }

    } catch (error) {
      console.log(
        'Forgot Password Error:',
        error.response?.data || error.message
      )

      toast.error(
        error.response?.data?.message ||
        'Forgot password request failed.'
      )

    } finally {
      setLoading(false)
    }
  }


  
  return (
    <div className="mx-auto w-full min-w-0 max-w-md">

      {/* Heading */}
      <div className="mb-8 text-center sm:text-left">

        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-2xl shadow-sm">
          🔐
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight text-purple-950 sm:text-3xl">
          Forgot Password?
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Don't worry! Enter your registered email address and we'll send you an OTP to reset your password.
        </p>

      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Email Address
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email"
            required
            className="
              w-full min-w-0 rounded-xl border border-purple-200
              bg-white px-4 py-3 text-sm text-gray-800
              placeholder:text-gray-400 outline-none
              transition duration-200
              focus:border-purple-500 focus:ring-4 focus:ring-purple-100
            "
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full rounded-xl
            bg-gradient-to-r from-purple-600 to-violet-600
            py-3.5 text-sm font-bold text-white
            shadow-lg shadow-purple-200
            transition duration-200
            hover:from-purple-700 hover:to-violet-700
            active:scale-[0.99]
            disabled:cursor-not-allowed disabled:opacity-50
            disabled:shadow-none
          "
        >
          {loading ? 'Sending OTP...' : 'Send Reset OTP'}
        </button>

      </form>

      {/* Back to Login */}
      <div className="mt-7 border-t border-purple-100 pt-5 text-center">

        <button
          type="button"
          onClick={() => setCurrentForm('login')}
          className="text-sm font-semibold text-purple-700 transition hover:text-purple-900 hover:underline"
        >
          ← Back to Login
        </button>

      </div>

    </div>
  )
}

export default ForgotPassword
