
'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'

const API = 'http://localhost:8000/banner/public'

export default function Banner() {
    const [banners, setBanners] = useState([])
    const [loading, setLoading] = useState(true)

    const getBanners = async () => {
        try {
            const res = await axios.get(API)

            const activeBanners = (res.data?.data || []).filter(
                (banner) =>
                    banner.status === 'active' &&
                    banner.position === 'home'
            )

            setBanners(activeBanners)

        } catch (error) {
            console.log(
                'GET BANNERS ERROR:',
                error.response?.data || error.message
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getBanners()
    }, [])

    if (loading || banners.length === 0) {
        return null
    }

    return (
        <section className="w-full bg-white px-3 py-4 sm:px-5 sm:py-6 lg:px-8">

            <div className="mx-auto max-w-[1500px] space-y-5">

                {banners.map((banner) => {

                    const bannerContent = (
                        <>
                            {/* Banner Image */}
                            <img
                                src={banner.image}
                                alt={banner.title || 'Sellora banner'}
                                className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-in-out group-hover:scale-[1.02]"
                            />

                            {/* Image Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

                            {/* Banner Text */}
                            <div className="absolute inset-0 flex items-center px-5 py-5 sm:px-10 md:px-14 lg:px-16">
                                <div className="max-w-[650px] text-white">

                                    {banner.title && (
                                        <h2 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
                                            {banner.title}
                                        </h2>
                                    )}

                                    {banner.description && (
                                        <p className="mt-3 max-w-xl text-xs leading-relaxed text-white/90 sm:text-sm md:mt-4 md:text-base lg:text-lg">
                                            {banner.description}
                                        </p>
                                    )}

                                    <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-purple-700 shadow-lg transition group-hover:bg-purple-600 group-hover:text-white sm:mt-6 sm:px-6 sm:py-3 sm:text-sm">
                                        Shop Now
                                        <span>→</span>
                                    </span>

                                </div>
                            </div>
                        </>
                    )

                    return (
                        <div
                            key={banner._id}
                            className="group relative h-[200px] overflow-hidden rounded-2xl bg-purple-50 shadow-sm ring-1 ring-purple-100 sm:h-[260px] sm:rounded-3xl md:h-[320px] lg:h-[360px] xl:h-[400px]"
                        >

                            {banner.link ? (
                                <Link
                                    href={banner.link}
                                    className="block h-full w-full"
                                >
                                    {bannerContent}
                                </Link>
                            ) : (
                                bannerContent
                            )}

                        </div>
                    )
                })}

            </div>

        </section>
    )
}
