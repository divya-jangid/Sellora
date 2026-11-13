
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
    LuEye,
    LuSquarePen,
    LuTrash2,
    LuSearch
} from "react-icons/lu";

const Brand = () => {
    const [showForm, setShowForm] = useState(false)
    const [showView, setShowView] = useState(false)

    const [brands, setBrands] = useState([])
    const [editId, setEditId] = useState('')
    const [logoFile, setLogoFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState(null)
    const [error, setError] = useState('')

    const [viewBrand, setViewBrand] = useState(null)

    // SEARCH, SORT AND PAGINATION
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [order, setOrder] = useState('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const [limit] = useState(10)

    const [pagination, setPagination] = useState({
        totalBrands: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false
    })

    // PERMISSIONS
    const [roleName, setRoleName] = useState('')
    const [permissions, setPermissions] = useState([])
    const [authLoading, setAuthLoading] = useState(true)

    const [form, setForm] = useState({
        name: '',
        slug: '',
        logo: '',
        description: '',
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

    // GENERATE SLUG
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
    }

    // GET ALL BRANDS
    const getBrands = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/brand/get-all',
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

            setBrands(res.data.data || [])

            setPagination(
                res.data.pagination || {
                    totalBrands: 0,
                    totalPages: 0,
                    currentPage: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            )

            setError('')
        } catch (err) {
            console.log('GET BRANDS ERROR:', err)

            setError(
                err.response?.data?.message || 'Failed to fetch brands'
            )
        }
    }

    useEffect(() => {
        checkUser()
    }, [])

    // FETCH BRANDS
    useEffect(() => {
        if (authLoading) return

        if (hasPermission('brands_view')) {
            getBrands()
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

    // RESET FORM
    const resetForm = () => {
        setForm({
            name: '',
            slug: '',
            logo: '',
            description: '',
        })

        setLogoFile(null)
        setEditId('')
        setError('')
        setShowForm(false)
    }

    // OPEN ADD FORM
    const handleAdd = () => {
        if (!hasPermission('brands_create')) {
            toast.error('You do not have permission to create brands')
            return
        }

        resetForm()
        setShowForm(true)
    }

    // EDIT BRAND
    const handleEdit = (id) => {
        if (!hasPermission('brands_edit')) {
            toast.error('You do not have permission to edit brands')
            return
        }

        const selectedBrand = brands.find(
            (item) => item._id === id
        )

        if (!selectedBrand) return

        setForm({
            name: selectedBrand.name || '',
            slug: selectedBrand.slug || '',
            logo: selectedBrand.logo || '',
            description: selectedBrand.description || ''
        })

        setLogoFile(null)
        setEditId(id)
        setError('')
        setShowForm(true)
    }

    // VIEW BRAND
    const handleView = (brand) => {
        setViewBrand(brand)
        setShowView(true)
    }

    // DELETE BRAND
    const handleDelete = async (id) => {
        if (!hasPermission('brands_delete')) {
            toast.error('You do not have permission to delete brands')
            return
        }

        try {
            await axios.delete(
                `http://localhost:8000/brand/delete/${id}`,
                { withCredentials: true }
            )

            toast.success('Brand deleted successfully!')

            if (brands.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1)
            } else {
                await getBrands()
            }

        } catch (err) {
            console.log('DELETE BRAND ERROR:', err)

            toast.error(
                err.response?.data?.message || 'Failed to delete brand'
            )
        }
    }

    // UPDATE BRAND STATUS
    const handleStatusToggle = async (brand) => {
        if (!hasPermission('brands_edit')) {
            toast.error('You do not have permission to update brand status')
            return
        }

        try {
            setUpdatingStatus(brand._id)

            const res = await axios.put(
                `http://localhost:8000/brand/update-status/${brand._id}`,
                {},
                { withCredentials: true }
            )

            await getBrands()

            if (viewBrand?._id === brand._id) {
                setViewBrand({
                    ...brand,
                    status: brand.status === 'active' ? 'inactive' : 'active'
                })
            }

            toast.success(res.data.message || 'Brand status updated')

        } catch (err) {
            console.log(
                'BRAND STATUS ERROR:',
                err.response?.data || err.message
            )

            toast.error(
                err.response?.data?.message ||
                'Unable to update brand status'
            )
        } finally {
            setUpdatingStatus(null)
        }
    }

    // SUBMIT FORM
    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (editId && !hasPermission('brands_edit')) {
            setError('You do not have permission to edit brands')
            return
        }

        if (!editId && !hasPermission('brands_create')) {
            setError('You do not have permission to create brands')
            return
        }

        if (!form.name.trim()) {
            setError('Brand name is required')
            return
        }

        try {
            setLoading(true)

            const formData = new FormData()

            formData.append('name', form.name.trim())
            formData.append('slug', generateSlug(form.name))
            formData.append('description', form.description)

            if (logoFile) {
                formData.append('logo', logoFile)
            }

            if (editId) {
                await axios.put(
                    `http://localhost:8000/brand/update/${editId}`,
                    formData,
                    { withCredentials: true }
                )
            } else {
                await axios.post(
                    'http://localhost:8000/brand/create',
                    formData,
                    { withCredentials: true }
                )
            }

            toast.success(
                editId
                    ? 'Brand updated successfully!'
                    : 'Brand created successfully!'
            )

            resetForm()

            if (!editId) {
                setCurrentPage(1)
            } else {
                await getBrands()
            }

        } catch (err) {
            console.log(
                'SUBMIT BRAND ERROR:',
                err.response?.data || err.message
            )

            toast.error(
                err.response?.data?.message || 'Something went wrong'
            )
        } finally {
            setLoading(false)
        }
    }

    const logoPreview = logoFile
        ? URL.createObjectURL(logoFile)
        : form.logo

    // WAIT FOR AUTHENTICATION
    if (authLoading) {
        return (
            <div className="p-6 text-center text-slate-600">
                Checking permissions...
            </div>
        )
    }

    // VIEW PERMISSION CHECK
    if (!hasPermission('brands_view')) {
        return (
            <div className="m-3 rounded-xl border border-red-200 bg-white p-5 text-center shadow-sm sm:m-6 sm:p-8">
                <h2 className="text-xl font-bold text-red-600">
                    Access Denied
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                    You do not have permission to view brands.
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
                        Brands
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Create and manage your product brands.
                    </p>
                </div>

                {hasPermission('brands_create') && (
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 sm:w-auto"
                    >
                        + Add Brand
                    </button>
                )}
            </div>

            {/* ERROR */}
            {error && !showForm && (
                <p className="mb-4 break-words rounded-xl bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </p>
            )}

            {/* SEARCH AND SORT */}
            <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row">

                <div className="relative w-full min-w-0 sm:max-w-md">
                    <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                        type="text"
                        placeholder="Search brand by name..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setCurrentPage(1)
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </div>

                <select
                    value={`${sortBy}_${order}`}
                    onChange={(e) => {
                        const [field, direction] = e.target.value.split('_')

                        setSortBy(field)
                        setOrder(direction)
                        setCurrentPage(1)
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 sm:max-w-xs"
                >
                    <option value="createdAt_desc">Newest First</option>
                    <option value="createdAt_asc">Oldest First</option>
                    <option value="name_asc">Brand Name (A to Z)</option>
                    <option value="name_desc">Brand Name (Z to A)</option>
                    <option value="status_asc">Status (Active to Inactive)</option>
                    <option value="status_desc">Status (Inactive to Active)</option>
                </select>

            </div>

            {/* BRANDS TABLE */}
            <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">

                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            All Brands
                        </h2>

                        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                            Total Brands: {pagination.totalBrands || 0}
                        </p>
                    </div>
                </div>

                {/* RESPONSIVE TABLE */}
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left">

                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-4 text-xs font-bold uppercase text-slate-600">
                                    Name
                                </th>

                                <th className="px-5 py-4 text-xs font-bold uppercase text-slate-600">
                                    Slug
                                </th>

                                <th className="px-5 py-4 text-xs font-bold uppercase text-slate-600">
                                    Logo
                                </th>

                                <th className="px-5 py-4 text-xs font-bold uppercase text-slate-600">
                                    Description
                                </th>

                                <th className="px-5 py-4 text-xs font-bold uppercase text-slate-600">
                                    Status
                                </th>

                                <th className="px-5 py-4 text-center text-xs font-bold uppercase text-slate-600">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {brands.length > 0 ? (
                                brands.map((brand) => (
                                    <tr
                                        key={brand._id}
                                        className="transition hover:bg-slate-50"
                                    >

                                        <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                                            {brand.name}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-slate-600">
                                            {brand.slug}
                                        </td>

                                        <td className="px-5 py-4">
                                            {brand.logo ? (
                                                <img
                                                    src={brand.logo}
                                                    alt={brand.name}
                                                    className="h-12 w-12 rounded-lg border border-slate-200 bg-white object-contain p-1"
                                                />
                                            ) : (
                                                <span className="text-sm text-slate-400">
                                                    No logo
                                                </span>
                                            )}
                                        </td>

                                        <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                                            <p className="line-clamp-2">
                                                {brand.description || '-'}
                                            </p>
                                        </td>

                                        {/* STATUS TOGGLE */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">

                                                {hasPermission('brands_edit') ? (
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={brand.status === 'active'}
                                                        aria-label={`Change ${brand.name} status`}
                                                        onClick={() => handleStatusToggle(brand)}
                                                        disabled={updatingStatus === brand._id}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                                                            brand.status === 'active'
                                                                ? 'bg-emerald-500'
                                                                : 'bg-slate-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                                                                brand.status === 'active'
                                                                    ? 'translate-x-6'
                                                                    : 'translate-x-1'
                                                            }`}
                                                        />
                                                    </button>
                                                ) : (
                                                    <span
                                                        className={`h-2.5 w-2.5 rounded-full ${
                                                            brand.status === 'active'
                                                                ? 'bg-emerald-500'
                                                                : 'bg-slate-400'
                                                        }`}
                                                    />
                                                )}

                                                <span
                                                    className={`text-xs font-semibold capitalize ${
                                                        brand.status === 'active'
                                                            ? 'text-emerald-600'
                                                            : 'text-slate-500'
                                                    }`}
                                                >
                                                    {updatingStatus === brand._id
                                                        ? 'Updating...'
                                                        : brand.status || 'active'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">

                                                <button
                                                    type="button"
                                                    title="View"
                                                    onClick={() => handleView(brand)}
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                                                >
                                                    <LuEye size={17} />
                                                </button>

                                                {hasPermission('brands_edit') && (
                                                    <button
                                                        type="button"
                                                        title="Edit"
                                                        onClick={() => handleEdit(brand._id)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100"
                                                    >
                                                        <LuSquarePen size={17} />
                                                    </button>
                                                )}

                                                {hasPermission('brands_delete') && (
                                                    <button
                                                        type="button"
                                                        title="Delete"
                                                        onClick={() => handleDelete(brand._id)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                                                    >
                                                        <LuTrash2 size={17} />
                                                    </button>
                                                )}

                                            </div>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-12 text-center text-sm text-slate-500"
                                    >
                                        {error || 'No brands found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>
                </div>

                {/* PAGINATION */}
                <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                    <p className="text-xs text-slate-500 sm:text-sm">
                        Showing {brands.length > 0 ? (currentPage - 1) * limit + 1 : 0}
                        {' - '}
                        {(currentPage - 1) * limit + brands.length}
                        {' of '}
                        {pagination.totalBrands || 0} brands
                    </p>

                    <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">

                        <button
                            type="button"
                            disabled={!pagination.hasPrevPage}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                        >
                            Previous
                        </button>

                        <span className="whitespace-nowrap text-xs font-semibold text-slate-700 sm:text-sm">
                            Page {currentPage} of {pagination.totalPages || 1}
                        </span>

                        <button
                            type="button"
                            disabled={!pagination.hasNextPage}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                        >
                            Next
                        </button>

                    </div>
                </div>

            </div>

            {/* ADD / EDIT FORM MODAL */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-4">

                    <div className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-indigo-100 bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
                            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                                {editId ? 'Update Brand' : 'Add Brand'}
                            </h2>

                            <button
                                type="button"
                                onClick={resetForm}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-2xl text-slate-400 hover:bg-red-50 hover:text-red-500"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="space-y-5 p-4 sm:p-6">

                                {/* BRAND NAME */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Brand Name
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter brand name"
                                        value={form.name}
                                        onChange={(e) => {
                                            const name = e.target.value

                                            setForm((prev) => ({
                                                ...prev,
                                                name,
                                                slug: generateSlug(name)
                                            }))
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>

                                {/* SLUG */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Slug
                                    </label>

                                    <input
                                        type="text"
                                        value={form.slug}
                                        readOnly
                                        className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600 outline-none"
                                    />
                                </div>

                                {/* LOGO */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Brand Logo
                                    </label>

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]

                                            if (file) {
                                                if (!file.type.startsWith('image/')) {
                                                    setError('Please select an image file')
                                                    e.target.value = ''
                                                    return
                                                }

                                                if (file.size > 5 * 1024 * 1024) {
                                                    setError('Image size must be under 5 MB')
                                                    e.target.value = ''
                                                    return
                                                }

                                                setError('')
                                                setLogoFile(file)
                                            }
                                        }}
                                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs sm:text-sm"
                                    />

                                    {logoPreview && (
                                        <div className="mt-3">
                                            <p className="mb-2 text-sm text-slate-500">
                                                Logo Preview
                                            </p>

                                            <img
                                                src={logoPreview}
                                                alt="Brand logo preview"
                                                className="h-24 w-24 rounded-xl border border-slate-200 object-contain p-2"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* DESCRIPTION */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Description
                                    </label>

                                    <textarea
                                        rows="3"
                                        placeholder="Enter description"
                                        value={form.description}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                description: e.target.value
                                            })
                                        }
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>

                                {error && (
                                    <p className="break-words text-sm text-red-600">
                                        {error}
                                    </p>
                                )}

                            </div>

                            {/* FORM BUTTONS */}
                            <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:px-6 sm:py-5">

                                <button
                                    type="button"
                                    onClick={resetForm}
                                    disabled={loading}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 sm:w-auto"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                >
                                    {loading
                                        ? 'Please wait...'
                                        : editId
                                            ? 'Update Brand'
                                            : 'Add Brand'}
                                </button>

                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW BRAND MODAL */}
            {showView && viewBrand && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-4">

                    <div className="my-auto w-full max-w-lg rounded-2xl border border-indigo-100 bg-white p-4 shadow-2xl sm:p-6">

                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                                Brand Details
                            </h2>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowView(false)
                                    setViewBrand(null)
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-2xl text-slate-500 hover:bg-red-50 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>

                        {viewBrand.logo ? (
                            <div className="mb-5 flex h-36 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 sm:h-44">
                                <img
                                    src={viewBrand.logo}
                                    alt={viewBrand.name}
                                    className="h-full max-w-full object-contain"
                                />
                            </div>
                        ) : (
                            <div className="mb-5 flex h-36 items-center justify-center rounded-xl bg-indigo-50 text-5xl sm:h-44">
                                🏷️
                            </div>
                        )}

                        <div className="space-y-4">

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    Brand Name
                                </p>

                                <p className="mt-1 break-words font-semibold text-slate-800">
                                    {viewBrand.name}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    Slug
                                </p>

                                <p className="mt-1 break-all text-sm text-slate-700">
                                    {viewBrand.slug || '-'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    Description
                                </p>

                                <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                                    {viewBrand.description || 'No description available'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    Status
                                </p>

                                <p className={`mt-1 font-semibold capitalize ${
                                    viewBrand.status === 'active'
                                        ? 'text-emerald-700'
                                        : 'text-red-600'
                                }`}>
                                    {viewBrand.status || 'active'}
                                </p>
                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setShowView(false)
                                setViewBrand(null)
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

export default Brand
