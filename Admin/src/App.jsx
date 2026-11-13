
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
  Outlet
} from 'react-router-dom'

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
import MyProfile from './pages/MyProfile'

import AdminLayout from './layout/AdminLayout'
import AccountLayout from './layout/AccountLayout'
import ChangePassword from './pages/ChangePassword'
import Banner from './pages/Banner'
import MyEarnings from './pages/MyEarnings'

import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import PendingReassignment from './pages/PendingReassignment'


// LOGIN + PERMISSION CHECK

const ProtectedRoute = ({ permission, onlyDeliveryPartner }) => {

  const { user, loading } = useAuth()

  if (loading) {
    return <p className="p-5">Checking login...</p>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  const roleName = (user.roleName || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .trim()

  const isSuperAdmin = roleName === 'super admin'

  const isDeliveryPartner = roleName === 'delivery partner'

  if (onlyDeliveryPartner && !isDeliveryPartner) {
    return <Navigate to="/dashboard" replace />
  }

  const permissions = user.permissions || []

  if (!isSuperAdmin && permission && !permissions.includes(permission)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}


const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>

        <Routes>

          {/* PUBLIC ROUTE */}
          <Route path="/" element={<Login />} />

          {/* PROTECTED ADMIN ROUTES */}
          <Route element={<ProtectedRoute />}>

            {/* COMMON ADMIN LAYOUT */}
            <Route element={<AdminLayout />}>

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

              {/* BANNERS */}
              <Route
                element={<ProtectedRoute permission="banners_view" />}
              >
                <Route path="/banner" element={<Banner />} />
              </Route>

              {/* PENDING REASSIGNMENT */}
              <Route
                element={<ProtectedRoute permission="deliverypartners_manage" />}
              >
                <Route
                  path="/pending-reassignment"
                  element={<PendingReassignment />}
                />
              </Route>

              {/* MY EARNINGS */}
              <Route element={<ProtectedRoute onlyDeliveryPartner />}>
                <Route path="/my-earnings" element={<MyEarnings />} />
              </Route>

              {/* ACCOUNT LAYOUT */}
              <Route element={<AccountLayout />}>

                <Route path="/my-profile" element={<MyProfile />} />

                <Route
                  path="/change-password"
                  element={<ChangePassword />}
                />

              </Route>

            </Route>
          </Route>

          {/* UNKNOWN ROUTE */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>

        <Toaster />

      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
