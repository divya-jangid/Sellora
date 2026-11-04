import React from 'react'

const Footer = () => {
  return (
    <footer className="h-16 bg-gradient-to-r from-indigo-100 via-white to-violet-100 border-t border-indigo-200 flex items-center justify-center flex-shrink-0 px-4">

      <p className="text-slate-500 text-sm text-center">
        <span className="text-indigo-500">© 2026</span>{' '}
        <span className="font-bold text-indigo-700 tracking-wide">Sellora</span>
        <span className="text-slate-500">. All rights reserved.</span>

        <span className="mx-3 text-violet-400">✦</span>

        <span className="text-violet-700 font-medium">
          Admin Panel
        </span>
      </p>

    </footer>
  )
}

export default Footer