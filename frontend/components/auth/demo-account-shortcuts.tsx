'use client'

import { Scissors, ShieldCheck, User } from 'lucide-react'
import { useState } from 'react'

import {
  DEMO_ACCOUNT_PASSWORD,
  type DemoPersona,
  useQuickDemoSignIn,
} from '@/components/auth/demo-personas-panel'

/** Primary seeded logins: client, flagship salon owner, platform admin. */
export const PRIMARY_DEMO_ACCOUNTS: DemoPersona[] = [
  {
    email: 'client@example.com',
    label: 'Ada Client',
    subtitle: 'Client',
    destination: '/client',
    portal: 'client',
    icon: <User className="h-3.5 w-3.5" />,
    toneClass: 'border-sky-200 bg-sky-50/70 hover:bg-sky-100 text-sky-700',
    badgeClass: 'text-sky-700',
  },
  {
    email: 'owner@abibeautysalon.local',
    label: 'Abel Bekele',
    subtitle: 'Abi Beauty',
    destination: '/merchant',
    portal: 'merchant',
    icon: <Scissors className="h-3.5 w-3.5" />,
    toneClass: 'border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-700',
    badgeClass: 'text-amber-800',
  },
  {
    email: 'admin@salondesk.local',
    label: 'Platform Admin',
    subtitle: 'Admin',
    destination: '/admin',
    portal: 'admin',
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    toneClass: 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700',
    badgeClass: 'text-emerald-800',
  },
]

interface DemoAccountShortcutsProps {
  onOpenAll?: () => void
}

export function DemoAccountShortcuts({ onOpenAll }: DemoAccountShortcutsProps) {
  const { signInAs, isLoading } = useQuickDemoSignIn()
  const [activeEmail, setActiveEmail] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <span className="relative bg-white px-2 text-[11px] text-slate-400">
          seeded accounts ·{' '}
          <code className="font-mono text-amber-700">{DEMO_ACCOUNT_PASSWORD}</code>
        </span>
      </div>

      <div className="space-y-1.5">
        {PRIMARY_DEMO_ACCOUNTS.map((account) => {
          const pending = isLoading && activeEmail === account.email
          return (
            <button
              key={account.email}
              type="button"
              disabled={isLoading}
              onClick={() => {
                setActiveEmail(account.email)
                void signInAs(account)
              }}
              className={`flex w-full min-w-0 items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors disabled:opacity-60 ${account.toneClass}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80">
                {account.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-slate-900">{account.label}</span>
                  <span
                    className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${account.badgeClass}`}
                  >
                    {pending ? 'Signing in…' : account.subtitle}
                  </span>
                </span>
                <span className="block text-[11px] text-slate-500">{account.email}</span>
              </span>
            </button>
          )
        })}
      </div>

      {onOpenAll ? (
        <button
          type="button"
          onClick={onOpenAll}
          className="w-full text-center text-[11px] font-semibold text-amber-700 hover:text-amber-800"
        >
          More personas
        </button>
      ) : null}
    </div>
  )
}
