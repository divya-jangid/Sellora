
import axios from 'axios'
import React, { useState, useEffect } from 'react'
import {
  LuEye,
  LuSquarePen,
  LuTrash2
} from "react-icons/lu";

const StoreContent = () => {
    const [showForm, setShowForm] = useState(false)
    const [showView, setShowView] = useState(false)

    const [editId, setEditId] = useState('')
    const [viewStore, setViewStore] = useState(null)

    const [user, setUser] = useState([])
    const [store, setStores] = useState([])

    // RBAC STATES
    const [roleName, setRoleName] = useState('')
    const [permissions, setPermissions] = useState([])
    const [authLoading, setAuthLoading] = useState(true)
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
                currentUser?.permissions ||
                currentUser?.role?.permissions ||
                []

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
            const res = await axios.get(
                'http://localhost:8000/store/get-all',
                { withCredentials: true }
            )

            setStores(
                Array.isArray(res.data.data) ? res.data.data : []
            )

        } catch (err) {
            console.log('GET STORES ERROR:', err.response?.data || err.message)
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
            console.log('GET USERS ERROR:', err.response?.data || err.message)
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
            alert('You do not have permission to create stores')
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
            alert('You do not have permission to edit stores')
            return
        }

        if (!editId && !hasPermission('store_create')) {
            alert('You do not have permission to create stores')
            return
        }

        try {
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
                throw new Error(res.data.message || 'Unable to save store')
            }

            await getStores()
            handleClose()

        } catch (err) {
            console.log('SAVE STORE ERROR:', err.response?.data || err.message)

            alert(
                err.response?.data?.message ||
                err.message ||
                'Something went wrong'
            )
        }
    }

    // HANDLE EDIT
    const handleEdit = (stores) => {
        if (!hasPermission('store_edit')) {
            alert('You do not have permission to edit stores')
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
            alert('You do not have permission to change store status')
            return
        }

        const newStatus =
            stores.status === 'active' ? 'inactive' : 'active'

        try {
            setUpdatingStatus(stores._id)

            const res = await axios.put(
                `http://localhost:8000/store/update/${stores._id}`,
                { status: newStatus },
                { withCredentials: true }
            )

            if (!res.data.status) {
                throw new Error(res.data.message || 'Status update failed')
            }

            await getStores()

            if (viewStore?._id === stores._id) {
                setViewStore((prev) => ({
                    ...prev,
                    status: newStatus
                }))
            }

        } catch (err) {
            console.log(
                'STATUS UPDATE ERROR:',
                err.response?.data || err.message
            )

            alert(
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
            alert('You do not have permission to delete stores')
            return
        }

        if (!window.confirm('Are you sure you want to delete this store?')) {
            return
        }

        try {
            const res = await axios.delete(
                `http://localhost:8000/store/delete/${id}`,
                { withCredentials: true }
            )

            if (!res.data.status) {
                throw new Error(res.data.message || 'Unable to delete store')
            }

            await getStores()

        } catch (err) {
            console.log('DELETE STORE ERROR:', err.response?.data || err.message)

            alert(
                err.response?.data?.message ||
                err.message ||
                'Unable to delete store'
            )
        }
    }

    // LOADING
    if (authLoading) {
        return (
            <div className="p-6">
                Checking permissions...
            </div>
        )
    }

    // ACCESS DENIED
    if (!hasPermission('store_view')) {
        return (
            <div className="p-6">
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
        <div className="p-6 bg-slate-50 min-h-screen">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-slate-800">
                    Stores
                </h2>

                {hasPermission('store_create') && (
                    <button
                        onClick={handleAdd}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700"
                    >
                        + Add Store
                    </button>
                )}
            </div>

            {/* ADD / EDIT FORM MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">

                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editId ? 'Edit Store' : 'Add Store'}
                            </h2>

                            <button
                                type="button"
                                onClick={handleClose}
                                className="text-slate-500 text-xl hover:text-red-500"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                {/* STORE NAME */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Store Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Enter store name"
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>

                                {/* STORE CODE */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Store Code
                                    </label>

                                    <input
                                        type="text"
                                        name="code"
                                        value={form.code}
                                        onChange={handleChange}
                                        placeholder="Enter store code"
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>

                                {/* MANAGER */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Manager
                                    </label>

                                    <select
                                        name="manager"
                                        value={form.manager}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    >
                                        <option value="">
                                            Select Manager
                                        </option>

                                        {user.map((users) => (
                                            <option
                                                key={users._id}
                                                value={users._id}
                                            >
                                                {users.firstName} {users.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* PHONE */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Phone
                                    </label>

                                    <input
                                        type="text"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="Enter phone"
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>

                                {/* ADDRESS */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Address
                                    </label>

                                    <input
                                        type="text"
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        placeholder="Enter address"
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>

                                {/* LATITUDE */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Latitude
                                    </label>

                                    <input
                                        type="number"
                                        name="latitude"
                                        step="any"
                                        value={form.location.latitude}
                                        onChange={handleLocationChange}
                                        placeholder="Enter latitude"
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>

                                {/* LONGITUDE */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Longitude
                                    </label>

                                    <input
                                        type="number"
                                        name="longitude"
                                        step="any"
                                        value={form.location.longitude}
                                        onChange={handleLocationChange}
                                        placeholder="Enter longitude"
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>

                                {/* SERVICE RADIUS */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Service Radius
                                    </label>

                                    <input
                                        type="number"
                                        name="serviceRadius"
                                        min="0"
                                        value={form.serviceRadius}
                                        onChange={handleChange}
                                        placeholder="Enter radius"
                                        className="w-full border rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>

                            </div>

                            {/* BUTTONS */}
                            <div className="flex justify-end gap-3 mt-6">

                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-5 py-2 border rounded-lg"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editId ? 'Update Store' : 'Add Store'}
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* VIEW STORE MODAL */}
            {showView && viewStore && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">

                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-bold text-slate-800">
                                Store Details
                            </h2>

                            <button
                                onClick={() => {
                                    setShowView(false)
                                    setViewStore(null)
                                }}
                                className="text-slate-500 text-xl hover:text-red-500"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4 text-sm text-slate-700">

                            <p>
                                <strong>Store Name:</strong> {viewStore.name}
                            </p>

                            <p>
                                <strong>Store Code:</strong> {viewStore.code}
                            </p>

                            <p>
                                <strong>Manager:</strong>{' '}
                                {viewStore.manager
                                    ? `${viewStore.manager.firstName || ''} ${viewStore.manager.lastName || ''}`.trim()
                                    : 'N/A'}
                            </p>

                            <p>
                                <strong>Phone:</strong> {viewStore.phone || 'N/A'}
                            </p>

                            <p>
                                <strong>Address:</strong> {viewStore.address || 'N/A'}
                            </p>

                            <p>
                                <strong>Latitude:</strong>{' '}
                                {viewStore.location?.latitude ?? 'N/A'}
                            </p>

                            <p>
                                <strong>Longitude:</strong>{' '}
                                {viewStore.location?.longitude ?? 'N/A'}
                            </p>

                            <p>
                                <strong>Service Radius:</strong>{' '}
                                {viewStore.serviceRadius ?? 'N/A'}
                            </p>

                            <p>
                                <strong>Status:</strong>{' '}
                                <span className={
                                    viewStore.status === 'active'
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }>
                                    {viewStore.status || 'N/A'}
                                </span>
                            </p>

                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => {
                                    setShowView(false)
                                    setViewStore(null)
                                }}
                                className="px-5 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* STORE TABLE */}
            <div className="mt-6 overflow-x-auto bg-white rounded-xl shadow-md border border-slate-200">

                <table className="w-full text-sm text-left">

                    <thead className="bg-slate-100 border-b">
                        <tr>
                            <th className="px-5 py-3 font-semibold text-slate-700">
                                Name
                            </th>

                            <th className="px-5 py-3 font-semibold text-slate-700">
                                Code
                            </th>

                            <th className="px-5 py-3 font-semibold text-slate-700">
                                Manager
                            </th>

                            <th className="px-5 py-3 font-semibold text-slate-700">
                                Phone
                            </th>

                            <th className="px-5 py-3 font-semibold text-slate-700">
                                Address
                            </th>

                            <th className="px-5 py-3 font-semibold text-slate-700">
                                Location
                            </th>

                            <th className="px-5 py-3 font-semibold text-slate-700">
                                Service Radius
                            </th>

                            <th className="px-5 py-3 font-semibold text-slate-700">
                                Status
                            </th>

                            <th className="px-5 py-3 font-semibold text-slate-700">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {store.length > 0 ? (
                            store.map((stores) => (
                                <tr
                                    key={stores._id}
                                    className="border-b hover:bg-slate-50"
                                >
                                    <td className="px-5 py-4">
                                        {stores.name}
                                    </td>

                                    <td className="px-5 py-4">
                                        {stores.code}
                                    </td>

                                    <td className="px-5 py-4">
                                        {stores.manager
                                            ? `${stores.manager.firstName || ''} ${stores.manager.lastName || ''}`.trim()
                                            : 'N/A'}
                                    </td>

                                    <td className="px-5 py-4">
                                        {stores.phone}
                                    </td>

                                    <td className="px-5 py-4">
                                        {stores.address}
                                    </td>

                                    <td className="px-5 py-4">
                                        {stores.location
                                            ? `${stores.location.latitude ?? ''}, ${stores.location.longitude ?? ''}`
                                            : 'N/A'}
                                    </td>

                                    <td className="px-5 py-4">
                                        {stores.serviceRadius}
                                    </td>

                                    {/* STATUS */}
                                    <td className="px-5 py-4">
                                        {hasPermission('store_edit') ? (
                                            <button
                                                onClick={() => handleStatusToggle(stores)}
                                                disabled={updatingStatus === stores._id}
                                                className={`px-3 py-1 rounded-full text-xs font-medium disabled:opacity-60 ${
                                                    stores.status === 'active'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                {updatingStatus === stores._id
                                                    ? 'Updating...'
                                                    : stores.status === 'active'
                                                        ? 'Active'
                                                        : 'Inactive'}
                                            </button>
                                        ) : (
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    stores.status === 'active'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                {stores.status || 'N/A'}
                                            </span>
                                        )}
                                    </td>

                                    {/* ACTIONS */}
                                    <td className="px-5 py-4 whitespace-nowrap">

                                        <button
                                            onClick={() => handleView(stores)}
                                            className="text-indigo-600 hover:text-indigo-800 mr-3"
                                        >
                                            <LuEye/>
                                        </button>

                                        {hasPermission('store_edit') && (
                                            <button
                                                onClick={() => handleEdit(stores)}
                                                className="text-blue-600 hover:text-blue-800 mr-3"
                                            >
                                                <LuSquarePen/>
                                            </button>
                                        )}

                                        {hasPermission('store_delete') && (
                                            <button
                                                onClick={() => handleDelete(stores._id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <LuTrash2/>
                                            </button>
                                        )}

                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="9"
                                    className="px-5 py-6 text-center text-gray-500"
                                >
                                    No stores found
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>
            </div>
        </div>
    )
}

export default StoreContent
