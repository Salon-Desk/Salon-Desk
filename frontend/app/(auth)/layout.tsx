'use client'

import type { ReactNode } from 'react'

import { SandboxCredentialsIconButton } from '@/app/_components/SandboxCredentialsIconButton'
import { Logo } from '@/components/brand'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo size="sm" showTagline={false} linkToHome theme="light" />
          <SandboxCredentialsIconButton />
        </div>
      </header>
      {children}
    </div>
  )
}
