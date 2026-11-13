
'use client'

import { useLayoutEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

function VerifyResetOTP({ setCurrentForm }) {

    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [emailLoading, setEmailLoading] = useState(true)

    useLayoutEffect(() => {
        setEmail(localStorage.getItem('email') || '')
        setEmailLoading(false)
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (otp.length !== 6) {
            toast.error('Please enter valid 6-digit OTP')
            return
        }

        try {
            setLoading(true)

            const res = await axios.post(
                'http://localhost:8000/user/verify-reset-otp',
                {
                    email,
                    otp
                },
                {
                    withCredentials: true
                }
            )

            if (res.data.status) {
                localStorage.setItem(
                    'resetToken',
                    res.data.resetToken
                )

                toast.success(res.data.message)

                setCurrentForm('reset')
            } else {
                toast.error(res.data.message || 'OTP verification failed')
            }

        } catch (error) {
            console.log(
                'Verify Reset OTP Error:',
                error.response?.data || error.message
            )

            toast.error(
                error.response?.data?.message || 'OTP verification failed'
            )
        } finally {
            setLoading(false)
        }
    }

    const inputClass = `
        w-full min-w-0 rounded-xl border border-purple-200
        bg-white px-4 py-3 text-center text-lg font-bold
        tracking-[0.5em] text-gray-800 outline-none
        transition focus:border-purple-500
        focus:ring-4 focus:ring-purple-100
    `

    const buttonClass = `
        w-full rounded-xl bg-gradient-to-r
        from-purple-600 to-violet-600 py-3.5
        text-sm font-bold text-white shadow-lg
        shadow-purple-200 transition hover:from-purple-700
        hover:to-violet-700 disabled:cursor-not-allowed
        disabled:opacity-50
    `

    if (emailLoading) {
        return (
            <div className="py-10 text-center text-sm text-purple-700">
                Loading...
            </div>
        )
    }

    if (!email) {
        return (
            <div className="py-6 text-center">
                <p className="text-sm text-red-600">
                    Email not found. Please try Forgot Password again.
                </p>

                <button
                    type="button"
                    onClick={() => setCurrentForm('forget')}
                    className={`${buttonClass} mt-4`}
                >
                    Go Back
                </button>
            </div>
        )
    }

    return (
        <div className="mx-auto w-full min-w-0 max-w-md">

            <div className="mb-7 text-center sm:text-left">

                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-2xl">
                    🔐
                </div>

                <h2 className="text-2xl font-extrabold text-purple-950 sm:text-3xl">
                    Verify OTP
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                    Enter the 6-digit OTP sent to your registered email address.
                </p>

            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

                <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Verification OTP
                    </label>

                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) =>
                            setOtp(
                                e.target.value.replace(/\D/g, '').slice(0, 6)
                            )
                        }
                        placeholder="Enter 6-digit OTP"
                        required
                        className={inputClass}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className={buttonClass}
                >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                    type="button"
                    onClick={() => setCurrentForm('forget')}
                    className="w-full rounded-xl border border-purple-200 bg-white py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                >
                    Request a New OTP
                </button>

            </form>

        </div>
    )
}

export default VerifyResetOTP
