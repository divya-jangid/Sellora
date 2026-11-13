import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
    LuEye,
    LuSquarePen,
    LuTrash2
} from "react-icons/lu";

const Productvariant = () => {
    const [showForm, setShowForm] = useState(false)
    const [showView, setShowView] = useState(false)
    const [viewVariant, setViewVariant] = useState(null)

    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState('')

    const [roleName, setRoleName] = useState('')
    const [permissions, setPermissions] = useState([])
    const [authLoading, setAuthLoading] = useState(true)
    const [accessDenied, setAccessDenied] = useState(false)

    const [product, setProduct] = useState([])
    const [productvariant, setProductvariant] = useState([])

    const [editId, setEditId] = useState('')
    const [loading, setLoading] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState('')

    // SEARCH, SORT AND PAGINATION
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [order, setOrder] = useState('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const [limit] = useState(10)

    const [pagination, setPagination] = useState({
        totalVariants: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false
    })

    const initialForm = {
        product: '',
        name: '',
        sku: '',
        barcode: '',
        unitValue: '',
        unit: '',
        mrp: '',
        sellingPrice: '',
        discountPercentage: '',
        weight: '',
        dimensions: {
            length: '',
            width: '',
            height: ''
        },
        images: '',
        isFeatured: false
    }

    const [form, setForm] = useState(initialForm)

    const hasPermission = (permission) => {
        if (roleName === 'super admin') return true
        return permissions.includes(permission)
    }

    // CHECK USER PERMISSIONS
    const checkUser = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/user/check-user',
                { withCredentials: true }
            )

            const user = res.data.user

            const userRole = (
                user?.roleName ||
                user?.role?.name ||
                ''
            ).toLowerCase().trim()

            const userPermissions =
                user?.permissions ||
                user?.role?.permissions ||
                []

            setRoleName(userRole)
            setPermissions(userPermissions)

            setAccessDenied(
                userRole !== 'super admin' &&
                !userPermissions.includes('productvariant_view')
            )

        } catch (err) {
            console.log('USER ERROR:', err.response?.data || err.message)
            setAccessDenied(true)
        } finally {
            setAuthLoading(false)
        }
    }

    // GET IMAGE URL
    const getImageUrl = (images) => {
        if (Array.isArray(images)) return images[0] || ''
        return images || ''
    }

    // GET PRODUCTS
    const getProducts = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/product/get-all',
                { withCredentials: true }
            )

            const products = Array.isArray(res.data.data)
                ? res.data.data
                : []

            setProduct(products)

        } catch (err) {
            console.log('GET PRODUCTS ERROR:', err.response?.data || err.message)
        }
    }

    // GET PRODUCT VARIANTS
    const getProductvariant = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/productvariant/get-all',
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

            setProductvariant(
                Array.isArray(res.data.data) ? res.data.data : []
            )

            setPagination(
                res.data.pagination || {
                    totalVariants: 0,
                    totalPages: 0,
                    currentPage: 1,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            )

        } catch (err) {
            console.log('GET VARIANTS ERROR:', err.response?.data || err.message)
        }
    }

    // ADD VARIANT
    const handleAdd = async () => {
        if (!hasPermission('productvariant_create')) {
            toast.error('You do not have permission to create product variants.')
            return
        }

        await getProducts()

        setForm({ ...initialForm })
        setImageFile(null)
        setImagePreview('')
        setEditId('')
        setShowForm(true)
    }

    // EDIT VARIANT
    const handleEdit = (id) => {
        if (!hasPermission('productvariant_edit')) {
            toast.error('You do not have permission to edit product variants.')
            return
        }

        const selectedVariant = productvariant.find(
            (item) => item._id === id
        )

        if (!selectedVariant) return

        const imageUrl = getImageUrl(selectedVariant.images)

        setForm({
            product: selectedVariant.product?._id || selectedVariant.product || '',
            name: selectedVariant.name || '',
            sku: selectedVariant.sku || '',
            barcode: selectedVariant.barcode || '',
            unitValue: selectedVariant.unitValue ?? '',
            unit: selectedVariant.unit || '',
            mrp: selectedVariant.mrp ?? '',
            sellingPrice: selectedVariant.sellingPrice ?? '',
            discountPercentage: selectedVariant.discountPercentage ?? '',
            weight: selectedVariant.weight ?? '',
            dimensions: {
                length: selectedVariant.dimensions?.length ?? '',
                width: selectedVariant.dimensions?.width ?? '',
                height: selectedVariant.dimensions?.height ?? ''
            },
            images: imageUrl,
            isFeatured: selectedVariant.isFeatured ?? false
        })

        setImageFile(null)
        setImagePreview(imageUrl)
        setEditId(id)
        setShowForm(true)
    }

    // VIEW VARIANT
    const handleView = (item) => {
        setViewVariant(item)
        setShowView(true)
    }

    // CHANGE STATUS
    const handleStatusToggle = async (item) => {
        if (!hasPermission('productvariant_edit')) {
            toast.error('You do not have permission to change variant status.')
            return
        }

        try {
            setUpdatingStatus(item._id)

            const res = await axios.put(
                `http://localhost:8000/productvariant/update-status/${item._id}`,
                {},
                { withCredentials: true }
            )

            if (!res.data.status) {
                throw new Error(res.data.message || 'Status update failed')
            }

            await getProductvariant()

            if (viewVariant?._id === item._id) {
                setViewVariant((prev) => ({
                    ...prev,
                    status: res.data.data.status
                }))
            }

            toast.success(res.data.message || 'Variant status updated successfully.')

        } catch (err) {
            console.log(
                'STATUS UPDATE ERROR:',
                err.response?.data || err.message
            )

            toast.error(
                err.response?.data?.message ||
                err.message ||
                'Unable to update status.'
            )
        } finally {
            setUpdatingStatus('')
        }
    }

    // DELETE VARIANT
    const handleDelete = async (id) => {
        if (!hasPermission('productvariant_delete')) {
            toast.error('You do not have permission to delete product variants.')
            return
        }

        try {
            const res = await axios.delete(
                `http://localhost:8000/productvariant/delete/${id}`,
                { withCredentials: true }
            )

            toast.success(res.data.message || 'Variant deleted successfully.')

            if (productvariant.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1)
            } else {
                await getProductvariant()
            }

        } catch (err) {
            console.log('DELETE ERROR:', err.response?.data || err.message)

            toast.error(
                err.response?.data?.message || 'Unable to delete variant.'
            )
        }
    }

    // INITIAL AUTH CHECK
    useEffect(() => {
        checkUser()
    }, [])

    // FETCH VARIANTS WHEN SEARCH, SORT OR PAGE CHANGES
    useEffect(() => {
        if (authLoading || accessDenied) return

        if (hasPermission('productvariant_view')) {
            getProductvariant()
        }
    }, [
        authLoading,
        accessDenied,
        roleName,
        permissions,
        currentPage,
        search,
        sortBy,
        order
    ])

    // FETCH PRODUCTS
    useEffect(() => {
        if (authLoading || accessDenied) return

        if (
            hasPermission('productvariant_create') ||
            hasPermission('productvariant_edit')
        ) {
            getProducts()
        }
    }, [authLoading, accessDenied, roleName, permissions])

    // IMAGE PREVIEW
    useEffect(() => {
        if (!imageFile) {
            setImagePreview(form.images || '')
            return
        }

        const objectUrl = URL.createObjectURL(imageFile)
        setImagePreview(objectUrl)

        return () => URL.revokeObjectURL(objectUrl)
    }, [imageFile, form.images])

    // FORM CHANGE
    const handleChange = (e) => {
        const { name, value } = e.target

        setForm((prev) => {
            const updatedForm = {
                ...prev,
                [name]: value
            }

            if (name === 'mrp' || name === 'discountPercentage') {
                const mrp = Number(updatedForm.mrp)
                const discount = Number(updatedForm.discountPercentage || 0)

                if (
                    updatedForm.mrp === '' ||
                    !Number.isFinite(mrp) ||
                    mrp < 0 ||
                    !Number.isFinite(discount) ||
                    discount < 0 ||
                    discount > 100
                ) {
                    updatedForm.sellingPrice = ''
                } else {
                    updatedForm.sellingPrice = (
                        mrp - (mrp * discount / 100)
                    ).toFixed(2)
                }
            }

            return updatedForm
        })
    }

    // DIMENSIONS CHANGE
    const handleDimensionChange = (e) => {
        const { name, value } = e.target

        setForm((prev) => ({
            ...prev,
            dimensions: {
                ...prev.dimensions,
                [name]: value
            }
        }))
    }

    // IMAGE CHANGE
    const handleImageChange = (e) => {
        setImageFile(e.target.files?.[0] || null)
    }

    // CLOSE FORM
    const handleClose = () => {
        setShowForm(false)
        setEditId('')
        setImageFile(null)
        setImagePreview('')
        setForm({ ...initialForm })
    }

    // SUBMIT FORM
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (editId && !hasPermission('productvariant_edit')) {
            toast.error('You do not have permission to edit product variants.')
            return
        }

        if (!editId && !hasPermission('productvariant_create')) {
            toast.error('You do not have permission to create product variants.')
            return
        }

        if (!form.product) {
            toast.error('Please select a product.')
            return
        }

        const selectedProduct = product.find(
            (item) => String(item._id) === String(form.product)
        )

        if (!selectedProduct) {
            toast.error('Selected product not found. Please select the product again.')
            return
        }

        if (!editId && !imageFile) {
            toast.error('Please select a product image.')
            return
        }

        setLoading(true)

        try {
            const formData = new FormData()

            formData.append('product', String(selectedProduct._id))
            formData.append('name', form.name.trim())
            formData.append('sku', form.sku.trim())
            formData.append('barcode', form.barcode || '')
            formData.append('unitValue', form.unitValue)
            formData.append('unit', form.unit)
            formData.append('mrp', form.mrp)
            formData.append('discountPercentage', form.discountPercentage || 0)
            formData.append('weight', form.weight || 0)
            formData.append('dimensions', JSON.stringify(form.dimensions))
            formData.append('isFeatured', String(form.isFeatured))

            if (imageFile) {
                formData.append('images', imageFile)
            }

            let res

            if (editId) {
                res = await axios.put(
                    `http://localhost:8000/productvariant/update/${editId}`,
                    formData,
                    { withCredentials: true }
                )
            } else {
                res = await axios.post(
                    'http://localhost:8000/productvariant/create',
                    formData,
                    { withCredentials: true }
                )
            }

            if (!res.data.status) {
                throw new Error(res.data.message || 'Variant could not be saved.')
            }

            const savedProductId =
                res.data.data?.product?._id ||
                res.data.data?.product

            if (
                savedProductId &&
                String(savedProductId) !== String(selectedProduct._id)
            ) {
                toast.error('Variant saved with a different product ID. Please check backend.')
                return
            }

            toast.success(
                editId
                    ? 'Variant updated successfully.'
                    : 'Variant created successfully.'
            )

            handleClose()

            if (!editId) {
                setCurrentPage(1)
            } else {
                await getProductvariant()
            }

        } catch (err) {
            console.log('SAVE VARIANT ERROR:', err.response?.data || err.message)

            toast.error(
                err.response?.data?.message ||
                err.message ||
                'Something went wrong.'
            )
        } finally {
            setLoading(false)
        }
    }

    // REUSABLE INPUT STYLE
    const inputClass =
        "w-full min-w-0 border border-slate-300 rounded-lg px-3 sm:px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"

    // LOADING
    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
                <p className="text-slate-600">Checking permissions...</p>
            </div>
        )
    }

    // ACCESS DENIED
    if (accessDenied) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
                <div className="rounded-xl border border-red-200 bg-white p-6 sm:p-8 text-center">
                    <h2 className="text-xl sm:text-2xl font-semibold text-red-600">
                        Access Denied
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-slate-600">
                        You do not have permission to view product variants.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-slate-50 min-h-screen p-3 sm:p-5 lg:p-6">

            {/* HEADER */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                        Product Variants
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        Manage all product variants
                    </p>
                </div>

                {hasPermission('productvariant_create') && (
                    <button
                        onClick={handleAdd}
                        className="w-full sm:w-auto rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
                    >
                        + Add Variant
                    </button>
                )}
            </div>

            {/* SEARCH AND SORT */}
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_230px]">
                <input
                    type="text"
                    placeholder="Search by product name..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setCurrentPage(1)
                    }}
                    className={inputClass}
                />

                <select
                    value={`${sortBy}_${order}`}
                    onChange={(e) => {
                        const [field, direction] = e.target.value.split('_')
                        setSortBy(field)
                        setOrder(direction)
                        setCurrentPage(1)
                    }}
                    className={inputClass}
                >
                    <option value="createdAt_desc">Newest First</option>
                    <option value="createdAt_asc">Oldest First</option>
                    <option value="sellingPrice_asc">Selling Price (Low to High)</option>
                    <option value="sellingPrice_desc">Selling Price (High to Low)</option>
                    <option value="price_asc">Price (Low to High)</option>
                    <option value="price_desc">Price (High to Low)</option>
                    <option value="stock_asc">Stock (Low to High)</option>
                    <option value="stock_desc">Stock (High to Low)</option>
                    <option value="status_asc">Status (Active to Inactive)</option>
                    <option value="status_desc">Status (Inactive to Active)</option>
                </select>
            </div>

            {/* ADD / EDIT MODAL */}
            {showForm && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-2 sm:p-4">
                    <div className="mx-auto my-2 w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:my-4 sm:p-6 max-h-[calc(100dvh-1rem)] sm:max-h-[92vh]">

                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg sm:text-2xl font-semibold text-slate-800">
                                    {editId ? 'Update Product Variant' : 'Add Product Variant'}
                                </h2>
                                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                    Fill in the product variant details
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                className="shrink-0 text-2xl text-slate-400 hover:text-red-500"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Product *
                                </label>
                                <select
                                    name="product"
                                    value={form.product}
                                    onChange={handleChange}
                                    required
                                    className={inputClass}
                                >
                                    <option value="">Select Product</option>
                                    {product.map((item) => (
                                        <option key={item._id} value={item._id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Variant Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter variant name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    className={inputClass}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    SKU *
                                </label>
                                <input
                                    type="text"
                                    name="sku"
                                    placeholder="Enter SKU"
                                    value={form.sku}
                                    onChange={handleChange}
                                    required
                                    className={inputClass}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Barcode
                                </label>
                                <input
                                    type="text"
                                    name="barcode"
                                    placeholder="Enter barcode"
                                    value={form.barcode}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>

                            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Unit Value *
                                    </label>
                                    <input
                                        type="number"
                                        name="unitValue"
                                        min="0"
                                        step="any"
                                        value={form.unitValue}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter unit value"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Unit *
                                    </label>
                                    <select
                                        name="unit"
                                        value={form.unit}
                                        onChange={handleChange}
                                        required
                                        className={inputClass}
                                    >
                                        <option value="">Select Unit</option>
                                        <option value="kg">Kg</option>
                                        <option value="g">Gram</option>
                                        <option value="l">Liter</option>
                                        <option value="ml">ML</option>
                                        <option value="piece">Piece</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        MRP *
                                    </label>
                                    <input
                                        type="number"
                                        name="mrp"
                                        min="0"
                                        step="any"
                                        value={form.mrp}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter MRP"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Selling Price *
                                    </label>
                                    <input
                                        type="number"
                                        name="sellingPrice"
                                        value={form.sellingPrice}
                                        readOnly
                                        placeholder="Auto calculated"
                                        className={`${inputClass} cursor-not-allowed bg-slate-100`}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Discount Percentage
                                </label>
                                <input
                                    type="number"
                                    name="discountPercentage"
                                    min="0"
                                    max="100"
                                    step="any"
                                    value={form.discountPercentage}
                                    onChange={handleChange}
                                    placeholder="Enter discount percentage"
                                    className={inputClass}
                                />
                            </div>

                            {/* FEATURED VARIANT */}
                            <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3 sm:p-4">
                                <label className="flex cursor-pointer items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="isFeatured"
                                        checked={form.isFeatured}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                isFeatured: e.target.checked
                                            }))
                                        }
                                        className="h-5 w-5 accent-indigo-600"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            Featured Variant
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Show this variant in Featured Products section.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Weight
                                </label>
                                <input
                                    type="number"
                                    name="weight"
                                    min="0"
                                    step="any"
                                    value={form.weight}
                                    onChange={handleChange}
                                    placeholder="Enter weight"
                                    className={inputClass}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Dimensions
                                </label>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <input
                                        type="number"
                                        name="length"
                                        min="0"
                                        step="any"
                                        placeholder="Length"
                                        value={form.dimensions.length}
                                        onChange={handleDimensionChange}
                                        className={inputClass}
                                    />
                                    <input
                                        type="number"
                                        name="width"
                                        min="0"
                                        step="any"
                                        placeholder="Width"
                                        value={form.dimensions.width}
                                        onChange={handleDimensionChange}
                                        className={inputClass}
                                    />
                                    <input
                                        type="number"
                                        name="height"
                                        min="0"
                                        step="any"
                                        placeholder="Height"
                                        value={form.dimensions.height}
                                        onChange={handleDimensionChange}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Product Image *
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    required={!editId && !form.images}
                                    className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-indigo-700`}
                                />

                                {imagePreview && (
                                    <div className="mt-3">
                                        <img
                                            src={imagePreview}
                                            alt="Product preview"
                                            className="h-24 w-24 rounded-lg border object-cover"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="w-full rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:w-auto"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 sm:w-auto"
                                >
                                    {loading
                                        ? 'Please wait...'
                                        : editId
                                            ? 'Update Variant'
                                            : 'Add Variant'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW MODAL */}
            {showView && viewVariant && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-2 sm:p-4">
                    <div className="mx-auto my-2 w-full max-w-lg rounded-xl bg-white p-4 shadow-xl sm:my-4 sm:p-6 max-h-[calc(100dvh-1rem)] overflow-y-auto">

                        <div className="mb-5 flex items-start justify-between gap-3">
                            <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                                Product Variant Details
                            </h2>

                            <button
                                onClick={() => {
                                    setShowView(false)
                                    setViewVariant(null)
                                }}
                                className="shrink-0 text-2xl text-slate-400 hover:text-red-500"
                            >
                                ×
                            </button>
                        </div>

                        {getImageUrl(viewVariant.images) && (
                            <img
                                src={getImageUrl(viewVariant.images)}
                                alt={viewVariant.name}
                                className="mb-5 h-24 w-24 rounded-lg border object-cover sm:h-28 sm:w-28"
                            />
                        )}

                        <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
                            <p className="break-words">
                                <strong>Product:</strong>{' '}
                                {viewVariant.product?.name || 'N/A'}
                            </p>

                            <p className="break-words">
                                <strong>Variant Name:</strong> {viewVariant.name}
                            </p>

                            <p className="break-words">
                                <strong>SKU:</strong> {viewVariant.sku}
                            </p>

                            <p className="break-words">
                                <strong>Barcode:</strong> {viewVariant.barcode || '-'}
                            </p>

                            <p>
                                <strong>Unit:</strong> {viewVariant.unitValue} {viewVariant.unit}
                            </p>

                            <p>
                                <strong>MRP:</strong> ₹{viewVariant.mrp}
                            </p>

                            <p>
                                <strong>Selling Price:</strong> ₹{viewVariant.sellingPrice}
                            </p>

                            <p>
                                <strong>Discount:</strong> {viewVariant.discountPercentage || 0}%
                            </p>

                            <p>
                                <strong>Featured:</strong>{' '}
                                <span className={viewVariant.isFeatured ? 'text-green-600' : 'text-slate-500'}>
                                    {viewVariant.isFeatured ? 'Yes' : 'No'}
                                </span>
                            </p>

                            <p>
                                <strong>Weight:</strong> {viewVariant.weight ?? '-'}
                            </p>

                            <p className="sm:col-span-2">
                                <strong>Dimensions:</strong>{' '}
                                L: {viewVariant.dimensions?.length ?? '-'} ×
                                W: {viewVariant.dimensions?.width ?? '-'} ×
                                H: {viewVariant.dimensions?.height ?? '-'}
                            </p>

                            <p>
                                <strong>Status:</strong>{' '}
                                <span className={viewVariant.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                                    {viewVariant.status || 'N/A'}
                                </span>
                            </p>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowView(false)
                                    setViewVariant(null)
                                }}
                                className="w-full rounded-lg bg-slate-200 px-5 py-2.5 text-sm font-medium hover:bg-slate-300 sm:w-auto"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCT VARIANTS TABLE */}
            <div className="mt-6 w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                        Product Variants
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        Total Variants: {pagination.totalVariants || 0}
                    </p>
                </div>

                {/* TABLE SCROLL ONLY INSIDE THIS AREA */}
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[1050px]">

                        <thead className="bg-slate-100">
                            <tr>
                                {[
                                    'Product',
                                    'Variant Name',
                                    'SKU',
                                    'Unit',
                                    'MRP',
                                    'Selling Price',
                                    'Discount',
                                    'Featured',
                                    'Weight',
                                    'Image',
                                    'Status',
                                    'Actions'
                                ].map((heading) => (
                                    <th
                                        key={heading}
                                        className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold text-slate-700 sm:px-5"
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {productvariant.length > 0 ? (
                                productvariant.map((item) => {
                                    const imageUrl = getImageUrl(item.images)
                                    const isActive = item.status === 'active'

                                    return (
                                        <tr
                                            key={item._id}
                                            className="border-t border-slate-200 hover:bg-slate-50"
                                        >
                                            <td className="max-w-[180px] px-4 py-4 text-sm font-medium text-slate-800 sm:px-5">
                                                <span className="block truncate">
                                                    {item.product?.name || 'N/A'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 text-sm text-slate-600 sm:px-5">
                                                {item.name}
                                            </td>

                                            <td className="px-4 py-4 sm:px-5">
                                                <span className="rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-700">
                                                    {item.sku}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 sm:px-5">
                                                {item.unitValue} {item.unit}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 sm:px-5">
                                                ₹{item.mrp}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-green-600 sm:px-5">
                                                ₹{item.sellingPrice}
                                            </td>

                                            <td className="px-4 py-4 sm:px-5">
                                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                                    {item.discountPercentage || 0}%
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 sm:px-5">
                                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                    item.isFeatured
                                                        ? 'bg-indigo-100 text-indigo-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {item.isFeatured ? 'Yes' : 'No'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 text-sm text-slate-600 sm:px-5">
                                                {item.weight ?? '-'}
                                            </td>

                                            <td className="px-4 py-4 sm:px-5">
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={item.name}
                                                        className="h-11 w-11 rounded-lg border object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        No Image
                                                    </span>
                                                )}
                                            </td>

                                            {/* STATUS TOGGLE */}
                                            <td className="px-4 py-4 sm:px-5">
                                                {hasPermission('productvariant_edit') ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStatusToggle(item)}
                                                        disabled={updatingStatus === item._id}
                                                        aria-label={`Change status of ${item.name}`}
                                                        title={isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                                                            isActive ? 'bg-green-500' : 'bg-slate-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                                                                isActive ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                        />
                                                    </button>
                                                ) : (
                                                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                        isActive
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {item.status || 'N/A'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* ACTIONS */}
                                            <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleView(item)}
                                                        title="View"
                                                        className="text-indigo-600 transition hover:text-indigo-800"
                                                    >
                                                        <LuEye size={18} />
                                                    </button>

                                                    {hasPermission('productvariant_edit') && (
                                                        <button
                                                            onClick={() => handleEdit(item._id)}
                                                            title="Edit"
                                                            className="text-blue-600 transition hover:text-blue-800"
                                                        >
                                                            <LuSquarePen size={18} />
                                                        </button>
                                                    )}

                                                    {hasPermission('productvariant_delete') && (
                                                        <button
                                                            onClick={() => handleDelete(item._id)}
                                                            title="Delete"
                                                            className="text-red-600 transition hover:text-red-800"
                                                        >
                                                            <LuTrash2 size={18} />
                                                        </button>
                                                    )}

                                                    {!hasPermission('productvariant_edit') &&
                                                        !hasPermission('productvariant_delete') && (
                                                            <span className="text-xs text-slate-400">
                                                                View only
                                                            </span>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan="12"
                                        className="px-6 py-10 text-center text-sm text-slate-500"
                                    >
                                        No product variants found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                    <p className="text-center text-xs text-slate-500 sm:text-left sm:text-sm">
                        Showing {productvariant.length > 0 ? (currentPage - 1) * limit + 1 : 0}
                        {' - '}
                        {(currentPage - 1) * limit + productvariant.length}
                        {' of '}
                        {pagination.totalVariants || 0} variants
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            disabled={!pagination.hasPrevPage}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
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
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Productvariant