'use client'

import { Minus, Plus } from 'lucide-react'
import Image from 'next/image'
import { Controller, useFormContext } from 'react-hook-form'

import {
  formControlCounterButtonMinusClassName,
  formControlCounterButtonPlusClassName,
  formControlCounterControlsClassName,
  formControlCounterRowClassName,
  formControlCounterValueClassName,
  FormFieldError,
  formFieldHtmlIds,
  FormFieldRoot,
} from '@/components/forms/form-field-parts'
import { resolveImageSrc } from '@/lib/util/remoteImage'

interface RHFPeopleCounterProps {
  name: string
  label: string
  description: string
  icon: string
  min?: number
  max?: number
}

const RHFPeopleCounter = ({
  name,
  label,
  description,
  icon,
  min = 0,
  max = 20,
}: RHFPeopleCounterProps) => {
  const { control, clearErrors } = useFormContext()
  const { errorId } = formFieldHtmlIds(name)

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={0}
      render={({ field, fieldState: { error } }) => {
        const value = field.value ?? 0

        const increase = () => {
          if (value < max) {
            field.onChange(value + 1)
            clearErrors(name)
          }
        }

        const decrease = () => {
          if (value > min) {
            field.onChange(value - 1)
            clearErrors(name)
          }
        }

        return (
          <FormFieldRoot className="min-w-0 flex-1 sm:min-w-[220px]">
            <div
              className={formControlCounterRowClassName}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            >
              <div className="flex min-w-0 flex-row items-center gap-2">
                <Image
                  src={resolveImageSrc(icon)}
                  alt={label}
                  width={32}
                  height={32}
                  className="size-8 shrink-0 sm:size-10"
                />

                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-xs font-bold text-foreground sm:text-sm">{label}</p>
                  <p className="truncate text-xs font-bold text-muted-foreground sm:text-sm">
                    {description}
                  </p>
                </div>
              </div>

              <div className={formControlCounterControlsClassName}>
                <button
                  type="button"
                  className={formControlCounterButtonMinusClassName}
                  onClick={decrease}
                >
                  <Minus className="size-3.5 sm:size-4" aria-hidden />
                </button>

                <p className={formControlCounterValueClassName}>{value}</p>

                <button
                  type="button"
                  className={formControlCounterButtonPlusClassName}
                  onClick={increase}
                >
                  <Plus className="size-3.5 sm:size-4" aria-hidden />
                </button>
              </div>
            </div>

            {error?.message ? (
              <FormFieldError id={errorId} message={String(error.message)} />
            ) : null}
          </FormFieldRoot>
        )
      }}
    />
  )
}

export default RHFPeopleCounter
