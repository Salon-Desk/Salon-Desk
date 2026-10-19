import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

import { ClientCheckoutPage } from '@/app/client/_components/ClientCheckoutPage'

type ClientCheckoutRouteProps = {
  params: Promise<{ serviceId: string }>
  searchParams: Promise<{ slot?: string; stylist?: string; paypal?: string }>
}

async function Checkout({ params, searchParams }: ClientCheckoutRouteProps) {
  const { serviceId } = await params
  const { slot, stylist, paypal } = await searchParams
  return (
    <ClientCheckoutPage
      key={serviceId}
      serviceId={serviceId}
      initialSlot={slot}
      initialStylistId={stylist}
      paypalCancelled={paypal === 'cancelled'}
    />
  )
}

export default function ClientCheckoutRoute(props: ClientCheckoutRouteProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#fbfbfa]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <p className="text-xs text-stone-500">Opening checkout…</p>
        </div>
      }
    >
      <Checkout {...props} />
    </Suspense>
  )
}
