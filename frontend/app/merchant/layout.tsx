"use client";

import { ShieldCheck, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { AuthGate } from "@/components/layout/auth-gate";
import { ConsoleShell } from "@/components/layout/console-shell";
import { Toast } from "@/components/ui";
import { SANDBOX_CREDENTIALS } from "@/lib/constants";
import { ConsentModal } from "./_components/consent-modal";
import { CopilotDrawer } from "./_components/copilot-drawer";
import { MerchantHeader } from "./_components/merchant-header";
import { MerchantSidebar } from "./_components/merchant-sidebar";
import {
  DeleteServiceModal,
  ServiceFormModal,
} from "./_components/service-modals";
import {
  PaypalChangeModal,
  PolicyChangeModal,
} from "./_components/settings-modals";
import { SettlementDrawer } from "./_components/settlement-drawer";
import { DeleteStaffModal, StaffFormModal } from "./_components/staff-modals";
import {
  MerchantProvider,
  useMerchantContext,
} from "./_context/merchant-context";
import { getMerchantTabFromPathname } from "./_types/merchant-types";

function MerchantLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentTab = getMerchantTabFromPathname(pathname);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const {
    state,
    activeHoldsCount,
    pendingChangeRequests,
    isResetting,
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

    isAddStaffOpen,
    setIsAddStaffOpen,
    editingStaff,
    staffForm,
    setStaffForm,
    deletingStaff,
    setDeletingStaff,
    handleSaveStaff,
    handleDeleteStaff,

    isAddServiceOpen,
    setIsAddServiceOpen,
    editingService,
    serviceForm,
    setServiceForm,
    deletingService,
    setDeletingService,
    handleSaveService,
    handleDeleteService,

    isChangePaypalOpen,
    setIsChangePaypalOpen,
    paypalChangeInput,
    setPaypalChangeInput,
    handleSubmitPaypalChange,

    isChangePolicyOpen,
    setIsChangePolicyOpen,
    policyForm,
    setPolicyForm,
    handleSubmitPolicyChange,

    settlement,
    handleExecuteRefundProposal,
    handleSignIn,
    handleLockSession,
    handleResetDemoData,
    handleToggleDrift,
  } = useMerchantContext();

  if (!state.authenticated) {
    return (
      <AuthGate
        title="Merchant Console Sign-In"
        subtitle="Operational portal for salon owners. Manage calendar appointments, execute HITL settlements, and configure deposit policies."
        email={SANDBOX_CREDENTIALS.merchantAccount.email}
        password={SANDBOX_CREDENTIALS.merchantAccount.password}
        onSignIn={handleSignIn}
      />
    );
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
          <p className="text-[11px] text-emerald-100 leading-snug">
            {idempotencyToast}
          </p>
        </output>
      ) : null}

      <ConsoleShell
        isMobileSidebarOpen={isMobileSidebarOpen}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
        sidebar={
          <MerchantSidebar
            salon={state.salon}
            activeTab={currentTab}
            activeHoldsCount={activeHoldsCount}
            bookingsCount={state.bookings.length}
            staffCount={state.staff.length}
            servicesCount={state.services.length}
            pendingChangeRequests={pendingChangeRequests}
            isResetting={isResetting}
            onOpenCopilot={() => setIsCopilotOpen(true)}
            onLockSession={handleLockSession}
            onResetDemo={handleResetDemoData}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        }
        header={
          <MerchantHeader
            activeTab={currentTab}
            lastReconciledAt={state.lastReconciledAt}
            simulatedDrift={state.simulatedDrift}
            isResetting={isResetting}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onToggleDrift={handleToggleDrift}
            onOpenCopilot={() => setIsCopilotOpen(true)}
            onResetDemo={handleResetDemoData}
          />
        }
      >
        <div className="animate-in fade-in duration-200">{children}</div>
      </ConsoleShell>

      {/* Global Modals & Slide-overs */}
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

      {isChangePaypalOpen ? (
        <PaypalChangeModal
          currentMerchantId={state.salon.paypalMerchantId}
          value={paypalChangeInput}
          onChange={setPaypalChangeInput}
          onClose={() => setIsChangePaypalOpen(false)}
          onSubmit={handleSubmitPaypalChange}
        />
      ) : null}

      {isChangePolicyOpen ? (
        <PolicyChangeModal
          policyHours={policyForm.policyHours}
          noShowFee={policyForm.noShowFee}
          onChange={setPolicyForm}
          onClose={() => setIsChangePolicyOpen(false)}
          onSubmit={handleSubmitPolicyChange}
        />
      ) : null}
    </>
  );
}

export default function MerchantLayout({ children }: { children: ReactNode }) {
  return (
    <MerchantProvider>
      <MerchantLayoutInner>{children}</MerchantLayoutInner>
    </MerchantProvider>
  );
}
