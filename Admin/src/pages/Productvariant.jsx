import React from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import ProductvariantContent from '../components/ProductvariantContent'

const Productvariant = () => {

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col">

      <Header />

      <div className="flex flex-1 min-h-0 overflow-hidden">

        <Sidebar />

        <main className="flex-1 min-w-0 overflow-y-auto">
          <ProductvariantContent />
        </main>

      </div>

      <Footer />

    </div>
  )
}

export default Productvariant