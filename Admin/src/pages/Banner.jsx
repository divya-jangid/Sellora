
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
    LuEye,
    LuSquarePen,
    LuTrash2
} from 'react-icons/lu'

const API = 'http://localhost:8000/banner'

const Banner = () => {

    const [showForm, setShowForm] = useState(false)
    const [showView, setShowView] = useState(false)
    const [viewBanner, setViewBanner] = useState(null)

    const [image, setImage] = useState(null)
    const [banners, setBanners] = useState([])
    const [editId, setEditId] = useState(null)

    const [loading, setLoading] = useState(false)
    const [statusLoading, setStatusLoading] = useState(null)

    const [form, setForm] = useState({
        title: '',
        description: '',
        link: '',
        position: 'home',
    })

    const [permissions, setPermissions] = useState([])
    const [roleName, setRoleName] = useState('')
    const [permissionLoading, setPermissionLoading] = useState(true)

    const [search, setSearch] = useState('')

    // GET USER PERMISSIONS
    const getUserPermissions = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/user/check-user',
                { withCredentials: true }
            )

            if (res.data.status) {
                const user = res.data.user

                setRoleName(
                    (user.roleName || user.role?.name || '')
                        .toLowerCase()
                        .replace(/[_-]+/g, ' ')
                        .trim()
                )

                setPermissions(
                    Array.isArray(user.permissions)
                        ? user.permissions
                        : user.role?.permissions || []
                )
            }

        } catch (err) {
            console.log(
                'GET USER PERMISSIONS ERROR:',
                err.response?.data || err.message
            )
        } finally {
            setPermissionLoading(false)
        }
    }

    // CHECK PERMISSION
    const hasPermission = (permission) => {
        if (roleName === 'super admin') return true

        return permissions.includes(permission)
    }

    // GET ALL BANNERS
    const getBanners = async () => {
        try {
            const res = await axios.get(
                `${API}/get-all`,
                { withCredentials: true }
            )

            setBanners(
                Array.isArray(res.data.data)
                    ? res.data.data
                    : []
            )

        } catch (err) {
            console.log(
                'GET BANNERS ERROR:',
                err.response?.data || err.message
            )
        }
    }

    useEffect(() => {
        getUserPermissions()
    }, [])

    useEffect(() => {
        if (!permissionLoading && hasPermission('banners_view')) {
            getBanners()
        }
    }, [permissionLoading, permissions, roleName])

    // HANDLE INPUT
    const handleChange = (e) => {
        const { name, value } = e.target

        setForm(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // RESET FORM
    const resetForm = () => {
        setForm({
            title: '',
            description: '',
            link: '',
            position: 'home',
        })

        setImage(null)
        setEditId(null)
    }

    // OPEN ADD FORM
    const handleAdd = () => {
        if (!hasPermission('banners_create')) {
            toast.error('You do not have permission')
            return
        }

        resetForm()
        setShowForm(true)
    }

    // OPEN EDIT FORM
    const handleEdit = (item) => {
        if (!hasPermission('banners_edit')) {
            toast.error('You do not have permission')
            return
        }

        setEditId(item._id)
        setImage(null)

        setForm({
            title: item.title || '',
            description: item.description || '',
            link: item.link || '',
            position: item.position || 'home'
        })

        setShowForm(true)
    }

    // CREATE / UPDATE BANNER
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (
            editId
                ? !hasPermission('banners_edit')
                : !hasPermission('banners_create')
        ) {
            toast.error('You do not have permission')
            return
        }

        if (!editId && !image) {
            toast.error('Please select banner image')
            return
        }

        setLoading(true)

        try {
            const formData = new FormData()

            formData.append('title', form.title)
            formData.append('description', form.description)
            formData.append('link', form.link)
            formData.append('position', form.position)

            if (image) {
                formData.append('image', image)
            }

            if (editId) {
                await axios.put(
                    `${API}/update/${editId}`,
                    formData,
                    { withCredentials: true }
                )

                toast.success('Banner updated successfully')

            } else {
                await axios.post(
                    `${API}/create`,
                    formData,
                    { withCredentials: true }
                )

                toast.success('Banner created successfully')
            }

            setShowForm(false)
            resetForm()
            await getBanners()

        } catch (err) {
            console.log(
                'SAVE BANNER ERROR:',
                err.response?.data || err.message
            )

            toast.error(
                err.response?.data?.message ||
                'Unable to save banner'
            )

        } finally {
            setLoading(false)
        }
    }

    // UPDATE BANNER STATUS
    const handleStatusChange = async (item) => {

        if (!hasPermission('banners_edit')) {
            toast.error('You do not have permission')
            return
        }

        if (statusLoading === item._id) return

        const newStatus =
            item.status === 'active' ? 'inactive' : 'active'

        try {
            setStatusLoading(item._id)

            const res = await axios.put(
                `${API}/update-status/${item._id}`,
                { status: newStatus },
                { withCredentials: true }
            )

            setBanners(prev =>
                prev.map(banner =>
                    banner._id === item._id
                        ? { ...banner, status: res.data.data?.status || newStatus }
                        : banner
                )
            )

            toast.success(
                res.data.message || 'Banner status updated successfully'
            )

        } catch (err) {
            console.log(
                'UPDATE STATUS ERROR:',
                err.response?.data || err.message
            )

            toast.error(
                err.response?.data?.message ||
                'Unable to update banner status'
            )

        } finally {
            setStatusLoading(null)
        }
    }

    // DELETE BANNER
    const handleDelete = async (id) => {

        if (!hasPermission('banners_delete')) {
            toast.error('You do not have permission')
            return
        }

        try {
            await axios.delete(
                `${API}/delete/${id}`,
                { withCredentials: true }
            )

            toast.success('Banner deleted successfully')
            await getBanners()

        } catch (err) {
            console.log(
                'DELETE BANNER ERROR:',
                err.response?.data || err.message
            )

            toast.error(
                err.response?.data?.message ||
                'Unable to delete banner'
            )
        }
    }

    // FILTER BANNERS
    const filteredBanners = banners.filter(item =>
        item.title?.toLowerCase().includes(search.toLowerCase())
    )

    if (permissionLoading) {
        return <div className="p-8">Loading permissions...</div>
    }

    if (!hasPermission('banners_view')) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-600">
                    Access Denied
                </h2>

                <p className="mt-2 text-slate-500">
                    You do not have permission to view banners.
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">

            {/* HEADER */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        Banner Management
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Manage your website banners.
                    </p>
                </div>

                {hasPermission('banners_create') && (
                    <button
                        onClick={handleAdd}
                        className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-semibold text-white shadow-md"
                    >
                        + Add Banner
                    </button>
                )}

            </div>

            {/* ADD / EDIT MODAL */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">

                    <div className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

                        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-5">

                            <h2 className="text-2xl font-bold text-slate-800">
                                {editId ? 'Update Banner' : 'Add Banner'}
                            </h2>

                            <button
                                onClick={() => {
                                    setShowForm(false)
                                    resetForm()
                                }}
                                className="text-3xl text-slate-500"
                            >
                                ×
                            </button>

                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 p-6"
                        >

                            {/* TITLE */}
                            <div>
                                <label className="mb-2 block font-semibold">
                                    Banner Title
                                </label>

                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="Enter banner title"
                                    className="w-full rounded-xl border bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                                />
                            </div>

                            {/* DESCRIPTION */}
                            <div>
                                <label className="mb-2 block font-semibold">
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Enter banner description"
                                    className="w-full rounded-xl border bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                                />
                            </div>

                            {/* IMAGE */}
                            <div>
                                <label className="mb-2 block font-semibold">
                                    Banner Image
                                </label>

                                <input
                                    type="file"
                                    accept="image/*"
                                    required={!editId}
                                    onChange={(e) =>
                                        setImage(e.target.files?.[0] || null)
                                    }
                                    className="w-full rounded-xl border bg-slate-50 p-3"
                                />

                                {image && (
                                    <p className="mt-2 text-sm text-green-600">
                                        Selected: {image.name}
                                    </p>
                                )}

                                {editId && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        Select a new image only if you want to replace the existing one.
                                    </p>
                                )}
                            </div>

                            {/* LINK */}
                            <div>
                                <label className="mb-2 block font-semibold">
                                    Redirect Link
                                </label>

                                <input
                                    type="text"
                                    name="link"
                                    value={form.link}
                                    onChange={handleChange}
                                    placeholder="/AllProducts"
                                    className="w-full rounded-xl border bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                                />
                            </div>

                            {/* POSITION */}
                            <div>
                                <label className="mb-2 block font-semibold">
                                    Banner Position
                                </label>

                                <select
                                    name="position"
                                    value={form.position}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400"
                                >
                                    <option value="home">Home</option>
                                    <option value="category">Category</option>
                                    <option value="offer">Offer</option>
                                </select>
                            </div>

                          
                            {/* BUTTONS */}
                            <div className="flex flex-col-reverse justify-end gap-3 border-t pt-5 sm:flex-row">

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false)
                                        resetForm()
                                    }}
                                    className="rounded-xl border px-5 py-3 font-semibold text-slate-600"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white disabled:opacity-60"
                                >
                                    {loading
                                        ? 'Please wait...'
                                        : editId
                                            ? 'Update Banner'
                                            : 'Add Banner'}
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* VIEW MODAL */}
            {showView && viewBanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

                    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">

                        <div className="mb-5 flex items-center justify-between">

                            <h2 className="text-xl font-bold">
                                Banner Details
                            </h2>

                            <button
                                onClick={() => {
                                    setShowView(false)
                                    setViewBanner(null)
                                }}
                                className="text-3xl text-slate-500"
                            >
                                ×
                            </button>

                        </div>

                        <img
                            src={viewBanner.image}
                            alt={viewBanner.title}
                            className="mb-5 h-52 w-full rounded-xl object-cover"
                        />

                        <h3 className="text-xl font-bold">
                            {viewBanner.title}
                        </h3>

                        <p className="mt-2 text-slate-600">
                            {viewBanner.description || 'No description'}
                        </p>

                        <p className="mt-3 text-sm">
                            <strong>Link:</strong> {viewBanner.link || 'N/A'}
                        </p>

                        <p className="mt-2 text-sm capitalize">
                            <strong>Position:</strong> {viewBanner.position}
                        </p>

                        <p className="mt-2 text-sm capitalize">
                            <strong>Status:</strong> {viewBanner.status}
                        </p>

                        <button
                            onClick={() => {
                                setShowView(false)
                                setViewBanner(null)
                            }}
                            className="mt-6 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white"
                        >
                            Close
                        </button>

                    </div>
                </div>
            )}

            {/* BANNER TABLE */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">

                <div className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            All Banners
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Total Banners: {banners.length}
                        </p>
                    </div>

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search banner..."
                        className="w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 sm:max-w-sm"
                    />

                </div>

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[900px] text-left text-sm">

                        <thead className="bg-gradient-to-r from-indigo-50 to-violet-50 text-slate-700">
                            <tr>
                                <th className="px-6 py-4">Image</th>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Position</th>
                                <th className="px-6 py-4">Link</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">

                            {filteredBanners.length > 0 ? (
                                filteredBanners.map(item => (

                                    <tr
                                        key={item._id}
                                        className="hover:bg-indigo-50/40"
                                    >

                                        {/* IMAGE */}
                                        <td className="px-6 py-4">
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="h-16 w-24 rounded-lg border object-cover"
                                            />
                                        </td>

                                        {/* TITLE */}
                                        <td className="px-6 py-4 font-semibold text-slate-800">
                                            {item.title}
                                        </td>

                                        {/* POSITION */}
                                        <td className="px-6 py-4 capitalize">
                                            {item.position}
                                        </td>

                                        {/* LINK */}
                                        <td className="max-w-[180px] truncate px-6 py-4 text-slate-500">
                                            {item.link || 'N/A'}
                                        </td>

                                        {/* STATUS + TOGGLE */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">

                                                <span className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                                                    item.status === 'active'
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-red-50 text-red-700'
                                                }`}>
                                                    {item.status}
                                                </span>

                                                {hasPermission('banners_edit') && (
                                                    <button
                                                        type="button"
                                                        disabled={statusLoading === item._id}
                                                        onClick={() => handleStatusChange(item)}
                                                        title="Change banner status"
                                                        className={`relative h-6 w-11 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                            item.status === 'active'
                                                                ? 'bg-green-500'
                                                                : 'bg-gray-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                                                                item.status === 'active'
                                                                    ? 'left-6'
                                                                    : 'left-1'
                                                            }`}
                                                        />
                                                    </button>
                                                )}

                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">

                                                <button
                                                    onClick={() => {
                                                        setViewBanner(item)
                                                        setShowView(true)
                                                    }}
                                                    className="rounded-lg border bg-slate-50 px-3 py-2"
                                                    title="View"
                                                >
                                                    <LuEye />
                                                </button>

                                                {hasPermission('banners_edit') && (
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-indigo-700"
                                                        title="Edit"
                                                    >
                                                        <LuSquarePen />
                                                    </button>
                                                )}

                                                {hasPermission('banners_delete') && (
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-red-600"
                                                        title="Delete"
                                                    >
                                                        <LuTrash2 />
                                                    </button>
                                                )}

                                            </div>
                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-slate-500"
                                    >
                                        No banners found.
                                    </td>
                                </tr>
                            )}

                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    )
}

export default Banner
