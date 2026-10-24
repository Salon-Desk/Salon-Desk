import { CheckCircle2, Clock, Compass, Lock, MapPin, ShieldCheck, Wifi, Wine } from 'lucide-react'
import React from 'react'

import { LocationPinDisplay } from '@/components/map'
import type { CatalogOrganization } from '@/types/api-org'

export interface OrgDetailAboutTabProps {
  org: CatalogOrganization
  policy?: {
    org_id: string
    name: string
    free_cancel_hours: number
    no_show_fee_percent: number
    late_cancel_fee_percent?: number | null
    data?: Record<string, unknown>
  } | null
  freeCancelHours: number
}

import { WEEKDAYS } from '@/constant/working-hours'
import { formatTime12, getDayKey, isSalonOpenNow } from '@/lib/util/working-hours'

export function OrgDetailAboutTab({ org, policy, freeCancelHours }: OrgDetailAboutTabProps) {
  const workingHours = org.working_hours
  const currentDayKey = getDayKey(new Date(), org.timezone)
  const { isOpen: isOpenNow } = isSalonOpenNow(workingHours, org.timezone)

  return (
    <section className="space-y-8 pb-16 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8 min-w-0">
          {/* About description */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
            <h2 className="font-serif text-xl font-bold text-stone-950">About {org.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-600 whitespace-pre-line break-words">
              {org.description ||
                `${org.name} is a premier partner salon specializing in contemporary styling, hair wellness, and bespoke beauty treatments. Our team of certified professionals ensures an exceptional, relaxing experience tailored to your unique preferences.`}
            </p>
          </div>

          {/* Amenities & Comfort */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
            <h3 className="font-bold text-stone-950 text-sm mb-4">
              Salon Amenities &amp; Services
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl bg-stone-50 p-3 text-xs text-stone-700">
                <Lock className="h-4 w-4 text-amber-700 shrink-0" />
                <span>$0 Upfront Debit · PayPal Hold</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-stone-50 p-3 text-xs text-stone-700">
                <Wifi className="h-4 w-4 text-stone-600 shrink-0" />
                <span>Complimentary High-Speed Wi-Fi</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-stone-50 p-3 text-xs text-stone-700">
                <Wine className="h-4 w-4 text-stone-600 shrink-0" />
                <span>Refreshments &amp; Herbal Teas</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-stone-50 p-3 text-xs text-stone-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Sanitized Tools &amp; Eco Products</span>
              </div>
            </div>
          </div>

          {/* Cancellation & No Show Policy */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
            <h3 className="font-bold text-stone-950 text-sm mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-700" />
              Cancellation &amp; Settlement Policy
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Appointments booked with {org.name} are safeguarded by PayPal authorization holds.
            </p>
            <ul className="space-y-2 text-xs text-stone-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  <strong>Free Cancellation:</strong> You can cancel up to{' '}
                  <strong>{freeCancelHours} hours</strong> before your appointment time with 0 fees
                  and 100% hold release.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>
                  <strong>No-Show Protection:</strong> Uncancelled no-shows incur an agreed hold
                  capture of {policy?.no_show_fee_percent ?? 50}% to compensate the specialist.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-stone-500 shrink-0" />
                <span>
                  <strong>Transparent Settlement:</strong> When your appointment concludes, the
                  salon marks completed, and your final charge settles automatically.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Sidebar Location & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 lg:col-span-4 min-w-0">
          {/* Location Pin & Map Card */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-stone-950 text-sm flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-amber-700 shrink-0" />
                <span className="truncate">Location Pin &amp; Map</span>
              </h3>
              {org.distance_km !== undefined && org.distance_km !== null && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 shrink-0">
                  {org.distance_km < 1
                    ? `${Math.round(org.distance_km * 1000)} m away`
                    : `${org.distance_km.toFixed(1)} km away`}
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs text-stone-600">
              <div>
                <p className="font-bold text-stone-900">Physical Address</p>
                <p className="mt-0.5 text-stone-500 leading-relaxed break-words">
                  {org.physical_address || 'Address provided upon booking'}
                </p>
              </div>

              {/* Leaflet Map with Salon Location Pin */}
              <div className="pt-1">
                <LocationPinDisplay
                  lat={org.lat}
                  lng={org.lng}
                  salonName={org.name}
                  address={org.physical_address}
                  heightClass="h-44 sm:h-48"
                />
              </div>

              <div className="flex items-start gap-2 pt-1 border-t border-stone-100">
                <Compass className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-stone-900">Timezone</p>
                  <p className="mt-0.5 text-stone-500 truncate">
                    {org.timezone || 'Local Salon Time'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours Card */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="font-bold text-stone-950 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-700 shrink-0" />
                <span>Operating Hours</span>
              </h3>
              {isOpenNow ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Open Now
                </span>
              ) : (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600 shrink-0">
                  Closed Now
                </span>
              )}
            </div>

            {workingHours ? (
              <div className="divide-y divide-stone-100 text-xs">
                {WEEKDAYS.map(({ key, label }) => {
                  const windows = workingHours[key] || []
                  const isTodayKey = key === currentDayKey

                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between gap-2 py-2 transition-colors ${
                        isTodayKey ? 'font-bold text-amber-800' : 'text-stone-600'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 shrink-0">
                        {label}
                        {isTodayKey && (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800">
                            Today
                          </span>
                        )}
                      </span>
                      <span className="text-right truncate">
                        {windows.length > 0
                          ? windows
                              .map(([s, e]) => `${formatTime12(s)} – ${formatTime12(e)}`)
                              .join(', ')
                          : 'Closed'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic">
                Operating hours schedule available during appointment checkout.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
