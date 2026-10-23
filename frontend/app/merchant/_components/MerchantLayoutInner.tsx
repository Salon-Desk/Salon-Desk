'use client'

import { ShieldCheck } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { type ReactNode, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'

import { ConsoleShell } from '@/components/layout/ConsoleShell'
import { PortalGuard } from '@/components/layout/PortalGuard'
import { toastColor } from '@/constant/toast-color'
import { useMerchantSession } from '@/hooks/use-merchant-session'
import { openAgentChat } from '@/hooks/useAgentUiActions'
import {
  buildMerchantLayoutBookingsSnapshotApiParams,
  buildMerchantLayoutChangeRequestsSnapshotApiParams,
  buildMerchantLayoutEmployeesSnapshotApiParams,
  buildMerchantLayoutServicesSnapshotApiParams,
} from '@/lib/listing-params/merchant-dashboard-snapshot-list-params'
import { mapBookingStatusToHoldState } from '@/lib/mappers/booking'
import type { AppDispatch } from '@/store'
import {
  useCreateMyChangeRequestMutation,
  useGetMyChangeRequestsQuery,
  useGetMyEmployeesQuery,
  useGetMyOrgAccountQuery,
  useGetMyOrganizationQuery,
  useGetMyOrgBookingsQuery,
  useGetMyServicesQuery,
} from '@/store/api/orgApi'
import { logout, userSelector } from '@/store/authSlice'

import { useMerchantContext } from '../_context/merchant-context'
import { getMerchantTabFromPathname } from '../_types/merchant-types'
import { ConsentModal } from './ConsentModal'
import { MerchantHeader } from './MerchantHeader'
import { MerchantSidebar } from './MerchantSidebar'
import { PaypalChangeModal } from './PaypalChangeModal'
import { PolicyChangeModal } from './PolicyChangeModal'
import { SettlementDialog } from './SettlementDialog'

interface MerchantLayoutInnerProps {
  children: ReactNode
}

export function MerchantLayoutInner({ children }: MerchantLayoutInnerProps) {
  const pathname = usePathname()
  const currentTab = getMerchantTabFromPathname(pathname)
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector(userSelector)
  const { skipOrgApi } = useMerchantSession()

  const { data: org } = useGetMyOrganizationQuery(undefined, { skip: skipOrgApi })
  const { data: account } = useGetMyOrgAccountQuery(undefined, { skip: skipOrgApi })
  const { data: apiBookingsData } = useGetMyOrgBookingsQuery(
    buildMerchantLayoutBookingsSnapshotApiParams(),
    { skip: skipOrgApi },
  )
  const { data: employeesData } = useGetMyEmployeesQuery(
    buildMerchantLayoutEmployeesSnapshotApiParams(),
    { skip: skipOrgApi },
  )
  const { data: servicesData } = useGetMyServicesQuery(
    buildMerchantLayoutServicesSnapshotApiParams(),
    { skip: skipOrgApi },
  )
  const { data: changeRequestsData } = useGetMyChangeRequestsQuery(
    buildMerchantLayoutChangeRequestsSnapshotApiParams(),
    { skip: skipOrgApi },
  )

  const apiBookings = apiBookingsData?.items ?? []
  const employees = employeesData?.items ?? []
  const services = servicesData?.items ?? []
  const changeRequests = changeRequestsData?.items ?? []
  const [createChangeRequest, { isLoading: submittingCr }] = useCreateMyChangeRequestMutation()

  const activeHoldsCount = useMemo(
    () =>
      apiBookings.filter((b) => {
        const hold = mapBookingStatusToHoldState(b.status)
        return hold === 'HELD' || hold === 'REAUTHORIZED'
      }).length,
    [apiBookings],
  )
  const pendingChangeRequests = useMemo(
    () => changeRequests.filter((cr) => cr.status.toUpperCase() === 'PENDING').length,
    [changeRequests],
  )

  const {
    state,
    toastMessage,
    idempotencyToast,

    selectedBooking,
    setSelectedBooking,
    isSettlementProcessing,
    inspectConsentBooking,
    setInspectConsentBooking,

    isChangePaypalOpen,
    setIsChangePaypalOpen,

    isChangePolicyOpen,
    setIsChangePolicyOpen,
    policyForm,

    settlement,
    handleToggleDrift,

    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useMerchantContext()

  // Show toast when toastMessage changes
  useEffect(() => {
    if (toastMessage) {
      toast.success(toastMessage, toastColor.success)
    }
  }, [toastMessage])

  // Show idempotency toast when it changes
  useEffect(() => {
    if (idempotencyToast) {
      toast(idempotencyToast, {
        icon: <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />,
        className: 'border-emerald-500/50 bg-emerald-950/90 text-emerald-200',
      })
    }
  }, [idempotencyToast])

  const ownerDisplayName =
    [user?.profile?.first_name, user?.profile?.last_name].filter(Boolean).join(' ') ||
    user?.email?.split('@')[0] ||
    org?.name ||
    'Salon Owner'

  const salon = {
    ...state.salon,
    id: org?.id || state.salon.id,
    name: org?.name || state.salon.name,
    ownerName: ownerDisplayName,
    email: user?.email || state.salon.email,
    paypalMerchantId: account?.merchant_id || state.salon.paypalMerchantId,
  }

  const handleLockSession = () => {
    dispatch(logout('merchant'))
  }

  return (
    <PortalGuard portal="merchant">
      <ConsoleShell
        isMobileSidebarOpen={isMobileSidebarOpen}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
        sidebar={
          <MerchantSidebar
            salon={salon}
            activeTab={currentTab}
            activeHoldsCount={activeHoldsCount}
            bookingsCount={apiBookings.length}
            staffCount={employees.length}
            servicesCount={services.length}
            pendingChangeRequests={pendingChangeRequests}
            onOpenCopilot={() => openAgentChat('chat')}
            onLockSession={handleLockSession}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        }
        header={
          <MerchantHeader
            activeTab={currentTab}
            lastReconciledAt={state.lastReconciledAt}
            simulatedDrift={state.simulatedDrift}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onToggleDrift={handleToggleDrift}
          />
        }
      >
        <div className="animate-in fade-in duration-200">{children}</div>
      </ConsoleShell>

      {selectedBooking ? (
        <SettlementDialog
          booking={selectedBooking}
          isSettlementProcessing={isSettlementProcessing}
          onClose={() => setSelectedBooking(null)}
          onMarkShow={settlement.handleMarkShow}
          onMarkNoShow={settlement.handleMarkNoShow}
          onCancelAndVoid={settlement.handleCancelAndVoid}
          onReauthorizeHold={settlement.handleReauthorizeHold}
        />
      ) : null}

      {inspectConsentBooking ? (
        <ConsentModal
          booking={inspectConsentBooking}
          onClose={() => setInspectConsentBooking(null)}
        />
      ) : null}

      <PaypalChangeModal
        open={isChangePaypalOpen}
        currentMerchantId={account?.merchant_id || state.salon.paypalMerchantId}
        isLoading={submittingCr}
        onClose={() => setIsChangePaypalOpen(false)}
        onSubmit={async (merchantId) => {
          try {
            await createChangeRequest({
              request_type: 'PAYPAL_ACCOUNT',
              payload_json: {
                merchant_id: merchantId,
                display_name: org?.name || merchantId,
                currency: account?.currency || 'USD',
              },
              current_snapshot_json: {
                merchant_id: account?.merchant_id || state.salon.paypalMerchantId,
              },
            }).unwrap()
            toast.success('PayPal change request submitted', toastColor.success)
            setIsChangePaypalOpen(false)
          } catch (err) {
            toast.error(
              String((err as { data?: { detail?: string } })?.data?.detail || 'Submit failed'),
              toastColor.error,
            )
          }
        }}
      />

      <PolicyChangeModal
        open={isChangePolicyOpen}
        policyHours={policyForm.policyHours}
        noShowFee={policyForm.noShowFee}
        isLoading={submittingCr}
        onClose={() => setIsChangePolicyOpen(false)}
        onSubmit={async (next) => {
          try {
            await createChangeRequest({
              request_type: 'CANCELLATION_POLICY',
              payload_json: {
                name: 'Updated policy',
                data: {
                  free_cancel_hours: next.policyHours,
                  no_show_fee: next.noShowFee,
                  hold_percent: 100,
                },
              },
              current_snapshot_json: {
                policyHours: policyForm.policyHours,
                noShowFee: policyForm.noShowFee,
              },
            }).unwrap()
            toast.success('Policy amendment submitted', toastColor.success)
            setIsChangePolicyOpen(false)
          } catch (err) {
            toast.error(
              String((err as { data?: { detail?: string } })?.data?.detail || 'Submit failed'),
              toastColor.error,
            )
          }
        }}
      />
    </PortalGuard>
  )
}
