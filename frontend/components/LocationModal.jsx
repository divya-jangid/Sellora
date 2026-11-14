
'use client'

import { useState, useEffect, useRef } from 'react'
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
    const [suggestions, setSuggestions] = useState([])
    const [selectedLocation, setSelectedLocation] = useState(null)

    const [loading, setLoading] = useState(false)
    const [searching, setSearching] = useState(false)
    const [error, setError] = useState('')

    const debounceRef = useRef(null)
    const abortRef = useRef(null)

    // =====================================
    // PHOTON API - LOCATION AUTOCOMPLETE
    // =====================================
    useEffect(() => {
        if (
            !address.trim() ||
            address.trim().length < 3 ||
            selectedLocation
        ) {
            setSuggestions([])
            setSearching(false)
            return
        }

        clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(async () => {
            try {
                abortRef.current?.abort()

                const controller = new AbortController()
                abortRef.current = controller

                setSearching(true)

                const response = await axios.get(
                    'https://photon.komoot.io/api/',
                    {
                        params: {
                            q: address,
                            limit: 6
                        },
                        signal: controller.signal
                    }
                )

                setSuggestions(response.data.features || [])

            } catch (err) {
                if (
                    err.code !== 'ERR_CANCELED' &&
                    err.name !== 'CanceledError'
                ) {
                    console.log('PHOTON API ERROR:', err)
                }
            } finally {
                if (!abortRef.current?.signal.aborted) {
                    setSearching(false)
                }
            }
        }, 400)

        return () => {
            clearTimeout(debounceRef.current)
            abortRef.current?.abort()
        }
    }, [address, selectedLocation])

    // =====================================
    // SELECT LOCATION FROM SUGGESTIONS
    // =====================================
    const handleSelectLocation = (place) => {
        const properties = place.properties

        // Photon coordinates format:
        // [longitude, latitude]
        const [longitude, latitude] =
            place.geometry.coordinates

        const locationName = [
            properties.name,
            properties.street,
            properties.district,
            properties.city || properties.town || properties.village,
            properties.state,
            properties.country
        ]
            .filter((value, index, self) =>
                value && self.indexOf(value) === index
            )
            .join(', ')

        // Save selected location and coordinates
        setSelectedLocation({
            latitude: Number(latitude),
            longitude: Number(longitude),
            address: locationName
        })

        setAddress(locationName)
        setSuggestions([])
        setError('')

        console.log('SELECTED LOCATION:', {
            latitude,
            longitude,
            address: locationName
        })
    }

    // =====================================
    // FIND NEAREST STORE
    // =====================================
    const findStore = async (
        latitude,
        longitude,
        addressText
    ) => {
        try {
            setLoading(true)
            setError('')

            console.log('FIND STORE COORDINATES:', {
                latitude,
                longitude
            })

            const res = await axios.post(
                'http://localhost:8000/store/find-nearest',
                {
                    latitude,
                    longitude
                }
            )

            console.log('NEAREST STORE RESPONSE:', res.data)

            if (
                res.data?.status &&
                res.data?.data?.store
            ) {
                const store = res.data.data.store

                console.log('STORE FOUND:', store)

                saveLocation(
                    store,
                    {
                        latitude,
                        longitude,
                        address: addressText
                    }
                )

                toast.success(
                    'Location selected successfully!'
                )

            } else {
                setError(
                    'Service is not available in your area.'
                )
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

    // =====================================
    // USE CURRENT BROWSER LOCATION
    // =====================================
    const handleCurrentLocation = () => {
        setError('')

        if (!navigator.geolocation) {
            setError(
                'Your browser does not support location.'
            )
            return
        }

        setLoading(true)

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const {
                    latitude,
                    longitude
                } = position.coords

                // Directly pass current coordinates
                await findStore(
                    latitude,
                    longitude,
                    'Current Location'
                )
            },
            () => {
                setLoading(false)

                setError(
                    'Please allow location access or enter your address manually.'
                )
            },
            {
                enableHighAccuracy: true,
                timeout: 15000
            }
        )
    }

    // =====================================
    // MANUAL LOCATION - FIND STORE
    // =====================================
    const handleManualLocation = async () => {
        setError('')

        if (!address.trim()) {
            setError('Please enter your address.')
            return
        }

        if (!selectedLocation) {
            setError(
                'Please select a location from the suggestions.'
            )
            return
        }

        // Pass selected Photon latitude and longitude
        await findStore(
            selectedLocation.latitude,
            selectedLocation.longitude,
            selectedLocation.address
        )
    }

    // =====================================
    // UI
    // =====================================
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

                {/* CURRENT LOCATION BUTTON */}
                <button
                    onClick={handleCurrentLocation}
                    disabled={loading}
                    className="mt-6 w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                    {loading
                        ? 'Please wait...'
                        : '📍 Use Current Location'}
                </button>

                {/* DIVIDER */}
                <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200"></div>

                    <span className="text-sm text-gray-400">
                        OR
                    </span>

                    <div className="h-px flex-1 bg-gray-200"></div>
                </div>

                {/* ADDRESS INPUT */}
                <label className="mb-2 block text-sm font-medium text-gray-700">
                    Enter your address
                </label>

                <div className="relative">

                    <input
                        type="text"
                        value={address}
                        onChange={(e) => {
                            setAddress(e.target.value)
                            setSelectedLocation(null)
                            setError('')
                        }}
                        placeholder="Search area, city or full address..."
                        autoComplete="off"
                        disabled={loading}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 outline-none focus:border-purple-500"
                    />

                    {/* SEARCH LOADER */}
                    {searching && (
                        <div className="absolute right-3 top-3.5">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
                        </div>
                    )}

                    {/* AUTOCOMPLETE DROPDOWN */}
                    {suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">

                            {suggestions.map((place, index) => {
                                const p = place.properties

                                const title =
                                    p.name ||
                                    p.street ||
                                    'Unknown Location'

                                const subtitle = [
                                    p.district,
                                    p.city || p.town || p.village,
                                    p.state,
                                    p.country
                                ]
                                    .filter((value, i, arr) =>
                                        value &&
                                        arr.indexOf(value) === i
                                    )
                                    .join(', ')

                                return (
                                    <button
                                        key={`${place.geometry.coordinates.join(',')}-${index}`}
                                        type="button"
                                        onClick={() =>
                                            handleSelectLocation(place)
                                        }
                                        className="flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-0 hover:bg-purple-50"
                                    >
                                        <span className="mt-1 text-purple-600">
                                            📍
                                        </span>

                                        <span className="min-w-0">
                                            <span className="block font-medium text-gray-800">
                                                {title}
                                            </span>

                                            <span className="block text-xs text-gray-500">
                                                {subtitle}
                                            </span>
                                        </span>
                                    </button>
                                )
                            })}

                        </div>
                    )}

                    {/* NO RESULTS */}
                    {!searching &&
                        address.trim().length >= 3 &&
                        suggestions.length === 0 &&
                        !selectedLocation && (
                            <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border bg-white p-3 text-sm text-gray-500 shadow-lg">
                                No locations found.
                            </div>
                        )}

                </div>

                {/* SELECTED LOCATION DETAILS */}
                {selectedLocation && (
                    <div className="mt-3 rounded-lg bg-purple-50 p-3 text-sm text-purple-800">

                        <p className="font-semibold">
                            ✓ Selected Location
                        </p>

                        <p className="mt-1">
                            {selectedLocation.address}
                        </p>

                        <p className="mt-1 text-xs text-purple-600">
                            Lat: {selectedLocation.latitude} |
                            Lng: {selectedLocation.longitude}
                        </p>

                    </div>
                )}

                {/* FIND STORE BUTTON */}
                <button
                    onClick={handleManualLocation}
                    disabled={loading || !selectedLocation}
                    className="mt-4 w-full rounded-lg border border-purple-600 px-4 py-3 font-semibold text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading
                        ? 'Finding Store...'
                        : 'Find Store'}
                </button>

                {/* ERROR */}
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
