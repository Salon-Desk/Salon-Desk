'use client'

import dynamic from 'next/dynamic'

export const LocationPinPicker = dynamic(() => import('./LocationPinPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400">
      Loading interactive map...
    </div>
  ),
})

export const LocationPinDisplay = dynamic(() => import('./LocationPinDisplay'), {
  ssr: false,
  loading: () => (
    <div className="flex h-52 w-full items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-xs text-stone-400">
      Loading salon location...
    </div>
  ),
})
