
import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

function Inventory() {
    const navigate = useNavigate()

    // INVENTORY LIST
    const [inventoryStores, setInventoryStores] = useState([])
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [order, setOrder] = useState('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalStores, setTotalStores] = useState(0)

    // PERMISSIONS
    const [roleName, setRoleName] = useState('')
    const [permissions, setPermissions] = useState([])
    const [authLoading, setAuthLoading] = useState(true)
    const [accessDenied, setAccessDenied] = useState(false)

    // FORM DATA
    const [stores, setStores] = useState([])
    const [products, setProducts] = useState([])
    const [variants, setVariants] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)

    const initialForm = {
        store: '',
        product: '',
        variant: '',
        quantity: '',
        reservedQuantity: '',
        reorderLevel: '',
        maxStockLevel: ''
    }

    const [form, setForm] = useState(initialForm)

    const limit = 10

    // PERMISSION CHECK
    const hasPermission = (permission) => {
        if (roleName === 'super admin') return true
        return permissions.includes(permission)
    }

    const canView = hasPermission('storeinventory_view')
    const canCreate = hasPermission('storeinventory_create')

    // CHECK USER
    const checkUser = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/user/check-user',
                { withCredentials: true }
            )

            const user = res.data.user

            const userRole = (
                user?.roleName || user?.role?.name || ''
            ).toLowerCase().trim()

            const userPermissions =
                user?.permissions || user?.role?.permissions || []

            setRoleName(userRole)
            setPermissions(userPermissions)

            setAccessDenied(
                userRole !== 'super admin' &&
                !userPermissions.includes('storeinventory_view')
            )

        } catch (error) {
            console.log(error.response?.data || error.message)
            setAccessDenied(true)
        } finally {
            setAuthLoading(false)
        }
    }

    // GET INVENTORY STORES
    const getStoresInventory = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/inventory/get-all',
                {
                    params: {
                        page: currentPage,
                        limit,
                        search,
                        sortBy,
                        order
                    },
                    withCredentials: true
                }
            )

            setInventoryStores(res.data.stores || [])
            setTotalStores(res.data.pagination?.totalStores || 0)
            setTotalPages(res.data.pagination?.totalPages || 1)

        } catch (error) {
            console.log(error.response?.data || error.message)
            toast.error('Unable to fetch inventory.')
        }
    }

    // GET ALL STORES
    const getStores = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/store/get-all',
                { withCredentials: true }
            )

            setStores(res.data.data || [])

        } catch (error) {
            console.log(error.response?.data || error.message)
            toast.error('Unable to fetch stores.')
        }
    }

    // GET ALL PRODUCTS
    const getProducts = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/product/get-all',
                { withCredentials: true }
            )

            const possibleProducts = [
                res.data?.data,
                res.data?.data?.products,
                res.data?.products,
                res.data?.data?.data
            ]

            const productList = possibleProducts.find(
                item => Array.isArray(item)
            ) || []

            setProducts(productList)

        } catch (error) {
            console.log(error.response?.data || error.message)
            setProducts([])
            toast.error('Unable to fetch products.')
        }
    }

    // GET ALL VARIANTS
    const getVariants = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/productvariant/get-all',
                { withCredentials: true }
            )

            const possibleVariants = [
                res.data?.data,
                res.data?.data?.variants,
                res.data?.variants,
                res.data?.data?.data
            ]

            const variantList = possibleVariants.find(
                item => Array.isArray(item)
            ) || []

            setVariants(variantList)

        } catch (error) {
            console.log(error.response?.data || error.message)
            setVariants([])
            toast.error('Unable to fetch variants.')
        }
    }

    // INITIAL USER CHECK
    useEffect(() => {
        checkUser()
    }, [])

    // FETCH INVENTORY LIST
    useEffect(() => {
        if (authLoading || accessDenied || !canView) return

        getStoresInventory()
    }, [
        authLoading,
        accessDenied,
        canView,
        currentPage,
        search,
        sortBy,
        order
    ])

    // FETCH FORM DATA
    useEffect(() => {
        if (authLoading || accessDenied || !canCreate) return

        getStores()
        getProducts()
        getVariants()
    }, [authLoading, accessDenied, canCreate])

    // FILTER VARIANTS ACCORDING TO SELECTED PRODUCT
    const filteredVariants = variants.filter((variant) => {
        const variantProductId =
            variant.product?._id || variant.product

        return variantProductId?.toString() ===
            form.product?.toString()
    })

    // OPEN ADD FORM
    const handleAdd = () => {
        if (!canCreate) {
            toast.error('You do not have permission to create inventory.')
            return
        }

        setForm({ ...initialForm })
        setShowForm(true)
    }

    // CLOSE FORM
    const handleClose = () => {
        setShowForm(false)
        setForm({ ...initialForm })
    }

    // HANDLE INPUT CHANGE
    const handleChange = (e) => {
        const { name, value } = e.target

        if (name === 'product') {
            setForm(prev => ({
                ...prev,
                product: value,
                variant: ''
            }))
        } else {
            setForm(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    // SUBMIT INVENTORY
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!canCreate) {
            toast.error('You do not have permission to create inventory.')
            return
        }

        if (
            !form.store ||
            !form.product ||
            !form.variant ||
            form.quantity === '' ||
            form.reservedQuantity === '' ||
            form.reorderLevel === '' ||
            form.maxStockLevel === ''
        ) {
            toast.error('Please fill all required fields.')
            return
        }

        const quantity = Number(form.quantity)
        const reservedQuantity = Number(form.reservedQuantity)
        const reorderLevel = Number(form.reorderLevel)
        const maxStockLevel = Number(form.maxStockLevel)

        if (
            ![
                quantity,
                reservedQuantity,
                reorderLevel,
                maxStockLevel
            ].every(Number.isFinite) ||
            [
                quantity,
                reservedQuantity,
                reorderLevel,
                maxStockLevel
            ].some(value => value < 0)
        ) {
            toast.error('Please enter valid non-negative quantities.')
            return
        }

        if (reservedQuantity > quantity) {
            toast.error('Reserved quantity cannot exceed total quantity.')
            return
        }

        if (quantity > maxStockLevel) {
            toast.error('Quantity cannot exceed maximum stock level.')
            return
        }

        if (reorderLevel > maxStockLevel) {
            toast.error('Reorder level cannot exceed maximum stock level.')
            return
        }

        try {
            setSaving(true)

            const data = {
                ...form,
                quantity,
                reservedQuantity,
                reorderLevel,
                maxStockLevel
            }

            await axios.post(
                'http://localhost:8000/inventory/create',
                data,
                { withCredentials: true }
            )

            toast.success('Inventory added successfully')

            handleClose()

            // REFRESH INVENTORY LIST
            if (currentPage !== 1) {
                setCurrentPage(1)
            } else {
                await getStoresInventory()
            }

        } catch (error) {
            console.log(error.response?.data || error.message)

            toast.error(
                error.response?.data?.message ||
                'Unable to add inventory.'
            )
        } finally {
            setSaving(false)
        }
    }

    // SEARCH
    const handleSearch = (e) => {
        setSearch(e.target.value)
        setCurrentPage(1)
    }

    // SORT
    const handleSort = (e) => {
        const [field, direction] = e.target.value.split('_')

        setSortBy(field)
        setOrder(direction)
        setCurrentPage(1)
    }

    // OPEN STORE PRODUCTS
    const handleOpenStore = (item) => {
        if (!item.store?._id) {
            toast.error('Store details not found.')
            return
        }

        navigate(`/inventory/store/${item.store._id}`)
    }

    // AUTH LOADING
    if (authLoading) {
        return (
            <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
                <p className="text-gray-600">
                    Checking permissions...
                </p>
            </div>
        )
    }

    // ACCESS DENIED
    if (accessDenied) {
        return (
            <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
                <div className="bg-white border border-red-200 rounded-xl p-5 sm:p-8 text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-red-600">
                        Access Denied
                    </h2>

                    <p className="text-gray-600 mt-2 text-sm sm:text-base">
                        You do not have permission to view Store Inventory.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-gray-50 min-h-screen p-3 sm:p-4 md:p-6">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5 sm:mb-6">

                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                        Store Inventory
                    </h1>

                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Manage your store stock and inventory
                    </p>
                </div>

                {canCreate && (
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="w-full sm:w-auto bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                        + Add Inventory
                    </button>
                )}
            </div>

            {/* SEARCH AND SORT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">

                <input
                    type="text"
                    placeholder="Search store, product or variant..."
                    value={search}
                    onChange={handleSearch}
                    className="border border-gray-300 bg-white p-3 rounded-lg w-full min-w-0 outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                />

                <select
                    value={`${sortBy}_${order}`}
                    onChange={handleSort}
                    className="border border-gray-300 bg-white p-3 rounded-lg w-full min-w-0 outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                >
                    <option value="createdAt_desc">Newest First</option>
                    <option value="createdAt_asc">Oldest First</option>
                    <option value="quantity_desc">Quantity (High to Low)</option>
                    <option value="quantity_asc">Quantity (Low to High)</option>
                    <option value="availableQuantity_desc">Available Quantity (High to Low)</option>
                    <option value="availableQuantity_asc">Available Quantity (Low to High)</option>
                    <option value="reservedQuantity_desc">Reserved Quantity (High to Low)</option>
                    <option value="reservedQuantity_asc">Reserved Quantity (Low to High)</option>
                </select>
            </div>

            {/* INVENTORY TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                <div className="overflow-x-auto w-full">

                    <table className="w-full min-w-[850px] text-left">

                        <thead className="bg-purple-100">
                            <tr>
                                <th className="p-3 text-sm font-semibold">S.No.</th>
                                <th className="p-3 text-sm font-semibold">Store</th>
                                <th className="p-3 text-sm font-semibold">Total Products</th>
                                <th className="p-3 text-sm font-semibold">Total Quantity</th>
                                <th className="p-3 text-sm font-semibold">Total Reserved</th>
                                <th className="p-3 text-sm font-semibold">Total Available</th>
                                <th className="p-3 text-sm font-semibold">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {inventoryStores.map((item, index) => (
                                <tr
                                    key={item.store?._id || index}
                                    onClick={() => handleOpenStore(item)}
                                    className="border-t hover:bg-purple-50 cursor-pointer transition"
                                >
                                    <td className="p-3 text-sm">
                                        {(currentPage - 1) * limit + index + 1}
                                    </td>

                                    <td className="p-3 text-sm font-semibold text-purple-700">
                                        {item.store?.name || '-'}
                                    </td>

                                    <td className="p-3 text-sm">
                                        {item.productCount ?? 0}
                                    </td>

                                    <td className="p-3 text-sm">
                                        {item.totalQuantity ?? 0}
                                    </td>

                                    <td className="p-3 text-sm">
                                        {item.totalReserved ?? 0}
                                    </td>

                                    <td className="p-3 text-sm">
                                        {item.totalAvailable ?? 0}
                                    </td>

                                    <td className="p-3 text-sm text-purple-600 font-medium">
                                        View Products →
                                    </td>
                                </tr>
                            ))}

                            {inventoryStores.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="p-6 text-center text-gray-500 text-sm"
                                    >
                                        No inventory found
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>
                </div>
            </div>

            {/* PAGINATION */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-5">

                <p className="text-sm text-gray-600">
                    Total Stores:{' '}
                    <span className="font-semibold text-gray-800">
                        {totalStores}
                    </span>
                </p>

                <div className="flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">

                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="border px-3 sm:px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                        Previous
                    </button>

                    <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage >= totalPages}
                        className="border px-3 sm:px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                        Next
                    </button>

                </div>
            </div>

            {/* ADD INVENTORY MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">

                    <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">

                        <div className="flex justify-between items-center mb-5 gap-3">

                            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                                Add Inventory
                            </h2>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={saving}
                                className="text-2xl text-gray-500 hover:text-black"
                            >
                                &times;
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
                        >

                            {/* STORE */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Store <span className="text-red-500">*</span>
                                </label>

                                <select
                                    name="store"
                                    value={form.store}
                                    onChange={handleChange}
                                    required
                                    className="border border-gray-300 p-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                                >
                                    <option value="">Select Store</option>

                                    {stores.map(store => (
                                        <option key={store._id} value={store._id}>
                                            {store.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* PRODUCT */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Product <span className="text-red-500">*</span>
                                </label>

                                <select
                                    name="product"
                                    value={form.product}
                                    onChange={handleChange}
                                    required
                                    className="border border-gray-300 p-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                                >
                                    <option value="">Select Product</option>

                                    {products.map(product => (
                                        <option key={product._id} value={product._id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* VARIANT */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Product Variant <span className="text-red-500">*</span>
                                </label>

                                <select
                                    name="variant"
                                    value={form.variant}
                                    onChange={handleChange}
                                    required
                                    disabled={!form.product}
                                    className="border border-gray-300 p-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base disabled:bg-gray-100"
                                >
                                    <option value="">
                                        {!form.product
                                            ? 'First Select Product'
                                            : 'Select Variant'}
                                    </option>

                                    {filteredVariants.map(variant => (
                                        <option key={variant._id} value={variant._id}>
                                            {variant.name} - {variant.unitValue} {variant.unit}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* QUANTITY */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Total Quantity <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="number"
                                    name="quantity"
                                    placeholder="Enter total quantity"
                                    value={form.quantity}
                                    onChange={handleChange}
                                    min="0"
                                    required
                                    className="border border-gray-300 p-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                                />
                            </div>

                            {/* RESERVED QUANTITY */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reserved Quantity <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="number"
                                    name="reservedQuantity"
                                    placeholder="Enter reserved quantity"
                                    value={form.reservedQuantity}
                                    onChange={handleChange}
                                    min="0"
                                    required
                                    className="border border-gray-300 p-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                                />
                            </div>

                            {/* REORDER LEVEL */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reorder Level <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="number"
                                    name="reorderLevel"
                                    placeholder="Enter reorder level"
                                    value={form.reorderLevel}
                                    onChange={handleChange}
                                    min="0"
                                    required
                                    className="border border-gray-300 p-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                                />
                            </div>

                            {/* MAX STOCK LEVEL */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Maximum Stock Level <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="number"
                                    name="maxStockLevel"
                                    placeholder="Enter maximum stock level"
                                    value={form.maxStockLevel}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                    className="border border-gray-300 p-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                                />
                            </div>

                            {/* FORM BUTTONS */}
                            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:col-span-2 justify-end mt-3">

                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={saving}
                                    className="w-full sm:w-auto border border-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full sm:w-auto bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Add Inventory'}
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}

export default Inventory
