
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

    // GET: Fetch saved addresses
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
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAddresses()
    }, [])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target

        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    // POST / PUT: Add or update address
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

            setMessage(data.message || 'Address saved successfully')
            setForm(emptyForm)
            setEditId(null)
            setShowForm(false)

            await fetchAddresses()
        } catch (error) {
            setMessage(error.message || 'Something went wrong')
        } finally {
            setSaving(false)
        }
    }

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
    }

    // DELETE: Delete address
    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            'Are you sure you want to delete this address?'
        )

        if (!confirmDelete) return

        try {
            setMessage('')

            const res = await fetch(`${API_URL}/delete/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            const data = await res.json()

            if (!res.ok || !data.status) {
                throw new Error(data.message || 'Unable to delete address')
            }

            setAddresses(prev => prev.filter(address => address._id !== id))

            setMessage('Address deleted successfully')

            await fetchAddresses()

        } catch (error) {
            setMessage(error.message || 'Unable to delete address')
        }
    }

    // PUT: Set an address as default
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

            // Immediately update UI
            setAddresses(prev =>
                prev.map(item => ({
                    ...item,
                    isDefault: item._id === address._id
                }))
            )

            setMessage('Default address changed successfully')

        } catch (error) {
            setMessage(error.message || 'Unable to change default address')
        }
    }

    

    const openAddForm = () => {
        setForm(emptyForm)
        setEditId(null)
        setShowForm(true)
        setMessage('')
    }

    const cancelForm = () => {
        setForm(emptyForm)
        setEditId(null)
        setShowForm(false)
        setMessage('')
    }

    return (
        <main className="min-h-screen bg-purple-50 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-5xl">

                {/* Breadcrumb */}
                <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
                    <Link href="/" className="hover:text-purple-700">
                        Home
                    </Link>
                    <span>/</span>
                    <span className="font-medium text-purple-700">
                        My Address
                    </span>
                </div>

                {/* Page Heading */}
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
                            Sellora Account
                        </p>

                        <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
                            My Addresses
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Manage your delivery addresses.
                        </p>
                    </div>

                    {!showForm && (
                        <button
                            type="button"
                            onClick={openAddForm}
                            className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-purple-700"
                        >
                            + Add New Address
                        </button>
                    )}
                </div>

                {/* API Message */}
                {message && (
                    <div className="mb-5 rounded-xl border border-purple-100 bg-white p-4 text-sm text-purple-800">
                        {message}
                    </div>
                )}

                {/* Add / Edit Form */}
                {showForm && (
                    <div className="mb-8 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-6 flex items-center justify-between gap-3">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editId ? 'Edit Address' : 'Add New Address'}
                            </h2>

                            <button
                                type="button"
                                onClick={cancelForm}
                                className="text-sm font-semibold text-gray-500 hover:text-red-600"
                            >
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                {[
                                    {
                                        name: 'name',
                                        label: 'Full Name',
                                        placeholder: 'Enter full name'
                                    },
                                    {
                                        name: 'phone',
                                        label: 'Phone Number',
                                        placeholder: 'Enter 10-digit phone number'
                                    },
                                    {
                                        name: 'house',
                                        label: 'House / Flat Number',
                                        placeholder: 'Enter house or flat number'
                                    },
                                    {
                                        name: 'street',
                                        label: 'Street / Area',
                                        placeholder: 'Enter street or area'
                                    },
                                    {
                                        name: 'landmark',
                                        label: 'Landmark (Optional)',
                                        placeholder: 'Nearby landmark'
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
                                        placeholder: 'Enter 6-digit PIN code'
                                    }
                                ].map((field) => (
                                    <div key={field.name}>
                                        <label
                                            htmlFor={field.name}
                                            className="mb-2 block text-sm font-semibold text-gray-700"
                                        >
                                            {field.label}
                                        </label>

                                        <input
                                            id={field.name}
                                            type="text"
                                            name={field.name}
                                            value={form[field.name]}
                                            onChange={handleChange}
                                            placeholder={field.placeholder}
                                            required={
                                                !['landmark'].includes(field.name)
                                            }
                                            maxLength={
                                                field.name === 'phone'
                                                    ? 10
                                                    : field.name === 'pincode'
                                                        ? 6
                                                        : undefined
                                            }
                                            pattern={
                                                field.name === 'phone'
                                                    ? '[0-9]{10}'
                                                    : field.name === 'pincode'
                                                        ? '[0-9]{6}'
                                                        : undefined
                                            }
                                            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                        />
                                    </div>
                                ))}

                                <div>
                                    <label
                                        htmlFor="type"
                                        className="mb-2 block text-sm font-semibold text-gray-700"
                                    >
                                        Address Type
                                    </label>

                                    <select
                                        id="type"
                                        name="type"
                                        value={form.type}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-purple-500"
                                    >
                                        <option value="home">Home</option>
                                        <option value="work">Work</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-3 pt-7">
                                    <input
                                        id="isDefault"
                                        name="isDefault"
                                        type="checkbox"
                                        checked={form.isDefault}
                                        onChange={handleChange}
                                        className="h-4 w-4 accent-purple-600"
                                    />

                                    <label
                                        htmlFor="isDefault"
                                        className="text-sm font-semibold text-gray-700"
                                    >
                                        Set as default address
                                    </label>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-purple-600 px-7 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving
                                        ? 'Saving...'
                                        : editId
                                            ? 'Update Address'
                                            : 'Save Address'}
                                </button>

                                <button
                                    type="button"
                                    onClick={cancelForm}
                                    className="rounded-xl border border-gray-200 px-7 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Saved Addresses Heading */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        Saved Addresses
                    </h2>

                    <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                        {addresses.length}{' '}
                        {addresses.length === 1 ? 'Address' : 'Addresses'}
                    </span>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="rounded-2xl bg-white px-5 py-14 text-center text-gray-500">
                        Loading addresses...
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-purple-200 bg-white px-5 py-14 text-center">
                        <div className="text-5xl">📍</div>

                        <h3 className="mt-4 text-xl font-bold text-gray-900">
                            No addresses saved
                        </h3>

                        <p className="mt-2 text-gray-500">
                            Add your delivery address to get started.
                        </p>

                        {!showForm && (
                            <button
                                type="button"
                                onClick={openAddForm}
                                className="mt-5 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-700"
                            >
                                Add Your First Address
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {addresses.map((address) => (
                            <div
                                key={address._id}
                                className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-xl">
                                            {address.type === 'work'
                                                ? '🏢'
                                                : address.type === 'other'
                                                    ? '📍'
                                                    : '🏠'}
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-gray-900">
                                                {address.name}
                                            </h3>

                                            <span className="mt-1 inline-block rounded-md bg-gray-100 px-2 py-1 text-xs font-medium capitalize text-gray-600">
                                                {address.type}
                                            </span>
                                        </div>
                                    </div>

                                    {address.isDefault && (
                                        <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                            Default
                                        </span>
                                    )}
                                </div>

                                <div className="mt-5 space-y-1 text-sm leading-6 text-gray-600">
                                    <p>
                                        {address.houseNumber}, {address.street}
                                    </p>

                                    {address.landmark && (
                                        <p>Landmark: {address.landmark}</p>
                                    )}

                                    <p>
                                        {address.city}, {address.state} - {address.pincode}
                                    </p>

                                    <p>{address.country || 'India'}</p>

                                    <p className="pt-1 font-medium text-gray-800">
                                        Phone: {address.phone}
                                    </p>
                                </div>

                                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(address)}
                                        className="rounded-lg border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(address._id)}
                                        className="rounded-lg border border-red-100 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                                    >
                                        Delete
                                    </button>

                                    {!address.isDefault && (
                                        <button
                                            type="button"
                                            onClick={() => setDefaultAddress(address)}
                                            className="text-sm font-semibold text-purple-700 hover:text-purple-900 sm:ml-auto"
                                        >
                                            Set as Default
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Back to Profile */}
                <div className="mt-8">
                    <Link
                        href="/profile"
                        className="font-semibold text-purple-700 hover:text-purple-900"
                    >
                        ← Back to My Profile
                    </Link>
                </div>
            </div>
        </main>
    )
}

export default AddressPage
