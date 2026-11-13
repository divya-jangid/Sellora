
'use client'

import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

function Signup({ setCurrentForm }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const getNameParts = () => {
    const parts = form.name.trim().split(/\s+/)

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    }
  }

  // Send OTP
  const handleSendOtp = async () => {
    const { firstName, lastName } = getNameParts()

    if (!firstName || !lastName) {
      toast.error('Please enter your full name')
      return
    }

    if (!form.email.trim()) {
      toast.error('Please enter your email')
      return
    }

    try {
      setLoading(true)

      const res = await axios.post(
        'http://localhost:8000/user/signup',
        {
          firstName,
          lastName,
          email: form.email.trim().toLowerCase()
        },
        { withCredentials: true }
      )

      if (res.data.status) {
        setOtpSent(true)
        toast.success('OTP sent to your email')
      }

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter valid 6-digit OTP')
      return
    }

    try {
      setVerifying(true)

      const res = await axios.post(
        'http://localhost:8000/user/verify-email',
        {
          email: form.email.trim().toLowerCase(),
          otp
        },
        { withCredentials: true }
      )

      if (res.data.status) {
        setEmailVerified(true)
        toast.success('Email verified successfully')
      }

    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP')
    } finally {
      setVerifying(false)
    }
  }

  // Final Signup
  const handleFinalSignup = async (e) => {
    e.preventDefault()

    if (!emailVerified) {
      toast.error('Please verify your email first')
      return
    }

    if (!form.phone.trim()) {
      toast.error('Please enter phone number')
      return
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    const { firstName, lastName } = getNameParts()

    try {
      setLoading(true)

      const res = await axios.post(
        'http://localhost:8000/user/signup',
        {
          firstName,
          lastName,
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password
        },
        { withCredentials: true }
      )

      if (res.data.status) {
        toast.success('Account created successfully')
        setCurrentForm('login')
      }

    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = `
    w-full min-w-0 rounded-xl border border-purple-200
    bg-white px-4 py-3 text-sm text-gray-800
    placeholder:text-gray-400 outline-none
    transition duration-200
    focus:border-purple-500 focus:ring-4 focus:ring-purple-100
    disabled:cursor-not-allowed disabled:bg-gray-100
    disabled:text-gray-400
  `

  const labelClass = `
    mb-2 block text-sm font-semibold text-gray-700
  `

  const buttonClass = `
    flex shrink-0 items-center justify-center rounded-xl
    bg-gradient-to-r from-purple-600 to-violet-600
    px-5 py-3 text-sm font-semibold text-white
    shadow-md shadow-purple-200 transition duration-200
    hover:from-purple-700 hover:to-violet-700
    active:scale-[0.98]
    disabled:cursor-not-allowed disabled:opacity-50
    disabled:shadow-none
  `

  return (
    <div className="mx-auto w-full min-w-0 max-w-md">

      {/* Heading */}
      <div className="mb-6 text-center sm:text-left">

        <h2 className="text-2xl font-extrabold tracking-tight text-purple-950 sm:text-3xl">
          Create Account
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Join Sellora and start your shopping journey
        </p>

      </div>

      <form onSubmit={handleFinalSignup} className="space-y-4">

        {/* Full Name */}
        <div>
          <label className={labelClass}>
            Full Name
          </label>

          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
            disabled={otpSent}
            required
            className={inputClass}
          />
        </div>

        {/* Email */}
        <div>
          <label className={labelClass}>
            Email Address
          </label>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              disabled={otpSent}
              required
              className={inputClass}
            />

            {!emailVerified && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || otpSent}
                className={`${buttonClass} w-full sm:w-auto`}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            )}

            {emailVerified && (
              <div className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 sm:w-auto">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                  ✓
                </span>
                Verified
              </div>
            )}

          </div>
        </div>

        {/* OTP Verification */}
        {otpSent && !emailVerified && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50/80 p-4">

            <div className="mb-3">
              <h3 className="text-sm font-bold text-purple-900">
                Email Verification
              </h3>

              <p className="mt-1 break-all text-xs text-purple-700">
                OTP sent to {form.email}
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className={inputClass}
              />

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifying || otp.length !== 6}
                className={`${buttonClass} w-full sm:w-auto`}
              >
                {verifying ? 'Checking...' : 'Verify'}
              </button>

            </div>
          </div>
        )}

        {/* Phone */}
        <div>
          <label className={labelClass}>
            Phone Number
          </label>

          <input
            type="tel"
            name="phone"
            placeholder="Enter your phone number"
            value={form.phone}
            onChange={handleChange}
            disabled={!emailVerified}
            required
            className={inputClass}
          />
        </div>

        {/* Password */}
        <div>
          <label className={labelClass}>
            Password
          </label>

          <input
            type="password"
            name="password"
            placeholder="Create password (minimum 8 characters)"
            value={form.password}
            onChange={handleChange}
            disabled={!emailVerified}
            required
            className={inputClass}
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className={labelClass}>
            Confirm Password
          </label>

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={form.confirmPassword}
            onChange={handleChange}
            disabled={!emailVerified}
            required
            className={inputClass}
          />
        </div>

        {/* Signup Button */}
        <button
          type="submit"
          disabled={loading || !emailVerified}
          className="
            w-full rounded-xl bg-gradient-to-r
            from-purple-600 to-violet-600
            py-3.5 text-sm font-bold text-white
            shadow-lg shadow-purple-200
            transition duration-200
            hover:from-purple-700 hover:to-violet-700
            active:scale-[0.99]
            disabled:cursor-not-allowed disabled:opacity-50
            disabled:shadow-none
          "
        >
          {loading ? 'Creating Account...' : 'Create My Account'}
        </button>

      </form>

      {/* Login Link */}
      <div className="mt-6 border-t border-purple-100 pt-5 text-center">

        <p className="text-sm text-gray-600">
          Already have an account?{' '}

          <button
            type="button"
            onClick={() => setCurrentForm('login')}
            className="font-bold text-purple-700 transition hover:text-purple-900 hover:underline"
          >
            Login
          </button>
        </p>

      </div>

    </div>
  )
}

export default Signup
