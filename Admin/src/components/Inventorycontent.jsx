
import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  LuEye,
  LuSquarePen,
  LuTrash2
} from "react-icons/lu";

function Inventorycontent() {
    const [inventory, setInventory] = useState([])
    const [stores, setStores] = useState([])
    const [products, setProducts] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [editId, setEditId] = useState(null)

    const [showView, setShowView] = useState(false)
    const [viewItem, setViewItem] = useState(null)
    const [updatingStatus, setUpdatingStatus] = useState(null)

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
        status: 'active'
    }

    const [form, setForm] = useState(initialForm)

    const hasPermission = (permission) => {
        if (roleName === 'super admin') return true
        return permissions.includes(permission)
    }

    // CHECK USER
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
                !userPermissions.includes('storeinventory_view')
            )
        } catch (error) {
            console.log(error.response?.data || error.message)
            setAccessDenied(true)
        } finally {
            setAuthLoading(false)
        }
    }

    // GET INVENTORY
    const getInventory = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/inventory/get-all',
                { withCredentials: true }
            )

            setInventory(res.data.inventory || [])
        } catch (error) {
            console.log(error.response?.data || error.message)
        }
    }

    // GET STORES
    const getStores = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/store/get-all',
                { withCredentials: true }
            )

            setStores(res.data.data || [])
        } catch (error) {
            console.log(error.response?.data || error.message)
        }
    }

    // GET PRODUCTS
    const getProducts = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/product/get-all',
                { withCredentials: true }
            )

            setProducts(res.data.data || [])
        } catch (error) {
            console.log(error.response?.data || error.message)
        }
    }

    useEffect(() => {
        checkUser()
    }, [])

    useEffect(() => {
        if (authLoading || accessDenied) return

        getInventory()

        if (
            hasPermission('storeinventory_create') ||
            hasPermission('storeinventory_edit')
        ) {
            getStores()
            getProducts()
        }
    }, [authLoading, accessDenied, roleName, permissions])

    // INPUT CHANGE
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    // ADD INVENTORY
    const handleAdd = () => {
        setForm({ ...initialForm })
        setEditId(null)
        setShowForm(true)
    }

    // SUBMIT FORM
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (editId && !hasPermission('storeinventory_edit')) {
            toast.success('You do not have permission to edit inventory.')
            return
        }

        if (!editId && !hasPermission('storeinventory_create')) {
            toast.success('You do not have permission to create inventory.')
            return
        }

        try {
            const data = {
                ...form,
                quantity: Number(form.quantity),
                reservedQuantity: Number(form.reservedQuantity || 0),
                reorderLevel: Number(form.reorderLevel || 0),
                maxStockLevel: Number(form.maxStockLevel || 0),
                variant: form.variant || null
            }

            if (editId) {
                await axios.put(
                    `http://localhost:8000/inventory/update/${editId}`,
                    data,
                    { withCredentials: true }
                )
            } else {
                await axios.post(
                    'http://localhost:8000/inventory/create',
                    data,
                    { withCredentials: true }
                )
            }

            handleClose()
            await getInventory()

        } catch (error) {
            console.log(error.response?.data || error.message)

            toast.success(
                error.response?.data?.message ||
                'Unable to save inventory.'
            )
        }
    }

    // EDIT INVENTORY
    const handleEdit = (item) => {
        if (!hasPermission('storeinventory_edit')) return

        setEditId(item._id)

        setForm({
            store: item.store?._id || item.store || '',
            product: item.product?._id || item.product || '',
            variant: item.variant?._id || item.variant || '',
            quantity: item.quantity ?? '',
            reservedQuantity: item.reservedQuantity ?? '',
            reorderLevel: item.reorderLevel ?? '',
            maxStockLevel: item.maxStockLevel ?? '',
            status: item.status || 'active'
        })

        setShowForm(true)
    }

    // DELETE INVENTORY
    const handleDelete = async (id) => {
        if (!hasPermission('storeinventory_delete')) return

        const confirmDelete = window.confirm(
            'Are you sure you want to delete this inventory?'
        )

        if (!confirmDelete) return

        try {
            await axios.delete(
                `http://localhost:8000/inventory/delete/${id}`,
                { withCredentials: true }
            )

            await getInventory()
        } catch (error) {
            console.log(error.response?.data || error.message)

            toast.success(
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

    // TOGGLE STATUS
    const handleStatusToggle = async (item) => {
        if (!hasPermission('storeinventory_edit')) {
            toast.success('You do not have permission to update inventory status.')
            return
        }

        const newStatus =
            item.status === 'active' ? 'inactive' : 'active'

        try {
            setUpdatingStatus(item._id)

            await axios.put(
                `http://localhost:8000/inventory/update/${item._id}`,
                { status: newStatus },
                { withCredentials: true }
            )

            await getInventory()

            if (viewItem?._id === item._id) {
                setViewItem({
                    ...viewItem,
                    status: newStatus
                })
            }

        } catch (error) {
            console.log(error.response?.data || error.message)

            toast.success(
                error.response?.data?.message ||
                'Unable to update inventory status.'
            )
        } finally {
            setUpdatingStatus(null)
        }
    }

    // CLOSE FORM
    const handleClose = () => {
        setShowForm(false)
        setEditId(null)
        setForm({ ...initialForm })
    }

    if (authLoading) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <p className="text-gray-600">Checking permissions...</p>
            </div>
        )
    }

    if (accessDenied) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
                    <h2 className="text-2xl font-bold text-red-600">
                        Access Denied
                    </h2>

                    <p className="text-gray-600 mt-2">
                        You do not have permission to view Store Inventory.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    Store Inventory
                </h1>

                {hasPermission('storeinventory_create') && (
                    <button
                        onClick={handleAdd}
                        className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700"
                    >
                        + Add Inventory
                    </button>
                )}
            </div>

            {/* ADD / EDIT MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">

                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-bold">
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
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            <select
                                name="store"
                                value={form.store}
                                onChange={handleChange}
                                className="border p-3 rounded"
                                required
                            >
                                <option value="">Select Store</option>

                                {stores.map((store) => (
                                    <option key={store._id} value={store._id}>
                                        {store.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                name="product"
                                value={form.product}
                                onChange={handleChange}
                                className="border p-3 rounded"
                                required
                            >
                                <option value="">Select Product</option>

                                {products.map((product) => (
                                    <option key={product._id} value={product._id}>
                                        {product.name}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="number"
                                name="quantity"
                                placeholder="Quantity"
                                value={form.quantity}
                                onChange={handleChange}
                                className="border p-3 rounded"
                                min="0"
                                required
                            />

                            <input
                                type="number"
                                name="reservedQuantity"
                                placeholder="Reserved Quantity"
                                value={form.reservedQuantity}
                                onChange={handleChange}
                                className="border p-3 rounded"
                                min="0"
                            />

                            <input
                                type="number"
                                name="reorderLevel"
                                placeholder="Reorder Level"
                                value={form.reorderLevel}
                                onChange={handleChange}
                                className="border p-3 rounded"
                                min="0"
                            />

                            <input
                                type="number"
                                name="maxStockLevel"
                                placeholder="Max Stock Level"
                                value={form.maxStockLevel}
                                onChange={handleChange}
                                className="border p-3 rounded"
                                min="0"
                            />

                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="border p-3 rounded"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            <div className="flex gap-3 md:col-span-2 justify-end mt-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="border px-5 py-2 rounded-lg hover:bg-gray-100"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700"
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">

                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-bold">
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
                            <div className="grid grid-cols-2 gap-4">

                                <div>
                                    <p className="text-gray-500 text-sm">Store</p>
                                    <p className="font-semibold">
                                        {viewItem.store?.name || '-'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-sm">Product</p>
                                    <p className="font-semibold">
                                        {viewItem.product?.name || '-'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-sm">Variant</p>
                                    <p className="font-semibold">
                                        {viewItem.variant?.name || '-'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-sm">Quantity</p>
                                    <p className="font-semibold">
                                        {viewItem.quantity ?? 0}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-sm">Reserved Quantity</p>
                                    <p className="font-semibold">
                                        {viewItem.reservedQuantity ?? 0}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-sm">Available Quantity</p>
                                    <p className="font-semibold">
                                        {viewItem.availableQuantity ?? 0}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-sm">Reorder Level</p>
                                    <p className="font-semibold">
                                        {viewItem.reorderLevel ?? 0}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-sm">Maximum Stock Level</p>
                                    <p className="font-semibold">
                                        {viewItem.maxStockLevel ?? 0}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-sm">Status</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                                        viewItem.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {viewItem.status}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-gray-500 text-sm">Last Restocked</p>
                                    <p className="font-semibold">
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
                                    className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* INVENTORY TABLE */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-left">

                    <thead className="bg-purple-100">
                        <tr>
                            <th className="p-3">Store</th>
                            <th className="p-3">Product</th>
                            <th className="p-3">Quantity</th>
                            <th className="p-3">Reserved</th>
                            <th className="p-3">Available</th>
                            <th className="p-3">Reorder Level</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {inventory.map((item) => (
                            <tr key={item._id} className="border-t">

                                <td className="p-3">
                                    {item.store?.name || '-'}
                                </td>

                                <td className="p-3">
                                    {item.product?.name || '-'}
                                </td>

                                <td className="p-3">{item.quantity}</td>

                                <td className="p-3">{item.reservedQuantity}</td>

                                <td className="p-3">{item.availableQuantity}</td>

                                <td className="p-3">{item.reorderLevel}</td>

                                <td className="p-3">
                                    {hasPermission('storeinventory_edit') ? (
                                        <button
                                            onClick={() => handleStatusToggle(item)}
                                            disabled={updatingStatus === item._id}
                                            className={`px-3 py-1 rounded-full text-sm disabled:opacity-50 ${
                                                item.status === 'active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {updatingStatus === item._id
                                                ? 'Updating...'
                                                : item.status}
                                        </button>
                                    ) : (
                                        <span className={`px-3 py-1 rounded-full text-sm ${
                                            item.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {item.status}
                                        </span>
                                    )}
                                </td>

                                <td className="p-3">
                                    <div className="flex gap-2">

                                        <button
                                            onClick={() => handleView(item)}
                                            className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                                        >
                                            <LuEye/>
                                        </button>

                                        {hasPermission('storeinventory_edit') && (
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                            >
                                                <LuSquarePen/>
                                            </button>
                                        )}

                                        {hasPermission('storeinventory_delete') && (
                                            <button
                                                onClick={() => handleDelete(item._id)}
                                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                            >
                                                <LuTrash2/>
                                            </button>
                                        )}

                                    </div>
                                </td>
                            </tr>
                        ))}

                        {inventory.length === 0 && (
                            <tr>
                                <td colSpan="8" className="p-6 text-center text-gray-500">
                                    No inventory found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Inventorycontent
