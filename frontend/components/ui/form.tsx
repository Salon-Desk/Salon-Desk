'use client'

import type { ReactNode } from 'react'
import { useId } from 'react'

import { cn } from '@/lib/utils'

const CONTROL_CLASSES =
  'w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 text-xs shadow-xs transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:outline-hidden'

export interface FieldProps {
  label: ReactNode
  required?: boolean
  hint?: ReactNode
  children: (controlProps: { id: string; className: string }) => ReactNode
  className?: string
}

/**
 * Label + control + optional hint. The control is supplied via a render prop so
 * the generated id is wired to the label without cloning elements.
 */
export function Field({ label, required, hint, children, className }: FieldProps) {
  const id = useId()

  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={id} className="font-semibold text-slate-700 text-xs">
        {label}
        {required && <span className="ml-0.5 text-amber-600">*</span>}
      </label>
      {children({ id, className: CONTROL_CLASSES })}
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  )
}

type BaseFieldProps = Omit<FieldProps, 'children'> & { disabled?: boolean }

export function TextField({
  value,
  onChange,
  placeholder,
  mono = false,
  type = 'text',
  ...field
}: BaseFieldProps & {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  mono?: boolean
  type?: 'text' | 'email' | 'tel'
}) {
  return (
    <Field {...field}>
      {({ id, className }) => (
        <input
          id={id}
          type={type}
          required={field.required}
          disabled={field.disabled}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={cn(className, mono && 'font-mono font-bold')}
        />
      )}
    </Field>
  )
}

export function NumberField({
  value,
  onChange,
  min,
  max,
  step,
  ...field
}: BaseFieldProps & {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <Field {...field}>
      {({ id, className }) => (
        <input
          id={id}
          type="number"
          required={field.required}
          disabled={field.disabled}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
          className={className}
        />
      )}
    </Field>
  )
}

export interface SelectOption<T extends string | number> {
  value: T
  label: string
}

export function SelectField<T extends string | number>({
  value,
  onChange,
  options,
  ...field
}: BaseFieldProps & {
  value: T
  onChange: (value: T) => void
  options: readonly SelectOption<T>[]
}) {
  return (
    <Field {...field}>
      {({ id, className }) => (
        <select
          id={id}
          required={field.required}
          disabled={field.disabled}
          value={value}
          onChange={(event) => {
            const raw = event.target.value
            const match = options.find((option) => String(option.value) === raw)
            if (match) onChange(match.value)
          }}
          className={cn(className, 'cursor-pointer font-semibold')}
        >
          {options.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}

export function TextareaField({
  value,
  onChange,
  placeholder,
  rows = 3,
  ...field
}: BaseFieldProps & {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <Field {...field}>
      {({ id, className }) => (
        <textarea
          id={id}
          required={field.required}
          disabled={field.disabled}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={cn(className, 'resize-y')}
        />
      )}
    </Field>
  )
}

/** Right-aligned Cancel/Submit pair closing out a modal form. */
export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 border-slate-100 border-t pt-3">
      {children}
    </div>
  )
}
