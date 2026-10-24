'use client'

import { Star, User } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import type { CatalogStaffMember } from '@/types/api-feedback'
import type { CatalogService } from '@/types/api-org'

export interface OrgDetailStaffTabProps {
  staff: CatalogStaffMember[]
  staffLoading: boolean
  services: CatalogService[]
  onBookService: (serviceId: string, stylistId?: string) => void
  onSwitchToServicesTab: () => void
}

export function OrgDetailStaffTab({
  staff,
  staffLoading,
  services,
  onBookService,
  onSwitchToServicesTab,
}: OrgDetailStaffTabProps) {
  return (
    <section className="space-y-6 pb-16 animate-in fade-in duration-200">
      <div>
        <h2 className="font-serif text-xl font-bold text-stone-950">Meet the Team</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Licensed stylists and beauty artisans dedicated to your personal care.
        </p>
      </div>

      {staffLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-3xl bg-stone-200/60 animate-pulse" />
          ))}
        </div>
      ) : staff.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-200 bg-white p-12 text-center text-xs text-stone-400">
          Staff directory will be displayed here soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <div
              key={member.id}
              className="flex flex-col justify-between rounded-3xl border border-stone-200 bg-white p-5 shadow-2xs"
            >
              <div className="flex items-start gap-4">
                {member.picture ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-2xs">
                    <Image
                      src={member.picture}
                      alt={member.display_name}
                      fill
                      unoptimized={shouldUnoptimizeImage(member.picture)}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                    <User className="h-8 w-8" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-stone-950 text-sm truncate">
                    {member.display_name}
                  </h3>
                  <p className="text-xs font-medium text-stone-500">{member.role}</p>
                  {member.rating_avg > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-700">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{member.rating_avg.toFixed(1)}</span>
                      <span className="font-normal text-stone-400">
                        ({member.review_count} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {member.specialties && member.specialties.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {member.specialties.map((spec: string) => (
                    <span
                      key={spec}
                      className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-semibold text-stone-600"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 border-t border-stone-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (services.length > 0) {
                      onBookService(services[0].id, member.id)
                    } else {
                      onSwitchToServicesTab()
                    }
                  }}
                  className="inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-full border border-stone-200/80 bg-stone-100 px-4 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-200 hover:text-stone-950 active:scale-[0.98]"
                >
                  Book with {member.display_name.split(' ')[0]}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
