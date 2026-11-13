import React from 'react'
import { Outlet } from 'react-router-dom'

import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'

const AdminLayout = () => {
    return (
        <div className="flex h-screen flex-col overflow-hidden">

            {/* Full Width Header */}
            <header className="shrink-0">
                <Header />
            </header>

            {/* Below Header */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* Sidebar */}
                <aside className="w-64 shrink-0 overflow-y-auto">
                    <Sidebar />
                </aside>

                {/* Main Section */}
                <div className="flex flex-1 min-w-0 min-h-0 flex-col">

                    {/* Main Content */}
                    <main className="flex-1 min-h-0 overflow-y-auto bg-slate-50">
                        <Outlet />
                    </main>

                    {/* Footer */}
                    <footer className="shrink-0">
                        <Footer />
                    </footer>

                </div>
            </div>
        </div>
    )
}

export default AdminLayout