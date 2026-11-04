
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
    LuEye,
    LuSquarePen,
    LuTrash2
} from "react-icons/lu";

const initialForm = {
    role: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    vehicleType: '',
    vehicleNumber: '',
    drivingLicenseNumber: ''
}

const UserContent = () => {
    const [showForm, setShowForm] = useState(false)
    const [users, setUsers] = useState([])
    const [roles, setRoles] = useState([])
    const [editUser, setEditUser] = useState(null)
    const [viewUser, setViewUser] = useState(null)

    const [currentUser, setCurrentUser] = useState(null)
    const [updatingStatus, setUpdatingStatus] = useState('')

    const [form, setForm] = useState(initialForm)

    // Current logged-in user
    const getCurrentUser = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/user/check-user',
                { withCredentials: true }
            )

            setCurrentUser(res.data.user)
        } catch (error) {
            console.log('Current user error:', error.response?.data || error.message)
        }
    }

    // Permissions
    const permissions = currentUser?.permissions || []

    const currentRoleName = (
        currentUser?.roleName || currentUser?.role?.name || ''
    ).toLowerCase().replace(/[_-]+/g, ' ').trim()

    const isSuperAdmin = currentRoleName === 'super admin'

    const hasPermission = (permission) => {
        return isSuperAdmin || permissions.includes(permission)
    }

    // Check selected role
    const selectedRole = roles.find(
        (role) => role._id === form.role
    )

    const isDeliveryPartner =
        selectedRole?.name?.toLowerCase().trim() === 'delivery partner'

    // Get All Users
    const getUsers = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/user/get-all',
                { withCredentials: true }
            )

            setUsers(res.data.data || [])
        } catch (error) {
            console.log('USER ERROR:', error.response?.data || error.message)
        }
    }

    // Get All Roles
    const getRoles = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/role/get-role',
                { withCredentials: true }
            )

            setRoles(res.data.data || [])
        } catch (error) {
            console.log('ROLE ERROR:', error.response?.data || error.message)
        }
    }

    useEffect(() => {
        getUsers()
        getRoles()
        getCurrentUser()
    }, [])

    // Input Change
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    // Edit User
    const handleEdit = (user) => {
        setEditUser(user)

        setForm({
            ...initialForm,
            role: user.role?._id || user.role || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || ''
        })

        setShowForm(true)
    }

    // Update Active / Inactive Status
    const handleStatusToggle = async (user) => {
        if (!hasPermission('users_edit')) return

        const newStatus =
            user.status === 'active' ? 'inactive' : 'active'

        try {
            setUpdatingStatus(user._id)

            await axios.put(
                `http://localhost:8000/user/update/${user._id}`,
                { status: newStatus },
                { withCredentials: true }
            )

            setUsers((prevUsers) =>
                prevUsers.map((item) =>
                    item._id === user._id
                        ? { ...item, status: newStatus }
                        : item
                )
            )
        } catch (error) {
            console.log(
                'Status update error:',
                error.response?.data || error.message
            )
        } finally {
            setUpdatingStatus('')
        }
    }

    // Delete User
    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            'Are you sure you want to delete this user?'
        )

        if (!confirmDelete) return

        try {
            await axios.delete(
                `http://localhost:8000/user/delete/${id}`,
                { withCredentials: true }
            )

            getUsers()
        } catch (error) {
            console.log(
                'Delete error:',
                error.response?.data || error.message
            )
        }
    }

    // Add / Update User
    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const userData = {
                role: form.role,
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                phone: form.phone
            }

            if (isDeliveryPartner) {
                userData.vehicleType = form.vehicleType
                userData.vehicleNumber = form.vehicleNumber
                userData.drivingLicenseNumber = form.drivingLicenseNumber
            }

            console.log('Sending User Data:', userData)

            let res

            if (editUser) {
                res = await axios.put(
                    `http://localhost:8000/user/update/${editUser._id}`,
                    userData,
                    { withCredentials: true }
                )
            } else {
                res = await axios.post(
                    'http://localhost:8000/user/create',
                    userData,
                    { withCredentials: true }
                )
            }

            toast.success(res.data.message || 'User created successfully')

            setForm(initialForm)
            setEditUser(null)
            setShowForm(false)

            getUsers()

        } catch (error) {
            console.log('User Submit Error:', error.response?.data || error)

            toast.error(
                error.response?.data?.message ||
                'Something went wrong while creating user'
            )
        }
    }
    // Close Form
    const closeForm = () => {
        setShowForm(false)
        setEditUser(null)
        setForm(initialForm)
    }

    return (
        <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">

            {/* Header */}
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">
                        User Management
                    </p>

                    <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                        Users
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Manage all users and their account information.
                    </p>
                </div>

                {hasPermission('users_create') && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-700"
                    >
                        <span className="text-xl">+</span>
                        Add User
                    </button>
                )}
            </div>

            {/* User Table */}
            <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">

                <div className="flex flex-col gap-1 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-bold text-slate-800">
                            All Users
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            User account details and status
                        </p>
                    </div>

                    <span className="w-fit rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-600">
                        Total: {users.length}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px] text-left">

                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                {[
                                    'First Name',
                                    'Last Name',
                                    'Email',
                                    'Phone',
                                    'Role',
                                    ...(isSuperAdmin ? ['Email Verified', 'Phone Verified'] : []),
                                    'Status',
                                    'Actions'
                                ].map((heading) => (
                                    <th
                                        key={heading}
                                        className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">

                            {users.map((user) => (
                                <tr
                                    key={user._id}
                                    className="transition-colors duration-150 hover:bg-indigo-50/40"
                                >
                                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                                        {user.firstName}
                                    </td>

                                    <td className="px-5 py-4 text-sm text-slate-700">
                                        {user.lastName}
                                    </td>

                                    <td className="px-5 py-4 text-sm text-slate-600">
                                        {user.email}
                                    </td>

                                    <td className="px-5 py-4 text-sm text-slate-600">
                                        {user.phone}
                                    </td>

                                    <td className="px-5 py-4">
                                        <span className="inline-flex rounded-lg bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                                            {user.role?.name || 'N/A'}
                                        </span>
                                    </td>

                                    {/* Verification Status - Super Admin Only */}
                                    {isSuperAdmin && (
                                        <>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.isEmailVerified
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                    {user.isEmailVerified ? 'Yes' : 'No'}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.isPhoneVerified
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                    {user.isPhoneVerified ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                        </>
                                    )}

                                    {/* Status Toggle */}
                                    <td className="px-5 py-4">
                                        <button
                                            type="button"
                                            disabled={
                                                !hasPermission('users_edit') ||
                                                updatingStatus === user._id
                                            }
                                            onClick={() => handleStatusToggle(user)}
                                            className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${user.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {updatingStatus === user._id
                                                ? 'Updating...'
                                                : user.status === 'active'
                                                    ? 'Active'
                                                    : 'Inactive'}
                                        </button>
                                    </td>



                                    {/* Actions */}
                                    <td className="whitespace-nowrap px-5 py-4">
                                        <div className="flex items-center gap-2">

                                            {hasPermission('users_view') && (
                                                <button
                                                    onClick={() => setViewUser(user)}
                                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                                >
                                                    <LuEye />

                                                </button>
                                            )}

                                            {hasPermission('users_edit') && (
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                                                >
                                                    <LuSquarePen />

                                                </button>
                                            )}

                                            {hasPermission('users_delete') && (
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                                >
                                                    <LuTrash2 />
                                                </button>
                                            )}

                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {users.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={isSuperAdmin ? 10 : 7}
                                        className="px-5 py-10 text-center text-sm text-slate-500"
                                    >
                                        No users found.
                                    </td>
                                </tr>
                            )}

                        </tbody>
                    </table>
                </div>
            </div>

            {/* View User Modal */}
            {viewUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">

                    <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-5">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">
                                    User Details
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-800">
                                    {viewUser.firstName} {viewUser.lastName}
                                </h2>
                            </div>

                            <button
                                onClick={() => setViewUser(null)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xl text-slate-500 shadow-sm hover:text-red-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4 p-6">

                            {[
                                ['First Name', viewUser.firstName],
                                ['Last Name', viewUser.lastName],
                                ['Email', viewUser.email],
                                ['Phone', viewUser.phone],
                                ['Role', viewUser.role?.name || 'N/A'],
                                ...(isSuperAdmin ? [
                                    ['Email Verified', viewUser.isEmailVerified ? 'Yes' : 'No'],
                                    ['Phone Verified', viewUser.isPhoneVerified ? 'Yes' : 'No']
                                ] : []),
                                ['Status', viewUser.status],
                                ...(isSuperAdmin ? [[
                                    'Last Login',
                                    viewUser.lastLoginAt
                                        ? new Date(viewUser.lastLoginAt).toLocaleString()
                                        : 'Never'
                                ]] : [])
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <span className="text-sm font-semibold text-slate-500">
                                        {label}
                                    </span>

                                    <span className="break-all text-sm font-medium text-slate-800">
                                        {value || 'N/A'}
                                    </span>
                                </div>
                            ))}

                        </div>

                        <div className="border-t border-slate-100 p-5 text-right">
                            <button
                                onClick={() => setViewUser(null)}
                                className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Add / Edit Form */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">

                    <div className="my-auto max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-indigo-100 bg-white shadow-2xl">

                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-5">
                            <div>
                                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-500">
                                    User Management
                                </p>

                                <h2 className="text-xl font-bold text-slate-800">
                                    {editUser ? 'Edit User' : 'Add User'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xl text-slate-500 shadow-sm hover:bg-red-50 hover:text-red-600"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 p-6">

                            {/* First Name */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    First Name
                                </label>

                                <input
                                    type="text"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    placeholder="Enter first name"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    required
                                />
                            </div>

                            {/* Last Name */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Last Name
                                </label>

                                <input
                                    type="text"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    placeholder="Enter last name"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Enter email"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    required
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Phone
                                </label>

                                <input
                                    type="text"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="Enter phone"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    required
                                />
                            </div>

                            {/* Role */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Role
                                </label>

                                <select
                                    name="role"
                                    value={form.role}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    required
                                >
                                    <option value="">Select Role</option>

                                    {roles.map((role) => (
                                        <option
                                            key={role._id}
                                            value={role._id}
                                        >
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Delivery Partner Fields */}
                            {isDeliveryPartner && (
                                <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50 p-4">

                                    <h3 className="font-bold text-violet-700">
                                        Delivery Partner Details
                                    </h3>

                                    {/* Vehicle Type */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Vehicle Type
                                        </label>

                                        <select
                                            name="vehicleType"
                                            value={form.vehicleType}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400"
                                        >
                                            <option value="">Select Vehicle</option>
                                            <option value="Bike">Bike</option>
                                            <option value="Scooter">Scooter</option>
                                            <option value="Cycle">Cycle</option>
                                        </select>
                                    </div>

                                    {/* Vehicle Number */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Vehicle Number
                                        </label>

                                        <input
                                            type="text"
                                            name="vehicleNumber"
                                            value={form.vehicleNumber}
                                            onChange={handleChange}
                                            placeholder="RJ14AB1234"
                                            required
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400"
                                        />
                                    </div>

                                    {/* Driving License */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Driving License Number
                                        </label>

                                        <input
                                            type="text"
                                            name="drivingLicenseNumber"
                                            value={form.drivingLicenseNumber}
                                            onChange={handleChange}
                                            placeholder="Enter driving license number"
                                            required
                                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400"
                                        />
                                    </div>

                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:from-indigo-700 hover:to-violet-700"
                                >
                                    {editUser ? 'Update User' : 'Add User'}
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}

export default UserContent
