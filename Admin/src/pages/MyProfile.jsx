
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axiosInstance'
import { toast } from 'react-hot-toast'
import {
    UserRound,
    Mail,
    Phone,
    ShieldCheck,
    Pencil,
    X,
    Save,
    LockKeyhole,
    ArrowRight,
    KeyRound,
    Shield,
    CheckCircle2
} from 'lucide-react'

const MyProfile = () => {

    const navigate = useNavigate()

    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editMode, setEditMode] = useState(false)
    const [updateLoading, setUpdateLoading] = useState(false)

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: ''
    })

    // GET MY PROFILE
    const getMyProfile = async () => {
        try {
            const res = await API.get('/admin/my-profile')

            if (res.data.status) {
                setProfile(res.data.data)

                setForm({
                    firstName: res.data.data.firstName || '',
                    lastName: res.data.data.lastName || '',
                    phone: res.data.data.phone || ''
                })
            }

        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Profile fetch failed'
            )
        } finally {
            setLoading(false)
        }
    }

    // HANDLE INPUT CHANGE
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    // UPDATE PROFILE
    const handleUpdateProfile = async () => {

        if (
            !form.firstName.trim() ||
            !form.lastName.trim() ||
            !form.phone.trim()
        ) {
            return toast.error('Please fill all fields')
        }

        try {
            setUpdateLoading(true)

            const res = await API.put('/admin/my-profile',form)

            if (res.data.status) {
                setProfile({
                    ...profile,
                    ...form
                })

                setEditMode(false)
                toast.success(res.data.message)
            }

        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Profile update failed'
            )
        } finally {
            setUpdateLoading(false)
        }
    }

    // CANCEL EDIT
    const handleCancel = () => {
        setForm({
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            phone: profile.phone || ''
        })

        setEditMode(false)
    }

    useEffect(() => {
        getMyProfile()
    }, [])

    // LOADING
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">
                        Loading profile...
                    </p>
                </div>
            </div>
        )
    }

    // PROFILE NOT FOUND
    if (!profile) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                <UserRound
                    size={38}
                    className="mx-auto text-slate-300 mb-3"
                />
                <p className="text-slate-600 font-medium">
                    Profile not found
                </p>
            </div>
        )
    }

    const fullName =
        `${profile.firstName || ''} ${profile.lastName || ''}`.trim()

    const details = [
        {
            label: 'First Name',
            value: profile.firstName,
            icon: UserRound
        },
        {
            label: 'Last Name',
            value: profile.lastName,
            icon: UserRound
        },
        {
            label: 'Email Address',
            value: profile.email,
            icon: Mail,
            breakAll: true
        },
        {
            label: 'Phone Number',
            value: profile.phone,
            icon: Phone
        },
        {
            label: 'Role',
            value: profile.role?.name,
            icon: ShieldCheck
        },
        {
            label: 'Account Status',
            value: profile.status,
            icon: Shield
        }
    ]

    const inputClass =
        "w-full border border-slate-200 bg-white px-4 py-3 rounded-lg text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"

    return (

        <div className="w-full min-w-0 space-y-5 sm:space-y-6">

            {/* PAGE HEADING */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                    My Profile
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                    Manage your personal information and account settings.
                </p>
            </div>

            {/* PROFILE HEADER */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 sm:p-7">

                <div className="flex flex-col sm:flex-row sm:items-center gap-5">

                    {/* AVATAR */}
                    <div className="w-[76px] h-[76px] rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                        <UserRound
                            size={37}
                            strokeWidth={1.8}
                            className="text-indigo-600"
                        />
                    </div>

                    {/* USER DETAILS */}
                    <div className="flex-1 min-w-0 text-center sm:text-left">

                        <h2 className="text-xl font-bold text-slate-800">
                            {fullName || 'My Profile'}
                        </h2>

                        <p className="text-sm text-slate-500 mt-1 break-all">
                            {profile.email}
                        </p>

                        <div className="flex justify-center sm:justify-start mt-3">

                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold capitalize">
                                <CheckCircle2 size={14} />
                                {profile.status || 'Active'}
                            </span>

                        </div>

                    </div>

                    {/* EDIT BUTTON */}
                    <button
                        type="button"
                        onClick={() =>
                            editMode
                                ? handleCancel()
                                : setEditMode(true)
                        }
                        className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0 ${
                            editMode
                                ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-100'
                        }`}
                    >
                        {editMode ? (
                            <X size={17} />
                        ) : (
                            <Pencil size={17} />
                        )}

                        {editMode ? 'Cancel Edit' : 'Edit Profile'}
                    </button>

                </div>

            </div>

            {/* MAIN SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6 items-stretch">

                {/* LEFT - CHANGE PASSWORD */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5 sm:p-6 flex flex-col">

                    {/* CARD HEADING */}
                    <div className="flex items-center gap-3 pb-5 border-b border-slate-100">

                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                            <ShieldCheck
                                size={21}
                                className="text-indigo-600"
                            />
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-slate-800">
                                Account Security
                            </h3>

                            <p className="text-xs text-slate-500 mt-1">
                                Manage your account security
                            </p>
                        </div>

                    </div>

                    {/* SECURITY CONTENT */}
                    <div className="flex-1 py-7">

                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 flex items-center justify-center mb-5">
                            <LockKeyhole
                                size={27}
                                className="text-indigo-600"
                            />
                        </div>

                        <h4 className="text-lg font-bold text-slate-800">
                            Password & Security
                        </h4>

                        <p className="text-sm text-slate-500 leading-relaxed mt-2">
                            Keep your admin account secure by maintaining a strong and unique password.
                        </p>

                        <div className="mt-6 space-y-3">

                            <div className="flex items-center gap-2.5 text-sm text-slate-600">
                                <ShieldCheck
                                    size={17}
                                    className="text-indigo-600 shrink-0"
                                />
                                Secure account access
                            </div>

                            <div className="flex items-center gap-2.5 text-sm text-slate-600">
                                <ShieldCheck
                                    size={17}
                                    className="text-indigo-600 shrink-0"
                                />
                                Protect login credentials
                            </div>

                        </div>

                    </div>

                    {/* CHANGE PASSWORD BUTTON */}
                    <div className="pt-5 border-t border-slate-100">

                        <button
                            type="button"
                            onClick={() => navigate('/change-password')}
                            className="inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all duration-200 group"
                        >
                            <KeyRound size={16} />

                            Change Password

                            <ArrowRight
                                size={16}
                                className="group-hover:translate-x-1 transition-transform"
                            />
                        </button>

                        <p className="text-xs text-slate-400 mt-3">
                            Update your password whenever needed.
                        </p>

                    </div>

                </div>

                {/* RIGHT - PERSONAL INFORMATION */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm p-5 sm:p-6">

                    {/* SECTION HEADING */}
                    <div className="flex items-center gap-3 pb-5 border-b border-slate-100 mb-7">

                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                            <UserRound
                                size={21}
                                className="text-indigo-600"
                            />
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-slate-800">
                                Personal Information
                            </h3>

                            <p className="text-xs text-slate-500 mt-1">
                                Manage your personal account details
                            </p>
                        </div>

                    </div>

                    {editMode ? (

                        /* EDIT FORM */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">

                            {/* FIRST NAME */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    First Name
                                </label>

                                <input
                                    type="text"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    placeholder="Enter first name"
                                    className={inputClass}
                                />
                            </div>

                            {/* LAST NAME */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    Last Name
                                </label>

                                <input
                                    type="text"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    placeholder="Enter last name"
                                    className={inputClass}
                                />
                            </div>

                            {/* PHONE */}
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    Phone Number
                                </label>

                                <input
                                    type="text"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                    className={inputClass}
                                />
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">

                                <button
                                    type="button"
                                    onClick={handleUpdateProfile}
                                    disabled={updateLoading}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-50"
                                >
                                    <Save size={17} />
                                    {updateLoading ? 'Saving...' : 'Save Changes'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={updateLoading}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition"
                                >
                                    <X size={17} />
                                    Cancel
                                </button>

                            </div>

                        </div>

                    ) : (

                        /* PROFILE DETAILS */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-8">

                            {details.map((item, index) => {

                                const Icon = item.icon

                                return (

                                    <div
                                        key={index}
                                        className="flex items-start gap-3 min-w-0"
                                    >

                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                            <Icon
                                                size={19}
                                                strokeWidth={1.8}
                                                className="text-indigo-600"
                                            />
                                        </div>

                                        <div className="min-w-0 pt-0.5">

                                            <p className="text-xs text-slate-500 mb-1.5">
                                                {item.label}
                                            </p>

                                            <p className={`text-sm font-semibold text-slate-800 capitalize ${
                                                item.breakAll
                                                    ? 'break-all'
                                                    : 'break-words'
                                            }`}>
                                                {item.value || 'N/A'}
                                            </p>

                                        </div>

                                    </div>

                                )
                            })}

                        </div>

                    )}

                </div>

            </div>

        </div>
    )
}

export default MyProfile
