
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

function Login({setCurrentForm,currentForm ,setShowModal,setUser}) {
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">
        Welcome Back
      </h2>

      <p className="mb-6 mt-2 text-gray-500">
        Login to your Sellora account
      </p>

      <form className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Email Address
          </label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Password
          </label>

          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div className="text-right">
          <button
            type="button"
            onClick={()=>setCurrentForm("forget")}
            className="text-sm text-purple-600 hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

             <p className="mt-5 text-center text-sm text-gray-600">
                {currentForm === 'signup'
                  ? 'Already have an account? '
                  : "Don't have an account? "}

                <button
                  onClick={() =>
                    setCurrentForm(
                      currentForm === 'signup' ? 'login' : 'signup'
                    )
                  }
                  className="font-semibold text-purple-600"
                >
                  {currentForm === 'signup' ? 'Login' : 'Sign Up'}
                </button>
              </p>
    </div>
  )
}

export default Login
