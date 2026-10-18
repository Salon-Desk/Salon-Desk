'use client'

import { AlertCircle, Clock, CreditCard, ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import PrimaryButton from '@/components/button/PrimaryButton'
import FormProvider from '@/components/forms/FormProvider'
import RHFDropeDown from '@/components/forms/RHFDropeDown'
import RHFNumberField from '@/components/forms/RHFNumberField'
import RHFTextField from '@/components/forms/RHFTextField'
import { Modal } from '@/components/ui'
import { zodResolver } from '@/lib/schema/resolver'

import {
  paypalChangeDefaultValues,
  type PaypalChangeFormData,
  paypalChangeSchema,
  type PolicyChangeFormData,
  policyChangeSchema,
} from '../_schemas/settings.schema'

export interface PaypalChangeDetails {
  merchant_id: string
  merchant_email?: string
  display_name?: string
}

interface PaypalChangeModalProps {
  open: boolean
  currentMerchantId: string
  currentEmail?: string | null
  currentDisplayName?: string | null
  isLoading?: boolean
  onClose: () => void
  onSubmit: (merchantId: string, details?: PaypalChangeDetails) => Promise<void> | void
}

export interface PolicyChangeSubmitPayload {
  name: string
  policyHours: number
  noShowFee: number
  noShowFeePercent: number
  lateCancelFeePercent: number
  holdPercent: number
}

interface PolicyChangeModalProps {
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

export function PaypalChangeModal({
  open,
  currentMerchantId,
  currentEmail,
  currentDisplayName,
  isLoading = false,
  onClose,
  onSubmit,
}: PaypalChangeModalProps) {
  const methods = useForm<PaypalChangeFormData>({
    resolver: zodResolver(paypalChangeSchema),
    defaultValues: {
      ...paypalChangeDefaultValues,
      merchant_email: currentEmail || '',
      display_name: currentDisplayName || '',
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!open) return
    methods.reset({
      merchant_id: '',
      merchant_email: currentEmail || '',
      display_name: currentDisplayName || '',
    })
  }, [open, currentEmail, currentDisplayName, methods])

  const handleSubmit = async (data: PaypalChangeFormData) => {
    const id = (data.merchant_id ?? '').trim()
    await onSubmit(id, {
      merchant_id: id,
      merchant_email: data.merchant_email?.trim() || undefined,
      display_name: data.display_name?.trim() || undefined,
    })
  }

  if (!open) return null

  return (
    <Modal onClose={onClose} size="md" title="Request PayPal Merchant ID Change">
      <FormProvider
        methods={methods}
        onSubmit={(e) => {
          e?.preventDefault()
          void methods.handleSubmit(handleSubmit)(e)
        }}
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-start gap-2.5 rounded-xl border border-sky-200/80 bg-sky-50/60 p-3 text-sky-900">
            <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <div className="space-y-1">
              <span className="font-semibold text-xs">Disbursement Compliance Gate</span>
              <p className="text-[11px] leading-relaxed text-sky-800/90">
                To prevent accidental payout interruption, platform compliance review is required.
                Payouts will continue routing to your currently approved merchant account until
                verified.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 space-y-2 text-xs">
            <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider">
              Currently Verified Payout Details
            </span>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-sans text-slate-600">Merchant Payer ID:</span>
              <span className="font-bold text-slate-900">{currentMerchantId || '—'}</span>
            </div>
            {currentEmail ? (
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5 text-xs">
                <span className="text-slate-600">Business Email:</span>
                <span className="font-medium text-slate-800">{currentEmail}</span>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <RHFTextField
              name="merchant_id"
              label="New Proposed PayPal Merchant Payer ID"
              isRequired
              placeholder="e.g. SELAM-EXPANSION-8812"
            />

            <RHFTextField
              name="merchant_email"
              label="PayPal Account Email (Optional)"
              placeholder="e.g. finance@salondesk.local"
            />

            <RHFTextField
              name="display_name"
              label="Disbursement Statement Name (Optional)"
              placeholder="e.g. Crown & Blade Atelier Payouts"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <PrimaryButton
              title="Cancel"
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              className="h-10 rounded-xl"
              onClick={onClose}
              isDisabled={isLoading}
            />
            <PrimaryButton
              title={isLoading ? 'Submitting…' : 'Submit change request'}
              type="submit"
              size="sm"
              fullWidth
              isLoading={isLoading}
              className="h-10 rounded-xl"
            />
          </div>
        </div>
      </FormProvider>
    </Modal>
  )
}

function PolicyPreviewSummary({
  control,
}: {
  control: ReturnType<typeof useForm<PolicyChangeFormData>>['control']
}) {
  const watchedHours = useWatch({ control, name: 'policyHours', defaultValue: '24' })
  const watchedNoShow = useWatch({ control, name: 'noShowFeePercent', defaultValue: 50 })
  const watchedLate = useWatch({ control, name: 'lateCancelFeePercent', defaultValue: 25 })

  return (
    <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
        <ShieldCheck className="h-4 w-4 text-amber-700" />
        <span>Live Customer Consent Terms Preview</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-white/80 p-2 border border-amber-200/60 shadow-2xs">
          <span className="block text-[10px] text-slate-500 uppercase">Notice Cutoff</span>
          <span className="font-bold text-slate-900 text-xs">{watchedHours}h Notice</span>
        </div>
        <div className="rounded-lg bg-white/80 p-2 border border-amber-200/60 shadow-2xs">
          <span className="block text-[10px] text-slate-500 uppercase">Late Cancel</span>
          <span className="font-bold text-amber-900 text-xs">{watchedLate}% Penalty</span>
        </div>
        <div className="rounded-lg bg-white/80 p-2 border border-amber-200/60 shadow-2xs">
          <span className="block text-[10px] text-slate-500 uppercase">No-Show Fee</span>
          <span className="font-bold text-rose-800 text-xs">{watchedNoShow}% Charge</span>
        </div>
      </div>
      <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
        Clients will be required to digitally authorize these terms prior to confirming their
        booking hold via PayPal.
      </p>
    </div>
  )
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
    <Modal onClose={onClose} size="md" title="Propose Cancellation Policy Amendment">
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
              className="h-10 rounded-xl"
              onClick={onClose}
              isDisabled={isLoading}
            />
            <PrimaryButton
              title={isLoading ? 'Submitting…' : 'Submit policy amendment'}
              type="submit"
              size="sm"
              fullWidth
              isLoading={isLoading}
              className="h-10 rounded-xl"
            />
          </div>
        </div>
      </FormProvider>
    </Modal>
  )
}
