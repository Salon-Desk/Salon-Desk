import { parseCancellationFee } from '@/lib/booking/cancel-policy'
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
      return 'HELD'
    case 'PENDING_PAYMENT':
      return 'PENDING_PAYMENT'
    case 'PENDING':
    default:
      return 'PENDING'
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
    idempotencyKey?: string | null
    consentHash?: string | null
  },
): Booking {
  const price = Number(booking.total_price) || 0
  const holdAmount = Number(booking.agreed_hold_amount ?? booking.total_price) || price
  const noShowFee = Number(booking.agreed_no_show_fee ?? 0)
  const lateCancelFee = Number(
    booking.agreed_late_cancel_fee ??
      (booking.policy_snapshot_json?.late_cancel_fee_percent != null
        ? (price * Number(booking.policy_snapshot_json.late_cancel_fee_percent)) / 100
        : noShowFee),
  )
  const { fee: cancellationFeeCharged, reason: cancellationFeeReason } = parseCancellationFee(
    booking.cancellation_fee_json,
  )
  const firstService = booking.booking_services?.[0]
  const starts = new Date(booking.starts_at)
  const ends = new Date(booking.ends_at)
  const durationMin = Math.max(15, Math.round((ends.getTime() - starts.getTime()) / 60000))
  const freeCancelDeadlineLabel = formatDeadlineLabel(booking.free_cancel_deadline_at)
  const honorExpiresLabel = booking.honor_expires_at
    ? formatDeadlineLabel(booking.honor_expires_at)
    : extras?.honorExpiresAt
      ? formatDeadlineLabel(extras.honorExpiresAt)
      : undefined

  let status = mapBookingStatusToHoldState(booking.status)
  const effectiveHoldStatus = booking.hold_status || extras?.holdStatus
  if (effectiveHoldStatus?.toUpperCase() === 'REAUTHORIZED' && status === 'HELD') {
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
    startsAt: booking.starts_at,
    endsAt: booking.ends_at,
    durationMin,
    servicePrice: price,
    holdAmount,
    noShowFee,
    lateCancelFee,
    freeCancelDeadlineAt: booking.free_cancel_deadline_at,
    cancellationFeeCharged: cancellationFeeCharged > 0 ? cancellationFeeCharged : null,
    cancellationFeeReason,
    status,
    paypalAuthId: extras?.paypalAuthId || booking.paypal_auth_id || '',
    paypalOrderId: booking.paypal_order_id || null,
    holdStatus: effectiveHoldStatus || null,
    capturedAmount: booking.captured_amount != null ? Number(booking.captured_amount) : null,
    authExpiresAt: freeCancelDeadlineLabel,
    freeCancelDeadlineLabel,
    honorExpiresLabel,
    policySnapshot: booking.policy_snapshot_json || undefined,
    commissionSnapshot: booking.commission_snapshot || undefined,
    idempotencyKey: booking.idempotency_key || extras?.idempotencyKey || booking.id,
    consentHash: booking.consent_hash || extras?.consentHash || '',
    consentTermsVersion: booking.consent_terms_version || null,
    consentSignedAt: booking.consent_signed_at || null,
    createdAt: new Date(booking.created_at).toLocaleString(),
    settlementNote: booking.cancellation_reason || undefined,
    reauthorizationCount: booking.reauthorization_count ?? extras?.reauthorizationCount ?? 0,
    organizationTimezone: booking.organization_timezone || null,
  }
}

export function mapCatalogServiceToSalonService(service: CatalogService): SalonService {
  const price = Number(service.base_price) || 0
  const platformCommission = Number(service.platform_commission_amount) || 0
  const holdFromApi = Number(service.authorization_hold_amount)
  // List cards estimate service price; checkout detail includes platform fee in the hold.
  const holdDeposit =
    Number.isFinite(holdFromApi) && holdFromApi > 0 ? holdFromApi : price + platformCommission
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
    platformCommission: platformCommission > 0 ? platformCommission : undefined,
    holdDeposit,
    noShowFee: Math.round(price * 0.5),
    description: service.description || 'Salon service',
    popular: service.is_featured || Number(service.rating_avg ?? 0) >= 4.5,
    imageUrl: catalogCoverUrl(service.images),
    organizationId: service.organization_id,
    organizationName: service.organization_name || undefined,
    distanceKm: Number.isFinite(distanceKm) ? distanceKm : undefined,
    rating:
      typeof service.rating_avg === 'number' && service.rating_avg > 0
        ? service.rating_avg
        : undefined,
    reviewsCount: service.review_count ?? 0,
    isFeatured: service.is_featured ?? false,
    featuredBadge: service.featured_badge || undefined,
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
