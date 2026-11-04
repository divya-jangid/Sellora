
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  LuEye,
  LuSquarePen,
  LuTrash2
} from "react-icons/lu";

const SubcategoryContent = () => {
    const [showModal, setShowModal] = useState(false)
    const [showView, setShowView] = useState(false)

    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('default')

    const [category, setCategory] = useState([])
    const [subcategories, setSubcategories] = useState([])

    const [image, setImage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [editId, setEditId] = useState(null)

    const [viewSubcategory, setViewSubcategory] = useState(null)
    const [updatingStatus, setUpdatingStatus] = useState(null)

    const [roleName, setRoleName] = useState('')
    const [permissions, setPermissions] = useState([])
    const [authLoading, setAuthLoading] = useState(true)

    const [form, setForm] = useState({
        name: '',
        category: '',
        description: ''
    })

    // CHECK USER AND PERMISSIONS
    const checkUser = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/user/check-user',
                { withCredentials: true }
            )

            const user = res.data.user

            setRoleName(
                user?.roleName?.toLowerCase().trim() ||
                user?.role?.name?.toLowerCase().trim() ||
                ''
            )

            setPermissions(
                user?.permissions ||
                user?.role?.permissions ||
                []
            )
        } catch (err) {
            console.log('CHECK USER ERROR:', err)
            setRoleName('')
            setPermissions([])
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

    // GET CATEGORIES
    const getCategories = async () => {
        try {
            const result = await axios.get(
                'http://localhost:8000/category/get-all',
                { withCredentials: true }
            )

            setCategory(result.data.data || [])
        } catch (err) {
            console.log('GET CATEGORIES ERROR:', err)
        }
    }

    // GET SUBCATEGORIES
    const getSubcategories = async () => {
        try {
            const resp = await axios.get(
                'http://localhost:8000/subcategory/get-all',
                { withCredentials: true }
            )

            setSubcategories(resp.data.data || [])
        } catch (err) {
            console.log('GET SUBCATEGORIES ERROR:', err)
        }
    }

    useEffect(() => {
        checkUser()
    }, [])

    useEffect(() => {
        if (authLoading) return

        if (hasPermission('subcategories_view')) {
            getSubcategories()
        }

        if (
            hasPermission('subcategories_create') ||
            hasPermission('subcategories_edit')
        ) {
            getCategories()
        }
    }, [authLoading, roleName, permissions])

    // HANDLE INPUT CHANGE
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    // RESET FORM
    const resetForm = () => {
        setForm({
            name: '',
            category: '',
            description: ''
        })

        setImage(null)
        setEditId(null)
    }

    // OPEN ADD MODAL
    const handleAdd = () => {
        if (!hasPermission('subcategories_create')) {
            toast.error('You do not have permission to create subcategories')
            return
        }

        resetForm()
        setShowModal(true)
    }

    // OPEN EDIT MODAL
    const handleEdit = (item) => {
        if (!hasPermission('subcategories_edit')) {
            toast.error('You do not have permission to edit subcategories')
            return
        }

        setEditId(item._id)

        setForm({
            name: item.name || '',
            category: item.category?._id || item.category || '',
            description: item.description || ''
        })

        setImage(null)
        setShowModal(true)
    }

    // VIEW SUBCATEGORY
    const handleView = (item) => {
        setViewSubcategory(item)
        setShowView(true)
    }

    // ADD / UPDATE SUBCATEGORY
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (editId && !hasPermission('subcategories_edit')) {
            toast.error('You do not have permission to edit subcategories')
            return
        }

        if (!editId && !hasPermission('subcategories_create')) {
            toast.error('You do not have permission to create subcategories')
            return
        }

        if (!form.name.trim() || !form.category) {
            toast.warning('Subcategory name and category are required')
            return
        }

        const formData = new FormData()

        formData.append('name', form.name.trim())
        formData.append('category', form.category)
        formData.append('description', form.description)

        if (image) {
            formData.append('image', image)
        }

        try {
            setLoading(true)

            if (editId) {
                await axios.put(
                    `http://localhost:8000/subcategory/update/${editId}`,
                    formData,
                    { withCredentials: true }
                )
            } else {
                await axios.post(
                    'http://localhost:8000/subcategory/create',
                    formData,
                    { withCredentials: true }
                )
            }

            await getSubcategories()

            resetForm()
            setShowModal(false)

        } catch (error) {
            console.log(
                'SUBCATEGORY ERROR:',
                error.response?.data || error.message
            )

            alert(
                error.response?.data?.message ||
                `Failed to ${editId ? 'update' : 'create'} subcategory`
            )
        } finally {
            setLoading(false)
        }
    }

    // DELETE SUBCATEGORY
    const handleDelete = async (id) => {
        if (!hasPermission('subcategories_delete')) {
            toast.error('You do not have permission to delete subcategories')
            return
        }

        const confirmDelete = window.confirm(
            'Are you sure you want to delete this subcategory?'
        )

        if (!confirmDelete) return

        try {
            await axios.delete(
                `http://localhost:8000/subcategory/delete/${id}`,
                { withCredentials: true }
            )

            await getSubcategories()

        } catch (error) {
            console.log(
                'DELETE SUBCATEGORY ERROR:',
                error.response?.data || error.message
            )

            toast.error(
                error.response?.data?.message ||
                'Failed to delete subcategory'
            )
        }
    }

    // UPDATE SUBCATEGORY STATUS
    const handleStatusToggle = async (item) => {
        if (!hasPermission('subcategories_edit')) {
            toast.error('You do not have permission to update status')
            return
        }

        const newStatus =
            item.status === 'active' ? 'inactive' : 'active'

        try {
            setUpdatingStatus(item._id)

            await axios.put(
                `http://localhost:8000/subcategory/status/${item._id}`,
                { status: newStatus },
                { withCredentials: true }
            )

            await getSubcategories()

            // Update opened view modal also
            if (viewSubcategory?._id === item._id) {
                setViewSubcategory({
                    ...item,
                    status: newStatus
                })
            }

        } catch (error) {
            console.log(
                'STATUS UPDATE ERROR:',
                error.response?.data || error.message
            )

            alert(
                error.response?.data?.message ||
                'Unable to update status'
            )
        } finally {
            setUpdatingStatus(null)
        }
    }

    // SEARCH AND SORT
    const filteredSubcategories = subcategories
        .filter((item) =>
            item.name?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'name-asc') {
                return (a.name || '').localeCompare(b.name || '')
            }

            if (sortBy === 'name-desc') {
                return (b.name || '').localeCompare(a.name || '')
            }

            return 0
        })

    // WAIT FOR PERMISSIONS
    if (authLoading) {
        return (
            <div className="p-8 text-center text-slate-600">
                Checking permissions...
            </div>
        )
    }

    // VIEW PERMISSION
    if (!hasPermission('subcategories_view')) {
        return (
            <div className="m-6 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
                <h2 className="text-xl font-bold text-red-600">
                    Access Denied
                </h2>

                <p className="mt-2 text-slate-600">
                    You do not have permission to view subcategories.
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">

            {/* HEADER */}
            <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                        Product Management
                    </p>

                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Subcategories
                    </h1>

                    <p className="mt-2 text-sm text-slate-500 sm:text-base">
                        Create and manage your product subcategories.
                    </p>
                </div>

                {hasPermission('subcategories_create') && (
                    <button
                        onClick={handleAdd}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-semibold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <span className="text-xl">+</span>
                        Add Subcategory
                    </button>
                )}
            </div>

            {/* SEARCH AND SORT */}
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

                <div className="relative w-full sm:max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        🔍
                    </span>

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search subcategory..."
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="whitespace-nowrap text-sm font-semibold text-slate-600">
                        Sort by:
                    </label>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-12 w-full min-w-[170px] rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    >
                        <option value="default">Default</option>
                        <option value="name-asc">Name: A to Z</option>
                        <option value="name-desc">Name: Z to A</option>
                    </select>
                </div>
            </div>

            {/* SUBCATEGORY LIST */}
            <div className="min-h-[300px] overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">

                <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            All Subcategories
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage your subcategory details and images.
                        </p>
                    </div>

                    <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {filteredSubcategories.length} Subcategories
                    </span>
                </div>

                {/* CARDS */}
                <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 xl:grid-cols-3">

                    {filteredSubcategories.map((item) => (
                        <div
                            key={item._id}
                            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50"
                        >

                            {/* IMAGE AND STATUS */}
                            <div className="mb-4 flex items-start justify-between gap-3">

                                <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-indigo-50">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-2xl">
                                            🗂️
                                        </div>
                                    )}
                                </div>

                                {/* CLICKABLE STATUS */}
                                <button
                                    type="button"
                                    onClick={() => handleStatusToggle(item)}
                                    disabled={
                                        !hasPermission('subcategories_edit') ||
                                        updatingStatus === item._id
                                    }
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold disabled:cursor-not-allowed ${
                                        item.status === 'active'
                                            ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                            : 'border-red-100 bg-red-50 text-red-600'
                                    }`}
                                >
                                    {updatingStatus === item._id
                                        ? 'Updating...'
                                        : item.status || 'active'}
                                </button>
                            </div>

                            {/* NAME */}
                            <h3 className="mb-4 break-words text-lg font-bold text-slate-800 transition group-hover:text-indigo-700">
                                {item.name}
                            </h3>

                            {/* PARENT CATEGORY */}
                            <div className="mb-3 rounded-xl bg-indigo-50/70 p-3">
                                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Parent Category
                                </p>

                                <p className="break-words text-sm font-semibold text-indigo-700">
                                    {item.category?.name || 'N/A'}
                                </p>
                            </div>

                            {/* DESCRIPTION */}
                            <div className="min-h-[80px] rounded-xl bg-slate-50 p-3">
                                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Description
                                </p>

                                <p className="break-words text-sm leading-6 text-slate-600">
                                    {item.description || 'No description available'}
                                </p>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="mt-4 flex flex-wrap gap-3">

                                {/* VIEW */}
                                <button
                                    type="button"
                                    onClick={() => handleView(item)}
                                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                    <LuEye/>
                                </button>

                                {/* EDIT */}
                                {hasPermission('subcategories_edit') && (
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(item)}
                                        className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                                    >
                                        <LuSquarePen/>
                                    </button>
                                )}

                                {/* DELETE */}
                                {hasPermission('subcategories_delete') && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item._id)}
                                        className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                                    >
                                        <LuTrash2/>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* EMPTY STATE */}
                {filteredSubcategories.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                            🗂️
                        </div>

                        <h3 className="text-lg font-bold text-slate-700">
                            No subcategories found
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                            Add a subcategory to get started.
                        </p>
                    </div>
                )}
            </div>

            {/* ADD / EDIT MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editId ? 'Edit Subcategory' : 'Add Subcategory'}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Enter subcategory details below.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false)
                                    resetForm()
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-2xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5 p-6">

                                {/* NAME */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Subcategory Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Enter subcategory name"
                                        required
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    />
                                </div>

                                {/* CATEGORY */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Parent Category
                                    </label>

                                    <select
                                        name="category"
                                        value={form.category}
                                        onChange={handleChange}
                                        required
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    >
                                        <option value="">
                                            Select Category
                                        </option>

                                        {category.map((item) => (
                                            <option
                                                key={item._id}
                                                value={item._id}
                                            >
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* DESCRIPTION */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Description
                                    </label>

                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        placeholder="Enter subcategory description"
                                        rows="3"
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    />
                                </div>

                                {/* IMAGE */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Subcategory Image
                                    </label>

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            setImage(e.target.files?.[0] || null)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
                                    />

                                    {image && (
                                        <div className="mt-3 flex items-center gap-3">
                                            <img
                                                src={URL.createObjectURL(image)}
                                                alt="Subcategory preview"
                                                className="h-20 w-20 rounded-xl border border-slate-200 object-cover"
                                            />

                                            <div className="min-w-0">
                                                <p className="break-all text-sm font-medium text-slate-700">
                                                    {image.name}
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={() => setImage(null)}
                                                    className="mt-1 text-sm font-semibold text-red-500 hover:text-red-700"
                                                >
                                                    Remove image
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* FORM BUTTONS */}
                            <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row">

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        resetForm()
                                    }}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-100"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 font-semibold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading
                                        ? editId
                                            ? 'Updating...'
                                            : 'Adding...'
                                        : editId
                                            ? 'Update Subcategory'
                                            : 'Add Subcategory'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW SUBCATEGORY MODAL */}
            {showView && viewSubcategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="my-auto w-full max-w-lg rounded-2xl border border-indigo-100 bg-white p-6 shadow-2xl">

                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">
                                Subcategory Details
                            </h2>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowView(false)
                                    setViewSubcategory(null)
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-2xl text-slate-500 hover:bg-red-50 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>

                        {viewSubcategory.image ? (
                            <img
                                src={viewSubcategory.image}
                                alt={viewSubcategory.name}
                                className="mb-5 h-44 w-full rounded-xl object-cover"
                            />
                        ) : (
                            <div className="mb-5 flex h-44 items-center justify-center rounded-xl bg-indigo-50 text-5xl">
                                🗂️
                            </div>
                        )}

                        <div className="space-y-4">

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    Subcategory Name
                                </p>

                                <p className="mt-1 font-semibold text-slate-800">
                                    {viewSubcategory.name}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    Parent Category
                                </p>

                                <p className="mt-1 font-semibold text-indigo-700">
                                    {viewSubcategory.category?.name || 'N/A'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    Description
                                </p>

                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                    {viewSubcategory.description || 'No description available'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    Status
                                </p>

                                <p className={`mt-1 font-semibold ${
                                    viewSubcategory.status === 'active'
                                        ? 'text-emerald-700'
                                        : 'text-red-600'
                                }`}>
                                    {viewSubcategory.status || 'active'}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setShowView(false)
                                setViewSubcategory(null)
                            }}
                            className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SubcategoryContent
