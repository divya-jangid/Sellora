import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'




const Login = () => {
    
    const [form, SetForm] = useState({
        email: '',
        password: ''
    })


    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()


        try {

            const res = await axios.post(
                'http://localhost:8000/admin/login',
                form,
                {
                    withCredentials: true
                }
            )

            console.log('resss',res)

            if (res?.data?.status) {
                toast.success('Login Successfully',{
                    duration:3000
                })
                navigate('/dashboard', {
                    state: { user: res.data.user }
                })
            } else {
                toast.error(res.data.message || 'Access denied')
            }

            console.log(res)

        }
        catch (err) {
            toast.error(err.message)
        }

        SetForm({
            email: '',
            password: ''
        })
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-950 flex items-center justify-center px-4">


            {/* BACKGROUND */}


            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
            </div>


            {/* Large glowing circles */}

            <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-3xl">
            </div>

            <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-3xl">
            </div>

            <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl">
            </div>


            {/* Grid Pattern */}

            <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage: `
                            linear-gradient(#ffffff 1px, transparent 1px),
                            linear-gradient(90deg, #ffffff 1px, transparent 1px)
                        `,
                    backgroundSize: '45px 45px'
                }}
            >
            </div>


            {/* ================================================= */}
            {/* FLOATING BACKGROUND CARDS */}
            {/* ================================================= */}

            {/* Left Card */}

            <div className="hidden lg:block absolute left-16 top-1/3 w-52 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 rotate-[-8deg] shadow-2xl">

                <div className="flex items-center gap-3 mb-4">

                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl">
                        📦
                    </div>

                    <div>
                        <p className="text-white text-sm font-semibold">
                            Products
                        </p>

                        <p className="text-slate-400 text-xs">
                            Store inventory
                        </p>
                    </div>

                </div>

                <div className="h-2 bg-white/10 rounded-full overflow-hidden">

                    <div className="h-full w-3/4 bg-indigo-500 rounded-full">
                    </div>

                </div>

                <p className="text-slate-400 text-xs mt-3">
                    75% inventory managed
                </p>

            </div>


            {/* Right Card */}

            <div className="hidden lg:block absolute right-16 top-1/4 w-52 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 rotate-[7deg] shadow-2xl">

                <div className="flex items-center justify-between">

                    <div>
                        <p className="text-slate-400 text-xs">
                            Total Sales
                        </p>

                        <p className="text-white text-2xl font-bold mt-1">
                            ₹25K
                        </p>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        💰
                    </div>

                </div>

                <p className="text-green-400 text-xs mt-4">
                    ↑ 15% this month
                </p>

            </div>


            {/* Bottom Right Card */}

            <div className="hidden lg:block absolute right-24 bottom-20 w-56 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 rotate-[-5deg] shadow-2xl">

                <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                        ✓
                    </div>

                    <div>
                        <p className="text-white text-sm font-semibold">
                            Order Completed
                        </p>

                        <p className="text-slate-400 text-xs">
                            Successfully delivered
                        </p>
                    </div>

                </div>

            </div>


            {/* Bottom Left Decorative Card */}

            <div className="hidden lg:block absolute left-28 bottom-20 w-44 h-28 bg-gradient-to-br from-indigo-600/30 to-purple-600/20 backdrop-blur-md border border-white/10 rounded-2xl rotate-[6deg] shadow-2xl">

                <div className="h-full flex flex-col items-center justify-center">

                    <span className="text-3xl">
                        🛍️
                    </span>

                    <p className="text-white font-bold mt-2">
                        Sellora
                    </p>

                    <p className="text-slate-400 text-[10px]">
                        Shop • Sell • Grow
                    </p>

                </div>

            </div>


            {/* ================================================= */}
            {/* LOGIN CARD */}
            {/* ================================================= */}

            <form
                onSubmit={handleSubmit}
                className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20"
            >

                {/* Top Section */}

                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 px-8 py-8 text-center">

                    <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-4">

                        <span className="text-3xl font-bold text-slate-900">
                            S
                        </span>

                    </div>

                    <h1 className="text-2xl font-bold text-white">
                        Sellora Admin
                    </h1>

                    <p className="text-indigo-200 text-sm mt-1">
                        Administration Panel
                    </p>

                </div>


                {/* Form */}

                <div className="p-8">

                    <div className="mb-7">

                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                            Admin Access
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-2">
                            Welcome Back
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Login to manage your Sellora store.
                        </p>

                    </div>


                    {/* Email */}

                    <div className="mb-5">

                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Email Address
                        </label>

                        <div className="relative">

                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                ✉
                            </span>

                            <input
                                type="email"
                                placeholder="Enter admin email"
                                value={form.email}
                                onChange={(e) =>
                                    SetForm({
                                        ...form,
                                        email: e.target.value
                                    })
                                }
                                className="w-full h-13 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition"
                            />

                        </div>

                    </div>


                    {/* Password */}

                    <div className="mb-6">

                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Password
                        </label>

                        <div className="relative">

                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                🔒
                            </span>

                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={(e) =>
                                    SetForm({
                                        ...form,
                                        password: e.target.value
                                    })
                                }
                                className="w-full h-13 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition"
                            />

                        </div>

                    </div>


                    {/* Login Button */}

                    <button
                        type="submit"
                        className="w-full h-13 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition duration-300"
                    >
                        Login to Dashboard
                    </button>


                    {/* Security */}

                    <div className="flex items-center justify-center gap-2 mt-6">

                        <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center">

                            <span className="text-green-600 text-xs">
                                ✓
                            </span>

                        </div>

                        <p className="text-xs text-slate-400">
                            Secure admin access
                        </p>

                    </div>

                </div>

            </form>

        </div>
    )
}

export default Login