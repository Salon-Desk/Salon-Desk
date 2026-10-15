'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import FormProvider from '@/components/forms/FormProvider'
import RHFTextArea from '@/components/forms/RHFTextArea'
import RHFTextField from '@/components/forms/RHFTextField'
import { Modal } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { zodResolver } from '@/lib/schema/resolver'
import {
  useCreateAdminCategoryMutation,
  useUpdateAdminCategoryMutation,
} from '@/store/api/platformApi'
import type { ApiServiceCategory } from '@/types/api-org'

import {
  categoryDefaultValues,
  type CategoryFormData,
  categorySchema,
} from '../_schemas/taxonomy.schema'

interface CategoryFormModalProps {
  open: boolean
  editing: ApiServiceCategory | null
  onClose: () => void
}

export function CategoryFormModal({ open, editing, onClose }: CategoryFormModalProps) {
  const [createCategory, { isLoading: creating }] = useCreateAdminCategoryMutation()
  const [updateCategory, { isLoading: updating }] = useUpdateAdminCategoryMutation()
  const isLoading = creating || updating

  const methods = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: categoryDefaultValues,
  })

  useEffect(() => {
    if (!open) return
    if (editing) {
      methods.reset({
        name: editing.name,
        description: editing.description ?? '',
      })
    } else {
      methods.reset(categoryDefaultValues)
    }
  }, [open, editing, methods])

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editing) {
        await updateCategory({
          categoryId: editing.id,
          body: {
            name: (data.name ?? '').trim(),
            description: data.description?.trim() || null,
          },
        }).unwrap()
        toast.success('Category updated', toastColor.success)
      } else {
        await createCategory({
          name: (data.name ?? '').trim(),
          description: data.description?.trim() || null,
        }).unwrap()
        toast.success('Category created', toastColor.success)
      }
      onClose()
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not save category'
      toast.error(String(message), toastColor.error)
    }
  }

  if (!open) return null

  return (
    <Modal onClose={onClose} size="sm" title={editing ? 'Edit category' : 'Add category'}>
      <FormProvider
        methods={methods}
        onSubmit={(e) => {
          e?.preventDefault()
          void methods.handleSubmit(onSubmit)(e)
        }}
      >
        <div className="space-y-3">
          <RHFTextField name="name" label="Name" isRequired />
          <RHFTextArea name="description" label="Description" isRequired={false} rows={3} />
          <PrimaryButton
            title={isLoading ? 'Saving…' : 'Save category'}
            isLoading={isLoading}
            type="submit"
            size="sm"
            className="h-11 w-full rounded-xl"
          />
        </div>
      </FormProvider>
    </Modal>
  )
}
