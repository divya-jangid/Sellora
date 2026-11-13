
'use client'

import { useLayoutEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

function ResetPassword({ setShowModal, setCurrentForm }) {

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [resetToken, setResetToken] = useState('')
    const [loading, setLoading] = useState(false)
    const [tokenLoading, setTokenLoading] = useState(true)

    useLayoutEffect(() => {
        setResetToken(localStorage.getItem('resetToken') || '')
        setTokenLoading(false)
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long')
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (!resetToken) {
            toast.error('Reset session expired. Please verify OTP again.')
            setCurrentForm('verify-reset-otp')
            return
        }

        try {
            setLoading(true)

            const res = await axios.post(
                'http://localhost:8000/user/reset-password',
                {
                    newPassword
                },
                {
                    headers: {
                        Authorization: `Bearer ${resetToken}`
                    },
                    withCredentials: true
                }
            )

            if (res.data.status) {
                toast.success(
                    res.data.message || 'Password reset successful!'
                )

                localStorage.removeItem('email')
                localStorage.removeItem('resetToken')

                setShowModal(false)
            } else {
                toast.error(res.data.message || 'Password reset failed')
            }

        } catch (error) {
            console.log(
                'Reset Password Error:',
                error.response?.data || error.message
            )

            toast.error(
                error.response?.data?.message || 'Password reset failed'
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

    const buttonClass = `
        w-full rounded-xl bg-gradient-to-r
        from-purple-600 to-violet-600
        py-3.5 text-sm font-bold text-white
        shadow-lg shadow-purple-200
        transition duration-200
        hover:from-purple-700 hover:to-violet-700
        disabled:cursor-not-allowed disabled:opacity-50
        disabled:shadow-none
    `

    if (tokenLoading) {
        return (
            <div className="py-10 text-center text-sm text-purple-700">
                Loading...
            </div>
        )
    }

    if (!resetToken) {
        return (
            <div className="w-full rounded-2xl border border-red-100 bg-red-50 p-5">

                <p className="text-sm font-medium text-red-700">
                    Reset session expired. Please verify OTP again.
                </p>

                <button
                    type="button"
                    onClick={() => setCurrentForm('verify-reset-otp')}
                    className={`${buttonClass} mt-4`}
                >
                    Verify OTP Again
                </button>

            </div>
        )
    }

    return (
        <div className="mx-auto w-full min-w-0 max-w-md">

            {/* Heading */}
            <div className="mb-7 text-center sm:text-left">

                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-2xl shadow-sm">
                    🔐
                </div>

                <h2 className="text-2xl font-extrabold tracking-tight text-purple-950 sm:text-3xl">
                    Reset Password
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                    Create a new password for your Sellora account.
                </p>

            </div>

            {/* Password Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

                <div>
                    <label className={labelClass}>
                        New Password
                    </label>

                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        minLength={8}
                        required
                        className={inputClass}
                    />

                    <p className="mt-1.5 text-xs text-gray-400">
                        Password must be at least 8 characters.
                    </p>
                </div>

                <div>
                    <label className={labelClass}>
                        Confirm New Password
                    </label>

                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        minLength={8}
                        required
                        className={inputClass}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={buttonClass}
                >
                    {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>

            </form>

        </div>
    )
}

export default ResetPassword
