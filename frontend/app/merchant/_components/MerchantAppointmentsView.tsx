'use client'

import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { QueryStateView } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { useAgentUiActions } from '@/hooks/useAgentUiActions'
import { useListingParams } from '@/hooks/useListingParams'
import {
  type MerchantAppointmentsListParams,
  MerchantAppointmentsListParamsSchema,
} from '@/lib/listing-params/merchant-appointments-list-params'
import { mapApiBookingToUi } from '@/lib/mappers/booking'
import { useGetMyOrgBookingsQuery } from '@/store/api/orgApi'
import type { Booking } from '@/types'

import { useAppointmentsData, useAppointmentsFilter } from '../_hooks/use-appointments-data'
import { useSettlementActions } from '../_hooks/use-settlement-actions'
import { AppointmentsFilterBar } from './AppointmentsFilterBar'
import { AppointmentsKpiCards } from './AppointmentsKpiCards'
import { AppointmentsPageHeader } from './AppointmentsPageHeader'
import { getBookingTableColumns } from './BookingTableColumns'
import { ConsentModal } from './ConsentModal'
import { SettlementDrawer } from './SettlementDrawer'

type AppointmentFilter = MerchantAppointmentsListParams['holdStatus']

export function MerchantAppointmentsView() {
  const { params, displayParams, setParam, setParams } = useListingParams<
    MerchantAppointmentsListParams,
    typeof MerchantAppointmentsListParamsSchema
  >(MerchantAppointmentsListParamsSchema)

  const { bookings, kpiData, isError: kpiError, refetch: refetchKpi } = useAppointmentsData()
  const {
    data: tableData,
    isLoading,
    isError: tableError,
    refetch: refetchTable,
  } = useGetMyOrgBookingsQuery(params)

  const isError = kpiError || tableError
  const refetch = useCallback(() => {
    void refetchKpi()
    void refetchTable()
  }, [refetchKpi, refetchTable])

  const appointmentFilter = displayParams.holdStatus
  const currentPage = displayParams.page
  const pageSize = displayParams.limit
  const totalItems = tableData?.total ?? 0
  const totalPages = Math.ceil(totalItems / pageSize) || 1

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [inspectConsentBooking, setInspectConsentBooking] = useState<Booking | null>(null)

  useAgentUiActions({
    onFilterHolds: () => setParams({ holdStatus: 'HELD', page: 1 }),
    onFilterCaptured: () => setParams({ holdStatus: 'CAPTURED', page: 1 }),
    onFilterVoided: () => setParams({ holdStatus: 'VOIDED', page: 1 }),
  })

  const { filterCounts } = useAppointmentsFilter(bookings, '', 'ALL')

  const paginatedAppointments = useMemo(
    () => (tableData?.items ?? []).map((b) => mapApiBookingToUi(b)),
    [tableData?.items],
  )

  const {
    handleMarkShow,
    handleMarkNoShow,
    handleCancelAndVoid,
    handleReauthorizeHold,
    isSettlementProcessing,
  } = useSettlementActions()

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
    refetch()
  }, [refetch])

  const handleReauthorizeSuccess = useCallback(() => {
    setSelectedBooking(null)
    refetch()
  }, [refetch])

  const handleFilterChange = useCallback(
    (newFilter: AppointmentFilter) => {
      setParams({ holdStatus: newFilter, page: 1 })
    },
    [setParams],
  )

  const handleSearchChange = useCallback(
    (search: string) => {
      setParam('search', search)
    },
    [setParam],
  )

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <AppointmentsPageHeader
        bookingsCount={bookings.length}
        isLoading={isLoading}
        onRefresh={() => void refetch()}
      />

      {/* KPI Cards */}
      {!isLoading && !isError && (
        <AppointmentsKpiCards
          kpiData={kpiData}
          onFilterChange={handleFilterChange}
          activeFilter={appointmentFilter}
        />
      )}

      {/* Error State */}
      {isError && (
        <QueryStateView
          isLoading={false}
          isError={true}
          errorLabel="Could not load bookings. Please check your connection and retry."
          onRetry={() => void refetch()}
        >
          {null}
        </QueryStateView>
      )}

      {/* Search & Filter Bar */}
      {!isLoading && !isError && (
        <AppointmentsFilterBar
          search={displayParams.search}
          onSearchChange={handleSearchChange}
          filter={appointmentFilter}
          onFilterChange={handleFilterChange}
          filterCounts={filterCounts}
        />
      )}

      {/* BasicDataGridTable */}
      {!isError && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)]">
          <BasicDataGridTable
            data={paginatedAppointments}
            columns={bookingColumns}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={pageSize}
            onPageChange={(page) => setParam('page', page)}
            onItemPerPageChange={(size) => setParams({ limit: size, page: 1 })}
            isFetching={isLoading}
            refetch={() => void refetch()}
            showSearch={false}
            showPagination={true}
            showItemsPerPage={true}
          />
        </div>
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
          onReauthorizeHold={(b) => void handleReauthorizeHold(b, handleReauthorizeSuccess)}
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
