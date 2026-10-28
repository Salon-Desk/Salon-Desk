import { KeyRound, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import FormProvider from '@/components/forms/FormProvider'
import RHFDropeDown from '@/components/forms/RHFDropeDown'
import RHFEmailField from '@/components/forms/RHFEmailField'
import RHFPhoneField from '@/components/forms/RHFPhoneField'
import RHFTextField from '@/components/forms/RHFTextField'
import { RHFUploadImage } from '@/components/forms/RHFUploadImage'
import { toastColor } from '@/constant/toast-color'
import { zodResolver } from '@/lib/schema/resolver'
import { cn } from '@/lib/utils'
import { useGetCatalogCategoriesQuery } from '@/store/api/clientApi'
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
  const { data: categoriesData } = useGetCatalogCategoriesQuery(
    { page: 1, page_size: 100 },
    { skip: !open },
  )
  const categories = categoriesData?.items ?? []
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  const methods = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: createEmployeeDefaultValues,
    mode: 'onBlur',
  })

  const roleValue = methods.watch('role')

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    )
  }

  const onSubmit = async (data: CreateEmployeeFormData) => {
    try {
      const formData = new FormData()
      formData.append('email', (data.email ?? '').trim())
      formData.append('first_name', (data.first_name ?? '').trim())
      formData.append('last_name', (data.last_name ?? '').trim())
      if (data.handle) formData.append('handle', data.handle.trim().replace(/^@/, '').toLowerCase())
      if (data.middle_name) formData.append('middle_name', data.middle_name.trim())
      if (data.phone) formData.append('phone', data.phone.trim())
      formData.append('role', data.role)
      if (data.picture instanceof File) formData.append('file', data.picture)
      if (selectedCategoryIds.length > 0) {
        formData.append('category_ids', JSON.stringify(selectedCategoryIds))
      }

      await createEmployee(formData).unwrap()
      toast.success('Team member invited and credentials emailed', toastColor.success)
      methods.reset(createEmployeeDefaultValues)
      setSelectedCategoryIds([])
      onClose()
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not invite employee'
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
      header={<h3 className="text-base font-bold text-slate-900">Invite salon team member</h3>}
    >
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RHFTextField
              name="handle"
              label="Staff handle"
              placeholder="e.g. sarah_cuts"
              leftIcon="user"
              isRequired={false}
            />
            <RHFPhoneField name="phone" label="Phone" isRequired={false} />
          </div>
          <RHFEmailField name="email" label="Work email" isRequired />
          <RHFDropeDown
            name="role"
            label="Role"
            isRequired
            options={[
              { label: 'Stylist', value: 'stylist' },
              { label: 'Reception', value: 'reception' },
            ]}
          />

          {roleValue === 'stylist' && categories.length > 0 && (
            <div className="space-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  Service Categories
                </label>
                <span className="text-[10px] text-slate-400">
                  {selectedCategoryIds.length} selected
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Assign categories this stylist provides for smart client booking matching.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={cn(
                        'cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition-all select-none',
                        isSelected
                          ? 'border-amber-400 bg-amber-500/15 text-amber-900 font-bold shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                      )}
                    >
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2.5 rounded-xl border border-sky-200/80 bg-sky-50/70 p-3 text-xs text-sky-900">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <span>
              An 8-character temporary password will be auto-generated and emailed to the invitee
              with instructions to access SalonDesk.
            </span>
          </div>

          <PrimaryButton
            title={isLoading ? 'Inviting…' : 'Invite team member'}
            isLoading={isLoading}
            type="submit"
            size="sm"
            fullWidth
            className="mt-1 h-11 w-full rounded-xl text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
          />
        </div>
      </FormProvider>
    </CustomResponsiveDialog>
  )
}
