import React from 'react'

const Header = () => {

    return (
        <nav className="h-20 bg-gradient-to-r from-white via-indigo-50/50 to-violet-50 border-b border-indigo-100 shadow-sm flex items-center justify-between px-8 flex-shrink-0">

            {/* Logo */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <span className="text-white text-2xl font-bold">S</span>
                </div>

                <div>
                    <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-transparent tracking-tight">
                        Sellora
                    </h1>
                    <p className="text-xs text-slate-500 font-medium tracking-wide">
                        SHOP <span className="text-indigo-400">•</span> SELL <span className="text-indigo-400">•</span> GROW
                    </p>
                </div>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-4">

                <div className="hidden sm:block text-right">
                    <p className="text-sm font-bold text-slate-800">
                        Divya Jangid
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <p className="text-xs font-medium text-indigo-600">
                            Administrator
                        </p>
                    </div>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-200 border border-indigo-200 flex items-center justify-center shadow-sm">
                    <span className="text-2xl">👤</span>
                </div>

            </div>

        </nav>
    )
}

export default Header