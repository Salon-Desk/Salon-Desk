'use client'

import { Check, Loader2, Sparkles, Star } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

import { ANY_AVAILABLE_STYLIST } from '@/lib/data/catalog'
import { shouldUnoptimizedImage } from '@/lib/util/remoteImage'
import { cn } from '@/lib/utils'
import type { StaffMember } from '@/types'

export interface StylistPickerProps {
  stylist: StaffMember
  staffOptions: StaffMember[]
  isLoading?: boolean
  onSelect: (staff: StaffMember) => void
}

export function StylistPicker({ stylist, staffOptions, isLoading, onSelect }: StylistPickerProps) {
  const choices = [ANY_AVAILABLE_STYLIST, ...staffOptions]

  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-200">
      <h2 className="font-serif text-2xl text-stone-950">Who would you like?</h2>
      <p className="mt-1 mb-5 text-sm text-stone-500">
        Choose a stylist, or let the salon assign whoever is free at your time.
      </p>
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-stone-200 bg-stone-50 py-14 text-sm text-stone-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading salon team…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {choices.map((staff) => {
            const selected = stylist.id === staff.id
            const isAny = staff.id === ANY_AVAILABLE_STYLIST.id
            return (
              <button
                key={staff.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(staff)}
                className={cn(
                  'relative flex cursor-pointer items-start gap-3 rounded-3xl border p-4 text-left transition-all active:scale-[0.99]',
                  selected
                    ? 'border-stone-950 bg-white shadow-[0_12px_28px_-16px_rgba(28,25,23,0.45)] ring-1 ring-stone-950'
                    : 'border-stone-200 bg-white hover:border-amber-300 hover:shadow-sm',
                )}
              >
                {staff.avatar ? (
                  <Image
                    src={staff.avatar}
                    alt=""
                    width={52}
                    height={52}
                    unoptimized={shouldUnoptimizedImage(staff.avatar)}
                    className="h-13 w-13 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700">
                    <Sparkles className="h-5 w-5" />
                  </span>
                )}
                <span className="min-w-0 flex-1 pr-6">
                  <span className="block truncate text-sm font-semibold text-stone-950">
                    {isAny ? 'Any available stylist' : staff.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-stone-500">{staff.role}</span>
                  {staff.rating > 0 ? (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-stone-600">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{staff.rating.toFixed(2)}</span>
                      <span className="text-stone-400">({staff.reviewsCount})</span>
                    </span>
                  ) : (
                    <span className="mt-1.5 block text-xs text-emerald-700">Most availability</span>
                  )}
                  {staff.specialties.length > 0 ? (
                    <span className="mt-2 flex flex-wrap gap-1">
                      {staff.specialties.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    'absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
                    selected ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-300',
                  )}
                >
                  {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                </span>
              </button>
            )
          })}
        </div>
      )}
      {!isLoading && staffOptions.length === 0 ? (
        <p className="mt-3 text-xs text-stone-500">
          This salon has not listed individual stylists yet — we will assign the next available
          professional when you book.
        </p>
      ) : null}
    </div>
  )
}
