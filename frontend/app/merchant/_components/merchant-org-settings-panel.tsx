'use client'

import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import FormProvider from '@/components/forms/FormProvider'
import RHFTextField from '@/components/forms/RHFTextField'
import { Card } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import {
  useGetMyOrgSettingsQuery,
  useUpdateMyOrgSettingsMutation,
} from '@/store/slice/organizationApi'

interface OrgSettingsForm {
  timezone: string
  physical_address: string
}

export function MerchantOrgSettingsPanel() {
  const { data: settings, isLoading } = useGetMyOrgSettingsQuery()
  const [updateSettings, { isLoading: saving }] = useUpdateMyOrgSettingsMutation()

  const methods = useForm<OrgSettingsForm>({
    values: {
      timezone: settings?.timezone || 'UTC',
      physical_address: settings?.physical_address || '',
    },
  })

  const onSubmit = async (data: OrgSettingsForm) => {
    try {
      await updateSettings({
        timezone: data.timezone,
        physical_address: data.physical_address,
      }).unwrap()
      toast.success('Organization settings saved', toastColor.success)
    } catch (err) {
      toast.error(
        String((err as { data?: { detail?: string } })?.data?.detail || 'Update failed'),
        toastColor.error,
      )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
        Loading organization settings…
      </div>
    )
  }

  return (
    <Card padding="lg" className="rounded-3xl border border-slate-200/90 bg-white shadow-xs">
      <h2 className="font-bold text-slate-900 text-sm">Salon location &amp; timezone</h2>
      <p className="mt-1 text-xs text-slate-500">
        Used for calendar availability and client-facing salon profile.
      </p>
      <FormProvider methods={methods} onSubmit={(e) => void methods.handleSubmit(onSubmit)(e)}>
        <div className="mt-4 space-y-4">
          <RHFTextField name="timezone" label="Timezone (IANA)" isRequired />
          <RHFTextField name="physical_address" label="Physical address" isRequired />
          <PrimaryButton title="Save settings" type="submit" isLoading={saving} className="h-10" />
        </div>
      </FormProvider>
    </Card>
  )
}
