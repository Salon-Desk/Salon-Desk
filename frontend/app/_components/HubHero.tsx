'use client'

import { Sparkles } from 'lucide-react'

import { Logo } from '@/components/brand'

export function HubHero() {
  return (
    <div className="mx-auto mb-10 flex max-w-3xl flex-col items-center text-center">
      <div className="mb-4">
        <Logo size="lg" showTagline={false} linkToHome={false} theme="light" />
      </div>

      <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight sm:text-3xl">
        A hold, not a charge:{' '}
        <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 bg-clip-text text-transparent">
          The AI-powered deposit ecosystem
        </span>{' '}
        for modern salons.
      </h1>

      <div className="mt-3.5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 font-semibold text-amber-900 text-xs shadow-sm">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        <span>
          Zero upfront risk for clients · 100% protection against no-shows via PayPal Authorization
          Holds
        </span>
      </div>
    </div>
  )
}
