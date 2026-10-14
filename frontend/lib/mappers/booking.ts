import type { Booking, HoldState, SalonService, ServiceCategory } from '@/types'
import type { ApiBooking } from '@/types/api-booking'
import type { CatalogService } from '@/types/api-org'

const CATEGORY_FALLBACK: ServiceCategory = 'Haircuts'

/** Map backend booking status → demo HoldState used by UI badges/drawers. */
export function mapBookingStatusToHoldState(status: string): HoldState {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
      return 'CAPTURED'
    case 'CANCELLED':
      return 'VOIDED'
    case 'NO_SHOW':
      return 'NO_SHOW_CAPTURED'
    case 'CONFIRMED':
    case 'PENDING':
    default:
      return 'HELD'
  }
}

export function mapApiBookingToUi(
  booking: ApiBooking,
  extras?: {
    clientName?: string
    salonName?: string
    serviceName?: string
    stylistName?: string
  },
): Booking {
  const price = Number(booking.total_price) || 0
  const firstService = booking.booking_services?.[0]
  const starts = new Date(booking.starts_at)
  const ends = new Date(booking.ends_at)
  const durationMin = Math.max(15, Math.round((ends.getTime() - starts.getTime()) / 60000))

  return {
    id: booking.id,
    clientName: extras?.clientName || 'Client',
    clientEmail: '',
    clientPhone: '',
    salonId: booking.org_id,
    salonName: extras?.salonName || 'Salon',
    serviceId: firstService?.service_id || '',
    serviceName: extras?.serviceName || 'Service',
    stylistId: booking.stylist_id || '',
    stylistName: extras?.stylistName || 'Any stylist',
    appointmentTime: starts.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    durationMin,
    servicePrice: price,
    holdAmount: price,
    noShowFee: Math.min(price, Math.round(price * 0.25) || 30),
    status: mapBookingStatusToHoldState(booking.status),
    paypalAuthId: '—',
    authExpiresAt: '—',
    idempotencyKey: booking.id,
    consentHash: '—',
    createdAt: new Date(booking.created_at).toLocaleString(),
    settlementNote: booking.cancellation_reason || undefined,
  }
}

export function mapCatalogServiceToSalonService(service: CatalogService): SalonService {
  const price = Number(service.base_price) || 0
  const holdDeposit = Math.max(10, Math.round(price * 0.2))
  const rawCategory = (service.category_name || CATEGORY_FALLBACK) as ServiceCategory

  return {
    id: service.id,
    name: service.name,
    category: rawCategory,
    durationMin: service.duration_minutes,
    price,
    holdDeposit,
    noShowFee: Math.min(price, Math.max(15, Math.round(price * 0.15))),
    description: service.description || 'Salon service',
    popular: price >= 80,
  }
}

export function nextAvailableSlotIso(hoursFromNow = 26): string {
  const d = new Date()
  d.setHours(d.getHours() + hoursFromNow, 0, 0, 0)
  return d.toISOString()
}

/** Parse demo slot labels like "Tomorrow · 2:00 PM" into an ISO timestamp. */
export function slotLabelToIso(slotLabel: string): string {
  const match = slotLabel.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  const base = new Date()
  base.setDate(
    base.getDate() +
      (slotLabel.toLowerCase().includes('saturday') ? (6 - base.getDay() + 7) % 7 || 7 : 1),
  )
  if (!match) return nextAvailableSlotIso()

  let hour = Number(match[1])
  const minute = Number(match[2])
  const ampm = match[3].toUpperCase()
  if (ampm === 'PM' && hour < 12) hour += 12
  if (ampm === 'AM' && hour === 12) hour = 0
  base.setHours(hour, minute, 0, 0)
  return base.toISOString()
}
