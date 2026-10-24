'use client'

import type React from 'react'

import { CopyableValue } from '@/components/ui'

export interface CredentialCardProps {
  icon: React.ReactNode
  title: string
  badge: string
  badgeTone: 'sky' | 'amber'
  email: string
  password: string
  footerLeft: string
  footerRight: string
  copyKeyPrefix: string
  copiedKey: string | null
  onCopy: (value: string, key: string) => void
}

export function CredentialCard({
  icon,
  title,
  badge,
  badgeTone,
  email,
  password,
  footerLeft,
  footerRight,
  copyKeyPrefix,
  copiedKey,
  onCopy,
}: CredentialCardProps) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">{title}</span>
        </div>
        <span
          className={`rounded border px-2 py-0.5 font-semibold text-[11px] ${
            badgeTone === 'sky'
              ? 'border-sky-200 bg-sky-100 text-sky-700'
              : 'border-amber-200 bg-amber-100 text-amber-800'
          }`}
        >
          {badge}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
        <div className="space-y-1">
          <span className="font-medium text-slate-500">Email / Username</span>
          <CopyableValue
            value={email}
            copyKey={`${copyKeyPrefix}-email`}
            copiedKey={copiedKey}
            onCopy={onCopy}
          />
        </div>
        <div className="space-y-1">
          <span className="font-medium text-slate-500">Password</span>
          <CopyableValue
            value={password}
            copyKey={`${copyKeyPrefix}-pass`}
            copiedKey={copiedKey}
            onCopy={onCopy}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
        <span>{footerLeft}</span>
        <span>{footerRight}</span>
      </div>
    </div>
  )
}
