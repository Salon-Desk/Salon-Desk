'use client'

import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { ROUTES } from '@/lib/constants'
import { bookingDraftSelector } from '@/store/bookingDraftSlice'

import { checkoutPath, LAST_CHECKOUT_STORAGE_KEY } from './ClientCheckoutPage'

function readLastCheckout(): string | null {
  try {
    return window.sessionStorage.getItem(LAST_CHECKOUT_STORAGE_KEY)
  } catch {
    return null
  }
}

/** `/client/book` resolves to the per-service checkout page (draft resume or PayPal cancel). */
export function ClientBookPage() {
  const router = useRouter()
  const params = useSearchParams()
  const draft = useSelector(bookingDraftSelector)
  const paypalCancelled = params.get('paypal') === 'cancelled'

  useEffect(() => {
    const lastCheckout = paypalCancelled ? readLastCheckout() : null
    if (lastCheckout) {
      const sep = lastCheckout.includes('?') ? '&' : '?'
      router.replace(`${lastCheckout}${sep}paypal=cancelled`)
      return
    }
    const serviceId = draft.serviceIds[0]
    if (serviceId) {
      router.replace(
        checkoutPath(serviceId, {
          slot: draft.startsAt,
          stylist: draft.stylistId ?? undefined,
        }),
      )
      return
    }
    router.replace(ROUTES.client)
  }, [paypalCancelled, draft.serviceIds, draft.startsAt, draft.stylistId, router])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#fbfbfa]">
      <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      <p className="text-xs text-stone-500">Opening checkout…</p>
    </div>
  )
}
