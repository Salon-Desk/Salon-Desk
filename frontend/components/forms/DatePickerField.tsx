'use client'

import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'

import {
  formControlInlineIconClassName,
  formControlPopoverContentClassName,
  formControlPopoverTriggerClassName,
  FormFieldError,
  FormFieldLabel,
  FormFieldRoot,
} from '@/components/forms/form-field-parts'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type DatePickerFieldDisabledProps = {
  before?: Date
  after?: Date
  dates?: Date[]
}

export type DatePickerFieldProps = {
  id: string
  label: string
  value: string
  onChange: (isoDate: string) => void
  isRequired?: boolean
  placeholder?: string
  disabled?: DatePickerFieldDisabledProps
  className?: string
  /** Shown under the control; also sets `aria-invalid` on the trigger. */
  errorMessage?: string
}

export function DatePickerField({
  id,
  label,
  value,
  onChange,
  isRequired = true,
  placeholder = 'YYYY-MM-DD',
  disabled,
  className,
  errorMessage,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)
  const errorId = `${id}-error`
  const hasError = Boolean(errorMessage)
  const selectedDate = value ? new Date(value) : undefined
  const isValidDate = Boolean(selectedDate && !Number.isNaN(selectedDate.getTime()))

  return (
    <FormFieldRoot className={className}>
      <FormFieldLabel htmlFor={id} label={label} isRequired={isRequired} />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className={cn(
              formControlPopoverTriggerClassName({
                hasError,
                empty: !value,
              }),
              'font-normal',
            )}
          >
            <span className="min-w-0 truncate">
              {isValidDate && selectedDate ? format(selectedDate, 'MM/dd/yyyy') : placeholder}
            </span>
            <CalendarIcon
              className={cn(formControlInlineIconClassName, 'opacity-60')}
              aria-hidden
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className={formControlPopoverContentClassName}
          align="start"
          side="bottom"
          sideOffset={4}
          collisionPadding={12}
        >
          <Calendar
            mode="single"
            captionLayout="dropdown"
            startMonth={disabled?.before ?? new Date(1900, 0)}
            endMonth={disabled?.after ?? new Date(2100, 11)}
            selected={isValidDate && selectedDate ? selectedDate : undefined}
            defaultMonth={isValidDate && selectedDate ? selectedDate : new Date()}
            disabled={(date) => {
              if (disabled?.before && date < disabled.before) {
                return true
              }
              if (disabled?.after && date > disabled.after) {
                return true
              }
              if (
                disabled?.dates?.some((d) => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
              ) {
                return true
              }
              return false
            }}
            onMonthChange={(month) => {
              if (disabled?.before && month < disabled.before) {
                return
              }
              if (disabled?.after && month > disabled.after) {
                return
              }
            }}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, 'yyyy-MM-dd'))
                setOpen(false)
              }
            }}
          />
        </PopoverContent>
      </Popover>

      {errorMessage ? <FormFieldError id={errorId} message={errorMessage} /> : null}
    </FormFieldRoot>
  )
}

export default DatePickerField
