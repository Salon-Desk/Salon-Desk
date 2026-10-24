'use client'

import { Check, ChevronsUpDown, Loader2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useDebounce } from '@/hooks/use-debounce'
import { staffDisplayName, staffPicture, staffRoleLabel } from '@/lib/util/staff-display'
import { cn } from '@/lib/utils'
import { useGetMyEmployeesQuery } from '@/store/api/orgApi'
import type { User } from '@/types/user'

import { StaffAvatar } from './StaffAvatar'

export const ALL_STAFF_VALUE = 'ALL'

interface StaffPickerProps {
  employees?: User[]
  value: string
  onChange: (employeeId: string, employee?: User) => void
  allowAll?: boolean
  className?: string
}

export function StaffPicker({
  employees = [],
  value,
  onChange,
  allowAll = true,
  className,
}: StaffPickerProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  // Query staff via API with max 25 items and debounced search query
  const { data: apiData, isFetching } = useGetMyEmployeesQuery(
    {
      page: 1,
      page_size: 25,
      q: debouncedSearch.trim() || undefined,
    },
    { skip: !open },
  )

  const isDebouncing = searchTerm.trim() !== debouncedSearch.trim()
  const isSearching = isFetching || isDebouncing

  const employeesList = useMemo(() => {
    if (apiData?.items) {
      return apiData.items
    }
    return employees
  }, [apiData?.items, employees])

  // Find currently selected employee from either search results or initial employees
  const selected = useMemo(() => {
    return (
      employeesList.find((e) => e.id === value) ?? employees.find((e) => e.id === value) ?? null
    )
  }, [employeesList, employees, value])

  const totalCount = apiData?.total ?? employees.length
  const isSearchActive = Boolean(debouncedSearch.trim())
  const showAllOption =
    allowAll && (!isSearchActive || 'all staff'.includes(searchTerm.toLowerCase().trim()))

  const selectedName =
    value === ALL_STAFF_VALUE || !selected
      ? allowAll
        ? `All staff (${totalCount})`
        : 'Select staff'
      : staffDisplayName(selected)

  const selectedPicture = selected ? staffPicture(selected) : null

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSearchTerm('')
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="staff-picker-listbox"
          className={cn(
            'inline-flex h-10 min-w-[12rem] max-w-xs cursor-pointer items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-2.5 text-left text-xs font-medium text-slate-800 transition-all hover:border-amber-300 hover:bg-amber-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20',
            className,
          )}
        >
          {value === ALL_STAFF_VALUE || !selected ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Users className="h-3.5 w-3.5" />
            </span>
          ) : (
            <StaffAvatar
              name={selectedName}
              picture={selectedPicture}
              seed={selected.id}
              size="sm"
            />
          )}
          <span className="min-w-0 flex-1 truncate">{selectedName}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border-slate-200 p-0 shadow-sm shadow-slate-900/5"
      >
        <Command shouldFilter={false}>
          <div className="relative">
            <CommandInput
              value={searchTerm}
              onValueChange={setSearchTerm}
              placeholder="Search staff from directory…"
            />
            {isSearching && (
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
              </div>
            )}
          </div>
          <CommandList id="staff-picker-listbox" className="max-h-72">
            {isSearching && employeesList.length === 0 && (
              <div className="flex items-center justify-center gap-1.5 py-6 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                <span>Searching staff…</span>
              </div>
            )}

            {!isSearching && employeesList.length === 0 && !showAllOption && (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                {isSearchActive ? (
                  <>
                    No staff found matching &ldquo;
                    <span className="font-semibold text-slate-700">{debouncedSearch.trim()}</span>
                    &rdquo;
                  </>
                ) : (
                  <>No staff members found.</>
                )}
              </div>
            )}

            <CommandGroup>
              {showAllOption ? (
                <CommandItem
                  value="all-staff"
                  onSelect={() => {
                    onChange(ALL_STAFF_VALUE)
                    setOpen(false)
                  }}
                  className="gap-2 cursor-pointer"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-slate-900">All staff</div>
                    <div className="truncate text-[11px] text-slate-500">
                      {totalCount} team members
                    </div>
                  </div>
                  <Check
                    className={cn(
                      'h-3.5 w-3.5 text-amber-600',
                      value === ALL_STAFF_VALUE ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ) : null}

              {employeesList.map((employee) => {
                const name = staffDisplayName(employee)
                const picture = staffPicture(employee)
                return (
                  <CommandItem
                    key={employee.id}
                    value={employee.id}
                    onSelect={() => {
                      onChange(employee.id, employee)
                      setOpen(false)
                    }}
                    className="gap-2 cursor-pointer"
                  >
                    <StaffAvatar name={name} picture={picture} seed={employee.id} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-slate-900">{name}</div>
                      <div className="truncate text-[11px] capitalize text-slate-500">
                        {staffRoleLabel(employee.role)}
                        {employee.email ? ` · ${employee.email}` : ''}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        'h-3.5 w-3.5 text-amber-600',
                        value === employee.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>

            {employeesList.length > 0 && totalCount > 25 && (
              <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-1.5 text-center text-[11px] text-slate-400">
                Showing top 25 results · Type to refine search
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
