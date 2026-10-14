'use client'

import { CheckCircle, Circle } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'

import {
  formControlListOptionClassName,
  FormFieldError,
  formFieldHtmlIds,
  FormFieldLabel,
  FormFieldRoot,
} from '@/components/forms/form-field-parts'

interface Option {
  label: string
  value: string | number
  subtitle?: string
}

interface Props {
  name: string
  label: string
  options: Option[]
  isRequired?: boolean
}

const RHFSelectCardGroupVertical = ({ name, label, options, isRequired = true }: Props) => {
  const { control } = useFormContext()
  const { errorId } = formFieldHtmlIds(name)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormFieldRoot className="w-full space-y-2">
          {label ? <FormFieldLabel label={label} isRequired={isRequired} /> : null}

          <div
            className="no-scrollbar grid max-h-72 grid-cols-1 gap-2 overflow-y-auto py-1 sm:max-h-80 sm:gap-3 lg:grid-cols-2"
            aria-describedby={error ? errorId : undefined}
          >
            {options.map((opt) => {
              const selected = field.value === opt.value

              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => field.onChange(opt.value)}
                  className={formControlListOptionClassName(selected)}
                >
                  {selected ? (
                    <CheckCircle
                      className="size-5 shrink-0 rounded-full bg-primary text-primary-foreground"
                      aria-hidden
                    />
                  ) : (
                    <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  )}

                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-normal text-foreground sm:text-base">
                      {opt.label}
                    </span>

                    {opt.subtitle ? (
                      <span className="mt-1 text-xs leading-snug text-muted-foreground">
                        {opt.subtitle}
                      </span>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>

          {error ? <FormFieldError id={errorId} message={error.message ?? ''} /> : null}
        </FormFieldRoot>
      )}
    />
  )
}

export default RHFSelectCardGroupVertical
