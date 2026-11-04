import React from 'react'

const Card = ( {title, value, note, icon }) => {
  return (
    <div>
      <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-slate-500">
                                    {title}
                                </p>
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                                    {icon}
                                </span>
                            </div>

                            <h2 className="text-3xl font-bold mt-3 text-slate-800">
                                {value}
                            </h2>

                            <p className="mt-2 text-xs font-medium text-emerald-600">
                                {note}
                            </p>
                        </div>
    </div>
  )
}

export default Card
