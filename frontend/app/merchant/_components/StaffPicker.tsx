'use client'

import { Check, ChevronsUpDown, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { staffDisplayName, staffPicture, staffRoleLabel } from '@/lib/util/staff-display'
import { cn } from '@/lib/utils'
import type { User } from '@/types/user'

import { StaffAvatar } from './StaffAvatar'

export const ALL_STAFF_VALUE = 'ALL'

interface StaffPickerProps {
  employees: User[]
  value: string
  onChange: (employeeId: string) => void
  allowAll?: boolean
  className?: string
}

export function StaffPicker({
  employees,
  value,
  onChange,
  allowAll = true,
  className,
}: StaffPickerProps) {
  const [open, setOpen] = useState(false)

  const selected = useMemo(() => employees.find((e) => e.id === value) ?? null, [employees, value])

  const selectedName =
    value === ALL_STAFF_VALUE || !selected
      ? allowAll
        ? `All staff (${employees.length})`
        : 'Select staff'
      : staffDisplayName(selected)

  const selectedPicture = selected ? staffPicture(selected) : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="staff-picker-listbox"
          className={cn(
            'inline-flex h-10 min-w-[12rem] max-w-xs items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-2.5 text-left text-xs font-medium text-slate-800 transition-all hover:border-amber-300 hover:bg-amber-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20',
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
        <Command>
          <CommandInput placeholder="Search staff…" />
          <CommandList id="staff-picker-listbox" className="max-h-72">
            <CommandEmpty>No staff found.</CommandEmpty>
            <CommandGroup>
              {allowAll ? (
                <CommandItem
                  value="all-staff"
                  onSelect={() => {
                    onChange(ALL_STAFF_VALUE)
                    setOpen(false)
                  }}
                  className="gap-2"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Users className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-slate-900">All staff</div>
                    <div className="truncate text-[11px] text-slate-500">
                      {employees.length} team members
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

              {employees.map((employee) => {
                const name = staffDisplayName(employee)
                const picture = staffPicture(employee)
                return (
                  <CommandItem
                    key={employee.id}
                    value={`${name} ${employee.email} ${employee.role}`}
                    onSelect={() => {
                      onChange(employee.id)
                      setOpen(false)
                    }}
                    className="gap-2"
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
