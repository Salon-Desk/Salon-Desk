'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import FormProvider from '@/components/forms/FormProvider'
import RHFDropeDown from '@/components/forms/RHFDropeDown'
import RHFPhoneField from '@/components/forms/RHFPhoneField'
import RHFTextField from '@/components/forms/RHFTextField'
import { RHFUploadImage } from '@/components/forms/RHFUploadImage'
import PrimaryButton from '@/components/ui/primary-button'
import { toastColor } from '@/constant/toast-color'
import { zodResolver } from '@/lib/schema/resolver'
import { useUpdateMyEmployeeMutation, useUploadEmployeeAvatarMutation } from '@/store/api/orgApi'
import type { User } from '@/types/user'

import { type EditEmployeeFormData, editEmployeeSchema } from '../_schemas/staff.schema'

interface EditEmployeeModalProps {
  employee: User | null
  open: boolean
  onClose: () => void
}

export function EditEmployeeModal({ employee, open, onClose }: EditEmployeeModalProps) {
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateMyEmployeeMutation()
  const [uploadAvatar, { isLoading: isUploading }] = useUploadEmployeeAvatarMutation()

  const isLoading = isUpdating || isUploading

  const methods = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      middle_name: '',
      phone: '',
      role: 'stylist',
      picture: null,
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (employee && open) {
      methods.reset({
        first_name: employee.profile?.first_name || employee.first_name || '',
        last_name: employee.profile?.last_name || employee.last_name || '',
        middle_name: employee.profile?.middle_name || '',
        phone: employee.profile?.phone || employee.phone || '',
        role: employee.role === 'reception' ? 'reception' : 'stylist',
        picture: employee.profile?.picture || null,
      })
    }
  }, [employee, open, methods])

  const onSubmit = async (data: EditEmployeeFormData) => {
    if (!employee) return
    try {
      // Handle avatar upload if a new file is provided
      let pictureUrl = data.picture
      if (data.picture instanceof File) {
        const formData = new FormData()
        formData.append('file', data.picture)
        const updatedUser = await uploadAvatar({ employeeId: employee.id, file: formData }).unwrap()
        pictureUrl = updatedUser.profile?.picture || null
      } else if (data.picture === null) {
        pictureUrl = null
      } else {
        pictureUrl = employee.profile?.picture || null
      }

      await updateEmployee({
        employeeId: employee.id,
        data: {
          first_name: (data.first_name ?? '').trim(),
          last_name: (data.last_name ?? '').trim(),
          middle_name: data.middle_name?.trim() || null,
          phone: data.phone?.trim() || null,
          role: data.role,
          picture: pictureUrl,
        },
      }).unwrap()
      toast.success('Team member updated', toastColor.success)
      onClose()
    } catch (err) {
      const message =
        (err as { data?: { detail?: string }; message?: string })?.data?.detail ||
        (err as { message?: string })?.message ||
        'Could not update employee'
      toast.error(String(message), toastColor.error)
    }
  }

  if (!open || !employee) return null

  const isOwner = employee.role === 'org_owner'

  return (
    <CustomResponsiveDialog
      open={open}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      header={
        <h3 className="font-bold text-slate-900 text-base">
          Edit {employee.profile?.first_name || 'Staff Member'}
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
        <div className="space-y-3.5 text-xs">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <span className="font-semibold text-slate-700">Work email: </span>
            <span className="font-mono text-slate-600">{employee.email}</span>
          </div>

          <div className="flex justify-center">
            <RHFUploadImage name="picture" label="Profile photo" size={128} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RHFTextField name="first_name" label="First name" isRequired />
            <RHFTextField name="last_name" label="Last name" isRequired />
          </div>

          <RHFTextField
            name="middle_name"
            label="Middle name"
            isRequired={false}
            placeholder="Optional"
          />

          <RHFPhoneField name="phone" label="Phone number" isRequired={false} />

          {!isOwner ? (
            <RHFDropeDown
              name="role"
              label="Role"
              isRequired
              options={[
                { label: 'Stylist', value: 'stylist' },
                { label: 'Reception', value: 'reception' },
              ]}
            />
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2 text-xs text-amber-800">
              Role: Organization Owner (Role cannot be changed)
            </div>
          )}

          <div className="flex flex-col items-stretch gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <PrimaryButton
              title="Cancel"
              variant="outline"
              size="sm"
              fullWidth={false}
              className="h-10 rounded-xl px-5 text-xs font-semibold transition-all active:scale-[0.98]"
              onClick={onClose}
            />
            <PrimaryButton
              title={isLoading ? 'Saving…' : 'Save changes'}
              isLoading={isLoading}
              type="submit"
              size="sm"
              fullWidth={false}
              className="h-10 rounded-xl px-5 text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
            />
          </div>
        </div>
      </FormProvider>
    </CustomResponsiveDialog>
  )
}
