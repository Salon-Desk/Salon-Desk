import { ClientCheckoutPage } from './ClientCheckoutPage'

export interface ClientCheckoutContainerProps {
  params: Promise<{ serviceId: string }>
  searchParams: Promise<{ slot?: string; stylist?: string; paypal?: string }>
}

export async function ClientCheckoutContainer({
  params,
  searchParams,
}: ClientCheckoutContainerProps) {
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
