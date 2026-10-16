'use client'

import {
  ArrowRight,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Loader2,
  Scissors,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Card, HoldStateBadge } from '@/components/ui'
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
  useGetMyServicesQuery,
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
  const {
    data: apiBookings = [],
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useGetMyOrgBookingsQuery()
  const { data: changeRequests = [] } = useGetMyChangeRequestsQuery()
  const { data: services = [] } = useGetMyServicesQuery()

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
  const pendingChangeRequests = changeRequests.filter(
    (cr) => cr.status.toUpperCase() === 'PENDING',
  ).length

  const isSettlementProcessing = markingShow || markingNoShow || cancelling
  const isLoading = orgLoading || bookingsLoading

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 animate-in fade-in duration-300">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/60 to-amber-50/20 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] sm:p-6">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/80 bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-800 text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PayPal Orders v2 Rails Active
              </span>
              <span className="text-slate-300 text-xs">·</span>
              <span className="font-mono text-slate-600 text-xs font-semibold">
                {org?.name || (isLoading ? 'Loading…' : 'Your Salon')}
              </span>
            </div>
            <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight sm:text-3xl">
              Salon Operations Console
            </h1>
            <p className="max-w-2xl text-slate-600 text-xs sm:text-sm">
              <span className="font-bold text-slate-900">{activeHoldsCount} active holds</span>{' '}
              safeguarding{' '}
              <span className="font-bold text-amber-900">{formatUsd(activeHoldsVolume)}</span> in
              zero-debit customer authorization volume.
              {account?.merchant_id ? (
                <>
                  {' '}
                  · Connected PayPal Merchant:{' '}
                  <span className="font-mono text-slate-800 font-semibold">
                    {account.merchant_id}
                  </span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={ROUTES.merchantCalendar}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 py-2 font-semibold text-slate-700 text-xs shadow-xs transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-slate-500" />
              <span>Timeline Calendar</span>
            </Link>
            <PrimaryButton
              title="AI Copilot"
              size="sm"
              fullWidth={false}
              icon={<Sparkles className="h-3.5 w-3.5" />}
              className="h-9 rounded-lg px-3.5 text-xs font-semibold shadow-xs"
              onClick={() => setIsCopilotOpen(true)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading console metrics…
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Active Holds
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
              {activeHoldsCount}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span>{formatUsd(activeHoldsVolume)} held in escrow</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Captured Revenue
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
              {formatUsd(capturedRevenue)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span>Completed client bookings</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Active Services
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Scissors className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
              {services.length}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span>Published on client discovery catalog</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {pendingChangeRequests}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span>Policy & payout amendments</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Launchpad Navigation */}
      {/* Quick Launchpad Navigation */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href={ROUTES.merchantCalendar}
          className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-amber-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 transition-colors group-hover:bg-amber-100">
              <CalendarIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Schedule Calendar</div>
              <div className="text-[11px] text-slate-500">Stylist timelines & slots</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <Link
          href={ROUTES.merchantAppointments}
          className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-sky-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-700 transition-colors group-hover:bg-sky-100">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">All Appointments</div>
              <div className="text-[11px] text-slate-500">{bookings.length} reservations</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <Link
          href={ROUTES.merchantServices}
          className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-emerald-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100">
              <Scissors className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Service Catalog</div>
              <div className="text-[11px] text-slate-500">Prices, holds & durations</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <Link
          href={ROUTES.merchantStaff}
          className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-purple-400 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-700 transition-colors group-hover:bg-purple-100">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Stylists & Team</div>
              <div className="text-[11px] text-slate-500">Staff roster & roles</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Recent Bookings Queue */}
      <Card
        padding="lg"
        className="space-y-4 rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      >
        <div className="flex items-center justify-between border-slate-100 border-b pb-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">Recent Bookings Queue</h2>
            <p className="text-slate-500 text-xs">
              Live reservations with PayPal authorization hold guarantees.
            </p>
          </div>
          <Link
            href={ROUTES.merchantAppointments}
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-1">
            <CalendarIcon className="mx-auto h-8 w-8 text-slate-300" />
            <p className="font-semibold text-slate-600 text-sm">No reservations logged yet</p>
            <p>New appointments made by clients will appear in this queue in real time.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookings.slice(0, 6).map((b) => (
              <div
                key={b.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200/70 bg-slate-50/50 p-3.5 transition-all hover:bg-slate-50 hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-950 font-bold text-xs text-white">
                    {b.clientName ? b.clientName.slice(0, 2).toUpperCase() : 'CL'}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        {b.clientName || 'Valued Client'}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-semibold text-xs text-stone-700">{b.serviceName}</span>
                      <HoldStateBadge status={b.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Stylist: {b.stylistName}</span>
                      <span>·</span>
                      <span className="font-medium text-slate-700">{b.appointmentTime}</span>
                      <span>·</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        Ref: {b.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="pt-0.5 text-xs text-slate-600 font-mono">
                      <span>Total: {formatUsd(b.servicePrice)}</span>
                      <span className="mx-1.5 text-slate-300">|</span>
                      <span className="text-amber-800 font-semibold">
                        Hold: {formatUsd(b.holdAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <PrimaryButton
                    title="Inspect Hold"
                    variant="outline"
                    size="sm"
                    fullWidth={false}
                    className="h-8 rounded-lg px-3 text-xs"
                    onClick={() => setInspectConsentBooking(b)}
                  />
                  <PrimaryButton
                    title="Settle"
                    size="sm"
                    fullWidth={false}
                    className="h-8 rounded-lg px-3 text-xs font-semibold shadow-xs"
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
                void refetchBookings()
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
                void refetchBookings()
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
                void refetchBookings()
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
