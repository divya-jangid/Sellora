
import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import {toast} from 'react-hot-toast'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const checkUser = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/user/check-user',
                { withCredentials: true }
            )

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
        const res = await axios.post(
            'http://localhost:8000/admin/logout',
            {},
            { withCredentials: true }
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
