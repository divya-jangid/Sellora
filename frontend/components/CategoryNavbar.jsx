
'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'

export default function CategoryNavbar() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getCategories = async () => {
            try {
                const res = await axios.get(
                    'http://localhost:8000/category/public'
                )

                const data =
                    res.data?.data?.categories ||
                    res.data?.categories ||
                    res.data?.data ||
                    []

                setCategories(Array.isArray(data) ? data : [])
            } catch (err) {
                console.log(
                    'CATEGORY ERROR:',
                    err.response?.data || err.message
                )
            } finally {
                setLoading(false)
            }
        }

        getCategories()
    }, [])

    return (
        <section className="w-full bg-white">

            <div className="mx-auto max-w-7xl px-4 pt-4">
                <h2 className="text-xl font-bold text-gray-900">
                    Categories
                </h2>
            </div>

            <nav className="border-y border-purple-100 px-4 py-3">
                <div className="mx-auto flex max-w-7xl gap-5 overflow-x-auto">
                    {loading ? (
                        <p className="py-4 text-sm text-gray-500">
                            Loading categories...
                        </p>
                    ) : categories.length === 0 ? (
                        <p className="py-4 text-sm text-gray-500">
                            No categories available.
                        </p>
                    ) : (
                        categories.map((category) => (
                            <Link
                                key={category._id}
                                href={`/category/${category.slug}`}
                                className="flex min-w-[90px] shrink-0 flex-col items-center gap-2 rounded-xl p-2 transition hover:bg-purple-50"
                            >
                                {category.image ? (
                                    <img
                                        src={category.image}
                                        alt={category.name}
                                        className="h-16 w-16 rounded-full border border-purple-100 object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none'
                                        }}
                                    />
                                ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-xs text-gray-500">
                                        No image
                                    </div>
                                )}

                                <span className="text-sm font-medium text-gray-700">
                                    {category.name}
                                </span>
                            </Link>
                        ))
                    )}
                </div>
            </nav>
        </section>
    )
}
