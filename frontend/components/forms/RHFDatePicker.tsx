'use client'

import { Controller, useFormContext } from 'react-hook-form'

import { DatePickerField } from '@/components/forms/DatePickerField'
import { formFieldHtmlIds } from '@/components/forms/form-field-parts'

interface DatePickerDisabledProps {
  before?: Date
  after?: Date
  dates?: Date[]
}

interface IProps {
  name: string
  label: string
  isRequired?: boolean
  placeholder?: string
  disabled?: DatePickerDisabledProps
}

const RHFDatePicker = ({
  name,
  label,
  isRequired = true,
  placeholder = 'YYYY-MM-DD',
  disabled,
}: IProps) => {
  const { control, clearErrors } = useFormContext()
  const { controlId } = formFieldHtmlIds(name)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <DatePickerField
          id={controlId}
          label={label}
          value={field.value ?? ''}
          onChange={(v) => {
            field.onChange(v)
            clearErrors(name)
          }}
          isRequired={isRequired}
          placeholder={placeholder}
          disabled={disabled}
          errorMessage={error?.message}
        />
      )}
    />
  )
}

export default RHFDatePicker
