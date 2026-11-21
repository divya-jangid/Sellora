
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API from '../api/axiosInstance';
import { toast } from 'react-hot-toast'
import {
    LuEye,
    LuSquarePen,
    LuTrash2
} from "react-icons/lu";

function StoreInventory() {
    const navigate = useNavigate()
    const { storeId } = useParams()
    const [inventory, setInventory] = useState([])
    const [inventoryStores, setInventoryStores] = useState([])

    const [stores, setStores] = useState([])
    const [products, setProducts] = useState([])
    const [variants, setVariants] = useState([])

    const selectedStoreId = storeId || ''
    const selectedStore = {
        store: stores.find((store) => store._id === selectedStoreId)
    }

    const [showForm, setShowForm] = useState(false)
    const [editId, setEditId] = useState(null)

    const [showView, setShowView] = useState(false)
    const [viewItem, setViewItem] = useState(null)

    // SEARCH, SORT AND PAGINATION
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [order, setOrder] = useState('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalInventory, setTotalInventory] = useState(0)

    const limit = 10

    // PERMISSIONS
    const [roleName, setRoleName] = useState('')
    const [permissions, setPermissions] = useState([])
    const [authLoading, setAuthLoading] = useState(true)
    const [accessDenied, setAccessDenied] = useState(false)

    const initialForm = {
        store: '',
        product: '',
        variant: '',
        quantity: '',
        reservedQuantity: '',
        reorderLevel: '',
        maxStockLevel: '',
    }

    const [form, setForm] = useState(initialForm)
    console.log(2212121212121212121)
    // PERMISSION CHECK
    const hasPermission = (permission) => {
        console.log("bypass")
        if (roleName === 'super admin') return true

        console.log("bypass")
        return permissions.includes(permission)

    }

    const canView = hasPermission('storeinventory_view')
    const canCreate = hasPermission('storeinventory_create')
    const canEdit = hasPermission('storeinventory_edit')


    // CHECK USER
    const checkUser = async () => {
        try {
            const res = await API.get(
                '/user/check-user',
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
                !userPermissions.includes('storeinventory_view')
            )

        } catch (error) {
            console.log(error.response?.data || error.message)
            setAccessDenied(true)

        } finally {
            setAuthLoading(false)
        }
    }

    // GET INVENTORY / STORES
    const getInventory = async () => {
        try {
            const res = await API.get(
                '/inventory/get-all',
                {
                    params: {
                        page: currentPage,
                        limit,
                        search,
                        sortBy,
                        order,
                        ...(selectedStoreId && {
                            storeId: selectedStoreId
                        })
                    },
                }
            )

            if (selectedStoreId) {
                setInventory(res.data.inventory || [])
                setTotalInventory(
                    res.data.pagination?.totalInventory || 0
                )
            } else {
                setInventoryStores(res.data.stores || [])
                setTotalInventory(
                    res.data.pagination?.totalStores || 0
                )
            }

            setTotalPages(
                res.data.pagination?.totalPages || 1
            )

        } catch (error) {
            console.log(error.response?.data || error.message)
            toast.error('Unable to fetch inventory.')
        }
    }

    // GET STORES
    const getStores = async () => {
        try {
            const res = await API.get(
                '/store/get-all',
            )

            setStores(res.data.data || [])

        } catch (error) {
            console.log(error.response?.data || error.message)
        }
    }

    // GET PRODUCTS

    // GET PRODUCTS
    const getProducts = async () => {
        try {
            const res = await API.get(
                '/product/get-all'
            )

            console.log('PRODUCT API RESPONSE:', res.data)

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
            console.log(
                'GET PRODUCTS ERROR:',
                error.response?.data || error.message
            )

            setProducts([])
            toast.error('Unable to fetch products.')
        }
    }



    // GET PRODUCT VARIANTS
    const getVariants = async () => {
        try {
            const res = await API.get(
                '/productvariant/get-all',
            )

            console.log('VARIANT API RESPONSE:', res.data)

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
            console.log(
                'GET VARIANTS ERROR:',
                error.response?.data || error.message
            )

            setVariants([])
        }
    }

    console.log('StoreInventory mounted')


    useEffect(() => {
        checkUser()
    }, [])

    // FETCH INVENTORY
    useEffect(() => {
        if (authLoading || accessDenied || !canView) return

        getInventory()

    }, [
        authLoading,
        accessDenied,
        canView,
        currentPage,
        search,
        sortBy,
        order,
        selectedStoreId
    ])

    // FETCH FORM DATA
    useEffect(() => {
        if (authLoading || accessDenied) return

        // Store name is needed even for users who only have view permission.
        getStores()

        if (canCreate || canEdit) {
            getProducts()
            getVariants()
        }

    }, [authLoading, accessDenied, canView, canCreate, canEdit])

    // FILTER VARIANTS
    const filteredVariants = variants.filter((variant) => {
        const variantProductId =
            variant.product?._id || variant.product

        return variantProductId?.toString() ===
            form.product?.toString()
    })

    // INPUT CHANGE
    const handleChange = (e) => {
        const { name, value } = e.target

        if (name === 'product') {
            setForm((prev) => ({
                ...prev,
                product: value,
                variant: ''
            }))
        } else {
            setForm((prev) => ({
                ...prev,
                [name]: value
            }))
        }
    }

    // SEARCH CHANGE
    const handleSearch = (e) => {
        setSearch(e.target.value)
        setCurrentPage(1)
    }

    // SORT CHANGE
    const handleSort = (e) => {
        const [field, direction] = e.target.value.split('_')

        setSortBy(field)
        setOrder(direction)
        setCurrentPage(1)
    }

    // OPEN STORE (kept for safe handling if the store-list branch is reused)
    const handleOpenStore = (storeItem) => {
        const id = storeItem?.store?._id
        if (id) navigate(`/inventory/store/${id}`)
    }

    // BACK TO STORES
    const handleBackToStores = () => {
        navigate('/inventory')
    }

    // ADD INVENTORY
    const handleAdd = () => {
        if (!hasPermission('storeinventory_create')) {
            toast.error('You do not have permission to create inventory.')
            return
        }

        setForm({
            ...initialForm,
            store: selectedStoreId
        })

        setEditId(null)
        setShowForm(true)
    }

    // CLOSE FORM
    const handleClose = () => {
        setShowForm(false)
        setEditId(null)
        setForm({ ...initialForm })
    }

    // SUBMIT FORM
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (editId && !hasPermission('storeinventory_edit')) {
            toast.error('You do not have permission to edit inventory.')
            return
        }

        if (!editId && !hasPermission('storeinventory_create')) {
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
            !Number.isFinite(quantity) ||
            !Number.isFinite(reservedQuantity) ||
            !Number.isFinite(reorderLevel) ||
            !Number.isFinite(maxStockLevel) ||
            quantity < 0 ||
            reservedQuantity < 0 ||
            reorderLevel < 0 ||
            maxStockLevel < 0
        ) {
            toast.error('Please enter valid non-negative quantities.')
            return
        }

        // STRICT VALIDATIONS
        // VALIDATION 1: RESERVED CANNOT EXCEED QUANTITY
        if (reservedQuantity > quantity) {
            toast.error('Reserved quantity cannot exceed total quantity.')
            return
        }

        // VALIDATION 2: QUANTITY CANNOT EXCEED MAX STOCK
        if (quantity > maxStockLevel) {
            toast.error('Quantity cannot exceed maximum stock level.')
            return
        }

        // VALIDATION 3: REORDER LEVEL CANNOT EXCEED MAX STOCK
        if (reorderLevel > maxStockLevel) {
            toast.error('Reorder level cannot exceed maximum stock level.')
            return
        }


        try {
            const data = {
                ...form,
                quantity,
                reservedQuantity,
                reorderLevel,
                maxStockLevel,
                variant: form.variant || null
            }

            if (editId) {
                await API.put(
                    `/inventory/update/${editId}`,
                    data,
                )
            } else {
                await API.post(
                    '/inventory/create',
                    data,
                )
            }

            toast.success(
                editId
                    ? 'Inventory updated successfully'
                    : 'Inventory added successfully'
            )

            handleClose()
            await getInventory()

        } catch (error) {
            console.log(error.response?.data || error.message)

            toast.error(
                error.response?.data?.message ||
                'Unable to save inventory.'
            )
        }
    }

    // EDIT INVENTORY
    const handleEdit = (item) => {
        if (!hasPermission('storeinventory_edit')) {
            toast.error('You do not have permission to edit inventory.')
            return
        }

        setEditId(item._id)

        setForm({
            store: item.store?._id || item.store || '',
            product: item.product?._id || item.product || '',
            variant: item.variant?._id || item.variant || '',
            quantity: item.quantity ?? '',
            reservedQuantity: item.reservedQuantity ?? '',
            reorderLevel: item.reorderLevel ?? '',
            maxStockLevel: item.maxStockLevel ?? '',
        })

        setShowForm(true)
    }

    // DELETE INVENTORY
    const handleDelete = async (id) => {
        if (!hasPermission('storeinventory_delete')) {
            toast.error('You do not have permission to delete inventory.')
            return
        }

        const confirmed = window.confirm(
            'Are you sure you want to delete this inventory?'
        )

        if (!confirmed) return

        try {
            await API.delete(
                `/inventory/delete/${id}`,
            )

            toast.success('Inventory deleted successfully')

            if (inventory.length === 1 && currentPage > 1) {
                setCurrentPage((prev) => prev - 1)
            } else {
                await getInventory()
            }

        } catch (error) {
            console.log(error.response?.data || error.message)

            toast.error(
                error.response?.data?.message ||
                'Unable to delete inventory.'
            )
        }
    }

    // VIEW INVENTORY
    const handleView = (item) => {
        setViewItem(item)
        setShowView(true)
    }

    // AUTH LOADING
    if (authLoading) {
        return (
            <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
                <p className="text-gray-600">Checking permissions...</p>
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
                        {selectedStore
                            ? `${selectedStore.store?.name || 'Store'} Inventory`
                            : 'Store Inventory'}
                    </h1>

                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {selectedStore
                            ? 'Manage products and stock in this store'
                            : 'Manage your store stock and inventory'}
                    </p>

                    {selectedStore && (
                        <button
                            type="button"
                            onClick={handleBackToStores}
                            className="mt-3 text-purple-600 hover:text-purple-800 font-medium text-sm"
                        >
                            ← Back to Stores
                        </button>
                    )}
                </div>

                {canCreate && selectedStoreId && (
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

            {/* SEARCH AND SORT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">

                <input
                    type="text"
                    placeholder={
                        selectedStore
                            ? 'Search product or variant...'
                            : 'Search store, product or variant...'
                    }
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


            {/* ADD / EDIT MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">

                    <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">

                        <div className="flex justify-between items-center mb-5 gap-3">

                            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                                {editId ? 'Edit Inventory' : 'Add Inventory'}
                            </h2>

                            <button
                                type="button"
                                onClick={handleClose}
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
                                    className="border border-gray-300 p-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                                    required
                                    disabled={!!selectedStore}
                                >
                                    <option value="">Select Store</option>

                                    {stores.map((store) => (
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
                                    className="border border-gray-300 p-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                                    required
                                >
                                    <option value="">Select Product</option>

                                    {products.map((product) => (
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
                                    className="border border-gray-300 p-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                                    required
                                    disabled={!form.product}
                                >
                                    <option value="">
                                        {!form.product
                                            ? 'First Select Product'
                                            : 'Select Variant'}
                                    </option>

                                    {filteredVariants.map((variant) => (
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
                                    className="border border-gray-300 p-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                                    min="0"
                                    required
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
                                    className="border border-gray-300 p-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                                    min="0"
                                    required
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
                                    className="border border-gray-300 p-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                                    min="1"
                                    required
                                />
                            </div>

                            {/* BUTTONS */}
                            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:col-span-2 justify-end mt-3">

                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="w-full sm:w-auto border border-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-100"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="w-full sm:w-auto bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700"
                                >
                                    {editId ? 'Update Inventory' : 'Add Inventory'}
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}


            {/* VIEW MODAL */}
            {showView && viewItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">

                    <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">

                        <div className="flex justify-between items-center mb-5 gap-3">

                            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                                Inventory Details
                            </h2>

                            <button
                                onClick={() => {
                                    setShowView(false)
                                    setViewItem(null)
                                }}
                                className="text-2xl text-gray-500 hover:text-black"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="space-y-4">

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                <div>
                                    <p className="text-gray-500 text-xs sm:text-sm">Store</p>
                                    <p className="font-semibold text-sm sm:text-base break-words">
                                        {viewItem.store?.name || '-'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-xs sm:text-sm">Product</p>
                                    <p className="font-semibold text-sm sm:text-base break-words">
                                        {viewItem.product?.name || '-'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-xs sm:text-sm">Variant</p>
                                    <p className="font-semibold text-sm sm:text-base break-words">
                                        {viewItem.variant?.name || '-'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-xs sm:text-sm">Quantity</p>
                                    <p className="font-semibold text-sm sm:text-base">
                                        {viewItem.quantity ?? 0}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-xs sm:text-sm">Reserved Quantity</p>
                                    <p className="font-semibold text-sm sm:text-base">
                                        {viewItem.reservedQuantity ?? 0}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-xs sm:text-sm">Available Quantity</p>
                                    <p className="font-semibold text-sm sm:text-base">
                                        {viewItem.availableQuantity ?? 0}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-xs sm:text-sm">Reorder Level</p>
                                    <p className="font-semibold text-sm sm:text-base">
                                        {viewItem.reorderLevel ?? 0}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-xs sm:text-sm">Maximum Stock Level</p>
                                    <p className="font-semibold text-sm sm:text-base">
                                        {viewItem.maxStockLevel ?? 0}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-xs sm:text-sm">Last Restocked</p>
                                    <p className="font-semibold text-sm sm:text-base">
                                        {viewItem.lastRestockedAt
                                            ? new Date(viewItem.lastRestockedAt).toLocaleDateString()
                                            : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => {
                                        setShowView(false)
                                        setViewItem(null)
                                    }}
                                    className="w-full sm:w-auto bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* INVENTORY TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                <div className="overflow-x-auto w-full">

                    <table className="w-full min-w-[950px] text-left">

                        <thead className="bg-purple-100">

                            {selectedStore ? (
                                <tr>
                                    <th className="p-3 text-sm font-semibold">S.No.</th>
                                    <th className="p-3 text-sm font-semibold">Product</th>
                                    <th className="p-3 text-sm font-semibold">Variant</th>
                                    <th className="p-3 text-sm font-semibold">Quantity</th>
                                    <th className="p-3 text-sm font-semibold">Reserved</th>
                                    <th className="p-3 text-sm font-semibold">Available</th>
                                    <th className="p-3 text-sm font-semibold">Reorder Level</th>
                                    <th className="p-3 text-sm font-semibold">Actions</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="p-3 text-sm font-semibold">S.No.</th>
                                    <th className="p-3 text-sm font-semibold">Store</th>
                                    <th className="p-3 text-sm font-semibold">Total Products</th>
                                    <th className="p-3 text-sm font-semibold">Total Quantity</th>
                                    <th className="p-3 text-sm font-semibold">Total Reserved</th>
                                    <th className="p-3 text-sm font-semibold">Total Available</th>
                                    <th className="p-3 text-sm font-semibold">Action</th>
                                </tr>
                            )}

                        </thead>

                        <tbody>

                            {/* STORE LIST */}
                            {!selectedStore && (
                                <>
                                    {inventoryStores.map((item, index) => (
                                        <tr
                                            key={item.store._id}
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
                                                {item.productCount}
                                            </td>

                                            <td className="p-3 text-sm">
                                                {item.totalQuantity}
                                            </td>

                                            <td className="p-3 text-sm">
                                                {item.totalReserved}
                                            </td>

                                            <td className="p-3 text-sm">
                                                {item.totalAvailable}
                                            </td>

                                            <td className="p-3 text-sm text-purple-600 font-medium">
                                                View Products →
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            )}

                            {/* SELECTED STORE PRODUCTS */}
                            {selectedStore && (
                                <>
                                    {inventory.map((item, index) => (
                                        <tr
                                            key={item._id}
                                            className="border-t hover:bg-gray-50 transition"
                                        >
                                            <td className="p-3 text-sm">
                                                {(currentPage - 1) * limit + index + 1}
                                            </td>

                                            <td className="p-3 text-sm">
                                                {item.product?.name || '-'}
                                            </td>

                                            <td className="p-3 text-sm">
                                                {item.variant?.name || '-'}
                                            </td>

                                            <td className="p-3 text-sm">
                                                {item.quantity}
                                            </td>

                                            <td className="p-3 text-sm">
                                                {item.reservedQuantity}
                                            </td>

                                            <td className="p-3 text-sm">
                                                {item.availableQuantity}
                                            </td>

                                            <td className="p-3 text-sm">
                                                {item.reorderLevel}
                                            </td>

                                            <td className="p-3">
                                                <div className="flex gap-2">

                                                    <button
                                                        onClick={() => handleView(item)}
                                                        title="View"
                                                        className="bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600 transition"
                                                    >
                                                        <LuEye size={16} />
                                                    </button>

                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            title="Edit"
                                                            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition"
                                                        >
                                                            <LuSquarePen size={16} />
                                                        </button>
                                                    )}

                                                    {hasPermission('storeinventory_delete') && (
                                                        <button
                                                            onClick={() => handleDelete(item._id)}
                                                            title="Delete"
                                                            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                                                        >
                                                            <LuTrash2 size={16} />
                                                        </button>
                                                    )}

                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            )}

                            {/* EMPTY STATE */}
                            {(
                                selectedStore
                                    ? inventory.length === 0
                                    : inventoryStores.length === 0
                            ) && (
                                    <tr>
                                        <td
                                            colSpan={selectedStore ? 8 : 7}
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
                    {selectedStore
                        ? 'Total Inventory Products:'
                        : 'Total Stores:'}

                    {' '}

                    <span className="font-semibold text-gray-800">
                        {totalInventory}
                    </span>
                </p>

                <div className="flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">

                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="border px-3 sm:px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                        Previous
                    </button>

                    <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        disabled={currentPage >= totalPages}
                        className="border px-3 sm:px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                        Next
                    </button>

                </div>
            </div>

        </div>
    )
}

export default StoreInventory
