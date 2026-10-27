'use client'

import { Eye, EyeOff, Lock } from 'lucide-react'
import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import {
  formControlInlineIconClassName,
  formControlShellClassName,
  formControlShellInputClassName,
  formControlToggleIconClassName,
  FormFieldError,
  FormFieldHint,
  formFieldHtmlIds,
  FormFieldLabel,
  FormFieldRoot,
} from '@/components/forms/form-field-parts'
import { cn } from '@/lib/utils'

interface RHFPasswordFieldProps {
  name: string
  label: string
  isRequired?: boolean
  hint?: string
}

const RHFPasswordField = ({
  name,
  label,
  isRequired = true,
  hint,
  className,
  placeholder = 'Enter Password',
  ...other
}: RHFPasswordFieldProps & React.InputHTMLAttributes<HTMLInputElement>) => {
  const { control, clearErrors } = useFormContext()
  const [showPassword, setShowPassword] = useState(false)
  const { controlId, errorId } = formFieldHtmlIds(name)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot>
          <FormFieldLabel htmlFor={controlId} label={label} isRequired={isRequired} />

          <div className={cn(formControlShellClassName({ hasError: !!error }), className)}>
            <Lock className={formControlInlineIconClassName} aria-hidden />

            <input
              id={controlId}
              type={showPassword ? 'text' : 'password'}
              placeholder={placeholder}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              {...field}
              {...other}
              value={field.value ?? ''}
              onChange={(e) => {
                field.onChange(e.target.value)
                clearErrors(name)
              }}
              className={formControlShellInputClassName}
            />

            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <Eye className={formControlToggleIconClassName} aria-hidden />
              ) : (
                <EyeOff className={formControlToggleIconClassName} aria-hidden />
              )}
            </button>
          </div>

          {error ? (
            <FormFieldError id={errorId} message={error.message ?? ''} />
          ) : hint ? (
            <FormFieldHint message={hint} />
          ) : null}
        </FormFieldRoot>
      )}
    />
  )
}

export default RHFPasswordField
