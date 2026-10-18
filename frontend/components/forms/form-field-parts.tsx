'use client'

import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type FormFieldLabelProps = {
  htmlFor?: string
  label: string
  isRequired?: boolean
  className?: string
  /** When `isRequired` but false, omit the asterisk (field still validates as required). */
  showRequiredMarker?: boolean
  /** When optional but false, omit the “(optional)” hint. */
  showOptionalHint?: boolean
  onClick?: () => void
}

const OPTIONAL_FALLBACK = '(optional)'

/** Labels and required/optional markers aligned with `globals.css` theme tokens. */
export function FormFieldLabel({
  htmlFor,
  label,
  isRequired = true,
  className,
  showRequiredMarker = true,
  showOptionalHint = true,
  onClick,
}: FormFieldLabelProps) {
  const optionalText = OPTIONAL_FALLBACK

  return (
    <Label
      htmlFor={htmlFor}
      className={cn(
        'block font-normal leading-snug text-foreground',
        'text-[length:var(--form-label-text)]',
        className,
      )}
      onClick={onClick}
    >
      {label}
      {isRequired ? (
        showRequiredMarker ? (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        ) : null
      ) : showOptionalHint ? (
        <span className="ml-1 text-xs font-normal text-muted-foreground">{optionalText}</span>
      ) : null}
    </Label>
  )
}

type FormFieldErrorProps = {
  id: string
  message: string
  className?: string
}

export function FormFieldError({ id, message, className }: FormFieldErrorProps) {
  return (
    <p
      id={id}
      className={cn(
        'mt-1 flex items-start gap-1.5 break-words text-xs text-destructive sm:mt-1.5',
        className,
      )}
      role="alert"
    >
      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-destructive" aria-hidden="true" />
      {message}
    </p>
  )
}

export function FormFieldHint({ message, className }: { message: string; className?: string }) {
  return <p className={cn('mt-1 text-xs text-muted-foreground sm:mt-1.5', className)}>{message}</p>
}

/** Default vertical spacing for label + control + error (matches `RHFTextField`). */
export const formFieldRootClassName = 'w-full min-w-0 space-y-[length:var(--form-field-gap)]'

export function FormFieldRoot({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn(formFieldRootClassName, className)}>{children}</div>
}

/** Stable ids for `aria-describedby` / `htmlFor` (handles nested field names). */
export function formFieldHtmlIds(fieldName: string) {
  const base = fieldName.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-')
  const controlId = `field-${base}`
  const errorId = `${controlId}-error`
  return { controlId, errorId }
}

const formControlBaseClassName =
  'w-full min-w-0 min-h-[length:var(--form-control-min-h)] border bg-background font-normal text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20'

const formControlSizeClassName =
  'rounded-[length:var(--form-control-radius)] px-[length:var(--form-control-px)] py-[length:var(--form-control-py)] text-[length:var(--form-control-text)] leading-normal'

const formControlPlaceholderClassName =
  'placeholder:text-text-main-gray placeholder:text-xs sm:placeholder:text-sm'

/** Plain inputs (text, email, tel, time, etc.) */
export function formControlInputClassName(opts: {
  hasError?: boolean
  hasLeftIcon?: boolean
  hasRightIcon?: boolean
  className?: string
}) {
  return cn(
    formControlBaseClassName,
    formControlSizeClassName,
    formControlPlaceholderClassName,
    opts.hasError ? 'border-destructive' : 'border-border',
    opts.hasLeftIcon
      ? 'py-[length:var(--form-control-py)] pl-9 pr-[length:var(--form-control-px)] sm:pl-12'
      : null,
    opts.hasRightIcon
      ? 'py-[length:var(--form-control-py)] pl-[length:var(--form-control-px)] pr-9 sm:pr-12'
      : null,
    opts.className,
  )
}

export function formControlTextareaClassName(opts: { hasError?: boolean; className?: string }) {
  return cn(
    'min-h-[5.5rem] w-full min-w-0 resize-y sm:min-h-[6.5rem]',
    formControlBaseClassName,
    formControlSizeClassName,
    formControlPlaceholderClassName,
    opts.hasError ? 'border-destructive' : 'border-border',
    opts.className,
  )
}

/** Bordered row for password, phone, composite controls */
export function formControlShellClassName(opts: { hasError?: boolean; className?: string }) {
  return cn(
    'flex min-h-[length:var(--form-control-min-h)] min-w-0 items-center gap-[length:var(--form-shell-gap)] rounded-[length:var(--form-control-radius)] border bg-background px-[length:var(--form-shell-px)] py-[length:var(--form-shell-py)] transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20',
    opts.hasError ? 'border-destructive' : 'border-border',
    opts.className,
  )
}

export const formControlShellInputClassName =
  'min-w-0 flex-1 border-0 bg-transparent py-1 text-[length:var(--form-control-text)] font-normal text-foreground outline-none placeholder:text-text-main-gray placeholder:text-xs sm:placeholder:text-sm'

export const formControlLeftIconClassName =
  'pointer-events-none absolute left-3 top-1/2 size-[length:var(--form-icon-size)] -translate-y-1/2 text-muted-foreground sm:left-4'

export const formControlRightIconClassName =
  'pointer-events-none absolute right-3 top-1/2 size-[length:var(--form-icon-size)] -translate-y-1/2 text-muted-foreground sm:right-4'

export const formControlInlineIconClassName =
  'size-[length:var(--form-icon-size)] shrink-0 text-text-main-gray'

/** Shell wrapping shadcn `Select` (padding aligned with text inputs). */
export function formControlSelectShellClassName(opts: {
  hasError?: boolean
  disabled?: boolean
  className?: string
}) {
  return cn(
    'flex min-h-[length:var(--form-control-min-h)] min-w-0 items-center rounded-[length:var(--form-control-radius)] border bg-background px-[length:var(--form-control-px)] py-[length:var(--form-control-py)] transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20',
    opts.hasError ? 'border-destructive' : 'border-border',
    opts.disabled && 'cursor-not-allowed opacity-50',
    opts.className,
  )
}

export const formControlSelectValueClassName =
  'min-w-0 flex-1 truncate text-left text-[length:var(--form-control-text)] font-normal text-foreground'

/** Date / year picker trigger */
export function formControlPopoverTriggerClassName(opts: {
  hasError?: boolean
  empty?: boolean
  className?: string
}) {
  return cn(
    'h-auto min-h-[length:var(--form-control-min-h)] w-full min-w-0 justify-between gap-2 overflow-hidden text-ellipsis whitespace-nowrap rounded-[length:var(--form-control-radius)] border bg-background px-[length:var(--form-control-px)] py-[length:var(--form-control-py)] text-left text-[length:var(--form-control-text)] font-normal focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20',
    opts.hasError ? 'border-destructive' : 'border-border',
    opts.empty ? 'text-muted-foreground' : 'text-foreground',
    opts.className,
  )
}

/** Searchable dropdown / combobox trigger */
export function formControlComboboxTriggerClassName(opts: {
  hasError?: boolean
  disabled?: boolean
  className?: string
}) {
  return cn(
    'relative min-h-[length:var(--form-control-min-h)] w-full min-w-0 rounded-[length:var(--form-control-radius)] border bg-background px-[length:var(--form-control-px)] py-[length:var(--form-control-py)] text-left text-[length:var(--form-control-text)] font-normal text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20',
    opts.hasError ? 'border-destructive bg-destructive/5' : 'border-border',
    opts.disabled && 'cursor-not-allowed opacity-50',
    opts.className,
  )
}

/** Calendar popover panel (date pickers). */
export const formControlPopoverContentClassName =
  'w-auto max-w-[calc(100vw-1.5rem)] bg-popover p-0 sm:max-w-none'

/** Dropdown / combobox list panel — stays within viewport on small screens. */
export const formControlDropdownContentClassName =
  'max-w-[min(calc(100vw-1.5rem),var(--radix-popover-trigger-width))] rounded-lg border border-border bg-popover p-0'

/** Year picker grid panel. */
export const formControlYearPickerContentClassName =
  'max-h-52 w-[min(calc(100vw-1.5rem),16rem)] overflow-y-auto p-2 sm:max-h-64 sm:w-auto'

/** Shared classes for selectable cards / toggles (unselected vs selected). */
export const formCardClasses = {
  unselected: 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/50',
  selected: 'border-primary bg-primary/5 text-foreground shadow-sm',
} as const

/** Shadcn select trigger inside `formControlSelectShellClassName`. */
export const formControlSelectTriggerClassName =
  'h-auto min-h-[length:var(--form-control-min-h)] w-full min-w-0 overflow-hidden border-0 bg-transparent p-0 px-[length:var(--form-control-px)] text-left text-[length:var(--form-control-text)] font-normal shadow-none focus:ring-0 focus:outline-none data-[size=default]:h-auto data-[size=default]:min-h-[length:var(--form-control-min-h)]'

/** Shadcn select dropdown panel. */
export const formControlSelectContentClassName =
  'mt-1 max-h-[min(60vh,18rem)] rounded-[length:var(--form-control-radius)] bg-popover shadow-md ring-1 ring-foreground/10'

/** Shadcn select item. */
export const formControlSelectItemClassName =
  'rounded-md px-[length:var(--form-control-px)] py-2 text-[length:var(--form-control-text)] hover:bg-accent/10 focus:bg-accent/20'

/** Combobox / command search input. */
export const formControlCommandInputClassName =
  'h-auto min-h-[length:var(--form-control-min-h)] border-b border-border px-[length:var(--form-control-px)] py-[length:var(--form-control-py)] text-[length:var(--form-control-text)] placeholder:text-muted-foreground'

/** Combobox / command scroll list. */
export const formControlCommandListClassName = 'max-h-[min(60vh,18.75rem)] overflow-y-auto'

/** Combobox / command option row. */
export const formControlCommandItemClassName =
  'px-[length:var(--form-control-px)] py-2 text-[length:var(--form-control-text)] data-[selected=true]:bg-accent'

export const formControlCommandEmptyClassName = 'p-3 text-[length:var(--form-control-text)] sm:p-4'

export const formControlChevronClassName = 'size-[length:var(--form-icon-size)] shrink-0'

export const formControlToggleIconClassName = 'size-[length:var(--form-icon-size)]'

/** Horizontal scroll row for chips / cards. */
export const formControlOptionScrollClassName =
  'no-scrollbar flex max-w-full flex-row gap-2 overflow-x-auto py-1'

/** Chip-style selectable option (property types, tags, etc.). */
export function formControlChipOptionClassName(selected: boolean, className?: string) {
  return cn(
    'flex min-w-[5.5rem] shrink-0 items-center gap-2 rounded-xl border px-3 py-2 transition-all sm:min-w-[7rem] sm:px-4 sm:py-3 md:min-w-[8.75rem] lg:min-w-[10rem]',
    selected ? formCardClasses.selected : formCardClasses.unselected,
    className,
  )
}

/** Vertical list selectable option. */
export function formControlListOptionClassName(selected: boolean, className?: string) {
  return cn(
    'flex w-full min-w-0 flex-row items-start gap-2 rounded-xl border p-3 text-left transition-all sm:gap-3 sm:rounded-2xl sm:p-4',
    selected ? formCardClasses.selected : formCardClasses.unselected,
    className,
  )
}

/** Large onboarding card option. */
export function formControlLargeCardClassName(selected: boolean, className?: string) {
  return cn(
    'flex cursor-pointer flex-col gap-2 rounded-xl border p-3 text-left transition-all duration-150 sm:gap-3 sm:rounded-2xl sm:p-4 lg:gap-4 lg:rounded-[20px] lg:p-4 lg:pl-6 lg:pr-3.5 lg:pt-3.5',
    selected ? formCardClasses.selected : formCardClasses.unselected,
    className,
  )
}

/** Horizontal scroll card (icons + label). */
export function formControlScrollCardClassName(selected: boolean, className?: string) {
  return cn(
    'flex h-36 min-w-[8.5rem] max-w-[11rem] shrink-0 flex-col justify-between gap-2 whitespace-nowrap rounded-xl border py-3 pl-3 pr-4 transition-all sm:h-44 sm:min-w-[10.625rem] sm:rounded-2xl sm:py-4 sm:pl-4 sm:pr-6',
    selected ? formCardClasses.selected : formCardClasses.unselected,
    className,
  )
}

/** Number rating / step chips. */
export function formControlNumberChipClassName(selected: boolean, className?: string) {
  return cn(
    'flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border text-xs font-normal transition-all duration-200 sm:h-12 sm:w-16 sm:rounded-[10px] sm:text-sm',
    selected
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-border bg-card text-muted-foreground hover:border-primary/40',
    className,
  )
}

/** Radio group card option. */
export function formControlRadioCardClassName(unselected: boolean, className?: string) {
  return cn(
    'flex h-16 min-w-[8.5rem] shrink-0 items-center rounded-xl border px-3 py-3 sm:h-[4.5rem] sm:min-w-[10rem] sm:rounded-2xl sm:px-4 sm:py-4',
    unselected ? formCardClasses.unselected : formCardClasses.selected,
    className,
  )
}

/** Guest / people counter row shell. */
export const formControlCounterRowClassName =
  'flex min-w-0 flex-col items-stretch justify-between gap-2 rounded-xl border border-border px-2 py-2 sm:flex-row sm:items-center sm:gap-3 sm:rounded-2xl sm:px-3 sm:py-3'

export const formControlCounterControlsClassName =
  'flex shrink-0 items-center gap-1.5 self-end rounded-full border border-border px-1.5 py-1 sm:gap-2 sm:px-2'

export const formControlCounterButtonMinusClassName =
  'rounded-full bg-muted p-1 transition-colors hover:border hover:border-primary sm:p-1.5'

export const formControlCounterButtonPlusClassName =
  'rounded-full bg-primary px-1 py-0.5 text-primary-foreground transition-colors hover:border hover:border-primary sm:px-1.5 sm:py-0.5'

export const formControlCounterValueClassName = 'min-w-[1.25rem] text-center text-sm font-bold'

/** Inline unit switch overlay (number + unit fields). */
export const formControlUnitSwitchClassName =
  'absolute right-1.5 flex max-w-[45%] items-center rounded-full border bg-muted p-1 py-0.5 sm:right-2 sm:max-w-none sm:p-1.5 sm:py-1'

export function formControlUnitSwitchButtonClassName(active: boolean) {
  return cn(
    'rounded-full px-1.5 py-1 text-[0.625rem] font-normal transition-all sm:px-2 sm:py-1.5 sm:text-xs',
    active
      ? 'bg-background text-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
  )
}

/** Segmented toggle root (2–4 options). */
export function formControlSegmentedRootClassName(optionCount: number, className?: string) {
  const cols =
    optionCount === 2
      ? 'grid-cols-2'
      : optionCount === 3
        ? 'grid-cols-3'
        : optionCount === 4
          ? 'grid-cols-4'
          : 'grid-cols-2 sm:grid-cols-3'

  return cn('mb-3 grid w-full min-w-0 gap-1 rounded-full bg-muted p-1 sm:mb-4', cols, className)
}

export function formControlSegmentedButtonClassName(active: boolean, className?: string) {
  return cn(
    'min-w-0 cursor-pointer rounded-full px-2 py-1.5 text-center text-[0.6875rem] font-semibold whitespace-nowrap transition-all duration-200 sm:px-3 sm:py-2 sm:text-xs md:px-4 md:text-sm',
    active
      ? 'bg-background text-foreground shadow-sm'
      : 'bg-transparent text-muted-foreground hover:bg-background/70 hover:text-foreground',
    className,
  )
}

/** Upload action button. */
export const formControlUploadButtonClassName =
  'w-fit rounded-3xl border-[0.6px] border-primary/40 bg-white p-2 text-xs text-primary shadow-none hover:bg-primary hover:text-white sm:p-2.5 sm:text-sm'

/** Upload field container. */
export const formControlUploadZoneClassName =
  'w-full space-y-2 rounded-xl bg-card px-3 py-2.5 sm:space-y-3 sm:rounded-2xl sm:px-4 sm:py-3'

/** Popover panel card (guest picker, filters). */
export const formControlPopoverPanelClassName =
  'w-[min(calc(100vw-1.5rem),25rem)] rounded-xl border border-border bg-white p-3 shadow-[0px_0px_24px_0px_#00000014] sm:rounded-2xl sm:p-4'

/** Read-only booking filter trigger input. */
export const formControlBookingFilterInputClassName =
  'h-[length:var(--form-control-min-h)] w-full min-w-0 rounded-full border border-light-text-color bg-background py-0 pl-9 pr-3 text-[length:var(--form-control-text)] leading-none text-text-color placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:pl-10 sm:pr-4'

/** Booking filter column (label + pill input). */
export const formControlBookingFilterFieldClassName =
  'flex min-w-0 flex-col gap-[length:var(--form-field-gap)]'

/** Primary action button aligned to booking filter input height. */
export const formControlBookingFilterButtonClassName =
  'h-[length:var(--form-control-min-h)] min-h-[length:var(--form-control-min-h)] rounded-full px-4 text-sm font-normal shadow-none sm:px-6 sm:text-base [&_span]:gap-2'

/** Switch field layout. */
export const formControlSwitchRootClassName =
  'flex min-h-[length:var(--form-control-min-h)] w-full min-w-0 flex-col justify-end gap-[length:var(--form-field-gap)]'

/** Multi-select checkbox row inside popover. */
export const formControlCheckboxOptionClassName =
  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs hover:bg-accent/10 sm:px-3 sm:py-2.5 sm:text-sm'

/** Responsive avatar upload dropzone. */
export const formControlAvatarDropzoneClassName =
  'relative size-20 cursor-pointer overflow-hidden rounded-full border-[3px] border-primary/30 bg-muted sm:size-24 md:size-32 lg:size-[8.625rem]'

export const formControlCardTitleClassName =
  'text-base font-black text-foreground sm:text-lg lg:text-xl'

export const formControlCardSubtitleClassName =
  'text-sm font-bold text-muted-foreground sm:text-[length:var(--form-control-text)]'

export const formControlCardDescriptionClassName = 'text-xs font-normal text-muted-foreground'

/** OTP input group — equal square slots across the full width. */
export const formControlOtpGroupClassName = 'grid w-full gap-1.5 sm:gap-2'

/** OTP input slots (verification codes). */
export const formControlOtpSlotClassName =
  'aspect-square !size-auto h-auto w-full min-w-0 rounded-[length:var(--form-control-radius)] border border-border bg-background text-center text-base font-semibold leading-none shadow-none first:rounded-[length:var(--form-control-radius)] last:rounded-[length:var(--form-control-radius)] first:border last:border focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 data-[active=true]:border-primary data-[active=true]:ring-1 data-[active=true]:ring-primary/20 sm:text-lg'

/** Native checkbox control. */
export const formControlCheckboxClassName =
  'size-[1.125rem] shrink-0 cursor-pointer rounded-md border border-border bg-transparent accent-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 sm:size-[1.3125rem] sm:rounded-lg'
