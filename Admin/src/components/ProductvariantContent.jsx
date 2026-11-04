import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
    LuEye,
    LuSquarePen,
    LuTrash2
} from "react-icons/lu";

const ProductvariantContent = () => {
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
                { withCredentials: true }
            )

            setProductvariant(
                Array.isArray(res.data.data) ? res.data.data : []
            )

        } catch (err) {
            console.log('GET VARIANTS ERROR:', err.response?.data || err.message)
        }
    }

    // ADD VARIANT
    const handleAdd = async () => {
        if (!hasPermission('productvariant_create')) {
            alert('You do not have permission to create product variants.')
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
            alert('You do not have permission to edit product variants.')
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
            alert('You do not have permission to change variant status.')
            return
        }

        const newStatus =
            item.status === 'active' ? 'inactive' : 'active'

        try {
            setUpdatingStatus(item._id)

            const res = await axios.put(
                `http://localhost:8000/productvariant/update/${item._id}`,
                { status: newStatus },
                { withCredentials: true }
            )

            if (!res.data.status) {
                throw new Error(res.data.message || 'Status update failed')
            }

            await getProductvariant()

            if (viewVariant?._id === item._id) {
                setViewVariant((prev) => ({
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
                'Unable to update status.'
            )
        } finally {
            setUpdatingStatus('')
        }
    }

    // DELETE VARIANT
    const handleDelete = async (id) => {
        if (!hasPermission('productvariant_delete')) {
            alert('You do not have permission to delete product variants.')
            return
        }


        try {
            await axios.delete(
                `http://localhost:8000/productvariant/delete/${id}`,
                { withCredentials: true }
            )

            await getProductvariant()

        } catch (err) {
            console.log('DELETE ERROR:', err.response?.data || err.message)
            alert(err.response?.data?.message || 'Unable to delete variant.')
        }
    }

    // INITIAL AUTH CHECK
    useEffect(() => {
        checkUser()
    }, [])

    // FETCH DATA
    useEffect(() => {
        if (authLoading || accessDenied) return

        if (hasPermission('productvariant_view')) {
            getProductvariant()
        }

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
            alert('You do not have permission to edit product variants.')
            return
        }

        if (!editId && !hasPermission('productvariant_create')) {
            alert('You do not have permission to create product variants.')
            return
        }

        if (!form.product) {
            alert('Please select a product.')
            return
        }

        const selectedProduct = product.find(
            (item) => String(item._id) === String(form.product)
        )

        if (!selectedProduct) {
            alert('Selected product not found. Please select the product again.')
            return
        }

        if (!editId && !imageFile) {
            alert('Please select a product image.')
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
                alert('Variant saved with a different product ID. Please check backend.')
                return
            }

            await getProductvariant()
            handleClose()

        } catch (err) {
            console.log('SAVE VARIANT ERROR:', err.response?.data || err.message)

            alert(
                err.response?.data?.message ||
                err.message ||
                'Something went wrong.'
            )
        } finally {
            setLoading(false)
        }
    }

    // LOADING
    if (authLoading) {
        return (
            <div className="p-6 min-h-screen bg-slate-50">
                <p className="text-slate-600">Checking permissions...</p>
            </div>
        )
    }

    // ACCESS DENIED
    if (accessDenied) {
        return (
            <div className="p-6 min-h-screen bg-slate-50">
                <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
                    <h2 className="text-2xl font-semibold text-red-600">
                        Access Denied
                    </h2>
                    <p className="text-slate-600 mt-2">
                        You do not have permission to view product variants.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 bg-slate-50 min-h-screen">

            {/* ADD BUTTON */}
            {hasPermission('productvariant_create') && (
                <div className="flex justify-end w-full mb-4">
                    <button
                        onClick={handleAdd}
                        className="bg-indigo-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
                    >
                        + Add Variant
                    </button>
                </div>
            )}

            {/* ADD / EDIT MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-slate-800">
                                {editId ? 'Update Product Variant' : 'Add Product Variant'}
                            </h2>

                            <button
                                type="button"
                                onClick={handleClose}
                                className="text-2xl text-slate-400 hover:text-red-500"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="mb-5">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Product *
                                </label>

                                <select
                                    name="product"
                                    value={form.product}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3"
                                >
                                    <option value="">Select Product</option>

                                    {product.map((item) => (
                                        <option key={item._id} value={item._id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-5">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Variant Name *
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter variant name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3"
                                />
                            </div>

                            <div className="mb-5">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    SKU *
                                </label>

                                <input
                                    type="text"
                                    name="sku"
                                    placeholder="Enter SKU"
                                    value={form.sku}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3"
                                />
                            </div>

                            <div className="mb-5">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Barcode
                                </label>

                                <input
                                    type="text"
                                    name="barcode"
                                    placeholder="Enter barcode"
                                    value={form.barcode}
                                    onChange={handleChange}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                                        className="w-full border border-slate-300 rounded-lg px-4 py-3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Unit *
                                    </label>

                                    <select
                                        name="unit"
                                        value={form.unit}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-slate-300 rounded-lg px-4 py-3"
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                                        className="w-full border border-slate-300 rounded-lg px-4 py-3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Selling Price *
                                    </label>

                                    <input
                                        type="number"
                                        name="sellingPrice"
                                        value={form.sellingPrice}
                                        readOnly
                                        placeholder="Auto calculated"
                                        className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-slate-100 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="mb-5">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
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
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3"
                                />
                            </div>

                            {/* FEATURED VARIANT CHECKBOX */}
                            <div className="mb-5 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                                <label className="flex items-center gap-3 cursor-pointer">
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

                                        <p className="text-xs text-slate-500 mt-1">
                                            Show this variant in Featured Products section.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="mb-5">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
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
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3"
                                />
                            </div>

                            <div className="mb-5">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Dimensions
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <input
                                        type="number"
                                        name="length"
                                        min="0"
                                        step="any"
                                        placeholder="Length"
                                        value={form.dimensions.length}
                                        onChange={handleDimensionChange}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-3"
                                    />

                                    <input
                                        type="number"
                                        name="width"
                                        min="0"
                                        step="any"
                                        placeholder="Width"
                                        value={form.dimensions.width}
                                        onChange={handleDimensionChange}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-3"
                                    />

                                    <input
                                        type="number"
                                        name="height"
                                        min="0"
                                        step="any"
                                        placeholder="Height"
                                        value={form.dimensions.height}
                                        onChange={handleDimensionChange}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-3"
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Product Image *
                                </label>

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    required={!editId && !form.images}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3"
                                />

                                {imagePreview && (
                                    <div className="mt-4">
                                        <img
                                            src={imagePreview}
                                            alt="Product preview"
                                            className="w-24 h-24 rounded-lg object-cover border"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">

                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-semibold text-slate-800">
                                Product Variant Details
                            </h2>

                            <button
                                onClick={() => {
                                    setShowView(false)
                                    setViewVariant(null)
                                }}
                                className="text-2xl text-slate-400 hover:text-red-500"
                            >
                                ×
                            </button>
                        </div>

                        {getImageUrl(viewVariant.images) && (
                            <img
                                src={getImageUrl(viewVariant.images)}
                                alt={viewVariant.name}
                                className="w-28 h-28 object-cover rounded-lg border mb-5"
                            />
                        )}

                        <div className="space-y-3 text-sm text-slate-700">
                            <p>
                                <strong>Product:</strong>{' '}
                                {viewVariant.product?.name || 'N/A'}
                            </p>

                            <p>
                                <strong>Variant Name:</strong> {viewVariant.name}
                            </p>

                            <p>
                                <strong>SKU:</strong> {viewVariant.sku}
                            </p>

                            <p>
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
                                <span className={
                                    viewVariant.isFeatured
                                        ? 'text-green-600'
                                        : 'text-slate-500'
                                }>
                                    {viewVariant.isFeatured ? 'Yes' : 'No'}
                                </span>
                            </p>

                            <p>
                                <strong>Weight:</strong> {viewVariant.weight ?? '-'}
                            </p>

                            <p>
                                <strong>Dimensions:</strong>{' '}
                                L: {viewVariant.dimensions?.length ?? '-'} ×
                                W: {viewVariant.dimensions?.width ?? '-'} ×
                                H: {viewVariant.dimensions?.height ?? '-'}
                            </p>

                            <p>
                                <strong>Status:</strong>{' '}
                                <span className={
                                    viewVariant.status === 'active'
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }>
                                    {viewVariant.status || 'N/A'}
                                </span>
                            </p>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => {
                                    setShowView(false)
                                    setViewVariant(null)
                                }}
                                className="px-5 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCT VARIANTS TABLE */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mt-6">

                <div className="px-6 py-5 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800">
                        Product Variants
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                        Manage all product variants
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">

                        <thead className="bg-slate-100">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Product</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Variant Name</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">SKU</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Unit</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">MRP</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Selling Price</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Discount</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Featured</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Weight</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Image</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {productvariant.length > 0 ? (
                                productvariant.map((item) => {
                                    const imageUrl = getImageUrl(item.images)

                                    return (
                                        <tr
                                            key={item._id}
                                            className="border-t border-slate-200 hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-slate-800">
                                                    {item.product?.name || 'N/A'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {item.name}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-sm">
                                                    {item.sku}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {item.unitValue} {item.unit}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                ₹{item.mrp}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-green-600">
                                                    ₹{item.sellingPrice}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                                                    {item.discountPercentage || 0}%
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.isFeatured
                                                    ? 'bg-indigo-100 text-indigo-700'
                                                    : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {item.isFeatured ? 'Yes' : 'No'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {item.weight ?? '-'}
                                            </td>

                                            <td className="px-6 py-4">
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={item.name}
                                                        className="w-12 h-12 rounded-lg object-cover border"
                                                    />
                                                ) : (
                                                    <span className="text-slate-400 text-sm">
                                                        No Image
                                                    </span>
                                                )}
                                            </td>

                                            {/* STATUS */}
                                            <td className="px-6 py-4">
                                                {hasPermission('productvariant_edit') ? (
                                                    <button
                                                        onClick={() => handleStatusToggle(item)}
                                                        disabled={updatingStatus === item._id}
                                                        className={`px-3 py-1 rounded-full text-xs font-medium disabled:opacity-60 ${item.status === 'active'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                            }`}
                                                    >
                                                        {updatingStatus === item._id
                                                            ? 'Updating...'
                                                            : item.status === 'active'
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                    </button>
                                                ) : (
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'active'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                            }`}
                                                    >
                                                        {item.status || 'N/A'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* ACTIONS */}
                                            <td className="px-6 py-4 whitespace-nowrap">

                                                <button
                                                    onClick={() => handleView(item)}
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium text-sm mr-4"
                                                >
                                                    <LuEye />
                                                </button>

                                                {hasPermission('productvariant_edit') && (
                                                    <button
                                                        onClick={() => handleEdit(item._id)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-4"
                                                    >
                                                        <LuSquarePen />
                                                    </button>
                                                )}

                                                {hasPermission('productvariant_delete') && (
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                                                    >
                                                        <LuTrash2 />
                                                    </button>
                                                )}

                                                {!hasPermission('productvariant_edit') &&
                                                    !hasPermission('productvariant_delete') && (
                                                        <span className="text-slate-400 text-sm">
                                                            View only
                                                        </span>
                                                    )}
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan="12"
                                        className="text-center px-6 py-10 text-slate-500"
                                    >
                                        No product variants found.
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

export default ProductvariantContent