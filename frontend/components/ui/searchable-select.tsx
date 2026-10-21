'use client'

import { Check, ChevronDown } from 'lucide-react'
import type React from 'react'
import { useId, useMemo, useState } from 'react'

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

export interface SearchableSelectOption {
  value: string
  label: string
  description?: string
  badge?: string
}

export interface SearchableSelectProps {
  value?: string | null
  onChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
  leftIcon?: React.ReactNode
  allowClear?: boolean
  clearLabel?: string
  'aria-label'?: string
  /** When set, search is driven by the server (`shouldFilter={false}` on the command list). */
  onSearchChange?: (query: string) => void
  hasMore?: boolean
  onLoadMore?: () => void
  loadMoreLabel?: string
  isLoadingMore?: boolean
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No options found.',
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  leftIcon,
  allowClear = false,
  clearLabel = 'All Options',
  'aria-label': ariaLabel,
  onSearchChange,
  hasMore = false,
  onLoadMore,
  loadMoreLabel = 'Load more…',
  isLoadingMore = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const id = useId()
  const serverSideSearch = Boolean(onSearchChange)

  const selectedOption = useMemo(() => options.find((opt) => opt.value === value), [options, value])

  const displayText = selectedOption?.label || (allowClear && !value ? clearLabel : placeholder)

  const handleSelect = (nextValue: string) => {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div className={cn('relative w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type="button"
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-listbox`}
            aria-label={ariaLabel || placeholder}
            disabled={disabled}
            className={cn(
              'flex w-full items-center justify-between gap-2 text-left transition-colors focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
              triggerClassName ||
                'rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 hover:border-slate-300 focus:border-amber-500',
            )}
          >
            <div className="flex min-w-0 items-center gap-2 flex-1">
              {leftIcon && <span className="shrink-0">{leftIcon}</span>}
              <span className="truncate">{displayText}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={4}
          className={cn(
            'w-[min(calc(100vw-1.5rem),20rem)] p-0 shadow-lg border border-slate-200 bg-white rounded-xl overflow-hidden z-50',
            contentClassName,
          )}
        >
          <Command className="w-full" shouldFilter={!serverSideSearch}>
            <CommandInput
              placeholder={searchPlaceholder}
              className="text-xs h-9"
              value={serverSideSearch ? search : undefined}
              onValueChange={(next) => {
                if (serverSideSearch) {
                  setSearch(next)
                  onSearchChange?.(next)
                }
              }}
            />
            <CommandList className="max-h-60 overflow-y-auto p-1">
              <CommandEmpty className="p-3 text-center text-xs text-slate-400">
                {emptyText}
              </CommandEmpty>

              <CommandGroup>
                {allowClear && (
                  <CommandItem
                    value={`clear-all-empty-choice ${clearLabel}`}
                    onSelect={() => handleSelect('')}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 data-[selected=true]:bg-slate-100"
                  >
                    <span className="font-medium text-slate-900">{clearLabel}</span>
                    {!value && <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 ml-2" />}
                  </CommandItem>
                )}

                {options.map((option) => {
                  const isSelected = option.value === value
                  // Search against both label, description, and badge
                  const searchKeywords = `${option.label} ${option.description || ''} ${
                    option.badge || ''
                  }`

                  return (
                    <CommandItem
                      key={option.value}
                      value={searchKeywords}
                      onSelect={() => handleSelect(option.value)}
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-slate-100 data-[selected=true]:bg-slate-100',
                        isSelected ? 'bg-amber-50/70 text-amber-950 font-medium' : 'text-slate-700',
                      )}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{option.label}</span>
                          {option.badge && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0 text-[10px] font-bold text-amber-800 shrink-0">
                              {option.badge}
                            </span>
                          )}
                        </div>
                        {option.description && (
                          <p className="truncate text-[10px] text-slate-400 mt-0.5">
                            {option.description}
                          </p>
                        )}
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 ml-1" />}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              {hasMore && onLoadMore ? (
                <div className="border-t border-slate-100 p-1.5">
                  <button
                    type="button"
                    disabled={isLoadingMore}
                    onClick={() => onLoadMore()}
                    className="w-full rounded-lg py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                  >
                    {isLoadingMore ? 'Loading…' : loadMoreLabel}
                  </button>
                </div>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
