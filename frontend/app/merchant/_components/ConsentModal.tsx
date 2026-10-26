'use client'

import { CheckCircle, Clock, DollarSign, ShieldCheck, User } from 'lucide-react'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { Panel } from '@/components/ui'
import { formatUsd } from '@/lib/format'
import type { Booking } from '@/types'

interface ConsentModalProps {
  booking: Booking
  onClose: () => void
}

export function ConsentModal({ booking, onClose }: ConsentModalProps) {
  const freeHours = booking.policySnapshot?.free_cancel_hours
  const policyName =
    typeof booking.policySnapshot?.name === 'string' ? booking.policySnapshot.name : null

  return (
    <CustomResponsiveDialog
      open={true}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      header={
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-base">Booking Agreement Details</h3>
        </div>
      }
      footer={
        <PrimaryButton
          variant="secondary"
          onClick={onClose}
          className="w-full sm:w-auto h-10 px-5 text-xs font-semibold"
          title="Close"
          fullWidth={false}
        />
      }
    >
      <p className="font-sans text-slate-600 text-sm leading-relaxed">
        This record shows the client&apos;s agreement for their appointment. The client authorized a
        PayPal hold of{' '}
        <span className="font-semibold text-slate-900">{formatUsd(booking.holdAmount)}</span> with{' '}
        <span className="font-semibold text-emerald-600">$0 charged upfront</span>. The hold will be
        captured after the appointment is completed or voided if cancelled on time.
      </p>

      <Panel className="mt-4 space-y-3 bg-white">
        {/* Client Info */}
        <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
          <User className="h-4 w-4 text-slate-400 mt-0.5" />
          <div className="flex-1">
            <div className="text-[10px] text-slate-500 uppercase font-medium">Client</div>
            <div className="font-semibold text-slate-900 text-sm">{booking.clientName}</div>
            <div className="text-xs text-slate-600">{booking.clientEmail}</div>
          </div>
        </div>

        {/* Service Info */}
        <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
          <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
          <div className="flex-1">
            <div className="text-[10px] text-slate-500 uppercase font-medium">Appointment</div>
            <div className="font-semibold text-slate-900 text-sm">{booking.serviceName}</div>
            <div className="text-xs text-slate-600">
              {booking.stylistName && `with ${booking.stylistName} • `}
              {booking.appointmentTime}
            </div>
          </div>
        </div>

        {/* Financial Terms */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-slate-600">Hold Amount</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm">
              {formatUsd(booking.holdAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-slate-600">No-Show / Late Cancel Fee</span>
            </div>
            <span className="font-semibold text-slate-900 text-sm">
              {formatUsd(booking.noShowFee)}
            </span>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
          <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
          <div className="flex-1">
            <div className="text-[10px] text-slate-500 uppercase font-medium">
              Free Cancellation
            </div>
            <div className="font-semibold text-emerald-700 text-sm">
              Until {booking.freeCancelDeadlineLabel}
            </div>
            {freeHours != null && (
              <div className="text-xs text-slate-600">
                {String(freeHours)} hour policy window
                {policyName ? ` under "${policyName}"` : null}
              </div>
            )}
          </div>
        </div>

        {/* PayPal Reference */}
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[10px] text-slate-500 uppercase font-medium">
            PayPal Authorization
          </div>
          <div className="font-mono text-xs text-slate-700 mt-1">{booking.paypalAuthId}</div>
        </div>

        {/* Verification Badge */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 bg-emerald-50 -mx-2 px-2 py-2 rounded">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span className="text-xs text-emerald-800 font-medium">
            Digitally signed and verified by client
          </span>
        </div>
      </Panel>
    </CustomResponsiveDialog>
  )
}
