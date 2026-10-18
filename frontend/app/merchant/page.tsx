'use client'

import {
  ArrowRight,
  Calendar as CalendarIcon,
  DollarSign,
  Loader2,
  Scissors,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { LineTrendChart } from '@/components/chart/LineTrendChart'
import { Card, EmptyState, HoldStateBadge } from '@/components/ui'
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
    data: apiBookingsData,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useGetMyOrgBookingsQuery()
  const { data: changeRequestsData } = useGetMyChangeRequestsQuery()
  const { data: servicesData } = useGetMyServicesQuery()

  const apiBookings = apiBookingsData?.items ?? []
  const changeRequests = changeRequestsData?.items ?? []
  const services = servicesData?.items ?? []

  const [markShow] = useMarkBookingShowMutation()
  const [markNoShow] = useMarkBookingNoShowMutation()
  const [cancelBooking] = useCancelBookingMutation()

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

  const revenueTrend = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((day, i) => ({
      day,
      revenue: Math.round(capturedRevenue * (0.4 + i * 0.08) + activeHoldsVolume * 0.05 * i),
    }))
  }, [capturedRevenue, activeHoldsVolume])

  const isLoading = orgLoading || bookingsLoading

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {org?.name || 'Salon dashboard'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeHoldsCount} active holds · {formatUsd(activeHoldsVolume)} escrow
            {account?.merchant_id ? ` · ${account.merchant_id}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={ROUTES.merchantCalendar}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            Calendar
          </Link>
          <PrimaryButton
            title="AI Copilot"
            size="sm"
            fullWidth={false}
            icon={<Sparkles className="h-3.5 w-3.5" />}
            className="h-9 rounded-full px-3.5 text-xs font-semibold"
            onClick={() => setIsCopilotOpen(true)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading metrics…
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Active holds
            </span>
            <ShieldCheck className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{activeHoldsCount}</p>
          <p className="mt-1 text-xs text-slate-500">{formatUsd(activeHoldsVolume)} escrow</p>
        </Card>
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Captured revenue
            </span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            {formatUsd(capturedRevenue)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Completed bookings</p>
        </Card>
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Services
            </span>
            <Scissors className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{services.length}</p>
          <p className="mt-1 text-xs text-slate-500">In your catalog</p>
        </Card>
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pending requests
            </span>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{pendingChangeRequests}</p>
          <p className="mt-1 text-xs text-slate-500">Policy updates</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-none lg:col-span-7">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Revenue outlook</h2>
            <p className="text-xs text-slate-500">Based on captured volume and open holds</p>
          </div>
          <LineTrendChart
            data={revenueTrend}
            dataKey="revenue"
            xKey="day"
            heightClassName="h-[220px]"
            yDomain={['auto', 'auto']}
            yAxisLabel="USD"
            valueSuffix=""
            seriesLabel="Revenue"
            strokeColor="#0f172a"
            dotColor="#f59e0b"
          />
        </Card>

        <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-none lg:col-span-5">
          <h2 className="text-sm font-bold text-slate-900">Quick links</h2>
          <div className="mt-3 space-y-2">
            {[
              { href: ROUTES.merchantCalendar, label: 'Calendar', hint: 'Timeline & slots' },
              {
                href: ROUTES.merchantAppointments,
                label: 'Appointments',
                hint: `${bookings.length} total`,
              },
              {
                href: ROUTES.merchantServices,
                label: 'Services',
                hint: `${services.length} live`,
              },
              { href: ROUTES.merchantStaff, label: 'Staff', hint: 'Team roster' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-xs transition-colors hover:border-slate-200 hover:bg-slate-100/80"
              >
                <div>
                  <p className="font-bold text-slate-900">{item.label}</p>
                  <p className="text-[11px] text-slate-500">{item.hint}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent bookings</h2>
            <p className="text-xs text-slate-500">Latest holds and settlements</p>
          </div>
          <Link
            href={ROUTES.merchantAppointments}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {bookings.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="No reservations yet"
            description="New client appointments will show up here as soon as they book."
            actionLabel="Open calendar"
            onAction={() => {
              window.location.href = ROUTES.merchantCalendar
            }}
            variant="console"
          />
        ) : (
          <div className="space-y-2">
            {bookings.slice(0, 6).map((b) => (
              <div
                key={b.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-slate-50/50 p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {b.clientName || 'Client'}
                    </span>
                    <span className="text-xs font-semibold text-stone-700">{b.serviceName}</span>
                    <HoldStateBadge status={b.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {b.appointmentTime} · Hold {formatUsd(b.holdAmount)}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <PrimaryButton
                    title="Inspect"
                    variant="outline"
                    size="sm"
                    fullWidth={false}
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => setInspectConsentBooking(b)}
                  />
                  <PrimaryButton
                    title="Settle"
                    size="sm"
                    fullWidth={false}
                    className="h-8 rounded-full px-3 text-xs font-semibold"
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
          isSettlementProcessing={false}
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
