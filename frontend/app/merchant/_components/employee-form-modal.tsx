'use client'

import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import FormProvider from '@/components/forms/FormProvider'
import RHFDropeDown from '@/components/forms/RHFDropeDown'
import RHFEmailField from '@/components/forms/RHFEmailField'
import RHFPasswordField from '@/components/forms/RHFPasswordField'
import RHFPhoneField from '@/components/forms/RHFPhoneField'
import RHFTextField from '@/components/forms/RHFTextField'
import { RHFUploadImage } from '@/components/forms/RHFUploadImage'
import { Modal } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { zodResolver } from '@/lib/schema/resolver'
import { useCreateMyEmployeeMutation } from '@/store/api/orgApi'

import {
  createEmployeeDefaultValues,
  type CreateEmployeeFormData,
  createEmployeeSchema,
} from '../_schemas/staff.schema'

interface EmployeeFormModalProps {
  open: boolean
  onClose: () => void
}

export function EmployeeFormModal({ open, onClose }: EmployeeFormModalProps) {
  const [createEmployee, { isLoading }] = useCreateMyEmployeeMutation()

  const methods = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: createEmployeeDefaultValues,
    mode: 'onBlur',
  })

  const onSubmit = async (data: CreateEmployeeFormData) => {
    try {
      const formData = new FormData()
      formData.append('email', data.email ?? '')
      formData.append('password', data.password ?? '')
      formData.append('first_name', data.first_name ?? '')
      formData.append('last_name', data.last_name ?? '')
      if (data.middle_name) formData.append('middle_name', data.middle_name)
      if (data.phone) formData.append('phone', data.phone)
      formData.append('role', data.role)
      if (data.picture instanceof File) formData.append('file', data.picture)

      await createEmployee(formData).unwrap()
      toast.success('Team member added', toastColor.success)
      methods.reset(createEmployeeDefaultValues)
      onClose()
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not add employee'
      toast.error(String(message), toastColor.error)
    }
  }

  if (!open) return null

  return (
    <Modal onClose={onClose} size="md" title="Add salon team member">
      <FormProvider
        methods={methods}
        onSubmit={(e) => {
          e?.preventDefault()
          void methods.handleSubmit(onSubmit)(e)
        }}
      >
        <div className="space-y-3 text-xs">
          <div className="flex justify-center">
            <RHFUploadImage name="picture" label="Profile photo" size={128} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RHFTextField name="first_name" label="First name" isRequired />
            <RHFTextField name="last_name" label="Last name" isRequired />
          </div>
          <RHFEmailField name="email" label="Work email" isRequired />
          <RHFPasswordField name="password" label="Temporary password" isRequired />
          <RHFPhoneField name="phone" label="Phone" isRequired={false} />
          <RHFDropeDown
            name="role"
            label="Role"
            isRequired
            options={[
              { label: 'Stylist', value: 'stylist' },
              { label: 'Reception', value: 'reception' },
            ]}
          />
          <PrimaryButton
            title={isLoading ? 'Saving…' : 'Add team member'}
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
