
'use client'

import Image from 'next/image'

export default function Banner() {
    return (
        <section className="w-full px-4 py-5 md:px-8">
            <div className="relative mx-auto h-[200px] max-w-7xl overflow-hidden rounded-2xl bg-purple-100 sm:h-[280px] md:h-[350px]">

                <Image
                    src="/banner-new.png"
                    alt="Grocery Banner"
                    fill
                    priority
                    className="object-cover"
                />

            </div>
        </section>
    )
}
