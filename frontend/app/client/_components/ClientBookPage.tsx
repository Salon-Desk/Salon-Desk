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
    const servicesFromQuery = params.get('services')?.split(',').filter(Boolean)
    const effectiveServiceIds =
      servicesFromQuery && servicesFromQuery.length > 0 ? servicesFromQuery : draft.serviceIds
    const serviceId = effectiveServiceIds[0]
    const extraServices = effectiveServiceIds.slice(1).join(',')
    const guests = params.get('guests')
    const stylistId = params.get('stylist') || draft.stylistId

    if (serviceId) {
      const base = checkoutPath(serviceId, {
        slot: draft.startsAt,
        stylist: stylistId ?? undefined,
      })
      const extraQuery = extraServices ? `&services=${extraServices}` : ''
      const guestQuery = guests ? `&guests=${guests}` : ''
      const sep = base.includes('?') ? '&' : '?'
      const fullUrl = `${base}${extraQuery || guestQuery ? sep : ''}${extraQuery ? extraQuery.replace(/^&/, '') : ''}${guestQuery ? (extraQuery ? guestQuery : guestQuery.replace(/^&/, '')) : ''}`
      router.replace(fullUrl)
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
