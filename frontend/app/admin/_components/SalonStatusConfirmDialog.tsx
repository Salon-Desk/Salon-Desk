'use client'

import { AlertTriangle, PauseCircle, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react'
import React from 'react'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'

interface SalonStatusConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  salonName: string
  targetAction: 'approve' | 'suspend'
  isLoading?: boolean
}

export function SalonStatusConfirmDialog({
  open,
  onClose,
  onConfirm,
  salonName,
  targetAction,
  isLoading = false,
}: SalonStatusConfirmDialogProps) {
  const isSuspend = targetAction === 'suspend'

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
              isSuspend
                ? 'border-rose-200 bg-rose-50 text-rose-600'
                : 'border-emerald-200 bg-emerald-50 text-emerald-600'
            }`}
          >
            {isSuspend ? <PauseCircle className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
              {isSuspend ? 'Suspend Salon Access' : 'Activate Salon Partner'}
            </h3>
            <p className="text-slate-500 text-xs">
              {isSuspend
                ? 'Warning: Disables client bookings and discovery'
                : 'Publishes salon to live marketplace discovery'}
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
            className="h-9 rounded-xl px-4 text-xs font-semibold"
            isDisabled={isLoading}
            onClick={onClose}
          />
          <PrimaryButton
            title={
              isLoading
                ? isSuspend
                  ? 'Suspending…'
                  : 'Activating…'
                : isSuspend
                  ? 'Confirm Suspension'
                  : 'Confirm Activation'
            }
            variant={isSuspend ? 'default' : 'default'}
            size="sm"
            fullWidth={false}
            icon={
              isSuspend ? <ShieldAlert className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />
            }
            className={`h-9 rounded-xl px-4 text-xs font-bold text-white shadow-xs ${
              isSuspend
                ? 'bg-rose-600 hover:bg-rose-700 border-rose-600'
                : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600'
            }`}
            isLoading={isLoading}
            isDisabled={isLoading}
            onClick={onConfirm}
          />
        </div>
      }
    >
      <div className="space-y-4 pt-1 text-slate-700 text-xs">
        <p className="leading-relaxed">
          Are you sure you want to {isSuspend ? 'suspend' : 'activate'}{' '}
          <strong className="text-slate-950 font-semibold">{salonName}</strong>?
        </p>

        <div
          className={`rounded-2xl border p-3.5 space-y-2 ${
            isSuspend
              ? 'border-rose-200/90 bg-rose-50/50 text-rose-950'
              : 'border-emerald-200/90 bg-emerald-50/50 text-emerald-950'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-xs">
            {isSuspend ? (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            )}
            <span>{isSuspend ? 'Consequences of Suspension' : 'Activation Details'}</span>
          </div>

          <ul className="space-y-1.5 pl-5 list-disc text-xs leading-relaxed opacity-90">
            {isSuspend ? (
              <>
                <li>
                  Salon will be instantly hidden from client search &amp; marketplace discovery.
                </li>
                <li>New appointment reservations and calendar slots will be closed.</li>
                <li>PayPal payment authorization holds will be paused for this salon.</li>
                <li>You can reactivate this partner at any time from this dashboard.</li>
              </>
            ) : (
              <>
                <li>Salon will immediately appear in public marketplace discovery.</li>
                <li>Verified clients can select specialists and book appointments online.</li>
                <li>PayPal authorization holds and checkout guarantees will be enabled.</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </CustomResponsiveDialog>
  )
}
