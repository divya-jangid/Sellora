
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { useCart } from '@/context/CartContext'

const API = 'http://localhost:8000'

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true)
            return
        }

        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)

        document.body.appendChild(script)
    })
}

const emptyForm = {
    type: 'home',
    name: '',
    phone: '',
    houseNumber: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    country: 'India',
    pincode: ''
}

export default function Checkout() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const isBuyNow = searchParams.get('mode') === 'buy-now'

    const { getCart } = useCart()

    const [cart, setCart] = useState(null)
    const [buyNowProduct, setBuyNowProduct] = useState(null)

    const [addresses, setAddresses] = useState([])
    const [selectedAddress, setSelectedAddress] = useState('')
    const [form, setForm] = useState(emptyForm)

    const [couponCode, setCouponCode] = useState('')
    const [couponMessage, setCouponMessage] = useState('')
    const [couponSuccess, setCouponSuccess] = useState(false)

    const [showAddressForm, setShowAddressForm] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('COD')

    const [loading, setLoading] = useState(true)
    const [savingAddress, setSavingAddress] = useState(false)
    const [deletingAddress, setDeletingAddress] = useState('')
    const [changingDefault, setChangingDefault] = useState('')
    const [couponLoading, setCouponLoading] = useState(false)
    const [placingOrder, setPlacingOrder] = useState(false)

    const [error, setError] = useState('')

    // REFRESH CART
    const refreshCart = useCallback(async () => {
        const res = await axios.get(
            `${API}/cart/get`,
            { withCredentials: true }
        )

        if (!res.data.status) {
            throw new Error(res.data.message || 'Unable to refresh cart')
        }

        return res.data.data || { items: [] }
    }, [])

    // FETCH ADDRESSES
    const fetchAddresses = async () => {
        const res = await axios.get(
            `${API}/address/get`,
            { withCredentials: true }
        )

        const addressData = res.data.data || []

        setAddresses(addressData)

        return addressData
    }

    // LOAD CHECKOUT DATA
    const loadCheckout = useCallback(async () => {
        setLoading(true)
        setError('')

        setBuyNowProduct(null)
        setCart(null)

        try {
            // BUY NOW
            if (isBuyNow) {
                const savedBuyNow = sessionStorage.getItem('buyNowProduct')

                if (!savedBuyNow) {
                    throw new Error('Buy Now product not found.')
                }

                const parsed = JSON.parse(savedBuyNow)

                if (!parsed.productId || !parsed.variantId) {
                    throw new Error('Invalid Buy Now product data.')
                }

                setBuyNowProduct(parsed)
            } else {
                // NORMAL CART
                const cartData = await refreshCart()

                setCart({
                    ...cartData,
                    items: cartData.items || []
                })
            }

            // LOAD SAVED ADDRESSES
            const addressData = await fetchAddresses()

            if (addressData.length > 0) {
                const defaultAddress = addressData.find(
                    address => address.isDefault === true
                )

                setSelectedAddress(
                    defaultAddress?._id || addressData[0]._id
                )

                setShowAddressForm(false)
            } else {
                setSelectedAddress('')
                setShowAddressForm(true)
            }

        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Checkout load nahi hua.'
            )
        } finally {
            setLoading(false)
        }
    }, [isBuyNow, refreshCart])

    useEffect(() => {
        loadCheckout()
    }, [loadCheckout])

    // ADDRESS FORM CHANGE
    const handleChange = (e) => {
        setForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    // SELECT ADDRESS FOR CURRENT ORDER ONLY
    const handleAddressSelect = (addressId) => {
        setSelectedAddress(addressId)
    }

    // SET DEFAULT ADDRESS
    const handleSetDefault = async (addressId) => {
        setError('')
        setChangingDefault(addressId)

        try {
            const res = await axios.put(
                `${API}/address/set-default/${addressId}`,
                {},
                { withCredentials: true }
            )

            if (!res.data.success) {
                throw new Error(
                    res.data.message || 'Unable to change default address'
                )
            }

            // Update UI immediately.
            // Only selected address becomes default.
            setAddresses(prev =>
                prev.map(address => ({
                    ...address,
                    isDefault: address._id === addressId
                }))
            )

            toast.success('Default address changed successfully!')

        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                err.message ||
                'Unable to change default address'
            )
        } finally {
            setChangingDefault('')
        }
    }

    // DELETE ADDRESS
    const handleDeleteAddress = async (addressId) => {
        const confirmDelete = window.confirm(
            'Are you sure you want to delete this address?'
        )

        if (!confirmDelete) return

        setError('')
        setDeletingAddress(addressId)

        try {
            const res = await axios.delete(
                `${API}/address/delete/${addressId}`,
                { withCredentials: true }
            )

            if (!res.data.status) {
                throw new Error(
                    res.data.message || 'Unable to delete address'
                )
            }

            // Fetch updated addresses from backend.
            // This also gets the new default if deleted address was default.
            const updatedAddresses = await fetchAddresses()

            // If selected address was deleted, select default address.
            if (selectedAddress === addressId) {
                const defaultAddress = updatedAddresses.find(
                    address => address.isDefault === true
                )

                setSelectedAddress(
                    defaultAddress?._id ||
                    updatedAddresses[0]?._id ||
                    ''
                )
            }

            // If no address remains, open address form.
            if (updatedAddresses.length === 0) {
                setSelectedAddress('')
                setShowAddressForm(true)
            }

            toast.success('Address deleted successfully!')

        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                err.message ||
                'Unable to delete address'
            )
        } finally {
            setDeletingAddress('')
        }
    }

    // SAVE NEW ADDRESS
    const saveAddress = async (e) => {
        e.preventDefault()
        setError('')

        if (!/^[0-9]{10}$/.test(form.phone)) {
            setError('Valid 10-digit phone number enter karo.')
            return
        }

        if (!/^[0-9]{6}$/.test(form.pincode)) {
            setError('Valid 6-digit pincode enter karo.')
            return
        }

        setSavingAddress(true)

        try {
            const res = await axios.post(
                `${API}/address/add`,
                form,
                { withCredentials: true }
            )

            if (!res.data.status) {
                throw new Error(
                    res.data.message || 'Address save nahi hua.'
                )
            }

            // Fetch addresses again to get correct default status.
            const updatedAddresses = await fetchAddresses()

            const newAddress = res.data.data

            // Select new address for current order only.
            setSelectedAddress(newAddress._id)

            setShowAddressForm(false)
            setForm(emptyForm)

            toast.success('Address saved successfully!')

        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Address save nahi hua.'
            )
        } finally {
            setSavingAddress(false)
        }
    }

    // APPLY COUPON
    const applyCoupon = async () => {
        const code = couponCode.trim().toUpperCase()

        if (!code) {
            setCouponMessage('Please enter a coupon code.')
            setCouponSuccess(false)
            return
        }

        setCouponLoading(true)
        setCouponMessage('')
        setError('')

        try {
            const res = await axios.post(
                `${API}/cart/apply-coupon`,
                { code },
                { withCredentials: true }
            )

            if (!res.data.status) {
                setCouponMessage(
                    res.data.message || 'Coupon could not be applied.'
                )
                setCouponSuccess(false)
                return
            }

            const cartData = await refreshCart()

            setCart({
                ...cartData,
                items: cartData.items || []
            })

            setCouponCode(code)
            setCouponMessage(
                res.data.message || 'Coupon applied successfully!'
            )
            setCouponSuccess(true)

        } catch (err) {
            setCouponMessage(
                err.response?.data?.message ||
                err.message ||
                'Unable to apply coupon.'
            )
            setCouponSuccess(false)
        } finally {
            setCouponLoading(false)
        }
    }

    // REMOVE COUPON
    const removeCoupon = async () => {
        setCouponLoading(true)
        setCouponMessage('')
        setError('')

        try {
            const res = await axios.delete(
                `${API}/cart/remove-coupon`,
                { withCredentials: true }
            )

            if (!res.data.status) {
                setCouponMessage(
                    res.data.message || 'Unable to remove coupon.'
                )
                setCouponSuccess(false)
                return
            }

            const cartData = await refreshCart()

            setCart({
                ...cartData,
                items: cartData.items || []
            })

            setCouponCode('')
            setCouponMessage('Coupon removed successfully.')
            setCouponSuccess(false)

        } catch (err) {
            setCouponMessage(
                err.response?.data?.message ||
                err.message ||
                'Unable to remove coupon.'
            )
            setCouponSuccess(false)
        } finally {
            setCouponLoading(false)
        }
    }

    // BUY NOW PRICE
    const buyNowPrice = Number(
        buyNowProduct?.variant?.sellingPrice ??
        buyNowProduct?.product?.price ??
        0
    )

    const buyNowQuantity = Number(
        buyNowProduct?.quantity || 1
    )

    const buyNowSubtotal = buyNowPrice * buyNowQuantity

    // CHECKOUT ITEMS
    const items = isBuyNow
        ? (
            buyNowProduct
                ? [{
                    _id: buyNowProduct.variantId,
                    product: buyNowProduct.product,
                    variant: buyNowProduct.variant,
                    quantity: buyNowQuantity,
                    totalPrice: buyNowSubtotal
                }]
                : []
        )
        : (cart?.items || [])

    // TOTALS
    const checkoutSubtotal = isBuyNow
        ? buyNowSubtotal
        : Number(cart?.subtotal || 0)

    const checkoutDeliveryFee = isBuyNow
        ? (checkoutSubtotal >= 999 ? 0 : 30)
        : Number(cart?.deliveryFee || 0)

    const checkoutDiscount = isBuyNow
        ? 0
        : Number(cart?.discount || 0)

    const checkoutTax = isBuyNow
        ? 0
        : Number(cart?.tax || 0)

    const checkoutTotal = isBuyNow
        ? checkoutSubtotal + checkoutDeliveryFee + checkoutTax
        : Number(cart?.totalAmount || 0)

    // PLACE ORDER
    const placeOrder = async () => {
        setError('')

        if (!selectedAddress) {
            setError('Pehle delivery address select karo.')
            return
        }

        if (isBuyNow && !buyNowProduct) {
            setError('Buy Now product not found.')
            return
        }

        if (!isBuyNow && (!cart?.items || cart.items.length === 0)) {
            setError('Tumhara cart empty hai.')
            return
        }

        if (showAddressForm) {
            setError('Pehle address save karo.')
            return
        }

        setPlacingOrder(true)

        try {
            if (!isBuyNow) {
                const latestCart = await refreshCart()

                if (!latestCart.items || latestCart.items.length === 0) {
                    throw new Error('Tumhara cart empty hai.')
                }
            }

            if (paymentMethod === 'online') {
                const scriptLoaded = await loadRazorpayScript()

                if (!scriptLoaded) {
                    throw new Error(
                        'Razorpay load nahi hua. Internet connection check karo.'
                    )
                }
            }

            const orderPayload = {
                addressId: selectedAddress,
                paymentMethod
            }

            if (isBuyNow) {
                orderPayload.buyNow = {
                    productId: buyNowProduct.productId,
                    variantId: buyNowProduct.variantId,
                    quantity: buyNowQuantity
                }
            }

            const res = await axios.post(
                `${API}/order/place`,
                orderPayload,
                { withCredentials: true }
            )

            if (!res.data.status) {
                throw new Error(
                    res.data.message || 'Order place nahi hua.'
                )
            }

            const orderId = res.data.data._id

            // COD
            if (paymentMethod === 'COD') {
                if (isBuyNow) {
                    sessionStorage.removeItem('buyNowProduct')
                }

                toast.success('Order successfully placed!')

                await getCart()
                router.push('/order-success')
                return
            }

            // RAZORPAY
            const gatewayRes = await axios.post(
                `${API}/payment/razorpay/create-order`,
                { orderId },
                { withCredentials: true }
            )

            if (!gatewayRes.data.status) {
                throw new Error(
                    gatewayRes.data.message ||
                    'Razorpay order create nahi hua.'
                )
            }

            const gatewayData =
                gatewayRes.data.data || gatewayRes.data

            const options = {
                key: gatewayData.key,
                amount: gatewayData.amount,
                currency: gatewayData.currency || 'INR',
                name: 'Sellora',
                description: 'Order Payment',
                order_id: gatewayData.razorpayOrderId,

                handler: async function (response) {
                    const {
                        razorpay_order_id,
                        razorpay_payment_id,
                        razorpay_signature
                    } = response

                    try {
                        const verifyRes = await axios.post(
                            `${API}/payment/razorpay/verify`,
                            {
                                razorpay_order_id,
                                razorpay_payment_id,
                                razorpay_signature
                            },
                            { withCredentials: true }
                        )

                        if (verifyRes.data.status) {
                            if (isBuyNow) {
                                sessionStorage.removeItem('buyNowProduct')
                            }

                            await getCart()
                            router.push('/order-success')
                        } else {
                            setError(
                                verifyRes.data.message ||
                                'Payment verification failed.'
                            )
                        }

                    } catch (err) {
                        setError(
                            err.response?.data?.message ||
                            'Payment verify nahi ho paya.'
                        )
                    } finally {
                        setPlacingOrder(false)
                    }
                },

                modal: {
                    ondismiss: function () {
                        setError(
                            'Payment window close ho gayi. Order ka payment status pending ho sakta hai.'
                        )
                        setPlacingOrder(false)
                    }
                },

                theme: {
                    color: '#9333ea'
                }
            }

            const razorpay = new window.Razorpay(options)

            razorpay.on('payment.failed', function (response) {
                setError(
                    response.error?.description ||
                    'Payment failed. Please try again.'
                )
                setPlacingOrder(false)
            })

            razorpay.open()

        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Order place nahi hua.'
            )

            setPlacingOrder(false)
        }
    }

    // LOADING
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-purple-50">
                <p className="text-lg font-semibold text-purple-700">
                    Loading checkout...
                </p>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-purple-50 px-4 py-8">
            <div className="mx-auto max-w-6xl">

                <Link
                    href={isBuyNow ? '/' : '/cart'}
                    className="font-medium text-purple-700 hover:underline"
                >
                    {isBuyNow ? '← Continue Shopping' : '← Back to Cart'}
                </Link>

                <h1 className="my-6 text-3xl font-bold text-gray-800">
                    Checkout
                </h1>

                {error && (
                    <div className="mb-5 rounded-lg bg-red-100 p-3 text-red-700">
                        {error}
                    </div>
                )}

                {!items.length ? (
                    <div className="rounded-2xl bg-white p-8 text-center">
                        <h2 className="text-xl font-semibold">
                            {isBuyNow
                                ? 'Buy Now product not found'
                                : 'Your cart is empty'}
                        </h2>

                        <Link
                            href="/"
                            className="mt-4 inline-block rounded-lg bg-purple-600 px-5 py-3 text-white"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">

                        <div className="space-y-6 lg:col-span-2">

                            {/* SAVED ADDRESSES */}
                            <section className="rounded-2xl bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-xl font-semibold">
                                    Select Delivery Address
                                </h2>

                                {addresses.map(address => (
                                    <div
                                        key={address._id}
                                        className={`mb-3 rounded-xl border p-4 ${
                                            selectedAddress === address._id
                                                ? 'border-purple-600 bg-purple-50'
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <div className="flex gap-3">
                                            <input
                                                type="radio"
                                                name="selectedAddress"
                                                checked={selectedAddress === address._id}
                                                onChange={() => handleAddressSelect(address._id)}
                                                className="mt-1"
                                            />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-semibold text-gray-800">
                                                        {address.name} · {address.type}
                                                    </p>

                                                    {address.isDefault && (
                                                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                            ✓ DEFAULT ADDRESS
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="mt-1 text-sm text-gray-600">
                                                    {address.houseNumber}, {address.street}
                                                    {address.landmark ? `, ${address.landmark}` : ''}
                                                </p>

                                                <p className="text-sm text-gray-600">
                                                    {address.city}, {address.state} - {address.pincode}
                                                </p>

                                                <p className="text-sm text-gray-600">
                                                    Phone: {address.phone}
                                                </p>

                                                {/* ADDRESS ACTION BUTTONS */}
                                                <div className="mt-3 flex flex-wrap gap-4">

                                                    {!address.isDefault && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSetDefault(address._id)}
                                                            disabled={changingDefault === address._id || deletingAddress === address._id}
                                                            className="text-sm font-semibold text-purple-700 hover:text-purple-900 disabled:opacity-50"
                                                        >
                                                            {changingDefault === address._id
                                                                ? 'Updating...'
                                                                : 'Set as Default'}
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAddress(address._id)}
                                                        disabled={deletingAddress === address._id || changingDefault === address._id}
                                                        className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                                                    >
                                                        {deletingAddress === address._id
                                                            ? 'Deleting...'
                                                            : 'Delete Address'}
                                                    </button>

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    disabled={savingAddress}
                                    onClick={() => setShowAddressForm(prev => !prev)}
                                    className="mt-2 font-semibold text-purple-700 disabled:opacity-50"
                                >
                                    {showAddressForm ? '− Cancel' : '+ Add New Address'}
                                </button>
                            </section>

                            {/* NEW ADDRESS FORM */}
                            {showAddressForm && (
                                <form
                                    onSubmit={saveAddress}
                                    className="rounded-2xl bg-white p-6 shadow-sm"
                                >
                                    <h2 className="mb-5 text-xl font-semibold">
                                        Add New Address
                                    </h2>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                                        <div>
                                            <label className="mb-1 block text-sm">
                                                Address Type
                                            </label>
                                            <select
                                                name="type"
                                                value={form.type}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border p-3"
                                            >
                                                <option value="home">Home</option>
                                                <option value="work">Work</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm">
                                                Full Name
                                            </label>
                                            <input
                                                name="name"
                                                value={form.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border p-3"
                                                placeholder="Enter full name"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm">
                                                Phone Number
                                            </label>
                                            <input
                                                name="phone"
                                                type="tel"
                                                value={form.phone}
                                                onChange={handleChange}
                                                required
                                                maxLength={10}
                                                className="w-full rounded-lg border p-3"
                                                placeholder="10-digit mobile number"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm">
                                                House / Flat Number
                                            </label>
                                            <input
                                                name="houseNumber"
                                                value={form.houseNumber}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border p-3"
                                                placeholder="House number"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm">
                                                Street / Area
                                            </label>
                                            <input
                                                name="street"
                                                value={form.street}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border p-3"
                                                placeholder="Street or area"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm">
                                                Landmark (optional)
                                            </label>
                                            <input
                                                name="landmark"
                                                value={form.landmark}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border p-3"
                                                placeholder="Nearby landmark"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm">
                                                City
                                            </label>
                                            <input
                                                name="city"
                                                value={form.city}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border p-3"
                                                placeholder="City"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm">
                                                State
                                            </label>
                                            <input
                                                name="state"
                                                value={form.state}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border p-3"
                                                placeholder="State"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm">
                                                Pincode
                                            </label>
                                            <input
                                                name="pincode"
                                                value={form.pincode}
                                                onChange={handleChange}
                                                required
                                                maxLength={6}
                                                className="w-full rounded-lg border p-3"
                                                placeholder="6-digit pincode"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm">
                                                Country
                                            </label>
                                            <input
                                                name="country"
                                                value={form.country}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border p-3"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={savingAddress}
                                        className="mt-5 rounded-lg bg-purple-600 px-6 py-3 text-white hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        {savingAddress ? 'Saving...' : 'Save Address'}
                                    </button>
                                </form>
                            )}

                            {/* PAYMENT METHOD */}
                            <section className="rounded-2xl bg-white p-6 shadow-sm">
                                <h2 className="mb-4 text-xl font-semibold">
                                    Payment Method
                                </h2>

                                <label
                                    className={`mb-3 flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                                        paymentMethod === 'COD'
                                            ? 'border-purple-600 bg-purple-50'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="COD"
                                        checked={paymentMethod === 'COD'}
                                        onChange={e => setPaymentMethod(e.target.value)}
                                    />

                                    <div>
                                        <p className="font-semibold">
                                            Cash on Delivery
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Pay when your order arrives.
                                        </p>
                                    </div>
                                </label>

                                <label
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                                        paymentMethod === 'online'
                                            ? 'border-purple-600 bg-purple-50'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="online"
                                        checked={paymentMethod === 'online'}
                                        onChange={e => setPaymentMethod(e.target.value)}
                                    />

                                    <div>
                                        <p className="font-semibold">
                                            Online Payment
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Pay securely using Razorpay test mode.
                                        </p>
                                    </div>
                                </label>
                            </section>
                        </div>

                        {/* ORDER SUMMARY */}
                        <section className="h-fit rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="mb-5 text-xl font-semibold">
                                Order Summary
                            </h2>

                            <div className="space-y-4">
                                {items.map(item => (
                                    <div
                                        key={item._id}
                                        className="flex justify-between gap-3 text-sm"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {item.product?.name || 'Product'}
                                            </p>

                                            {item.variant?.name && (
                                                <p className="text-gray-500">
                                                    Variant: {item.variant.name}
                                                </p>
                                            )}

                                            <p className="text-gray-500">
                                                Qty: {item.quantity}
                                            </p>
                                        </div>

                                        <p className="font-medium">
                                            ₹{item.totalPrice}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* COUPON */}
                            {!isBuyNow && (
                                <div className="mt-5 border-t pt-5">
                                    <h3 className="font-semibold text-gray-800">
                                        Apply Coupon
                                    </h3>

                                    <div className="mt-3 flex gap-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={e => {
                                                setCouponCode(e.target.value.toUpperCase())
                                                setCouponMessage('')
                                            }}
                                            placeholder="Enter coupon code"
                                            disabled={couponLoading || Boolean(cart?.coupon)}
                                            className="min-w-0 flex-1 rounded-lg border border-purple-200 p-3 outline-none focus:border-purple-500"
                                        />

                                        {cart?.coupon ? (
                                            <button
                                                type="button"
                                                onClick={removeCoupon}
                                                disabled={couponLoading}
                                                className="rounded-lg bg-red-500 px-3 font-semibold text-white disabled:opacity-50"
                                            >
                                                {couponLoading ? 'Wait...' : 'Remove'}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={applyCoupon}
                                                disabled={couponLoading}
                                                className="rounded-lg bg-purple-600 px-4 font-semibold text-white disabled:opacity-50"
                                            >
                                                {couponLoading ? 'Applying...' : 'Apply'}
                                            </button>
                                        )}
                                    </div>

                                    {couponMessage && (
                                        <p className={`mt-2 text-sm ${
                                            couponSuccess
                                                ? 'text-green-700'
                                                : 'text-red-600'
                                        }`}>
                                            {couponMessage}
                                        </p>
                                    )}

                                    {cart?.coupon && (
                                        <p className="mt-2 text-sm font-medium text-green-700">
                                            Coupon is applied to your cart.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* TOTALS */}
                            <div className="mt-5 space-y-3 border-t pt-5 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>₹{checkoutSubtotal}</span>
                                </div>

                                <div className="flex justify-between text-green-700">
                                    <span>Discount</span>
                                    <span>−₹{checkoutDiscount}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span>Delivery Fee</span>
                                    <span>₹{checkoutDeliveryFee}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span>Tax</span>
                                    <span>₹{checkoutTax}</span>
                                </div>

                                <div className="flex justify-between border-t pt-4 text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-purple-700">
                                        ₹{checkoutTotal}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={placeOrder}
                                disabled={
                                    placingOrder ||
                                    couponLoading ||
                                    savingAddress ||
                                    deletingAddress !== '' ||
                                    changingDefault !== '' ||
                                    !selectedAddress ||
                                    showAddressForm ||
                                    (isBuyNow && !buyNowProduct) ||
                                    (!isBuyNow && !cart?.items?.length)
                                }
                                className="mt-6 w-full rounded-xl bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
                            >
                                {placingOrder ? 'Processing...' : 'Place Order'}
                            </button>

                            {showAddressForm && (
                                <p className="mt-2 text-sm text-gray-500">
                                    Save the new address before placing your order.
                                </p>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </main>
    )
}
