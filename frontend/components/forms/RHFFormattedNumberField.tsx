'use client'

import type React from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import {
  formControlInputClassName,
  FormFieldError,
  formFieldHtmlIds,
  FormFieldLabel,
  FormFieldRoot,
} from '@/components/forms/form-field-parts'

interface RHFFormattedNumberFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'name'
> {
  name: string
  label: string
  isRequired?: boolean
  maxDigits: number
  groupPattern?: number[]
}

const RHFFormattedNumberField = ({
  name,
  label,
  isRequired = true,
  maxDigits,
  groupPattern = [4, 4, 4, 4],
  placeholder,
  ...other
}: RHFFormattedNumberFieldProps) => {
  const { control, clearErrors } = useFormContext()
  const { controlId, errorId } = formFieldHtmlIds(name)

  const formatValue = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, maxDigits)

    const parts: string[] = []
    let start = 0

    for (const size of groupPattern) {
      const part = digits.slice(start, start + size)

      if (!part) {
        break
      }

      parts.push(part)
      start += size
    }

    if (start < digits.length) {
      parts.push(digits.slice(start))
    }

    return parts.join(' ')
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot>
          {label ? (
            <FormFieldLabel htmlFor={controlId} label={label} isRequired={isRequired} />
          ) : null}

          <input
            id={controlId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            value={formatValue(field.value ?? '')}
            onChange={(e) => {
              const rawValue = e.target.value.replace(/\D/g, '').slice(0, maxDigits)

              field.onChange(rawValue)
              clearErrors(name)
            }}
            className={formControlInputClassName({
              hasError: !!error,
              hasLeftIcon: false,
            })}
            {...other}
          />

          {error ? <FormFieldError id={errorId} message={error.message ?? ''} /> : null}
        </FormFieldRoot>
      )}
    />
  )
}

export default RHFFormattedNumberField
