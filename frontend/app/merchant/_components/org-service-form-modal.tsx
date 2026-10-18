'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import FormProvider from '@/components/forms/FormProvider'
import RHFDropeDown from '@/components/forms/RHFDropeDown'
import RHFNumberField from '@/components/forms/RHFNumberField'
import RHFTextArea from '@/components/forms/RHFTextArea'
import RHFTextField from '@/components/forms/RHFTextField'
import { Modal } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { zodResolver } from '@/lib/schema/resolver'
import { useGetCatalogCategoriesQuery } from '@/store/slice/catalogApi'
import {
  useCreateMyServiceMutation,
  useUpdateMyServiceMutation,
} from '@/store/slice/organizationApi'
import type { ApiOrgService } from '@/types/api-org'

import {
  orgServiceDefaultValues,
  type OrgServiceFormData,
  orgServiceSchema,
} from '../_schemas/service.schema'

interface OrgServiceFormModalProps {
  open: boolean
  editing: ApiOrgService | null
  onClose: () => void
}

export function OrgServiceFormModal({ open, editing, onClose }: OrgServiceFormModalProps) {
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCatalogCategoriesQuery()
  const categories = categoriesData?.items ?? []
  const [createService, { isLoading: creating }] = useCreateMyServiceMutation()
  const [updateService, { isLoading: updating }] = useUpdateMyServiceMutation()
  const isLoading = creating || updating

  const methods = useForm<OrgServiceFormData>({
    resolver: zodResolver(orgServiceSchema),
    defaultValues: orgServiceDefaultValues,
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!open) return
    if (editing) {
      methods.reset({
        service_category_id: editing.service_category_id,
        name: editing.name,
        description: editing.description ?? '',
        base_price: Number(editing.base_price),
        duration_minutes: editing.duration_minutes,
        simultaneous_capacity: editing.simultaneous_capacity,
        status: editing.status === 'inactive' ? 'inactive' : 'active',
      })
    } else {
      methods.reset({
        ...orgServiceDefaultValues,
        service_category_id: categories[0]?.id ?? '',
      })
    }
  }, [open, editing, categories, methods])

  const onSubmit = async (data: OrgServiceFormData) => {
    try {
      if (editing) {
        await updateService({
          serviceId: editing.id,
          body: {
            service_category_id: data.service_category_id,
            name: (data.name ?? '').trim(),
            description: data.description?.trim() || null,
            base_price: data.base_price,
            duration_minutes: data.duration_minutes,
            simultaneous_capacity: data.simultaneous_capacity,
            status: data.status,
          },
        }).unwrap()
        toast.success('Service updated', toastColor.success)
      } else {
        await createService({
          service_category_id: data.service_category_id ?? '',
          name: (data.name ?? '').trim(),
          description: data.description?.trim() || null,
          base_price: data.base_price,
          duration_minutes: data.duration_minutes,
          simultaneous_capacity: data.simultaneous_capacity,
        }).unwrap()
        toast.success('Service created', toastColor.success)
      }
      onClose()
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not save service'
      toast.error(String(message), toastColor.error)
    }
  }

  if (!open) return null

  return (
    <Modal
      onClose={onClose}
      size="md"
      title={editing ? `Edit service: ${editing.name}` : 'Add org service'}
    >
      <FormProvider
        methods={methods}
        onSubmit={(e) => {
          e?.preventDefault()
          void methods.handleSubmit(onSubmit)(e)
        }}
      >
        <div className="space-y-3 text-xs">
          <RHFDropeDown
            name="service_category_id"
            label="Category"
            isRequired
            isLoading={categoriesLoading}
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
          />
          <RHFTextField name="name" label="Service name" isRequired />
          <RHFTextArea name="description" label="Description" isRequired={false} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <RHFNumberField name="base_price" label="Base price (USD)" isRequired />
            <RHFNumberField name="duration_minutes" label="Duration (min)" isRequired />
          </div>
          <RHFNumberField name="simultaneous_capacity" label="Simultaneous capacity" isRequired />
          {editing ? (
            <RHFDropeDown
              name="status"
              label="Status"
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
            />
          ) : null}
          <PrimaryButton
            title={isLoading ? 'Saving…' : editing ? 'Save changes' : 'Create service'}
            isLoading={isLoading}
            type="submit"
            size="sm"
            className="mt-1 h-11 w-full rounded-xl"
          />
        </div>
      </FormProvider>
    </Modal>
  )
}
