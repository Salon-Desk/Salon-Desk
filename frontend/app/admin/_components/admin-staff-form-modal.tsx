'use client'

import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import FormProvider from '@/components/forms/FormProvider'
import RHFEmailField from '@/components/forms/RHFEmailField'
import RHFPasswordField from '@/components/forms/RHFPasswordField'
import RHFPhoneField from '@/components/forms/RHFPhoneField'
import RHFTextField from '@/components/forms/RHFTextField'
import { Modal } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { zodResolver } from '@/lib/schema/resolver'
import { useCreateAdminStaffMutation } from '@/store/api/platformApi'

import {
  adminStaffDefaultValues,
  type AdminStaffFormData,
  adminStaffSchema,
} from '../_schemas/staff.schema'

interface AdminStaffFormModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (email: string) => void
}

export function AdminStaffFormModal({ open, onClose, onCreated }: AdminStaffFormModalProps) {
  const [createStaff, { isLoading }] = useCreateAdminStaffMutation()
  const methods = useForm<AdminStaffFormData>({
    resolver: zodResolver(adminStaffSchema),
    defaultValues: adminStaffDefaultValues,
  })

  const onSubmit = async (data: AdminStaffFormData) => {
    try {
      const email = (data.email ?? '').trim()
      await createStaff({
        email,
        password: data.password ?? '',
        first_name: (data.first_name ?? '').trim(),
        last_name: (data.last_name ?? '').trim(),
        middle_name: data.middle_name?.trim() || null,
        phone: data.phone?.trim() || null,
      }).unwrap()
      toast.success('Platform staff invited', toastColor.success)
      methods.reset(adminStaffDefaultValues)
      onCreated?.(email)
      onClose()
    } catch (err) {
      toast.error(
        String((err as { data?: { detail?: string } })?.data?.detail || 'Invite failed'),
        toastColor.error,
      )
    }
  }

  if (!open) return null

  return (
    <Modal onClose={onClose} size="md" title="Invite platform staff">
      <FormProvider
        methods={methods}
        onSubmit={(e) => {
          e?.preventDefault()
          void methods.handleSubmit(onSubmit)(e)
        }}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <RHFTextField name="first_name" label="First name" isRequired />
            <RHFTextField name="last_name" label="Last name" isRequired />
          </div>
          <RHFEmailField name="email" label="Email" isRequired />
          <RHFPasswordField name="password" label="Temporary password" isRequired />
          <RHFPhoneField name="phone" label="Phone" isRequired={false} />
          <PrimaryButton
            title={isLoading ? 'Inviting…' : 'Invite staff'}
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
