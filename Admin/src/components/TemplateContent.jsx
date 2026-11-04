
import React, { useState, useEffect } from 'react';
import TextEditor from './TextEditor';
import axios from 'axios';
import { toast } from 'react-hot-toast'
import {
  LuEye,
  LuSquarePen,
  LuTrash2,
  LuMail
} from "react-icons/lu";

const TemplateContent = () => {
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    subject: '',
    description: ''
  });

  const [template, setTemplate] = useState([]);
  const [editId, setEditId] = useState(null);

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
        { withCredentials: true }
      );

      setTemplate(res.data.data || []);

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
  }, [authLoading, roleName, permissions]);

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
      alert('You do not have permission to edit templates');
      return;
    }

    if (!editId && !hasPermission('template_create')) {
      alert('You do not have permission to create templates');
      return;
    }

    try {
      if (editId) {
        await axios.put(
          `http://localhost:8000/template/update/${editId}`,
          form,
          { withCredentials: true }
        );


      } else {
        await axios.post(
          'http://localhost:8000/template/create',
          form,
          { withCredentials: true }
        );

      }

      resetForm();
      await getTemplates();

    } catch (err) {
      console.log(err.response?.data || err.message);

      toast.success(
        err.response?.data?.message || 'Something went wrong'
      );
    }
  };

  // EDIT TEMPLATE
  const handleEdit = (temp) => {
    if (!hasPermission('template_edit')) {
      taost.error('You do not have permission to edit templates');
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

    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:8000/template/delete/${id}`,
        { withCredentials: true }
      );

      toast.success('Template deleted successfully');

      await getTemplates();

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
      taost.error('You do not have permission to send emails');
      return;
    }

    if (!selectedTemplate) {
      toast.warning('Please select a template');
      return;
    }

    if (!recipientEmail.trim()) {
      toast.warning('Please enter recipient email');
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

  // LOADING
  if (authLoading) {
    return (
      <div className="p-6">
        Checking permissions...
      </div>
    );
  }

  // ACCESS DENIED
  if (!hasPermission('template_view')) {
    return (
      <div className="p-6">
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
    <div className="w-full p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">

        <h1 className="text-2xl font-bold">
          Template
        </h1>

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
            className="bg-indigo-600 text-white px-5 py-3 rounded-lg"
          >
            Add New Template
          </button>
        )}

      </div>

      {/* ADD / UPDATE FORM */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">

          <h2 className="text-xl font-semibold mb-5">
            {editId ? 'Update Template' : 'Add Template'}
          </h2>

          <form onSubmit={handleSubmit}>

            {/* TEMPLATE NAME */}
            <div className="mb-5">
              <label className="block mb-2 font-medium">
                Template Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter template name"
                required
                className="w-full border rounded-lg p-3"
              />
            </div>

            {/* EMAIL SUBJECT */}
            <div className="mb-5">
              <label className="block mb-2 font-medium">
                Email Subject
              </label>

              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Enter email subject"
                required
                className="w-full border rounded-lg p-3"
              />
            </div>

            {/* EMAIL CONTENT */}
            <div className="mb-5">
              <label className="block mb-2 font-medium">
                Email Content
              </label>

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

            {/* BUTTONS */}
            <div className="flex gap-3">

              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg"
              >
                {editId ? 'Update' : 'Submit'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg"
              >
                Cancel
              </button>

            </div>

          </form>

        </div>
      )}

      {/* ALL TEMPLATES TABLE */}
      <div className="mt-8 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">

        <div className="p-5 border-b border-gray-200">

          <h2 className="text-xl font-bold text-gray-800">
            All Templates
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Manage your templates here
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-gray-100">
              <tr>

                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                  S.No.
                </th>

                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                  Name
                </th>

                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                  Subject
                </th>

                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                  Description
                </th>

                {(
                  hasPermission('template_edit') ||
                  hasPermission('template_delete') ||
                  hasPermission('template_send')
                ) && (
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  )}

              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">

              {template.map((temp, index) => (

                <tr
                  key={temp._id}
                  className="hover:bg-gray-50 transition-colors"
                >

                  <td className="px-6 py-4 text-gray-600">
                    {index + 1}
                  </td>

                  <td className="px-6 py-4 font-medium text-gray-800">
                    {temp.name}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {temp.subject}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: temp.description
                      }}
                    />
                  </td>

                  {(
                    hasPermission('template_edit') ||
                    hasPermission('template_delete') ||
                    hasPermission('template_send')
                  ) && (
                      <td className="px-6 py-4 whitespace-nowrap">

                        {/* EDIT BUTTON */}
                        {hasPermission('template_edit') && (
                          <button
                            type="button"
                            onClick={() => handleEdit(temp)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mr-2"
                          >
                            <LuSquarePen />
                          </button>
                        )}

                        {/* DELETE BUTTON */}
                        {hasPermission('template_delete') && (
                          <button
                            type="button"
                            onClick={() => handleDelete(temp._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg mr-2"
                          >
                            <LuTrash2 />
                          </button>
                        )}

                        {/* SEND EMAIL BUTTON */}
                        {hasPermission('template_send') && (
                          <button
                            type="button"
                            onClick={() => openEmailForm(temp)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                          >
                            <LuMail />
                          </button>
                        )}

                      </td>
                    )}

                </tr>

              ))}

              {template.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      4 +
                      (
                        hasPermission('template_edit') ||
                          hasPermission('template_delete') ||
                          hasPermission('template_send') ? 1 : 0
                      )
                    }
                    className="px-6 py-6 text-center text-gray-500"
                  >
                    No templates found
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* SEND EMAIL POPUP */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">

            <h2 className="text-xl font-bold mb-2">
              Send Email
            </h2>

            <p className="text-sm text-gray-500 mb-5">
              Template: {selectedTemplate?.name}
            </p>

            <p className="text-sm text-gray-600 mb-4">
              Subject: {selectedTemplate?.subject}
            </p>

            <form onSubmit={handleSendEmail}>

              {/* RECIPIENT EMAIL */}
              <label className="block font-medium mb-2">
                Recipient Email
              </label>

              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Enter recipient email"
                required
                className="w-full border rounded-lg p-3 mb-5"
              />

              {/* EMAIL TYPE */}
              <label className="block font-medium mb-2">
                Email Type
              </label>

              <select
                value={emailType}
                onChange={(e) => setEmailType(e.target.value)}
                className="w-full border rounded-lg p-3 mb-5"
              >
                <option value="normal">
                  Normal Email
                </option>

                <option value="set-password">
                  Set Password Invitation
                </option>
              </select>

              {/* BUTTONS */}
              <div className="flex gap-3">

                <button
                  type="submit"
                  disabled={sending}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Email'}
                </button>

                <button
                  type="button"
                  disabled={sending}
                  onClick={closeEmailForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-3 rounded-lg disabled:opacity-50"
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

export default TemplateContent;
