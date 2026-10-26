'use client'

import {
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Lock,
  Plus,
  Search,
  Shield,
  User,
  XCircle,
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { RescheduleBookingDialog } from '@/components/dialog'
import { EmptyState, HoldStateBadge } from '@/components/ui'
import { buildCancelOutcomePreview } from '@/lib/booking/cancel-policy'
import { formatBookingRef, formatUsd } from '@/lib/format'
import { shouldUnoptimizedImage } from '@/lib/util/remoteImage'
import type { Booking } from '@/types'

interface BookingsPanelProps {
  pendingBookings?: Booking[]
  activeHolds: Booking[]
  pastBookings: Booking[]
  onBrowseCatalog: () => void
  onCancel: (booking: Booking) => void
  onViewReceipt: (booking: Booking) => void
  onCompletePayment?: (booking: Booking) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  sortBy:
    | 'starts_at_asc'
    | 'starts_at_desc'
    | 'created_at_asc'
    | 'created_at_desc'
    | 'total_price_asc'
    | 'total_price_desc'
  onSortChange: (
    value:
      | 'starts_at_asc'
      | 'starts_at_desc'
      | 'created_at_asc'
      | 'created_at_desc'
      | 'total_price_asc'
      | 'total_price_desc',
  ) => void
}

export function BookingsPanel({
  pendingBookings = [],
  activeHolds,
  pastBookings,
  onBrowseCatalog,
  onCancel,
  onViewReceipt,
  onCompletePayment,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: BookingsPanelProps) {
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null)
  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200/60 pb-6 sm:gap-6 sm:pb-8">
        <div className="min-w-0 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
            <Shield className="h-3.5 w-3.5 text-amber-600" />
            <span>PayPal Authorization Holds</span>
          </div>
          <h1 className="font-serif text-[1.75rem] leading-tight font-normal tracking-tight text-balance text-stone-950 sm:text-4xl">
            Appointments & Holds
          </h1>
          <p className="hidden text-sm leading-relaxed font-normal text-stone-500 sm:block">
            Manage your active salon reservations, inspect cryptographic receipts, or cancel before
            the 24-hour cutoff for an automatic $0 charge release.
          </p>
          <p className="text-[13px] leading-relaxed text-stone-500 sm:hidden">
            Cancel 24h ahead for a $0 release.
          </p>
        </div>

        <button
          type="button"
          onClick={onBrowseCatalog}
          aria-label="Book new service"
          className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-stone-950 text-white transition-colors hover:bg-amber-600 sm:h-auto sm:w-auto sm:gap-2 sm:rounded-full sm:px-5 sm:py-2.5 sm:text-sm sm:font-semibold"
        >
          <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          <span className="hidden sm:inline">Book New Service</span>
        </button>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by service, salon, or stylist..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200/80 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
        <div className="relative sm:w-48">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <select
            value={sortBy}
            onChange={(e) =>
              onSortChange(
                e.target.value as
                  | 'starts_at_asc'
                  | 'starts_at_desc'
                  | 'created_at_asc'
                  | 'created_at_desc'
                  | 'total_price_asc'
                  | 'total_price_desc',
              )
            }
            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-stone-200/80 bg-white text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none cursor-pointer"
          >
            <option value="starts_at_desc">Date: Newest</option>
            <option value="starts_at_asc">Date: Oldest</option>
            <option value="created_at_desc">Created: Newest</option>
            <option value="created_at_asc">Created: Oldest</option>
            <option value="total_price_desc">Price: High to Low</option>
            <option value="total_price_asc">Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Pending Authorization (Payment Incomplete) Section */}
      {pendingBookings && pendingBookings.length > 0 ? (
        <section>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              <h2 className="text-sm font-bold text-stone-900">
                Pending Authorization (Payment Incomplete)
              </h2>
            </div>
            <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-900">
              {pendingBookings.length}
            </span>
            <span className="ml-auto hidden sm:inline text-xs text-amber-800 font-medium">
              Reservation is temporarily held · Complete payment to secure appointment
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {pendingBookings.map((booking) => (
              <PendingBookingCard
                key={booking.id}
                booking={booking}
                onCancel={() => onCancel(booking)}
                onCompletePayment={onCompletePayment ? () => onCompletePayment(booking) : undefined}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Active Holds Section */}
      <section>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-stone-900">Active Authorization Holds</h2>
          </div>
          <span className="rounded-full bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 text-xs font-bold text-amber-800">
            {activeHolds.length}
          </span>
          <span className="ml-auto hidden sm:inline text-xs text-stone-400">
            $0 charged today · Settled at salon checkout
          </span>
        </div>

        {activeHolds.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Active Reservation Holds"
            description="You currently have no confirmed appointment holds. Explore the catalog and reserve with $0 charged upfront."
            actionLabel="Explore Service Catalog"
            onAction={onBrowseCatalog}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {activeHolds.map((booking) => (
              <ActiveHoldCard
                key={booking.id}
                booking={booking}
                onCancel={() => onCancel(booking)}
                onViewReceipt={onViewReceipt}
                onReschedule={() => setRescheduleTarget(booking)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past & Settled Appointments Section */}
      <section>
        <div className="mb-5 flex items-center gap-3">
          <h2 className="text-sm font-bold text-stone-900">Past & Settled Appointments</h2>
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
            {pastBookings.length}
          </span>
        </div>

        {pastBookings.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No past appointments yet"
            description="Completed or cancelled appointments will appear here after your first visit."
            className="p-8 sm:p-10"
          />
        ) : (
          <>
            {/* Mobile View: Clean responsive cards */}
            <div className="space-y-3 sm:hidden">
              {pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-2xl bg-white p-4 border border-stone-200/60 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-stone-400 uppercase">
                        {formatBookingRef(booking.id)}
                      </span>
                      <h4 className="font-serif text-base font-medium text-stone-950">
                        {booking.serviceName}
                      </h4>
                      <p className="text-xs text-stone-500">
                        {booking.stylistName}
                        {booking.salonName ? ` · ${booking.salonName}` : ''}
                      </p>
                    </div>
                    <HoldStateBadge status={booking.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 border-y border-stone-100">
                    <span className="text-stone-500">{booking.appointmentTime}</span>
                    <SettlementLabel booking={booking} />
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewReceipt(booking)}
                    className="w-full text-center text-xs font-medium text-stone-900 hover:text-amber-600 py-1 transition-colors cursor-pointer"
                  >
                    View Cryptographic Receipt →
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop View: Sleek borderless table */}
            <div className="hidden sm:block rounded-3xl bg-white border border-stone-200/60 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    <th className="px-6 py-3.5 font-medium">Booking Ref</th>
                    <th className="px-6 py-3.5 font-medium">Service & Stylist</th>
                    <th className="px-6 py-3.5 font-medium">Time Slot</th>
                    <th className="px-6 py-3.5 font-medium">Settlement</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {pastBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-stone-900">
                        {formatBookingRef(booking.id)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-serif text-sm font-normal text-stone-950">
                          {booking.serviceName}
                        </div>
                        <div className="text-[11px] text-stone-400">
                          {booking.stylistName}
                          {booking.salonName ? ` · ${booking.salonName}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-stone-600">{booking.appointmentTime}</td>
                      <td className="px-6 py-4">
                        <SettlementLabel booking={booking} />
                      </td>
                      <td className="px-6 py-4">
                        <HoldStateBadge status={booking.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onViewReceipt(booking)}
                          className="inline-flex cursor-pointer items-center rounded-full border border-stone-200 bg-stone-100 px-3.5 py-1 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-200 active:scale-[0.98]"
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {rescheduleTarget && (
        <RescheduleBookingDialog
          booking={rescheduleTarget}
          open={Boolean(rescheduleTarget)}
          onClose={() => setRescheduleTarget(null)}
        />
      )}
    </div>
  )
}

function ActiveHoldCard({
  booking,
  onCancel,
  onViewReceipt,
  onReschedule,
}: {
  booking: Booking
  onCancel: () => void
  onViewReceipt: (booking: Booking) => void
  onReschedule: () => void
}) {
  const cancelPreview = buildCancelOutcomePreview({
    totalPrice: booking.servicePrice,
    agreedNoShowFee: booking.noShowFee,
    agreedLateCancelFee: booking.lateCancelFee,
    freeCancelDeadlineAt: booking.freeCancelDeadlineAt ?? booking.authExpiresAt,
    policySnapshot: booking.policySnapshot,
  })

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-stone-200/60 bg-white p-4 transition-all hover:border-stone-300 sm:p-7">
      <div>
        {/* Top Badges & Service */}
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] font-semibold tracking-widest text-amber-700 uppercase">
              {formatBookingRef(booking.id)}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
              <Lock className="h-3 w-3 text-amber-600" />
              <span>Held {formatUsd(booking.holdAmount)}</span>
            </span>
          </div>
          <h3 className="font-serif text-xl font-normal text-stone-950 sm:text-2xl">
            {booking.serviceName}
          </h3>
          {booking.salonName ? (
            <p className="truncate text-xs text-stone-500">{booking.salonName}</p>
          ) : null}
        </div>

        {/* Metadata Grid */}
        <div className="mb-5 grid grid-cols-2 gap-x-3 gap-y-3.5 rounded-2xl bg-stone-50/80 p-3.5 text-xs sm:p-4">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Stylist
            </span>
            <div className="flex items-center gap-1.5 font-medium text-stone-900">
              {booking.stylistPicture ? (
                <Image
                  src={booking.stylistPicture}
                  alt=""
                  width={20}
                  height={20}
                  unoptimized={shouldUnoptimizedImage(booking.stylistPicture)}
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <User className="h-3.5 w-3.5 text-stone-500" />
              )}
              <span>{booking.stylistName}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Appointment
            </span>
            <div className="flex items-center gap-1.5 font-medium text-stone-900">
              <Clock className="h-3.5 w-3.5 text-stone-500" />
              <span>{booking.appointmentTime}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Service total
            </span>
            <div className="font-semibold text-stone-900">{formatUsd(booking.servicePrice)}</div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Cancellation
            </span>
            <div
              className={
                cancelPreview.withinFreeWindow
                  ? 'font-medium text-emerald-700'
                  : 'font-medium text-amber-800'
              }
            >
              {cancelPreview.withinFreeWindow
                ? `Free until ${booking.freeCancelDeadlineLabel || booking.authExpiresAt}`
                : `Late fee ${formatUsd(cancelPreview.lateCancelFee)} if you cancel now`}
            </div>
          </div>
        </div>

        {!cancelPreview.withinFreeWindow ? (
          <div className="mb-5 flex gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-3.5 py-3 text-xs leading-relaxed text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              The free-cancellation window ended on{' '}
              <span className="font-semibold">{cancelPreview.freeCancelDeadlineLabel}</span>.
              Cancelling now captures{' '}
              <span className="font-semibold">{formatUsd(cancelPreview.lateCancelFee)}</span> (
              {cancelPreview.lateCancelPct}% of {formatUsd(booking.servicePrice)}) from your PayPal
              hold. Missing the visit without cancelling may incur the no-show fee of{' '}
              {formatUsd(cancelPreview.noShowFee)}.
            </p>
          </div>
        ) : (
          <p className="mb-5 rounded-2xl border border-emerald-200/70 bg-emerald-50/60 px-3.5 py-2.5 text-xs leading-relaxed text-emerald-900">
            Cancel before {cancelPreview.freeCancelDeadlineLabel} to release your hold at{' '}
            {formatUsd(0)}.
          </p>
        )}

        {booking.customerNotes ? (
          <p className="mb-5 flex items-start gap-2 rounded-xl bg-stone-50 px-3.5 py-2.5 text-xs text-stone-600">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
            <span>{booking.customerNotes}</span>
          </p>
        ) : null}

        {booking.consentHash && booking.consentHash !== '—' ? (
          <div className="mb-6 flex items-center justify-between rounded-xl bg-stone-100/60 px-3.5 py-2 text-[11px] text-stone-500 font-mono">
            <div className="flex min-w-0 items-center gap-1.5 truncate">
              <Shield className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span className="truncate">{booking.consentHash}</span>
            </div>
            <span className="text-stone-400 font-medium">PayPal v6</span>
          </div>
        ) : null}
      </div>

      {/* Management Actions: Reschedule */}
      <div className="pt-4 border-t border-stone-100 space-y-2.5">
        <button
          type="button"
          onClick={onReschedule}
          className="w-full h-10 inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs sm:text-sm font-semibold px-3 transition-colors cursor-pointer active:scale-[0.98]"
        >
          <Calendar className="h-3.5 w-3.5 text-amber-600" />
          <span>Reschedule</span>
        </button>

        {/* Action buttons: Receipt & Cancel */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onViewReceipt(booking)}
            className="h-10 flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium px-4 transition-colors cursor-pointer active:scale-[0.98]"
          >
            <FileText className="h-3.5 w-3.5 text-stone-500" />
            <span>View Receipt</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="h-10 flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold px-4 transition-colors cursor-pointer active:scale-[0.98]"
          >
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            {cancelPreview.withinFreeWindow ? (
              <>
                <span className="sm:hidden">Cancel ($0)</span>
                <span className="hidden sm:inline">Cancel & release ($0)</span>
              </>
            ) : (
              <>
                <span className="sm:hidden">Cancel ({formatUsd(cancelPreview.chargeAmount)})</span>
                <span className="hidden sm:inline">
                  Cancel ({formatUsd(cancelPreview.chargeAmount)} fee)
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function PendingBookingCard({
  booking,
  onCancel,
  onCompletePayment,
}: {
  booking: Booking
  onCancel: () => void
  onCompletePayment?: () => void
}) {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-amber-300/80 bg-amber-50/40 p-4 transition-all hover:border-amber-400 sm:p-7">
      <div>
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] font-semibold tracking-widest text-amber-800 uppercase">
              {formatBookingRef(booking.id)}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-100/90 border border-amber-300 px-2.5 py-1 text-xs font-bold text-amber-900">
              <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
              <span>Payment Pending</span>
            </span>
          </div>
          <h3 className="font-serif text-xl font-normal text-stone-950 sm:text-2xl">
            {booking.serviceName}
          </h3>
          {booking.salonName ? (
            <p className="truncate text-xs text-stone-500">{booking.salonName}</p>
          ) : null}
        </div>

        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            Payment authorization is not finished. Complete PayPal authorization now to secure your
            appointment.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-x-3 gap-y-3.5 rounded-2xl bg-white/90 border border-stone-200/60 p-3.5 text-xs sm:p-4">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Stylist
            </span>
            <div className="flex items-center gap-1.5 font-medium text-stone-900">
              <User className="h-3.5 w-3.5 text-stone-500" />
              <span>{booking.stylistName}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Scheduled For
            </span>
            <div className="flex items-center gap-1.5 font-medium text-stone-900">
              <Clock className="h-3.5 w-3.5 text-stone-500" />
              <span>{booking.appointmentTime}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Service total
            </span>
            <div className="font-semibold text-stone-900">{formatUsd(booking.servicePrice)}</div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Authorization hold
            </span>
            <div className="font-medium text-amber-800">
              {formatUsd(booking.holdAmount)} ($0 charged today)
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 pt-4 border-t border-amber-200/60">
        {onCompletePayment ? (
          <button
            type="button"
            onClick={onCompletePayment}
            className="h-10 flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold px-4 transition-colors cursor-pointer active:scale-[0.98] shadow-xs"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Complete Payment</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={onCancel}
          className="h-10 flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold px-4 transition-colors cursor-pointer active:scale-[0.98]"
        >
          <XCircle className="h-3.5 w-3.5 text-stone-400" />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  )
}

function SettlementLabel({ booking }: { booking: Booking }) {
  if (booking.cancellationFeeCharged != null && booking.cancellationFeeCharged > 0) {
    const label =
      booking.cancellationFeeReason === 'late_cancel' ? 'late cancel fee' : 'cancellation fee'
    return (
      <span className="font-medium text-amber-800">
        {formatUsd(booking.cancellationFeeCharged)} {label}
      </span>
    )
  }
  if (booking.status === 'CAPTURED') {
    return (
      <span className="font-medium text-emerald-700">
        {formatUsd(booking.servicePrice)} captured
      </span>
    )
  }
  if (booking.status === 'NO_SHOW_CAPTURED') {
    return <span className="font-medium text-rose-700">{formatUsd(booking.noShowFee)} no-show</span>
  }
  if (booking.status === 'VOIDED') {
    return <span className="font-medium text-stone-400">$0.00 (Hold Voided)</span>
  }
  return <span className="text-stone-400">—</span>
}
