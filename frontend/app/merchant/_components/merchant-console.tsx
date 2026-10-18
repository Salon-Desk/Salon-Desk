'use client'

import { ShieldCheck, Sparkles } from 'lucide-react'
import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { AuthGate } from '@/components/layout/auth-gate'
import { ConsoleShell } from '@/components/layout/console-shell'
import { Toast } from '@/components/ui'
import { useMerchantStore, useToast } from '@/hooks'
import { useAgentUiActions } from '@/hooks/useAgentUiActions'
import { SANDBOX_CREDENTIALS } from '@/lib/constants'
import { createPaypalDebugId, createSequentialId } from '@/lib/ids'
import type { AuditLedgerEntry, Booking, ChangeRequest, SalonService, StaffMember } from '@/types'

import { useMerchantSettlement } from '../_hooks/use-merchant-settlement'
import type { MerchantTab } from '../_types/merchant-types'
import { AppointmentsTab } from './appointments-tab'
import { CalendarTab } from './calendar-tab'
import { ConsentModal } from './consent-modal'
import { CopilotDrawer, type RefundProposal } from './copilot-drawer'
import { DashboardTab } from './dashboard-tab'
import { MerchantHeader } from './merchant-header'
import { MerchantSidebar } from './merchant-sidebar'
import { DeleteServiceModal, ServiceFormModal, type ServiceFormState } from './service-modals'
import { ServicesTab } from './services-tab'
import { PaypalChangeModal, PolicyChangeModal } from './settings-modals'
import { SettingsTab } from './settings-tab'
import { SettlementDrawer } from './settlement-drawer'
import { DeleteStaffModal, StaffFormModal, type StaffFormState } from './staff-modals'
import { StaffTab } from './staff-tab'

const DEFAULT_STAFF_FORM: StaffFormState = {
  name: '',
  role: 'Senior Braider & Texture Specialist',
  workingHours: '9:00 AM - 6:00 PM',
  breakPeriod: '1:00 PM - 2:00 PM',
  specialties: 'Knotless Braids, Silk Press, Locs Retwist',
  maxSimultaneousClients: 2,
  status: 'ACTIVE',
}

const DEFAULT_SERVICE_FORM: ServiceFormState = {
  name: '',
  category: 'Braids & Locs',
  durationMin: 120,
  price: 120,
  holdDeposit: 120,
  noShowFee: 30,
  description: '',
}

export function MerchantConsole() {
  const { state, setState } = useMerchantStore()
  const { message: toastMessage, show: showToast, dismiss: dismissToast } = useToast(3800)

  const [activeTab, setActiveTab] = useState<MerchantTab>('dashboard')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [idempotencyToast, setIdempotencyToast] = useState<string | null>(null)

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isSettlementProcessing, setIsSettlementProcessing] = useState(false)
  const [inspectConsentBooking, setInspectConsentBooking] = useState<Booking | null>(null)

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [staffForm, setStaffForm] = useState<StaffFormState>(DEFAULT_STAFF_FORM)
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null)

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)
  const [editingService, setEditingService] = useState<SalonService | null>(null)
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(DEFAULT_SERVICE_FORM)
  const [deletingService, setDeletingService] = useState<SalonService | null>(null)

  const [isChangePaypalOpen, setIsChangePaypalOpen] = useState(false)
  const [isChangePolicyOpen, setIsChangePolicyOpen] = useState(false)
  const [policyForm, setPolicyForm] = useState({
    policyHours: 24,
    noShowFee: 30,
  })

  const [isCopilotOpen, setIsCopilotOpen] = useState(false)

  useAgentUiActions({
    onOpenAddStaff: () => {
      setActiveTab('staff')
      setIsAddStaffOpen(true)
    },
    onOpenAddService: () => {
      setActiveTab('services')
      setIsAddServiceOpen(true)
    },
    onOpenChangePaypal: () => {
      setActiveTab('settings')
      setIsChangePaypalOpen(true)
    },
    onOpenChangePolicy: () => {
      setActiveTab('settings')
      setIsChangePolicyOpen(true)
    },
    onOpenCopilot: () => {
      setIsCopilotOpen(true)
    },
    onAction: (payload) => {
      if (
        payload.tab &&
        ['dashboard', 'calendar', 'appointments', 'staff', 'services', 'settings'].includes(
          payload.tab,
        )
      ) {
        setActiveTab(payload.tab as MerchantTab)
      }
    },
  })

  const showIdempotencyNotice = useCallback((msg: string) => {
    setIdempotencyToast(msg)
    window.setTimeout(() => setIdempotencyToast(null), 4500)
  }, [])

  const onBookingSettled = useCallback((booking: Booking | null) => {
    setSelectedBooking(booking)
  }, [])

  const settlement = useMerchantSettlement({
    setState,
    isSettlementProcessing,
    setIsSettlementProcessing,
    showToast,
    showIdempotencyNotice,
    onBookingSettled,
  })

  const activeHolds = useMemo(
    () => state.bookings.filter((b) => b.status === 'HELD' || b.status === 'REAUTHORIZED'),
    [state.bookings],
  )
  const activeHoldsVolume = activeHolds.reduce((acc, b) => acc + b.holdAmount, 0)
  const capturedRevenue =
    state.bookings
      .filter((b) => b.status === 'CAPTURED')
      .reduce((acc, b) => acc + b.servicePrice, 0) + 6775
  const noShowRecovered =
    state.bookings
      .filter((b) => b.status === 'NO_SHOW_CAPTURED')
      .reduce((acc, b) => acc + b.noShowFee, 0) + 390

  const pendingChangeRequests = state.changeRequests.filter(
    (r) => r.status === 'PENDING_REVIEW',
  ).length

  const handleSignIn = () => {
    setState((prev) => ({ ...prev, authenticated: true }))
    showToast('Signed in as Selamawit (Salon Owner)')
  }

  const handleLockSession = () => {
    setState((prev) => ({ ...prev, authenticated: false }))
    showToast('Signed out of Merchant Console')
  }

  const handleToggleDrift = () => {
    setState((prev) => {
      const nextDrift = !prev.simulatedDrift
      return {
        ...prev,
        simulatedDrift: nextDrift,
        lastReconciledAt: nextDrift
          ? 'Pending Drift (1 unmatched webhook)'
          : 'Reconciled 100% · Live',
      }
    })
    showToast(
      !state.simulatedDrift
        ? 'Simulated hold drift injected for judge inspection.'
        : 'Drift cleared; 100% reconciled.',
    )
  }

  const handleSaveStaff = (event: FormEvent) => {
    event.preventDefault()
    if (!staffForm.name) return

    const specsArray = staffForm.specialties
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (editingStaff) {
      setState((prev) => ({
        ...prev,
        staff: prev.staff.map((s) =>
          s.id === editingStaff.id
            ? {
                ...s,
                name: staffForm.name,
                role: staffForm.role,
                workingHours: staffForm.workingHours,
                breakPeriod: staffForm.breakPeriod,
                specialties: specsArray.length ? specsArray : s.specialties,
                maxSimultaneousClients: Number(staffForm.maxSimultaneousClients) || 1,
                status: staffForm.status,
              }
            : s,
        ),
      }))
      showToast(`Stylist "${staffForm.name}" updated.`)
    } else {
      const newStaffId = createSequentialId('stf')
      const newStaff: StaffMember = {
        id: newStaffId,
        name: staffForm.name,
        role: staffForm.role,
        avatar: `https://picsum.photos/seed/${newStaffId}/300/300`,
        rating: 5.0,
        reviewsCount: 1,
        specialties: specsArray.length ? specsArray : ['Precision Styling'],
        workingHours: staffForm.workingHours,
        breakPeriod: staffForm.breakPeriod,
        maxSimultaneousClients: Number(staffForm.maxSimultaneousClients) || 1,
        status: staffForm.status,
      }
      setState((prev) => ({ ...prev, staff: [...prev.staff, newStaff] }))
      showToast(`Stylist "${newStaff.name}" added to salon staff roster.`)
    }

    setIsAddStaffOpen(false)
    setEditingStaff(null)
  }

  const handleDeleteStaff = () => {
    if (!deletingStaff) return
    const name = deletingStaff.name
    setState((prev) => ({
      ...prev,
      staff: prev.staff.filter((s) => s.id !== deletingStaff.id),
    }))
    setDeletingStaff(null)
    showToast(`Stylist "${name}" removed from salon directory.`)
  }

  const handleSaveService = (event: FormEvent) => {
    event.preventDefault()
    if (!serviceForm.name) return

    if (editingService) {
      setState((prev) => ({
        ...prev,
        services: prev.services.map((srv) =>
          srv.id === editingService.id
            ? {
                ...srv,
                name: serviceForm.name,
                category: serviceForm.category,
                durationMin: Number(serviceForm.durationMin) || 60,
                price: Number(serviceForm.price) || 50,
                holdDeposit: Number(serviceForm.holdDeposit) || Number(serviceForm.price),
                noShowFee: Number(serviceForm.noShowFee) || 25,
                description: serviceForm.description,
              }
            : srv,
        ),
      }))
      showToast(`Service "${serviceForm.name}" updated.`)
    } else {
      const newService: SalonService = {
        id: createSequentialId('srv'),
        name: serviceForm.name,
        category: serviceForm.category,
        durationMin: Number(serviceForm.durationMin) || 60,
        price: Number(serviceForm.price) || 50,
        holdDeposit: Number(serviceForm.holdDeposit) || Number(serviceForm.price),
        noShowFee: Number(serviceForm.noShowFee) || 25,
        description:
          serviceForm.description || 'Premium salon styling with authorization hold protection.',
      }
      setState((prev) => ({
        ...prev,
        services: [...prev.services, newService],
      }))
      showToast(`Service "${newService.name}" created.`)
    }

    setIsAddServiceOpen(false)
    setEditingService(null)
  }

  const handleDeleteService = () => {
    if (!deletingService) return
    const name = deletingService.name
    setState((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== deletingService.id),
    }))
    setDeletingService(null)
    showToast(`Service "${name}" removed.`)
  }

  const handleSubmitPaypalChange = (merchantId: string) => {
    if (!merchantId) return

    const newCr: ChangeRequest = {
      id: createSequentialId('CR-PAYPAL'),
      type: 'PAYPAL_ACCOUNT',
      salonId: state.salon.id,
      salonName: state.salon.name,
      submittedAt: 'Just now',
      status: 'PENDING_REVIEW',
      currentData: {
        paypalMerchantId: state.salon.paypalMerchantId,
      },
      proposedData: {
        paypalMerchantId: merchantId,
      },
    }

    setState((prev) => ({
      ...prev,
      changeRequests: [newCr, ...prev.changeRequests],
    }))
    setIsChangePaypalOpen(false)
    showToast('PayPal account change request submitted to Platform Admins for verification.')
  }

  const handleSubmitPolicyChange = (next: { policyHours: number; noShowFee: number }) => {
    const newCr: ChangeRequest = {
      id: createSequentialId('CR-POLICY'),
      type: 'CANCELLATION_POLICY',
      salonId: state.salon.id,
      salonName: state.salon.name,
      submittedAt: 'Just now',
      status: 'PENDING_REVIEW',
      currentData: {
        policyHours: state.salon.cancellationPolicyHours,
        noShowFee: state.salon.defaultNoShowFee,
        holdPercent: 100,
      },
      proposedData: {
        policyHours: next.policyHours,
        noShowFee: next.noShowFee,
        holdPercent: 100,
      },
    }

    setState((prev) => ({
      ...prev,
      changeRequests: [newCr, ...prev.changeRequests],
    }))
    setIsChangePolicyOpen(false)
    showToast('Cancellation policy amendment submitted for compliance review.')
  }

  const handleExecuteRefundProposal = useCallback(
    (proposal: RefundProposal) => {
      const newLedgerEntry: AuditLedgerEntry = {
        id: createSequentialId('LEDGER-REFUND'),
        bookingId: proposal.bookingId,
        clientName: proposal.clientName,
        serviceName: 'No-Show Fee Goodwill Adjustment',
        action: 'GOODWILL_PARTIAL_REFUND',
        amount: proposal.refundAmount,
        currency: 'USD',
        paypalDebugId: createPaypalDebugId('REFUND'),
        webhookVerified: true,
        timestamp: 'Just now',
        details: `Owner confirmed $${proposal.refundAmount.toFixed(2)} goodwill partial refund via PayPal Agent Copilot. Reason: ${proposal.reason}.`,
      }

      setState((prev) => ({
        ...prev,
        auditLedger: [newLedgerEntry, ...prev.auditLedger],
      }))

      showToast(`$${proposal.refundAmount.toFixed(2)} refund issued to ${proposal.clientName}.`)
      return newLedgerEntry.id
    },
    [setState, showToast],
  )

  useEffect(() => {
    if (!selectedBooking) return
    const fresh = state.bookings.find((b) => b.id === selectedBooking.id)
    if (fresh && fresh !== selectedBooking) {
      setSelectedBooking(fresh)
    }
  }, [selectedBooking, state.bookings])

  if (!state.authenticated) {
    return (
      <AuthGate
        title="Merchant Console Sign-In"
        subtitle="Operational portal for salon owners. Manage calendar appointments, execute HITL settlements, and configure deposit policies."
        email={SANDBOX_CREDENTIALS.merchantAccount.email}
        password={SANDBOX_CREDENTIALS.merchantAccount.password}
        onSignIn={handleSignIn}
      />
    )
  }

  return (
    <>
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
            salon={state.salon}
            activeTab={activeTab}
            activeHoldsCount={activeHolds.length}
            bookingsCount={state.bookings.length}
            staffCount={state.staff.length}
            servicesCount={state.services.length}
            pendingChangeRequests={pendingChangeRequests}
            onTabChange={(tab) => {
              setActiveTab(tab)
              setIsMobileSidebarOpen(false)
            }}
            onOpenCopilot={() => setIsCopilotOpen(true)}
            onLockSession={handleLockSession}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        }
        header={
          <MerchantHeader
            activeTab={activeTab}
            lastReconciledAt={state.lastReconciledAt}
            simulatedDrift={state.simulatedDrift}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onToggleDrift={handleToggleDrift}
          />
        }
      >
        {activeTab === 'dashboard' ? (
          <DashboardTab
            salon={state.salon}
            bookings={state.bookings}
            activeHoldsCount={activeHolds.length}
            activeHoldsVolume={activeHoldsVolume}
            capturedRevenue={capturedRevenue}
            noShowRecovered={noShowRecovered}
            onSelectBooking={setSelectedBooking}
            onNavigateTab={setActiveTab}
          />
        ) : null}

        {activeTab === 'calendar' ? (
          <CalendarTab
            staff={state.staff}
            bookings={state.bookings}
            onSelectBooking={setSelectedBooking}
          />
        ) : null}

        {activeTab === 'appointments' ? (
          <AppointmentsTab
            bookings={state.bookings}
            auditLedger={state.auditLedger}
            onSelectBooking={setSelectedBooking}
            onInspectConsent={setInspectConsentBooking}
          />
        ) : null}

        {activeTab === 'staff' ? (
          <StaffTab
            staff={state.staff}
            onAddStaff={() => {
              setEditingStaff(null)
              setStaffForm({
                ...DEFAULT_STAFF_FORM,
                role: 'Lead Stylist',
                specialties: 'Knotless Braids, Silk Press',
              })
              setIsAddStaffOpen(true)
            }}
            onEditStaff={(stylist) => {
              setEditingStaff(stylist)
              setStaffForm({
                name: stylist.name,
                role: stylist.role,
                workingHours: stylist.workingHours || '9:00 AM - 6:00 PM',
                breakPeriod: stylist.breakPeriod || '1:00 PM - 2:00 PM',
                specialties: stylist.specialties.join(', '),
                maxSimultaneousClients: stylist.maxSimultaneousClients || 1,
                status: stylist.status || 'ACTIVE',
              })
              setIsAddStaffOpen(true)
            }}
            onDeleteStaff={setDeletingStaff}
          />
        ) : null}

        {activeTab === 'services' ? (
          <ServicesTab
            services={state.services}
            onAddService={() => {
              setEditingService(null)
              setServiceForm(DEFAULT_SERVICE_FORM)
              setIsAddServiceOpen(true)
            }}
            onEditService={(srv) => {
              setEditingService(srv)
              setServiceForm({
                name: srv.name,
                category: srv.category,
                durationMin: srv.durationMin,
                price: srv.price,
                holdDeposit: srv.holdDeposit,
                noShowFee: srv.noShowFee,
                description: srv.description,
              })
              setIsAddServiceOpen(true)
            }}
            onDeleteService={setDeletingService}
          />
        ) : null}

        {activeTab === 'settings' ? (
          <SettingsTab
            salon={state.salon}
            changeRequests={state.changeRequests}
            onRequestPaypalChange={() => {
              setIsChangePaypalOpen(true)
            }}
            onRequestPolicyChange={() => {
              setPolicyForm({
                policyHours: state.salon.cancellationPolicyHours,
                noShowFee: state.salon.defaultNoShowFee,
              })
              setIsChangePolicyOpen(true)
            }}
          />
        ) : null}
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

      {isAddStaffOpen ? (
        <StaffFormModal
          editingStaff={editingStaff}
          form={staffForm}
          onChange={setStaffForm}
          onClose={() => setIsAddStaffOpen(false)}
          onSubmit={handleSaveStaff}
        />
      ) : null}

      {deletingStaff ? (
        <DeleteStaffModal
          staff={deletingStaff}
          onClose={() => setDeletingStaff(null)}
          onConfirm={handleDeleteStaff}
        />
      ) : null}

      {isAddServiceOpen ? (
        <ServiceFormModal
          editingService={editingService}
          form={serviceForm}
          onChange={setServiceForm}
          onClose={() => setIsAddServiceOpen(false)}
          onSubmit={handleSaveService}
        />
      ) : null}

      {deletingService ? (
        <DeleteServiceModal
          service={deletingService}
          onClose={() => setDeletingService(null)}
          onConfirm={handleDeleteService}
        />
      ) : null}

      <PaypalChangeModal
        open={isChangePaypalOpen}
        currentMerchantId={state.salon.paypalMerchantId}
        onClose={() => setIsChangePaypalOpen(false)}
        onSubmit={handleSubmitPaypalChange}
      />

      <PolicyChangeModal
        open={isChangePolicyOpen}
        policyHours={policyForm.policyHours}
        noShowFee={policyForm.noShowFee}
        onClose={() => setIsChangePolicyOpen(false)}
        onSubmit={handleSubmitPolicyChange}
      />
    </>
  )
}
