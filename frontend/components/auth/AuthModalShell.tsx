'use client'

import type { ReactNode } from 'react'

import { useAuthModal } from '@/components/auth/auth-context'
import CustomResponsiveDialog from '@/components/dialog/CustomResponsiveDialog'
import { cn } from '@/lib/utils'

interface AuthModalShellProps {
  title: string
  description?: string
  icon?: ReactNode
  tabs?: ReactNode
  children: ReactNode
  classNameBody?: string
}

export function AuthModalShell({
  title,
  description,
  icon,
  tabs,
  children,
  classNameBody,
}: AuthModalShellProps) {
  const { isOpen, closeAuthModal } = useAuthModal()

  return (
    <CustomResponsiveDialog
      open={isOpen}
      setOpen={(open) => {
        if (!open) closeAuthModal()
      }}
      header={
        <div className="pt-6 pb-2 text-center">
          {icon ? (
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600">
              {icon}
            </div>
          ) : null}
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
          {tabs ? <div className="mt-4">{tabs}</div> : null}
        </div>
      }
      classNameContent="max-w-lg"
      classNameBody={cn('py-4', classNameBody)}
      hideFooterBorder
    >
      {children}
    </CustomResponsiveDialog>
  )
}
