
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
  ShoppingBag,
  Clock,
  Truck,
  Eye,
  Search,
  X,
  PackageCheck,
  UserPlus
} from 'lucide-react'

const ORDER_API = 'http://localhost:8000/order'
const USER_API = 'http://localhost:8000/user'
const DELIVERY_API = 'http://localhost:8000/delivery'

function Order() {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('latest')

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrdersCount, setTotalOrdersCount] = useState(0)
  const limit = 10

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // DELIVERY ACTION STATES
  const [statusLoading, setStatusLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  // ASSIGN DELIVERY PARTNER STATES
  const [partners, setPartners] = useState([])
  const [assignOrder, setAssignOrder] = useState(null)
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [partnersLoading, setPartnersLoading] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)

  const roleName = user?.roleName?.toLowerCase().trim()

  const isDeliveryPartner = [
    'delivery partner',
    'delivery agent',
    'deleivery agent',
    'deliveryagent'
  ].includes(roleName)

  // CHECK PERMISSION
  const hasPermission = (permission) => {
    const role = user?.roleName?.toLowerCase().trim()

    if (role === 'super admin') {
      return true
    }

    const permissions =
      user?.permissions || user?.role?.permissions || []

    return permissions.includes(permission)
  }

  // CHECK LOGGED-IN USER
  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await axios.get(`${USER_API}/check-user`, {
          withCredentials: true
        })

        if (res.data.status) {
          setUser(res.data.user)
        }
      } catch (error) {
        console.log(
          'Check User Error:',
          error.response?.data || error.message
        )
        setUser(null)
      } finally {
        setUserLoading(false)
      }
    }

    checkUser()
  }, [])

  // FETCH ADMIN ORDERS WITH SEARCH, SORT AND PAGINATION
  const fetchAdminOrders = async () => {
    try {
      const res = await axios.get(`${ORDER_API}/get-all`, {
        withCredentials: true,
        params: {
          search: search.trim(),
          sort,
          page: currentPage,
          limit
        }
      })

      console.log('ADMIN ORDERS:', res.data)

      if (res.data.status) {
        setOrders(res.data.orders || [])
        setTotalOrdersCount(res.data.totalOrders || 0)
        setTotalPages(res.data.totalPages || 1)
      } else {
        setOrders([])
        setTotalOrdersCount(0)
        setTotalPages(1)
      }
    } catch (error) {
      console.log(
        'Fetch Admin Orders Error:',
        error.response?.data || error.message
      )

      setOrders([])
      setTotalOrdersCount(0)
      setTotalPages(1)
    }
  }

  // FETCH DELIVERY PARTNER'S DELIVERIES
  const fetchMyDeliveries = async () => {
    try {
      const res = await axios.get(`${DELIVERY_API}/my-deliveries`, {
        withCredentials: true
      })

      console.log('MY DELIVERIES:', res.data)

      if (res.data.success) {
        const deliveries = res.data.deliveries || []

        const deliveryOrders = deliveries.map((delivery) => {
          const order = delivery.order || {}

          const deliveryStatus =
            delivery.deliveryStatus || 'ASSIGNED'

          let orderStatus = order.orderStatus || 'placed'

          if (deliveryStatus === 'OUT_FOR_DELIVERY') {
            orderStatus = 'shipped'
          } else if (deliveryStatus === 'DELIVERED') {
            orderStatus = 'delivered'
          } else if (deliveryStatus === 'FAILED') {
            orderStatus = 'processing'
          } else if (
            ['ASSIGNED', 'ACCEPTED', 'PICKED_UP'].includes(deliveryStatus)
          ) {
            orderStatus = deliveryStatus.toLowerCase()
          }

          return {
            ...order,
            _id: order._id || delivery.order?._id,
            orderNumber:
              order.orderNumber || order._id || delivery._id,
            user: order.user || delivery.user,
            store: delivery.store || order.store,
            address: delivery.deliveryAddress || order.address,
            items: order.items || [],
            totalAmount: order.totalAmount || 0,
            orderStatus,
            deliveryStatus,
            deliveryId: delivery._id,
            delivery
          }
        })

        setOrders(deliveryOrders)

        return deliveryOrders
      } else {
        setOrders([])
        return []
      }
    } catch (error) {
      console.log(
        'Fetch My Deliveries Error:',
        error.response?.data || error.message
      )

      setOrders([])
      return []
    }
  }

  // FETCH DATA ACCORDING TO ROLE
  useEffect(() => {
    if (userLoading || !user) return

    let isMounted = true

    const fetchData = async () => {
      setLoading(true)

      if (isDeliveryPartner) {
        await fetchMyDeliveries()
      } else {
        await fetchAdminOrders()
      }

      if (isMounted) {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchData, 400)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [user, userLoading, search, sort, currentPage])

  // FETCH AVAILABLE DELIVERY PARTNERS
  const fetchAvailablePartners = async () => {
    try {
      setPartnersLoading(true)
      setPartners([])

      const res = await axios.get(
        `${DELIVERY_API}/available-partners`,
        {
          withCredentials: true
        }
      )

      console.log('AVAILABLE PARTNERS:', res.data)

      if (res.data.status) {
        setPartners(res.data.partners || [])
      } else {
        setPartners([])
        toast.error(res.data.message || 'Unable to fetch partners')
      }
    } catch (error) {
      console.log(
        'Fetch Partners Error:',
        error.response?.data || error.message
      )

      setPartners([])

      toast.error(
        error.response?.data?.message ||
        'Unable to fetch available delivery partners'
      )
    } finally {
      setPartnersLoading(false)
    }
  }

  // OPEN ASSIGN MODAL
  const handleOpenAssign = async (order) => {
    if (!hasPermission('orders_assign')) {
      toast.error('You do not have permission to assign delivery partners')
      return
    }

    setAssignOrder(order)
    setSelectedPartnerId('')
    await fetchAvailablePartners()
  }

  // ASSIGN DELIVERY PARTNER
  const handleAssignPartner = async () => {
    if (!hasPermission('orders_assign')) {
      toast.error('You do not have permission to assign delivery partners')
      return
    }

    if (!selectedPartnerId) {
      toast.error('Please select a delivery partner')
      return
    }

    if (!assignOrder?._id) {
      toast.error('Order ID not found')
      return
    }

    try {
      setAssignLoading(true)

      const res = await axios.post(
        `${DELIVERY_API}/assign`,
        {
          orderId: assignOrder._id,
          deliveryPartnerId: selectedPartnerId
        },
        {
          withCredentials: true
        }
      )

      console.log('ASSIGN RESPONSE:', res.data)

      if (res.data.success || res.data.status) {
        toast.success(
          res.data.message ||
          'Delivery partner assigned successfully'
        )

        setAssignOrder(null)
        setSelectedPartnerId('')
        setPartners([])

        await fetchAdminOrders()
      } else {
        toast.error(
          res.data.message || 'Unable to assign delivery partner'
        )
      }
    } catch (error) {
      console.log(
        'Assign Partner Error:',
        error.response?.data || error.message
      )

      toast.error(
        error.response?.data?.message ||
        'Unable to assign delivery partner'
      )
    } finally {
      setAssignLoading(false)
    }
  }

  // VIEW ORDER DETAILS
  const handleViewOrder = async (order) => {
    try {
      setDetailsLoading(true)
      setSelectedOrder(null)
      setSelectedDelivery(null)
      setOtp('')

      if (isDeliveryPartner) {
        setSelectedOrder(order)
        setSelectedDelivery(order.delivery)
        return
      }

      const res = await axios.get(
        `${ORDER_API}/admin-details/${order._id}`,
        { withCredentials: true }
      )

      if (res.data.status) {
        setSelectedOrder(res.data.order)
      } else {
        toast.error(res.data.message || 'Unable to fetch order details')
      }
    } catch (error) {
      console.log(
        'Order Details Error:',
        error.response?.data || error.message
      )

      toast.error(
        error.response?.data?.message ||
        'Unable to fetch order details'
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  // UPDATE DELIVERY STATUS
  const handleUpdateDeliveryStatus = async (deliveryStatus) => {
    try {
      const deliveryId =
        selectedDelivery?._id || selectedOrder?.deliveryId

      if (!deliveryId) {
        toast.error('Delivery ID not found')
        return
      }

      setStatusLoading(true)

      const res = await axios.put(
        `${DELIVERY_API}/my-delivery-status`,
        {
          deliveryId,
          deliveryStatus
        },
        {
          withCredentials: true
        }
      )

      console.log('DELIVERY STATUS RESPONSE:', res.data)

      if (res.data.success) {
        toast.success(res.data.message || 'Delivery status updated')

        const updatedDelivery = res.data.delivery

        if (updatedDelivery) {
          setSelectedDelivery(prev => ({
            ...prev,
            ...updatedDelivery
          }))
        }

        const updatedOrders = await fetchMyDeliveries()

        const updatedOrder = updatedOrders.find(
          order => order.deliveryId === deliveryId
        )

        if (updatedOrder) {
          setSelectedOrder(updatedOrder)
          setSelectedDelivery(updatedOrder.delivery)
        }
      } else {
        toast.error(res.data.message || 'Unable to update delivery status')
      }
    } catch (error) {
      console.log(
        'Update Delivery Status Error:',
        error.response?.data || error.message
      )

      toast.error(
        error.response?.data?.message ||
        'Unable to update delivery status'
      )
    } finally {
      setStatusLoading(false)
    }
  }

  // VERIFY CUSTOMER OTP
  const handleVerifyOtp = async () => {
    try {
      const deliveryId =
        selectedDelivery?._id || selectedOrder?.deliveryId

      if (!deliveryId) {
        toast.error('Delivery ID not found')
        return
      }

      if (otp.length !== 6) {
        toast.error('Please enter valid 6 digit OTP')
        return
      }

      setOtpLoading(true)

      const res = await axios.post(
        `${DELIVERY_API}/verify-delivery-otp`,
        {
          deliveryId,
          otp
        },
        {
          withCredentials: true
        }
      )

      console.log('VERIFY OTP RESPONSE:', res.data)

      if (res.data.success) {
        toast.success(res.data.message || 'Order delivered successfully')

        setOtp('')

        const updatedOrders = await fetchMyDeliveries()

        const updatedOrder = updatedOrders.find(
          order => order.deliveryId === deliveryId
        )

        if (updatedOrder) {
          setSelectedOrder(updatedOrder)
          setSelectedDelivery(updatedOrder.delivery)
        } else {
          setSelectedDelivery(prev => ({
            ...prev,
            deliveryStatus: 'DELIVERED',
            deliveredAt: res.data.deliveredAt || new Date()
          }))

          setSelectedOrder(prev => ({
            ...prev,
            deliveryStatus: 'DELIVERED',
            orderStatus: 'delivered'
          }))
        }
      } else {
        toast.error(res.data.message || 'OTP verification failed')
      }
    } catch (error) {
      console.log(
        'Verify OTP Error:',
        error.response?.data || error.message
      )

      toast.error(
        error.response?.data?.message ||
        'OTP verification failed'
      )
    } finally {
      setOtpLoading(false)
    }
  }

  // SUMMARY
  const totalOrders = isDeliveryPartner
    ? orders.length
    : totalOrdersCount

  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0
  )

  const pendingOrders = orders.filter(order =>
    ['placed', 'assigned', 'pending'].includes(
      String(order.orderStatus).toLowerCase()
    )
  ).length

  const deliveredOrders = orders.filter(order =>
    String(order.orderStatus).toLowerCase() === 'delivered'
  ).length

  const activeOrders = totalOrders - deliveredOrders

  // STATUS COLOR
  const getStatusStyle = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'placed':
      case 'assigned':
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'

      case 'confirmed':
      case 'accepted':
        return 'bg-blue-100 text-blue-700'

      case 'processing':
      case 'picked_up':
        return 'bg-purple-100 text-purple-700'

      case 'shipped':
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-700'

      case 'delivered':
        return 'bg-green-100 text-green-700'

      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-700'

      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const customerName = (user) => {
    if (!user) return 'Customer'

    return `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      'Customer'
  }

  const closeModal = () => {
    setSelectedOrder(null)
    setSelectedDelivery(null)
    setOtp('')
  }

  // CHECK WHETHER ORDER IS ALREADY ASSIGNED
  const isOrderAssigned = (order) => {
    return Boolean(
      order.deliveryPartner ||
      order.delivery ||
      order.deliveryId
    )
  }

  // CHECK WHETHER ORDER CAN BE ASSIGNED
  const canAssignOrder = (order) => {
    const status = String(order.orderStatus || '').toLowerCase()

    return (
      !isOrderAssigned(order) &&
      !['delivered', 'cancelled'].includes(status)
    )
  }

  // CURRENT DELIVERY STATUS
  const currentDeliveryStatus =
    selectedDelivery?.deliveryStatus || 'ASSIGNED'

  if (userLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center p-5">
        <p className="text-sm text-gray-500">Checking user...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-5 text-center text-red-500 sm:p-10">
        Unable to fetch user details. Please login again.
      </div>
    )
  }

  return (
    <div className="min-h-full w-full min-w-0 max-w-full overflow-x-hidden bg-gray-50 p-3 sm:p-5 lg:p-6">

      {/* HEADER */}
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            {isDeliveryPartner ? 'My Deliveries' : 'Orders'}
          </h1>

          <p className="mt-1 text-sm text-gray-500 sm:text-base">
            {isDeliveryPartner
              ? 'View and manage your assigned deliveries'
              : 'Manage and track all customer orders'}
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-gray-500">
                {isDeliveryPartner ? 'My Deliveries' : 'Total Orders'}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-800">
                {totalOrders}
              </h2>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50">
              <ShoppingBag className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-gray-500">
                {isDeliveryPartner ? 'Active Deliveries' : 'Total Revenue'}
              </p>
              <h2 className="mt-2 break-words text-2xl font-bold text-gray-800">
                {isDeliveryPartner
                  ? activeOrders
                  : `₹${totalRevenue.toLocaleString('en-IN')}`}
              </h2>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50">
              <Truck className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-gray-500">
                {isDeliveryPartner ? 'Pending Deliveries' : 'Pending Orders'}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-800">
                {pendingOrders}
              </h2>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-50">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-gray-500">Delivered</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-800">
                {deliveredOrders}
              </h2>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <PackageCheck className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* SEARCH AND SORT */}
      <div className="mb-5 rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row">

          <div className="relative min-w-0 flex-1">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder={
                isDeliveryPartner
                  ? 'Search order ID...'
                  : 'Search customer name, email or order ID...'
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full min-w-0 rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {!isDeliveryPartner && (
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 sm:w-auto sm:min-w-[190px]"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amountLow">Amount: Low to High</option>
              <option value="amountHigh">Amount: High to Low</option>
            </select>
          )}

        </div>
      </div>

      {/* ORDERS / DELIVERIES TABLE */}
      <div className="w-full min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

        <div className="border-b border-gray-100 p-4 sm:p-5">
          <h2 className="font-semibold text-gray-800">
            {isDeliveryPartner ? 'My Assigned Deliveries' : 'All Orders'}
          </h2>
        </div>

        {/* TABLE SCROLL ON SMALL SCREENS */}
        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">

            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-4">Order ID</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Items</th>
                <th className="px-5 py-4">Amount</th>

                {!isDeliveryPartner && (
                  <th className="px-5 py-4">Payment</th>
                )}

                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={isDeliveryPartner ? 7 : 8}
                    className="py-10 text-center text-gray-500"
                  >
                    Loading {isDeliveryPartner ? 'deliveries' : 'orders'}...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={isDeliveryPartner ? 7 : 8}
                    className="py-10 text-center text-gray-500"
                  >
                    {isDeliveryPartner
                      ? 'No deliveries assigned yet'
                      : 'No orders found'}
                  </td>
                </tr>
              ) : (
                orders
                  .filter(order => {
                    if (!isDeliveryPartner) return true

                    const orderNumber = String(
                      order.orderNumber || ''
                    ).toLowerCase()

                    return orderNumber.includes(search.toLowerCase())
                  })
                  .map((order) => (
                    <tr
                      key={order.deliveryId || order._id}
                      className="border-t border-gray-100 transition hover:bg-gray-50"
                    >

                      <td className="px-5 py-4 font-medium text-purple-600">
                        {order.orderNumber || order._id}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">
                          {customerName(order.user)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.user?.email || '-'}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {order.items?.length || 0} Items
                      </td>

                      <td className="px-5 py-4 font-medium">
                        ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                      </td>

                      {!isDeliveryPartner && (
                        <td className="px-5 py-4">
                          <p>{order.paymentMethod || '-'}</p>
                          <p className="text-xs text-gray-500">
                            {order.paymentStatus || ''}
                          </p>
                        </td>
                      )}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusStyle(
                            order.deliveryStatus || order.orderStatus
                          )}`}
                        >
                          {String(
                            order.deliveryStatus || order.orderStatus || '-'
                          ).replaceAll('_', ' ')}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">

                          <button
                            onClick={() => handleViewOrder(order)}
                            title="View Order"
                            className="rounded-lg p-2 text-purple-600 transition hover:bg-purple-50"
                          >
                            <Eye size={19} />
                          </button>

                          {!isDeliveryPartner &&
                            hasPermission('orders_assign') &&
                            canAssignOrder(order) && (
                              <button
                                onClick={() => handleOpenAssign(order)}
                                title="Assign Delivery Partner"
                                className="rounded-lg p-2 text-green-600 transition hover:bg-green-50"
                              >
                                <UserPlus size={19} />
                              </button>
                            )}

                        </div>
                      </td>

                    </tr>
                  ))
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* PAGINATION - ADMIN ONLY */}
      {!isDeliveryPartner && !loading && totalOrdersCount > 0 && (
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">

          <p className="text-center text-xs text-gray-600 sm:text-left sm:text-sm">
            Showing {(currentPage - 1) * limit + 1} to{' '}
            {Math.min(currentPage * limit, totalOrdersCount)} of{' '}
            {totalOrdersCount} orders
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">

            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border px-3 py-2 text-xs transition hover:bg-gray-50 disabled:opacity-40 sm:px-4 sm:text-sm"
            >
              Previous
            </button>

            <span className="px-2 text-xs font-medium text-gray-700 sm:text-sm">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-lg border px-3 py-2 text-xs transition hover:bg-gray-50 disabled:opacity-40 sm:px-4 sm:text-sm"
            >
              Next
            </button>

          </div>
        </div>
      )}

      {/* ASSIGN DELIVERY PARTNER MODAL */}
      {assignOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-5">

          <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[90vh]">

            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white p-4 sm:p-5">
              <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
                Assign Delivery Partner
              </h2>

              <button
                onClick={() => {
                  setAssignOrder(null)
                  setSelectedPartnerId('')
                }}
                disabled={assignLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-5 p-4 sm:p-5">

              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Order ID</p>
                <p className="mt-1 break-all font-semibold text-gray-800">
                  {assignOrder.orderNumber || assignOrder._id}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Select Delivery Partner
                </label>

                {partnersLoading ? (
                  <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                    Loading available partners...
                  </p>
                ) : partners.length === 0 ? (
                  <p className="rounded-lg bg-red-50 p-4 text-sm text-red-500">
                    No available delivery partners found.
                  </p>
                ) : (
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="w-full min-w-0 rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  >
                    <option value="">
                      Select a delivery partner
                    </option>

                    {partners.map((partner) => (
                      <option key={partner._id} value={partner._id}>
                        {customerName(partner.user)}
                        {' - '}
                        {partner.vehicleType || 'Vehicle'}
                        {' ('}
                        {partner.vehicleNumber || '-'}
                        {')'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">

                <button
                  onClick={() => {
                    setAssignOrder(null)
                    setSelectedPartnerId('')
                  }}
                  disabled={assignLoading}
                  className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAssignPartner}
                  disabled={
                    assignLoading ||
                    partnersLoading ||
                    !selectedPartnerId
                  }
                  className="w-full rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50 sm:w-auto"
                >
                  {assignLoading ? 'Assigning...' : 'Assign Partner'}
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {(selectedOrder || detailsLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-2 backdrop-blur-sm sm:p-4">

          <div className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[92vh]">

            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white p-4 sm:p-5">
              <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
                {isDeliveryPartner ? 'Delivery Details' : 'Order Details'}
              </h2>

              <button
                onClick={closeModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-red-50 hover:text-red-500"
              >
                <X size={22} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="p-10 text-center text-gray-500">
                Loading order details...
              </div>
            ) : selectedOrder && (
              <div className="space-y-5 p-3 sm:space-y-6 sm:p-5">

                {/* ORDER INFO */}
                <div className="grid grid-cols-1 gap-4 rounded-xl border p-4 sm:grid-cols-2">

                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Order Number</p>
                    <p className="mt-1 break-all font-semibold text-gray-800">
                      {selectedOrder.orderNumber || selectedOrder._id}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Order Date</p>
                    <p className="mt-1 font-semibold text-gray-800">
                      {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Order Status</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-3 py-1 text-xs capitalize ${getStatusStyle(selectedOrder.orderStatus)}`}
                    >
                      {selectedOrder.orderStatus || '-'}
                    </span>
                  </div>

                  {!isDeliveryPartner && (
                    <div>
                      <p className="text-xs text-gray-500">Payment</p>
                      <p className="mt-1 break-words font-semibold text-gray-800">
                        {selectedOrder.paymentMethod} - {selectedOrder.paymentStatus}
                      </p>
                    </div>
                  )}

                  {isDeliveryPartner && (
                    <div>
                      <p className="text-xs text-gray-500">Delivery Status</p>
                      <span
                        className={`mt-1 inline-block rounded-full px-3 py-1 text-xs ${getStatusStyle(currentDeliveryStatus)}`}
                      >
                        {currentDeliveryStatus.replaceAll('_', ' ')}
                      </span>
                    </div>
                  )}

                </div>

                {/* DELIVERY PARTNER ACTIONS */}
                {isDeliveryPartner && (
                  <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">

                    <h3 className="mb-3 font-semibold text-gray-800">
                      Delivery Actions
                    </h3>

                    {currentDeliveryStatus === 'ASSIGNED' && (
                      <button
                        onClick={() =>
                          handleUpdateDeliveryStatus('ACCEPTED')
                        }
                        disabled={statusLoading}
                        className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
                      >
                        {statusLoading ? 'Please wait...' : 'Accept Delivery'}
                      </button>
                    )}

                    {currentDeliveryStatus === 'ACCEPTED' && (
                      <button
                        onClick={() =>
                          handleUpdateDeliveryStatus('PICKED_UP')
                        }
                        disabled={statusLoading}
                        className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
                      >
                        {statusLoading ? 'Please wait...' : 'Pickup Order'}
                      </button>
                    )}

                    {currentDeliveryStatus === 'PICKED_UP' && (
                      <button
                        onClick={() =>
                          handleUpdateDeliveryStatus('OUT_FOR_DELIVERY')
                        }
                        disabled={statusLoading}
                        className="w-full rounded-lg bg-orange-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-orange-700 disabled:opacity-50 sm:w-auto"
                      >
                        {statusLoading ? 'Please wait...' : 'Start Delivery'}
                      </button>
                    )}

                    {currentDeliveryStatus === 'OUT_FOR_DELIVERY' && (
                      <div className="space-y-3">

                        <p className="text-sm text-gray-600">
                          Enter the OTP provided by the customer to complete delivery.
                        </p>

                        <input
                          type="text"
                          value={otp}
                          maxLength={6}
                          placeholder="Enter 6 digit OTP"
                          onChange={(e) =>
                            setOtp(
                              e.target.value.replace(/\D/g, '').slice(0, 6)
                            )
                          }
                          className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 sm:max-w-xs"
                        />

                        <div>
                          <button
                            onClick={handleVerifyOtp}
                            disabled={otpLoading || otp.length !== 6}
                            className="w-full rounded-lg bg-green-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50 sm:w-auto"
                          >
                            {otpLoading
                              ? 'Verifying OTP...'
                              : 'Verify OTP & Complete Delivery'}
                          </button>
                        </div>

                      </div>
                    )}

                    {currentDeliveryStatus === 'DELIVERED' && (
                      <p className="font-semibold text-green-700">
                        Order Delivered Successfully!
                      </p>
                    )}

                    {currentDeliveryStatus === 'FAILED' && (
                      <p className="font-semibold text-red-600">
                        Delivery Failed
                      </p>
                    )}

                    {currentDeliveryStatus === 'CANCELLED' && (
                      <p className="font-semibold text-red-600">
                        Delivery Cancelled
                      </p>
                    )}

                  </div>
                )}

                {/* CUSTOMER */}
                <div className="rounded-xl border p-4">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Customer Details
                  </h3>

                  <p className="break-words text-sm font-medium text-gray-800">
                    {customerName(selectedOrder.user)}
                  </p>
                  <p className="mt-1 break-all text-sm text-gray-500">
                    {selectedOrder.user?.email || '-'}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedOrder.user?.phone || '-'}
                  </p>
                </div>

                {/* STORE */}
                <div className="rounded-xl border p-4">
                  <h3 className="mb-2 font-semibold text-gray-800">
                    Store Details
                  </h3>
                  <p className="text-sm text-gray-700">
                    {selectedOrder.store?.name || '-'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedOrder.store?.code || ''}
                  </p>
                </div>

                {/* ADDRESS */}
                <div className="rounded-xl border p-4">
                  <h3 className="mb-2 font-semibold text-gray-800">
                    Delivery Address
                  </h3>

                  {selectedOrder.address ? (
                    <>
                      <p className="text-sm font-medium text-gray-800">
                        {selectedOrder.address.name || ''}
                      </p>
                      <p className="mt-1 break-words text-sm text-gray-600">
                        {[
                          selectedOrder.address.addressLine1,
                          selectedOrder.address.addressLine2,
                          selectedOrder.address.landmark,
                          selectedOrder.address.city,
                          selectedOrder.address.state,
                          selectedOrder.address.pincode ||
                          selectedOrder.address.zipCode
                        ].filter(Boolean).join(', ') || '-'}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {selectedOrder.address.phone || ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">-</p>
                  )}
                </div>

                {/* ITEMS */}
                <div>
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Order Items
                  </h3>

                  <div className="w-full overflow-x-auto rounded-xl border">
                    <table className="w-full min-w-[600px] text-left text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3">Product</th>
                          <th className="p-3">Variant</th>
                          <th className="p-3">Quantity</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Total</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(selectedOrder.items || []).map((item, index) => (
                          <tr key={item._id || index} className="border-t">
                            <td className="max-w-[180px] break-words p-3">
                              {item.productName || item.product?.name || 'Product'}
                            </td>

                            <td className="p-3">
                              {item.variantName || item.variant?.name || '-'}
                            </td>

                            <td className="p-3">
                              {item.quantity || 0}
                            </td>

                            <td className="whitespace-nowrap p-3">
                              ₹{Number(item.price || 0).toLocaleString('en-IN')}
                            </td>

                            <td className="whitespace-nowrap p-3">
                              ₹{Number(item.totalPrice || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AMOUNT SUMMARY */}
                <div className="space-y-3 rounded-xl border p-4">

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">
                      ₹{selectedOrder.subtotal || 0}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="font-medium">
                      ₹{selectedOrder.discount || 0}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="font-medium">
                      ₹{selectedOrder.deliveryFee || 0}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span className="font-medium">
                      ₹{selectedOrder.tax || 0}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 border-t pt-3 font-bold text-gray-800">
                    <span>Total Amount</span>
                    <span className="whitespace-nowrap">
                      ₹{Number(selectedOrder.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}

export default Order
