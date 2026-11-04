import React from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import CategoryContent from '../components/CategoryContent'

const Category = () => {
    return (
        <div className="h-screen bg-slate-50 flex flex-col">

            {/* Header */}
            <Header />

            {/* Body */}
            <div className="flex flex-1 min-h-0">

                {/* Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <main className="flex-1 min-w-0 overflow-y-auto">
                    <CategoryContent />
                </main>

            </div>

            {/* Footer */}
            <Footer />

        </div>
    )
}

export default Category