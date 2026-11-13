import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { LockKeyhole, Eye, EyeOff, ShieldCheck } from 'lucide-react'

const ChangePassword = () => {

    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    })

    const [loading, setLoading] = useState(false)

    // Handle Input Change
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    // Toggle Password Visibility
    const togglePassword = (field) => {
        setShowPasswords({
            ...showPasswords,
            [field]: !showPasswords[field]
        })
    }

    // Change Password
    const handleChangePassword = async (e) => {
        e.preventDefault()

        if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
            return toast.error('Please fill all fields')
        }

        if (form.newPassword.length < 8) {
            return toast.error('Password must be at least 8 characters')
        }

        if (form.newPassword !== form.confirmPassword) {
            return toast.error('Passwords do not match')
        }

        if (form.currentPassword === form.newPassword) {
            return toast.error('New password must be different')
        }

        try {
            setLoading(true)

            const res = await axios.put(
                'http://localhost:8000/admin/change-password',
                {
                    currentPassword: form.currentPassword,
                    newPassword: form.newPassword
                },
                { withCredentials: true }
            )

            if (res.data.status) {
                toast.success(res.data.message)

                setForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                })

                setShowPasswords({
                    current: false,
                    new: false,
                    confirm: false
                })
            }

        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Password change failed'
            )
        } finally {
            setLoading(false)
        }
    }

    // Password Field
    const renderPasswordField = (label, name, placeholder, field) => {

        return (
            <div className="w-full min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    {label}
                </label>

                <div className="relative">
                    <input
                        type={showPasswords[field] ? 'text' : 'password'}
                        name={name}
                        value={form[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className="w-full min-w-0 border border-slate-300 rounded-lg px-3 sm:px-4 py-3 pr-11 sm:pr-12 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition text-sm sm:text-base"
                    />

                    <button
                        type="button"
                        onClick={() => togglePassword(field)}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600"
                    >
                        {showPasswords[field]
                            ? <EyeOff size={19} />
                            : <Eye size={19} />
                        }
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full min-w-0 max-w-full bg-white rounded-xl border border-slate-200 p-3 sm:p-5 md:p-6">

            {/* Heading */}
            <div className="flex items-start gap-3 mb-5 sm:mb-6">

                <div className="p-2.5 sm:p-3 bg-purple-50 rounded-xl shrink-0">
                    <LockKeyhole size={22} className="text-purple-600 sm:w-6 sm:h-6" />
                </div>

                <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                        Change Password
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Update your password to keep your account secure.
                    </p>
                </div>

            </div>

            <div className="w-full max-w-xl">

                <form onSubmit={handleChangePassword} className="space-y-5">

                    {renderPasswordField(
                        'Current Password',
                        'currentPassword',
                        'Enter current password',
                        'current'
                    )}

                    {renderPasswordField(
                        'New Password',
                        'newPassword',
                        'Enter new password',
                        'new'
                    )}

                    <p className="text-xs text-slate-400 -mt-3">
                        Password must be at least 8 characters.
                    </p>

                    {renderPasswordField(
                        'Confirm New Password',
                        'confirmPassword',
                        'Confirm new password',
                        'confirm'
                    )}

                    {/* Security Message */}
                    <div className="flex items-start gap-2 bg-purple-50 rounded-lg p-3">
                        <ShieldCheck size={18} className="text-purple-600 shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-purple-700">
                            Choose a strong password that you haven't used before.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>

                </form>

            </div>

        </div>
    )
}

export default ChangePassword