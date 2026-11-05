'use client'

import { ArrowLeft, Lock, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { PrimaryButton } from '@/components/button'

interface PermissionAccessDeniedProps {
  title?: string
  description?: string
  role?: string
  returnHref?: string
  returnLabel?: string
}

export function PermissionAccessDenied({
  title = 'Access Restricted',
  description = 'You do not have permission to view this page or perform this action with your current account privileges.',
  role,
  returnHref = '/admin',
  returnLabel = 'Return to Dashboard',
}: PermissionAccessDeniedProps) {
  const formattedRole = role ? role.replace(/_/g, ' ').toUpperCase() : undefined

  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-rose-200/80 bg-rose-50 text-rose-600 shadow-xs mb-4">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <h2 className="font-extrabold text-slate-900 text-xl tracking-tight mb-2">{title}</h2>

      <p className="max-w-md text-xs text-slate-500 leading-relaxed mb-4">{description}</p>

      {formattedRole && (
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-100 px-3 py-1 text-[11px] font-mono text-slate-600">
          <Lock className="h-3 w-3 text-slate-400" />
          <span>Active Role: {formattedRole}</span>
        </div>
      )}

      <div>
        <Link href={returnHref}>
          <PrimaryButton
            title={returnLabel}
            icon={<ArrowLeft className="h-3.5 w-3.5" />}
            size="sm"
            fullWidth={false}
            className="h-10 rounded-xl px-5 text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
          />
        </Link>
      </div>
    </div>
  )
}
