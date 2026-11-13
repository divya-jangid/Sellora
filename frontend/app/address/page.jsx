
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const API_URL = 'http://localhost:8000/address'

const emptyForm = {
    name: '',
    phone: '',
    house: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    type: 'home',
    country: 'India',
    isDefault: false
}

const AddressPage = () => {
    const [addresses, setAddresses] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [editId, setEditId] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState('success')
    const [deleteId, setDeleteId] = useState(null)
    const [deleting, setDeleting] = useState(false)

    // GET ADDRESSES
    const fetchAddresses = async () => {
        try {
            setLoading(true)

            const res = await fetch(`${API_URL}/get`, {
                method: 'GET',
                credentials: 'include'
            })

            const data = await res.json()

            if (!res.ok || !data.status) {
                throw new Error(data.message || 'Failed to fetch addresses')
            }

            setAddresses(data.data || [])
        } catch (error) {
            setMessage(error.message || 'Unable to fetch addresses')
            setMessageType('error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAddresses()
    }, [])

    const showMessage = (text, type = 'success') => {
        setMessage(text)
        setMessageType(type)
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target

        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    // ADD / UPDATE ADDRESS
    const handleSubmit = async (e) => {
        e.preventDefault()
        setMessage('')

        try {
            setSaving(true)

            const payload = {
                name: form.name,
                phone: form.phone,
                houseNumber: form.house,
                street: form.street,
                landmark: form.landmark,
                city: form.city,
                state: form.state,
                pincode: form.pincode,
                country: form.country,
                type: form.type,
                isDefault: form.isDefault
            }

            const url = editId
                ? `${API_URL}/update/${editId}`
                : `${API_URL}/add`

            const res = await fetch(url, {
                method: editId ? 'PUT' : 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            const data = await res.json()

            if (!res.ok || !data.status) {
                throw new Error(data.message || 'Unable to save address')
            }

            showMessage(data.message || 'Address saved successfully')

            setForm(emptyForm)
            setEditId(null)
            setShowForm(false)

            await fetchAddresses()
        } catch (error) {
            showMessage(error.message || 'Something went wrong', 'error')
        } finally {
            setSaving(false)
        }
    }

    // EDIT ADDRESS
    const handleEdit = (address) => {
        setForm({
            name: address.name || '',
            phone: address.phone || '',
            house: address.houseNumber || '',
            street: address.street || '',
            landmark: address.landmark || '',
            city: address.city || '',
            state: address.state || '',
            pincode: address.pincode || '',
            type: address.type || 'home',
            country: address.country || 'India',
            isDefault: address.isDefault || false
        })

        setEditId(address._id)
        setShowForm(true)
        setMessage('')

        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // DELETE ADDRESS
    const handleDelete = async () => {
        if (!deleteId) return

        try {
            setDeleting(true)
            setMessage('')

            const res = await fetch(`${API_URL}/delete/${deleteId}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            const data = await res.json()

            if (!res.ok || !data.status) {
                throw new Error(data.message || 'Unable to delete address')
            }

            setAddresses(prev =>
                prev.filter(address => address._id !== deleteId)
            )

            setDeleteId(null)
            showMessage('Address deleted successfully')
            await fetchAddresses()
        } catch (error) {
            showMessage(error.message || 'Unable to delete address', 'error')
            setDeleteId(null)
        } finally {
            setDeleting(false)
        }
    }

    // SET DEFAULT ADDRESS
    const setDefaultAddress = async (address) => {
        try {
            setMessage('')

            const res = await fetch(
                `${API_URL}/set-default/${address._id}`,
                {
                    method: 'PUT',
                    credentials: 'include'
                }
            )

            const data = await res.json()

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Unable to change default address')
            }

            setAddresses(prev =>
                prev.map(item => ({
                    ...item,
                    isDefault: item._id === address._id
                }))
            )

            showMessage('Default address changed successfully')
        } catch (error) {
            showMessage(error.message || 'Unable to change default address', 'error')
        }
    }

    const openAddForm = () => {
        setForm(emptyForm)
        setEditId(null)
        setShowForm(true)
        setMessage('')

        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const cancelForm = () => {
        setForm(emptyForm)
        setEditId(null)
        setShowForm(false)
        setMessage('')
    }

    const inputClass =
        'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100'

    const labelClass =
        'mb-2 block text-sm font-semibold text-gray-700'

    return (
        <main className="min-h-screen bg-[#faf8ff] px-4 py-7 sm:px-6 sm:py-10">

            <div className="mx-auto max-w-6xl">

                {/* BREADCRUMB */}
                <div className="mb-7 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <Link href="/" className="transition hover:text-purple-700">
                        Home
                    </Link>

                    <span>/</span>

                    <Link href="/profile" className="transition hover:text-purple-700">
                        My Profile
                    </Link>

                    <span>/</span>

                    <span className="font-semibold text-purple-700">
                        My Addresses
                    </span>
                </div>

                {/* PAGE HEADER */}
                <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-purple-600 to-violet-500 px-6 py-8 text-white shadow-xl shadow-purple-200 sm:px-9 sm:py-10">

                    <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />

                    <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">

                        <div>
                            <span className="text-xs font-bold uppercase tracking-[2px] text-purple-200">
                                Sellora Account
                            </span>

                            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                                My Addresses
                            </h1>

                            <p className="mt-2 max-w-md text-sm leading-6 text-purple-100 sm:text-base">
                                Save and manage your delivery addresses for a faster checkout experience.
                            </p>

                            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium">
                                <span>📍</span>
                                <span>{addresses.length} Saved {addresses.length === 1 ? 'Address' : 'Addresses'}</span>
                            </div>
                        </div>

                        {!showForm && (
                            <button
                                type="button"
                                onClick={openAddForm}
                                className="relative inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-purple-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-purple-50"
                            >
                                <span className="text-xl">+</span>
                                Add New Address
                            </button>
                        )}

                    </div>
                </div>

                {/* MESSAGE */}
                {message && (
                    <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${
                        messageType === 'error'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-green-200 bg-green-50 text-green-700'
                    }`}>
                        <span className="font-bold">
                            {messageType === 'error' ? '!' : '✓'}
                        </span>
                        <p>{message}</p>
                    </div>
                )}

                {/* ADD / EDIT FORM */}
                {showForm && (
                    <div className="mb-9 overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">

                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-8">

                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-xl">
                                        📍
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                                            {editId ? 'Edit Address' : 'Add New Address'}
                                        </h2>

                                        <p className="mt-1 text-xs text-gray-500">
                                            Enter your delivery details below
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={cancelForm}
                                className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                                ✕ Close
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 sm:p-8">

                            {/* CONTACT DETAILS */}
                            <div className="mb-7">

                                <div className="mb-5 flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                                        👤
                                    </span>

                                    <div>
                                        <h3 className="font-bold text-gray-800">
                                            Contact Details
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Who should receive the delivery?
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                    <div>
                                        <label htmlFor="name" className={labelClass}>
                                            Full Name *
                                        </label>

                                        <input
                                            id="name"
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="Enter full name"
                                            className={inputClass}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className={labelClass}>
                                            Phone Number *
                                        </label>

                                        <input
                                            id="phone"
                                            type="tel"
                                            name="phone"
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="10-digit phone number"
                                            maxLength={10}
                                            pattern="[0-9]{10}"
                                            className={inputClass}
                                            required
                                        />
                                    </div>

                                </div>
                            </div>

                            <div className="mb-7 border-t border-gray-100" />

                            {/* ADDRESS DETAILS */}
                            <div className="mb-7">

                                <div className="mb-5 flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                                        🏠
                                    </span>

                                    <div>
                                        <h3 className="font-bold text-gray-800">
                                            Address Details
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Enter your complete delivery location
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                    {[
                                        {
                                            name: 'house',
                                            label: 'House / Flat Number',
                                            placeholder: 'House number, flat number'
                                        },
                                        {
                                            name: 'street',
                                            label: 'Street / Area',
                                            placeholder: 'Street, locality or area'
                                        },
                                        {
                                            name: 'landmark',
                                            label: 'Landmark',
                                            placeholder: 'Nearby landmark (optional)',
                                            optional: true
                                        },
                                        {
                                            name: 'city',
                                            label: 'City',
                                            placeholder: 'Enter city'
                                        },
                                        {
                                            name: 'state',
                                            label: 'State',
                                            placeholder: 'Enter state'
                                        },
                                        {
                                            name: 'pincode',
                                            label: 'PIN Code',
                                            placeholder: '6-digit PIN code'
                                        }
                                    ].map((field) => (
                                        <div key={field.name}>
                                            <label
                                                htmlFor={field.name}
                                                className={labelClass}
                                            >
                                                {field.label}
                                                {!field.optional && ' *'}
                                            </label>

                                            <input
                                                id={field.name}
                                                type="text"
                                                name={field.name}
                                                value={form[field.name]}
                                                onChange={handleChange}
                                                placeholder={field.placeholder}
                                                required={!field.optional}
                                                maxLength={
                                                    field.name === 'pincode' ? 6 : undefined
                                                }
                                                pattern={
                                                    field.name === 'pincode'
                                                        ? '[0-9]{6}'
                                                        : undefined
                                                }
                                                className={inputClass}
                                            />
                                        </div>
                                    ))}

                                    <div>
                                        <label htmlFor="country" className={labelClass}>
                                            Country *
                                        </label>

                                        <input
                                            id="country"
                                            type="text"
                                            name="country"
                                            value={form.country}
                                            onChange={handleChange}
                                            placeholder="Country"
                                            required
                                            className={inputClass}
                                        />
                                    </div>

                                </div>
                            </div>

                            <div className="mb-7 border-t border-gray-100" />

                            {/* PREFERENCES */}
                            <div>
                                <div className="mb-5 flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                                        ⚙️
                                    </span>

                                    <div>
                                        <h3 className="font-bold text-gray-800">
                                            Address Preferences
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Choose how to identify this address
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                    <div>
                                        <label htmlFor="type" className={labelClass}>
                                            Address Type
                                        </label>

                                        <select
                                            id="type"
                                            name="type"
                                            value={form.type}
                                            onChange={handleChange}
                                            className={inputClass}
                                        >
                                            <option value="home">🏠 Home</option>
                                            <option value="work">🏢 Work</option>
                                            <option value="other">📍 Other</option>
                                        </select>
                                    </div>

                                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-purple-100 bg-purple-50 p-4 transition hover:border-purple-300">
                                        <input
                                            id="isDefault"
                                            name="isDefault"
                                            type="checkbox"
                                            checked={form.isDefault}
                                            onChange={handleChange}
                                            className="h-5 w-5 shrink-0 accent-purple-600"
                                        />

                                        <span>
                                            <span className="block text-sm font-bold text-gray-800">
                                                Set as Default
                                            </span>
                                            <span className="mt-1 block text-xs text-gray-500">
                                                Use this address by default
                                            </span>
                                        </span>
                                    </label>

                                </div>
                            </div>

                            {/* FORM ACTIONS */}
                            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={cancelForm}
                                    className="rounded-xl border border-gray-200 px-7 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-purple-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-purple-100 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving
                                        ? 'Saving...'
                                        : editId
                                            ? 'Update Address'
                                            : 'Save Address'}
                                </button>

                            </div>

                        </form>
                    </div>
                )}

                {/* SAVED ADDRESSES */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

                    <div>
                        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                            Saved Addresses
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Your saved delivery locations
                        </p>
                    </div>

                    <span className="rounded-full bg-purple-100 px-4 py-2 text-xs font-bold text-purple-700">
                        {addresses.length} {addresses.length === 1 ? 'ADDRESS' : 'ADDRESSES'}
                    </span>

                </div>

                {/* LOADING */}
                {loading ? (
                    <div className="rounded-2xl border border-purple-100 bg-white px-5 py-16 text-center shadow-sm">

                        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600" />

                        <p className="mt-4 text-sm font-medium text-gray-500">
                            Loading your saved addresses...
                        </p>
                    </div>

                ) : addresses.length === 0 ? (

                    /* EMPTY STATE */
                    <div className="rounded-2xl border border-dashed border-purple-200 bg-white px-5 py-14 text-center shadow-sm">

                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 text-4xl">
                            📍
                        </div>

                        <h3 className="mt-5 text-xl font-bold text-gray-900">
                            No Addresses Yet
                        </h3>

                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                            You haven't saved any delivery address. Add your first address to make checkout faster.
                        </p>

                        {!showForm && (
                            <button
                                type="button"
                                onClick={openAddForm}
                                className="mt-6 rounded-xl bg-purple-600 px-7 py-3 font-semibold text-white shadow-md transition hover:bg-purple-700"
                            >
                                + Add Your First Address
                            </button>
                        )}

                    </div>

                ) : (

                    /* ADDRESS CARDS */
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                        {addresses.map((address) => (

                            <div
                                key={address._id}
                                className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-6 ${
                                    address.isDefault
                                        ? 'border-purple-300 ring-1 ring-purple-100'
                                        : 'border-gray-100'
                                }`}
                            >

                                {address.isDefault && (
                                    <div className="absolute right-0 top-0 rounded-bl-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white">
                                        ✓ DEFAULT ADDRESS
                                    </div>
                                )}

                                {/* CARD HEADER */}
                                <div className="flex items-start gap-3">

                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                                        {address.type === 'work'
                                            ? '🏢'
                                            : address.type === 'other'
                                                ? '📍'
                                                : '🏠'}
                                    </div>

                                    <div className="min-w-0 pt-1">
                                        <h3 className="break-words font-bold text-gray-900">
                                            {address.name}
                                        </h3>

                                        <span className="mt-1 inline-block rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold capitalize text-gray-600">
                                            {address.type || 'home'}
                                        </span>
                                    </div>

                                </div>

                                {/* ADDRESS DETAILS */}
                                <div className="mt-5 space-y-2 text-sm leading-6 text-gray-600">

                                    <p className="break-words font-medium text-gray-800">
                                        {address.houseNumber}, {address.street}
                                    </p>

                                    {address.landmark && (
                                        <p>
                                            <span className="font-medium text-gray-700">
                                                Landmark:
                                            </span>{' '}
                                            {address.landmark}
                                        </p>
                                    )}

                                    <p>
                                        {address.city}, {address.state} - {address.pincode}
                                    </p>

                                    <p>{address.country || 'India'}</p>

                                </div>

                                {/* PHONE */}
                                <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-3 text-sm">
                                    <span>📞</span>
                                    <span className="font-semibold text-gray-700">
                                        {address.phone}
                                    </span>
                                </div>

                                {/* CARD ACTIONS */}
                                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">

                                    <button
                                        type="button"
                                        onClick={() => handleEdit(address)}
                                        className="rounded-lg border border-purple-200 px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-50"
                                    >
                                        ✎ Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setDeleteId(address._id)}
                                        className="rounded-lg border border-red-100 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                                    >
                                        🗑 Delete
                                    </button>

                                    {!address.isDefault && (
                                        <button
                                            type="button"
                                            onClick={() => setDefaultAddress(address)}
                                            className="ml-auto rounded-lg px-2 py-2.5 text-xs font-bold text-purple-700 transition hover:bg-purple-50"
                                        >
                                            Set as Default
                                        </button>
                                    )}

                                </div>

                            </div>

                        ))}

                    </div>
                )}

                {/* BACK TO PROFILE */}
                <div className="mt-9 border-t border-purple-100 pt-6">
                    <Link
                        href="/profile"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 transition hover:text-purple-900"
                    >
                        <span>←</span>
                        Back to My Profile
                    </Link>
                </div>

                {/* FOOTER */}
                <p className="mt-8 text-center text-xs text-gray-400">
                    © 2026 Sellora. Your account, your shopping experience.
                </p>

            </div>

            {/* DELETE CONFIRMATION MODAL */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

                        <div className="bg-red-50 px-6 py-6">

                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                                🗑️
                            </div>

                            <h2 className="mt-4 text-xl font-bold text-gray-900">
                                Delete Address?
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-gray-600">
                                Are you sure you want to delete this saved address? This action cannot be undone.
                            </p>

                        </div>

                        <div className="flex flex-col-reverse gap-3 p-6 sm:flex-row">

                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setDeleteId(null)}
                                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDelete}
                                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </main>
    )
}

export default AddressPage
