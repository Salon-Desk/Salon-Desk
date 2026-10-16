'use client'

import { ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui'
import { ROUTES } from '@/lib/constants'

interface AuthGateProps {
  title: string
  subtitle: string
  email: string
  password: string
  onSignIn: () => void
  extraAction?: ReactNode
}

/** Demo sign-in card shown when a console is locked. */
export function AuthGate({
  title,
  subtitle,
  email,
  password,
  onSignIn,
  extraAction,
}: AuthGateProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200/80 bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size="md" linkToHome theme="light" />
          <h1 className="mt-4 font-bold text-lg text-slate-900">{title}</h1>
          <p className="mt-1 text-slate-500 text-xs leading-relaxed">{subtitle}</p>
        </div>

        <div className="mb-5 space-y-2 rounded-lg border border-slate-200/80 bg-slate-50 p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Sandbox email</span>
            <span className="font-mono font-semibold text-slate-800">{email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Password</span>
            <span className="font-mono font-semibold text-slate-800">{password}</span>
          </div>
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={onSignIn}>
          <Lock className="h-4 w-4" />
          Sign in with sandbox credentials
        </Button>
        {extraAction}

        <Link
          href={ROUTES.hub}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 font-semibold text-slate-500 text-xs hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to App Hub
        </Link>
      </div>
    </div>
  )
}
