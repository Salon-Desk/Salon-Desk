'use client'

import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { ExternalLink, Lock, ShieldCheck } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PrimaryButton } from '@/components/button'
import { toastColor } from '@/constant/toast-color'
import { formatUsd } from '@/lib/format'
import { useGetPaymentConfigQuery } from '@/store/api/clientApi'

export interface PrepareHoldResult {
  holdId: string
  paypalOrderId: string
  approvalUrl: string
}

export interface PayPalSmartHoldButtonsProps {
  holdAmount: number
  disabled?: boolean
  onPrepareHold: () => Promise<PrepareHoldResult | null>
  onCompleteHold: (holdId: string, orderToken: string) => Promise<void>
  onFallbackRedirect: (approvalUrl: string) => void
}

export const PayPalSmartHoldButtons = memo(function PayPalSmartHoldButtons({
  holdAmount,
  disabled = false,
  onPrepareHold,
  onCompleteHold,
  onFallbackRedirect,
}: PayPalSmartHoldButtonsProps) {
  const { data: config } = useGetPaymentConfigQuery()
  const [activeHoldId, setActiveHoldId] = useState<string | null>(null)
  const [activeApprovalUrl, setActiveApprovalUrl] = useState<string | null>(null)
  const [scriptError, setScriptError] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const clientId = config?.client_id || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb'

  const scriptOptions = useMemo(
    () => ({
      clientId,
      currency: 'USD',
      intent: 'authorize',
      components: 'buttons',
      'disable-funding': 'paylater,credit,venmo',
    }),
    [clientId],
  )

  const handleCreateOrder = async (): Promise<string> => {
    setIsProcessing(true)
    try {
      const res = await onPrepareHold()
      if (!res) {
        setIsProcessing(false)
        throw new Error('Could not prepare booking authorization hold.')
      }
      setActiveHoldId(res.holdId)
      setActiveApprovalUrl(res.approvalUrl)
      return res.paypalOrderId
    } catch (err: unknown) {
      setIsProcessing(false)
      const msg = err instanceof Error ? err.message : 'Failed to initialize PayPal order'
      toast.error(msg, toastColor.error)
      throw err
    }
  }

  const handleApprove = async (data: { orderID: string }) => {
    try {
      const holdId = activeHoldId
      if (!holdId) {
        throw new Error('Missing active hold reference')
      }
      await onCompleteHold(holdId, data.orderID)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to finalize authorization hold'
      toast.error(msg, toastColor.error)
      // Provide fallback redirect if modal/popup completion encounters issue
      if (activeApprovalUrl) {
        onFallbackRedirect(activeApprovalUrl)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // If script fails or client is disabled, provide clean fallback button
  if (scriptError || !clientId || clientId === 'sb') {
    return (
      <div className="flex flex-col gap-2">
        <PrimaryButton
          variant="paypal"
          size="sm"
          className="h-12 w-full rounded-full bg-[#FFC439] text-sm font-semibold text-[#003087] shadow-sm transition-all hover:bg-[#F4B41A] active:scale-[0.99] cursor-pointer"
          isDisabled={disabled || isProcessing}
          onClick={async () => {
            setIsProcessing(true)
            const res = await onPrepareHold()
            setIsProcessing(false)
            if (res?.approvalUrl) {
              onFallbackRedirect(res.approvalUrl)
            }
          }}
          fullWidth
        >
          <span className="flex items-center justify-center gap-2">
            <Lock className="h-4 w-4 shrink-0 text-[#003087]" />
            <span>Continue with PayPal ({formatUsd(0)} today)</span>
          </span>
        </PrimaryButton>
        <p className="text-center text-[11px] text-stone-500">
          Authorization hold of {formatUsd(holdAmount)}. $0 charged upfront.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-2.5 text-xs text-amber-900 flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
        <div>
          <span className="font-semibold">PayPal JS SDK v6 In-Page Authorization</span>
          <p className="text-[11px] text-amber-800/90 mt-0.5">
            Cardholder hold of {formatUsd(holdAmount)} authorized in-place. $0 debited today.
          </p>
        </div>
      </div>

      <PayPalScriptProvider options={scriptOptions}>
        <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
          <PayPalButtons
            style={{
              layout: 'vertical',
              color: 'gold',
              shape: 'pill',
              label: 'checkout',
              height: 44,
            }}
            disabled={disabled || isProcessing}
            createOrder={handleCreateOrder}
            onApprove={handleApprove}
            onCancel={() => {
              setIsProcessing(false)
              toast.info('PayPal authorization hold cancelled.', toastColor.info)
            }}
            onError={() => {
              setIsProcessing(false)
              setScriptError(true)
            }}
          />
        </div>
      </PayPalScriptProvider>

      {activeApprovalUrl && (
        <button
          type="button"
          onClick={() => onFallbackRedirect(activeApprovalUrl)}
          className="inline-flex items-center justify-center gap-1.5 text-[11px] text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
        >
          <span>Having popup issues? Open PayPal in a new tab</span>
          <ExternalLink className="h-3 w-3" />
        </button>
      )}
    </div>
  )
})
