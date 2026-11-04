
import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  LuEye,
  LuSquarePen,
  LuTrash2
} from "react-icons/lu";

const permissionGroups = [
  {
    module: 'Dashboard',
    permissions: ['dashboard_view']
  },
  {
    module: 'User',
    permissions: [
      'users_view',
      'users_create',
      'users_edit',
      'users_delete'
    ]
  },
  {
    module: 'Products',
    permissions: [
      'products_view',
      'products_create',
      'products_edit',
      'products_delete'
    ]
  },
  {
    module: 'Categories',
    permissions: [
      'categories_view',
      'categories_create',
      'categories_edit',
      'categories_delete'
    ]
  },
  {
    module: 'SubCategories',
    permissions: [
      'subcategories_view',
      'subcategories_create',
      'subcategories_edit',
      'subcategories_delete'
    ]
  },
  {
    module: 'Role',
    permissions: [
      'roles_view',
      'roles_create',
      'roles_edit',
      'roles_delete'
    ]
  },

  {
    module: 'Brands',
    permissions: [
      'brands_view',
      'brands_create',
      'brands_edit',
      'brands_delete'
    ]
  },
  {
    module: 'ProductVariant',
    permissions: [
      'productvariant_view',
      'productvariant_create',
      'productvariant_edit',
      'productvariant_delete'
    ]
  },
  {
    module: 'Store',
    permissions: [
      'store_view',
      'store_create',
      'store_edit',
      'store_delete'
    ]
  },
  {
    module: 'Template',
    permissions: [
      'template_view',
      'template_create',
      'template_edit',
      'template_delete',
      'template_send'
    ]
  },
  {
    module: 'Store Inventory',
    permissions: [
      'storeinventory_view',
      'storeinventory_create',
      'storeinventory_edit',
      'storeinventory_delete'

    ]

  },
  {
    module: 'Delivery Partners',
    permissions: [
      'deliverypartners_view',
      'deliverypartners_manage'
    ]
  },
  {
    module: 'Orders',
    permissions: [
      'orders_view',
      'orders_manage',
      'orders_assign'
    ]
  } 
]


function RoleContent() {
  const [showForm, setShowForm] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [role, setRole] = useState([])
  const [editingRoleId, setEditingRoleId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userPermissions, setUserPermissions] = useState([])
  const [userRole, setUserRole] = useState('')

  // CHECK USER FUNC

  const getCurrentUser = async () => {
    try {
      const res = await axios.get(
        'http://localhost:8000/user/check-user',
        { withCredentials: true }
      )

      const user = res.data.user || res.data.data || res.data

      setUserRole(
        (user.roleName || user.role?.name || '').toLowerCase()
      )

      setUserPermissions(user.permissions || user.role?.permissions || [])

    } catch (error) {
      console.log('Current user error:', error.response?.data || error.message)
    }
  }

  const hasPermission = (permission) => {
    if (userRole === 'super admin') {
      return true
    }

    return userPermissions.includes(permission)
  }

  // GET ALL ROLES
  const getRole = async () => {
    try {
      const res = await axios.get(
        'http://localhost:8000/role/get-role',
        { withCredentials: true }
      )

      setRole(res.data.data || [])
    } catch (error) {
      console.log(error.response?.data || error.message)

    }
  }

  useEffect(() => {
    getRole()
    getCurrentUser()

  }, [])

  // OPEN CREATE FORM
  const handleOpenForm = () => {
    setEditingRoleId(null)
    setRoleName('')
    setSelectedPermissions([])
    setShowForm(true)
  }

  // CLOSE FORM
  const handleCloseForm = () => {
    setShowForm(false)
    setRoleName('')
    setSelectedPermissions([])
    setEditingRoleId(null)
  }

  // SELECT / UNSELECT PERMISSION
  const handlePermissionChange = (permission) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permission)) {
        return prev.filter((item) => item !== permission)
      }

      return [...prev, permission]
    })
  }

  // SELECT ALL
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPermissions(
        permissionGroups.flatMap((group) => group.permissions)
      )
    } else {
      setSelectedPermissions([])
    }
  }

  // CREATE OR UPDATE ROLE
  const createRole = async () => {
    if (!editingRoleId && !roleName.trim()) {
      return
    }

    try {
      setLoading(true)

      if (editingRoleId) {
        await axios.put(
          `http://localhost:8000/role/update/${editingRoleId}`,
          {
            permissions: selectedPermissions
          },
          { withCredentials: true }
        )


      } else {
        await axios.post(
          'http://localhost:8000/role/create',
          {
            name: roleName.trim(),
            permissions: selectedPermissions
          },
          { withCredentials: true }
        )


      }

      handleCloseForm()
      await getRole()
    } catch (error) {
      console.log(error.response?.data || error.message)
    }
    finally {
      setLoading(false)
    }
  }

  // EDIT ROLE
  const handleEditRole = (selectedRole) => {
    if (selectedRole.name?.toLowerCase() === 'super admin') {
      return
    }

    setEditingRoleId(selectedRole._id)
    setRoleName(selectedRole.name)
    setSelectedPermissions(selectedRole.permissions || [])
    setShowForm(true)
  }

  // DELETE ROLE
  const handleDeleteRole = async (roleId, name) => {
    if (name?.toLowerCase() === 'super admin') {
      return
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${name}" role?`
    )

    if (!confirmDelete) return

    try {
      await axios.delete(
        `http://localhost:8000/role/delete/${roleId}`,
        { withCredentials: true }
      )

      await getRole()
    } catch (error) {
      console.log(error.response?.data || error.message)

    }
  }

  const allPermissions = permissionGroups.flatMap(
    (group) => group.permissions
  )

  const allSelected =
    allPermissions.length > 0 &&
    allPermissions.every((permission) =>
      selectedPermissions.includes(permission)
    )

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Role Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage roles and their permissions
          </p>
        </div>

        {hasPermission('roles_create') && (
          <button
            onClick={handleOpenForm}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg"
          >
            + Add Role
          </button>
        )}
      </div>

      {/* ROLE TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-purple-50">
            <tr>
              <th className="px-5 py-4">#</th>
              <th className="px-5 py-4">Role Name</th>
              <th className="px-5 py-4">Permissions</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {role.length > 0 ? (
              role.map((roles, index) => (
                <tr
                  key={roles._id}
                  className="border-t hover:bg-gray-50 align-top"
                >
                  <td className="px-5 py-4">{index + 1}</td>

                  <td className="px-5 py-4 font-medium capitalize">
                    {roles.name}
                  </td>

                  {/* SHOW ACTUAL PERMISSIONS */}
                  <td className="px-5 py-4 min-w-64">
                    {roles.permissions?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {roles.permissions.map((permission, i) => (
                          <span
                            key={`${permission}-${i}`}
                            className="bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded-md text-xs"
                          >
                            {typeof permission === 'string'
                              ? permission
                              : permission.name || permission.slug || ''}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">
                        No permissions assigned
                      </span>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      Total: {roles.permissions?.length || 0} permissions
                    </p>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-5 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {hasPermission('roles_edit') && (
                        <button
                          onClick={() => handleEditRole(roles)}
                          disabled={roles.name?.toLowerCase() === 'super admin'}
                          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-md text-sm"
                        >
                          <LuSquarePen/>
                        </button>
                      )}

                      {hasPermission('roles_delete') && (
                        <button
                          onClick={() => handleDeleteRole(roles._id, roles.name)}
                          disabled={roles.name?.toLowerCase() === 'super admin'}
                          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-md text-sm"
                        >
                          <LuTrash2/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-8 text-gray-500"
                >
                  No roles found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingRoleId
                  ? 'Edit Role Permissions'
                  : 'Create Role'}
              </h2>

              <button
                onClick={handleCloseForm}
                className="text-gray-500 hover:text-red-500 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-5">

              {!editingRoleId && (
                <div className="mb-5">
                  <label className="block text-sm font-medium mb-2">
                    Role Name
                  </label>

                  <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Enter role name"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              )}

              <div className="flex items-center justify-between bg-purple-50 rounded-lg p-3 mb-4">
                <h3 className="font-semibold text-gray-800">
                  Assign Permissions
                </h3>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 accent-purple-600"
                  />
                  <span className="text-sm font-medium">
                    Select All
                  </span>
                </label>
              </div>

              <div className="space-y-4">
                {permissionGroups.map((group) => (
                  <div
                    key={group.module}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <h4 className="font-semibold text-gray-800 mb-3">
                      {group.module}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {group.permissions.map((permission) => (
                        <label
                          key={permission}
                          className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission)}
                            onChange={() =>
                              handlePermissionChange(permission)
                            }
                            className="w-4 h-4 accent-purple-600"
                          />
                          {permission}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleCloseForm}
                  className="border border-gray-300 hover:bg-gray-100 px-5 py-2 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={createRole}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-5 py-2 rounded-lg"
                >
                  {loading
                    ? 'Please wait...'
                    : editingRoleId
                      ? 'Update Permissions'
                      : 'Create Role'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoleContent
