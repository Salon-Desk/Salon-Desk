'use client'

import { KeyRound, Scissors, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { UserMenu } from '@/components/auth/user-menu'
import { Logo } from '@/components/brand'
import { ROUTES } from '@/lib/constants'

import { AppCard } from './app-card'
import { SandboxModal } from './SandboxModal'

export function HubExperience() {
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 selection:bg-amber-500/20 selection:text-amber-900 relative">
      <div className="absolute top-6 right-6 z-20">
        <UserMenu />
      </div>

      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-12 flex flex-col items-center text-center">
          <div className="mb-4">
            <Logo size="md" showTagline={false} linkToHome={false} theme="light" />
          </div>
          <h1 className="font-extrabold text-3xl text-slate-900 tracking-tight sm:text-4xl">
            SalonDesk
          </h1>
          <p className="mt-2 max-w-xl text-base text-slate-600">
            Select a portal to explore the authorization-hold deposit ecosystem
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <AppCard
            title="Client Experience"
            description="Mobile-optimized salon discovery, conversational AI booking assistant, and PayPal zero-debit authorization hold checkout."
            badge="Client"
            badgeTone="sky"
            icon={Sparkles}
            route={ROUTES.client}
            actionLabel="Launch Client"
          />

          <AppCard
            title="Salon Console"
            description="Real-time salon operations console, status-coded schedule timeline, and 1-click Human-in-the-Loop settlement actions."
            badge="Salon"
            badgeTone="amber"
            icon={Scissors}
            route={ROUTES.merchant}
            actionLabel="Launch Console"
          />

          <AppCard
            title="Platform Admin"
            description="Multi-tenant salon governance, merchant verification, policy amendment reviews, and immutable audit ledger."
            badge="Admin"
            badgeTone="emerald"
            icon={ShieldCheck}
            route={ROUTES.admin}
            actionLabel="Launch Admin"
          />

          <AppCard
            title="Sandbox & Keys"
            description="Inspect PayPal sandbox test buyer & merchant accounts, authorization hold payloads, and developer tools."
            badge="Developer"
            badgeTone="purple"
            icon={KeyRound}
            onClick={() => setIsSandboxModalOpen(true)}
            actionLabel="View Credentials"
          />
        </div>
      </div>

      {isSandboxModalOpen && <SandboxModal onClose={() => setIsSandboxModalOpen(false)} />}
    </div>
  )
}
