import { SERVICE_IMAGE_FALLBACK } from '@/lib/data/service-content'
import type { Booking, HoldState, SalonService, ServiceCategory } from '@/types'
import type { ApiBooking } from '@/types/api-booking'
import type { CatalogService } from '@/types/api-org'

const CATEGORY_FALLBACK: ServiceCategory = 'Haircuts'

function catalogCoverUrl(images: Record<string, unknown> | undefined): string {
  const cover = images?.cover
  return typeof cover === 'string' && cover.length > 0 ? cover : SERVICE_IMAGE_FALLBACK
}

function formatDeadlineLabel(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Map backend booking status → demo HoldState used by UI badges/drawers. */
export function mapBookingStatusToHoldState(status: string): HoldState {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
      return 'CAPTURED'
    case 'CANCELLED':
      return 'VOIDED'
    case 'NO_SHOW':
      return 'NO_SHOW_CAPTURED'
    case 'REAUTHORIZED':
      return 'REAUTHORIZED'
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
    paypalAuthId?: string | null
    honorExpiresAt?: string | null
    reauthorizationCount?: number
    holdStatus?: string | null
  },
): Booking {
  const price = Number(booking.total_price) || 0
  const holdAmount = Number(booking.agreed_hold_amount ?? booking.total_price) || price
  const noShowFee = Number(booking.agreed_no_show_fee ?? 0)
  const firstService = booking.booking_services?.[0]
  const starts = new Date(booking.starts_at)
  const ends = new Date(booking.ends_at)
  const durationMin = Math.max(15, Math.round((ends.getTime() - starts.getTime()) / 60000))
  const freeCancelDeadlineLabel = formatDeadlineLabel(booking.free_cancel_deadline_at)
  const honorExpiresLabel = extras?.honorExpiresAt
    ? formatDeadlineLabel(extras.honorExpiresAt)
    : undefined

  let status = mapBookingStatusToHoldState(booking.status)
  if (extras?.holdStatus?.toUpperCase() === 'REAUTHORIZED' && status === 'HELD') {
    status = 'REAUTHORIZED'
  }

  return {
    id: booking.id,
    clientName: extras?.clientName || booking.client_name || 'Client',
    clientEmail: booking.client_email || '',
    clientPhone: booking.client_phone || '',
    salonId: booking.org_id,
    salonName: extras?.salonName || booking.organization_name || 'Salon',
    serviceId: firstService?.service_id || '',
    serviceName: extras?.serviceName || booking.service_name || 'Service',
    stylistId: booking.stylist_id || '',
    stylistName: extras?.stylistName || booking.stylist_name || 'Any available stylist',
    stylistPicture: booking.stylist_picture,
    customerNotes: booking.customer_notes,
    appointmentTime: starts.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    durationMin,
    servicePrice: price,
    holdAmount,
    noShowFee,
    status,
    paypalAuthId: extras?.paypalAuthId || '—',
    authExpiresAt: freeCancelDeadlineLabel,
    freeCancelDeadlineLabel,
    honorExpiresLabel,
    policySnapshot: booking.policy_snapshot_json || undefined,
    commissionSnapshot: booking.commission_snapshot || undefined,
    idempotencyKey: booking.id,
    consentHash: '—',
    createdAt: new Date(booking.created_at).toLocaleString(),
    settlementNote: booking.cancellation_reason || undefined,
    reauthorizationCount: extras?.reauthorizationCount,
  }
}

export function mapCatalogServiceToSalonService(service: CatalogService): SalonService {
  const price = Number(service.base_price) || 0
  // Catalog card estimates only — locked amounts come from booking snapshots after create.
  const holdDeposit = price
  const rawCategory = (service.category_name || CATEGORY_FALLBACK) as ServiceCategory

  const distanceKm =
    service.distance_km === null || service.distance_km === undefined
      ? undefined
      : Number(service.distance_km)

  return {
    id: service.id,
    name: service.name,
    category: rawCategory,
    durationMin: service.duration_minutes,
    price,
    holdDeposit,
    noShowFee: Math.round(price * 0.5),
    description: service.description || 'Salon service',
    popular: price >= 80,
    imageUrl: catalogCoverUrl(service.images),
    organizationId: service.organization_id,
    organizationName: service.organization_name || undefined,
    distanceKm: Number.isFinite(distanceKm) ? distanceKm : undefined,
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
