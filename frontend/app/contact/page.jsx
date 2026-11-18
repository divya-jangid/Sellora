
"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Contact form UI ready! Backend integration is pending.");
  };

  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-50 via-white to-pink-50 px-5 py-20 text-center">
        <span className="rounded-full border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700">
          Get In Touch
        </span>

        <h1 className="mt-6 text-4xl font-extrabold text-gray-900 sm:text-5xl">
          Contact <span className="text-purple-700">Sellora</span>
          <span className="text-pink-500">.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-gray-500">
          Have a question or need assistance? We are here to help.
          Get in touch with us and let us know how we can assist you.
        </p>
      </section>

      {/* Contact Content */}
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:px-10">

        {/* Left */}
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-purple-700">
            Contact Information
          </p>

          <h2 className="mt-3 text-3xl font-extrabold text-gray-900">
            We'd Love to Hear From You
          </h2>

          <p className="mt-5 leading-8 text-gray-500">
            Whether you have a question about products, orders or anything
            else, feel free to reach out to us.
          </p>

          <div className="mt-9 space-y-5">

            <div className="flex gap-4 rounded-2xl border border-purple-100 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-2xl">
                📩
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Email Support</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Contact us through our support email.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-purple-100 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-2xl">
                🛍️
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Order Assistance</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Need help with your shopping or order?
                  We're here to assist.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-purple-100 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-2xl">
                💬
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Customer Support</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Share your questions and feedback with us.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-3xl border border-purple-100 bg-[#faf8ff] p-6 shadow-sm sm:p-9">
          <h2 className="text-2xl font-extrabold text-gray-900">
            Send Us a Message
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Fill out the form below and share your query.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Your Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-purple-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-purple-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                required
                value={form.subject}
                onChange={handleChange}
                placeholder="Enter subject"
                className="w-full rounded-xl border border-purple-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Message
              </label>
              <textarea
                name="message"
                required
                rows={5}
                value={form.message}
                onChange={handleChange}
                placeholder="Write your message..."
                className="w-full resize-none rounded-xl border border-purple-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-purple-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-1 hover:bg-purple-800"
            >
              Send Message →
            </button>

          </form>
        </div>

      </section>
    </main>
  );
}
