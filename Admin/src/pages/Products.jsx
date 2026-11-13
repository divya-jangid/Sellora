
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
    LuEye,
    LuSquarePen,
    LuTrash2
} from "react-icons/lu";

const Product = () => {
    const [showForm, setShowForm] = useState(false)
    const [showView, setShowView] = useState(false)
    const [viewProduct, setViewProduct] = useState(null)
    const [image, setImage] = useState(null)

    const [form, setForm] = useState({
        name: '',
        category: '',
        subcategory: '',
        brand: '',
        description: '',
        stock: '',
    })

    const [product, setProduct] = useState([])
    const [category, setCategory] = useState([])
    const [subcategory, setSubcategory] = useState([])
    const [brand, setBrand] = useState([])
    const [editId, setEditId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState(null)

    // SEARCH, SORTING AND PAGINATION
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [order, setOrder] = useState('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const limit = 10

    const [pagination, setPagination] = useState({
        totalProducts: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    })

    // USER PERMISSIONS
    const [permissions, setPermissions] = useState([])
    const [roleName, setRoleName] = useState('')
    const [permissionLoading, setPermissionLoading] = useState(true)

    // GET LOGGED-IN USER AND PERMISSIONS
    const getUserPermissions = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/user/check-user',
                { withCredentials: true }
            )

            if (res.data.status) {
                const user = res.data.user

                setRoleName(
                    (
                        user.roleName ||
                        user.role?.name ||
                        ''
                    ).trim().toLowerCase()
                )

                setPermissions(
                    Array.isArray(user.permissions)
                        ? user.permissions
                        : Array.isArray(user.role?.permissions)
                            ? user.role.permissions
                            : []
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
        if (roleName === 'super admin') {
            return true
        }

        return permissions.includes(permission)
    }

    // HANDLE NORMAL FORM INPUTS
    const handleChange = (e) => {
        const { name, value } = e.target

        setForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    // HANDLE CATEGORY CHANGE
    const handleCategoryChange = (e) => {
        const selectedCategory = e.target.value

        setForm((prev) => ({
            ...prev,
            category: selectedCategory,
            subcategory: ''
        }))
    }

    // GET ALL PRODUCTS WITH BACKEND SEARCH, SORTING AND PAGINATION
    const getProducts = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/product/get-all',
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

            setProduct(
                Array.isArray(res.data.data)
                    ? res.data.data
                    : []
            )

            if (res.data.pagination) {
                setPagination(res.data.pagination)
            }

        } catch (err) {
            console.log(
                'GET PRODUCT ERROR:',
                err.response?.data || err.message
            )
        }
    }

    // GET ALL CATEGORIES
    const getCategory = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/category/get-all',
                { withCredentials: true }
            )

            setCategory(
                Array.isArray(res.data.data)
                    ? res.data.data
                    : []
            )
        } catch (err) {
            console.log(
                'GET CATEGORY ERROR:',
                err.response?.data || err.message
            )
        }
    }

    // GET ALL SUBCATEGORIES
    const getSubcategory = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/subcategory/get-all',
                { withCredentials: true }
            )

            setSubcategory(
                Array.isArray(res.data.data)
                    ? res.data.data
                    : []
            )
        } catch (err) {
            console.log(
                'GET SUBCATEGORY ERROR:',
                err.response?.data || err.message
            )
        }
    }

    // GET BRANDS
    const getBrand = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/brand/get-all',
                { withCredentials: true }
            )

            setBrand(
                Array.isArray(res.data.data)
                    ? res.data.data
                    : []
            )

        } catch (err) {
            console.log(
                'GET BRAND ERROR:',
                err.response?.data || err.message
            )
        }
    }

    // FILTER SUBCATEGORIES BY SELECTED CATEGORY
    const filteredSubcategories = subcategory.filter((item) => {
        const parentCategory =
            item.category?._id || item.category

        return String(parentCategory || '') === String(form.category)
    })

    // LOAD OTHER DATA
    useEffect(() => {
        getUserPermissions()
        getCategory()
        getSubcategory()
        getBrand()
    }, [])

    // FETCH PRODUCTS WHEN SEARCH, SORT OR PAGE CHANGES
    useEffect(() => {
        getProducts()
    }, [currentPage, search, sortBy, order])

    // RESET FORM
    const resetForm = () => {
        setForm({
            name: '',
            category: '',
            subcategory: '',
            brand: '',
            description: '',
            stock: '',
        })

        setImage(null)
        setEditId(null)
    }

    // OPEN ADD PRODUCT FORM
    const handleAdd = () => {
        if (!hasPermission('products_create')) {
            toast.error('You do not have permission to create products')
            return
        }

        resetForm()
        setShowForm(true)
    }

    // OPEN EDIT PRODUCT FORM
    const handleUpdate = (id) => {
        if (!hasPermission('products_edit')) {
            toast.error('You do not have permission to edit products')
            return
        }

        const data = product.find((item) => item._id === id)

        if (!data) return

        setEditId(id)
        setImage(null)

        setForm({
            name: data.name || '',
            category: data.category?._id || data.category || '',
            subcategory:
                data.subCategory?._id ||
                data.subCategory ||
                '',
            brand: data.brand?._id || data.brand || '',
            description: data.description || '',
            stock: data.stock ?? '',
        })

        setShowForm(true)
    }

    // VIEW PRODUCT
    const handleView = (item) => {
        setViewProduct(item)
        setShowView(true)
    }

    // CHANGE PRODUCT STATUS
    const handleStatusToggle = async (item) => {
        if (!hasPermission('products_edit')) {
            toast.error('You do not have permission to change product status')
            return
        }

        try {
            setUpdatingStatus(item._id)

            const res = await axios.put(
                `http://localhost:8000/product/update-status/${item._id}`,
                {},
                { withCredentials: true }
            )

            await getProducts()

            toast.success(res.data.message)

        } catch (err) {
            console.log(
                'UPDATE PRODUCT STATUS ERROR:',
                err.response?.data || err.message
            )

            toast.error(
                err.response?.data?.message ||
                'Unable to update product status'
            )
        } finally {
            setUpdatingStatus(null)
        }
    }

    // CREATE OR UPDATE PRODUCT
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (
            editId
                ? !hasPermission('products_edit')
                : !hasPermission('products_create')
        ) {
            toast.error('You do not have permission to perform this action')
            return
        }

        if (!editId && !image) {
            toast.error('Please select a product image')
            return
        }

        setLoading(true)

        try {
            if (editId) {
                const updateData = {
                    name: form.name,
                    category: form.category,
                    subCategory: form.subcategory || undefined,
                    brand: form.brand,
                    description: form.description,
                    stock: Number(form.stock),
                }

                await axios.put(
                    `http://localhost:8000/product/update/${editId}`,
                    updateData,
                    { withCredentials: true }
                )

            } else {
                const formData = new FormData()

                formData.append('name', form.name)
                formData.append('category', form.category)
                formData.append('brand', form.brand)
                formData.append('description', form.description)
                formData.append('stock', form.stock)
                formData.append('image', image)

                if (form.subcategory) {
                    formData.append('subCategory', form.subcategory)
                }

                await axios.post(
                    'http://localhost:8000/product/create',
                    formData,
                    { withCredentials: true }
                )
            }

            await getProducts()

            setShowForm(false)
            resetForm()

            toast.success(
                editId
                    ? 'Product updated successfully'
                    : 'Product created successfully'
            )

        } catch (err) {
            console.log(
                'SAVE PRODUCT ERROR:',
                err.response?.data || err.message
            )

            toast.error(
                err.response?.data?.message ||
                'Something went wrong'
            )
        } finally {
            setLoading(false)
        }
    }

    // DELETE PRODUCT
    const handleDelete = async (id) => {
        if (!hasPermission('products_delete')) {
            toast.error('You do not have permission to delete products')
            return
        }

        try {
            await axios.delete(
                `http://localhost:8000/product/delete/${id}`,
                { withCredentials: true }
            )

            if (product.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1)
            } else {
                await getProducts()
            }

            toast.success('Product deleted successfully')

        } catch (err) {
            console.log(
                'DELETE PRODUCT ERROR:',
                err.response?.data || err.message
            )

            toast.error(
                err.response?.data?.message ||
                'Unable to delete product'
            )
        }
    }

    // WAIT FOR PERMISSIONS
    if (permissionLoading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <p className="text-slate-500">
                    Loading permissions...
                </p>
            </div>
        )
    }

    // CHECK VIEW PERMISSION
    if (
        roleName !== 'super admin' &&
        !hasPermission('products_view')
    ) {
        return (
            <div className="p-5 text-center sm:p-8">
                <h2 className="text-xl font-bold text-red-600">
                    Access Denied
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                    You do not have permission to view products.
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-full w-full min-w-0 max-w-full overflow-x-hidden bg-slate-50 p-3 sm:p-5 lg:p-6">

            {/* HEADER */}
            <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                        Products
                    </h1>

                    <p className="mt-2 text-sm text-slate-500 sm:text-base">
                        Manage your products, categories and stock.
                    </p>
                </div>

                {hasPermission('products_create') && (
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-semibold text-white shadow-md shadow-indigo-200 transition hover:shadow-lg sm:w-auto"
                    >
                        <span className="text-xl">+</span>
                        Add Product
                    </button>
                )}
            </div>

            {/* ADD / EDIT PRODUCT MODAL */}
            {showForm && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-2 backdrop-blur-sm sm:p-4">
                    <div className="mx-auto my-2 max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-indigo-100 bg-white shadow-2xl sm:my-4 sm:max-h-[92vh]">

                        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-6 sm:py-5">
                            <div className="min-w-0">
                                <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
                                    {editId ? 'Update Product' : 'Add Product'}
                                </h2>

                                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                                    Enter the product details below.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false)
                                    resetForm()
                                }}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 hover:bg-red-50 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6">

                            {/* PRODUCT NAME */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Product Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Enter product name"
                                    className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                />
                            </div>

                            {/* CATEGORY AND BRAND */}
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Category
                                    </label>

                                    <select
                                        name="category"
                                        required
                                        value={form.category}
                                        onChange={handleCategoryChange}
                                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    >
                                        <option value="">Select Category</option>

                                        {category.map((item) => (
                                            <option key={item._id} value={item._id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Brand
                                    </label>

                                    <select
                                        name="brand"
                                        required
                                        value={form.brand}
                                        onChange={handleChange}
                                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    >
                                        <option value="">Select Brand</option>

                                        {brand.map((item) => (
                                            <option key={item._id} value={item._id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* SUBCATEGORY */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Subcategory
                                </label>

                                <select
                                    name="subcategory"
                                    value={form.subcategory}
                                    onChange={handleChange}
                                    disabled={!form.category}
                                    className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:opacity-50"
                                >
                                    <option value="">
                                        {!form.category
                                            ? 'First Select Category'
                                            : 'Select Subcategory'}
                                    </option>

                                    {filteredSubcategories.map((item) => (
                                        <option key={item._id} value={item._id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>

                                {form.category && filteredSubcategories.length === 0 && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        No subcategories found for this category.
                                    </p>
                                )}
                            </div>

                            {/* DESCRIPTION */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    required
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Enter product description"
                                    rows="4"
                                    className="w-full min-w-0 resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                />
                            </div>

                            {/* PRODUCT IMAGE */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Product Image
                                </label>

                                <input
                                    type="file"
                                    accept="image/*"
                                    required={!editId}
                                    onChange={(e) =>
                                        setImage(e.target.files?.[0] || null)
                                    }
                                    className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
                                />

                                {image && (
                                    <p className="mt-2 break-all text-sm text-green-700">
                                        Selected: {image.name}
                                    </p>
                                )}

                                {editId && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        Image replacement is not enabled yet. The current image will be kept.
                                    </p>
                                )}
                            </div>

                            {/* STOCK */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Stock
                                </label>

                                <input
                                    type="number"
                                    name="stock"
                                    min="0"
                                    required
                                    value={form.stock}
                                    onChange={handleChange}
                                    placeholder="Enter stock quantity"
                                    className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                />
                            </div>

                            {/* FORM BUTTONS */}
                            <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false)
                                        resetForm()
                                    }}
                                    className="w-full rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-semibold text-white disabled:opacity-60 sm:w-auto"
                                >
                                    {loading
                                        ? 'Please wait...'
                                        : editId
                                            ? 'Update Product'
                                            : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW PRODUCT MODAL */}
            {showView && viewProduct && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-2 backdrop-blur-sm sm:p-4">
                    <div className="mx-auto my-2 max-h-[calc(100dvh-1rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:my-4 sm:max-h-[90vh]">

                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
                            <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
                                Product Details
                            </h2>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowView(false)
                                    setViewProduct(null)
                                }}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 hover:bg-red-50 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4 p-4 sm:p-6">

                            {viewProduct.image && (
                                <div className="flex justify-center">
                                    <img
                                        src={viewProduct.image}
                                        alt={viewProduct.name}
                                        className="h-36 w-36 rounded-xl border border-slate-200 object-cover sm:h-40 sm:w-40"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500">Product Name</p>
                                    <p className="mt-1 break-words font-semibold text-slate-800">
                                        {viewProduct.name || 'N/A'}
                                    </p>
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500">Brand</p>
                                    <p className="mt-1 break-words font-semibold text-slate-800">
                                        {viewProduct.brand?.name || 'N/A'}
                                    </p>
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500">Category</p>
                                    <p className="mt-1 break-words font-semibold text-slate-800">
                                        {viewProduct.category?.name || 'N/A'}
                                    </p>
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500">Subcategory</p>
                                    <p className="mt-1 break-words font-semibold text-slate-800">
                                        {viewProduct.subCategory?.name || 'N/A'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">Stock</p>
                                    <p className="mt-1 font-semibold text-slate-800">
                                        {viewProduct.stock ?? 0}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">Status</p>
                                    <p className="mt-1 font-semibold capitalize text-slate-800">
                                        {viewProduct.status || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">Description</p>
                                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
                                    {viewProduct.description || 'No description available'}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowView(false)
                                    setViewProduct(null)
                                }}
                                className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCTS TABLE */}
            <div className="mt-6 w-full min-w-0 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm sm:mt-8">

                {/* TABLE HEADER + SEARCH + SORT */}
                <div className="flex min-w-0 flex-col gap-4 border-b border-slate-100 px-3 py-4 sm:px-5 sm:py-5">

                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            All Products
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Total Products: {pagination.totalProducts}
                        </p>
                    </div>

                    <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">

                        {/* SEARCH */}
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setCurrentPage(1)
                            }}
                            placeholder="Search product, category, brand..."
                            className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 lg:flex-1"
                        />

                        {/* SORT FIELD */}
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 lg:w-auto"
                        >
                            <option value="createdAt">Sort By: Date</option>
                            <option value="name">Product Name (A to Z)</option>
                            <option value="status">Status</option>
                        </select>

                        {/* SORT ORDER */}
                        <select
                            value={order}
                            onChange={(e) => {
                                setOrder(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 lg:w-auto"
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                        </select>
                    </div>
                </div>

                {/* TABLE SCROLL ONLY */}
                <div className="w-full min-w-0 overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left text-sm">

                        <thead className="bg-gradient-to-r from-indigo-50 to-violet-50 text-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Image</th>
                                <th className="px-6 py-4 font-semibold">Product Name</th>
                                <th className="px-6 py-4 font-semibold">Category</th>
                                <th className="px-6 py-4 font-semibold">Subcategory</th>
                                <th className="px-6 py-4 font-semibold">Brand</th>
                                <th className="px-6 py-4 font-semibold">Stock</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 text-center font-semibold">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">

                            {product.length > 0 ? (
                                product.map((item) => (
                                    <tr
                                        key={item._id}
                                        className="transition-colors hover:bg-indigo-50/40"
                                    >
                                        <td className="px-6 py-4">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xl">
                                                    📦
                                                </div>
                                            )}
                                        </td>

                                        <td className="max-w-[220px] px-6 py-4 font-semibold text-slate-800">
                                            <span className="break-words">
                                                {item.name}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                                {item.category?.name || 'N/A'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-slate-600">
                                            {item.subCategory?.name || 'N/A'}
                                        </td>

                                        <td className="px-6 py-4 text-slate-600">
                                            {item.brand?.name || 'N/A'}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                                                {item.stock}
                                            </span>
                                        </td>

                                        {/* STATUS TOGGLE */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        updatingStatus === item._id ||
                                                        !hasPermission('products_edit')
                                                    }
                                                    onClick={() => handleStatusToggle(item)}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
                                                        item.status === 'active'
                                                            ? 'bg-green-500'
                                                            : 'bg-slate-300'
                                                    }`}
                                                    aria-label={`Change ${item.name} status`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${
                                                            item.status === 'active'
                                                                ? 'translate-x-6'
                                                                : 'translate-x-1'
                                                        }`}
                                                    />
                                                </button>

                                                <span
                                                    className={`text-xs font-semibold capitalize ${
                                                        item.status === 'active'
                                                            ? 'text-green-600'
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
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">

                                                <button
                                                    type="button"
                                                    onClick={() => handleView(item)}
                                                    title="View Product"
                                                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                                >
                                                    <LuEye />
                                                </button>

                                                {hasPermission('products_edit') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdate(item._id)}
                                                        title="Edit Product"
                                                        className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                                                    >
                                                        <LuSquarePen />
                                                    </button>
                                                )}

                                                {hasPermission('products_delete') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item._id)}
                                                        title="Delete Product"
                                                        className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
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
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                                                📦
                                            </div>

                                            <p className="font-semibold text-slate-700">
                                                No products found
                                            </p>

                                            <p className="mt-1 text-sm text-slate-400">
                                                Your products will appear here.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="flex flex-col gap-3 border-t border-slate-100 px-3 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">

                    <p className="text-center text-xs text-slate-500 sm:text-sm md:text-left">
                        Showing {product.length > 0 ? ((currentPage - 1) * limit) + 1 : 0}
                        {' '}to{' '}
                        {((currentPage - 1) * limit) + product.length}
                        {' '}of {pagination.totalProducts} products
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">

                        <button
                            type="button"
                            disabled={!pagination.hasPrevPage}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                        >
                            Previous
                        </button>

                        <span className="text-xs font-semibold text-slate-700 sm:text-sm">
                            Page {pagination.currentPage || currentPage} of {pagination.totalPages || 0}
                        </span>

                        <button
                            type="button"
                            disabled={!pagination.hasNextPage}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Product
