'use client'

import { Globe, Hash, Mail, Phone, User } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'

import {
  formControlInputClassName,
  formControlLeftIconClassName,
  FormFieldError,
  formFieldHtmlIds,
  FormFieldLabel,
  FormFieldRoot,
} from '@/components/forms/form-field-parts'

interface RHFTextFieldProps {
  name: string
  label: string
  isRequired?: boolean
  showRequiredMarker?: boolean
  showOptionalHint?: boolean
  labelClassName?: string
  leftIcon?: 'mail' | 'user' | 'phone' | 'globe' | 'hash'
  type?: React.HTMLInputTypeAttribute
}

type CombinedProps = RHFTextFieldProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

const iconMap = {
  mail: Mail,
  user: User,
  phone: Phone,
  globe: Globe,
  hash: Hash,
}

const RHFTextField = ({
  name,
  label,
  isRequired = true,
  showRequiredMarker = true,
  showOptionalHint = true,
  labelClassName,
  leftIcon,
  type = 'text',
  className,
  ...other
}: CombinedProps) => {
  const { control, clearErrors } = useFormContext()
  const Icon = leftIcon ? iconMap[leftIcon] : null
  const hasIcon = !!Icon
  const { controlId, errorId } = formFieldHtmlIds(name)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          let value: string | number = e.target.value
          if (type === 'number') {
            value = e.target.value ? parseFloat(e.target.value) : ''
          }
          field.onChange(value)
          clearErrors(name)
        }

        return (
          <FormFieldRoot>
            {label ? (
              <FormFieldLabel
                htmlFor={controlId}
                label={label}
                isRequired={isRequired}
                showRequiredMarker={showRequiredMarker}
                showOptionalHint={showOptionalHint}
                className={labelClassName}
              />
            ) : null}

            <div className="relative w-full">
              {hasIcon && Icon && <Icon className={formControlLeftIconClassName} aria-hidden />}

              <input
                id={controlId}
                type={type}
                placeholder={other.placeholder}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                {...field}
                value={field.value ?? ''}
                onChange={handleChange}
                className={formControlInputClassName({
                  hasError: !!error,
                  hasLeftIcon: hasIcon,
                  className,
                })}
                {...other}
              />
            </div>

            {error ? <FormFieldError id={errorId} message={error.message ?? ''} /> : null}
          </FormFieldRoot>
        )
      }}
    />
  )
}

export default RHFTextField
