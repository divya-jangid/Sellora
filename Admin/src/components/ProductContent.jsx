
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
    LuEye,
    LuSquarePen,
    LuTrash2
} from "react-icons/lu";

const ProductContent = () => {
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

    // GET ALL PRODUCTS
    const getProducts = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/product/get-all',
                { withCredentials: true }
            )

            setProduct(
                Array.isArray(res.data.data)
                    ? res.data.data
                    : []
            )
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


    //  GET BRANDS FUNCTION
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

    // LOAD DATA
    useEffect(() => {
        getUserPermissions()
        getProducts()
        getCategory()
        getSubcategory()
        getBrand()
    }, [])

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
            toast.success('You do not have permission to create products')
            return
        }

        resetForm()
        setShowForm(true)
    }

    // OPEN EDIT PRODUCT FORM
    const handleUpdate = (id) => {
        if (!hasPermission('products_edit')) {
            toast.success('You do not have permission to edit products')
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
            alert('You do not have permission to change product status')
            return
        }

        const newStatus =
            item.status === 'active' ? 'inactive' : 'active'

        try {
            setUpdatingStatus(item._id)

            await axios.put(
                `http://localhost:8000/product/update/${item._id}`,
                { status: newStatus },
                { withCredentials: true }
            )

            await getProducts()

        } catch (err) {
            console.log(
                'UPDATE PRODUCT STATUS ERROR:',
                err.response?.data || err.message
            )

            alert(
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
            alert('You do not have permission to perform this action')
            return
        }

        if (!editId && !image) {
            alert('Please select a product image')
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

        } catch (err) {
            console.log(
                'SAVE PRODUCT ERROR:',
                err.response?.data || err.message
            )

            alert(
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
            alert('You do not have permission to delete products')
            return
        }

        try {
            await axios.delete(
                `http://localhost:8000/product/delete/${id}`,
                { withCredentials: true }
            )

            await getProducts()

        } catch (err) {
            console.log(
                'DELETE PRODUCT ERROR:',
                err.response?.data || err.message
            )

            alert(
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
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-600">
                    Access Denied
                </h2>

                <p className="mt-2 text-slate-500">
                    You do not have permission to view products.
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">

            {/* HEADER */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
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
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-semibold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <span className="text-xl">+</span>
                        Add Product
                    </button>
                )}
            </div>

            {/* ADD / EDIT PRODUCT MODAL */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-indigo-100 bg-white shadow-2xl">

                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
                                    {editId ? 'Update Product' : 'Add Product'}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Enter the product details below.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false)
                                    resetForm()
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 hover:bg-red-50 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 p-6">

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
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                />
                            </div>


                            {/* CATEGORY */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Category
                                </label>

                                <select
                                    name="category"
                                    required
                                    value={form.category}
                                    onChange={handleCategoryChange}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                >
                                    <option value="">Select Category</option>

                                    {category.map((item) => (
                                        <option key={item._id} value={item._id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>


                            {/* BRAND */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Brand
                                </label>

                                <select
                                    name="brand"
                                    required
                                    value={form.brand}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                >
                                    <option value="">Select Brand</option>

                                    {brand.map((item) => (
                                        <option key={item._id} value={item._id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
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
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:opacity-50"
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
                                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
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
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
                                />

                                {image && (
                                    <p className="mt-2 text-sm text-green-700">
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
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
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
                                    className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-semibold text-white disabled:opacity-60"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <h2 className="text-xl font-bold text-slate-800">
                                Product Details
                            </h2>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowView(false)
                                    setViewProduct(null)
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 hover:bg-red-50 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4 p-6">

                            {viewProduct.image && (
                                <div className="flex justify-center">
                                    <img
                                        src={viewProduct.image}
                                        alt={viewProduct.name}
                                        className="h-40 w-40 rounded-xl border border-slate-200 object-cover"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs text-slate-500">Product Name</p>
                                    <p className="mt-1 font-semibold text-slate-800">
                                        {viewProduct.name || 'N/A'}
                                    </p>
                                </div>


                                
                                <div>
                                    <p className="text-xs text-slate-500">Brand</p>
                                    <p className="mt-1 font-semibold text-slate-800">
                                        {viewProduct.brand?.name || 'N/A'}
                                    </p>
                                </div>



                                <div>
                                    <p className="text-xs text-slate-500">Category</p>
                                    <p className="mt-1 font-semibold text-slate-800">
                                        {viewProduct.category?.name || 'N/A'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">Subcategory</p>
                                    <p className="mt-1 font-semibold text-slate-800">
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
                                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
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
            <div className="mt-8 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">

                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                    <h2 className="text-lg font-bold text-slate-800">
                        All Products
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        View and manage your product inventory.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-left text-sm">

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

                                        <td className="px-6 py-4 font-semibold text-slate-800">
                                            {item.name}
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

                                        {/* STATUS */}
                                        <td className="px-6 py-4">
                                            {hasPermission('products_edit') ? (
                                                <button
                                                    type="button"
                                                    disabled={updatingStatus === item._id}
                                                    onClick={() => handleStatusToggle(item)}
                                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition disabled:cursor-not-allowed disabled:opacity-50 ${item.status === 'active'
                                                        ? 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                                        : 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                                        }`}
                                                >
                                                    {updatingStatus === item._id
                                                        ? 'Updating...'
                                                        : item.status || 'inactive'}
                                                </button>
                                            ) : (
                                                <span
                                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${item.status === 'active'
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-red-50 text-red-700'
                                                        }`}
                                                >
                                                    {item.status || 'inactive'}
                                                </span>
                                            )}
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">

                                                <button
                                                    type="button"
                                                    onClick={() => handleView(item)}
                                                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                                >
                                                    <LuEye />

                                                </button>

                                                {hasPermission('products_edit') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdate(item._id)}
                                                        className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                                                    >
                                                        <LuSquarePen />
                                                    </button>
                                                )}

                                                {hasPermission('products_delete') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item._id)}
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
            </div>
        </div>
    )
}

export default ProductContent
