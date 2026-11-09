'use client'

import { Check, Key, RotateCcw, Scissors, Shield, ShieldCheck, Sparkles, User } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useQuickDemoSignIn } from '@/components/auth/DemoPersonasPanel'
import { toastColor } from '@/constant/toast-color'
import { SANDBOX_CREDENTIALS } from '@/lib/constants'
import { resetAllDemoStores } from '@/lib/sandbox/demo-reset'

import { SandboxModal } from './SandboxModal'

export function DemoToolbar() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [copiedBuyer, setCopiedBuyer] = useState(false)
  const { signInAs, isLoading: isSigningIn } = useQuickDemoSignIn()

  const handleCopySandboxBuyer = async () => {
    try {
      const buyer = SANDBOX_CREDENTIALS.buyerAccount
      const text = `Email: ${buyer.email}\nPassword: ${buyer.password}`
      await navigator.clipboard.writeText(text)
      setCopiedBuyer(true)
      toast.success('PayPal Sandbox Buyer credentials copied!', toastColor.success)
      setTimeout(() => setCopiedBuyer(false), 2000)
    } catch {
      toast.error('Failed to copy buyer credentials', toastColor.error)
    }
  }

  const handleResetDemo = async () => {
    setIsResetting(true)
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' })
      if (!res.ok) {
        throw new Error(`Reset returned HTTP ${res.status}`)
      }
      resetAllDemoStores()
      toast.success(
        'Demo state successfully reset to fresh Selam Hair Studio baseline!',
        toastColor.success,
      )
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    } catch {
      resetAllDemoStores()
      toast.info('Local client demo state reset.', toastColor.info)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
      <aside
        aria-label="Sandbox credentials"
        className="fixed inset-x-0 bottom-0 z-40 border-slate-200 border-t bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md sm:px-6"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-xs md:flex-row">
          {/* Left: Judge Mode 1-Click Persona Switcher */}
          <div className="flex w-full items-center justify-between gap-2 md:w-auto md:justify-start flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 pr-1">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="uppercase text-[11px] tracking-wider text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-200">
                Judge Mode
              </span>
            </div>

            {/* Quick Switch: Client */}
            <button
              type="button"
              disabled={isSigningIn}
              onClick={() =>
                signInAs({
                  email: 'abebe07@personal.example.com',
                  label: 'Client (Abebe)',
                  portal: 'client',
                  destination: '/client',
                })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
              title="Sign in as Client (Abebe) & open AI booking"
            >
              <User className="h-3 w-3 text-sky-600" />
              <span>Client</span>
            </button>

            {/* Quick Switch: Salon Owner */}
            <button
              type="button"
              disabled={isSigningIn}
              onClick={() =>
                signInAs({
                  email: 'owner@selam.local',
                  label: 'Salon Owner (Selam)',
                  portal: 'merchant',
                  destination: '/merchant/appointments',
                })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
              title="Sign in as Salon Owner (Selam) & open Appointments & Disputes"
            >
              <Scissors className="h-3 w-3 text-amber-700" />
              <span>Salon Owner</span>
            </button>

            {/* Quick Switch: Admin */}
            <button
              type="button"
              disabled={isSigningIn}
              onClick={() =>
                signInAs({
                  email: 'admin@salondesk.local',
                  label: 'Platform Admin',
                  portal: 'admin',
                  destination: '/admin/salons',
                })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
              title="Sign in as Platform Admin & open Commission / Salons"
            >
              <Shield className="h-3 w-3 text-purple-600" />
              <span>Admin</span>
            </button>

            {/* 1-Click Copy PayPal Sandbox Buyer */}
            <button
              type="button"
              onClick={handleCopySandboxBuyer}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-[11px] font-semibold text-blue-800 hover:bg-blue-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
              title="Copy PayPal Sandbox Buyer Email & Password"
            >
              {copiedBuyer ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-700">Copied Buyer!</span>
                </>
              ) : (
                <>
                  <Key className="h-3 w-3 text-blue-600" />
                  <span>Copy Sandbox Buyer</span>
                </>
              )}
            </button>

            {/* 1-Click Reset Demo */}
            <button
              type="button"
              disabled={isResetting}
              onClick={handleResetDemo}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
              title="Reset sandbox database to pristine state"
            >
              <RotateCcw className={`h-3 w-3 text-rose-600 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Resetting...' : 'Reset Demo'}</span>
            </button>
          </div>

          {/* Right: Sandbox credentials modal & tech stack */}
          <div className="flex items-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium underline underline-offset-2 cursor-pointer"
            >
              <Key className="h-3 w-3 text-amber-600" />
              <span>Full Credentials &amp; API Specs</span>
            </button>

            <span className="hidden text-slate-300 md:inline">|</span>

            <div className="hidden items-center gap-1.5 text-[10px] text-slate-500 xl:flex">
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                <Sparkles className="h-2.5 w-2.5 text-amber-600" /> AG Grid
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                <ShieldCheck className="h-2.5 w-2.5 text-blue-600" /> PayPal Holds
              </span>
            </div>
          </div>
        </div>
      </aside>

      {isModalOpen && <SandboxModal onClose={() => setIsModalOpen(false)} />}
    </>
  )
}
