'use client'

import React, { type ReactNode } from 'react'

export function StatusPanel({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_24px_48px_-24px_rgba(28,25,23,0.18)] sm:p-8">
      {children}
    </div>
  )
}
