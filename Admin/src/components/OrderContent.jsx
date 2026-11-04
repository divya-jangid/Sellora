
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

// Availability routes are in deliverypartnerroute.js
const DELIVERY_PARTNER_API = 'http://localhost:8000/deliverypartner'

function OrderContent() {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('latest')

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // DELIVERY ACTION STATES
  const [statusLoading, setStatusLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  // AVAILABILITY STATES
  const [isAvailable, setIsAvailable] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityFetched, setAvailabilityFetched] = useState(false)

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

  // FETCH DELIVERY PARTNER AVAILABILITY
  const fetchMyAvailability = async () => {
    try {
      const res = await axios.get(
        `${DELIVERY_PARTNER_API}/my-availability`,
        {
          withCredentials: true
        }
      )

      if (res.data.success) {
        setIsAvailable(res.data.isAvailable)
      }
    } catch (error) {
      console.log(
        'Fetch Availability Error:',
        error.response?.data || error.message
      )
    } finally {
      setAvailabilityFetched(true)
    }
  }

  // FETCH AVAILABILITY WHEN DELIVERY PARTNER LOGS IN
  useEffect(() => {
    if (userLoading || !user || !isDeliveryPartner) return

    fetchMyAvailability()
  }, [userLoading, user, isDeliveryPartner])

  // UPDATE DELIVERY PARTNER AVAILABILITY
  const handleAvailabilityToggle = async () => {
    try {
      setAvailabilityLoading(true)

      const res = await axios.put(
        `${DELIVERY_PARTNER_API}/availability-status`,
        {
          isAvailable: !isAvailable
        },
        {
          withCredentials: true
        }
      )

      if (res.data.success) {
        setIsAvailable(res.data.isAvailable)
        toast.success(res.data.message)
      }
    } catch (error) {
      console.log(
        'Update Availability Error:',
        error.response?.data || error.message
      )

      toast.error(
        error.response?.data?.message ||
        'Unable to update availability'
      )
    } finally {
      setAvailabilityLoading(false)
    }
  }

  // FETCH ADMIN ORDERS
  const fetchAdminOrders = async () => {
    try {
      const res = await axios.get(`${ORDER_API}/get-all`, {
        withCredentials: true,
        params: {
          search: search.trim(),
          sort
        }
      })

      console.log('ADMIN ORDERS:', res.data)

      if (res.data.status) {
        setOrders(res.data.orders || [])
      } else {
        setOrders([])
      }
    } catch (error) {
      console.log(
        'Fetch Admin Orders Error:',
        error.response?.data || error.message
      )
      setOrders([])
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
  }, [user, userLoading, search, sort])

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
        toast.error(res.data.message || 'Unable to assign delivery partner')
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
        toast.success(res.data.message || 'Unable to update delivery status')
      }
    } catch (error) {
      console.log(
        'Update Delivery Status Error:',
        error.response?.data || error.message
      )

      toast.success(
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
        toast.success('Delivery ID not found')
        return
      }

      if (otp.length !== 6) {
        toast.success('Please enter valid 6 digit OTP')
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
        toast.success(res.data.message || 'OTP verification failed')
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
  const totalOrders = orders.length

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

    console.log(">>>>>>>>>>>>>>>>>>",currentDeliveryStatus)

     console.log("?????????????????",selectedDelivery)

  if (userLoading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Checking user...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-10 text-center text-red-500">
        Unable to fetch user details. Please login again.
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isDeliveryPartner ? 'My Deliveries' : 'Orders'}
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          {isDeliveryPartner
            ? 'View and manage your assigned deliveries'
            : 'Manage and track all customer orders'}
        </p>
      </div>

      {/* DELIVERY PARTNER AVAILABILITY */}
      {isDeliveryPartner && (
        <div className="bg-white rounded-xl p-5 shadow-sm border mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">

          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Delivery Availability
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {isAvailable
                ? 'You are available to receive new delivery orders.'
                : 'You are currently unavailable for new delivery orders.'}
            </p>

            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                isAvailable
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {availabilityFetched
                ? isAvailable
                  ? 'Available'
                  : 'Unavailable'
                : 'Checking status...'}
            </span>
          </div>

          <button
            onClick={handleAvailabilityToggle}
            disabled={availabilityLoading || !availabilityFetched}
            className={`px-6 py-3 rounded-lg text-white font-medium disabled:opacity-50 ${
              isAvailable
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {availabilityLoading
              ? 'Please wait...'
              : isAvailable
                ? 'Go Unavailable'
                : 'Go Available'}
          </button>

        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">

        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">
                {isDeliveryPartner ? 'My Deliveries' : 'Total Orders'}
              </p>
              <h2 className="text-2xl font-bold mt-2">
                {totalOrders}
              </h2>
            </div>
            <ShoppingBag className="text-purple-600" size={28} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">
                {isDeliveryPartner ? 'Active Deliveries' : 'Total Revenue'}
              </p>
              <h2 className="text-2xl font-bold mt-2">
                {isDeliveryPartner
                  ? activeOrders
                  : `₹${totalRevenue.toLocaleString('en-IN')}`}
              </h2>
            </div>
            <Truck className="text-green-600" size={28} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">
                {isDeliveryPartner ? 'Pending Deliveries' : 'Pending Orders'}
              </p>
              <h2 className="text-2xl font-bold mt-2">
                {pendingOrders}
              </h2>
            </div>
            <Clock className="text-yellow-600" size={28} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Delivered</p>
              <h2 className="text-2xl font-bold mt-2">
                {deliveredOrders}
              </h2>
            </div>
            <PackageCheck className="text-blue-600" size={28} />
          </div>
        </div>

      </div>

      {/* SEARCH AND SORT */}
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-5">
        <div className="flex flex-col md:flex-row gap-4 justify-between">

          <div className="relative flex-1">
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
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {!isDeliveryPartner && (
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-400"
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
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

        <div className="p-5 border-b">
          <h2 className="font-semibold text-gray-800">
            {isDeliveryPartner ? 'My Assigned Deliveries' : 'All Orders'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">

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
                    className="text-center py-10 text-gray-500"
                  >
                    Loading {isDeliveryPartner ? 'deliveries' : 'orders'}...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={isDeliveryPartner ? 7 : 8}
                    className="text-center py-10 text-gray-500"
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
                      className="border-t hover:bg-gray-50"
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
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusStyle(
                            order.deliveryStatus || order.orderStatus
                          )}`}
                        >
                          {String(
                            order.deliveryStatus || order.orderStatus || '-'
                          ).replaceAll('_', ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">

                          <button
                            onClick={() => handleViewOrder(order)}
                            title="View Order"
                            className="p-2 rounded-lg text-purple-600 hover:bg-purple-50"
                          >
                            <Eye size={19} />
                          </button>

                          {!isDeliveryPartner &&
                            hasPermission('orders_assign') &&
                            canAssignOrder(order) && (
                              <button
                                onClick={() => handleOpenAssign(order)}
                                title="Assign Delivery Partner"
                                className="p-2 rounded-lg text-green-600 hover:bg-green-50"
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

      {/* ASSIGN DELIVERY PARTNER MODAL */}
      {assignOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl w-full max-w-lg">

            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                Assign Delivery Partner
              </h2>

              <button
                onClick={() => {
                  setAssignOrder(null)
                  setSelectedPartnerId('')
                }}
                disabled={assignLoading}
                className="text-gray-500 hover:text-red-500"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-5 space-y-4">

              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-semibold">
                  {assignOrder.orderNumber || assignOrder._id}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Delivery Partner
                </label>

                {partnersLoading ? (
                  <p className="text-sm text-gray-500">
                    Loading available partners...
                  </p>
                ) : partners.length === 0 ? (
                  <p className="text-sm text-red-500">
                    No available delivery partners found.
                  </p>
                ) : (
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-3 outline-none focus:ring-2 focus:ring-purple-400"
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

              <div className="flex justify-end gap-3 pt-3">

                <button
                  onClick={() => {
                    setAssignOrder(null)
                    setSelectedPartnerId('')
                  }}
                  disabled={assignLoading}
                  className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
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
                  className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">
                {isDeliveryPartner ? 'Delivery Details' : 'Order Details'}
              </h2>

              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-red-500"
              >
                <X size={22} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="p-10 text-center text-gray-500">
                Loading order details...
              </div>
            ) : selectedOrder && (
              <div className="p-5 space-y-6">

                {/* ORDER INFO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>
                    <p className="text-sm text-gray-500">Order Number</p>
                    <p className="font-semibold">
                      {selectedOrder.orderNumber || selectedOrder._id}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Order Date</p>
                    <p className="font-semibold">
                      {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Order Status</p>
                    <span
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-xs capitalize ${getStatusStyle(selectedOrder.orderStatus)}`}
                    >
                      {selectedOrder.orderStatus || '-'}
                    </span>
                  </div>

                  {!isDeliveryPartner && (
                    <div>
                      <p className="text-sm text-gray-500">Payment</p>
                      <p className="font-semibold">
                        {selectedOrder.paymentMethod} - {selectedOrder.paymentStatus}
                      </p>
                    </div>
                  )}

                  {isDeliveryPartner && (
                    <div>
                      <p className="text-sm text-gray-500">Delivery Status</p>
                      <span
                        className={`inline-block mt-1 px-3 py-1 rounded-full text-xs ${getStatusStyle(currentDeliveryStatus)}`}
                      >
                        {currentDeliveryStatus.replaceAll('_', ' ')}
                      </span>
                    </div>
                  )}

                </div>

                {/* DELIVERY PARTNER ACTIONS */}
                {isDeliveryPartner && (
                  <div className="border rounded-lg p-4 bg-purple-50">

                    <h3 className="font-semibold text-gray-800 mb-3">
                      Delivery Actions
                    </h3>

                    {currentDeliveryStatus === 'ASSIGNED' && (
                      <button
                        onClick={() =>
                          handleUpdateDeliveryStatus('ACCEPTED')
                        }
                        disabled={statusLoading}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
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
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
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
                        className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
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
                          className="w-full sm:w-64 border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400"
                        />

                        <div>
                          <button
                            onClick={handleVerifyOtp}
                            disabled={otpLoading || otp.length !== 6}
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
                          >
                            {otpLoading
                              ? 'Verifying OTP...'
                              : 'Verify OTP & Complete Delivery'}
                          </button>
                        </div>

                      </div>
                    )}

                    {currentDeliveryStatus === 'DELIVERED' && (
                      <p className="text-green-700 font-semibold">
                        Order Delivered Successfully!
                      </p>
                    )}

                    {currentDeliveryStatus === 'FAILED' && (
                      <p className="text-red-600 font-semibold">
                        Delivery Failed
                      </p>
                    )}

                    {currentDeliveryStatus === 'CANCELLED' && (
                      <p className="text-red-600 font-semibold">
                        Delivery Cancelled
                      </p>
                    )}

                  </div>
                )}

                {/* CUSTOMER */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Customer Details</h3>

                  <p>{customerName(selectedOrder.user)}</p>
                  <p className="text-sm text-gray-500">
                    {selectedOrder.user?.email || '-'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedOrder.user?.phone || '-'}
                  </p>
                </div>

                {/* STORE */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Store Details</h3>
                  <p>{selectedOrder.store?.name || '-'}</p>
                  <p className="text-sm text-gray-500">
                    {selectedOrder.store?.code || ''}
                  </p>
                </div>

                {/* ADDRESS */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Delivery Address</h3>

                  {selectedOrder.address ? (
                    <>
                      <p>{selectedOrder.address.name || ''}</p>
                      <p className="text-sm text-gray-600">
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
                      <p className="text-sm text-gray-600">
                        {selectedOrder.address.phone || ''}
                      </p>
                    </>
                  ) : (
                    <p>-</p>
                  )}
                </div>

                {/* ITEMS */}
                <div>
                  <h3 className="font-semibold mb-3">Order Items</h3>

                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm text-left">
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
                            <td className="p-3">
                              {item.productName || item.product?.name || 'Product'}
                            </td>

                            <td className="p-3">
                              {item.variantName || item.variant?.name || '-'}
                            </td>

                            <td className="p-3">
                              {item.quantity || 0}
                            </td>

                            <td className="p-3">
                              ₹{Number(item.price || 0).toLocaleString('en-IN')}
                            </td>

                            <td className="p-3">
                              ₹{Number(item.totalPrice || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AMOUNT SUMMARY */}
                <div className="border rounded-lg p-4 space-y-2">

                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{selectedOrder.subtotal || 0}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Discount</span>
                    <span>₹{selectedOrder.discount || 0}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>₹{selectedOrder.deliveryFee || 0}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>₹{selectedOrder.tax || 0}</span>
                  </div>

                  <div className="flex justify-between font-bold border-t pt-3">
                    <span>Total Amount</span>
                    <span>
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

export default OrderContent
