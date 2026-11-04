
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  LuEye,
  LuSquarePen,
  LuTrash2
} from "react-icons/lu";

const Category = () => {
    const [showModal, setShowModal] = useState(false)
    const [showView, setShowView] = useState(false)
    const [viewCategory, setViewCategory] = useState(null)

    const [image, setImage] = useState(null)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState([])
    const [editCategory, setEditCategory] = useState(null)

    const [updatingStatus, setUpdatingStatus] = useState(null)
    const [saving, setSaving] = useState(false)

    // PERMISSION STATES
    const [roleName, setRoleName] = useState('')
    const [permissions, setPermissions] = useState([])
    const [permissionLoaded, setPermissionLoaded] = useState(false)
    const [accessDenied, setAccessDenied] = useState(false)

    const [form, setForm] = useState({
        name: '',
        description: ''
    })

    // CHECK PERMISSION
    const hasPermission = (permission) => {
        if (roleName.trim().toLowerCase() === 'super admin') {
            return true
        }

        return permissions.includes(permission)
    }

    // GET LOGGED-IN USER AND PERMISSIONS
    const getUserPermissions = async () => {
        try {
            const response = await axios.get(
                'http://localhost:8000/user/check-user',
                { withCredentials: true }
            )

            const user = response.data.user

            const currentRole = (
                user.roleName ||
                user.role?.name ||
                ''
            ).trim().toLowerCase()

            const currentPermissions = Array.isArray(user.permissions)
                ? user.permissions
                : Array.isArray(user.role?.permissions)
                    ? user.role.permissions
                    : []

            setRoleName(currentRole)
            setPermissions(currentPermissions)

            const canView =
                currentRole === 'super admin' ||
                currentPermissions.includes('categories_view')

            setAccessDenied(!canView)

            if (canView) {
                await getCategory()
            }
        } catch (error) {
            console.log(
                'USER PERMISSION ERROR:',
                error.response?.data || error.message
            )

            setAccessDenied(true)
        } finally {
            setPermissionLoaded(true)
        }
    }

    // GET ALL CATEGORIES
    const getCategory = async () => {
        try {
            const response = await axios.get(
                'http://localhost:8000/category/get-all',
                { withCredentials: true }
            )

            setCategory(
                Array.isArray(response.data.data)
                    ? response.data.data
                    : []
            )
        } catch (error) {
            console.log(
                'GET CATEGORY ERROR:',
                error.response?.data || error.message
            )
        }
    }

    useEffect(() => {
        getUserPermissions()
    }, [])

    // RESET FORM
    const resetForm = () => {
        setForm({
            name: '',
            description: ''
        })

        setImage(null)
        setEditCategory(null)
    }

    // HANDLE INPUT CHANGE
    const handleChange = (e) => {
        const { name, value } = e.target

        setForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    // OPEN ADD CATEGORY MODAL
    const handleAdd = () => {
        if (!hasPermission('categories_create')) {
            alert('You do not have permission to create categories')
            return
        }

        resetForm()
        setShowModal(true)
    }

    // OPEN EDIT CATEGORY MODAL
    const handleEdit = (item) => {
        if (!hasPermission('categories_edit')) {
            alert('You do not have permission to edit categories')
            return
        }

        setEditCategory(item)

        setForm({
            name: item.name || '',
            description: item.description || ''
        })

        setImage(null)
        setShowModal(true)
    }

    // VIEW CATEGORY
    const handleView = (item) => {
        setViewCategory(item)
        setShowView(true)
    }

    // UPDATE CATEGORY STATUS
    const updateStatus = async (item) => {
        if (!hasPermission('categories_edit')) {
            alert('You do not have permission to change category status')
            return
        }

        const newStatus =
            item.status === 'active' ? 'inactive' : 'active'

        try {
            setUpdatingStatus(item._id)

            await axios.put(
                `http://localhost:8000/category/status/${item._id}`,
                { status: newStatus },
                { withCredentials: true }
            )

            await getCategory()

        } catch (error) {
            console.log(
                'UPDATE STATUS ERROR:',
                error.response?.data || error.message
            )

            alert(
                error.response?.data?.message ||
                'Unable to update category status'
            )
        } finally {
            setUpdatingStatus(null)
        }
    }

    // ADD OR UPDATE CATEGORY
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (
            editCategory
                ? !hasPermission('categories_edit')
                : !hasPermission('categories_create')
        ) {
            alert('You do not have permission to perform this action')
            return
        }

        const formData = new FormData()

        formData.append('name', form.name)
        formData.append('description', form.description)

        if (image) {
            formData.append('image', image)
        }

        try {
            setSaving(true)

            if (editCategory) {
                await axios.put(
                    `http://localhost:8000/category/update/${editCategory._id}`,
                    formData,
                    { withCredentials: true }
                )
            } else {
                await axios.post(
                    'http://localhost:8000/category/create',
                    formData,
                    { withCredentials: true }
                )
            }

            await getCategory()

            resetForm()
            setShowModal(false)

        } catch (error) {
            console.log(
                'ADD/UPDATE CATEGORY ERROR:',
                error.response?.data || error.message
            )

            alert(
                error.response?.data?.message ||
                'Unable to save category'
            )
        } finally {
            setSaving(false)
        }
    }

    // DELETE CATEGORY
    const handleDelete = async (id) => {
        if (!hasPermission('categories_delete')) {
            alert('You do not have permission to delete categories')
            return
        }

        const confirmDelete = window.confirm(
            'Are you sure you want to delete this category?'
        )

        if (!confirmDelete) return

        try {
            await axios.delete(
                `http://localhost:8000/category/delete/${id}`,
                { withCredentials: true }
            )

            await getCategory()

        } catch (error) {
            console.log(
                'DELETE CATEGORY ERROR:',
                error.response?.data || error.message
            )

            alert(
                error.response?.data?.message ||
                'Unable to delete category'
            )
        }
    }

    // SEARCH CATEGORIES
    const filteredCategories = category.filter((item) =>
        (item.name || '').toLowerCase().includes(search.toLowerCase())
    )

    // WAIT FOR PERMISSIONS
    if (!permissionLoaded) {
        return (
            <div className="p-8 text-center text-slate-600">
                Checking permissions...
            </div>
        )
    }

    // ACCESS DENIED
    if (accessDenied) {
        return (
            <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                <h2 className="text-xl font-bold text-red-700">
                    Access Denied
                </h2>

                <p className="mt-2 text-sm text-red-600">
                    You do not have permission to view categories.
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
                        Categories
                    </h1>

                    <p className="mt-2 text-sm text-slate-500 sm:text-base">
                        Create and manage your product categories.
                    </p>
                </div>

                {hasPermission('categories_create') && (
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-semibold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <span className="text-xl">+</span>
                        Add Category
                    </button>
                )}
            </div>

            {/* SEARCH */}
            <div className="mb-6 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
                <div className="relative w-full sm:max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        🔍
                    </span>

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search category..."
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                </div>
            </div>

            {/* CATEGORY CARDS */}
            <div className="min-h-[300px] overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">

                <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            All Categories
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage your category details and status.
                        </p>
                    </div>

                    <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {filteredCategories.length} Categories
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 xl:grid-cols-3">

                    {filteredCategories.map((item) => (
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
                                {hasPermission('categories_edit') ? (
                                    <button
                                        type="button"
                                        disabled={updatingStatus === item._id}
                                        onClick={() => updateStatus(item)}
                                        className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition disabled:cursor-not-allowed disabled:opacity-50 ${item.status === 'active'
                                            ? 'border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                            : 'border-red-100 bg-red-50 text-red-600 hover:bg-red-100'
                                            }`}
                                    >
                                        {updatingStatus === item._id
                                            ? 'Updating...'
                                            : item.status || 'inactive'}
                                    </button>
                                ) : (
                                    <span
                                        className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${item.status === 'active'
                                            ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                            : 'border-red-100 bg-red-50 text-red-600'
                                            }`}
                                    >
                                        {item.status || 'inactive'}
                                    </span>
                                )}
                            </div>

                            {/* CATEGORY NAME */}
                            <h3 className="mb-3 break-words text-lg font-bold text-slate-800 transition group-hover:text-indigo-700">
                                {item.name}
                            </h3>

                            {/* DESCRIPTION */}
                            <div className="mb-5 min-h-[60px] rounded-xl bg-slate-50 p-3">
                                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Description
                                </p>

                                <p className="break-words text-sm leading-6 text-slate-600">
                                    {item.description || 'No description available'}
                                </p>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="flex gap-2 border-t border-slate-100 pt-4">

                                <button
                                    type="button"
                                    onClick={() => handleView(item)}
                                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                    <LuEye />
                                </button>

                                {hasPermission('categories_edit') && (
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(item)}
                                        className="flex-1 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                                    >
                                        <LuSquarePen />
                                    </button>
                                )}

                                {hasPermission('categories_delete') && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item._id)}
                                        className="flex-1 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                                    >
                                        <LuTrash2 />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* EMPTY STATE */}
                {filteredCategories.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                            🗂️
                        </div>

                        <h3 className="text-lg font-bold text-slate-700">
                            No categories found
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                            Add a category to get started.
                        </p>
                    </div>
                )}
            </div>

            {/* VIEW CATEGORY MODAL */}
            {showView && viewCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <h2 className="text-xl font-bold text-slate-800">
                                Category Details
                            </h2>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowView(false)
                                    setViewCategory(null)
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-2xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-5 p-6">

                            {viewCategory.image && (
                                <div className="flex justify-center">
                                    <img
                                        src={viewCategory.image}
                                        alt={viewCategory.name}
                                        className="h-40 w-40 rounded-xl border border-slate-200 object-cover"
                                    />
                                </div>
                            )}

                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                    Category Name
                                </p>

                                <p className="mt-1 font-semibold text-slate-800">
                                    {viewCategory.name || 'N/A'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                    Description
                                </p>

                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                    {viewCategory.description || 'No description available'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                    Status
                                </p>

                                <span
                                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${viewCategory.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-red-50 text-red-600'
                                        }`}
                                >
                                    {viewCategory.status || 'inactive'}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowView(false)
                                    setViewCategory(null)
                                }}
                                className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD / EDIT CATEGORY MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editCategory ? 'Edit Category' : 'Add Category'}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Enter category details below.
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

                                {/* CATEGORY NAME */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Category Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="Enter category name"
                                        required
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    />
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
                                        placeholder="Enter category description"
                                        rows="4"
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    />
                                </div>

                                {/* CATEGORY IMAGE */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Category Image
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
                                        <p className="mt-2 text-sm text-indigo-600">
                                            Selected: {image.name}
                                        </p>
                                    )}

                                    {editCategory && !image && editCategory.image && (
                                        <p className="mt-2 text-sm text-slate-500">
                                            Existing image will be kept if your backend supports it.
                                        </p>
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
                                    disabled={saving}
                                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 font-semibold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving
                                        ? 'Please wait...'
                                        : editCategory
                                            ? 'Update Category'
                                            : 'Add Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Category
