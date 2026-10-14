'use client'
import { useState } from 'react'
import { Controller, type ControllerRenderProps, useFormContext } from 'react-hook-form'

import {
  formControlInputClassName,
  FormFieldError,
  formFieldHtmlIds,
  FormFieldLabel,
  FormFieldRoot,
} from '@/components/forms/form-field-parts'

interface IProps {
  name: string
  label: string
  isRequired?: boolean
  placeholder?: string
  allowDecimal?: boolean
  emptyAsZero?: boolean
}

/** Strip anything that is not a digit (plus a single dot when decimals are allowed). */
function sanitizeInput(value: string, allowDecimal: boolean): string {
  if (!allowDecimal) {
    return value.replace(/\D/g, '')
  }

  const cleaned = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
  // Drop leading zeros ("020" → "20") while keeping "0" and "0.5" intact.
  if (cleaned.length > 1 && cleaned.startsWith('0') && cleaned[1] !== '.') {
    return cleaned.replace(/^0+/, '') || '0'
  }
  return cleaned
}

function formatGrouped(value: string | number): string {
  const num = Number(value)
  if (Number.isNaN(num)) {
    return ''
  }
  return new Intl.NumberFormat('en-US').format(num)
}

/** Render the form value as input text (used for the initial value and external updates). */
function toDisplayValue(value: unknown, allowDecimal: boolean): string {
  if (value === undefined || value === null || value === '') {
    return ''
  }
  if (allowDecimal) {
    return String(value)
  }
  return formatGrouped(value as string | number)
}

interface NumberFieldInputProps {
  value: unknown
  onChange: (value: unknown) => void
  onBlur: () => void
  inputRef: ControllerRenderProps['ref']
  controlId: string
  errorId: string
  hasError: boolean
  allowDecimal: boolean
  emptyAsZero: boolean
  placeholder?: string
  inputProps: React.InputHTMLAttributes<HTMLInputElement>
  onValueCleared: () => void
}

/**
 * Keeps the typed text in local state so the input always shows what the user typed.
 * Without this, clearing the last digit of an `emptyAsZero` field writes `0` back into
 * the form and immediately re-renders it, making the final digit impossible to delete.
 */
const NumberFieldInput = ({
  value,
  onChange,
  onBlur,
  inputRef,
  controlId,
  errorId,
  hasError,
  allowDecimal,
  emptyAsZero,
  placeholder,
  inputProps,
  onValueCleared,
}: NumberFieldInputProps) => {
  const [draft, setDraft] = useState(() => toDisplayValue(value, allowDecimal))
  const [lastEmitted, setLastEmitted] = useState(value)
  const [prevValue, setPrevValue] = useState(value)

  if (value !== prevValue) {
    setPrevValue(value)
    if (value !== lastEmitted) {
      setLastEmitted(value)
      setDraft(toDisplayValue(value, allowDecimal))
    }
  }

  const selectWhenZero = (input: HTMLInputElement) => {
    if (draft === '0') {
      requestAnimationFrame(() => input.select())
    }
  }

  return (
    <input
      ref={inputRef}
      id={controlId}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      placeholder={placeholder}
      aria-invalid={hasError}
      aria-describedby={hasError ? errorId : undefined}
      {...inputProps}
      value={draft}
      onFocus={(e) => {
        selectWhenZero(e.target)
        inputProps.onFocus?.(e)
      }}
      onClick={(e) => {
        selectWhenZero(e.currentTarget)
        inputProps.onClick?.(e)
      }}
      onChange={(e) => {
        const sanitized = sanitizeInput(e.target.value, allowDecimal)
        setDraft(allowDecimal || sanitized === '' ? sanitized : formatGrouped(sanitized))

        const nextValue =
          sanitized === ''
            ? emptyAsZero
              ? 0
              : undefined
            : allowDecimal
              ? sanitized
              : Number(sanitized)

        setLastEmitted(nextValue)
        onChange(nextValue)
        onValueCleared()
      }}
      onBlur={(e) => {
        onBlur()
        inputProps.onBlur?.(e)
      }}
      className={formControlInputClassName({ hasError })}
    />
  )
}

const RHFNumberField = ({
  name,
  label,
  isRequired = true,
  placeholder,
  allowDecimal = false,
  emptyAsZero = false,
  ...other
}: IProps & React.InputHTMLAttributes<HTMLInputElement>) => {
  const { control, clearErrors } = useFormContext()
  const { controlId, errorId } = formFieldHtmlIds(name)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const { value, onChange, onBlur, ref } = field
        return (
          <FormFieldRoot>
            {label ? (
              <FormFieldLabel htmlFor={controlId} label={label} isRequired={isRequired} />
            ) : null}

            <NumberFieldInput
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              inputRef={ref}
              controlId={controlId}
              errorId={errorId}
              hasError={!!error}
              allowDecimal={allowDecimal}
              emptyAsZero={emptyAsZero}
              placeholder={placeholder}
              inputProps={other}
              onValueCleared={() => clearErrors(name)}
            />

            {error ? <FormFieldError id={errorId} message={error.message ?? ''} /> : null}
          </FormFieldRoot>
        )
      }}
    />
  )
}

export default RHFNumberField
