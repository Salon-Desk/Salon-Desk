'use client'

import { format, startOfDay } from 'date-fns'
import { Calendar as CalendarIcon, Moon } from 'lucide-react'
import * as React from 'react'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

import {
  pickerDoneButtonClass,
  pickerPanelClass,
  pickerPanelSubtitleClass,
  pickerPanelTitleClass,
} from './picker/picker.styles'
import { ResponsiveFormPicker } from './picker/ResponsiveFormPicker'
import { useIsPickerMobile } from './picker/useIsPickerMobile'

type DateRangePickerProps = {
  id?: string
  label?: string
  placeholder?: string
  value?: DateRange
  onChange?: (value: DateRange | undefined) => void
  hasError?: boolean
  trigger?: (args: { formattedValue: string; hasValue: boolean }) => React.ReactElement
}

const DateRangePicker = ({
  id = 'booking-filter',
  label,
  placeholder,
  value,
  onChange,
  hasError = false,
  trigger,
}: DateRangePickerProps) => {
  const formatLongDate = (date: Date) => format(date, 'PPP')
  const resolvedLabel = label ?? 'Check-in / check-out dates'
  const resolvedPlaceholder = placeholder ?? 'Select check-in and check-out dates'
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(undefined)
  const date = value ?? internalDate
  const isMobile = useIsPickerMobile()

  const [open, setOpen] = React.useState(false)
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(undefined)

  React.useEffect(() => {
    if (open) {
      setDraftRange(date)
    } else {
      setDraftRange(undefined)
    }
  }, [open, date])

  const handleDateChange = (nextDate: DateRange | undefined) => {
    setInternalDate(nextDate)
    onChange?.(nextDate)
  }

  const handleDayClick = (day: Date) => {
    if (draftRange?.from && draftRange?.to) {
      setDraftRange({ from: day, to: undefined })
    }
  }

  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (!draftRange?.from || (draftRange.from && !draftRange.to)) {
      if (draftRange?.from && range?.from) {
        const clicked = range.to ?? range.from
        if (clicked < draftRange.from) {
          setDraftRange({ from: clicked, to: undefined })
          return
        }
      }

      setDraftRange(range)
    }
  }

  const activeRange = open ? (draftRange ?? date) : date
  const canConfirm = Boolean(activeRange?.from && activeRange?.to)

  const handleDone = () => {
    if (!canConfirm || !activeRange?.from || !activeRange?.to) {
      return
    }
    handleDateChange(activeRange)
    setOpen(false)
  }

  const nights =
    activeRange?.from && activeRange?.to
      ? Math.ceil((activeRange.to.getTime() - activeRange.from.getTime()) / (1000 * 60 * 60 * 24))
      : 0

  const today = startOfDay(new Date())

  const formattedValue =
    date?.from && date?.to ? `${formatLongDate(date.from)} - ${formatLongDate(date.to)}` : ''
  const hasValue = Boolean(date?.from && date?.to)

  const summaryDateValueClass = (selected: boolean) =>
    cn(
      selected
        ? pickerPanelTitleClass
        : 'text-xs font-normal text-muted-foreground sm:text-sm md:text-xs lg:text-sm',
    )

  const summaryDateIconClass = (selected: boolean) =>
    cn('size-7 shrink-0 sm:size-8', !selected && 'opacity-40')

  const triggerEl = trigger ? (
    trigger({ formattedValue, hasValue })
  ) : (
    <div className="flex min-w-0 flex-col gap-1.5 sm:gap-2">
      <label className="ml-1 text-xs font-medium text-foreground sm:text-sm" htmlFor={id}>
        {resolvedLabel}
      </label>
      <div className="relative w-full min-w-0">
        <CalendarIcon
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground sm:size-5"
          aria-hidden
        />
        <input
          id={id}
          type="text"
          value={formattedValue}
          readOnly
          placeholder={resolvedPlaceholder}
          className={cn(
            'h-10 w-full min-w-0 rounded-full border bg-background py-2.5 pl-9 pr-3 text-xs text-text-color placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 sm:h-11 sm:px-4 sm:pl-10 sm:text-sm lg:h-12',
            hasError
              ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500'
              : 'border-light-text-color focus-visible:border-ring focus-visible:ring-ring',
          )}
        />
      </div>
    </div>
  )

  const doneButton = (
    <Button
      type="button"
      disabled={!canConfirm}
      onClick={handleDone}
      className={cn(pickerDoneButtonClass, 'w-full')}
    >
      Done
    </Button>
  )

  const calendarPanel = (
    <div
      className={cn(
        pickerPanelClass,
        isMobile ? 'min-h-100 min-w-0 shrink-0 overflow-x-clip p-2' : 'p-2',
      )}
    >
      <div className="flex min-w-0 items-start justify-center overflow-x-clip">
        <Calendar
          mode="range"
          selected={activeRange}
          onSelect={(range) => handleCalendarSelect(range)}
          onDayClick={handleDayClick}
          numberOfMonths={1}
          disabled={{ before: today }}
          defaultMonth={activeRange?.from ?? today}
          className={cn(
            'rounded-xl',
            isMobile
              ? 'w-full max-w-full p-1 [--cell-size:--spacing(7)]'
              : [
                  'w-full max-w-full p-1 [--cell-size:--spacing(8)]',
                  '[&_td]:aspect-auto [&_td]:h-(--cell-size)',
                  '[&_button[data-day]]:aspect-auto [&_button[data-day]]:h-(--cell-size) [&_button[data-day]]:min-h-0',
                ].join(' '),
          )}
        />
      </div>
    </div>
  )

  const previewPanel = (
    <div
      className={cn(
        pickerPanelClass,
        isMobile ? 'shrink-0 p-2' : 'flex h-full flex-col gap-3 p-2 sm:p-3',
      )}
    >
      <div className={cn('rounded-2xl border border-border bg-muted/20', isMobile ? 'p-2' : 'p-3')}>
        <div className="flex items-start gap-2.5">
          <CalendarIcon className={summaryDateIconClass(Boolean(activeRange?.from))} aria-hidden />

          <div className="min-w-0">
            <p className={summaryDateValueClass(Boolean(activeRange?.from))}>
              {activeRange?.from ? formatLongDate(activeRange.from) : 'Not selected'}
            </p>
            <p className={pickerPanelSubtitleClass}>Check-in date</p>
          </div>
        </div>

        <div className="my-2 flex items-center gap-2 pl-[14px]">
          <span className="size-1.5 rounded-full bg-border" />
          <span className="h-6 w-px bg-border" />
          <span className="size-1.5 rounded-full bg-border" />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <CalendarIcon className={summaryDateIconClass(Boolean(activeRange?.to))} aria-hidden />

            <div className="min-w-0">
              <p className={summaryDateValueClass(Boolean(activeRange?.to))}>
                {activeRange?.to ? formatLongDate(activeRange.to) : 'Not selected'}
              </p>
              <p className={pickerPanelSubtitleClass}>Check-out date</p>
            </div>
          </div>

          {nights > 0 ? (
            <div className="flex shrink-0 items-center gap-1 rounded-2xl bg-light-text-color px-2.5 py-1.5">
              <Moon className="size-4 sm:size-5" aria-hidden />
              <p className="text-sm font-semibold text-foreground sm:text-base lg:text-[15px]">
                {nights === 1 ? '1 night' : `${nights} nights`}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {!isMobile ? <div className="mt-auto">{doneButton}</div> : null}
    </div>
  )

  return (
    <ResponsiveFormPicker
      open={open}
      onOpenChange={setOpen}
      srTitle="Select dates"
      closeLabel="Close date picker"
      trigger={triggerEl}
      popoverAlign="center"
      popoverMatchTriggerWidth={false}
      popoverClassName="overflow-visible lg:w-[min(800px,calc(100vw-2rem))]"
      drawerClassName="data-[vaul-drawer-direction=bottom]:h-[min(96dvh,calc(100dvh-0.5rem))] data-[vaul-drawer-direction=bottom]:max-h-[min(96dvh,calc(100dvh-0.5rem))]"
      cardClassName={
        isMobile ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'border-none p-0 shadow-none'
      }
      cardBodyClassName={
        isMobile ? 'min-h-0 flex-1 gap-2 overflow-hidden' : 'gap-2 border-none shadow-none'
      }
    >
      {isMobile ? (
        <>
          <div data-vaul-no-drag className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="grid min-w-0 gap-2 pb-1">
              <div className="min-w-0 shrink-0">{calendarPanel}</div>
              <div className="min-w-0 shrink-0">{previewPanel}</div>
            </div>
          </div>
          <div className="shrink-0 border-t border-border/60 bg-background pt-2">{doneButton}</div>
        </>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2 lg:items-stretch">
          <div className="order-2 lg:order-1">{calendarPanel}</div>
          <div className="order-1 lg:order-2">{previewPanel}</div>
        </div>
      )}
    </ResponsiveFormPicker>
  )
}

export default DateRangePicker
