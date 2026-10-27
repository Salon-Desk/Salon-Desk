'use client'

import { KeyRound } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

import { SandboxModal } from './SandboxModal'

interface SandboxCredentialsIconButtonProps {
  className?: string
}

export function SandboxCredentialsIconButton({ className }: SandboxCredentialsIconButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Sandbox credentials"
        title="Sandbox credentials"
        className={cn(
          'inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-amber-200/80 bg-amber-50/80 text-amber-700 transition-colors hover:bg-amber-100 hover:text-amber-900',
          className,
        )}
      >
        <KeyRound className="h-3.5 w-3.5" />
      </button>
      {open ? <SandboxModal onClose={() => setOpen(false)} /> : null}
    </>
  )
}
