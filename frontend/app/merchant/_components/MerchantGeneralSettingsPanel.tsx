'use client'

import { Building2, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { PrimaryButton } from '@/components/button'
import { RHFTextArea } from '@/components/forms'
import FormProvider from '@/components/forms/FormProvider'
import RHFAvatarImage from '@/components/forms/RHFAvatarImage'
import RHFTextField from '@/components/forms/RHFTextField'
import { Card } from '@/components/ui'
import useFormSubmitHandler from '@/hooks/formHandler'
import { zodResolver } from '@/lib/schema/resolver'
import {
  useGetMyOrganizationQuery,
  useUpdateMyOrganizationMutation,
  useUploadOrgLogoMutation,
} from '@/store/api/orgApi'
import type { ApiOrganization } from '@/types/api-org'

import {
  salonBrandingDefaultValues,
  type SalonBrandingFormData,
  salonBrandingSchema,
} from '../_schemas/settings.schema'

export function MerchantGeneralSettingsPanel() {
  const { data: org, isLoading: loadingOrg } = useGetMyOrganizationQuery()
  const [updateOrg, { isLoading: savingOrg }] = useUpdateMyOrganizationMutation()
  const [uploadLogo, { isLoading: uploadingLogo }] = useUploadOrgLogoMutation()

  const methods = useForm<SalonBrandingFormData>({
    resolver: zodResolver(salonBrandingSchema),
    defaultValues: salonBrandingDefaultValues,
    mode: 'onBlur',
  })

  useEffect(() => {
    if (org) {
      methods.reset({
        name: org.name || '',
        description: org.description || '',
        logo: org.picture || null,
      })
    }
  }, [org, methods])

  const submitHandler = useFormSubmitHandler<SalonBrandingFormData, ApiOrganization>(
    async (data: SalonBrandingFormData) => {
      if (data.logo instanceof File) {
        const formData = new FormData()
        formData.append('file', data.logo)
        await uploadLogo(formData).unwrap()
      }

      const res = await updateOrg({
        name: data.name.trim(),
        description: data.description?.trim() || '',
      }).unwrap()

      return { data: res }
    },
    () => {
      // RTK Query invalidates tags and refetches automatically
    },
    'Salon profile and branding saved successfully',
  )

  const onSubmit = async (data: SalonBrandingFormData) => {
    await submitHandler(data)
  }

  const isBusy = savingOrg || uploadingLogo

  if (loadingOrg) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
        Loading salon details…
      </div>
    )
  }

  return (
    <FormProvider methods={methods} onSubmit={(e) => void methods.handleSubmit(onSubmit)(e)}>
      <Card padding="lg" className="rounded-2xl border border-slate-200/70 bg-white shadow-none">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Salon Branding &amp; Details</h2>
            <p className="text-xs text-slate-500">
              Manage your verified salon title, public bio, and avatar logo shown in client catalog
              searches.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <div className="flex justify-center pb-2">
            <RHFAvatarImage name="logo" label="Salon Logo" />
          </div>

          <div className="space-y-4">
            <RHFTextField
              name="name"
              label="Salon Name"
              placeholder="e.g. Crown & Blade Atelier"
              isRequired
            />
            <RHFTextArea
              name="description"
              label="Salon Description"
              placeholder="Tell clients about your salon atmosphere, expertise, and signature care..."
              rows={4}
            />
          </div>

          <div className="pt-2">
            <PrimaryButton
              title={isBusy ? 'Saving changes…' : 'Save salon branding'}
              type="submit"
              isLoading={isBusy}
              className="h-10 w-full sm:w-auto"
            />
          </div>
        </div>
      </Card>
    </FormProvider>
  )
}
