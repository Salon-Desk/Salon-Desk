'use client'

import { KeyRound, Mail, ShieldAlert } from 'lucide-react'
import React from 'react'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { staffDisplayName } from '@/lib/util/staff-display'
import type { User } from '@/types/user'

interface MerchantStaffActionDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  member: User | null
  actionType: 'resend_invite' | 'reset_password'
  isLoading?: boolean
  salonName?: string
}

export function MerchantStaffActionDialog({
  open,
  onClose,
  onConfirm,
  member,
  actionType,
  isLoading = false,
  salonName,
}: MerchantStaffActionDialogProps) {
  if (!member) return null

  const isResend = actionType === 'resend_invite'
  const fullName = staffDisplayName(member) || 'Staff Member'
  const roleLabel =
    member.role === 'reception'
      ? 'Receptionist'
      : member.role === 'stylist'
        ? 'Stylist'
        : 'Team Member'

  return (
    <CustomResponsiveDialog
      open={open}
      setOpen={(isOpen) => {
        if (!isOpen && !isLoading) onClose()
      }}
      classNameContent="sm:max-w-md"
      header={
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
              isResend
                ? 'border-sky-200 bg-sky-50 text-sky-600'
                : 'border-amber-200 bg-amber-50 text-amber-600'
            }`}
          >
            {isResend ? <Mail className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-base font-extrabold tracking-tight text-slate-900">
              {isResend ? 'Resend Staff Invitation' : 'Reset Staff Password'}
            </h3>
            <p className="text-xs text-slate-500">
              {isResend
                ? 'Auto-generate and email fresh credentials'
                : 'Invalidate current password and email new temporary credentials'}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full flex-col-reverse justify-end gap-2 sm:flex-row sm:items-center">
          <PrimaryButton
            title="Cancel"
            variant="outline"
            size="sm"
            fullWidth={false}
            onClick={onClose}
            isDisabled={isLoading}
            className="h-9.5 rounded-xl px-4 text-xs font-semibold"
          />
          <PrimaryButton
            title={
              isLoading
                ? isResend
                  ? 'Resending…'
                  : 'Resetting…'
                : isResend
                  ? 'Resend Invitation'
                  : 'Reset Password'
            }
            variant="default"
            size="sm"
            fullWidth={false}
            isLoading={isLoading}
            onClick={onConfirm}
            className={`h-9.5 rounded-xl px-5 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.98] ${
              isResend ? 'bg-sky-600 hover:bg-sky-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          />
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {/* Recipient Details Pill */}
        <div className="space-y-1 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">{fullName}</span>
            <span className="rounded-full bg-slate-200/80 px-2 py-0.5 font-mono text-[10px] text-slate-700">
              {roleLabel}
            </span>
          </div>
          <p className="truncate font-mono text-xs text-slate-500">{member.email}</p>
        </div>

        {/* Informational Warning / Context Box */}
        <div
          className={`flex items-start gap-3 rounded-2xl border p-3.5 text-xs leading-relaxed ${
            isResend
              ? 'border-sky-200/80 bg-sky-50/70 text-sky-950'
              : 'border-amber-200/80 bg-amber-50/70 text-amber-950'
          }`}
        >
          {isResend ? (
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          ) : (
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          )}
          <div>
            {isResend ? (
              <span>
                A new secure <strong>8-character temporary password</strong> will be generated and
                emailed to <strong>{member.email}</strong> with a direct link to sign in to{' '}
                {salonName ? <strong>{salonName}</strong> : 'SalonDesk'}.
              </span>
            ) : (
              <span>
                This will immediately invalidate the current password for{' '}
                <strong>{member.email}</strong>. A new{' '}
                <strong>8-character temporary password</strong> will be generated and dispatched to
                their inbox.
              </span>
            )}
          </div>
        </div>
      </div>
    </CustomResponsiveDialog>
  )
}
