
'use client'

import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useLocationContext } from '@/context/LocationContext'

function LocationModal() {
    const {
        selectedStore,
        locationLoading,
        showLocationModal,
        saveLocation
    } = useLocationContext()

    const [address, setAddress] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')


    const findStore = async (latitude, longitude, addressText) => {
        try {
            setLoading(true)
            setError('')

            const res = await axios.post(
                'http://localhost:8000/store/find-nearest',
                {
                    latitude,
                    longitude
                }
            )

            console.log('NEAREST STORE RESPONSE:', res.data)

            if (res.data?.status && res.data?.data?.store) {
                console.log('STORE FOUND:', res.data.data.store)

                saveLocation(
                    res.data.data.store,
                    {
                        latitude,
                        longitude,
                        address: addressText
                    }
                )

                toast.success('Location selected successfully!')
            } else {
                setError('Service is not available in your area.')
            }

        } catch (error) {
            console.log('FIND STORE ERROR:', error)
            console.log('ERROR RESPONSE:', error.response?.data)

            setError(
                error.response?.data?.message ||
                'Service is not available in your area.'
            )

        } finally {
            setLoading(false)
        }
    }


    
    // Use current browser location
    const handleCurrentLocation = () => {
        setError('')

        if (!navigator.geolocation) {
            setError('Your browser does not support location.')
            return
        }

        setLoading(true)

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords

                await findStore(
                    latitude,
                    longitude,
                    'Current Location'
                )
            },
            () => {
                setLoading(false)
                setError('Please allow location access or enter your address manually.')
            },
            {
                enableHighAccuracy: true,
                timeout: 15000
            }
        )
    }

    // Search address using OpenStreetMap
    const handleManualLocation = async () => {
        if (!address.trim()) {
            setError('Please enter your address.')
            return
        }

        try {
            setLoading(true)
            setError('')

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`
            )

            const data = await response.json()

            if (!data.length) {
                setError('Location not found. Please enter a valid address.')
                setLoading(false)
                return
            }

            const latitude = Number(data[0].lat)
            const longitude = Number(data[0].lon)

            await findStore(
                latitude,
                longitude,
                data[0].display_name
            )
        } catch (error) {
            setLoading(false)
            setError('Unable to find location. Please try again.')
        }
    }

    if (locationLoading || !showLocationModal) {
        return null
    }
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

                <h2 className="text-2xl font-bold text-gray-800">
                    Choose Your Location
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                    Enter your location to check product availability in your area.
                </p>

                <button
                    onClick={handleCurrentLocation}
                    disabled={loading}
                    className="mt-6 w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                    {loading ? 'Please wait...' : '📍 Use Current Location'}
                </button>

                <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200"></div>
                    <span className="text-sm text-gray-400">OR</span>
                    <div className="h-px flex-1 bg-gray-200"></div>
                </div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Enter your address
                </label>

                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter area, city or full address"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-purple-500"
                />

                <button
                    onClick={handleManualLocation}
                    disabled={loading}
                    className="mt-3 w-full rounded-lg border border-purple-600 px-4 py-3 font-semibold text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                >
                    {loading ? 'Finding Store...' : 'Find Store'}
                </button>

                {error && (
                    <p className="mt-4 text-sm text-red-600">
                        {error}
                    </p>
                )}

            </div>
        </div>
    )
}

export default LocationModal
