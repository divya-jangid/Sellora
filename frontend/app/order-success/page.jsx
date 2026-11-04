
'use client'

import Link from 'next/link'

export default function OrderSuccess() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-purple-50 px-4 py-10">
            <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-lg">

                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
                    <svg
                        className="h-14 w-14 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 12l4 4L19 6"
                        />
                    </svg>
                </div>

                <h1 className="mt-6 text-3xl font-bold text-gray-800">
                    Order Placed Successfully!
                </h1>

                <p className="mt-3 text-gray-600">
                    Thank you for shopping with Sellora.
                </p>

                <p className="mt-2 text-sm text-gray-500">
                    Your order has been placed. You can check your order
                    details and status in My Orders.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href="/my-orders"
                        className="flex-1 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-700"
                    >
                        View My Orders
                    </Link>

                    <Link
                        href="/"
                        className="flex-1 rounded-xl border border-purple-200 px-5 py-3 font-semibold text-purple-700 transition hover:bg-purple-50"
                    >
                        Continue Shopping
                    </Link>
                </div>

            </div>
        </main>
    )
}
