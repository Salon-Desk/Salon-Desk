'use client'

import { Loader2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '@/components/ui'
import {
  type CalendarEvent,
  type CalendarViewMode,
  filterEventsForDay,
  mapApiBookingsToEvents,
  rangeForView,
  weekDays,
} from '@/lib/util/calendar'
import { staffDisplayName } from '@/lib/util/staff-display'
import {
  useGetMyEmployeesQuery,
  useGetMyOrganizationQuery,
  useGetMyOrgBookingsQuery,
} from '@/store/api/orgApi'
import type { Booking } from '@/types'

import { SettlementDrawer } from '../_components/settlement-drawer'
import { useSettlementActions } from '../appointments/_hooks/use-settlement-actions'
import { AgendaView } from './_components/AgendaView'
import { CalendarToolbar } from './_components/CalendarToolbar'
import { DayBoardView } from './_components/DayBoardView'
import { ALL_STAFF_VALUE } from './_components/StaffPicker'
import { WeekBoardView } from './_components/WeekBoardView'

export default function MerchantCalendarPage() {
  const [view, setView] = useState<CalendarViewMode>('agenda')
  const [anchor, setAnchor] = useState(() => new Date())
  const [staffId, setStaffId] = useState(ALL_STAFF_VALUE)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const { data: org } = useGetMyOrganizationQuery()
  const { data: employeesData, isLoading: staffLoading } = useGetMyEmployeesQuery()
  const employees = employeesData?.items ?? []

  const queryRange = useMemo(() => rangeForView(view, anchor), [view, anchor])

  const {
    data: apiBookingsData,
    isLoading: bookingsLoading,
    isFetching,
    refetch: refetchBookings,
  } = useGetMyOrgBookingsQuery(queryRange)
  const apiBookings = apiBookingsData?.items ?? []

  const {
    handleMarkShow,
    handleMarkNoShow,
    handleCancelAndVoid,
    handleReauthorizeHold,
    isSettlementProcessing,
  } = useSettlementActions()

  useEffect(() => {
    if (view !== 'agenda' && staffId === ALL_STAFF_VALUE && employees[0]) {
      setStaffId(employees[0].id)
    }
  }, [view, staffId, employees])

  const events = useMemo(
    () => mapApiBookingsToEvents(apiBookings, org?.name),
    [apiBookings, org?.name],
  )

  const visibleEvents = useMemo(() => {
    if (view === 'week') {
      const days = weekDays(anchor)
      return days.flatMap((day) => filterEventsForDay(events, day, staffId))
    }
    return filterEventsForDay(events, anchor, staffId)
  }, [view, events, anchor, staffId])

  const selectedStaff = employees.find((e) => e.id === staffId)
  const stylistName = selectedStaff ? staffDisplayName(selectedStaff) : undefined

  const isLoading = staffLoading || bookingsLoading

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedBooking(event.booking)
  }

  const handleSettlementSuccess = () => {
    setSelectedBooking(null)
    void refetchBookings()
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-300">
      <CalendarToolbar
        view={view}
        onViewChange={setView}
        anchor={anchor}
        onAnchorChange={setAnchor}
        employees={employees}
        staffId={staffId}
        onStaffChange={setStaffId}
        bookingCount={visibleEvents.length}
      />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading schedule…
        </div>
      ) : null}

      {!isLoading && employees.length === 0 ? (
        <EmptyState
          variant="console"
          icon={Users}
          title="No staff members yet"
          description="Add stylists or receptionists to assign appointments and open Day / Week boards."
        />
      ) : null}

      {!isLoading && employees.length > 0 ? (
        <div className={isFetching ? 'opacity-80 transition-opacity' : undefined}>
          {view === 'agenda' ? (
            <AgendaView events={visibleEvents} onSelect={handleSelectEvent} />
          ) : null}
          {view === 'day' ? (
            <DayBoardView
              day={anchor}
              events={events}
              stylistId={staffId}
              stylistName={stylistName}
              onSelect={handleSelectEvent}
            />
          ) : null}
          {view === 'week' ? (
            <WeekBoardView
              anchor={anchor}
              events={events}
              stylistId={staffId}
              stylistName={stylistName}
              onSelect={handleSelectEvent}
              onSelectDay={(day) => {
                setAnchor(day)
                setView('day')
              }}
            />
          ) : null}
        </div>
      ) : null}

      {selectedBooking ? (
        <SettlementDrawer
          booking={selectedBooking}
          isSettlementProcessing={isSettlementProcessing}
          onClose={() => setSelectedBooking(null)}
          onMarkShow={(b) => void handleMarkShow(b, handleSettlementSuccess)}
          onMarkNoShow={(b) => void handleMarkNoShow(b, handleSettlementSuccess)}
          onCancelAndVoid={(b) => void handleCancelAndVoid(b, handleSettlementSuccess)}
          onReauthorizeHold={(b) =>
            void handleReauthorizeHold(b, (updated) => {
              if (updated) setSelectedBooking(updated)
              void refetchBookings()
            })
          }
        />
      ) : null}
    </div>
  )
}
