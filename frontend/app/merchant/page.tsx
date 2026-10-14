'use client'

import {
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Card, HoldStateBadge, StatCard } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { ROUTES } from '@/lib/constants'
import { formatUsd } from '@/lib/format'
import { mapApiBookingToUi } from '@/lib/mappers/booking'
import { useCancelBookingMutation } from '@/store/slice/bookingsApi'
import {
  useGetMyChangeRequestsQuery,
  useGetMyOrgAccountQuery,
  useGetMyOrganizationQuery,
  useGetMyOrgBookingsQuery,
} from '@/store/slice/organizationApi'
import { useMarkBookingNoShowMutation, useMarkBookingShowMutation } from '@/store/slice/paymentsApi'
import type { Booking } from '@/types'

import { ConsentModal } from './_components/consent-modal'
import { SettlementDrawer } from './_components/settlement-drawer'
import { useMerchantContext } from './_context/merchant-context'

export default function MerchantDashboardPage() {
  const { setIsCopilotOpen } = useMerchantContext()
  const { data: org, isLoading: orgLoading } = useGetMyOrganizationQuery()
  const { data: account } = useGetMyOrgAccountQuery()
  const { data: apiBookings = [], isLoading: bookingsLoading } = useGetMyOrgBookingsQuery()
  const { data: changeRequests = [] } = useGetMyChangeRequestsQuery()

  const [markShow, { isLoading: markingShow }] = useMarkBookingShowMutation()
  const [markNoShow, { isLoading: markingNoShow }] = useMarkBookingNoShowMutation()
  const [cancelBooking, { isLoading: cancelling }] = useCancelBookingMutation()

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [inspectConsentBooking, setInspectConsentBooking] = useState<Booking | null>(null)

  const bookings = useMemo(
    () => apiBookings.map((b) => mapApiBookingToUi(b, { salonName: org?.name })),
    [apiBookings, org?.name],
  )

  const activeHolds = bookings.filter((b) => b.status === 'HELD' || b.status === 'REAUTHORIZED')
  const activeHoldsCount = activeHolds.length
  const activeHoldsVolume = activeHolds.reduce((sum, b) => sum + b.holdAmount, 0)
  const capturedRevenue = bookings
    .filter((b) => b.status === 'CAPTURED')
    .reduce((sum, b) => sum + b.servicePrice, 0)
  const noShowRecovered = bookings
    .filter((b) => b.status === 'NO_SHOW_CAPTURED')
    .reduce((sum, b) => sum + b.noShowFee, 0)
  const pendingChangeRequests = changeRequests.filter(
    (cr) => cr.status.toUpperCase() === 'PENDING',
  ).length

  const isSettlementProcessing = markingShow || markingNoShow || cancelling
  const isLoading = orgLoading || bookingsLoading

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/50 to-amber-50/20 p-6 shadow-xs sm:p-7">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/80 bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-800 text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PayPal Orders v2 Rails Active
              </span>
              <span className="text-slate-300 text-xs">·</span>
              <span className="font-mono text-slate-500 text-xs">
                {org?.name || (isLoading ? 'Loading…' : 'Your salon')}
              </span>
            </div>
            <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight sm:text-3xl">
              Welcome back
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm">
              <span className="font-bold text-slate-900">{activeHoldsCount} active holds</span>{' '}
              totaling{' '}
              <span className="font-bold text-amber-900">{formatUsd(activeHoldsVolume)}</span> in
              protected authorization volume.
              {account?.merchant_id ? (
                <>
                  {' '}
                  Merchant ID{' '}
                  <span className="font-mono text-slate-700">{account.merchant_id}</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={ROUTES.merchantCalendar}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-medium text-slate-700 text-xs shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-slate-500" />
              <span>Calendar</span>
            </Link>
            <PrimaryButton
              title="AI Copilot"
              size="sm"
              fullWidth={false}
              icon={<Sparkles className="h-3.5 w-3.5" />}
              className="h-9 rounded-xl px-4 text-xs font-semibold shadow-xs"
              onClick={() => setIsCopilotOpen(true)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading dashboard…
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active holds" value={String(activeHoldsCount)} icon={ShieldCheck} />
        <StatCard label="Hold volume" value={formatUsd(activeHoldsVolume)} icon={DollarSign} />
        <StatCard label="Captured" value={formatUsd(capturedRevenue)} icon={Clock} />
        <StatCard label="Pending CRs" value={String(pendingChangeRequests)} icon={Sparkles} />
      </div>

      <Card
        padding="lg"
        className="space-y-4 rounded-3xl border border-slate-200/90 bg-white shadow-xs"
      >
        <div className="flex items-center justify-between border-slate-100 border-b pb-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Recent bookings</h2>
            <p className="text-slate-500 text-xs">Live from /organizations/me/bookings</p>
          </div>
          <Link
            href={ROUTES.merchantAppointments}
            className="text-xs font-medium text-amber-800 hover:underline"
          >
            View all
          </Link>
        </div>

        {bookings.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">No bookings yet.</p>
        ) : (
          <div className="space-y-2">
            {bookings.slice(0, 6).map((b) => (
              <div
                key={b.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-500">{b.id.slice(0, 8)}</span>
                    <HoldStateBadge status={b.status} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-900">{b.appointmentTime}</p>
                  <p className="text-[11px] text-slate-500">
                    {formatUsd(b.servicePrice)} · No-show recovered pool{' '}
                    {formatUsd(noShowRecovered)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PrimaryButton
                    title="Receipt"
                    variant="outline"
                    size="sm"
                    fullWidth={false}
                    className="h-8 rounded-xl px-3 text-xs"
                    onClick={() => setInspectConsentBooking(b)}
                  />
                  <PrimaryButton
                    title="Settle"
                    size="sm"
                    fullWidth={false}
                    className="h-8 rounded-xl px-3 text-xs"
                    onClick={() => setSelectedBooking(b)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedBooking ? (
        <SettlementDrawer
          booking={selectedBooking}
          isSettlementProcessing={isSettlementProcessing}
          onClose={() => setSelectedBooking(null)}
          onMarkShow={(b) =>
            void markShow(b.id)
              .unwrap()
              .then(() => {
                toast.success('Marked show', toastColor.success)
                setSelectedBooking(null)
              })
              .catch((err) =>
                toast.error(
                  String((err as { data?: { detail?: string } })?.data?.detail || 'Failed'),
                  toastColor.error,
                ),
              )
          }
          onMarkNoShow={(b) =>
            void markNoShow(b.id)
              .unwrap()
              .then(() => {
                toast.success('No-show captured', toastColor.success)
                setSelectedBooking(null)
              })
              .catch((err) =>
                toast.error(
                  String((err as { data?: { detail?: string } })?.data?.detail || 'Failed'),
                  toastColor.error,
                ),
              )
          }
          onCancelAndVoid={(b) =>
            void cancelBooking({ bookingId: b.id, body: { reason: 'Merchant void' } })
              .unwrap()
              .then(() => {
                toast.success('Booking cancelled', toastColor.success)
                setSelectedBooking(null)
              })
              .catch((err) =>
                toast.error(
                  String((err as { data?: { detail?: string } })?.data?.detail || 'Failed'),
                  toastColor.error,
                ),
              )
          }
          onReauthorizeHold={() =>
            toast.info('Reauthorization is handled automatically by the payment honor window.')
          }
        />
      ) : null}

      {inspectConsentBooking ? (
        <ConsentModal
          booking={inspectConsentBooking}
          onClose={() => setInspectConsentBooking(null)}
        />
      ) : null}
    </div>
  )
}
