'use client'

import { Loader2, MessageSquareQuote, Star } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'

import { Button } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import {
  useGetCatalogOrganizationQuery,
  useGetCatalogOrgFeedbackQuery,
  useGetCatalogOrgStaffQuery,
  useGetMyBookingsQuery,
  useGetMyFeedbackQuery,
  useSubmitClientFeedbackMutation,
} from '@/store/api/clientApi'
import { isAuthenticatedSelector, isClientUser, userSelector } from '@/store/authSlice'
import type { ApiBooking } from '@/types/api-booking'
import type { ClientFeedbackItem } from '@/types/api-feedback'

function StarRatingInput({
  value,
  onChange,
}: {
  value: number
  onChange: (rating: number) => void
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`Rate ${star} stars`}
          onClick={() => onChange(star)}
          className="rounded-md p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={
              star <= value ? 'h-6 w-6 fill-amber-400 text-amber-400' : 'h-6 w-6 text-stone-300'
            }
          />
        </button>
      ))}
    </div>
  )
}

function ReviewCard({
  title,
  subtitle,
  rating,
  comment,
  dateLabel,
}: {
  title: string
  subtitle?: string | null
  rating: number
  comment?: string | null
  dateLabel: string
}) {
  return (
    <article className="rounded-2xl border border-stone-200/70 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-950">{title}</p>
          {subtitle ? <p className="truncate text-xs text-stone-500">{subtitle}</p> : null}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {rating.toFixed(1)}
        </span>
      </div>
      {comment ? (
        <p className="text-sm leading-relaxed text-stone-600">{comment}</p>
      ) : (
        <p className="text-sm italic text-stone-400">No written comment.</p>
      )}
      <p className="mt-2 text-[11px] text-stone-400">{dateLabel}</p>
    </article>
  )
}

export function ClientSalonFeedbackSection({ orgId }: { orgId: string }) {
  const user = useSelector(userSelector)
  const isAuthenticated = useSelector(isAuthenticatedSelector)
  const canReview = isAuthenticated && isClientUser(user)

  const { data: org, isLoading: orgLoading } = useGetCatalogOrganizationQuery(orgId)
  const { data: staffPage } = useGetCatalogOrgStaffQuery(orgId)
  const { data: allReviewsPage, isLoading: reviewsLoading } = useGetCatalogOrgFeedbackQuery({
    orgId,
    page_size: 24,
  })

  const staff = staffPage?.items ?? []
  const { salonReviews, stylistReviews } = useMemo(() => {
    const items = allReviewsPage?.items ?? []
    return {
      salonReviews: items.filter((r) => !r.stylist_id),
      stylistReviews: items.filter((r) => r.stylist_id),
    }
  }, [allReviewsPage?.items])

  const { data: bookingsData } = useGetMyBookingsQuery(undefined, { skip: !canReview })
  const { data: myFeedback = [] } = useGetMyFeedbackQuery(undefined, { skip: !canReview })

  const hasSalonReview = (bookingId: string) =>
    myFeedback.some((f) => f.booking_id === bookingId && !f.stylist_id)
  const hasStylistReview = (bookingId: string) =>
    myFeedback.some((f) => f.booking_id === bookingId && f.stylist_id)

  const completedBookings = useMemo(
    () =>
      (bookingsData?.items ?? []).filter(
        (b: ApiBooking) => b.org_id === orgId && String(b.status).toUpperCase() === 'COMPLETED',
      ),
    [bookingsData?.items, orgId],
  )

  const salonReviewableBookings = useMemo(
    () => completedBookings.filter((b) => !hasSalonReview(b.id)),
    [completedBookings, myFeedback],
  )

  const [submitFeedback, { isLoading: submitting }] = useSubmitClientFeedbackMutation()
  const [bookingId, setBookingId] = useState('')
  const [target, setTarget] = useState<'organization' | 'stylist'>('organization')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const selectedBooking = completedBookings.find((b) => b.id === bookingId)

  const handleSubmit = async () => {
    if (!bookingId) {
      toast.error('Choose a completed visit to review', toastColor.error)
      return
    }
    if (target === 'organization' && hasSalonReview(bookingId)) {
      toast.error('You already submitted a salon review for this visit', toastColor.error)
      return
    }
    if (target === 'stylist' && hasStylistReview(bookingId)) {
      toast.error('You already submitted a stylist review for this visit', toastColor.error)
      return
    }
    try {
      await submitFeedback({
        booking_id: bookingId,
        rating,
        comment: comment.trim() || null,
        stylist_id:
          target === 'stylist' && selectedBooking?.stylist_id ? selectedBooking.stylist_id : null,
      }).unwrap()
      toast.success(
        'Thanks! Your review was submitted and will appear after SalonDesk moderation.',
        toastColor.success,
      )
      setComment('')
      setBookingId('')
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not submit feedback'
      toast.error(String(message), toastColor.error)
    }
  }

  if (orgLoading) {
    return (
      <div className="mb-8 flex justify-center py-8 text-sm text-stone-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-amber-600" />
        Loading salon profile…
      </div>
    )
  }

  const salonRating = org?.rating_avg ?? 0
  const salonReviewCount = org?.review_count ?? 0

  return (
    <section id="salon-reviews" className="mb-10 scroll-mt-24 space-y-8">
      <div className="rounded-3xl border border-stone-200/70 bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {org?.picture ? (
              <Image
                src={org.picture}
                alt=""
                width={64}
                height={64}
                unoptimized={shouldUnoptimizeImage(org.picture)}
                className="h-16 w-16 rounded-2xl object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                <MessageSquareQuote className="h-7 w-7" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="font-serif text-2xl text-stone-950">{org?.name ?? 'Salon'}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-stone-500">
                {org?.description ||
                  org?.physical_address ||
                  'Client reviews from verified visits.'}
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-stone-700">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{salonRating.toFixed(2)}</span>
                <span className="text-stone-400">
                  ({salonReviewCount} salon review{salonReviewCount === 1 ? '' : 's'})
                </span>
              </p>
            </div>
          </div>
        </div>

        {staff.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {staff.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50/80 px-3 py-2.5"
              >
                {member.picture ? (
                  <Image
                    src={member.picture}
                    alt=""
                    width={40}
                    height={40}
                    unoptimized={shouldUnoptimizeImage(member.picture)}
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-900">
                    {member.display_name}
                  </p>
                  <p className="text-[11px] text-stone-500">{member.role}</p>
                  <p className="text-xs text-stone-600">
                    <Star className="mr-0.5 inline h-3 w-3 fill-amber-400 text-amber-400" />
                    {member.rating_avg.toFixed(2)} ({member.review_count})
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <p className="text-xs text-stone-500">
        Only approved reviews are shown publicly. Ratings update after platform admin moderation.
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-900">
            Salon reviews
          </h3>
          {reviewsLoading ? (
            <p className="text-sm text-stone-500">Loading reviews…</p>
          ) : salonReviews.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-6 text-sm text-stone-500">
              No salon reviews yet. Be the first after your visit.
            </p>
          ) : (
            <div className="space-y-3">
              {salonReviews.map((review: ClientFeedbackItem) => (
                <ReviewCard
                  key={review.id}
                  title={review.client_name || 'Client'}
                  subtitle={review.service_name}
                  rating={review.rating}
                  comment={review.comment}
                  dateLabel={new Date(review.created_at).toLocaleDateString()}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-900">
            Stylist reviews
          </h3>
          {stylistReviews.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-6 text-sm text-stone-500">
              Stylist-specific reviews appear here after clients rate their professional.
            </p>
          ) : (
            <div className="space-y-3">
              {stylistReviews.slice(0, 8).map((review: ClientFeedbackItem) => (
                <ReviewCard
                  key={review.id}
                  title={review.stylist_name || 'Stylist'}
                  subtitle={`${review.client_name || 'Client'} · ${review.service_name || 'Service'}`}
                  rating={review.rating}
                  comment={review.comment}
                  dateLabel={new Date(review.created_at).toLocaleDateString()}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {canReview ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
          <h3 className="font-serif text-xl text-stone-950">Share your experience</h3>
          <p className="mt-1 text-sm text-stone-500">
            You may review each completed visit once for the salon and once for your stylist (if
            assigned). Reviews publish after platform approval.
          </p>
          {completedBookings.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">
              Complete a service at this salon to leave feedback.
            </p>
          ) : salonReviewableBookings.length === 0 &&
            !completedBookings.some((b) => b.stylist_id && !hasStylistReview(b.id)) ? (
            <p className="mt-4 text-sm text-stone-500">
              You have submitted all available reviews for completed visits at this salon.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              <label className="block text-xs font-medium text-stone-600">
                Completed visit
                <select
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900"
                >
                  <option value="">Select appointment…</option>
                  {completedBookings.map((b) => {
                    const salonDone = hasSalonReview(b.id)
                    const stylistDone = !b.stylist_id || hasStylistReview(b.id)
                    if (salonDone && stylistDone) return null
                    return (
                      <option key={b.id} value={b.id}>
                        {b.service_name || 'Service'} · {new Date(b.starts_at).toLocaleDateString()}
                        {salonDone ? ' · salon reviewed' : ''}
                        {b.stylist_id && stylistDone ? ' · stylist reviewed' : ''}
                      </option>
                    )
                  })}
                </select>
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!selectedBooking || hasSalonReview(selectedBooking.id)}
                  onClick={() => setTarget('organization')}
                  className={
                    target === 'organization'
                      ? 'rounded-full bg-stone-950 px-4 py-2 text-xs font-semibold text-white'
                      : 'rounded-full border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700 disabled:opacity-40'
                  }
                >
                  Rate the salon
                </button>
                <button
                  type="button"
                  disabled={
                    !selectedBooking?.stylist_id || hasStylistReview(selectedBooking?.id ?? '')
                  }
                  onClick={() => setTarget('stylist')}
                  className={
                    target === 'stylist'
                      ? 'rounded-full bg-stone-950 px-4 py-2 text-xs font-semibold text-white'
                      : 'rounded-full border border-stone-200 px-4 py-2 text-xs font-medium text-stone-700 disabled:opacity-40'
                  }
                >
                  Rate your stylist
                </button>
              </div>

              <StarRatingInput value={rating} onChange={setRating} />

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="What went well? (optional)"
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400"
              />

              <Button
                variant="dark"
                className="rounded-full"
                disabled={submitting}
                onClick={() => void handleSubmit()}
              >
                {submitting ? 'Submitting…' : 'Submit feedback'}
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}
