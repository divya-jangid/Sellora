
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

  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    const nameParts = form.name.trim().split(/\s+/)
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ')

    if (!firstName || !lastName) {
      toast.error('Please enter your full name')
      return
    }

    try {
      setLoading(true)

      const userEmail = form.email.trim().toLowerCase()

      const res = await axios.post(
        'http://localhost:8000/user/signup',
        {
          firstName,
          lastName,
          email: userEmail,
          phone: form.phone.trim(),
          password: form.password
        },
        {
          withCredentials: true
        }
      )

      if (res.data.status) {
        toast.success('Signup successful! Please login.')
        setCurrentForm('login')
      }


      else {
        toast.error(res.data.message || 'Signup failed')
      }

    } catch (error) {
      console.log(
        'Signup Error:',
        error.response?.data || error.message
      )

      toast.error(
        error.response?.data?.message ||
        'Signup failed. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-purple-900">
        Create Account
      </h2>

      <p className="mb-6 mt-2 text-gray-500">
        Sign up for your Sellora account
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Full Name
          </label>

          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-purple-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Email Address
          </label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-purple-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Phone Number
          </label>

          <input
            type="tel"
            name="phone"
            placeholder="Enter your phone number"
            value={form.phone}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-purple-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Password
          </label>

          <input
            type="password"
            name="password"
            placeholder="Create password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-purple-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Confirm Password
          </label>

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-purple-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <p className="mt-5 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setCurrentForm('login')}
            className="font-semibold text-purple-600"
          >
            Login
          </button>
        </p>

      </form>
    </div>
  )
}

export default Signup