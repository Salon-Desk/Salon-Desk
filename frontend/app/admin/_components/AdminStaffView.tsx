'use client'

import { Plus, Shield } from 'lucide-react'
import React, { useState } from 'react'

import { Card } from '@/components/ui'
import PrimaryButton from '@/components/ui/primary-button'

import { AdminStaffFormModal } from './AdminStaffFormModal'

export function AdminStaffView() {
  const [isOpen, setIsOpen] = useState(false)
  const [lastInvitedEmail, setLastInvitedEmail] = useState<string | null>(null)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl sm:text-2xl">Platform staff</h1>
          <p className="text-slate-500 text-xs">
            Invite platform_staff accounts via the admin API (platform admin role required).
          </p>
        </div>
        <PrimaryButton
          title="Invite staff"
          size="sm"
          fullWidth={false}
          icon={<Plus className="h-4 w-4" />}
          className="h-9 rounded-lg px-3.5 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          onClick={() => setIsOpen(true)}
        />
      </div>

      <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <Shield className="h-8 w-8 text-amber-500" />
        <p className="mt-3 font-medium text-slate-800 text-sm">
          {lastInvitedEmail
            ? `Last invite: ${lastInvitedEmail}`
            : 'No invites sent in this session.'}
        </p>
        <p className="mt-1 text-slate-500 text-xs">
          Created staff can sign in at the Admin portal with their email and password.
        </p>
      </Card>

      <AdminStaffFormModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onCreated={(email) => setLastInvitedEmail(email)}
      />
    </div>
  )
}
