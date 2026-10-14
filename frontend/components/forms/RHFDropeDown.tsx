'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import {
  formControlChevronClassName,
  formControlComboboxTriggerClassName,
  formControlCommandEmptyClassName,
  formControlCommandInputClassName,
  formControlCommandItemClassName,
  formControlDropdownContentClassName,
  FormFieldError,
  formFieldHtmlIds,
  FormFieldLabel,
  FormFieldRoot,
} from '@/components/forms/form-field-parts'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import LoadingSpinner from '../loader/LoadingSpinner'

interface Options {
  value: string
  label: string
  slug?: string
}

interface RHFDropeDownProps {
  name: string
  namedName?: string
  label: string
  options: Options[]
  isLoading?: boolean
  isSearchable?: boolean
  onNamedNameChange?: (namedName: string) => void
  onChange?: (value: string | { id: string; name: string; slug?: string }) => void
  isRequired?: boolean
  isObject?: boolean
  isOptionalCaptionVisible?: boolean
  isRequiredAstrictCaptionVisible?: boolean
  className?: string
  showLabel?: boolean
  disabled?: boolean
}

const RHFDropeDown: React.FC<RHFDropeDownProps> = ({
  name,
  namedName,
  label,
  options,
  isRequired = true,
  isLoading = false,
  isObject = false,
  isSearchable = options?.length > 10,
  isOptionalCaptionVisible = true,
  isRequiredAstrictCaptionVisible = true,
  className,
  onChange,
  onNamedNameChange,
  showLabel = true,
  disabled = false,
}) => {
  const { control, setValue, clearErrors, watch } = useFormContext()
  const selectedValue = watch(name)
  const [, setSelectedLabel] = useState<string | undefined>(namedName)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [inputWidth, setInputWidth] = useState<number | undefined>(undefined)
  const inputRef = useRef<HTMLButtonElement>(null)
  const { controlId, errorId } = formFieldHtmlIds(name)

  const handleSelect = (value: string, optLabel: string, slug?: string) => {
    if (disabled) {
      return
    }

    if (onChange) {
      onChange(isObject ? { id: value, name: optLabel, slug } : value)
    }

    setValue(name, isObject ? { id: value, name: optLabel, slug } : value)
    clearErrors(name)
    setSelectedLabel(optLabel)

    if (namedName) {
      setValue(namedName, optLabel)
    }
    onNamedNameChange?.(optLabel)

    setPopoverOpen(false)
  }

  useEffect(() => {
    const updateWidth = () => inputRef.current && setInputWidth(inputRef.current.offsetWidth)
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const displayValue = isObject
    ? (selectedValue?.name ?? '')
    : (options.find((option) => option.value === selectedValue)?.label ?? selectedValue ?? '')

  return (
    <Controller
      name={name}
      control={control}
      render={({ fieldState: { error } }) => (
        <FormFieldRoot className={cn('w-full', className)}>
          {label && showLabel ? (
            <FormFieldLabel
              htmlFor={controlId}
              label={label}
              isRequired={isRequired}
              showRequiredMarker={isRequired ? isRequiredAstrictCaptionVisible : false}
              showOptionalHint={!isRequired ? isOptionalCaptionVisible : false}
            />
          ) : null}

          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                ref={inputRef}
                id={controlId}
                role="combobox"
                type="button"
                disabled={disabled}
                aria-expanded={popoverOpen}
                aria-controls={`${controlId}-listbox`}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className={formControlComboboxTriggerClassName({
                  hasError: !!error,
                  disabled,
                })}
              >
                {displayValue || `Select ${showLabel ? label : ''}`}

                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                  {!popoverOpen ? (
                    <ChevronDown
                      className={cn(formControlChevronClassName, 'text-primary')}
                      aria-hidden
                    />
                  ) : (
                    <ChevronUp
                      className={cn(formControlChevronClassName, 'text-primary')}
                      aria-hidden
                    />
                  )}
                </span>
              </button>
            </PopoverTrigger>

            <PopoverContent
              className={formControlDropdownContentClassName}
              style={{ width: inputWidth }}
            >
              <Command>
                {isSearchable && (
                  <CommandInput
                    placeholder={`Search ${label.toLowerCase()}...`}
                    className={formControlCommandInputClassName}
                    disabled={disabled}
                  />
                )}
                <CommandList className="bg-popover">
                  {isLoading ? (
                    <CommandEmpty>
                      <LoadingSpinner />
                    </CommandEmpty>
                  ) : options?.length === 0 ? (
                    <CommandEmpty className={formControlCommandEmptyClassName}>
                      No {label.toLowerCase()} found.
                    </CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {options?.map((role) => (
                        <CommandItem
                          key={role.value}
                          onSelect={() => handleSelect(role.value, role.label, role.slug)}
                          className={cn(
                            formControlCommandItemClassName,
                            watch(name)?.id === role?.value || watch(name) === role?.value
                              ? 'border-l-2 border-primary'
                              : '',
                          )}
                        >
                          {role.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {error ? <FormFieldError id={errorId} message={error.message ?? ''} /> : null}
        </FormFieldRoot>
      )}
    />
  )
}

export default RHFDropeDown
