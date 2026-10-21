'use client'

import type { LucideIcon } from 'lucide-react'
import React from 'react'

interface ReceiptRowProps {
  icon: LucideIcon
  label: string
  value: string
}

export function ReceiptRow({ icon: Icon, label, value }: ReceiptRowProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
      <div className="min-w-0">
        <p className="font-medium text-[10px] text-stone-400 uppercase tracking-wider">{label}</p>
        <p className="font-medium text-sm text-stone-900">{value}</p>
      </div>
    </div>
  )
}
