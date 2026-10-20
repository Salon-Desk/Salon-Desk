'use client'

import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import FormProvider from '@/components/forms/FormProvider'
import RHFAvatarImage from '@/components/forms/RHFAvatarImage'
import RHFSelect from '@/components/forms/RHFSelect'
import RHFTextField from '@/components/forms/RHFTextField'
import { Card } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import {
  useGetMyOrganizationQuery,
  useGetMyOrgSettingsQuery,
  useUpdateMyOrganizationMutation,
  useUpdateMyOrgSettingsMutation,
  useUploadOrgLogoMutation,
} from '@/store/api/orgApi'

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (Eastern Time)' },
  { value: 'America/Chicago', label: 'America/Chicago (Central Time)' },
  { value: 'America/Denver', label: 'America/Denver (Mountain Time)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time)' },
  { value: 'America/Anchorage', label: 'America/Anchorage (Alaska Time)' },
  { value: 'Pacific/Honolulu', label: 'Pacific/Honolulu (Hawaii Time)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
]

interface OrgSettingsForm {
  name: string
  description: string
  timezone: string
  physical_address: string
  logo: unknown
}

export function MerchantOrgSettingsPanel() {
  const { data: org, isLoading: loadingOrg } = useGetMyOrganizationQuery()
  const { data: settings, isLoading: loadingSettings } = useGetMyOrgSettingsQuery()
  const [updateOrg, { isLoading: savingOrg }] = useUpdateMyOrganizationMutation()
  const [updateSettings, { isLoading: savingSettings }] = useUpdateMyOrgSettingsMutation()
  const [uploadLogo, { isLoading: uploadingLogo }] = useUploadOrgLogoMutation()

  const methods = useForm<OrgSettingsForm>({
    values: {
      name: org?.name || '',
      description: org?.description || '',
      timezone: settings?.timezone || 'UTC',
      physical_address: settings?.physical_address || '',
      logo: org?.picture || null,
    },
  })

  const onSubmit = async (data: OrgSettingsForm) => {
    try {
      if (data.logo instanceof File) {
        const formData = new FormData()
        formData.append('file', data.logo)
        await uploadLogo(formData).unwrap()
      }

      await Promise.all([
        updateOrg({
          name: data.name,
          description: data.description,
        }).unwrap(),
        updateSettings({
          timezone: data.timezone,
          physical_address: data.physical_address,
        }).unwrap(),
      ])

      toast.success('Salon profile and settings saved', toastColor.success)
    } catch (err) {
      toast.error(
        String((err as { data?: { detail?: string } })?.data?.detail || 'Update failed'),
        toastColor.error,
      )
    }
  }

  const isBusy = savingOrg || savingSettings || uploadingLogo

  if (loadingOrg || loadingSettings) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
        Loading organization settings…
      </div>
    )
  }

  return (
    <Card
      padding="lg"
      className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
    >
      <h2 className="font-bold text-slate-900 text-sm">Salon Branding &amp; Details</h2>
      <p className="mt-1 text-xs text-slate-500">
        Manage your salon logo, name, operating timezone, and physical location displayed to
        clients.
      </p>

      <FormProvider methods={methods} onSubmit={(e) => void methods.handleSubmit(onSubmit)(e)}>
        <div className="mt-5 space-y-5">
          <div className="flex justify-center pb-2">
            <RHFAvatarImage name="logo" label="Salon Logo" />
          </div>

          <div className="space-y-4">
            <RHFTextField name="name" label="Salon name" isRequired />
            <RHFTextField name="description" label="Description" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RHFSelect name="timezone" label="Timezone" options={TIMEZONES} isRequired />
              <RHFTextField name="physical_address" label="Physical address" isRequired />
            </div>
          </div>

          <PrimaryButton
            title={isBusy ? 'Saving…' : 'Save settings'}
            type="submit"
            isLoading={isBusy}
            className="h-10 w-full sm:w-auto"
          />
        </div>
      </FormProvider>
    </Card>
  )
}
