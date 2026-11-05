'use client'

import { CreditCard } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { PrimaryButton } from '@/components/button'
import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import FormProvider from '@/components/forms/FormProvider'
import RHFTextField from '@/components/forms/RHFTextField'
import { zodResolver } from '@/lib/schema/resolver'

import {
  paypalChangeDefaultValues,
  type PaypalChangeFormData,
  paypalChangeSchema,
} from '../_schemas/settings.schema'

export interface PaypalChangeDetails {
  merchant_id: string
  merchant_email?: string
  display_name?: string
}

export interface PaypalChangeModalProps {
  open: boolean
  isFirstTime?: boolean
  currentMerchantId: string
  currentEmail?: string | null
  currentDisplayName?: string | null
  isLoading?: boolean
  onClose: () => void
  onSubmit: (merchantId: string, details?: PaypalChangeDetails) => Promise<void> | void
}

export function PaypalChangeModal({
  open,
  isFirstTime = false,
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
      merchant_id: isFirstTime ? '' : currentMerchantId || '',
      merchant_email: currentEmail || '',
      display_name: currentDisplayName || '',
    })
  }, [open, isFirstTime, currentMerchantId, currentEmail, currentDisplayName, methods])

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
    <CustomResponsiveDialog
      open={open}
      setOpen={(isOpen) => {
        if (!isOpen) onClose()
      }}
      header={
        <h3 className="font-bold text-slate-900 text-base">
          {isFirstTime ? 'Connect PayPal Account' : 'Request PayPal Merchant ID Change'}
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
          <div className="flex items-start gap-2.5 rounded-xl border border-sky-200/80 bg-sky-50/60 p-3 text-sky-900">
            <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <div className="space-y-1">
              <span className="font-semibold text-xs">
                {isFirstTime ? 'Direct Payout Activation' : 'Disbursement Compliance Gate'}
              </span>
              <p className="text-[11px] leading-relaxed text-sky-800/90">
                {isFirstTime
                  ? 'Connect your verified PayPal Business account. Once linked, appointment hold authorizations will route directly to your account upon checkout.'
                  : 'To prevent accidental payout interruption, platform compliance review is required. Payouts will continue routing to your currently approved merchant account until verified.'}
              </p>
            </div>
          </div>

          {!isFirstTime && (
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
          )}

          <div className="space-y-3">
            <RHFTextField
              name="merchant_id"
              label={isFirstTime ? 'PayPal Merchant ID' : 'New Proposed PayPal Merchant Payer ID'}
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
              label="Payout Statement Name (Optional)"
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
              className="h-10 rounded-xl w-1/2"
              onClick={onClose}
              isDisabled={isLoading}
            />
            <PrimaryButton
              title={
                isFirstTime
                  ? isLoading
                    ? 'Connecting…'
                    : 'Connect PayPal Account'
                  : isLoading
                    ? 'Submitting…'
                    : 'Submit change request'
              }
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
