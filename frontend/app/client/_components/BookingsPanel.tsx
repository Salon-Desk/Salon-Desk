import { ArrowUpDown, Calendar, Clock, Plus, Search, Shield } from 'lucide-react'
import { useMemo } from 'react'

import { HoldStateBadge } from '@/components/badge'
import { EmptyState } from '@/components/empty/EmptyState'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { formatBookingRef } from '@/lib/format'
import type { Booking } from '@/types'

import { ActiveHoldCard } from './ActiveHoldCard'
import { getBookingsTableColumns } from './BookingsTableColumns'
import { SettlementLabel } from './SettlementLabel'

interface BookingsPanelProps {
  activeHolds: Booking[]
  pastBookings: Booking[]
  onBrowseCatalog: () => void
  onCancel: (booking: Booking) => void
  onViewReceipt: (booking: Booking) => void
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
  activeHolds,
  pastBookings,
  onBrowseCatalog,
  onCancel,
  onViewReceipt,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: BookingsPanelProps) {
  const bookingColumns = useMemo(() => getBookingsTableColumns(), [])

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

      {/* Active Holds Section */}
      <section>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
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
                onCancel={() => onCancel(booking)}
                onViewReceipt={onViewReceipt}
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

            {/* Desktop View: Sleek borderless BasicDataGridTable */}
            <div className="hidden sm:block overflow-hidden rounded-3xl border border-stone-200/60 bg-white shadow-2xs">
              <BasicDataGridTable
                data={pastBookings}
                columns={bookingColumns}
                showSearch={false}
                showPagination={false}
                showItemsPerPage={false}
                showColumnSelector={false}
                showActions={true}
                renderRowActions={(booking) => (
                  <button
                    type="button"
                    onClick={() => onViewReceipt(booking)}
                    className="inline-flex cursor-pointer items-center rounded-full border border-stone-200 bg-stone-100 px-3.5 py-1 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-200 active:scale-[0.98]"
                  >
                    Receipt
                  </button>
                )}
                tableClassName="border-stone-100"
                headerClassName="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-400"
              />
            </div>
          </>
        )}
      </section>
    </div>
  )
}
