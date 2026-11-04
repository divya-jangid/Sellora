
import React, { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
  Outlet,
  useLocation
} from 'react-router-dom'
import axios from 'axios'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import User from './pages/User'
import Products from './pages/Products'
import Category from './pages/Category'
import Subcategories from './pages/Subcategories'
import Role from './pages/Role'
import Brand from './pages/Brand'
import Productvariant from './pages/Productvariant'
import Store from './pages/Store'
import Template from './pages/Template'
import Inventory from './pages/Inventory'
import Orders from './pages/Orders'

import toast, { Toaster } from 'react-hot-toast';


// LOGIN + PERMISSION CHECK
const ProtectedRoute = ({ permission }) => {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const location = useLocation()

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await axios.get(
          'http://localhost:8000/user/check-user',
          { withCredentials: true }
        )

        if (res.data.status && res.data.user) {
          setUser(res.data.user)
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkLogin()
  }, [location.pathname])

  if (loading) {
    return <p className="p-5">Checking login...</p>
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />
  }

  // ROLE NAME
  const roleName = (user.roleName || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .trim()

  // SUPER ADMIN HAS ACCESS TO ALL PAGES
  const isSuperAdmin = roleName === 'super admin'

  // CHECK PAGE PERMISSION
  const permissions = user.permissions || []

  if (!isSuperAdmin && permission && !permissions.includes(permission)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}


const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC ROUTE */}
        <Route path="/" element={<Login />} />

        {/* DASHBOARD */}
        <Route
          element={<ProtectedRoute permission="dashboard_view" />}
        >
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* USER */}
        <Route
          element={<ProtectedRoute permission="users_view" />}
        >
          <Route path="/user" element={<User />} />
        </Route>

        {/* PRODUCTS */}
        <Route
          element={<ProtectedRoute permission="products_view" />}
        >
          <Route path="/products" element={<Products />} />
        </Route>

        {/* CATEGORIES */}
        <Route
          element={<ProtectedRoute permission="categories_view" />}
        >
          <Route path="/category" element={<Category />} />
        </Route>

        {/* SUBCATEGORIES */}
        <Route
          element={<ProtectedRoute permission="subcategories_view" />}
        >
          <Route path="/subcategories" element={<Subcategories />} />
        </Route>

        {/* ROLE MANAGEMENT */}
        <Route
          element={<ProtectedRoute permission="roles_view" />}
        >
          <Route path="/role" element={<Role />} />
        </Route>

        {/* BRANDS */}
        <Route
          element={<ProtectedRoute permission="brands_view" />}
        >
          <Route path="/brand" element={<Brand />} />
        </Route>

        {/* PRODUCT VARIANTS */}
        <Route
          element={<ProtectedRoute permission="productvariant_view" />}
        >
          <Route path="/productvariant" element={<Productvariant />} />
        </Route>

        {/* STORE */}
        <Route
          element={<ProtectedRoute permission="store_view" />}
        >
          <Route path="/store" element={<Store />} />
        </Route>

        {/* TEMPLATE */}
        <Route
          element={<ProtectedRoute permission="template_view" />}
        >
          <Route path="/template" element={<Template />} />
        </Route>

        {/* INVENTORY */}
        <Route
          element={<ProtectedRoute permission="storeinventory_view" />}
        >
          <Route path="/inventory" element={<Inventory />} />
        </Route>

        {/* ORDERS */}
        <Route
          element={<ProtectedRoute permission="orders_view" />}
        >
          <Route path="/orders" element={<Orders />} />
        </Route>

        {/* UNKNOWN ROUTE */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />


      </Routes>

      <Toaster />
    </BrowserRouter>
  )
}

export default App