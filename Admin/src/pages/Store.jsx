
import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import {
    LuEye,
    LuSquarePen,
    LuTrash2
} from "react-icons/lu";

const Store = () => {
    const [showForm, setShowForm] = useState(false)
    const [showView, setShowView] = useState(false)

    const [editId, setEditId] = useState('')
    const [viewStore, setViewStore] = useState(null)

    const [user, setUser] = useState([])
    const [store, setStores] = useState([])

    // SEARCH, SORT AND PAGINATION
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [order, setOrder] = useState('desc')

    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalStores, setTotalStores] = useState(0)

    const limit = 10

    // RBAC STATES
    const [roleName, setRoleName] = useState('')
    const [permissions, setPermissions] = useState([])
    const [authLoading, setAuthLoading] = useState(true)
    const [loading, setLoading] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState('')

    const initialForm = {
        name: '',
        code: '',
        manager: '',
        phone: '',
        address: '',
        location: {
            latitude: '',
            longitude: ''
        },
        serviceRadius: ''
    }

    const [form, setForm] = useState(initialForm)

    // CHECK USER PERMISSIONS
    const checkUser = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/user/check-user',
                { withCredentials: true }
            )

            const currentUser = res.data.user

            const currentRole = (
                currentUser?.roleName ||
                currentUser?.role?.name ||
                ''
            ).toLowerCase().trim()

            const userPermissions =
                Array.isArray(currentUser?.permissions)
                    ? currentUser.permissions
                    : Array.isArray(currentUser?.role?.permissions)
                        ? currentUser.role.permissions
                        : []

            setRoleName(currentRole)
            setPermissions(userPermissions)

        } catch (err) {
            console.log('USER ERROR:', err.response?.data || err.message)
        } finally {
            setAuthLoading(false)
        }
    }

    // CHECK PERMISSION
    const hasPermission = (permission) => {
        if (roleName === 'super admin') {
            return true
        }

        return permissions.includes(permission)
    }

    // GET STORES API
    const getStores = async () => {
        try {
            setLoading(true)

            const res = await axios.get(
                'http://localhost:8000/store/get-all',
                {
                    params: {
                        page: currentPage,
                        limit,
                        search,
                        sortBy,
                        order
                    },
                    withCredentials: true
                }
            )

            setStores(
                Array.isArray(res.data.data) ? res.data.data : []
            )

            setTotalPages(res.data.pagination?.totalPages || 1)
            setTotalStores(res.data.pagination?.totalStores || 0)

        } catch (err) {
            console.log(
                'GET STORES ERROR:',
                err.response?.data || err.message
            )
        } finally {
            setLoading(false)
        }
    }

    // GET ONLY STORE MANAGERS
    const getUser = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/user/get-all',
                { withCredentials: true }
            )

            const allUsers = Array.isArray(res.data.data)
                ? res.data.data
                : []

            const storeManagers = allUsers.filter((users) => {
                const role = (
                    users.role?.name ||
                    users.roleName ||
                    ''
                ).toLowerCase().trim()

                return role === 'store_manager' ||
                    role === 'store manager'
            })

            setUser(storeManagers)

        } catch (err) {
            console.log(
                'GET USERS ERROR:',
                err.response?.data || err.message
            )
        }
    }

    // INITIAL AUTH CHECK
    useEffect(() => {
        checkUser()
    }, [])

    // FETCH DATA AFTER CHECKING PERMISSIONS
    useEffect(() => {
        if (authLoading) return

        if (hasPermission('store_view')) {
            getStores()
        }
    }, [
        authLoading,
        roleName,
        permissions,
        currentPage,
        search,
        sortBy,
        order
    ])

    // FETCH MANAGERS
    useEffect(() => {
        if (authLoading) return

        if (
            hasPermission('store_create') ||
            hasPermission('store_edit')
        ) {
            getUser()
        }
    }, [authLoading, roleName, permissions])

    // RESET FORM
    const resetForm = () => {
        setForm({
            ...initialForm,
            location: {
                ...initialForm.location
            }
        })
    }

    // CLOSE FORM
    const handleClose = () => {
        setShowForm(false)
        setEditId('')
        resetForm()
    }

    // HANDLE CHANGE
    const handleChange = (e) => {
        const { name, value } = e.target

        setForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    // HANDLE LOCATION CHANGE
    const handleLocationChange = (e) => {
        const { name, value } = e.target

        setForm((prev) => ({
            ...prev,
            location: {
                ...prev.location,
                [name]: value
            }
        }))
    }

    // OPEN ADD FORM
    const handleAdd = () => {
        if (!hasPermission('store_create')) {
            toast.error('You do not have permission to create stores')
            return
        }

        setEditId('')
        resetForm()
        setShowForm(true)
    }

    // HANDLE SUBMIT
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (editId && !hasPermission('store_edit')) {
            toast.error('You do not have permission to edit stores')
            return
        }

        if (!editId && !hasPermission('store_create')) {
            toast.error('You do not have permission to create stores')
            return
        }

        try {
            setLoading(true)

            let res

            if (editId) {
                res = await axios.put(
                    `http://localhost:8000/store/update/${editId}`,
                    form,
                    { withCredentials: true }
                )
            } else {
                res = await axios.post(
                    'http://localhost:8000/store/create',
                    form,
                    { withCredentials: true }
                )
            }

            if (!res.data.status) {
                throw new Error(
                    res.data.message || 'Unable to save store'
                )
            }

            toast.success(
                editId
                    ? 'Store updated successfully'
                    : 'Store created successfully'
            )

            handleClose()

            if (currentPage !== 1 && !editId) {
                setCurrentPage(1)
            } else {
                await getStores()
            }

        } catch (err) {
            console.log(
                'SAVE STORE ERROR:',
                err.response?.data || err.message
            )

            toast.error(
                err.response?.data?.message ||
                err.message ||
                'Something went wrong'
            )
        } finally {
            setLoading(false)
        }
    }

    // HANDLE EDIT
    const handleEdit = (stores) => {
        if (!hasPermission('store_edit')) {
            toast.error('You do not have permission to edit stores')
            return
        }

        setEditId(stores._id)

        setForm({
            name: stores.name || '',
            code: stores.code || '',
            manager: stores.manager?._id || stores.manager || '',
            phone: stores.phone || '',
            address: stores.address || '',
            location: {
                latitude: stores.location?.latitude ?? '',
                longitude: stores.location?.longitude ?? ''
            },
            serviceRadius: stores.serviceRadius ?? ''
        })

        setShowForm(true)
    }

    // HANDLE VIEW
    const handleView = (stores) => {
        setViewStore(stores)
        setShowView(true)
    }

    // HANDLE STATUS TOGGLE
    const handleStatusToggle = async (stores) => {
        if (!hasPermission('store_edit')) {
            toast.error('You do not have permission to change store status')
            return
        }

        try {
            setUpdatingStatus(stores._id)

            const res = await axios.put(
                `http://localhost:8000/store/update-status/${stores._id}`,
                {},
                { withCredentials: true }
            )

            if (!res.data.status) {
                throw new Error(
                    res.data.message || 'Status update failed'
                )
            }

            await getStores()

            if (viewStore?._id === stores._id) {
                setViewStore((prev) => ({
                    ...prev,
                    status: res.data.data.status
                }))
            }

            toast.success(
                res.data.message || 'Store status updated successfully'
            )

        } catch (err) {
            console.log(
                'STATUS UPDATE ERROR:',
                err.response?.data || err.message
            )

            toast.error(
                err.response?.data?.message ||
                err.message ||
                'Unable to update store status'
            )
        } finally {
            setUpdatingStatus('')
        }
    }

    // HANDLE DELETE
    const handleDelete = async (id) => {
        if (!hasPermission('store_delete')) {
            toast.error('You do not have permission to delete stores')
            return
        }

        try {
            const res = await axios.delete(
                `http://localhost:8000/store/delete/${id}`,
                { withCredentials: true }
            )

            if (!res.data.status) {
                throw new Error(
                    res.data.message || 'Unable to delete store'
                )
            }

            toast.success(
                res.data.message || 'Store deleted successfully'
            )

            if (store.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1)
            } else {
                await getStores()
            }

        } catch (err) {
            console.log(
                'DELETE STORE ERROR:',
                err.response?.data || err.message
            )

            toast.error(
                err.response?.data?.message ||
                err.message ||
                'Unable to delete store'
            )
        }
    }

    // LOADING
    if (authLoading) {
        return (
            <div className="w-full min-w-0 p-4 text-center text-slate-600">
                Checking permissions...
            </div>
        )
    }

    // ACCESS DENIED
    if (!hasPermission('store_view')) {
        return (
            <div className="m-3 sm:m-6 min-w-0 rounded-2xl border border-red-200 bg-white p-5 sm:p-8 text-center shadow-sm">
                <h2 className="text-xl font-bold text-red-600">
                    Access Denied
                </h2>

                <p className="mt-2 text-gray-600">
                    You do not have permission to view stores.
                </p>
            </div>
        )
    }

    return (
        <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-8">

            {/* HEADER */}
            <div className="mb-5 flex min-w-0 flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                        Store Management
                    </p>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Stores
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Create and manage your stores.
                    </p>
                </div>

                {hasPermission('store_create') && (
                    <button
                        onClick={handleAdd}
                        className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-semibold text-white shadow-md shadow-indigo-200 transition hover:shadow-lg sm:w-auto"
                    >
                        <span className="text-xl">+</span>
                        Add Store
                    </button>
                )}
            </div>

            {/* SEARCH AND SORT */}
            <div className="mb-5 w-full min-w-0 rounded-2xl border border-indigo-100 bg-white p-3 shadow-sm sm:mb-6 sm:p-4">
                <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center">

                    <input
                        type="text"
                        placeholder="Search store name, code, address..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setCurrentPage(1)
                        }}
                        className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 lg:flex-1"
                    />

                    <select
                        value={`${sortBy}_${order}`}
                        onChange={(e) => {
                            const [field, direction] = e.target.value.split('_')
                            setSortBy(field)
                            setOrder(direction)
                            setCurrentPage(1)
                        }}
                        className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 lg:w-64 lg:shrink-0"
                    >
                        <option value="createdAt_desc">Newest First</option>
                        <option value="createdAt_asc">Oldest First</option>
                        <option value="name_asc">Name (A to Z)</option>
                        <option value="name_desc">Name (Z to A)</option>
                        <option value="status_asc">Status (Active to Inactive)</option>
                        <option value="status_desc">Status (Inactive to Active)</option>
                    </select>
                </div>
            </div>

            {/* STORE TABLE CARD */}
            <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">

                {/* TABLE HEADER */}
                <div className="flex min-w-0 flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-slate-800">
                            All Stores
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage store details, managers and status.
                        </p>
                    </div>

                    <span className="w-fit shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {totalStores} Stores
                    </span>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-slate-500">
                        Loading stores...
                    </div>
                ) : store.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                            🏬
                        </div>

                        <h3 className="text-lg font-bold text-slate-700">
                            No stores found
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                            Try another search or add a store.
                        </p>
                    </div>
                ) : (
                    /* IMPORTANT: SCROLL ONLY INSIDE TABLE */
                    <div className="block w-full min-w-0 max-w-full overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-left">

                            <thead className="bg-indigo-50/70">
                                <tr>
                                    <th className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">#</th>
                                    <th className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">Store Name</th>
                                    <th className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">Code</th>
                                    <th className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">Manager</th>
                                    <th className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">Phone</th>
                                    <th className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">Address</th>
                                    <th className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">Location</th>
                                    <th className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">Service Radius</th>
                                    <th className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-600">Status</th>
                                    <th className="whitespace-nowrap px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-600">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {store.map((stores, index) => (
                                    <tr
                                        key={stores._id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-500">
                                            {(currentPage - 1) * limit + index + 1}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <span className="font-semibold text-slate-800">
                                                {stores.name}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4">
                                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                                                {stores.code}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                                            {stores.manager
                                                ? `${stores.manager.firstName || ''} ${stores.manager.lastName || ''}`.trim()
                                                : 'N/A'}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                                            {stores.phone || 'N/A'}
                                        </td>

                                        <td className="max-w-[220px] px-4 py-4">
                                            <p className="line-clamp-2 text-sm text-slate-600">
                                                {stores.address || 'N/A'}
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                                            {stores.location
                                                ? `${stores.location.latitude ?? 'N/A'}, ${stores.location.longitude ?? 'N/A'}`
                                                : 'N/A'}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                                            {stores.serviceRadius ?? 'N/A'}
                                        </td>

                                        {/* SAME GREEN STATUS TOGGLE */}
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-semibold ${
                                                    stores.status === 'active'
                                                        ? 'text-green-700'
                                                        : 'text-gray-500'
                                                }`}>
                                                    {stores.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>

                                                {hasPermission('store_edit') ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStatusToggle(stores)}
                                                        disabled={updatingStatus === stores._id}
                                                        title="Change store status"
                                                        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                                                            stores.status === 'active'
                                                                ? 'bg-green-500'
                                                                : 'bg-gray-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`block h-5 w-5 rounded-full !bg-white shadow-md transition-transform duration-200 ${
                                                                stores.status === 'active'
                                                                    ? 'translate-x-5'
                                                                    : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleView(stores)}
                                                    title="View"
                                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                                                >
                                                    <LuEye size={17} />
                                                </button>

                                                {hasPermission('store_edit') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEdit(stores)}
                                                        title="Edit"
                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 transition hover:bg-indigo-100"
                                                    >
                                                        <LuSquarePen size={17} />
                                                    </button>
                                                )}

                                                {hasPermission('store_delete') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(stores._id)}
                                                        title="Delete"
                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                                    >
                                                        <LuTrash2 size={17} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION */}
                {!loading && totalStores > 0 && (
                    <div className="flex min-w-0 flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                        <p className="break-words text-sm text-slate-500">
                            Showing page {currentPage} of {totalPages}
                            {' '}({totalStores} total stores)
                        </p>

                        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                disabled={currentPage === 1}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                            >
                                Previous
                            </button>

                            <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
                                Page {currentPage}
                            </span>

                            <button
                                type="button"
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={currentPage >= totalPages}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ADD / EDIT FORM MODAL */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">
                    <div className="my-auto w-full min-w-0 max-w-2xl overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-2xl">

                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
                            <div className="min-w-0">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editId ? 'Edit Store' : 'Add Store'}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Enter store details below.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-2xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2 sm:p-6">

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Store Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Enter store name"
                                        className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Store Code
                                    </label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={form.code}
                                        onChange={handleChange}
                                        placeholder="Enter store code"
                                        className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Manager
                                    </label>
                                    <select
                                        name="manager"
                                        value={form.manager}
                                        onChange={handleChange}
                                        className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                        required
                                    >
                                        <option value="">Select Manager</option>
                                        {user.map((users) => (
                                            <option key={users._id} value={users._id}>
                                                {users.firstName} {users.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

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
                                        className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                        required
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        placeholder="Enter address"
                                        className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Latitude
                                    </label>
                                    <input
                                        type="number"
                                        name="latitude"
                                        step="any"
                                        value={form.location.latitude}
                                        onChange={handleLocationChange}
                                        placeholder="Enter latitude"
                                        className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Longitude
                                    </label>
                                    <input
                                        type="number"
                                        name="longitude"
                                        step="any"
                                        value={form.location.longitude}
                                        onChange={handleLocationChange}
                                        placeholder="Enter longitude"
                                        className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Service Radius
                                    </label>
                                    <input
                                        type="number"
                                        name="serviceRadius"
                                        min="0"
                                        value={form.serviceRadius}
                                        onChange={handleChange}
                                        placeholder="Enter radius"
                                        className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                        required
                                    />
                                </div>
                            </div>

                            {/* FORM BUTTONS */}
                            <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:flex-row sm:px-6">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-100 sm:w-auto"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 font-semibold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                >
                                    {loading
                                        ? editId ? 'Updating...' : 'Adding...'
                                        : editId ? 'Update Store' : 'Add Store'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW STORE MODAL */}
            {showView && viewStore && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">
                    <div className="my-auto w-full min-w-0 max-w-lg rounded-2xl border border-indigo-100 bg-white p-4 shadow-2xl sm:p-6">

                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <h2 className="text-xl font-bold text-slate-900">
                                    Store Details
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Complete store information.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowView(false)
                                    setViewStore(null)
                                }}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-2xl text-slate-500 hover:bg-red-50 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid max-h-[65vh] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2">

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">Store Name</p>
                                <p className="mt-1 break-words font-semibold text-slate-800">{viewStore.name}</p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">Store Code</p>
                                <p className="mt-1 break-words font-semibold text-slate-800">{viewStore.code}</p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">Manager</p>
                                <p className="mt-1 break-words font-semibold text-slate-800">
                                    {viewStore.manager
                                        ? `${viewStore.manager.firstName || ''} ${viewStore.manager.lastName || ''}`.trim()
                                        : 'N/A'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">Phone</p>
                                <p className="mt-1 break-words font-semibold text-slate-800">{viewStore.phone || 'N/A'}</p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                                <p className="text-xs font-bold uppercase text-slate-400">Address</p>
                                <p className="mt-1 break-words font-semibold text-slate-800">{viewStore.address || 'N/A'}</p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">Latitude</p>
                                <p className="mt-1 break-words font-semibold text-slate-800">
                                    {viewStore.location?.latitude ?? 'N/A'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">Longitude</p>
                                <p className="mt-1 break-words font-semibold text-slate-800">
                                    {viewStore.location?.longitude ?? 'N/A'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">Service Radius</p>
                                <p className="mt-1 font-semibold text-slate-800">
                                    {viewStore.serviceRadius ?? 'N/A'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">Status</p>
                                <p className={`mt-1 font-semibold ${
                                    viewStore.status === 'active'
                                        ? 'text-green-700'
                                        : 'text-red-600'
                                }`}>
                                    {viewStore.status || 'N/A'}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setShowView(false)
                                setViewStore(null)
                            }}
                            className="mt-5 w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Store
