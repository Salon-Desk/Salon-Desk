'use client'

import { format } from 'date-fns'
import { Clock } from 'lucide-react'

import { HoldStateBadge } from '@/components/ui'
import { formatUsd } from '@/lib/format'
import type { CalendarEvent } from '@/lib/util/calendar'
import { cn } from '@/lib/utils'

import { StaffAvatar } from './StaffAvatar'

interface BookingBlockProps {
  event: CalendarEvent
  onSelect: (event: CalendarEvent) => void
  compact?: boolean
  absolute?: { top: number; height: number }
  className?: string
}

function holdStripClass(status: string): string {
  switch (status) {
    case 'HELD':
      return 'border-l-amber-500 bg-amber-50/40 hover:bg-amber-50/80'
    case 'REAUTHORIZED':
      return 'border-l-sky-500 bg-sky-50/40 hover:bg-sky-50/80'
    case 'CAPTURED':
      return 'border-l-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80'
    case 'NO_SHOW_CAPTURED':
      return 'border-l-rose-500 bg-rose-50/40 hover:bg-rose-50/80'
    default:
      return 'border-l-slate-400 bg-slate-50/60 opacity-70'
  }
}

export function BookingBlock({
  event,
  onSelect,
  compact = false,
  absolute,
  className,
}: BookingBlockProps) {
  const { booking } = event
  const timeLabel = format(event.startsAt, 'h:mm a')

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      style={
        absolute
          ? {
              top: absolute.top,
              height: absolute.height,
              position: 'absolute',
              left: 4,
              right: 4,
            }
          : undefined
      }
      className={cn(
        'w-full overflow-hidden rounded-lg border border-slate-200/80 border-l-[3.5px] text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:shadow-md',
        holdStripClass(booking.status),
        compact ? 'px-2 py-1.5' : 'p-3',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
            <Clock className="h-3 w-3 shrink-0 text-slate-400" />
            <span className="truncate">{timeLabel}</span>
            {!compact ? <HoldStateBadge status={booking.status} /> : null}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            {!compact ? (
              <StaffAvatar
                name={booking.clientName}
                picture={event.clientPicture}
                seed={booking.id}
                size="sm"
              />
            ) : null}
            <div className="min-w-0">
              <div
                className={cn(
                  'truncate font-bold text-slate-900',
                  compact ? 'text-[11px]' : 'text-sm',
                )}
              >
                {booking.clientName}
              </div>
              <div className="truncate text-[11px] text-slate-500">{booking.serviceName}</div>
            </div>
          </div>
        </div>
        {!compact ? (
          <div className="shrink-0 text-right font-mono text-[11px] tabular-nums">
            <div className="font-semibold text-slate-800">{formatUsd(booking.servicePrice)}</div>
            <div className="text-amber-800">Hold {formatUsd(booking.holdAmount)}</div>
          </div>
        ) : null}
      </div>
      {!compact ? (
        <div className="mt-2 truncate text-[11px] text-slate-500">
          {booking.stylistName}
          {booking.durationMin ? ` · ${booking.durationMin} min` : ''}
        </div>
      ) : null}
    </button>
  )
}
