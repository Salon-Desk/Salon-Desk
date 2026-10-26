'use client'

import { AlertCircle, Clock } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import FormProvider from '@/components/forms/FormProvider'
import RHFDropeDown from '@/components/forms/RHFDropeDown'
import RHFNumberField from '@/components/forms/RHFNumberField'
import RHFTextField from '@/components/forms/RHFTextField'
import { zodResolver } from '@/lib/schema/resolver'

import { type PolicyChangeFormData, policyChangeSchema } from '../_schemas/settings.schema'
import { PolicyPreviewSummary } from './PolicyPreviewSummary'

export interface PolicyChangeSubmitPayload {
  name: string
  policyHours: number
  noShowFee: number
  noShowFeePercent: number
  lateCancelFeePercent: number
  holdPercent: number
}

export interface PolicyChangeModalProps {
  open: boolean
  initialName?: string
  policyHours: number
  noShowFee?: number
  noShowFeePercent?: number
  lateCancelFeePercent?: number
  holdPercent?: number
  isLoading?: boolean
  onClose: () => void
  onSubmit: (next: PolicyChangeSubmitPayload) => Promise<void> | void
}

export function PolicyChangeModal({
  open,
  initialName = 'Standard 24h Policy',
  policyHours,
  noShowFee,
  noShowFeePercent,
  lateCancelFeePercent = 25,
  holdPercent = 100,
  isLoading = false,
  onClose,
  onSubmit,
}: PolicyChangeModalProps) {
  const methods = useForm<PolicyChangeFormData>({
    resolver: zodResolver(policyChangeSchema),
    defaultValues: {
      name: initialName,
      policyHours: '24',
      noShowFeePercent: 50,
      lateCancelFeePercent: 25,
      holdPercent: 100,
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!open) return
    const hours = String(policyHours) as PolicyChangeFormData['policyHours']
    const allowed = ['12', '24', '48', '72'] as const
    const defaultNoShow =
      noShowFeePercent != null && Number.isFinite(noShowFeePercent)
        ? noShowFeePercent
        : noShowFee != null && Number.isFinite(noShowFee)
          ? noShowFee
          : 50
    methods.reset({
      name: initialName || 'Standard 24h Policy',
      policyHours: allowed.includes(hours as (typeof allowed)[number]) ? hours : '24',
      noShowFeePercent: defaultNoShow,
      lateCancelFeePercent: Number.isFinite(lateCancelFeePercent) ? lateCancelFeePercent : 25,
      holdPercent: holdPercent || 100,
    })
  }, [
    open,
    initialName,
    policyHours,
    noShowFee,
    noShowFeePercent,
    lateCancelFeePercent,
    holdPercent,
    methods,
  ])

  const handleSubmit = async (data: PolicyChangeFormData) => {
    const hours = Number(data.policyHours)
    const noShow = Number(data.noShowFeePercent)
    const late = Number(data.lateCancelFeePercent)
    const hold = Number(data.holdPercent) || 100
    await onSubmit({
      name: data.name.trim() || initialName,
      policyHours: hours,
      noShowFee: noShow,
      noShowFeePercent: noShow,
      lateCancelFeePercent: late,
      holdPercent: hold,
    })
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
          Propose Cancellation Policy Amendment
        </h3>
      }
    >
      <FormProvider
        methods={methods}
        onSubmit={(e) => {
          e?.preventDefault()
          void methods.handleSubmit(handleSubmit)(e)
        }}
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-amber-900">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div className="space-y-1">
              <span className="font-semibold text-xs">Fair Terms Compliance Review</span>
              <p className="text-[11px] leading-relaxed text-amber-800/90">
                To balance salon chair protection with consumer fairness, policy modifications are
                reviewed before taking effect across your online booking catalog.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <RHFTextField
              name="name"
              label="Policy Name"
              isRequired
              placeholder="e.g. Standard 24h Policy"
            />

            <RHFDropeDown
              name="policyHours"
              label="Free Cancellation Notice Window"
              isRequired
              options={[
                { value: '12', label: '12 Hours Prior (Short Notice)' },
                { value: '24', label: '24 Hours Prior (Industry Standard)' },
                { value: '48', label: '48 Hours Prior (Extended Notice)' },
                { value: '72', label: '72 Hours Prior (Specialty / Bridal)' },
              ]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <RHFNumberField name="noShowFeePercent" label="No-Show Penalty (%)" isRequired />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Captured if client fails to show up
                </span>
              </div>

              <div>
                <RHFNumberField
                  name="lateCancelFeePercent"
                  label="Late Cancellation Fee (%)"
                  isRequired
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Charged if cancelled after cutoff
                </span>
              </div>
            </div>
          </div>

          <PolicyPreviewSummary control={methods.control} />

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>Active appointments made under previous terms remain protected.</span>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <PrimaryButton
              title="Cancel"
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              className="h-10 rounded-xl w-1/2"
              onClick={onClose}
              isDisabled={isLoading}
            />
            <PrimaryButton
              title={isLoading ? 'Submitting…' : 'Submit policy amendment'}
              type="submit"
              size="sm"
              fullWidth
              isLoading={isLoading}
              className="h-10 rounded-xl w-1/2"
            />
          </div>
        </div>
      </FormProvider>
    </CustomResponsiveDialog>
  )
}
