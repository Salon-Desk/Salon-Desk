'use client'

import { Calendar, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Pagination } from '@/components/table/Pagination'
import { type Column, DataTable, EmptyState } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import type { Booking, HoldState } from '@/types'

import { ConsentModal } from '../_components/consent-modal'
import { SettlementDrawer } from '../_components/settlement-drawer'
import { AppointmentsFilterBar } from './_components/appointments-filter-bar'
import { AppointmentsKpiCards } from './_components/appointments-kpi-cards'
import { getBookingTableColumns } from './_components/booking-table-columns'
import { useAppointmentsData, useAppointmentsFilter } from './_hooks/use-appointments-data'
import { useSettlementActions } from './_hooks/use-settlement-actions'

type AppointmentFilter = 'ALL' | HoldState

export default function MerchantAppointmentsPage() {
  const { bookings, kpiData, isLoading, isError, refetch } = useAppointmentsData()

  const [appointmentSearch, setAppointmentSearch] = useState('')
  const [appointmentFilter, setAppointmentFilter] = useState<AppointmentFilter>('ALL')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [inspectConsentBooking, setInspectConsentBooking] = useState<Booking | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { filteredAppointments, filterCounts } = useAppointmentsFilter(
    bookings,
    appointmentSearch,
    appointmentFilter,
  )

  const { handleMarkShow, handleMarkNoShow, handleCancelAndVoid, isSettlementProcessing } =
    useSettlementActions()

  const handleCopy = useCallback((id: string, text: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Booking reference copied to clipboard', toastColor.success)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const handleSettle = useCallback((booking: Booking) => {
    setSelectedBooking(booking)
  }, [])

  const handleInspectConsent = useCallback((booking: Booking) => {
    setInspectConsentBooking(booking)
  }, [])

  const handleSettlementSuccess = useCallback(() => {
    setSelectedBooking(null)
    void refetch()
  }, [refetch])

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / pageSize))
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredAppointments.slice(start, start + pageSize)
  }, [filteredAppointments, currentPage, pageSize])

  const bookingColumns = useMemo(
    () =>
      getBookingTableColumns({
        onCopy: handleCopy,
        copiedId,
        onInspectConsent: handleInspectConsent,
        onSettle: handleSettle,
      }),
    [handleCopy, copiedId, handleInspectConsent, handleSettle],
  )

  const handleFilterChange = useCallback((newFilter: AppointmentFilter) => {
    setAppointmentFilter(newFilter)
    setCurrentPage(1)
  }, [])

  const handleSearchChange = useCallback((newSearch: string) => {
    setAppointmentSearch(newSearch)
    setCurrentPage(1)
  }, [])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <PageHeader bookingsCount={bookings.length} isLoading={isLoading} />

      {/* KPI Cards */}
      {!isLoading && !isError && <AppointmentsKpiCards kpiData={kpiData} />}

      {/* Loading State */}
      {isLoading ? <LoadingState /> : null}

      {/* Error State */}
      {isError ? <ErrorState onRetry={() => void refetch()} /> : null}

      {/* Search & Filter Bar */}
      {!isLoading && !isError && (
        <AppointmentsFilterBar
          search={appointmentSearch}
          onSearchChange={handleSearchChange}
          filter={appointmentFilter}
          onFilterChange={handleFilterChange}
          filterCounts={filterCounts}
        />
      )}

      {/* Data Table */}
      {!isLoading && !isError && (
        <BookingTable
          bookings={paginatedAppointments}
          columns={bookingColumns}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredAppointments.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setCurrentPage(1)
          }}
          searchQuery={appointmentSearch}
          onClearSearch={() => setAppointmentSearch('')}
        />
      )}

      {/* Drawers & Modals */}
      {selectedBooking ? (
        <SettlementDrawer
          booking={selectedBooking}
          isSettlementProcessing={isSettlementProcessing}
          onClose={() => setSelectedBooking(null)}
          onMarkShow={(b) => void handleMarkShow(b, handleSettlementSuccess)}
          onMarkNoShow={(b) => void handleMarkNoShow(b, handleSettlementSuccess)}
          onCancelAndVoid={(b) => void handleCancelAndVoid(b, handleSettlementSuccess)}
          onReauthorizeHold={() =>
            toast.info('Reauthorization is handled automatically by the payment honor window.')
          }
        />
      ) : null}

      {inspectConsentBooking ? (
        <ConsentModal
          booking={inspectConsentBooking}
          onClose={() => setInspectConsentBooking(null)}
        />
      ) : null}
    </div>
  )
}

// Sub-components for better organization

function PageHeader({ bookingsCount, isLoading }: { bookingsCount: number; isLoading: boolean }) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="font-extrabold text-slate-900 text-2xl tracking-tight sm:text-3xl">
          Appointments &amp; Settlements
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isLoading
            ? 'Loading…'
            : `${bookingsCount} reservations tracked via PayPal escrow hold rails`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-slate-200/80 bg-white px-4 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 rounded-md bg-slate-900 px-3 py-1.5 font-semibold text-xs text-white shadow-xs">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Active Ledger ({bookingsCount})</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
      Loading appointments…
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <p>Could not load bookings.</p>
      <PrimaryButton
        title="Retry"
        variant="outline"
        size="sm"
        fullWidth={false}
        className="mt-3 h-8.5 rounded-lg px-4"
        onClick={() => void onRetry()}
      />
    </div>
  )
}

function BookingTable({
  bookings,
  columns,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  searchQuery,
  onClearSearch,
}: {
  bookings: Booking[]
  columns: Column<Booking>[]
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  searchQuery: string
  onClearSearch: () => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)]">
      <DataTable
        columns={columns}
        rows={bookings}
        rowKey={(b: Booking) => b.id}
        className="border-0 shadow-none rounded-none"
        emptyState={
          <EmptyState
            icon={Calendar}
            title="No appointments found"
            description={
              searchQuery
                ? `No reservations matching "${searchQuery}". Try clearing your search filters.`
                : 'No appointments found in this status category.'
            }
            action={
              searchQuery ? (
                <PrimaryButton
                  title="Clear search"
                  size="sm"
                  fullWidth={false}
                  className="h-9 rounded-lg px-4 text-sm"
                  onClick={() => void onClearSearch()}
                />
              ) : null
            }
          />
        }
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        setCurrentPage={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[5, 10, 20, 50]}
        className="rounded-t-none border-t border-border shadow-none bg-slate-50/50"
      />
    </div>
  )
}
