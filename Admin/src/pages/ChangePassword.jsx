
import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
    LockKeyhole,
    Eye,
    EyeOff,
    ShieldCheck,
    KeyRound,
    CheckCircle2,
    Fingerprint,
    Shield,
    ArrowRight,
    Check,
    Sparkles
} from 'lucide-react'

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

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const togglePassword = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }))
    }

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

    const passwordFields = [
        {
            label: 'Current Password',
            name: 'currentPassword',
            placeholder: 'Enter your current password',
            field: 'current',
            autoComplete: 'current-password'
        },
        {
            label: 'New Password',
            name: 'newPassword',
            placeholder: 'Create a new password',
            field: 'new',
            autoComplete: 'new-password'
        },
        {
            label: 'Confirm New Password',
            name: 'confirmPassword',
            placeholder: 'Re-enter your new password',
            field: 'confirm',
            autoComplete: 'new-password'
        }
    ]

    const renderPasswordField = ({
        label,
        name,
        placeholder,
        field,
        autoComplete
    }) => (
        <div key={name}>
            <label
                htmlFor={name}
                className="block text-sm font-semibold text-slate-700 mb-2"
            >
                {label}
            </label>

            <div className="relative group">
                <KeyRound
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                />

                <input
                    id={name}
                    type={showPasswords[field] ? 'text' : 'password'}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all hover:border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />

                <button
                    type="button"
                    onClick={() => togglePassword(field)}
                    aria-label={showPasswords[field] ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                    {showPasswords[field]
                        ? <EyeOff size={18} />
                        : <Eye size={18} />
                    }
                </button>
            </div>
        </div>
    )

    return (
        <div className="w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

            {/* PAGE HEADING */}
            <div className="mb-7">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
                    <ShieldCheck size={15} />
                    ACCOUNT SETTINGS
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Change Password
                </h1>

                <p className="text-sm text-slate-500 mt-2">
                    Manage your password and keep your account protected.
                </p>
            </div>

            {/* MAIN CONTENT */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">

                {/* LEFT SECURITY PANEL */}
                <div className="xl:col-span-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-700 p-6 sm:p-8 text-white shadow-lg shadow-indigo-200/50">

                    {/* Decorative elements */}
                    <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full border border-white/10" />
                    <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border border-white/10" />
                    <div className="absolute -bottom-20 -left-16 w-52 h-52 rounded-full bg-white/5" />

                    <div className="relative z-10 flex flex-col h-full">

                        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-sm mb-7">
                            <Fingerprint size={29} />
                        </div>

                        <span className="text-xs font-semibold tracking-[0.16em] text-indigo-100 uppercase">
                            Security Center
                        </span>

                        <h2 className="text-2xl sm:text-3xl font-bold leading-tight mt-3">
                            Your security starts with a strong password.
                        </h2>

                        <p className="text-sm text-indigo-100 leading-relaxed mt-4 max-w-sm">
                            Keep your admin account safe by choosing a password that is difficult to guess and unique to your account.
                        </p>

                        <div className="mt-9 space-y-5">

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                                    <Check size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Use a strong password</p>
                                    <p className="text-xs text-indigo-100 mt-1">
                                        Keep it at least 8 characters long.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                                    <Shield size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Keep it private</p>
                                    <p className="text-xs text-indigo-100 mt-1">
                                        Never share your password with anyone.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                                    <LockKeyhole size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Avoid reused passwords</p>
                                    <p className="text-xs text-indigo-100 mt-1">
                                        Use a unique password for your admin account.
                                    </p>
                                </div>
                            </div>

                        </div>

                        <div className="mt-auto pt-9">
                            <div className="flex items-center gap-2 text-xs text-indigo-100 border-t border-white/15 pt-5">
                                <ShieldCheck size={15} />
                                Your account security matters
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT FORM PANEL */}
                <div className="xl:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                    {/* FORM HEADER */}
                    <div className="px-5 py-5 sm:px-7 sm:py-6 border-b border-slate-100 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <LockKeyhole size={21} />
                        </div>

                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                Password Settings
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                Enter your current password and choose a new one.
                            </p>
                        </div>
                    </div>

                    {/* FORM BODY */}
                    <div className="p-5 sm:p-7 lg:p-8">

                        <form onSubmit={handleChangePassword} className="max-w-2xl space-y-6">

                            <div className="space-y-5">
                                {passwordFields.map(field => renderPasswordField(field))}
                            </div>

                            {/* PASSWORD REQUIREMENT */}
                            <div className="flex items-center gap-3 rounded-xl bg-indigo-50/70 border border-indigo-100 px-4 py-3">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shrink-0">
                                    <CheckCircle2 size={17} />
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-slate-700">
                                        Password requirement
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Your new password must contain at least 8 characters.
                                    </p>
                                </div>
                            </div>

                            {/* SECURITY NOTE */}
                            <div className="flex items-start gap-3 pt-1">
                                <ShieldCheck size={17} className="text-slate-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    For your protection, make sure your new password is unique and not used on other websites.
                                </p>
                            </div>

                            {/* ACTION */}
                            <div className="pt-2 border-t border-slate-100">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                                >
                                    {loading ? (
                                        <>
                                            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <LockKeyhole size={17} />
                                            Update Password
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>

            {/* BOTTOM INFO */}
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
                <Sparkles size={14} className="text-indigo-400" />
                Keep your account secure with a strong and unique password.
            </div>

        </div>
    )
}

export default ChangePassword
