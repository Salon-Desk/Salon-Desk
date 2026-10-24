'use client'

import { Loader2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '@/components/empty'
import { buildMerchantLayoutEmployeesSnapshotApiParams } from '@/lib/listing-params/merchant-dashboard-snapshot-list-params'
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
import { User } from '@/types/user'

import { useSettlementActions } from '../_hooks/use-settlement-actions'
import { AgendaView } from './AgendaView'
import { CalendarToolbar } from './CalendarToolbar'
import { DayBoardView } from './DayBoardView'
import { SettlementDrawer } from './SettlementDrawer'
import { ALL_STAFF_VALUE } from './StaffPicker'
import { WeekBoardView } from './WeekBoardView'

export function MerchantCalendarView() {
  const [view, setView] = useState<CalendarViewMode>('agenda')
  const [anchor, setAnchor] = useState(() => new Date())
  const [staffId, setStaffId] = useState(ALL_STAFF_VALUE)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const { data: org } = useGetMyOrganizationQuery()
  const { data: employeesData, isLoading: staffLoading } = useGetMyEmployeesQuery(
    buildMerchantLayoutEmployeesSnapshotApiParams(),
  )
  const employees = employeesData?.items ?? []

  const queryRange = useMemo(() => rangeForView(view, anchor), [view, anchor])

  const {
    data: apiBookingsData,
    isLoading: bookingsLoading,
    isFetching,
    refetch: refetchBookings,
  } = useGetMyOrgBookingsQuery(queryRange)
  const apiBookings = apiBookingsData?.items ?? []

  // Ensure data is actively refetched whenever view or day/range changes
  useEffect(() => {
    void refetchBookings()
  }, [queryRange, refetchBookings])

  const {
    handleMarkShow,
    handleMarkNoShow,
    handleCancelAndVoid,
    handleReauthorizeHold,
    isSettlementProcessing,
  } = useSettlementActions()

  const events = useMemo(
    () => mapApiBookingsToEvents(apiBookings, org?.name),
    [apiBookings, org?.name],
  )

  const visibleEvents = useMemo(() => {
    if (view === 'week') {
      const days = weekDays(anchor)
      return days.flatMap((day) => filterEventsForDay(events, day, staffId))
    }
    if (view === 'agenda') {
      return events
        .filter((e) => {
          if (!staffId || staffId === ALL_STAFF_VALUE) return true
          return e.booking.stylistId === staffId
        })
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    }
    return filterEventsForDay(events, anchor, staffId)
  }, [view, events, anchor, staffId])

  const [selectedStaffMember, setSelectedStaffMember] = useState<User | null>(null)

  const handleStaffChange = (id: string, employee?: User) => {
    setStaffId(id)
    if (employee) {
      setSelectedStaffMember(employee)
    } else if (id === ALL_STAFF_VALUE) {
      setSelectedStaffMember(null)
    }
  }

  const selectedStaff =
    selectedStaffMember?.id === staffId
      ? selectedStaffMember
      : employees.find((e) => e.id === staffId)
  const stylistName =
    staffId === ALL_STAFF_VALUE
      ? `All Staff (${employees.length})`
      : selectedStaff
        ? staffDisplayName(selectedStaff)
        : undefined

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
        onStaffChange={handleStaffChange}
        bookingCount={visibleEvents.length}
        onRefresh={() => void refetchBookings()}
        isRefreshing={isFetching}
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
              employees={employees}
              onSelect={handleSelectEvent}
              onGoToday={() => setAnchor(new Date())}
            />
          ) : null}
          {view === 'week' ? (
            <WeekBoardView
              anchor={anchor}
              events={events}
              stylistId={staffId}
              stylistName={stylistName}
              employees={employees}
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
