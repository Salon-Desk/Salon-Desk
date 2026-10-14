'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import {
  formControlShellClassName,
  formControlShellInputClassName,
  formControlToggleIconClassName,
  FormFieldError,
  formFieldHtmlIds,
  FormFieldLabel,
  FormFieldRoot,
} from '@/components/forms/form-field-parts'
import { cn } from '@/lib/utils'

interface IProps {
  name: string
  label: string
  isRequired?: boolean
  placeholder?: string
}

const RHFNumberPasswordField = ({
  name,
  label,
  isRequired = true,
  placeholder,
  ...other
}: IProps & React.InputHTMLAttributes<HTMLInputElement>) => {
  const { control, clearErrors } = useFormContext()
  const [showPassword, setShowPassword] = useState(false)
  const { controlId, errorId } = formFieldHtmlIds(name)

  const handleInput = (value: string) => value.replace(/\D/g, '')

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot>
          {label ? (
            <FormFieldLabel htmlFor={controlId} label={label} isRequired={isRequired} />
          ) : null}

          <div className={formControlShellClassName({ hasError: !!error })}>
            <input
              id={controlId}
              type={showPassword ? 'text' : 'password'}
              inputMode="numeric"
              placeholder={placeholder}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              className={cn(formControlShellInputClassName, 'pr-2')}
              {...field}
              value={field.value ?? ''}
              onChange={(e) => {
                const digitsOnly = handleInput(e.target.value)
                field.onChange(digitsOnly)
                clearErrors(name)
              }}
              {...other}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? 'Hide PIN' : 'Show PIN'}
            >
              {showPassword ? (
                <Eye className={formControlToggleIconClassName} aria-hidden />
              ) : (
                <EyeOff className={formControlToggleIconClassName} aria-hidden />
              )}
            </button>
          </div>

          {error ? <FormFieldError id={errorId} message={error.message ?? ''} /> : null}
        </FormFieldRoot>
      )}
    />
  )
}

export default RHFNumberPasswordField
