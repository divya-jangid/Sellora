
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const API = 'http://localhost:8000'

const PendingReassignment = () => {

    const [deliveries, setDeliveries] = useState([])
    const [partners, setPartners] = useState([])
    const [selectedPartners, setSelectedPartners] = useState({})
    const [loading, setLoading] = useState(true)
    const [assigning, setAssigning] = useState(null)

    // GET PENDING DELIVERIES
    const getPendingReassignment = async () => {
        try {
            const res = await axios.get(
                `${API}/deliverypartner/pending-reassignment`,
                { withCredentials: true }
            )

            setDeliveries(res.data.deliveries || [])

        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Failed to fetch deliveries'
            )
        } finally {
            setLoading(false)
        }
    }

    // GET AVAILABLE PARTNERS
    const getAvailablePartners = async () => {
        try {
            const res = await axios.get(
                `${API}/deliverypartner/get-all`,
                { withCredentials: true }
            )

            setPartners(res.data.deliveryPartners || [])

        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Failed to fetch partners'
            )
        }
    }

    useEffect(() => {
        getPendingReassignment()
        getAvailablePartners()
    }, [])

    // ASSIGN NEW PARTNER
    const handleAssign = async (delivery) => {

        const partnerId = selectedPartners[delivery._id]

        if (!partnerId) {
            toast.error('Please select a delivery partner')
            return
        }

        try {
            setAssigning(delivery._id)

            await axios.post(
                `${API}/delivery/assign`,
                {
                    orderId: delivery.order?._id,
                    deliveryPartnerId: partnerId
                },
                { withCredentials: true }
            )

            toast.success('Delivery partner assigned successfully')

            setSelectedPartners(prev => ({
                ...prev,
                [delivery._id]: ''
            }))

            await getPendingReassignment()
            await getAvailablePartners()

        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Partner assignment failed'
            )
        } finally {
            setAssigning(null)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
                    <p className="text-sm font-medium text-slate-500">
                        Loading pending deliveries...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-full w-full min-w-0 max-w-full overflow-x-hidden bg-slate-50 p-3 sm:p-5 lg:p-6">

            {/* HEADER */}
            <div className="mb-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                            Pending Reassignment
                        </h1>

                        <p className="mt-2 text-sm text-slate-500 sm:text-base">
                            Assign a new delivery partner to pending deliveries.
                        </p>
                    </div>

                    <div className="flex w-fit items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                            !
                        </span>

                        <div>
                            <p className="text-xs text-orange-600">
                                Pending Deliveries
                            </p>
                            <p className="text-lg font-bold text-orange-700">
                                {deliveries.length}
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* EMPTY STATE */}
            {deliveries.length === 0 ? (

                <div className="rounded-2xl border border-indigo-100 bg-white px-4 py-12 text-center shadow-sm sm:py-16">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                        📦
                    </div>

                    <h2 className="text-lg font-bold text-slate-800">
                        No Pending Reassignment
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        All deliveries are currently assigned.
                    </p>
                </div>

            ) : (

                <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">

                    {/* SECTION HEADER */}
                    <div className="border-b border-slate-100 px-4 py-4 sm:px-5 sm:py-5">
                        <h2 className="text-lg font-bold text-slate-800">
                            Delivery Assignments
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Select an available delivery partner for each order.
                        </p>
                    </div>

                    {/* MOBILE CARDS */}
                    <div className="grid grid-cols-1 gap-4 p-3 sm:p-4 lg:hidden">

                        {deliveries.map((delivery) => (

                            <div
                                key={delivery._id}
                                className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                            >

                                {/* CARD HEADER */}
                                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">

                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-400">
                                            Order ID
                                        </p>

                                        <p className="mt-1 break-all text-sm font-bold text-slate-800">
                                            {delivery.order?.orderNumber ||
                                                delivery.order?._id ||
                                                'N/A'}
                                        </p>
                                    </div>

                                    <span className="shrink-0 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold capitalize text-red-600">
                                        {delivery.deliveryStatus}
                                    </span>

                                </div>

                                {/* DELIVERY DETAILS */}
                                <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2">

                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-400">
                                            Previous Partner
                                        </p>

                                        <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                                            {delivery.deliveryPartner?.user?.firstName
                                                ? `${delivery.deliveryPartner.user.firstName} ${delivery.deliveryPartner.user.lastName || ''}`
                                                : 'N/A'}
                                        </p>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-400">
                                            Store
                                        </p>

                                        <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                                            {delivery.store?.name || 'N/A'}
                                        </p>
                                    </div>

                                </div>

                                {/* SELECT PARTNER */}
                                <div className="border-t border-slate-100 pt-4">

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Select New Delivery Partner
                                    </label>

                                    <select
                                        value={selectedPartners[delivery._id] || ''}
                                        onChange={(e) =>
                                            setSelectedPartners(prev => ({
                                                ...prev,
                                                [delivery._id]: e.target.value
                                            }))
                                        }
                                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    >
                                        <option value="">
                                            Select Partner
                                        </option>

                                        {partners.map((partner) => (
                                            <option
                                                key={partner._id}
                                                value={partner._id}
                                            >
                                                {partner.user?.firstName} {partner.user?.lastName}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        type="button"
                                        onClick={() => handleAssign(delivery)}
                                        disabled={assigning === delivery._id}
                                        className="mt-3 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {assigning === delivery._id
                                            ? 'Assigning...'
                                            : 'Assign Partner'}
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden w-full min-w-0 overflow-x-auto lg:block">

                        <table className="w-full min-w-[1000px] text-left text-sm">

                            <thead className="bg-gradient-to-r from-indigo-50 to-violet-50 text-slate-700">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">
                                        Order ID
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        Previous Partner
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        Store
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        Status
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        Select Partner
                                    </th>

                                    <th className="px-5 py-4 text-center font-semibold">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {deliveries.map((delivery) => (

                                    <tr
                                        key={delivery._id}
                                        className="transition-colors hover:bg-indigo-50/40"
                                    >

                                        <td className="px-5 py-4 font-semibold text-slate-800">
                                            {delivery.order?.orderNumber ||
                                                delivery.order?._id ||
                                                'N/A'}
                                        </td>

                                        <td className="px-5 py-4 text-slate-600">
                                            {delivery.deliveryPartner?.user?.firstName
                                                ? `${delivery.deliveryPartner.user.firstName} ${delivery.deliveryPartner.user.lastName || ''}`
                                                : 'N/A'}
                                        </td>

                                        <td className="px-5 py-4 text-slate-600">
                                            {delivery.store?.name || 'N/A'}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="inline-flex rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold capitalize text-red-600">
                                                {delivery.deliveryStatus}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <select
                                                value={selectedPartners[delivery._id] || ''}
                                                onChange={(e) =>
                                                    setSelectedPartners(prev => ({
                                                        ...prev,
                                                        [delivery._id]: e.target.value
                                                    }))
                                                }
                                                className="w-full min-w-[190px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                            >
                                                <option value="">
                                                    Select Partner
                                                </option>

                                                {partners.map((partner) => (
                                                    <option
                                                        key={partner._id}
                                                        value={partner._id}
                                                    >
                                                        {partner.user?.firstName} {partner.user?.lastName}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleAssign(delivery)}
                                                disabled={assigning === delivery._id}
                                                className="whitespace-nowrap rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {assigning === delivery._id
                                                    ? 'Assigning...'
                                                    : 'Assign Partner'}
                                            </button>
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                </div>
            )}

        </div>
    )
}

export default PendingReassignment
