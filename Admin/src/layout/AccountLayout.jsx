
import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

const AdminLayout = () => {

    const [mobileSidebar, setMobileSidebar] = useState(false)
    const location = useLocation()

    // Close sidebar when route changes
    useEffect(() => {
        setMobileSidebar(false)
    }, [location.pathname])

    // Prevent background scrolling when mobile sidebar is open
    useEffect(() => {
        document.body.style.overflow = mobileSidebar ? 'hidden' : ''

        return () => {
            document.body.style.overflow = ''
        }
    }, [mobileSidebar])

    return (
        <div className="flex h-screen w-full min-w-0 flex-col overflow-hidden">

            {/* Header */}
            {/* <header className="shrink-0">
                <Header
                    onMenuClick={() => setMobileSidebar(true)}
                />
            </header> */}

            {/* Below Header */}
            <div className="relative flex flex-1 min-h-0 min-w-0 overflow-hidden">

                {/* Desktop Sidebar */}
                {/* <aside className="hidden lg:block w-64 shrink-0 h-full overflow-hidden">
                    <Sidebar />
                </aside> */}

                {/* Mobile Sidebar Overlay */}
                {mobileSidebar && (
                    <div
                        className="fixed inset-0 z-[100] bg-black/50 lg:hidden"
                        onClick={() => setMobileSidebar(false)}
                    >
{/* 
                        <div
                            className="w-64 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Sidebar />
                        </div> */}

                    </div>
                )}

                {/* Main Section */}
                <div className="flex flex-1 min-w-0 min-h-0 flex-col">

                    {/* Main Content */}
                    <main className="flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto bg-slate-50">
                        <Outlet />
                    </main>

                    {/* Footer */}
                    {/* <footer className="shrink-0">
                        <Footer />
                    </footer> */}

                </div>

            </div>

        </div>
    )
}

export default AdminLayout
