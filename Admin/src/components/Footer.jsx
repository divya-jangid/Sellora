
import React from 'react'

const Footer = () => {
  return (
    <footer className="min-h-16 bg-gradient-to-r from-indigo-100 via-white to-violet-100 border-t border-indigo-200 flex items-center justify-center flex-shrink-0 px-3 sm:px-4 py-3">

      <p className="text-slate-500 text-xs sm:text-sm text-center flex flex-wrap items-center justify-center gap-x-1.5 sm:gap-x-0 gap-y-1">

        <span className="text-indigo-500">© 2026</span>{' '}

        <span className="font-bold text-indigo-700 tracking-wide">
          Sellora
        </span>

        <span className="text-slate-500">
          . All rights reserved.
        </span>

        <span className="hidden sm:inline mx-3 text-violet-400">✦</span>

        <span className="text-violet-700 font-medium">
          Admin Panel
        </span>

      </p>

    </footer>
  )
}

export default Footer
