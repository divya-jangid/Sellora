import React from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import OrderContent from '../components/OrderContent'

const Orders = () => {
    return (
        <div className="h-screen flex flex-col overflow-hidden">

            {/* FIXED HEADER */}
            <div className="h-16 flex-shrink-0 z-50">
                <Header />
            </div>

            {/* MIDDLE SECTION */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* SIDEBAR - OWN SCROLL */}
                <aside className="w-64 flex-shrink-0 h-full overflow-y-auto">
                    <Sidebar />
                </aside>

                {/* MAIN CONTENT - OWN SCROLL */}
                <main className="flex-1 min-w-0 h-full overflow-y-auto">
                    <OrderContent />
                </main>

            </div>

            {/* FIXED FOOTER */}
            <div className="flex-shrink-0 z-50">
                <Footer />
            </div>

        </div>
    )
}

export default Orders