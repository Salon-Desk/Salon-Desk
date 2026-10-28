'use client'

import { KeyRound, Mail, ShieldAlert } from 'lucide-react'
import React from 'react'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import type { User } from '@/types/user'

interface StaffActionConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  member: User | null
  actionType: 'resend_invite' | 'reset_password'
  isLoading?: boolean
}

export function StaffActionConfirmDialog({
  open,
  onClose,
  onConfirm,
  member,
  actionType,
  isLoading = false,
}: StaffActionConfirmDialogProps) {
  if (!member) return null

  const isResend = actionType === 'resend_invite'
  const fullName =
    [member.profile?.first_name, member.profile?.last_name].filter(Boolean).join(' ') ||
    'Staff Member'

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
            <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
              {isResend ? 'Resend Staff Invitation' : 'Reset Staff Password'}
            </h3>
            <p className="text-slate-500 text-xs">
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
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900">{fullName}</span>
            <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-mono text-slate-700">
              {member.role === 'platform_admin' ? 'Super Admin' : 'Support Agent'}
            </span>
          </div>
          <p className="font-mono text-xs text-slate-500 truncate">{member.email}</p>
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
            <Mail className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
          ) : (
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          )}
          <div>
            {isResend ? (
              <span>
                A new secure <strong>8-character temporary password</strong> will be generated and
                emailed to <strong>{member.email}</strong> with a direct link to sign in to the
                platform admin portal.
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
