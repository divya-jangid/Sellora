
import React, { createContext, useContext, useEffect, useState } from 'react'
import API from '../api/axiosInstance'
import {toast} from 'react-hot-toast'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const checkUser = async () => {
        try {
            const res = await API.get('/user/check-user')

            if (res.data.status && res.data.user) {
                setUser(res.data.user)
            } else {
                setUser(null)
            }

        } catch (error) {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    // Logout
   const logout = async () => {
    try {
        const res = await API.post(
            '/admin/logout',
            {},
        )

        if (res.data.status) {
            toast.success('Logout Successfully')
            setUser(null)
        }

    } catch (error) {
        toast.error(
            error.response?.data?.message || 'Logout failed'
        )
    }
}

    useEffect(() => {
        checkUser()
    }, [])

    return (
        <AuthContext.Provider value={{ user, setUser, loading, checkUser, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
