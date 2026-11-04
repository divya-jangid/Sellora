import React from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import TemplateContent from '../components/TemplateContent'

const Template = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">

          <div className="flex-1 p-6 overflow-y-auto">
            <TemplateContent />
          </div>

          <Footer />

        </div>
      </div>
    </div>
  )
}

export default Template