
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

function Login({ setCurrentForm, currentForm, setShowModal, setUser }) {
  const router = useRouter()

  const [form, setForm] = useState({
    email: '',
    password: ''
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

    try {
      setLoading(true)

      const res = await axios.post(
        'http://localhost:8000/user/login',
        {
          email: form.email.trim().toLowerCase(),
          password: form.password
        },
        {
          withCredentials: true
        }
      )

      if (res.data.status) {
        setUser(res.data.user)
        toast.success('Login successful!')
        setShowModal(false)
        // onLoginSuccess?.()
        // router.push('/')
      } else {
        toast.success(res.data.message || 'Login failed')
      }

    } catch (error) {
      console.log(
        'Login Error:',
        error.response?.data || error.message
      )

      toast.success(
        error.response?.data?.message ||
        'Login failed. Please try again.'
      )
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
  `

  const labelClass = `
    mb-2 block text-sm font-semibold text-gray-700
  `

  return (
    <div className="mx-auto w-full min-w-0 max-w-md">

      {/* Heading */}
      <div className="mb-8 text-center sm:text-left">

        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-2xl shadow-sm">
          👋
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight text-purple-950 sm:text-3xl">
          Welcome Back
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Login to your Sellora account and continue shopping
        </p>

      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Email */}
        <div>
          <label className={labelClass}>
            Email Address
          </label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
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
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        {/* Forgot Password */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setCurrentForm('forget')}
            className="text-sm font-semibold text-purple-600 transition hover:text-purple-900 hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        {/* Login Button */}
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
          {loading ? 'Logging in...' : 'Login to Account'}
        </button>

      </form>

      {/* Signup Link */}
      <div className="mt-7 border-t border-purple-100 pt-5 text-center">

        <p className="text-sm text-gray-600">
          Don't have an account?{' '}

          <button
            type="button"
            onClick={() =>
              setCurrentForm(
                currentForm === 'signup' ? 'login' : 'signup'
              )
            }
            className="font-bold text-purple-700 transition hover:text-purple-900 hover:underline"
          >
            Sign Up
          </button>
        </p>

      </div>

    </div>
  )
}

export default Login
