'use client'

import { ShieldCheck, Sparkles } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { type ReactNode, Suspense, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'

import { ConsoleShell } from '@/components/layout/console-shell'
import { PortalGuard } from '@/components/layout/portal-guard'
import { Toast } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { useMerchantSession } from '@/hooks/use-merchant-session'
import { mapBookingStatusToHoldState } from '@/lib/mappers/booking'
import type { AppDispatch } from '@/store/app'
import { logout } from '@/store/authSlice'
import {
  useCreateMyChangeRequestMutation,
  useGetMyChangeRequestsQuery,
  useGetMyEmployeesQuery,
  useGetMyOrgAccountQuery,
  useGetMyOrganizationQuery,
  useGetMyOrgBookingsQuery,
  useGetMyServicesQuery,
} from '@/store/slice/organizationApi'

import { ConsentModal } from './_components/consent-modal'
import { CopilotDrawer } from './_components/copilot-drawer'
import { MerchantHeader } from './_components/merchant-header'
import { MerchantSidebar } from './_components/merchant-sidebar'
import { PaypalChangeModal, PolicyChangeModal } from './_components/settings-modals'
import { SettlementDrawer } from './_components/settlement-drawer'
import { MerchantProvider, useMerchantContext } from './_context/merchant-context'
import { getMerchantTabFromPathname } from './_types/merchant-types'

function MerchantLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const currentTab = getMerchantTabFromPathname(pathname)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const { skipOrgApi } = useMerchantSession()

  const { data: org } = useGetMyOrganizationQuery(undefined, { skip: skipOrgApi })
  const { data: account } = useGetMyOrgAccountQuery(undefined, { skip: skipOrgApi })
  const { data: apiBookingsData } = useGetMyOrgBookingsQuery(undefined, { skip: skipOrgApi })
  const { data: employeesData } = useGetMyEmployeesQuery(undefined, { skip: skipOrgApi })
  const { data: servicesData } = useGetMyServicesQuery(undefined, { skip: skipOrgApi })
  const { data: changeRequestsData } = useGetMyChangeRequestsQuery(undefined, { skip: skipOrgApi })

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
    dismissToast,
    idempotencyToast,

    selectedBooking,
    setSelectedBooking,
    isSettlementProcessing,
    inspectConsentBooking,
    setInspectConsentBooking,
    isCopilotOpen,
    setIsCopilotOpen,

    isChangePaypalOpen,
    setIsChangePaypalOpen,

    isChangePolicyOpen,
    setIsChangePolicyOpen,
    policyForm,

    settlement,
    handleExecuteRefundProposal,
    handleToggleDrift,
  } = useMerchantContext()

  const salon = {
    ...state.salon,
    id: org?.id || state.salon.id,
    name: org?.name || state.salon.name,
  }

  const handleLockSession = () => {
    dispatch(logout('merchant'))
  }

  return (
    <PortalGuard portal="merchant">
      {toastMessage ? (
        <Toast
          message={toastMessage}
          onDismiss={dismissToast}
          position="top-right"
          theme="dark"
          icon={<Sparkles className="h-4 w-4 shrink-0 text-amber-400" />}
        />
      ) : null}

      {idempotencyToast ? (
        <output
          aria-live="polite"
          className="fixed top-20 right-5 z-50 max-w-md animate-in space-y-1 rounded-xl border border-emerald-500/50 bg-emerald-950/90 p-4 text-emerald-200 text-xs shadow-2xl backdrop-blur-md fade-in"
        >
          <div className="flex items-center gap-2 font-bold text-emerald-300">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Idempotency Guarantee Enforced</span>
          </div>
          <p className="text-[11px] text-emerald-100 leading-snug">{idempotencyToast}</p>
        </output>
      ) : null}

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
            onOpenCopilot={() => setIsCopilotOpen(true)}
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
        <SettlementDrawer
          booking={selectedBooking}
          isSettlementProcessing={isSettlementProcessing}
          onClose={() => setSelectedBooking(null)}
          onMarkShow={settlement.handleMarkShow}
          onMarkNoShow={settlement.handleMarkNoShow}
          onCancelAndVoid={settlement.handleCancelAndVoid}
          onReauthorizeHold={settlement.handleReauthorizeHold}
        />
      ) : null}

      {isCopilotOpen ? (
        <CopilotDrawer
          bookings={state.bookings}
          onClose={() => setIsCopilotOpen(false)}
          onExecuteRefund={handleExecuteRefundProposal}
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

export default function MerchantLayout({ children }: { children: ReactNode }) {
  return (
    <MerchantProvider>
      <Suspense fallback={null}>
        <MerchantLayoutInner>{children}</MerchantLayoutInner>
      </Suspense>
    </MerchantProvider>
  )
}
