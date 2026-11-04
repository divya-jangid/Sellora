import React from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import RoleContent from '../components/RoleContent'

const Role = () => {
  return (
    <div className="h-screen bg-slate-50 flex flex-col">

      <Header />

      <div className="flex flex-1 min-h-0">

        <Sidebar />

        <main className="flex-1 min-w-0 overflow-y-auto">
          <RoleContent />
        </main>

      </div>

      <Footer />

    </div>
  )
}

export default Role