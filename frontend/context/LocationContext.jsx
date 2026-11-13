
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const LocationContext = createContext()

export const LocationProvider = ({ children }) => {
    const [selectedStore, setSelectedStore] = useState(null)
    const [customerLocation, setCustomerLocation] = useState(null)
    const [locationLoading, setLocationLoading] = useState(true)
    const [showLocationModal, setShowLocationModal] = useState(false)

    // Load saved location
    useEffect(() => {
        try {
            const savedStore = localStorage.getItem('selectedStore')
            const savedLocation = localStorage.getItem('customerLocation')

            if (savedStore && savedLocation) {
                setSelectedStore(JSON.parse(savedStore))
                setCustomerLocation(JSON.parse(savedLocation))
            } else {
                setShowLocationModal(true)
            }
        } catch (error) {
            console.log('LOCATION LOAD ERROR:', error)
            setShowLocationModal(true)
        } finally {
            setLocationLoading(false)
        }
    }, [])

    // Save selected store and location
    const saveLocation = (store, location) => {
        setSelectedStore(store)
        setCustomerLocation(location)

        localStorage.setItem('selectedStore', JSON.stringify(store))
        localStorage.setItem('customerLocation', JSON.stringify(location))

        setShowLocationModal(false)
    }

    // Open location popup
    const openLocationModal = () => {
        setShowLocationModal(true)
    }

    // Clear location
    const clearLocation = () => {
        setSelectedStore(null)
        setCustomerLocation(null)

        localStorage.removeItem('selectedStore')
        localStorage.removeItem('customerLocation')

        setShowLocationModal(true)
    }

    return (
        <LocationContext.Provider
            value={{
                selectedStore,
                customerLocation,
                locationLoading,
                showLocationModal,
                saveLocation,
                openLocationModal,
                clearLocation
            }}
        >
            {children}
        </LocationContext.Provider>
    )
}

export const useLocationContext = () => useContext(LocationContext)
