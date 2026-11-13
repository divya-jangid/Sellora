
import React, { useState, useEffect } from 'react';
import TextEditor from '../components/TextEditor';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  LuSquarePen,
  LuTrash2,
  LuMail,
  LuFileText,
  LuPlus,
  LuX
} from "react-icons/lu";

const Template = () => {
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    subject: '',
    description: ''
  });

  const [template, setTemplate] = useState([]);
  const [editId, setEditId] = useState(null);

  // SEARCH, SORT & PAGINATION
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const limit = 10;

  // EMAIL STATES
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailType, setEmailType] = useState('normal');
  const [sending, setSending] = useState(false);

  // RBAC STATES
  const [roleName, setRoleName] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);

  // CHECK USER PERMISSIONS
  const checkUser = async () => {
    try {
      const res = await axios.get(
        'http://localhost:8000/user/check-user',
        { withCredentials: true }
      );

      const currentUser = res.data.user;

      setRoleName(
        currentUser.roleName?.toLowerCase().trim() || ''
      );

      setPermissions(currentUser.permissions || []);

    } catch (err) {
      console.log(err.response?.data || err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // CHECK PERMISSION
  const hasPermission = (permission) => {
    if (roleName === 'super admin') {
      return true;
    }

    return permissions.includes(permission);
  };

  // GET TEMPLATES
  const getTemplates = async () => {
    try {
      const res = await axios.get(
        'http://localhost:8000/template/get-all',
        {
          withCredentials: true,
          params: {
            page: currentPage,
            limit,
            search,
            sortBy,
            order
          }
        }
      );

      setTemplate(res.data.data || []);

      setTotalTemplates(
        res.data.pagination?.totalTemplates || 0
      );

      setTotalPages(
        res.data.pagination?.totalPages || 1
      );

    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  // USE EFFECT
  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (hasPermission('template_view')) {
      getTemplates();
    }
  }, [
    authLoading,
    roleName,
    permissions,
    currentPage,
    search,
    sortBy,
    order
  ]);

  // RESET FORM
  const resetForm = () => {
    setForm({
      name: '',
      subject: '',
      description: ''
    });

    setEditId(null);
    setShowForm(false);
  };

  // HANDLE CHANGE
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // ADD AND UPDATE TEMPLATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editId && !hasPermission('template_edit')) {
      toast.error('You do not have permission to edit templates');
      return;
    }

    if (!editId && !hasPermission('template_create')) {
      toast.error('You do not have permission to create templates');
      return;
    }

    try {
      if (editId) {
        await axios.put(
          `http://localhost:8000/template/update/${editId}`,
          form,
          { withCredentials: true }
        );

        toast.success('Template updated successfully');

      } else {
        await axios.post(
          'http://localhost:8000/template/create',
          form,
          { withCredentials: true }
        );

        toast.success('Template created successfully');
      }

      resetForm();
      await getTemplates();

    } catch (err) {
      console.log(err.response?.data || err.message);

      toast.error(
        err.response?.data?.message || 'Something went wrong'
      );
    }
  };

  // EDIT TEMPLATE
  const handleEdit = (temp) => {
    if (!hasPermission('template_edit')) {
      toast.error('You do not have permission to edit templates');
      return;
    }

    setForm({
      name: temp.name || '',
      subject: temp.subject || '',
      description: temp.description || ''
    });

    setEditId(temp._id);
    setShowForm(true);
  };

  // DELETE TEMPLATE
  const handleDelete = async (id) => {
    if (!hasPermission('template_delete')) {
      toast.error('You do not have permission to delete templates');
      return;
    }

    try {
      await axios.delete(
        `http://localhost:8000/template/delete/${id}`,
        { withCredentials: true }
      );

      toast.success('Template deleted successfully');

      if (template.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        await getTemplates();
      }

    } catch (err) {
      console.log(err.response?.data || err.message);

      toast.error(
        err.response?.data?.message || 'Delete failed'
      );
    }
  };

  // OPEN EMAIL POPUP
  const openEmailForm = (temp) => {
    if (!hasPermission('template_send')) {
      toast.error('You do not have permission to send emails');
      return;
    }

    setSelectedTemplate(temp);
    setRecipientEmail('');
    setEmailType('normal');
    setShowEmailForm(true);
  };

  // CLOSE EMAIL POPUP
  const closeEmailForm = () => {
    setShowEmailForm(false);
    setSelectedTemplate(null);
    setRecipientEmail('');
    setEmailType('normal');
  };

  // SEND TEMPLATE EMAIL
  const handleSendEmail = async (e) => {
    e.preventDefault();

    if (!hasPermission('template_send')) {
      toast.error('You do not have permission to send emails');
      return;
    }

    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    if (!recipientEmail.trim()) {
      toast.error('Please enter recipient email');
      return;
    }

    try {
      setSending(true);

      const res = await axios.post(
        'http://localhost:8000/template/send-email',
        {
          templateId: selectedTemplate._id,
          email: recipientEmail.trim(),
          emailType: emailType
        },
        { withCredentials: true }
      );

      toast.success(res.data.message || 'Email sent successfully');

      closeEmailForm();

    } catch (err) {
      console.log(err.response?.data || err.message);

      toast.error(
        err.response?.data?.message || 'Email sending failed'
      );

    } finally {
      setSending(false);
    }
  };

  // TEMPLATE ACTION BUTTONS
  const TemplateActions = ({ temp }) => (
    <div className="flex flex-wrap items-center gap-2">
      {hasPermission('template_edit') && (
        <button
          type="button"
          onClick={() => handleEdit(temp)}
          title="Edit Template"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white transition hover:bg-blue-600"
        >
          <LuSquarePen size={17} />
        </button>
      )}

      {hasPermission('template_delete') && (
        <button
          type="button"
          onClick={() => handleDelete(temp._id)}
          title="Delete Template"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-600"
        >
          <LuTrash2 size={17} />
        </button>
      )}

      {hasPermission('template_send') && (
        <button
          type="button"
          onClick={() => openEmailForm(temp)}
          title="Send Email"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white transition hover:bg-green-700"
        >
          <LuMail size={17} />
        </button>
      )}
    </div>
  );

  const hasActions =
    hasPermission('template_edit') ||
    hasPermission('template_delete') ||
    hasPermission('template_send');

  // LOADING
  if (authLoading) {
    return (
      <div className="p-4 sm:p-6">
        Checking permissions...
      </div>
    );
  }

  // ACCESS DENIED
  if (!hasPermission('template_view')) {
    return (
      <div className="p-4 sm:p-6">
        <h2 className="text-xl font-bold text-red-600">
          Access Denied
        </h2>

        <p className="mt-2 text-gray-600">
          You do not have permission to view templates.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 p-3 sm:p-5 lg:p-6">

      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
            Template
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your email templates
          </p>
        </div>

        {hasPermission('template_create') && (
          <button
            type="button"
            onClick={() => {
              setForm({
                name: '',
                subject: '',
                description: ''
              });

              setEditId(null);
              setShowForm(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
          >
            <LuPlus size={18} />
            Add New Template
          </button>
        )}

      </div>

      {/* ADD / UPDATE FORM */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">

          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-800 sm:text-xl">
              {editId ? 'Update Template' : 'Add Template'}
            </h2>

            <button
              type="button"
              onClick={resetForm}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <LuX size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Template Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter template name"
                required
                className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email Subject
              </label>

              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Enter email subject"
                required
                className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="mb-5 min-w-0">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email Content
              </label>

              <div className="w-full min-w-0 overflow-hidden">
                <TextEditor
                  value={form.description}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      description: value
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
              >
                {editId ? 'Update Template' : 'Submit'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-lg bg-gray-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-600 sm:w-auto"
              >
                Cancel
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ALL TEMPLATES */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        {/* SEARCH AND SORT */}
        <div className="border-b border-gray-200 p-4 sm:p-5">

          <div>
            <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
              All Templates
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage your templates here
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search template name or subject..."
              className="w-full min-w-0 rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            <select
              value={`${sortBy}_${order}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('_');
                setSortBy(field);
                setOrder(direction);
                setCurrentPage(1);
              }}
              className="w-full min-w-0 rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="name_asc">Name (A to Z)</option>
              <option value="name_desc">Name (Z to A)</option>
            </select>

          </div>

        </div>

        {/* MOBILE TEMPLATE CARDS */}
        <div className="grid grid-cols-1 gap-3 p-3 sm:p-4 lg:hidden">

          {template.map((temp, index) => (
            <div
              key={temp._id}
              className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-sm"
            >

              <div className="flex items-start justify-between gap-3">

                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <LuFileText size={20} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-gray-800">
                      {temp.name}
                    </h3>

                    <p className="mt-1 text-xs text-gray-400">
                      S.No. {(currentPage - 1) * limit + index + 1}
                    </p>
                  </div>
                </div>

              </div>

              <div className="mt-4 space-y-3">

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Subject
                  </p>

                  <p className="break-words text-sm text-gray-700">
                    {temp.subject}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Description
                  </p>

                  <div
                    className="max-h-24 overflow-hidden break-words text-sm text-gray-600"
                    dangerouslySetInnerHTML={{
                      __html: temp.description
                    }}
                  />
                </div>

              </div>

              {hasActions && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">

                  <span className="text-xs font-medium text-gray-500">
                    Actions
                  </span>

                  <TemplateActions temp={temp} />

                </div>
              )}

            </div>
          ))}

          {template.length === 0 && (
            <div className="rounded-lg py-10 text-center text-sm text-gray-500">
              No templates found
            </div>
          )}

        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden overflow-x-auto lg:block">

          <table className="w-full min-w-[850px] text-left">

            <thead className="bg-gray-50">
              <tr>

                <th className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-700">
                  S.No.
                </th>

                <th className="px-5 py-4 text-sm font-semibold text-gray-700">
                  Name
                </th>

                <th className="px-5 py-4 text-sm font-semibold text-gray-700">
                  Subject
                </th>

                <th className="px-5 py-4 text-sm font-semibold text-gray-700">
                  Description
                </th>

                {hasActions && (
                  <th className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-700">
                    Action
                  </th>
                )}

              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {template.map((temp, index) => (

                <tr
                  key={temp._id}
                  className="transition-colors hover:bg-gray-50"
                >

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {(currentPage - 1) * limit + index + 1}
                  </td>

                  <td className="max-w-[200px] break-words px-5 py-4 text-sm font-medium text-gray-800">
                    {temp.name}
                  </td>

                  <td className="max-w-[220px] break-words px-5 py-4 text-sm text-gray-600">
                    {temp.subject}
                  </td>

                  <td className="max-w-[300px] px-5 py-4 text-sm text-gray-600">
                    <div
                      className="max-h-20 overflow-hidden break-words"
                      dangerouslySetInnerHTML={{
                        __html: temp.description
                      }}
                    />
                  </td>

                  {hasActions && (
                    <td className="px-5 py-4">
                      <TemplateActions temp={temp} />
                    </td>
                  )}

                </tr>

              ))}

              {template.length === 0 && (
                <tr>
                  <td
                    colSpan={hasActions ? 5 : 4}
                    className="px-5 py-10 text-center text-sm text-gray-500"
                  >
                    No templates found
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}
        <div className="flex flex-col gap-4 border-t border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">

          <p className="text-center text-sm text-gray-600 sm:text-left">
            Total Templates:{' '}
            <span className="font-semibold text-gray-800">
              {totalTemplates}
            </span>
          </p>

          <div className="flex items-center justify-center gap-3">

            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
            >
              Previous
            </button>

            <span className="whitespace-nowrap text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
            >
              Next
            </button>

          </div>

        </div>

      </div>

      {/* SEND EMAIL POPUP */}
      {showEmailForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-5">

          <div className="my-auto w-full max-w-md rounded-xl bg-white p-4 shadow-xl sm:p-6">

            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
                Send Email
              </h2>

              <button
                type="button"
                disabled={sending}
                onClick={closeEmailForm}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition hover:bg-gray-200 disabled:opacity-50"
              >
                <LuX size={20} />
              </button>
            </div>

            <div className="mb-5 rounded-lg bg-gray-50 p-3">
              <p className="break-words text-sm font-medium text-gray-800">
                Template: {selectedTemplate?.name}
              </p>

              <p className="mt-2 break-words text-sm text-gray-600">
                Subject: {selectedTemplate?.subject}
              </p>
            </div>

            <form onSubmit={handleSendEmail}>

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Recipient Email
              </label>

              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Enter recipient email"
                required
                className="mb-5 w-full rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email Type
              </label>

              <select
                value={emailType}
                onChange={(e) => setEmailType(e.target.value)}
                className="mb-5 w-full rounded-lg border border-gray-300 p-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="normal">
                  Normal Email
                </option>

                <option value="set-password">
                  Set Password Invitation
                </option>
              </select>

              <div className="flex flex-col gap-3 sm:flex-row">

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {sending ? 'Sending...' : 'Send Email'}
                </button>

                <button
                  type="button"
                  disabled={sending}
                  onClick={closeEmailForm}
                  className="w-full rounded-lg bg-gray-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default Template;
