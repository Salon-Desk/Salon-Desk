'use client'

import { Plus, Shield } from 'lucide-react'
import { useState } from 'react'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Card } from '@/components/ui'

import { AdminStaffFormModal } from '../_components/admin-staff-form-modal'

/**
 * Platform staff invite UI.
 * Backend has create/delete but no list endpoint — invited users appear after they sign in.
 */
export default function AdminStaffPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [lastInvitedEmail, setLastInvitedEmail] = useState<string | null>(null)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-xl text-slate-900 sm:text-2xl">Platform staff</h1>
          <p className="text-xs text-slate-500">
            Invite platform_staff accounts. There is no list API yet — use invite below.
          </p>
        </div>
        <PrimaryButton
          title="Invite staff"
          size="sm"
          fullWidth={false}
          icon={<Plus className="h-4 w-4" />}
          className="h-9 rounded-xl px-3.5 text-xs"
          onClick={() => setIsOpen(true)}
        />
      </div>

      <Card className="rounded-3xl border border-slate-200 bg-white p-6">
        <Shield className="h-8 w-8 text-amber-500" />
        <p className="mt-3 text-sm font-medium text-slate-800">
          {lastInvitedEmail
            ? `Last invite sent to ${lastInvitedEmail}`
            : 'No invites sent in this session.'}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Created staff can sign in at the Admin portal with their email and temporary password.
        </p>
      </Card>

      <AdminStaffFormModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onCreated={() => setLastInvitedEmail('invite recorded')}
      />
    </div>
  )
}
