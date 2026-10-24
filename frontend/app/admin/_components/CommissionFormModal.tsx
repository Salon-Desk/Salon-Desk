'use client'

import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import FormProvider from '@/components/forms/FormProvider'
import RHFDropeDown from '@/components/forms/RHFDropeDown'
import RHFNumberField from '@/components/forms/RHFNumberField'
import RHFTextField from '@/components/forms/RHFTextField'
import { toastColor } from '@/constant/toast-color'
import { zodResolver } from '@/lib/schema/resolver'
import {
  useCreateAdminCommissionMutation,
  useUpdateAdminCommissionMutation,
} from '@/store/api/platformApi'
import type { ApiServiceCategory, PlatformCommission } from '@/types/api-org'

import {
  commissionDefaultValues,
  type CommissionFormData,
  commissionSchema,
} from '../_schemas/commission.schema'

interface CommissionFormModalProps {
  open: boolean
  editing: PlatformCommission | null
  categories: ApiServiceCategory[]
  onClose: () => void
}

export function CommissionFormModal({
  open,
  editing,
  categories,
  onClose,
}: CommissionFormModalProps) {
  const [createCommission, { isLoading: creating }] = useCreateAdminCommissionMutation()
  const [updateCommission, { isLoading: updating }] = useUpdateAdminCommissionMutation()
  const isLoading = creating || updating

  const methods = useForm<CommissionFormData>({
    resolver: zodResolver(commissionSchema),
    defaultValues: commissionDefaultValues,
  })

  const type = useWatch({ control: methods.control, name: 'type' })

  useEffect(() => {
    if (!open) return
    if (editing) {
      methods.reset({
        service_category_id: editing.service_category_id,
        name: editing.name,
        type: (editing.type as CommissionFormData['type']) || 'percentage',
        percentage: editing.percentage != null ? Number(editing.percentage) : null,
        flat: editing.flat != null ? Number(editing.flat) : null,
      })
    } else {
      methods.reset({
        ...commissionDefaultValues,
        service_category_id: categories[0]?.id || '',
      })
    }
  }, [open, editing, categories, methods])

  const onSubmit = async (data: CommissionFormData) => {
    try {
      const body = {
        service_category_id: (data.service_category_id ?? '').trim(),
        name: (data.name ?? '').trim(),
        type: data.type,
        percentage:
          data.type === 'flat' ? null : data.percentage != null ? Number(data.percentage) : null,
        flat: data.type === 'percentage' ? null : data.flat != null ? Number(data.flat) : null,
      }

      if (editing) {
        await updateCommission({
          commissionId: editing.id,
          body: {
            name: body.name,
            type: body.type,
            percentage: body.percentage,
            flat: body.flat,
          },
        }).unwrap()
        toast.success('Commission updated', toastColor.success)
      } else {
        await createCommission(body).unwrap()
        toast.success('Commission created', toastColor.success)
      }
      onClose()
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not save commission'
      toast.error(String(message), toastColor.error)
    }
  }

  if (!open) return null

  return (
    <CustomResponsiveDialog
      open={open}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      header={
        <h3 className="font-bold text-slate-900 text-base">
          {editing ? 'Edit commission' : 'Add commission'}
        </h3>
      }
    >
      <FormProvider
        methods={methods}
        onSubmit={(e) => {
          e?.preventDefault()
          void methods.handleSubmit(onSubmit)(e)
        }}
      >
        <div className="space-y-3">
          <RHFDropeDown
            name="service_category_id"
            label="Service category"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            isRequired
          />
          <RHFTextField name="name" label="Name" isRequired />
          <RHFDropeDown
            name="type"
            label="Type"
            options={[
              { value: 'percentage', label: 'Percentage' },
              { value: 'flat', label: 'Flat fee' },
              { value: 'hybrid', label: 'Hybrid' },
            ]}
            isRequired
          />
          {type === 'percentage' || type === 'hybrid' ? (
            <RHFNumberField name="percentage" label="Percentage (%)" isRequired />
          ) : null}
          {type === 'flat' || type === 'hybrid' ? (
            <RHFNumberField name="flat" label="Flat fee ($)" isRequired />
          ) : null}
          <PrimaryButton
            title={isLoading ? 'Saving…' : 'Save commission'}
            isLoading={isLoading}
            type="submit"
            size="sm"
            fullWidth
            className="h-11 w-full rounded-xl font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
          />
        </div>
      </FormProvider>
    </CustomResponsiveDialog>
  )
}
