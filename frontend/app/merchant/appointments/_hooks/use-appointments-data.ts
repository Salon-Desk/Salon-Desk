import { useMemo } from 'react'

import { mapApiBookingToUi } from '@/lib/mappers/booking'
import { HOLD_STATES } from '@/lib/status'
import { useGetMyOrgBookingsQuery } from '@/store/api/orgApi'
import type { Booking, HoldState } from '@/types'

export function useAppointmentsData() {
  const { data: apiBookingsData, isLoading, isError, refetch } = useGetMyOrgBookingsQuery()
  const apiBookings = apiBookingsData?.items ?? []

  const bookings = useMemo(() => apiBookings.map((b) => mapApiBookingToUi(b)), [apiBookings])

  const kpiData = useMemo(() => {
    const totalBookings = bookings.length
    const totalHoldValue = bookings.reduce((sum, b) => sum + b.holdAmount, 0)
    const pendingHolds = bookings.filter(
      (b) => b.status === 'HELD' || b.status === 'REAUTHORIZED',
    ).length
    const capturedBookings = bookings.filter((b) => b.status === 'CAPTURED').length
    const noShowCaptured = bookings.filter((b) => b.status === 'NO_SHOW_CAPTURED').length
    const voidedBookings = bookings.filter((b) => b.status === 'VOIDED').length

    return {
      totalBookings,
      totalHoldValue,
      pendingHolds,
      capturedBookings,
      noShowCaptured,
      voidedBookings,
    }
  }, [bookings])

  return {
    bookings,
    kpiData,
    isLoading,
    isError,
    refetch,
  }
}

export function useAppointmentsFilter(
  bookings: Booking[],
  search: string,
  filter: 'ALL' | HoldState,
) {
  const filteredAppointments = useMemo(
    () =>
      bookings.filter((b) => {
        const matchesFilter = filter === 'ALL' || b.status === filter
        const query = search.toLowerCase()
        const matchesSearch =
          b.clientName.toLowerCase().includes(query) ||
          b.id.toLowerCase().includes(query) ||
          b.serviceName.toLowerCase().includes(query) ||
          b.stylistName.toLowerCase().includes(query) ||
          b.status.toLowerCase().includes(query)
        return matchesFilter && matchesSearch
      }),
    [bookings, search, filter],
  )

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: bookings.length }
    HOLD_STATES.forEach((st) => {
      counts[st] = bookings.filter((b) => b.status === st).length
    })
    return counts
  }, [bookings])

  return {
    filteredAppointments,
    filterCounts,
  }
}
