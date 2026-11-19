
import React from 'react'
import { Outlet } from 'react-router-dom'

const AdminLayout = () => {

    return (
        <div className="w-full min-w-0 min-h-screen bg-slate-50">

            <main className="w-full min-w-0 min-h-screen overflow-x-hidden">

                <Outlet />

            </main>

        </div>
    )
}

export default AdminLayout
