import { ClientCheckoutPage } from './ClientCheckoutPage'

export interface ClientCheckoutContainerProps {
  params: Promise<{ serviceId: string }>
  searchParams: Promise<{
    slot?: string
    stylist?: string
    paypal?: string
    services?: string
    guests?: string
  }>
}

export async function ClientCheckoutContainer({
  params,
  searchParams,
}: ClientCheckoutContainerProps) {
  const { serviceId } = await params
  const { slot, stylist, paypal, services, guests } = await searchParams
  const extraServices = services ? services.split(',').filter((id) => id && id !== serviceId) : []
  const initialParty = guests ? Number.parseInt(guests, 10) : 1

  return (
    <ClientCheckoutPage
      key={serviceId}
      serviceId={serviceId}
      extraServiceIds={extraServices}
      initialSlot={slot}
      initialStylistId={stylist}
      initialPartySize={Number.isFinite(initialParty) && initialParty > 0 ? initialParty : 1}
      paypalCancelled={paypal === 'cancelled'}
    />
  )
}
