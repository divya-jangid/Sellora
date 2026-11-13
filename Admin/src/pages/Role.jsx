
import { useEffect, useState } from 'react'
import axios from 'axios'
import {
    LuSquarePen,
    LuTrash2,
    LuCheck,
    LuShieldCheck
} from "react-icons/lu";

import { toast } from 'react-hot-toast'

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
        module: 'Banners',
        permissions: [
            'banners_view',
            'banners_create',
            'banners_edit',
            'banners_delete'
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

function Role() {
    const [showForm, setShowForm] = useState(false)
    const [roleName, setRoleName] = useState('')
    const [selectedPermissions, setSelectedPermissions] = useState([])
    const [role, setRole] = useState([])
    const [editingRoleId, setEditingRoleId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [userPermissions, setUserPermissions] = useState([])
    const [userRole, setUserRole] = useState('')

    // CHECK CURRENT USER
    const getCurrentUser = async () => {
        try {
            const res = await axios.get(
                'http://localhost:8000/user/check-user',
                { withCredentials: true }
            )

            const user = res.data.user || res.data.data || res.data

            setUserRole(
                (user.roleName || user.role?.name || '').toLowerCase().trim()
            )

            setUserPermissions(
                user.permissions || user.role?.permissions || []
            )

        } catch (error) {
            console.log(
                'Current user error:',
                error.response?.data || error.message
            )
        }
    }

    // CHECK PERMISSION
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
        if (!hasPermission('roles_create')) {
            toast.error('You do not have permission to create roles')
            return
        }

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

    // SELECT / UNSELECT SINGLE PERMISSION
    const handlePermissionChange = (permission) => {
        setSelectedPermissions((prev) => {
            if (prev.includes(permission)) {
                return prev.filter((item) => item !== permission)
            }

            return [...prev, permission]
        })
    }

    // SELECT / UNSELECT ALL PERMISSIONS
    const allPermissions = permissionGroups.flatMap(
        (group) => group.permissions
    )

    const allSelected =
        allPermissions.length > 0 &&
        allPermissions.every((permission) =>
            selectedPermissions.includes(permission)
        )

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedPermissions(allPermissions)
        } else {
            setSelectedPermissions([])
        }
    }

    // SELECT / UNSELECT MODULE PERMISSIONS
    const handleGroupSelectAll = (group, checked) => {
        setSelectedPermissions((prev) => {
            if (checked) {
                return [
                    ...new Set([
                        ...prev,
                        ...group.permissions
                    ])
                ]
            }

            return prev.filter(
                (permission) => !group.permissions.includes(permission)
            )
        })
    }

    // CHECK IF MODULE IS FULLY SELECTED
    const isGroupSelected = (group) => {
        return group.permissions.every((permission) =>
            selectedPermissions.includes(permission)
        )
    }

    // CREATE OR UPDATE ROLE
    const createRole = async () => {
        if (!editingRoleId && !roleName.trim()) {
            toast.error('Please enter role name')
            return
        }

        if (editingRoleId && !hasPermission('roles_edit')) {
            toast.error('You do not have permission to edit roles')
            return
        }

        if (!editingRoleId && !hasPermission('roles_create')) {
            toast.error('You do not have permission to create roles')
            return
        }

        try {
            setLoading(true)

            if (editingRoleId) {
                const res = await axios.put(
                    `http://localhost:8000/role/update/${editingRoleId}`,
                    {
                        permissions: selectedPermissions
                    },
                    { withCredentials: true }
                )

                toast.success(
                    res.data.message ||
                    'Role permissions updated successfully'
                )

            } else {
                const res = await axios.post(
                    'http://localhost:8000/role/create',
                    {
                        name: roleName.trim(),
                        permissions: selectedPermissions
                    },
                    { withCredentials: true }
                )

                toast.success(
                    res.data.message || 'Role created successfully'
                )
            }

            handleCloseForm()
            await getRole()

        } catch (error) {
            console.log(error.response?.data || error.message)

            toast.error(
                error.response?.data?.message || 'Something went wrong'
            )
        } finally {
            setLoading(false)
        }
    }

    // EDIT ROLE
    const handleEditRole = (selectedRole) => {
        if (!hasPermission('roles_edit')) {
            toast.error('You do not have permission to edit roles')
            return
        }

        if (selectedRole.name?.toLowerCase() === 'super admin') {
            toast.error('Super Admin permissions cannot be changed')
            return
        }

        setEditingRoleId(selectedRole._id)
        setRoleName(selectedRole.name)
        setSelectedPermissions(selectedRole.permissions || [])
        setShowForm(true)
    }

    // DELETE ROLE
    const handleDeleteRole = async (roleId, name) => {
        if (!hasPermission('roles_delete')) {
            toast.error('You do not have permission to delete roles')
            return
        }

        if (name?.toLowerCase() === 'super admin') {
            toast.error('Super Admin role cannot be deleted')
            return
        }

        try {
            const res = await axios.delete(
                `http://localhost:8000/role/delete/${roleId}`,
                { withCredentials: true }
            )

            toast.success(
                res.data.message || 'Role deleted successfully'
            )

            await getRole()

        } catch (error) {
            console.log(error.response?.data || error.message)

            toast.error(
                error.response?.data?.message || 'Failed to delete role'
            )
        }
    }

    return (
        <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-8">

            {/* HEADER */}
            <div className="mb-6 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-purple-600">
                        Access Control
                    </p>

                    <h1 className="mt-1 text-2xl font-bold text-gray-800 sm:text-3xl">
                        Role Management
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Manage roles and their permissions.
                    </p>
                </div>

                {hasPermission('roles_create') && (
                    <button
                        onClick={handleOpenForm}
                        className="w-full shrink-0 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-purple-700 sm:w-auto"
                    >
                        + Add Role
                    </button>
                )}
            </div>

            {/* ROLE TABLE */}
            <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-purple-100 bg-white shadow-sm">

                <div className="flex flex-col gap-1 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                        <h2 className="font-bold text-gray-800">
                            All Roles
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">
                            View and manage assigned permissions.
                        </p>
                    </div>

                    <span className="mt-2 w-fit rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 sm:mt-0">
                        {role.length} Roles
                    </span>
                </div>

                <div className="w-full min-w-0 overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left">

                        <thead className="bg-purple-50">
                            <tr>
                                <th className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase text-gray-600 sm:px-5">
                                    #
                                </th>

                                <th className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase text-gray-600 sm:px-5">
                                    Role Name
                                </th>

                                <th className="px-4 py-4 text-xs font-bold uppercase text-gray-600 sm:px-5">
                                    Permissions
                                </th>

                                <th className="whitespace-nowrap px-4 py-4 text-center text-xs font-bold uppercase text-gray-600 sm:px-5">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {role.length > 0 ? (
                                role.map((roles, index) => (
                                    <tr
                                        key={roles._id}
                                        className="align-top transition hover:bg-gray-50"
                                    >
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 sm:px-5">
                                            {index + 1}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 font-semibold capitalize text-gray-800 sm:px-5">
                                            {roles.name}
                                        </td>

                                        <td className="min-w-[250px] px-4 py-4 sm:px-5">
                                            {roles.permissions?.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {roles.permissions.map((permission, i) => (
                                                        <span
                                                            key={`${permission}-${i}`}
                                                            className="break-all rounded-md border border-purple-200 bg-purple-100 px-2 py-1 text-xs text-purple-700"
                                                        >
                                                            {typeof permission === 'string'
                                                                ? permission
                                                                : permission.name || permission.slug || ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">
                                                    No permissions assigned
                                                </span>
                                            )}

                                            <p className="mt-2 text-xs text-gray-500">
                                                Total: {roles.permissions?.length || 0} permissions
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                                            <div className="flex items-center justify-center gap-2">

                                                {hasPermission('roles_edit') && (
                                                    <button
                                                        onClick={() => handleEditRole(roles)}
                                                        disabled={roles.name?.toLowerCase() === 'super admin'}
                                                        title="Edit Permissions"
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                                    >
                                                        <LuSquarePen size={17} />
                                                    </button>
                                                )}

                                                {hasPermission('roles_delete') && (
                                                    <button
                                                        onClick={() => handleDeleteRole(roles._id, roles.name)}
                                                        disabled={roles.name?.toLowerCase() === 'super admin'}
                                                        title="Delete Role"
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                                    >
                                                        <LuTrash2 size={17} />
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
                                        className="py-10 text-center text-sm text-gray-500"
                                    >
                                        No roles found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE / EDIT MODAL */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">

                    <div className="my-auto w-full min-w-0 max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">

                        {/* MODAL HEADER */}
                        <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-4 sm:px-6 sm:py-5">

                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                                    <LuShieldCheck size={22} />
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
                                        {editingRoleId
                                            ? 'Edit Role Permissions'
                                            : 'Create Role'}
                                    </h2>

                                    <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                                        Assign module-wise permissions.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleCloseForm}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-2xl text-gray-500 transition hover:bg-red-50 hover:text-red-500"
                            >
                                &times;
                            </button>
                        </div>

                        {/* MODAL BODY */}
                        <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-6">

                            {/* ROLE NAME */}
                            {!editingRoleId && (
                                <div className="mb-6">
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Role Name
                                    </label>

                                    <input
                                        type="text"
                                        value={roleName}
                                        onChange={(e) => setRoleName(e.target.value)}
                                        placeholder="Enter role name"
                                        className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-100"
                                    />
                                </div>
                            )}

                            {/* PERMISSION SUMMARY */}
                            <div className="mb-5 rounded-xl border border-purple-100 bg-purple-50 p-4">

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                    <div>
                                        <h3 className="font-bold text-gray-800">
                                            Assign Permissions
                                        </h3>

                                        <p className="mt-1 text-xs text-gray-500">
                                            Select permissions for each module.
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                                        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-purple-700 shadow-sm">
                                            {selectedPermissions.length} / {allPermissions.length} Selected
                                        </span>

                                        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-purple-700">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                className="h-4 w-4 accent-purple-600"
                                            />
                                            Select All
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* PERMISSION MODULES */}
                            <div className="space-y-4">

                                {permissionGroups.map((group, index) => {
                                    const groupSelected = isGroupSelected(group)

                                    const selectedCount = group.permissions.filter(
                                        (permission) =>
                                            selectedPermissions.includes(permission)
                                    ).length

                                    return (
                                        <div
                                            key={group.module}
                                            className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                                        >
                                            {/* MODULE HEADER */}
                                            <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-sm font-bold text-purple-700">
                                                        {index + 1}
                                                    </div>

                                                    <div>
                                                        <h4 className="font-bold text-gray-800">
                                                            {group.module}
                                                        </h4>

                                                        <p className="text-xs text-gray-500">
                                                            {selectedCount} of {group.permissions.length} selected
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* MODULE SELECT ALL */}
                                                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-50">
                                                    <input
                                                        type="checkbox"
                                                        checked={groupSelected}
                                                        onChange={(e) =>
                                                            handleGroupSelectAll(group, e.target.checked)
                                                        }
                                                        className="h-4 w-4 accent-purple-600"
                                                    />

                                                    Select All
                                                </label>
                                            </div>

                                            {/* MODULE PERMISSIONS */}
                                            <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 sm:gap-3 sm:p-4 lg:grid-cols-3">

                                                {group.permissions.map((permission) => {
                                                    const isChecked = selectedPermissions.includes(permission)

                                                    return (
                                                        <label
                                                            key={permission}
                                                            className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                                                                isChecked
                                                                    ? 'border-purple-200 bg-purple-50'
                                                                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() =>
                                                                    handlePermissionChange(permission)
                                                                }
                                                                className="h-4 w-4 shrink-0 accent-purple-600"
                                                            />

                                                            <span className={`break-all text-xs font-medium sm:text-sm ${
                                                                isChecked
                                                                    ? 'text-purple-800'
                                                                    : 'text-gray-600'
                                                            }`}>
                                                                {permission}
                                                            </span>

                                                            {isChecked && (
                                                                <LuCheck
                                                                    size={15}
                                                                    className="ml-auto shrink-0 text-purple-600"
                                                                />
                                                            )}
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* MODAL FOOTER */}
                        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">

                            <button
                                onClick={handleCloseForm}
                                disabled={loading}
                                className="w-full rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={createRole}
                                disabled={loading}
                                className="w-full rounded-xl bg-purple-600 px-6 py-2.5 font-semibold text-white shadow-md transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300 sm:w-auto"
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
            )}
        </div>
    )
}

export default Role
