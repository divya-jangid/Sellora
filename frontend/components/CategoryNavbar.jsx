
'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useLocationContext } from '@/context/LocationContext'

export default function CategoryNavbar() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    const { selectedStore } = useLocationContext()

    useEffect(() => {
        const getCategories = async () => {
            if (!selectedStore?._id) {
                setCategories([])
                setLoading(false)
                return
            }

            try {
                setLoading(true)

                const res = await axios.get(
                    'http://localhost:8000/category/public',
                    {
                        params: {
                            storeId: selectedStore._id
                        },
                        headers: {
                            'Cache-Control': 'no-cache'
                        }
                    }
                )

                console.log('CATEGORY API RESPONSE:', res.data)

                const data = res.data?.data || []

                setCategories(Array.isArray(data) ? data : [])

            } catch (err) {
                console.log(
                    'CATEGORY ERROR:',
                    err.response?.data || err.message
                )

                setCategories([])
            } finally {
                setLoading(false)
            }
        }

        getCategories()
    }, [selectedStore?._id])

    return (
        <section className="w-full border-y border-purple-100 bg-white">

            <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-6 lg:px-10">

                {/* HEADING */}
                <div className="mb-5 flex items-center justify-between">

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="h-1 w-7 rounded-full bg-purple-600"></span>

                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-600 sm:text-xs">
                                Explore by category
                            </p>
                        </div>

                        <h2 className="mt-1 text-lg font-extrabold text-gray-900 sm:text-2xl">
                            Shop by Category
                        </h2>
                    </div>

                    {!loading && categories.length > 0 && (
                        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                            {categories.length} Categories
                        </span>
                    )}

                </div>

                {/* CATEGORY LIST */}
                <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2 sm:gap-5">

                    {loading ? (

                        Array.from({ length: 8 }).map((_, index) => (
                            <div
                                key={index}
                                className="flex min-w-[100px] animate-pulse shrink-0 flex-col items-center rounded-2xl border border-purple-50 bg-white p-3 sm:min-w-[125px]"
                            >
                                <div className="h-16 w-16 rounded-full bg-purple-100 sm:h-20 sm:w-20"></div>

                                <div className="mt-3 h-3 w-16 rounded bg-gray-200"></div>
                            </div>
                        ))

                    ) : categories.length === 0 ? (

                        <div className="w-full rounded-xl bg-purple-50 px-4 py-8 text-center">
                            <p className="text-sm font-medium text-gray-600">
                                No categories available.
                            </p>
                        </div>

                    ) : (

                        categories.map((category) => (
                            <Link
                                key={category._id}
                                href={`/category/${category.slug}`}
                                className="group flex min-w-[100px] shrink-0 flex-col items-center rounded-2xl border border-transparent bg-white px-3 py-3 transition duration-300 hover:border-purple-200 hover:bg-purple-50 hover:shadow-md hover:shadow-purple-100 sm:min-w-[125px] sm:px-4 sm:py-4"
                            >

                                {/* CATEGORY IMAGE */}
                                <div className="flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full border-2 border-purple-100 bg-[#f7f3ff] transition duration-300 group-hover:scale-105 group-hover:border-purple-400 sm:h-20 sm:w-20">

                                    {category.image ? (
                                        <img
                                            src={category.image}
                                            alt={category.name}
                                            loading="lazy"
                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <span className="text-[10px] font-medium text-purple-400">
                                            No image
                                        </span>
                                    )}

                                </div>

                                {/* CATEGORY NAME */}
                                <span className="mt-3 line-clamp-2 min-h-9 w-full text-center text-xs font-semibold leading-4 text-gray-700 transition group-hover:text-purple-700 sm:text-sm">
                                    {category.name}
                                </span>

                            </Link>
                        ))

                    )}

                </div>

            </div>

        </section>
    )
}
