
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
    LuEye,
    LuSquarePen,
    LuTrash2,
    LuSearch
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
    const [loading, setLoading] = useState(false)

    // SEARCH, SORTING AND PAGINATION
    const [sortBy, setSortBy] = useState('createdAt')
    const [order, setOrder] = useState('desc')
    const [currentPage, setCurrentPage] = useState(1)

    const limit = 10

    const [pagination, setPagination] = useState({
        totalCategories: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    })

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

    // GET USER PERMISSIONS
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
            setLoading(true)

            const response = await axios.get(
                'http://localhost:8000/category/get-all',
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

            setCategory(
                Array.isArray(response.data.data)
                    ? response.data.data
                    : []
            )

            if (response.data.pagination) {
                setPagination(response.data.pagination)
            }

        } catch (error) {
            console.log(
                'GET CATEGORY ERROR:',
                error.response?.data || error.message
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getUserPermissions()
    }, [])

    useEffect(() => {
        if (permissionLoaded && !accessDenied) {
            getCategory()
        }
    }, [
        permissionLoaded,
        accessDenied,
        currentPage,
        search,
        sortBy,
        order
    ])

    // RESET FORM
    const resetForm = () => {
        setForm({
            name: '',
            description: ''
        })

        setImage(null)
        setEditCategory(null)
    }

    // HANDLE INPUT
    const handleChange = (e) => {
        const { name, value } = e.target

        setForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    // ADD CATEGORY
    const handleAdd = () => {
        if (!hasPermission('categories_create')) {
            toast.error('You do not have permission to create categories')
            return
        }

        resetForm()
        setShowModal(true)
    }

    // EDIT CATEGORY
    const handleEdit = (item) => {
        if (!hasPermission('categories_edit')) {
            toast.error('You do not have permission to edit categories')
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
            toast.error('You do not have permission to change category status')
            return
        }

        try {
            setUpdatingStatus(item._id)

            const res = await axios.put(
                `http://localhost:8000/category/status/${item._id}`,
                {},
                { withCredentials: true }
            )

            await getCategory()

            toast.success(
                res.data.message || 'Category status updated successfully'
            )

        } catch (error) {
            console.log(
                'UPDATE STATUS ERROR:',
                error.response?.data || error.message
            )

            toast.error(
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
            toast.error('You do not have permission to perform this action')
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

            toast.success(
                editCategory
                    ? 'Category updated successfully'
                    : 'Category created successfully'
            )

            await getCategory()

            resetForm()
            setShowModal(false)

        } catch (error) {
            console.log(
                'ADD/UPDATE CATEGORY ERROR:',
                error.response?.data || error.message
            )

            toast.error(
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
            toast.error('You do not have permission to delete categories')
            return
        }

        try {
            await axios.delete(
                `http://localhost:8000/category/delete/${id}`,
                { withCredentials: true }
            )

            toast.success('Category deleted successfully')

            if (category.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1)
            } else {
                await getCategory()
            }

        } catch (error) {
            console.log(
                'DELETE CATEGORY ERROR:',
                error.response?.data || error.message
            )

            toast.error(
                error.response?.data?.message ||
                'Unable to delete category'
            )
        }
    }

    // LOADING PERMISSIONS
    if (!permissionLoaded) {
        return (
            <div className="p-6 text-center text-slate-600">
                Checking permissions...
            </div>
        )
    }

    // ACCESS DENIED
    if (accessDenied) {
        return (
            <div className="m-3 sm:m-6 rounded-xl border border-red-200 bg-red-50 p-5 sm:p-6 text-center">
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
        <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-slate-50 p-3 sm:p-5 lg:p-8">

            {/* HEADER */}
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">

                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                        Product Management
                    </p>

                    <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                        Categories
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Create and manage your product categories.
                    </p>
                </div>

                {hasPermission('categories_create') && (
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg sm:w-auto"
                    >
                        <span className="text-xl">+</span>
                        Add Category
                    </button>
                )}
            </div>

            {/* SEARCH AND SORT */}
            <div className="mb-5 rounded-2xl border border-indigo-100 bg-white p-3 shadow-sm sm:mb-6 sm:p-4">

                <div className="flex flex-col gap-3 lg:flex-row">

                    <div className="relative w-full min-w-0 lg:flex-1">
                        <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setCurrentPage(1)
                            }}
                            placeholder="Search category by name..."
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:h-12"
                        />
                    </div>

                    <div className="w-full lg:w-72">
                        <select
                            value={`${sortBy}_${order}`}
                            onChange={(e) => {
                                const [field, direction] = e.target.value.split('_')

                                setSortBy(field)
                                setOrder(direction)
                                setCurrentPage(1)
                            }}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:h-12"
                        >
                            <option value="createdAt_desc">Newest First</option>
                            <option value="createdAt_asc">Oldest First</option>
                            <option value="name_asc">Category Name (A to Z)</option>
                            <option value="name_desc">Category Name (Z to A)</option>
                            <option value="status_asc">Status (Active to Inactive)</option>
                            <option value="status_desc">Status (Inactive to Active)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* CATEGORY TABLE */}
            <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">

                {/* TABLE HEADER */}
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            All Categories
                        </h2>

                        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                            Manage your category details and status.
                        </p>
                    </div>

                    <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {pagination.totalCategories} Categories
                    </span>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-slate-500">
                        Loading categories...
                    </div>
                ) : category.length === 0 ? (

                    /* EMPTY STATE */
                    <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                            🗂️
                        </div>

                        <h3 className="text-lg font-bold text-slate-700">
                            No categories found
                        </h3>

                        <p className="mt-2 text-sm text-slate-400">
                            Try another search or add a category.
                        </p>
                    </div>

                ) : (

                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left">

                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200">
                                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        #
                                    </th>

                                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Category
                                    </th>

                                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Description
                                    </th>

                                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Status
                                    </th>

                                    <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {category.map((item, index) => (
                                    <tr
                                        key={item._id}
                                        className="transition hover:bg-indigo-50/40"
                                    >

                                        {/* NUMBER */}
                                        <td className="px-5 py-4 text-sm text-slate-500">
                                            {(currentPage - 1) * limit + index + 1}
                                        </td>

                                        {/* CATEGORY */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-indigo-50">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-xl">
                                                            🗂️
                                                        </div>
                                                    )}
                                                </div>

                                                <span className="max-w-[180px] break-words text-sm font-semibold text-slate-800">
                                                    {item.name}
                                                </span>
                                            </div>
                                        </td>

                                        {/* DESCRIPTION */}
                                        <td className="max-w-[280px] px-5 py-4">
                                            <p className="line-clamp-2 text-sm leading-5 text-slate-500">
                                                {item.description || 'No description available'}
                                            </p>
                                        </td>

                                        {/* STATUS TOGGLE */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">

                                                {hasPermission('categories_edit') ? (
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={item.status === 'active'}
                                                        aria-label={`Change ${item.name} status`}
                                                        disabled={updatingStatus === item._id}
                                                        onClick={() => updateStatus(item)}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                                                            item.status === 'active'
                                                                ? 'bg-emerald-500'
                                                                : 'bg-slate-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                                                                item.status === 'active'
                                                                    ? 'translate-x-6'
                                                                    : 'translate-x-1'
                                                            }`}
                                                        />
                                                    </button>
                                                ) : (
                                                    <span
                                                        className={`h-2.5 w-2.5 rounded-full ${
                                                            item.status === 'active'
                                                                ? 'bg-emerald-500'
                                                                : 'bg-slate-400'
                                                        }`}
                                                    />
                                                )}

                                                <span
                                                    className={`text-xs font-semibold capitalize ${
                                                        item.status === 'active'
                                                            ? 'text-emerald-600'
                                                            : 'text-slate-500'
                                                    }`}
                                                >
                                                    {updatingStatus === item._id
                                                        ? 'Updating...'
                                                        : item.status || 'inactive'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">

                                                <button
                                                    type="button"
                                                    title="View"
                                                    onClick={() => handleView(item)}
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                                                >
                                                    <LuEye size={17} />
                                                </button>

                                                {hasPermission('categories_edit') && (
                                                    <button
                                                        type="button"
                                                        title="Edit"
                                                        onClick={() => handleEdit(item)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100"
                                                    >
                                                        <LuSquarePen size={17} />
                                                    </button>
                                                )}

                                                {hasPermission('categories_delete') && (
                                                    <button
                                                        type="button"
                                                        title="Delete"
                                                        onClick={() => handleDelete(item._id)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
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
                {!loading && pagination.totalCategories > 0 && (
                    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                        <p className="text-xs text-slate-500 sm:text-sm">
                            Showing page {pagination.currentPage} of {pagination.totalPages}
                            {' '}({pagination.totalCategories} total categories)
                        </p>

                        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">

                            <button
                                type="button"
                                disabled={!pagination.hasPrevPage}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                            >
                                Previous
                            </button>

                            <span className="whitespace-nowrap text-xs font-semibold text-slate-700 sm:text-sm">
                                {pagination.currentPage} / {pagination.totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={!pagination.hasNextPage}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* VIEW CATEGORY MODAL */}
            {showView && viewCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-4">

                    <div className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
                            <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
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

                        <div className="space-y-5 p-4 sm:p-6">

                            {viewCategory.image && (
                                <div className="flex justify-center">
                                    <img
                                        src={viewCategory.image}
                                        alt={viewCategory.name}
                                        className="h-32 w-32 rounded-xl border border-slate-200 object-cover sm:h-40 sm:w-40"
                                    />
                                </div>
                            )}

                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                    Category Name
                                </p>

                                <p className="mt-1 break-words font-semibold text-slate-800">
                                    {viewCategory.name || 'N/A'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                    Description
                                </p>

                                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                                    {viewCategory.description || 'No description available'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                    Status
                                </p>

                                <span
                                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                        viewCategory.status === 'active'
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
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-4">

                    <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">

                            <div className="min-w-0">
                                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                                    {editCategory ? 'Edit Category' : 'Add Category'}
                                </h2>

                                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                                    Enter category details below.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false)
                                    resetForm()
                                }}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-2xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="space-y-5 p-4 sm:p-6">

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
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:h-12"
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
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
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
                                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs sm:text-sm"
                                    />

                                    {image && (
                                        <p className="mt-2 break-all text-sm text-indigo-600">
                                            Selected: {image.name}
                                        </p>
                                    )}

                                    {editCategory && !image && editCategory.image && (
                                        <p className="mt-2 text-xs text-slate-500 sm:text-sm">
                                            Existing image will be kept if your backend supports it.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* FORM BUTTONS */}
                            <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:flex-row sm:px-6 sm:py-5">

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        resetForm()
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:w-auto"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
