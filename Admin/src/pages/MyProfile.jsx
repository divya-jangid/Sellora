import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
    UserRound,
    Mail,
    Phone,
    ShieldCheck,
    Pencil,
    X,
    Save
} from 'lucide-react'

const MyProfile = () => {

    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editMode, setEditMode] = useState(false)
    const [updateLoading, setUpdateLoading] = useState(false)

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: ''
    })

    // Get My Profile
    const getMyProfile = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/admin/my-profile',
                { withCredentials: true }
            )

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

    // Handle Input Change
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    // Update Profile
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

            const res = await axios.put(
                'http://localhost:8000/admin/my-profile',
                form,
                { withCredentials: true }
            )

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

    // Cancel Edit
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

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[250px] sm:min-h-[300px]">
                <p className="text-slate-500 text-sm sm:text-base">
                    Loading profile...
                </p>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-8 text-center">
                <p className="text-slate-500 text-sm sm:text-base">
                    Profile not found
                </p>
            </div>
        )
    }

    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()

    return (
        <div className="w-full min-w-0 max-w-full overflow-x-hidden space-y-4 sm:space-y-6">

            {/* Profile Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">

                    {/* Profile Icon */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                        <UserRound
                            size={32}
                            className="text-purple-600 sm:hidden"
                        />

                        <UserRound
                            size={38}
                            className="text-purple-600 hidden sm:block"
                        />
                    </div>

                    {/* Profile Details */}
                    <div className="flex-1 min-w-0 text-center sm:text-left">

                        <h2 className="text-lg sm:text-xl font-bold text-slate-800 break-words">
                            {fullName || 'My Profile'}
                        </h2>

                        <p className="text-xs sm:text-sm text-slate-500 mt-1 break-all">
                            {profile.email}
                        </p>

                        <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold capitalize">
                            <ShieldCheck size={14} />
                            {profile.status || 'Active'}
                        </span>

                    </div>

                    {/* Edit Button */}
                    <button
                        onClick={() => editMode ? handleCancel() : setEditMode(true)}
                        className={`w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                            editMode
                                ? 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                    >
                        {editMode ? <X size={17} /> : <Pencil size={17} />}

                        {editMode ? 'Cancel Edit' : 'Edit Profile'}
                    </button>

                </div>

            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">

                {/* Section Heading */}
                <div className="mb-5 sm:mb-6">

                    <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                        Personal Information
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Manage your personal account details.
                    </p>

                </div>

                {editMode ? (

                    /* Edit Form */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">

                        {/* First Name */}
                        <div className="min-w-0">

                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                First Name
                            </label>

                            <input
                                type="text"
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                placeholder="Enter first name"
                                className="w-full min-w-0 border border-slate-300 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                            />

                        </div>

                        {/* Last Name */}
                        <div className="min-w-0">

                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                Last Name
                            </label>

                            <input
                                type="text"
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                placeholder="Enter last name"
                                className="w-full min-w-0 border border-slate-300 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                            />

                        </div>

                        {/* Phone Number */}
                        <div className="min-w-0">

                            <label className="block text-sm font-medium text-slate-600 mb-2">
                                Phone Number
                            </label>

                            <input
                                type="text"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                                className="w-full min-w-0 border border-slate-300 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                            />

                        </div>

                        {/* Action Buttons */}
                        <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">

                            <button
                                onClick={handleUpdateProfile}
                                disabled={updateLoading}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition"
                            >
                                <Save size={17} />

                                {updateLoading ? 'Saving...' : 'Save Changes'}
                            </button>

                            <button
                                onClick={handleCancel}
                                disabled={updateLoading}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 border border-slate-300 text-slate-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50"
                            >
                                <X size={17} />
                                Cancel
                            </button>

                        </div>

                    </div>

                ) : (

                    /* Profile Information */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">

                        {/* First Name */}
                        <div className="flex items-start gap-3 min-w-0">

                            <div className="p-2.5 bg-purple-50 rounded-lg shrink-0">
                                <UserRound size={19} className="text-purple-600" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 mb-1">
                                    First Name
                                </p>

                                <p className="text-sm font-semibold text-slate-800 break-words">
                                    {profile.firstName || 'N/A'}
                                </p>
                            </div>

                        </div>

                        {/* Last Name */}
                        <div className="flex items-start gap-3 min-w-0">

                            <div className="p-2.5 bg-purple-50 rounded-lg shrink-0">
                                <UserRound size={19} className="text-purple-600" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 mb-1">
                                    Last Name
                                </p>

                                <p className="text-sm font-semibold text-slate-800 break-words">
                                    {profile.lastName || 'N/A'}
                                </p>
                            </div>

                        </div>

                        {/* Email */}
                        <div className="flex items-start gap-3 min-w-0">

                            <div className="p-2.5 bg-purple-50 rounded-lg shrink-0">
                                <Mail size={19} className="text-purple-600" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 mb-1">
                                    Email Address
                                </p>

                                <p className="text-sm font-semibold text-slate-800 break-all">
                                    {profile.email || 'N/A'}
                                </p>
                            </div>

                        </div>

                        {/* Phone */}
                        <div className="flex items-start gap-3 min-w-0">

                            <div className="p-2.5 bg-purple-50 rounded-lg shrink-0">
                                <Phone size={19} className="text-purple-600" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 mb-1">
                                    Phone Number
                                </p>

                                <p className="text-sm font-semibold text-slate-800 break-words">
                                    {profile.phone || 'N/A'}
                                </p>
                            </div>

                        </div>

                        {/* Role */}
                        <div className="flex items-start gap-3 min-w-0">

                            <div className="p-2.5 bg-purple-50 rounded-lg shrink-0">
                                <ShieldCheck size={19} className="text-purple-600" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 mb-1">
                                    Role
                                </p>

                                <p className="text-sm font-semibold text-slate-800 capitalize break-words">
                                    {profile.role?.name || 'N/A'}
                                </p>
                            </div>

                        </div>

                        {/* Account Status */}
                        <div className="flex items-start gap-3 min-w-0">

                            <div className="p-2.5 bg-purple-50 rounded-lg shrink-0">
                                <ShieldCheck size={19} className="text-purple-600" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 mb-1">
                                    Account Status
                                </p>

                                <p className="text-sm font-semibold text-slate-800 capitalize break-words">
                                    {profile.status || 'N/A'}
                                </p>
                            </div>

                        </div>

                    </div>

                )}

            </div>

        </div>
    )
}

export default MyProfile