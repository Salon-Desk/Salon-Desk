"use client";

import { Sparkles, Zap } from "lucide-react";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { AuthGate } from "@/components/layout/auth-gate";
import { ConsoleShell } from "@/components/layout/console-shell";
import { Button, Toast } from "@/components/ui";
import { AdminHeader } from "./_components/admin-header";
import { AdminSidebar } from "./_components/admin-sidebar";
import { AddCommissionOverrideModal } from "./_components/commission-modals";
import { RejectChangeRequestModal } from "./_components/request-modals";
import {
  AddSalonModal,
  DeleteSalonModal,
  EditSalonModal,
  SuspendSalonModal,
} from "./_components/salon-modals";
import { DeleteStaffModal, InviteStaffModal } from "./_components/staff-modals";
import {
  CategoryModal,
  DeleteCategoryModal,
} from "./_components/taxonomy-modals";
import {
  ADMIN_DEMO_EMAIL,
  ADMIN_DEMO_PASSWORD,
} from "./_constants/admin-forms";
import { getAdminTabFromPathname } from "./_constants/admin-nav";
import { AdminProvider, useAdminContext } from "./_context/admin-context";

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentTab = getAdminTabFromPathname(pathname);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const {
    state,
    metrics,
    isResetting,
    message,
    handleResetData,
    handleJudgeSignIn,
    handleLockSession,

    // Salon modals
    isAddSalonOpen,
    setIsAddSalonOpen,
    salonForm,
    setSalonForm,
    editingSalon,
    setEditingSalon,
    suspendingSalon,
    setSuspendingSalon,
    suspensionReasonInput,
    setSuspensionReasonInput,
    deletingSalon,
    setDeletingSalon,
    handleCreateSalon,
    handleUpdateSalon,
    handleConfirmSuspension,
    handleDeleteSalon,

    // Requests modal
    rejectingCr,
    setRejectingCr,
    crRejectReason,
    setCrRejectReason,
    handleConfirmRejectCR,

    // Commission modal
    isAddOverrideOpen,
    setIsAddOverrideOpen,
    overrideForm,
    setOverrideForm,
    handleCreateOverride,

    // Taxonomy modal
    isAddCategoryOpen,
    setIsAddCategoryOpen,
    editingCategory,
    setEditingCategory,
    categoryForm,
    setCategoryForm,
    deletingCategory,
    setDeletingCategory,
    handleSaveCategory,
    handleDeleteCategory,

    // Staff modal
    isInviteUserOpen,
    setIsInviteUserOpen,
    userForm,
    setUserForm,
    deletingUser,
    setDeletingUser,
    handleInviteUser,
    handleDeleteUser,
  } = useAdminContext();

  if (!state.authenticated) {
    return (
      <AuthGate
        title="Admin sign-in"
        subtitle="Manage salons, approvals, fees, and staff across the PayPal ecosystem."
        email={ADMIN_DEMO_EMAIL}
        password={ADMIN_DEMO_PASSWORD}
        onSignIn={handleJudgeSignIn}
        extraAction={
          <Button
            variant="dark"
            size="lg"
            fullWidth
            onClick={handleJudgeSignIn}
            className="mt-3"
          >
            <Zap className="h-4 w-4 fill-white" />
            1-click demo sign-in
          </Button>
        }
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50 font-sans text-slate-900 selection:bg-amber-500/20">
      {message && (
        <Toast
          message={message}
          position="top-right"
          theme="dark"
          icon={<Sparkles className="h-4 w-4 text-amber-400" />}
        />
      )}

      <ConsoleShell
        isMobileSidebarOpen={isMobileSidebarOpen}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
        sidebar={
          <AdminSidebar
            activeTab={currentTab}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            organizationCount={state.organizations.length}
            categoryCount={state.categories.length}
            staffCount={state.platformUsers.length}
            pendingCrCount={metrics.pendingCrCount}
            pendingSalonCount={metrics.pendingCount}
            currentUser={state.currentUser}
            onLockSession={handleLockSession}
            onResetDemo={handleResetData}
            isResetting={isResetting}
          />
        }
        header={
          <AdminHeader
            activeTab={currentTab}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onResetDemo={handleResetData}
            isResetting={isResetting}
          />
        }
      >
        <div className="animate-in fade-in duration-200">{children}</div>
      </ConsoleShell>

      {/* Global Modals */}
      {isAddSalonOpen && (
        <AddSalonModal
          form={salonForm}
          onChange={setSalonForm}
          onClose={() => setIsAddSalonOpen(false)}
          onSubmit={handleCreateSalon}
        />
      )}

      {editingSalon && (
        <EditSalonModal
          salon={editingSalon}
          onChange={setEditingSalon}
          onClose={() => setEditingSalon(null)}
          onSubmit={handleUpdateSalon}
        />
      )}

      {suspendingSalon && (
        <SuspendSalonModal
          salon={suspendingSalon}
          suspensionReason={suspensionReasonInput}
          onReasonChange={setSuspensionReasonInput}
          onClose={() => {
            setSuspendingSalon(null);
            setSuspensionReasonInput("");
          }}
          onConfirm={handleConfirmSuspension}
        />
      )}

      {deletingSalon && (
        <DeleteSalonModal
          salon={deletingSalon}
          onClose={() => setDeletingSalon(null)}
          onConfirm={handleDeleteSalon}
        />
      )}

      {rejectingCr && (
        <RejectChangeRequestModal
          request={rejectingCr}
          reason={crRejectReason}
          onReasonChange={setCrRejectReason}
          onClose={() => {
            setRejectingCr(null);
            setCrRejectReason("");
          }}
          onConfirm={handleConfirmRejectCR}
        />
      )}

      {isAddOverrideOpen && (
        <AddCommissionOverrideModal
          organizations={state.organizations}
          form={overrideForm}
          onChange={setOverrideForm}
          onClose={() => setIsAddOverrideOpen(false)}
          onSubmit={handleCreateOverride}
        />
      )}

      {isAddCategoryOpen && (
        <CategoryModal
          editingCategory={editingCategory}
          form={categoryForm}
          onChange={setCategoryForm}
          onClose={() => {
            setIsAddCategoryOpen(false);
            setEditingCategory(null);
          }}
          onSubmit={handleSaveCategory}
        />
      )}

      {deletingCategory && (
        <DeleteCategoryModal
          category={deletingCategory}
          onClose={() => setDeletingCategory(null)}
          onConfirm={handleDeleteCategory}
        />
      )}

      {isInviteUserOpen && (
        <InviteStaffModal
          form={userForm}
          onChange={setUserForm}
          onClose={() => setIsInviteUserOpen(false)}
          onSubmit={handleInviteUser}
        />
      )}

      {deletingUser && (
        <DeleteStaffModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleDeleteUser}
        />
      )}
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminProvider>
  );
}
