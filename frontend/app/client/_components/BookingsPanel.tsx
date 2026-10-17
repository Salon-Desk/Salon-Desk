'use client'

import { Calendar, Clock, FileText, Lock, Plus, Shield, User, XCircle } from 'lucide-react'
import Image from 'next/image'

import { EmptyState, HoldStateBadge } from '@/components/ui'
import { formatBookingRef, formatUsd } from '@/lib/format'
import type { Booking } from '@/types'

interface BookingsPanelProps {
  activeHolds: Booking[]
  pastBookings: Booking[]
  onBrowseCatalog: () => void
  onCancel: (bookingId: string) => void
  onViewReceipt: (booking: Booking) => void
}

export function BookingsPanel({
  activeHolds,
  pastBookings,
  onBrowseCatalog,
  onCancel,
  onViewReceipt,
}: BookingsPanelProps) {
  return (
    <div className="space-y-12">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-stone-200/60">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
            <Shield className="h-3.5 w-3.5 text-amber-600" />
            <span>PayPal Authorization Holds</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-stone-950">
            Appointments & Holds
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-normal leading-relaxed">
            Manage your active salon reservations, inspect cryptographic receipts, or cancel before
            the 24-hour cutoff for an automatic $0 charge release.
          </p>
        </div>

        <button
          type="button"
          onClick={onBrowseCatalog}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 hover:bg-stone-800 text-white font-medium text-xs sm:text-sm px-5 py-2.5 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Book New Service</span>
        </button>
      </div>

      {/* Active Holds Section */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Active Authorization Holds
            </h2>
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
              {activeHolds.length}
            </span>
          </div>
          <span className="hidden sm:inline text-xs text-stone-400">
            $0 charged today • Settled at salon checkout
          </span>
        </div>

        {activeHolds.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Active Reservation Holds"
            description="You currently have no pending appointment holds. Explore the catalog and reserve with $0 charged upfront."
            actionLabel="Explore Service Catalog"
            onAction={onBrowseCatalog}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {activeHolds.map((booking) => (
              <ActiveHoldCard
                key={booking.id}
                booking={booking}
                onCancel={onCancel}
                onViewReceipt={onViewReceipt}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past & Settled Appointments Section */}
      <section>
        <div className="mb-5 flex items-center gap-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900">
            Past & Settled Appointments
          </h2>
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
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
                  <tr className="border-b border-stone-100 bg-stone-50/60 text-[11px] font-medium uppercase tracking-wider text-stone-400">
                    <th className="px-6 py-4 font-normal">Booking Reference</th>
                    <th className="px-6 py-4 font-normal">Service & Stylist</th>
                    <th className="px-6 py-4 font-normal">Time Slot</th>
                    <th className="px-6 py-4 font-normal">Settlement Outcome</th>
                    <th className="px-6 py-4 font-normal">Status</th>
                    <th className="px-6 py-4 font-normal text-right">Receipt</th>
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
                          className="rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1 font-medium transition-colors cursor-pointer"
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
    </div>
  )
}

function ActiveHoldCard({
  booking,
  onCancel,
  onViewReceipt,
}: {
  booking: Booking
  onCancel: (bookingId: string) => void
  onViewReceipt: (booking: Booking) => void
}) {
  return (
    <div className="flex flex-col justify-between rounded-3xl bg-white p-6 sm:p-7 border border-stone-200/60 transition-all hover:border-stone-300">
      <div>
        {/* Top Badges & Service */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-amber-700">
              {formatBookingRef(booking.id)}
              {booking.salonName ? ` · ${booking.salonName}` : ''}
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-normal text-stone-950">
              {booking.serviceName}
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 shrink-0">
            <Lock className="h-3 w-3 text-amber-600" />
            <span>Held ({formatUsd(booking.holdAmount)})</span>
          </span>
        </div>

        {/* Metadata Grid */}
        <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl bg-stone-50/80 p-4 text-xs">
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
              Appointment Slot
            </span>
            <div className="flex items-center gap-1.5 font-medium text-stone-900">
              <Clock className="h-3.5 w-3.5 text-stone-500" />
              <span>{booking.appointmentTime}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Full Service Value
            </span>
            <div className="font-semibold text-stone-900">{formatUsd(booking.servicePrice)}</div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Cancellation Cutoff
            </span>
            <div className="font-medium text-emerald-700">Free cancel ≥ 24h ($0)</div>
          </div>
        </div>

        {booking.customerNotes ? (
          <p className="mb-5 flex items-start gap-2 rounded-xl bg-stone-50 px-3.5 py-2.5 text-xs text-stone-600">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
            <span>{booking.customerNotes}</span>
          </p>
        ) : null}

        {booking.consentHash && booking.consentHash !== '—' ? (
          <div className="mb-6 flex items-center justify-between rounded-xl bg-stone-100/60 px-3.5 py-2 text-[11px] text-stone-500 font-mono">
            <div className="flex max-w-[240px] items-center gap-1.5 truncate">
              <Shield className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span className="truncate">{booking.consentHash}</span>
            </div>
            <span className="text-stone-400 font-medium">PayPal v6</span>
          </div>
        ) : null}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2.5 pt-4 border-t border-stone-100">
        <button
          type="button"
          onClick={() => onViewReceipt(booking)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-medium py-2.5 px-4 transition-colors cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5 text-stone-600" />
          <span>View Receipt</span>
        </button>

        <button
          type="button"
          onClick={() => onCancel(booking.id)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-medium py-2.5 px-4 transition-colors cursor-pointer"
        >
          <XCircle className="h-3.5 w-3.5 text-rose-600" />
          <span>Cancel & Void ($0)</span>
        </button>
      </div>
    </div>
  )
}

function SettlementLabel({ booking }: { booking: Booking }) {
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
