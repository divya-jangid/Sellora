
import React from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import Inventorycontent from '../components/Inventorycontent'

const Inventory = () => {
    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-100">

            {/* Fixed Header */}
            <header className="shrink-0">
                <Header />
            </header>

            {/* Remaining Screen */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* Sidebar - Only Sidebar Scrolls */}
                <aside className="h-full shrink-0 overflow-y-auto">
                    <Sidebar />
                </aside>

                {/* Main Area */}
                <div className="flex flex-1 min-w-0 min-h-0 flex-col overflow-hidden">

                    {/* Main Content - Scrollable */}
                    <main className="flex-1 min-h-0 overflow-y-auto p-6">
                        <Inventorycontent />
                    </main>

                    {/* Footer - Bottom */}
                    <footer className="shrink-0">
                        <Footer />
                    </footer>

                </div>
            </div>
        </div>
    )
}

export default Inventory
