'use client'

import { Clock, Globe2, Loader2, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { PrimaryButton } from '@/components/button'
import FormProvider from '@/components/forms/FormProvider'
import RHFSelect from '@/components/forms/RHFSelect'
import RHFTextField from '@/components/forms/RHFTextField'
import { LocationPinPicker } from '@/components/map'
import { Card } from '@/components/ui'
import { TIMEZONES } from '@/constant/timezones'
import { DEFAULT_WORKING_HOURS } from '@/constant/working-hours'
import useFormSubmitHandler from '@/hooks/formHandler'
import { zodResolver } from '@/lib/schema/resolver'
import { formatCurrentTimeInZone } from '@/lib/util/working-hours'
import { useGetMyOrgSettingsQuery, useUpdateMyOrgSettingsMutation } from '@/store/api/orgApi'
import type { ApiOrgSettings, WorkingHoursMap } from '@/types/api-org'

import {
  salonLocationHoursDefaultValues,
  type SalonLocationHoursFormData,
  salonLocationHoursSchema,
} from '../_schemas/settings.schema'
import { WorkingHoursEditor } from './WorkingHoursEditor'

export function MerchantLocationHoursPanel() {
  const { data: settings, isLoading: loadingSettings } = useGetMyOrgSettingsQuery()
  const [updateSettings, { isLoading: savingSettings }] = useUpdateMyOrgSettingsMutation()

  const methods = useForm<SalonLocationHoursFormData>({
    resolver: zodResolver(salonLocationHoursSchema),
    defaultValues: salonLocationHoursDefaultValues,
    mode: 'onBlur',
  })

  // Sync settings once loaded
  useEffect(() => {
    if (settings) {
      methods.reset({
        timezone: settings.timezone || 'America/New_York',
        physical_address: settings.physical_address || '',
        lat: settings.lat !== undefined && settings.lat !== null ? Number(settings.lat) : null,
        lng: settings.lng !== undefined && settings.lng !== null ? Number(settings.lng) : null,
        working_hours:
          settings.working_hours && typeof settings.working_hours === 'object'
            ? (settings.working_hours as WorkingHoursMap)
            : DEFAULT_WORKING_HOURS,
      })
    }
  }, [settings, methods])

  const submitHandler = useFormSubmitHandler<SalonLocationHoursFormData, ApiOrgSettings>(
    async (data: SalonLocationHoursFormData) => {
      const res = await updateSettings({
        timezone: data.timezone,
        physical_address: data.physical_address.trim(),
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        working_hours: data.working_hours as WorkingHoursMap,
      }).unwrap()

      return { data: res }
    },
    () => {
      // RTK Query invalidates tags and refetches data automatically
    },
    'Salon timezone, location pin, and weekly schedule saved',
  )

  const onSubmit = async (data: SalonLocationHoursFormData) => {
    await submitHandler(data)
  }

  const formLat = methods.watch('lat')
  const formLng = methods.watch('lng')
  const formAddress = methods.watch('physical_address')
  const formTimezone = methods.watch('timezone')
  const formWorkingHours = methods.watch('working_hours') as WorkingHoursMap

  const [currentTimeInZone, setCurrentTimeInZone] = useState('')

  useEffect(() => {
    setCurrentTimeInZone(formatCurrentTimeInZone(formTimezone))
    const interval = setInterval(() => {
      setCurrentTimeInZone(formatCurrentTimeInZone(formTimezone))
    }, 15000)
    return () => clearInterval(interval)
  }, [formTimezone])

  if (loadingSettings) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
        Loading operating hours and location settings…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FormProvider methods={methods} onSubmit={(e) => void methods.handleSubmit(onSubmit)(e)}>
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          {/* Card 1: Salon Location & Map Pin */}
          <Card
            padding="lg"
            className="rounded-2xl border border-slate-200/70 bg-white shadow-none lg:col-span-5"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Location Pin &amp; Address</h2>
                <p className="text-xs text-slate-500">
                  Set your exact street address and interactive map pin. This enables nearby
                  discovery and one-click GPS navigation for your clients.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <RHFTextField
                name="physical_address"
                label="Physical Street Address"
                placeholder="e.g. 123 Fashion Blvd, Suite 400, New York, NY 10001"
                isRequired
              />

              <div className="pt-1">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Interactive Salon Pin
                </label>
                <LocationPinPicker
                  lat={formLat}
                  lng={formLng}
                  address={formAddress}
                  disabled={savingSettings}
                  onChange={(newCoords) => {
                    methods.setValue('lat', newCoords.lat, { shouldDirty: true })
                    methods.setValue('lng', newCoords.lng, { shouldDirty: true })
                    if (newCoords.address && !formAddress) {
                      methods.setValue('physical_address', newCoords.address, { shouldDirty: true })
                    }
                  }}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <PrimaryButton
                  title={savingSettings ? 'Saving location…' : 'Save location'}
                  type="submit"
                  isLoading={savingSettings}
                  className="h-10 w-full sm:w-auto"
                />
              </div>
            </div>
          </Card>

          {/* Card 2: Operating Timezone & Weekly Working Hours */}
          <Card
            padding="lg"
            className="rounded-2xl border border-slate-200/70 bg-white shadow-none lg:col-span-7"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  Timezone &amp; Weekly Operating Hours
                </h2>
                <p className="text-xs text-slate-500">
                  Configure your salon&apos;s IANA timezone and open windows. Non-working windows
                  prevent client bookings and sync with staff shifts.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {/* Operating Timezone with live clock indicator */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 max-w-sm">
                  <RHFSelect
                    name="timezone"
                    label="Operating Timezone"
                    options={TIMEZONES}
                    isRequired
                  />
                </div>

                <div className="flex items-center gap-2.5 rounded-lg border border-slate-200/90 bg-white px-3 py-2 shadow-2xs shrink-0 sm:self-end sm:mb-0.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                    <Globe2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
                      Current Salon Time
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {currentTimeInZone || 'Loading time…'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <WorkingHoursEditor
                  value={formWorkingHours}
                  disabled={savingSettings}
                  onChange={(hours) => {
                    methods.setValue('working_hours', hours, { shouldDirty: true })
                  }}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <PrimaryButton
                  title={savingSettings ? 'Saving location & hours…' : 'Save hours & location'}
                  type="submit"
                  isLoading={savingSettings}
                  className="h-10 w-full sm:w-auto"
                />
              </div>
            </div>
          </Card>
        </div>
      </FormProvider>
    </div>
  )
}
