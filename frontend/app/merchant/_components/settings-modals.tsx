'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import PrimaryButton from '@/components/button/PrimaryButton'
import FormProvider from '@/components/forms/FormProvider'
import RHFDropeDown from '@/components/forms/RHFDropeDown'
import RHFNumberField from '@/components/forms/RHFNumberField'
import RHFTextField from '@/components/forms/RHFTextField'
import { Modal, Panel } from '@/components/ui'
import { zodResolver } from '@/lib/schema/resolver'

import {
  paypalChangeDefaultValues,
  type PaypalChangeFormData,
  paypalChangeSchema,
  policyChangeDefaultValues,
  type PolicyChangeFormData,
  policyChangeSchema,
} from '../_schemas/settings.schema'

interface PaypalChangeModalProps {
  open: boolean
  currentMerchantId: string
  isLoading?: boolean
  onClose: () => void
  onSubmit: (merchantId: string) => Promise<void> | void
}

interface PolicyChangeModalProps {
  open: boolean
  policyHours: number
  noShowFee: number
  isLoading?: boolean
  onClose: () => void
  onSubmit: (next: { policyHours: number; noShowFee: number }) => Promise<void> | void
}

export function PaypalChangeModal({
  open,
  currentMerchantId,
  isLoading = false,
  onClose,
  onSubmit,
}: PaypalChangeModalProps) {
  const methods = useForm<PaypalChangeFormData>({
    resolver: zodResolver(paypalChangeSchema),
    defaultValues: paypalChangeDefaultValues,
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!open) return
    methods.reset(paypalChangeDefaultValues)
  }, [open, methods])

  const handleSubmit = async (data: PaypalChangeFormData) => {
    await onSubmit((data.merchant_id ?? '').trim())
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
        <div className="space-y-3 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Platform Admin approval is required before changing the payout account. Payouts will
            continue routing to your verified ID until approved.
          </p>

          <Panel className="space-y-1 bg-white font-mono text-[11px]">
            <span className="font-sans text-slate-500 uppercase">Current Approved ID:</span>
            <div className="font-bold text-slate-900">{currentMerchantId}</div>
          </Panel>

          <RHFTextField
            name="merchant_id"
            label="New Proposed PayPal Merchant ID"
            isRequired
            placeholder="e.g. SELAM-EXPANSION-8812"
          />

          <div className="flex gap-2 pt-1">
            <PrimaryButton
              title="Cancel"
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              className="h-11 rounded-xl"
              onClick={onClose}
              isDisabled={isLoading}
            />
            <PrimaryButton
              title={isLoading ? 'Submitting…' : 'Submit change request'}
              type="submit"
              size="sm"
              fullWidth
              isLoading={isLoading}
              className="h-11 rounded-xl"
            />
          </div>
        </div>
      </FormProvider>
    </Modal>
  )
}

export function PolicyChangeModal({
  open,
  policyHours,
  noShowFee,
  isLoading = false,
  onClose,
  onSubmit,
}: PolicyChangeModalProps) {
  const methods = useForm<PolicyChangeFormData>({
    resolver: zodResolver(policyChangeSchema),
    defaultValues: policyChangeDefaultValues,
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!open) return
    const hours = String(policyHours) as PolicyChangeFormData['policyHours']
    const allowed = ['12', '24', '48', '72'] as const
    methods.reset({
      policyHours: allowed.includes(hours as (typeof allowed)[number]) ? hours : '24',
      noShowFee,
    })
  }, [open, policyHours, noShowFee, methods])

  const handleSubmit = async (data: PolicyChangeFormData) => {
    await onSubmit({
      policyHours: Number(data.policyHours),
      noShowFee: Number(data.noShowFee),
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
        <div className="space-y-3 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Policy changes undergo compliance review to prevent deceptive booking terms for salon
            customers.
          </p>

          <RHFDropeDown
            name="policyHours"
            label="Proposed Free Cancellation Notice (Hours)"
            isRequired
            options={[
              { value: '12', label: '12 Hours Prior' },
              { value: '24', label: '24 Hours Prior (Industry Standard)' },
              { value: '48', label: '48 Hours Prior' },
              { value: '72', label: '72 Hours Prior' },
            ]}
          />

          <RHFNumberField name="noShowFee" label="Default No-Show Fee ($)" isRequired />

          <div className="flex gap-2 pt-1">
            <PrimaryButton
              title="Cancel"
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              className="h-11 rounded-xl"
              onClick={onClose}
              isDisabled={isLoading}
            />
            <PrimaryButton
              title={isLoading ? 'Submitting…' : 'Submit policy proposal'}
              type="submit"
              size="sm"
              fullWidth
              isLoading={isLoading}
              className="h-11 rounded-xl"
            />
          </div>
        </div>
      </FormProvider>
    </Modal>
  )
}
