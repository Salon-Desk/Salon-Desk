'use client'

import { ArrowLeft, Lock } from 'lucide-react'
import React from 'react'

import { SandboxCredentialsIconButton } from '@/app/_components/SandboxCredentialsIconButton'
import { UserMenu } from '@/components/auth/user-menu'
import { Logo } from '@/components/brand'

export function CheckoutHeader({ onExit }: { onExit: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-stone-100 border-b bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 font-semibold text-stone-600 text-xs transition-colors hover:bg-stone-100 hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to services</span>
        </button>
        <Logo theme="light" size="sm" linkToHome={false} />
        <div className="flex items-center gap-2">
          <SandboxCredentialsIconButton />
          <span className="hidden items-center gap-1 text-[11px] font-medium text-stone-400 md:inline-flex">
            <Lock className="h-3 w-3" />
            Secure checkout
          </span>
          <UserMenu portal="client" />
        </div>
      </div>
    </header>
  )
}
