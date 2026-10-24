import { HoldStateBadge } from '@/components/badge'
import { formatBookingRef } from '@/lib/format'
import type { Booking } from '@/types'
import type { ColumnDefinition } from '@/types/table'

import { SettlementLabel } from './SettlementLabel'

export function getBookingsTableColumns(): ColumnDefinition<Booking>[] {
  return [
    {
      id: 'reference',
      header: 'Booking Ref',
      cell: (booking) => (
        <span className="font-mono font-medium text-stone-900">{formatBookingRef(booking.id)}</span>
      ),
    },
    {
      id: 'service',
      header: 'Service & Stylist',
      cell: (booking) => (
        <div>
          <div className="font-serif text-sm font-normal text-stone-950">{booking.serviceName}</div>
          <div className="text-[11px] text-stone-400">
            {booking.stylistName}
            {booking.salonName ? ` · ${booking.salonName}` : ''}
          </div>
        </div>
      ),
    },
    {
      id: 'slot',
      header: 'Time Slot',
      cell: (booking) => <span className="text-stone-600">{booking.appointmentTime}</span>,
    },
    {
      id: 'settlement',
      header: 'Settlement',
      cell: (booking) => <SettlementLabel booking={booking} />,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (booking) => <HoldStateBadge status={booking.status} />,
    },
  ]
}
