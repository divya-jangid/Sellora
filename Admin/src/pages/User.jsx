import React from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import UserContent from '../components/UserContent'

const User = () => {
    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-100">

            {/* HEADER */}
            <div className="shrink-0">
                <Header />
            </div>

            {/* MIDDLE SECTION */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* SIDEBAR */}
                <aside className="w-64 shrink-0 h-full overflow-y-auto">
                    <Sidebar />
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 min-w-0 overflow-y-auto p-6">
                    <UserContent />
                </main>

            </div>

            {/* FOOTER */}
            <div className="shrink-0">
                <Footer />
            </div>

        </div>
    )
}

export default User