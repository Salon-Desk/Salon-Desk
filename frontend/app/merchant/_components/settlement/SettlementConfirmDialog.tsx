'use client'

import { AlertTriangle, Check, RefreshCw, XCircle } from 'lucide-react'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { formatUsd } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Booking } from '@/types'

export type ActionConfirmation = 'SHOW' | 'NO_SHOW' | 'VOID' | 'REAUTH' | null

export interface SettlementConfirmDialogProps {
  booking: Booking
  pendingConfirmation: ActionConfirmation
  isSettlementProcessing: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function SettlementConfirmDialog({
  booking,
  pendingConfirmation,
  isSettlementProcessing,
  onClose,
  onConfirm,
}: SettlementConfirmDialogProps) {
  if (!pendingConfirmation) return null

  return (
    <CustomResponsiveDialog
      open={Boolean(pendingConfirmation)}
      setOpen={(isOpen) => {
        if (!isOpen && !isSettlementProcessing) {
          onClose()
        }
      }}
      classNameContent="sm:max-w-md"
      header={
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
              pendingConfirmation === 'SHOW' &&
                'bg-emerald-50 text-emerald-600 border-emerald-200/80',
              pendingConfirmation === 'NO_SHOW' && 'bg-rose-50 text-rose-600 border-rose-200/80',
              pendingConfirmation === 'VOID' && 'bg-slate-100 text-slate-700 border-slate-200/80',
              pendingConfirmation === 'REAUTH' && 'bg-sky-50 text-sky-600 border-sky-200/80',
            )}
          >
            {pendingConfirmation === 'SHOW' && <Check className="h-5 w-5" />}
            {pendingConfirmation === 'NO_SHOW' && <AlertTriangle className="h-5 w-5" />}
            {pendingConfirmation === 'VOID' && <XCircle className="h-5 w-5" />}
            {pendingConfirmation === 'REAUTH' && <RefreshCw className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 text-base truncate">
              {pendingConfirmation === 'SHOW' && 'Confirm Full Payment Capture'}
              {pendingConfirmation === 'NO_SHOW' && 'Confirm No-Show Fee'}
              {pendingConfirmation === 'VOID' && 'Confirm Cancellation & Release Payment'}
              {pendingConfirmation === 'REAUTH' && 'Extend Payment Reservation'}
            </h3>
            <p className="font-mono text-xs text-slate-500 truncate">
              Booking Ref #{booking.id.slice(0, 8)}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:justify-end">
          <PrimaryButton
            variant="secondary"
            size="sm"
            isDisabled={isSettlementProcessing}
            onClick={onClose}
            className="rounded-xl text-xs h-10 px-4"
            title="Cancel"
            fullWidth={false}
          />

          {pendingConfirmation === 'SHOW' && (
            <PrimaryButton
              variant="success"
              size="sm"
              isDisabled={isSettlementProcessing}
              isLoading={isSettlementProcessing}
              onClick={onConfirm}
              className="h-10 rounded-xl px-4 text-xs font-semibold shadow-none"
              icon={!isSettlementProcessing ? <Check className="h-3.5 w-3.5 mr-1" /> : undefined}
              title={
                isSettlementProcessing
                  ? 'Capturing…'
                  : `Confirm Capture (${formatUsd(booking.servicePrice)})`
              }
              fullWidth={false}
            />
          )}

          {pendingConfirmation === 'NO_SHOW' && (
            <PrimaryButton
              variant="danger"
              size="sm"
              isDisabled={isSettlementProcessing}
              isLoading={isSettlementProcessing}
              onClick={onConfirm}
              className="h-10 rounded-xl px-4 text-xs font-semibold shadow-none"
              icon={
                !isSettlementProcessing ? <AlertTriangle className="h-3.5 w-3.5 mr-1" /> : undefined
              }
              title={
                isSettlementProcessing
                  ? 'Processing…'
                  : `Confirm Penalty (${formatUsd(booking.noShowFee)})`
              }
              fullWidth={false}
            />
          )}

          {pendingConfirmation === 'VOID' && (
            <PrimaryButton
              variant="dark"
              size="sm"
              isDisabled={isSettlementProcessing}
              isLoading={isSettlementProcessing}
              onClick={onConfirm}
              className="h-10 rounded-xl px-4 text-xs font-semibold shadow-none"
              icon={!isSettlementProcessing ? <XCircle className="h-3.5 w-3.5 mr-1" /> : undefined}
              title={isSettlementProcessing ? 'Releasing…' : 'Confirm Void ($0.00)'}
              fullWidth={false}
            />
          )}

          {pendingConfirmation === 'REAUTH' && (
            <PrimaryButton
              variant="primary"
              size="sm"
              isDisabled={isSettlementProcessing}
              isLoading={isSettlementProcessing}
              onClick={onConfirm}
              className="h-10 rounded-xl px-4 text-xs font-semibold shadow-none"
              icon={
                !isSettlementProcessing ? <RefreshCw className="h-3.5 w-3.5 mr-1" /> : undefined
              }
              title={isSettlementProcessing ? 'Extending…' : 'Confirm Extension'}
              fullWidth={false}
            />
          )}
        </div>
      }
    >
      <div className="space-y-3.5 text-xs">
        <div
          className={cn(
            'rounded-xl border p-3.5 space-y-1.5',
            pendingConfirmation === 'SHOW' &&
              'border-emerald-200 bg-emerald-50/60 text-emerald-950',
            pendingConfirmation === 'NO_SHOW' && 'border-rose-200 bg-rose-50/60 text-rose-950',
            pendingConfirmation === 'VOID' && 'border-slate-200 bg-slate-50 text-slate-900',
            pendingConfirmation === 'REAUTH' && 'border-sky-200 bg-sky-50/60 text-sky-950',
          )}
        >
          <div className="font-semibold text-xs flex items-center justify-between">
            <span>Payment Action</span>
            <span className="font-mono text-[11px] font-bold">
              {pendingConfirmation === 'SHOW' && `Capture ${formatUsd(booking.servicePrice)}`}
              {pendingConfirmation === 'NO_SHOW' && `Capture ${formatUsd(booking.noShowFee)}`}
              {pendingConfirmation === 'VOID' && 'Release $0.00'}
              {pendingConfirmation === 'REAUTH' && 'Extend Hold'}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            {pendingConfirmation === 'SHOW' &&
              `This will charge ${formatUsd(booking.servicePrice)} from the client's reserved payment and deposit it to your PayPal merchant account.`}
            {pendingConfirmation === 'NO_SHOW' &&
              `This will charge the ${formatUsd(booking.noShowFee)} no-show fee and release the remaining reserved amount.`}
            {pendingConfirmation === 'VOID' &&
              'This will release the full reserved amount. The client will not be charged anything.'}
            {pendingConfirmation === 'REAUTH' &&
              'This will extend the payment reservation window by 72 hours so the hold does not expire.'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span>Client:</span>
            <span className="font-semibold text-slate-900">{booking.clientName || 'Client'}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Service:</span>
            <span className="font-medium text-slate-800">{booking.serviceName}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Reserved Amount:</span>
            <span className="font-mono font-semibold text-amber-900">
              {formatUsd(booking.holdAmount)}
            </span>
          </div>
        </div>
      </div>
    </CustomResponsiveDialog>
  )
}
