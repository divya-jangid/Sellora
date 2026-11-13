
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { useCart } from '@/context/CartContext'
import { useLocationContext } from '@/context/LocationContext'

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

const inputClass = "w-full rounded-xl border border-purple-100 bg-[#faf8ff] px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-50"

const labelClass = "mb-2 block text-sm font-semibold text-gray-700"

export default function Checkout() {

    const router = useRouter()
    const searchParams = useSearchParams()

    const isBuyNow = searchParams.get('mode') === 'buy-now'

    const { getCart } = useCart()
    const { selectedStore } = useLocationContext()

    const storeId = selectedStore?._id

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
        if (!storeId) {
            throw new Error('Please select your location first.')
        }

        const res = await axios.get(
            `${API}/cart/get`,
            {
                params: { storeId },
                withCredentials: true
            }
        )

        if (!res.data.status) {
            throw new Error(res.data.message || 'Unable to refresh cart')
        }

        return res.data.data || { items: [] }
    }, [storeId])

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
            if (!storeId) {
                throw new Error('Please select your location first.')
            }

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
                const cartData = await refreshCart()

                setCart({
                    ...cartData,
                    items: cartData.items || []
                })
            }

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
    }, [isBuyNow, refreshCart, storeId])

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

    // SELECT ADDRESS
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

            const updatedAddresses = await fetchAddresses()

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
            toast.error('Valid 10-digit phone number enter karo.')
            return
        }

        if (!/^[0-9]{6}$/.test(form.pincode)) {
            toast.error('Valid 6-digit pincode enter karo.')
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

            const updatedAddresses = await fetchAddresses()
            const newAddress = res.data.data

            setSelectedAddress(
                newAddress?._id ||
                updatedAddresses[updatedAddresses.length - 1]?._id ||
                ''
            )

            setShowAddressForm(false)
            setForm(emptyForm)

            toast.success('Address saved successfully!')

        } catch (err) {
            toast.error(
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

        if (!storeId) {
            setCouponMessage('Please select your location first.')
            return
        }

        setCouponLoading(true)
        setCouponMessage('')
        setError('')

        try {
            const res = await axios.post(
                `${API}/cart/apply-coupon`,
                { code, storeId },
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
                {
                    data: { storeId },
                    withCredentials: true
                }
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

        if (!storeId) {
            setError('Please select your location first.')
            return
        }

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
                paymentMethod,
                storeId
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
            <main className="flex min-h-[70vh] items-center justify-center bg-[#faf8ff] px-4">
                <div className="text-center">
                    <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600"></div>

                    <h2 className="text-lg font-bold text-gray-800">
                        Preparing your checkout
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Please wait...
                    </p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-[#faf8ff] px-3 py-6 sm:px-5 sm:py-9 lg:px-8">

            <div className="mx-auto max-w-7xl">

                {/* HEADER */}
                <div className="mb-7 sm:mb-9">

                    <Link
                        href={isBuyNow ? '/' : '/cart'}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 transition hover:text-purple-900"
                    >
                        <span>←</span>
                        {isBuyNow ? 'Continue Shopping' : 'Back to Cart'}
                    </Link>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">

                        <div>
                            <p className="text-xs font-bold uppercase tracking-[3px] text-purple-600">
                                Sellora Shopping
                            </p>

                            <h1 className="mt-2 text-2xl font-extrabold text-gray-900 sm:text-3xl md:text-4xl">
                                Checkout
                            </h1>

                            <p className="mt-2 text-sm text-gray-500">
                                Complete your order securely and easily.
                            </p>
                        </div>

                        <div className="hidden items-center gap-2 rounded-full border border-purple-100 bg-white px-4 py-2.5 text-xs font-semibold text-purple-700 sm:flex">
                            <span>🔒</span>
                            Secure Checkout
                        </div>

                    </div>
                </div>

                {/* ERROR */}
                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                        <span className="font-bold">!</span>
                        <p>{error}</p>
                    </div>
                )}

                {!items.length ? (
                    <div className="rounded-3xl border border-purple-100 bg-white px-5 py-14 text-center shadow-sm">

                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 text-4xl">
                            🛒
                        </div>

                        <h2 className="text-xl font-bold text-gray-900">
                            {isBuyNow
                                ? 'Buy Now product not found'
                                : 'Your cart is empty'}
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                            Add products to continue shopping.
                        </p>

                        <Link
                            href="/"
                            className="mt-6 inline-flex rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
                        >
                            Continue Shopping
                        </Link>

                    </div>
                ) : (

                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">

                        {/* LEFT SIDE */}
                        <div className="min-w-0 space-y-6 lg:col-span-2">

                            {/* DELIVERY ADDRESS */}
                            <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">

                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 px-4 py-4 sm:px-6">

                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-xl">
                                            📍
                                        </div>

                                        <div>
                                            <h2 className="text-base font-extrabold text-gray-900 sm:text-lg">
                                                Delivery Address
                                            </h2>

                                            <p className="text-xs text-gray-500">
                                                Select where you want your order delivered
                                            </p>
                                        </div>
                                    </div>

                                    <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                                        {addresses.length} Saved
                                    </span>

                                </div>

                                <div className="p-4 sm:p-6">

                                    {/* SAVED ADDRESSES */}
                                    <div className="grid grid-cols-1 gap-3">

                                        {addresses.map(address => (

                                            <div
                                                key={address._id}
                                                onClick={() => handleAddressSelect(address._id)}
                                                className={`cursor-pointer rounded-2xl border p-4 transition duration-200 ${
                                                    selectedAddress === address._id
                                                        ? 'border-purple-500 bg-purple-50/70 shadow-sm'
                                                        : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50/30'
                                                }`}
                                            >

                                                <div className="flex items-start gap-3">

                                                    <input
                                                        type="radio"
                                                        name="selectedAddress"
                                                        checked={selectedAddress === address._id}
                                                        onChange={() => handleAddressSelect(address._id)}
                                                        onClick={e => e.stopPropagation()}
                                                        className="mt-1 h-4 w-4 accent-purple-600"
                                                    />

                                                    <div className="min-w-0 flex-1">

                                                        <div className="flex flex-wrap items-center gap-2">

                                                            <h3 className="text-sm font-bold text-gray-900 sm:text-base">
                                                                {address.name}
                                                            </h3>

                                                            <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase text-gray-600">
                                                                {address.type}
                                                            </span>

                                                            {address.isDefault && (
                                                                <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700">
                                                                    ✓ DEFAULT
                                                                </span>
                                                            )}

                                                        </div>

                                                        <p className="mt-2 break-words text-sm leading-6 text-gray-600">
                                                            {address.houseNumber}, {address.street}
                                                            {address.landmark ? `, ${address.landmark}` : ''}
                                                        </p>

                                                        <p className="text-sm text-gray-600">
                                                            {address.city}, {address.state} - {address.pincode}
                                                        </p>

                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Phone: {address.phone}
                                                        </p>

                                                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">

                                                            {!address.isDefault && (
                                                                <button
                                                                    type="button"
                                                                    onClick={e => {
                                                                        e.stopPropagation()
                                                                        handleSetDefault(address._id)
                                                                    }}
                                                                    disabled={changingDefault === address._id || deletingAddress === address._id}
                                                                    className="text-xs font-bold text-purple-700 transition hover:text-purple-900 disabled:opacity-50"
                                                                >
                                                                    {changingDefault === address._id
                                                                        ? 'Updating...'
                                                                        : 'Set as Default'}
                                                                </button>
                                                            )}

                                                            <button
                                                                type="button"
                                                                onClick={e => {
                                                                    e.stopPropagation()
                                                                    handleDeleteAddress(address._id)
                                                                }}
                                                                disabled={deletingAddress === address._id || changingDefault === address._id}
                                                                className="text-xs font-bold text-red-500 transition hover:text-red-700 disabled:opacity-50"
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

                                    </div>

                                    {/* ADD ADDRESS BUTTON */}
                                    {!showAddressForm && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddressForm(true)}
                                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-purple-300 bg-purple-50/50 px-4 py-3 text-sm font-bold text-purple-700 transition hover:border-purple-500 hover:bg-purple-50"
                                        >
                                            <span className="text-lg">+</span>
                                            Add New Address
                                        </button>
                                    )}

                                </div>
                            </section>

                            {/* NEW ADDRESS FORM */}
                            {showAddressForm && (

                                <form
                                    onSubmit={saveAddress}
                                    className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm"
                                >

                                    {/* FORM HEADER */}
                                    <div className="flex items-center gap-3 border-b border-purple-100 bg-purple-50/70 px-4 py-4 sm:px-6">

                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-xl">
                                            🏠
                                        </div>

                                        <div>
                                            <h2 className="text-base font-extrabold text-gray-900 sm:text-lg">
                                                Add New Address
                                            </h2>

                                            <p className="text-xs text-gray-500">
                                                Enter your delivery details
                                            </p>
                                        </div>

                                    </div>

                                    <div className="p-4 sm:p-6">

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                            <div>
                                                <label className={labelClass}>
                                                    Address Type
                                                </label>

                                                <select
                                                    name="type"
                                                    value={form.type}
                                                    onChange={handleChange}
                                                    className={inputClass}
                                                >
                                                    <option value="home">Home</option>
                                                    <option value="work">Work</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className={labelClass}>
                                                    Full Name
                                                </label>

                                                <input
                                                    name="name"
                                                    value={form.name}
                                                    onChange={handleChange}
                                                    required
                                                    className={inputClass}
                                                    placeholder="Enter full name"
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClass}>
                                                    Phone Number
                                                </label>

                                                <input
                                                    name="phone"
                                                    type="tel"
                                                    value={form.phone}
                                                    onChange={handleChange}
                                                    required
                                                    maxLength={10}
                                                    className={inputClass}
                                                    placeholder="10-digit mobile number"
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClass}>
                                                    House / Flat Number
                                                </label>

                                                <input
                                                    name="houseNumber"
                                                    value={form.houseNumber}
                                                    onChange={handleChange}
                                                    required
                                                    className={inputClass}
                                                    placeholder="House number"
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClass}>
                                                    Street / Area
                                                </label>

                                                <input
                                                    name="street"
                                                    value={form.street}
                                                    onChange={handleChange}
                                                    required
                                                    className={inputClass}
                                                    placeholder="Street or area"
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClass}>
                                                    Landmark (Optional)
                                                </label>

                                                <input
                                                    name="landmark"
                                                    value={form.landmark}
                                                    onChange={handleChange}
                                                    className={inputClass}
                                                    placeholder="Nearby landmark"
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClass}>
                                                    City
                                                </label>

                                                <input
                                                    name="city"
                                                    value={form.city}
                                                    onChange={handleChange}
                                                    required
                                                    className={inputClass}
                                                    placeholder="Enter city"
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClass}>
                                                    State
                                                </label>

                                                <input
                                                    name="state"
                                                    value={form.state}
                                                    onChange={handleChange}
                                                    required
                                                    className={inputClass}
                                                    placeholder="Enter state"
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClass}>
                                                    Pincode
                                                </label>

                                                <input
                                                    name="pincode"
                                                    value={form.pincode}
                                                    onChange={handleChange}
                                                    required
                                                    maxLength={6}
                                                    className={inputClass}
                                                    placeholder="6-digit pincode"
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClass}>
                                                    Country
                                                </label>

                                                <input
                                                    name="country"
                                                    value={form.country}
                                                    onChange={handleChange}
                                                    required
                                                    className={inputClass}
                                                    placeholder="Country"
                                                />
                                            </div>

                                        </div>

                                        {/* CANCEL + SAVE ADDRESS BUTTONS */}
                                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                                            {addresses.length > 0 && (
                                                <button
                                                    type="button"
                                                    disabled={savingAddress}
                                                    onClick={() => {
                                                        setShowAddressForm(false)
                                                        setForm(emptyForm)
                                                    }}
                                                    className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={savingAddress}
                                                className="rounded-xl bg-purple-600 px-7 py-3 text-sm font-bold text-white shadow-md shadow-purple-100 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {savingAddress ? 'Saving Address...' : 'Save Address'}
                                            </button>

                                        </div>

                                    </div>

                                </form>
                            )}

                            {/* PAYMENT METHOD */}
                            <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">

                                <div className="flex items-center gap-3 border-b border-purple-100 px-4 py-4 sm:px-6">

                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-xl">
                                        💳
                                    </div>

                                    <div>
                                        <h2 className="text-base font-extrabold text-gray-900 sm:text-lg">
                                            Payment Method
                                        </h2>

                                        <p className="text-xs text-gray-500">
                                            Choose your preferred payment option
                                        </p>
                                    </div>

                                </div>

                                <div className="space-y-3 p-4 sm:p-6">

                                    {/* COD */}
                                    <label
                                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                                            paymentMethod === 'COD'
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-purple-200'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="COD"
                                            checked={paymentMethod === 'COD'}
                                            onChange={e => setPaymentMethod(e.target.value)}
                                            className="mt-1 h-4 w-4 accent-purple-600"
                                        />

                                        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">

                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    Cash on Delivery
                                                </p>

                                                <p className="mt-1 text-xs leading-5 text-gray-500">
                                                    Pay when your order arrives at your doorstep.
                                                </p>
                                            </div>

                                            <span className="text-2xl">💵</span>

                                        </div>
                                    </label>

                                    {/* ONLINE */}
                                    <label
                                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                                            paymentMethod === 'online'
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-purple-200'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="online"
                                            checked={paymentMethod === 'online'}
                                            onChange={e => setPaymentMethod(e.target.value)}
                                            className="mt-1 h-4 w-4 accent-purple-600"
                                        />

                                        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">

                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    Online Payment
                                                </p>

                                                <p className="mt-1 text-xs leading-5 text-gray-500">
                                                    Pay securely using Razorpay.
                                                </p>
                                            </div>

                                            <span className="text-2xl">🔒</span>

                                        </div>
                                    </label>

                                </div>
                            </section>

                        </div>

                        {/* RIGHT SIDE - ORDER SUMMARY */}
                        <div className="min-w-0 lg:sticky lg:top-6">

                            <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">

                                <div className="border-b border-purple-100 bg-purple-50 px-5 py-4 sm:px-6">

                                    <h2 className="text-lg font-extrabold text-gray-900">
                                        Order Summary
                                    </h2>

                                    <p className="mt-1 text-xs text-gray-500">
                                        Review your order before placing it
                                    </p>

                                </div>

                                <div className="p-5 sm:p-6">

                                    {/* ORDER ITEMS */}
                                    <div className="space-y-4">

                                        {items.map(item => (

                                            <div
                                                key={item._id}
                                                className="flex items-start justify-between gap-3"
                                            >

                                                <div className="min-w-0 flex-1">

                                                    <p className="break-words text-sm font-bold text-gray-800">
                                                        {item.product?.name || 'Product'}
                                                    </p>

                                                    {item.variant?.name && (
                                                        <p className="mt-1 text-xs text-purple-600">
                                                            {item.variant.name}
                                                        </p>
                                                    )}

                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Qty: {item.quantity}
                                                    </p>

                                                </div>

                                                <p className="shrink-0 text-sm font-bold text-gray-800">
                                                    ₹{item.totalPrice}
                                                </p>

                                            </div>

                                        ))}

                                    </div>

                                    {/* COUPON */}
                                    {!isBuyNow && (

                                        <div className="mt-5 border-t border-gray-100 pt-5">

                                            <h3 className="text-sm font-bold text-gray-900">
                                                Apply Coupon
                                            </h3>

                                            <div className="mt-3 flex min-w-0 gap-2">

                                                <input
                                                    type="text"
                                                    value={couponCode}
                                                    onChange={e => {
                                                        setCouponCode(e.target.value.toUpperCase())
                                                        setCouponMessage('')
                                                    }}
                                                    placeholder="Enter coupon code"
                                                    disabled={couponLoading || Boolean(cart?.coupon)}
                                                    className="min-w-0 flex-1 rounded-xl border border-purple-100 bg-[#faf8ff] px-3 py-3 text-xs uppercase outline-none transition focus:border-purple-500 focus:bg-white sm:text-sm"
                                                />

                                                {cart?.coupon ? (

                                                    <button
                                                        type="button"
                                                        onClick={removeCoupon}
                                                        disabled={couponLoading}
                                                        className="shrink-0 rounded-xl bg-red-500 px-3 text-xs font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
                                                    >
                                                        {couponLoading ? 'Wait...' : 'Remove'}
                                                    </button>

                                                ) : (

                                                    <button
                                                        type="button"
                                                        onClick={applyCoupon}
                                                        disabled={couponLoading}
                                                        className="shrink-0 rounded-xl bg-purple-600 px-3 text-xs font-bold text-white transition hover:bg-purple-700 disabled:opacity-50 sm:px-4 sm:text-sm"
                                                    >
                                                        {couponLoading ? 'Applying...' : 'Apply'}
                                                    </button>

                                                )}

                                            </div>

                                            {couponMessage && (
                                                <p className={`mt-2 text-xs ${
                                                    couponSuccess
                                                        ? 'text-green-700'
                                                        : 'text-red-600'
                                                }`}>
                                                    {couponMessage}
                                                </p>
                                            )}

                                            {cart?.coupon && (
                                                <p className="mt-2 text-xs font-semibold text-green-700">
                                                    ✓ Coupon is applied to your cart.
                                                </p>
                                            )}

                                        </div>
                                    )}

                                    {/* TOTALS */}
                                    <div className="mt-5 space-y-3 border-t border-gray-100 pt-5">

                                        <div className="flex justify-between gap-3 text-sm text-gray-600">
                                            <span>Subtotal</span>
                                            <span className="font-semibold text-gray-800">
                                                ₹{checkoutSubtotal.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3 text-sm text-gray-600">
                                            <span>Discount</span>
                                            <span className="font-semibold text-green-600">
                                                −₹{checkoutDiscount.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3 text-sm text-gray-600">
                                            <span>Delivery Fee</span>
                                            <span className="font-semibold text-gray-800">
                                                ₹{checkoutDeliveryFee.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3 text-sm text-gray-600">
                                            <span>Tax</span>
                                            <span className="font-semibold text-gray-800">
                                                ₹{checkoutTax.toFixed(2)}
                                            </span>
                                        </div>

                                    </div>

                                    <div className="my-5 border-t border-dashed border-purple-200"></div>

                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-base font-extrabold text-gray-900">
                                            Total Amount
                                        </span>

                                        <span className="text-xl font-extrabold text-purple-700 sm:text-2xl">
                                            ₹{checkoutTotal.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* PLACE ORDER */}
                                    <button
                                        type="button"
                                        onClick={placeOrder}
                                        disabled={
                                            placingOrder ||
                                            couponLoading ||
                                            savingAddress ||
                                            deletingAddress !== '' ||
                                            changingDefault !== '' ||
                                            !storeId ||
                                            !selectedAddress ||
                                            showAddressForm ||
                                            (isBuyNow && !buyNowProduct) ||
                                            (!isBuyNow && !cart?.items?.length)
                                        }
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-purple-100 transition duration-300 hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-purple-200 disabled:cursor-not-allowed disabled:bg-purple-300 disabled:shadow-none"
                                    >
                                        {placingOrder
                                            ? 'Processing Order...'
                                            : 'Place Order'}

                                        {!placingOrder && <span>→</span>}
                                    </button>

                                    {showAddressForm && (
                                        <p className="mt-3 text-center text-xs text-gray-500">
                                            Save your address before placing the order.
                                        </p>
                                    )}

                                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                                        🔒 Secure and safe checkout
                                    </div>

                                </div>
                            </section>

                            {/* TRUST NOTE */}
                            <div className="mt-4 rounded-2xl border border-purple-100 bg-white p-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">💜</span>

                                    <div>
                                        <p className="text-sm font-bold text-gray-800">
                                            Thank you for shopping with Sellora!
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-gray-500">
                                            We are happy to make your shopping experience easy and convenient.
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>
                )}

                {/* FOOTER BRANDING */}
                <div className="mt-12 border-t border-purple-100 pt-6 text-center">
                    <p className="text-xs font-bold tracking-[3px] text-purple-600">
                        SHOP • SELL • GROW
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                        Discover more with Sellora
                    </p>
                </div>

            </div>
        </main>
    )
}
