
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  LuEye,
  LuSquarePen,
  LuTrash2
} from "react-icons/lu";

const BrandContent = () => {
  const [showForm, setShowForm] = useState(false)
  const [showView, setShowView] = useState(false)

  const [brands, setBrands] = useState([])
  const [editId, setEditId] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [error, setError] = useState('')

  const [viewBrand, setViewBrand] = useState(null)

  const [roleName, setRoleName] = useState('')
  const [permissions, setPermissions] = useState([])
  const [authLoading, setAuthLoading] = useState(true)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    logo: '',
    description: '',
  })

  // CHECK USER AND PERMISSIONS
  const checkUser = async () => {
    try {
      const res = await axios.get(
        'http://localhost:8000/user/check-user',
        { withCredentials: true }
      )

      const user = res.data.user

      setRoleName(
        user?.roleName?.toLowerCase().trim() ||
        user?.role?.name?.toLowerCase().trim() ||
        ''
      )

      setPermissions(
        user?.permissions ||
        user?.role?.permissions ||
        []
      )
    } catch (err) {
      console.log('CHECK USER ERROR:', err)
      setRoleName('')
      setPermissions([])
    } finally {
      setAuthLoading(false)
    }
  }

  // CHECK PERMISSION
  const hasPermission = (permission) => {
    if (roleName === 'super admin') {
      return true
    }

    return permissions.includes(permission)
  }

  // GENERATE SLUG
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // GET ALL BRANDS
  const getBrands = async () => {
    try {
      const res = await axios.get(
        'http://localhost:8000/brand/get-all',
        { withCredentials: true }
      )

      setBrands(res.data.data || [])
      setError('')
    } catch (err) {
      console.log('GET BRANDS ERROR:', err)

      setError(
        err.response?.data?.message || 'Failed to fetch brands'
      )
    }
  }

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (hasPermission('brands_view')) {
      getBrands()
    }
  }, [authLoading, roleName, permissions])

  // RESET FORM
  const resetForm = () => {
    setForm({
      name: '',
      slug: '',
      logo: '',
      description: '',
    })

    setLogoFile(null)
    setEditId('')
    setError('')
    setShowForm(false)
  }

  // OPEN ADD FORM
  const handleAdd = () => {
    if (!hasPermission('brands_create')) {
      alert('You do not have permission to create brands')
      return
    }

    resetForm()
    setShowForm(true)
  }

  // EDIT BRAND
  const handleEdit = (id) => {
    if (!hasPermission('brands_edit')) {
      alert('You do not have permission to edit brands')
      return
    }

    const selectedBrand = brands.find(
      (item) => item._id === id
    )

    if (!selectedBrand) return

    setForm({
      name: selectedBrand.name || '',
      slug: selectedBrand.slug || '',
      logo: selectedBrand.logo || '',
      description: selectedBrand.description || ''
    })

    setLogoFile(null)
    setEditId(id)
    setError('')
    setShowForm(true)
  }

  // VIEW BRAND
  const handleView = (brand) => {
    setViewBrand(brand)
    setShowView(true)
  }

  // DELETE BRAND
  const handleDelete = async (id) => {
    if (!hasPermission('brands_delete')) {
      alert('You do not have permission to delete brands')
      return
    }

    try {
      await axios.delete(
        `http://localhost:8000/brand/delete/${id}`,
        { withCredentials: true }
      )

      await getBrands()

      alert('Brand deleted successfully!')
    } catch (err) {
      console.log('DELETE BRAND ERROR:', err)

      alert(
        err.response?.data?.message || 'Failed to delete brand'
      )
    }
  }

  // UPDATE BRAND STATUS
  const handleStatusToggle = async (brand) => {
    if (!hasPermission('brands_edit')) {
      alert('You do not have permission to update brand status')
      return
    }

    const newStatus =
      brand.status === 'active' ? 'inactive' : 'active'

    try {
      setUpdatingStatus(brand._id)

      await axios.put(
        `http://localhost:8000/brand/status/${brand._id}`,
        { status: newStatus },
        { withCredentials: true }
      )

      await getBrands()

      // Update opened view modal
      if (viewBrand?._id === brand._id) {
        setViewBrand({
          ...brand,
          status: newStatus
        })
      }
    } catch (err) {
      console.log(
        'BRAND STATUS ERROR:',
        err.response?.data || err.message
      )

      alert(
        err.response?.data?.message ||
        'Unable to update brand status'
      )
    } finally {
      setUpdatingStatus(null)
    }
  }

  // SUBMIT FORM
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (editId && !hasPermission('brands_edit')) {
      setError('You do not have permission to edit brands')
      return
    }

    if (!editId && !hasPermission('brands_create')) {
      setError('You do not have permission to create brands')
      return
    }

    if (!form.name.trim()) {
      setError('Brand name is required')
      return
    }

    try {
      setLoading(true)

      const formData = new FormData()

      formData.append('name', form.name.trim())
      formData.append('slug', generateSlug(form.name))
      formData.append('description', form.description)
      formData.append('status', form.status)

      if (logoFile) {
        formData.append('logo', logoFile)
      }

      if (editId) {
        await axios.put(
          `http://localhost:8000/brand/update/${editId}`,
          formData,
          { withCredentials: true }
        )
      } else {
        await axios.post(
          'http://localhost:8000/brand/create',
          formData,
          { withCredentials: true }
        )
      }

      await getBrands()
      resetForm()

      toast.success(
        editId
          ? 'Brand updated successfully!'
          : 'Brand created successfully!'
      )
    } catch (err) {
      console.log(
        'SUBMIT BRAND ERROR:',
        err.response?.data || err.message
      )

      setError(
        err.response?.data?.message || 'Something went wrong'
      )
    } finally {
      setLoading(false)
    }
  }

  const logoPreview = logoFile
    ? URL.createObjectURL(logoFile)
    : form.logo

  // WAIT FOR AUTHENTICATION
  if (authLoading) {
    return (
      <div className="p-8 text-center text-slate-600">
        Checking permissions...
      </div>
    )
  }

  // VIEW PERMISSION CHECK
  if (!hasPermission('brands_view')) {
    return (
      <div className="m-6 rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold text-red-600">
          Access Denied
        </h2>

        <p className="mt-2 text-slate-600">
          You do not have permission to view brands.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">

      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            Product Management
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Brands
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create and manage your product brands.
          </p>
        </div>

        {hasPermission('brands_create') && (
          <button
            onClick={handleAdd}
            className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-indigo-700"
          >
            + Add Brand
          </button>
        )}
      </div>

      {/* ERROR */}
      {error && !showForm && (
        <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* BRANDS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">

        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-bold text-slate-800">
            All Brands
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            View and manage your brand details.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">

            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Name
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Slug
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Logo
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Description
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                  Status
                </th>

                {(hasPermission('brands_edit') ||
                  hasPermission('brands_delete')) && (
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {brands.length > 0 ? (
                brands.map((brand) => (
                  <tr
                    key={brand._id}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {brand.name}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {brand.slug}
                    </td>

                    <td className="px-6 py-4">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="h-12 w-12 rounded-lg border border-slate-200 object-contain p-1"
                        />
                      ) : (
                        <span className="text-sm text-slate-400">
                          No logo
                        </span>
                      )}
                    </td>

                    <td className="max-w-xs px-6 py-4 text-sm text-slate-600">
                      <p className="line-clamp-2">
                        {brand.description || '-'}
                      </p>
                    </td>

                    {/* CLICKABLE STATUS */}
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(brand)}
                        disabled={
                          !hasPermission('brands_edit') ||
                          updatingStatus === brand._id
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed ${
                          brand.status === 'active'
                            ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                            : 'border-red-100 bg-red-50 text-red-600'
                        }`}
                      >
                        {updatingStatus === brand._id
                          ? 'Updating...'
                          : brand.status || 'active'}
                      </button>
                    </td>

                    {/* ACTIONS */}
                    {(hasPermission('brands_edit') ||
                      hasPermission('brands_delete')) && (
                      <td className="whitespace-nowrap px-6 py-4">

                        <button
                          type="button"
                          onClick={() => handleView(brand)}
                          className="mr-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <LuEye/>
                        </button>

                        {hasPermission('brands_edit') && (
                          <button
                            type="button"
                            onClick={() => handleEdit(brand._id)}
                            className="mr-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            <LuSquarePen/>
                          </button>
                        )}

                        {hasPermission('brands_delete') && (
                          <button
                            type="button"
                            onClick={() => handleDelete(brand._id)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                          >
                            <LuTrash2/>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={
                      hasPermission('brands_edit') ||
                      hasPermission('brands_delete')
                        ? 6
                        : 5
                    }
                    className="py-12 text-center text-slate-500"
                  >
                    {error || 'No brands found'}
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* ADD / EDIT FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-indigo-100 bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-900">
                {editId ? 'Update Brand' : 'Add Brand'}
              </h2>

              <button
                type="button"
                onClick={resetForm}
                className="text-2xl text-slate-400 hover:text-red-500"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="space-y-5 p-6">

                {/* BRAND NAME */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Brand Name
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="Enter brand name"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value

                      setForm((prev) => ({
                        ...prev,
                        name,
                        slug: generateSlug(name)
                      }))
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                {/* SLUG */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Slug
                  </label>

                  <input
                    type="text"
                    value={form.slug}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600 outline-none"
                  />
                </div>

                {/* LOGO */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Brand Logo
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]

                      if (file) {
                        if (!file.type.startsWith('image/')) {
                          setError('Please select an image file')
                          e.target.value = ''
                          return
                        }

                        if (file.size > 5 * 1024 * 1024) {
                          setError('Image size must be under 5 MB')
                          e.target.value = ''
                          return
                        }

                        setError('')
                        setLogoFile(file)
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
                  />

                  {logoPreview && (
                    <div className="mt-3">
                      <p className="mb-2 text-sm text-slate-500">
                        Logo Preview
                      </p>

                      <img
                        src={logoPreview}
                        alt="Brand logo preview"
                        className="h-24 w-24 rounded-xl border border-slate-200 object-contain p-2"
                      />
                    </div>
                  )}
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    rows="3"
                    placeholder="Enter description"
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value
                      })
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>


                {error && (
                  <p className="text-sm text-red-600">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row">

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? 'Please wait...'
                    : editId
                      ? 'Update Brand'
                      : 'Add Brand'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VIEW BRAND MODAL */}
      {showView && viewBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="my-auto w-full max-w-lg rounded-2xl border border-indigo-100 bg-white p-6 shadow-2xl">

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Brand Details
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowView(false)
                  setViewBrand(null)
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-2xl text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                ×
              </button>
            </div>

            {viewBrand.logo ? (
              <div className="mb-5 flex h-44 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-4">
                <img
                  src={viewBrand.logo}
                  alt={viewBrand.name}
                  className="h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="mb-5 flex h-44 items-center justify-center rounded-xl bg-indigo-50 text-5xl">
                🏷️
              </div>
            )}

            <div className="space-y-4">

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Brand Name
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {viewBrand.name}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Slug
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {viewBrand.slug || '-'}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Description
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {viewBrand.description || 'No description available'}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Status
                </p>

                <p className={`mt-1 font-semibold ${
                  viewBrand.status === 'active'
                    ? 'text-emerald-700'
                    : 'text-red-600'
                }`}>
                  {viewBrand.status || 'active'}
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() => {
                setShowView(false)
                setViewBrand(null)
              }}
              className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Close
            </button>

          </div>
        </div>
      )}
    </div>
  )
}

export default BrandContent
