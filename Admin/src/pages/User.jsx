
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
    LuEye,
    LuSquarePen,
    LuTrash2,
    LuUsers,
    LuSearch,
    LuPlus,
    LuX,
    LuChevronLeft,
    LuChevronRight,
    LuMail,
    LuPhone,
    LuShieldCheck
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

const User = () => {
    const [showForm, setShowForm] = useState(false)
    const [users, setUsers] = useState([])
    const [roles, setRoles] = useState([])
    const [editUser, setEditUser] = useState(null)
    const [viewUser, setViewUser] = useState(null)

    const [currentUser, setCurrentUser] = useState(null)
    const [updatingStatus, setUpdatingStatus] = useState('')

    const [form, setForm] = useState(initialForm)

    // Backend Search, Sorting and Pagination
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [order, setOrder] = useState('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const limit = 10

    const [pagination, setPagination] = useState({
        totalUsers: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    })

    // Current logged-in user
    const getCurrentUser = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/user/check-user',
                { withCredentials: true }
            )

            setCurrentUser(res.data.user)
        } catch (error) {
            console.log(
                'Current user error:',
                error.response?.data || error.message
            )
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

    // Get All Users - Backend Search, Sorting, Pagination
    const getUsers = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/user/get-all',
                {
                    withCredentials: true,
                    params: {
                        page: currentPage,
                        limit,
                        search,
                        sortBy,
                        order
                    }
                }
            )

            setUsers(res.data.data || [])

            if (res.data.pagination) {
                setPagination(res.data.pagination)
            }

        } catch (error) {
            console.log(
                'USER ERROR:',
                error.response?.data || error.message
            )
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
            console.log(
                'ROLE ERROR:',
                error.response?.data || error.message
            )
        }
    }

    // Fetch users whenever search, sorting or page changes
    useEffect(() => {
        getUsers()
    }, [currentPage, search, sortBy, order])

    // Fetch roles and current user only once
    useEffect(() => {
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

        try {
            setUpdatingStatus(user._id)

            const res = await axios.put(
                `http://localhost:8000/user/update-status/${user._id}`,
                {},
                { withCredentials: true }
            )

            const updatedStatus = res.data.data.status

            setUsers((prevUsers) =>
                prevUsers.map((item) =>
                    item._id === user._id
                        ? { ...item, status: updatedStatus }
                        : item
                )
            )

            toast.success(res.data.message)

        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Status update failed'
            )
        } finally {
            setUpdatingStatus('')
        }
    }

    // Delete User
    const handleDelete = async (id) => {
        try {
            await axios.delete(
                `http://localhost:8000/user/delete/${id}`,
                { withCredentials: true }
            )

            toast.success('User deleted successfully')

            if (users.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1)
            } else {
                getUsers()
            }

        } catch (error) {
            console.log(
                'Delete error:',
                error.response?.data || error.message
            )

            toast.error(
                error.response?.data?.message || 'User delete failed'
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

            toast.success(
                res.data.message || 'User saved successfully'
            )

            setForm(initialForm)
            setEditUser(null)
            setShowForm(false)

            getUsers()

        } catch (error) {
            console.log(
                'User Submit Error:',
                error.response?.data || error
            )

            toast.error(
                error.response?.data?.message ||
                'Something went wrong while saving user'
            )
        }
    }

    // Close Form
    const closeForm = () => {
        setShowForm(false)
        setEditUser(null)
        setForm(initialForm)
    }

    // Reusable status UI
    const StatusToggle = ({ user }) => (
        <div className="flex items-center gap-3">
            <span
                className={`inline-flex min-w-[76px] justify-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                    user.status === 'active'
                        ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200'
                        : 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-200'
                }`}
            >
                {user.status === 'active' ? 'Active' : 'Inactive'}
            </span>

            <button
                type="button"
                disabled={
                    !hasPermission('users_edit') ||
                    updatingStatus === user._id
                }
                onClick={() => handleStatusToggle(user)}
                title="Change user status"
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                    user.status === 'active'
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                }`}
            >
                <span
                    className={`block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        user.status === 'active'
                            ? 'translate-x-5'
                            : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    )

    // User action buttons
    const UserActions = ({ user }) => (
        <div className="flex items-center gap-2">
            {hasPermission('users_view') && (
                <button
                    type="button"
                    onClick={() => setViewUser(user)}
                    title="View User"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white"
                >
                    <LuEye size={17} />
                </button>
            )}

            {hasPermission('users_edit') && (
                <button
                    type="button"
                    onClick={() => handleEdit(user)}
                    title="Edit User"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 transition hover:bg-violet-600 hover:text-white"
                >
                    <LuSquarePen size={17} />
                </button>
            )}

            {hasPermission('users_delete') && (
                <button
                    type="button"
                    onClick={() => handleDelete(user._id)}
                    title="Delete User"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
                >
                    <LuTrash2 size={17} />
                </button>
            )}
        </div>
    )

    // Form input styling
    const inputClass =
        "w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"

    return (
        <div className="min-h-full w-full overflow-x-hidden bg-slate-50 p-3 sm:p-5 lg:p-8">

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500 sm:text-xs">
                        User Management
                    </p>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                        Users
                    </h1>

                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        Manage all users and their account information.
                    </p>
                </div>

                {hasPermission('users_create') && (
                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700 sm:w-auto"
                    >
                        <LuPlus size={20} />
                        Add User
                    </button>
                )}
            </div>

            {/* Main User Container */}
            <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">

                {/* Search and Sorting Header */}
                <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-4 sm:p-5">

                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                                All Users
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                User account details and status
                            </p>
                        </div>

                        <span className="w-fit rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600">
                            Total Users: {pagination.totalUsers}
                        </span>
                    </div>

                    {/* Search and Sorting */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

                        <div className="relative sm:col-span-2 lg:col-span-1">
                            <LuSearch
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={18}
                            />

                            <input
                                type="text"
                                placeholder="Search name, email, phone or role..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>

                        <select
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400"
                        >
                            <option value="createdAt">Created Date</option>
                            <option value="firstName">First Name</option>
                            <option value="lastName">Last Name</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="status">Status</option>
                        </select>

                        <select
                            value={order}
                            onChange={(e) => {
                                setOrder(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400"
                        >
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>

                    </div>
                </div>

                {/* MOBILE AND TABLET USER CARDS */}
                <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">

                    {users.map((user) => (
                        <div
                            key={user._id}
                            className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                        >

                            {/* User Name and Role */}
                            <div className="mb-4 flex items-start justify-between gap-3">

                                <div className="flex min-w-0 items-center gap-3">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold uppercase text-white">
                                        {user.firstName?.charAt(0)}
                                        {user.lastName?.charAt(0)}
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="break-words text-sm font-bold text-slate-800">
                                            {user.firstName} {user.lastName}
                                        </h3>

                                        <span className="mt-1 inline-flex max-w-full rounded-md bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700">
                                            {user.role?.name || 'N/A'}
                                        </span>
                                    </div>

                                </div>

                                <span className="shrink-0 text-[10px] font-medium text-slate-400">
                                    User
                                </span>

                            </div>

                            {/* User Details */}
                            <div className="space-y-3 border-y border-slate-100 py-3">

                                <div className="flex min-w-0 items-start gap-2">
                                    <LuMail
                                        size={16}
                                        className="mt-0.5 shrink-0 text-indigo-500"
                                    />

                                    <span className="break-all text-xs text-slate-600">
                                        {user.email}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <LuPhone
                                        size={16}
                                        className="shrink-0 text-indigo-500"
                                    />

                                    <span className="text-xs text-slate-600">
                                        {user.phone}
                                    </span>
                                </div>

                                {isSuperAdmin && (
                                    <div className="flex flex-wrap gap-2 pt-1">

                                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                            user.isEmailVerified
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-amber-50 text-amber-700'
                                        }`}>
                                            Email: {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                                        </span>

                                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                            user.isPhoneVerified
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-amber-50 text-amber-700'
                                        }`}>
                                            Phone: {user.isPhoneVerified ? 'Verified' : 'Not Verified'}
                                        </span>

                                    </div>
                                )}

                            </div>

                            {/* Status and Actions */}
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

                                <StatusToggle user={user} />

                                <UserActions user={user} />

                            </div>

                        </div>
                    ))}

                    {users.length === 0 && (
                        <div className="col-span-full py-10 text-center">
                            <LuUsers
                                size={35}
                                className="mx-auto mb-3 text-slate-300"
                            />

                            <p className="text-sm font-semibold text-slate-600">
                                {search
                                    ? 'No matching users found.'
                                    : 'No users found.'}
                            </p>
                        </div>
                    )}

                </div>

                {/* DESKTOP TABLE */}
                <div className="hidden overflow-x-auto lg:block">

                    <table className="w-full text-left">

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
                                        className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 xl:px-5"
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
                                    className="transition-colors hover:bg-indigo-50/40"
                                >

                                    <td className="px-4 py-4 text-sm font-semibold text-slate-800 xl:px-5">
                                        {user.firstName}
                                    </td>

                                    <td className="px-4 py-4 text-sm text-slate-700 xl:px-5">
                                        {user.lastName}
                                    </td>

                                    <td className="break-all px-4 py-4 text-sm text-slate-600 xl:px-5">
                                        {user.email}
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 xl:px-5">
                                        {user.phone}
                                    </td>

                                    <td className="px-4 py-4 xl:px-5">
                                        <span className="inline-flex rounded-lg bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                                            {user.role?.name || 'N/A'}
                                        </span>
                                    </td>

                                    {isSuperAdmin && (
                                        <>
                                            <td className="px-4 py-4 xl:px-5">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                    user.isEmailVerified
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {user.isEmailVerified ? 'Yes' : 'No'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 xl:px-5">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                    user.isPhoneVerified
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {user.isPhoneVerified ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                        </>
                                    )}

                                    <td className="px-4 py-4 xl:px-5">
                                        <StatusToggle user={user} />
                                    </td>

                                    <td className="px-4 py-4 xl:px-5">
                                        <UserActions user={user} />
                                    </td>

                                </tr>
                            ))}

                            {users.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={isSuperAdmin ? 9 : 7}
                                        className="px-5 py-12 text-center text-sm text-slate-500"
                                    >
                                        {search
                                            ? 'No matching users found.'
                                            : 'No users found.'}
                                    </td>
                                </tr>
                            )}

                        </tbody>
                    </table>
                </div>

                {/* Backend Pagination */}
                <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

                    <p className="text-center text-xs text-slate-500 sm:text-left sm:text-sm">
                        Page {pagination.currentPage || 1} of {pagination.totalPages || 0}
                        {' '} | Total Users: {pagination.totalUsers || 0}
                    </p>

                    <div className="flex items-center justify-center gap-2">

                        <button
                            type="button"
                            disabled={!pagination.hasPrevPage}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                        >
                            <LuChevronLeft size={16} />
                            Previous
                        </button>

                        <span className="rounded-lg bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
                            {pagination.currentPage || 1}
                        </span>

                        <button
                            type="button"
                            disabled={!pagination.hasNextPage}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                        >
                            Next
                            <LuChevronRight size={16} />
                        </button>

                    </div>
                </div>

            </div>

            {/* View User Modal */}
            {viewUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">

                    <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between gap-3 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-4 sm:px-6 sm:py-5">

                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 sm:text-xs">
                                    User Details
                                </p>

                                <h2 className="mt-1 break-words text-lg font-bold text-slate-800 sm:text-xl">
                                    {viewUser.firstName} {viewUser.lastName}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setViewUser(null)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg text-slate-500 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                            >
                                <LuX />
                            </button>

                        </div>

                        <div className="max-h-[65vh] space-y-4 overflow-y-auto p-4 sm:p-6">

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
                                    className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                                >
                                    <span className="text-xs font-semibold text-slate-500 sm:text-sm">
                                        {label}
                                    </span>

                                    <span className="break-all text-sm font-medium text-slate-800 sm:text-right">
                                        {value || 'N/A'}
                                    </span>
                                </div>
                            ))}

                        </div>

                        <div className="border-t border-slate-100 p-4 text-right sm:p-5">
                            <button
                                type="button"
                                onClick={() => setViewUser(null)}
                                className="w-full rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 sm:w-auto"
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Add / Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">

                    <div className="my-auto max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-indigo-100 bg-white shadow-2xl">

                        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-4 sm:px-6 sm:py-5">

                            <div>
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-500 sm:text-xs">
                                    User Management
                                </p>

                                <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
                                    {editUser ? 'Edit User' : 'Add User'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg text-slate-500 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                            >
                                <LuX />
                            </button>

                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:space-y-5 sm:p-6">

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
                                    className={inputClass}
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
                                    className={inputClass}
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
                                    className={inputClass}
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
                                    className={inputClass}
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
                                    className={inputClass}
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
                                <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50 p-3 sm:p-4">

                                    <h3 className="text-sm font-bold text-violet-700 sm:text-base">
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
                                            className={inputClass}
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
                                            className={inputClass}
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
                                            className={inputClass}
                                        />
                                    </div>

                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:w-auto"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:from-indigo-700 hover:to-violet-700 sm:w-auto"
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

export default User
