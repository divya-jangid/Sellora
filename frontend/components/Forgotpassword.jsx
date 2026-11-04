
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'react-hot-toast'

function ForgotPassword({setCurrentForm,currentForm}) {
  const router = useRouter()
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
       localStorage.setItem("email",normalizedEmail)

      

        setCurrentForm("reset")

      } else {
        toast.success(res.data.message || 'Unable to send OTP.')
      }
    } catch (error) {
      console.log('Forgot Password Error:', error.response?.data || error.message)
      toast.success(error.response?.data?.message || 'Forgot password request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-20 max-w-md rounded-xl border border-purple-100 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-purple-900">
        Forgot Password?
      </h2>

      <p className="mb-6 mt-2 text-gray-500">
        Enter your email address to receive a password reset OTP.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Email Address
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full rounded-lg border border-purple-200 px-4 py-3 outline-none focus:border-purple-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Sending OTP...' : 'Send Reset OTP'}
        </button>

      </form>
    </div>
  )
}

export default ForgotPassword
