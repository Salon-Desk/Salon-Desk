"use client";

import { Sparkles, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/layout/auth-gate";
import { ConsoleShell } from "@/components/layout/console-shell";
import { Button, Toast } from "@/components/ui";
import { useAdminStore, useDemoReset, useToast } from "@/hooks";
import { createSequentialId } from "@/lib/ids";
import type {
  ChangeRequest,
  CommissionOverride,
  Organization,
  PlatformUser,
  TaxonomyCategory,
} from "@/types";
import {
  ADMIN_DEMO_EMAIL,
  ADMIN_DEMO_PASSWORD,
  EMPTY_CATEGORY_FORM,
  EMPTY_SALON_FORM,
  EMPTY_STAFF_FORM,
} from "../_constants/admin-forms";
import type {
  AdminTabId,
  CrSubTab,
  SalonStatusFilter,
} from "../_types/admin-types";
import { computeAdminMetrics } from "../_utils/compute-admin-metrics";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";
import { AddCommissionOverrideModal } from "./commission-modals";
import { CommissionTab } from "./commission-tab";
import { OverviewTab } from "./overview-tab";
import { RejectChangeRequestModal } from "./request-modals";
import { RequestsTab } from "./requests-tab";
import {
  AddSalonModal,
  DeleteSalonModal,
  EditSalonModal,
  type SalonFormState,
  SuspendSalonModal,
} from "./salon-modals";
import { SalonsTab } from "./salons-tab";
import {
  DeleteStaffModal,
  InviteStaffModal,
  type StaffInviteFormState,
} from "./staff-modals";
import { StaffTab } from "./staff-tab";
import {
  type CategoryFormState,
  CategoryModal,
  DeleteCategoryModal,
} from "./taxonomy-modals";
import { TaxonomyTab } from "./taxonomy-tab";

export function AdminDashboard() {
  const { state, setState, resetState } = useAdminStore();
  const { message, show: showToast } = useToast(3800);
  const { isResetting, reset: resetDemo } = useDemoReset(resetState);

  const [activeTab, setActiveTab] = useState<AdminTabId>("overview");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isAddSalonOpen, setIsAddSalonOpen] = useState(false);
  const [editingSalon, setEditingSalon] = useState<Organization | null>(null);
  const [suspendingSalon, setSuspendingSalon] = useState<Organization | null>(
    null,
  );
  const [suspensionReasonInput, setSuspensionReasonInput] = useState("");
  const [deletingSalon, setDeletingSalon] = useState<Organization | null>(null);

  const [crSubTab, setCrSubTab] = useState<CrSubTab>("POLICY");
  const [rejectingCr, setRejectingCr] = useState<ChangeRequest | null>(null);
  const [crRejectReason, setCrRejectReason] = useState("");

  const [isAddOverrideOpen, setIsAddOverrideOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    salonId: "",
    customRate: "1.8",
    note: "",
  });
  const [globalRateInput, setGlobalRateInput] = useState({
    percentage: state.globalRate.percentage.toString(),
    flatFee: state.globalRate.flatFee.toString(),
  });

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<TaxonomyCategory | null>(null);
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormState>(EMPTY_CATEGORY_FORM);
  const [deletingCategory, setDeletingCategory] =
    useState<TaxonomyCategory | null>(null);

  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [userForm, setUserForm] =
    useState<StaffInviteFormState>(EMPTY_STAFF_FORM);
  const [deletingUser, setDeletingUser] = useState<PlatformUser | null>(null);

  const [salonSearch, setSalonSearch] = useState("");
  const [salonStatusFilter, setSalonStatusFilter] =
    useState<SalonStatusFilter>("ALL");
  const [salonForm, setSalonForm] = useState<SalonFormState>(EMPTY_SALON_FORM);

  useEffect(() => {
    setGlobalRateInput({
      percentage: state.globalRate.percentage.toString(),
      flatFee: state.globalRate.flatFee.toString(),
    });
  }, [state.globalRate.percentage, state.globalRate.flatFee]);

  const metrics = computeAdminMetrics(state);

  const filteredSalons = useMemo(
    () =>
      state.organizations.filter((org) => {
        const query = salonSearch.toLowerCase();
        const matchesSearch =
          org.name.toLowerCase().includes(query) ||
          org.ownerName.toLowerCase().includes(query) ||
          (org.city?.toLowerCase().includes(query) ?? false);
        const matchesStatus =
          salonStatusFilter === "ALL" || org.status === salonStatusFilter;
        return matchesSearch && matchesStatus;
      }),
    [state.organizations, salonSearch, salonStatusFilter],
  );

  const handleResetData = async () => {
    await resetDemo();
    showToast("Demo data reset");
  };

  const handleJudgeSignIn = () => {
    setState({ ...state, authenticated: true });
    showToast("Signed in");
  };

  const handleLockSession = () => {
    setState({ ...state, authenticated: false });
    showToast("Session locked");
  };

  const handleCreateSalon = (event: React.FormEvent) => {
    event.preventDefault();
    if (!salonForm.name || !salonForm.email) return;

    const newOrg: Organization = {
      id: createSequentialId("org"),
      name: salonForm.name,
      category: salonForm.category,
      ownerName: salonForm.ownerName || "Partner Owner",
      email: salonForm.email,
      phone: salonForm.phone || "+1 (212) 555-0100",
      address: salonForm.address || "100 Broadway",
      city: salonForm.city,
      status: "APPROVED",
      paypalMerchantId:
        salonForm.paypalMerchantId ||
        `MERCHANT_${createSequentialId("NEW").slice(-4)}`,
      verified: true,
      cancellationPolicyHours: 24,
      activeHoldsCount: 0,
      totalVolume: 0,
      stylistsCount: 2,
      joinedAt: "Just now",
    };

    setState({
      ...state,
      organizations: [newOrg, ...state.organizations],
    });
    setIsAddSalonOpen(false);
    setSalonForm(EMPTY_SALON_FORM);
    showToast(`Added "${newOrg.name}"`);
  };

  const handleUpdateSalon = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingSalon) return;

    const updated = state.organizations.map((org) =>
      org.id === editingSalon.id ? editingSalon : org,
    );
    setState({ ...state, organizations: updated });
    setEditingSalon(null);
    showToast(`Updated "${editingSalon.name}"`);
  };

  const handleApproveSalon = (orgId: string) => {
    const updated = state.organizations.map((org) =>
      org.id === orgId
        ? { ...org, status: "APPROVED" as const, verified: true }
        : org,
    );
    setState({ ...state, organizations: updated });
    showToast("Salon approved");
  };

  const handleConfirmSuspension = () => {
    if (!suspendingSalon) return;
    const isCurrentlySuspended = suspendingSalon.status === "SUSPENDED";
    const nextStatus = isCurrentlySuspended
      ? ("APPROVED" as const)
      : ("SUSPENDED" as const);

    const updated = state.organizations.map((org) => {
      if (org.id === suspendingSalon.id) {
        return {
          ...org,
          status: nextStatus,
          suspensionReason: isCurrentlySuspended
            ? undefined
            : suspensionReasonInput || "Compliance review pending.",
        };
      }
      return org;
    });

    setState({ ...state, organizations: updated });
    setSuspendingSalon(null);
    setSuspensionReasonInput("");
    showToast(
      isCurrentlySuspended
        ? `Reinstated "${suspendingSalon.name}"`
        : `Suspended "${suspendingSalon.name}"`,
    );
  };

  const handleDeleteSalon = () => {
    if (!deletingSalon) return;
    setState({
      ...state,
      organizations: state.organizations.filter(
        (o) => o.id !== deletingSalon.id,
      ),
    });
    setDeletingSalon(null);
    showToast(`Removed "${deletingSalon.name}"`);
  };

  const handleApproveChangeRequest = (cr: ChangeRequest) => {
    const updatedCRs = state.changeRequests.map((item) =>
      item.id === cr.id ? { ...item, status: "APPROVED" as const } : item,
    );

    let updatedOrgs = [...state.organizations];
    if (cr.type === "PAYPAL_ACCOUNT" && cr.proposedData.paypalMerchantId) {
      updatedOrgs = updatedOrgs.map((org) =>
        org.id === cr.salonId
          ? {
              ...org,
              paypalMerchantId: cr.proposedData.paypalMerchantId!,
              verified: true,
            }
          : org,
      );
    } else if (
      cr.type === "CANCELLATION_POLICY" &&
      cr.proposedData.policyHours
    ) {
      updatedOrgs = updatedOrgs.map((org) =>
        org.id === cr.salonId
          ? {
              ...org,
              cancellationPolicyHours: cr.proposedData.policyHours!,
            }
          : org,
      );
    }

    setState({
      ...state,
      changeRequests: updatedCRs,
      organizations: updatedOrgs,
    });
    showToast(`Approved ${cr.id}`);
  };

  const handleConfirmRejectCR = () => {
    if (!rejectingCr) return;
    const updatedCRs = state.changeRequests.map((item) =>
      item.id === rejectingCr.id
        ? {
            ...item,
            status: "REJECTED" as const,
            rejectionReason:
              crRejectReason || "Did not meet compliance criteria.",
          }
        : item,
    );
    setState({ ...state, changeRequests: updatedCRs });
    const rejectedId = rejectingCr.id;
    setRejectingCr(null);
    setCrRejectReason("");
    showToast(`Rejected ${rejectedId}`);
  };

  const handleSaveGlobalRate = (event: React.FormEvent) => {
    event.preventDefault();
    const pct = parseFloat(globalRateInput.percentage);
    const flat = parseFloat(globalRateInput.flatFee);
    if (Number.isNaN(pct) || Number.isNaN(flat)) return;

    setState({
      ...state,
      globalRate: { percentage: pct, flatFee: flat },
    });
    showToast(`Rate set to ${pct}% + $${flat.toFixed(2)}`);
  };

  const handleCreateOverride = (event: React.FormEvent) => {
    event.preventDefault();
    const matchedSalon = state.organizations.find(
      (o) => o.id === overrideForm.salonId,
    );
    if (!matchedSalon) return;

    const rate = parseFloat(overrideForm.customRate);
    if (Number.isNaN(rate)) return;

    const newOverride: CommissionOverride = {
      salonId: matchedSalon.id,
      salonName: matchedSalon.name,
      customRate: rate,
      note: overrideForm.note || "Custom partner agreement",
      updatedAt: "Just now",
    };

    const filtered = state.commissionOverrides.filter(
      (ov) => ov.salonId !== matchedSalon.id,
    );
    setState({
      ...state,
      commissionOverrides: [newOverride, ...filtered],
    });
    setIsAddOverrideOpen(false);
    setOverrideForm({ salonId: "", customRate: "1.8", note: "" });
    showToast(`${rate}% override for "${matchedSalon.name}"`);
  };

  const handleDeleteOverride = (salonId: string) => {
    setState({
      ...state,
      commissionOverrides: state.commissionOverrides.filter(
        (ov) => ov.salonId !== salonId,
      ),
    });
    showToast("Override removed");
  };

  const handleSaveCategory = (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryForm.name) return;

    if (editingCategory) {
      const updated = state.categories.map((c) =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: categoryForm.name,
              slug:
                categoryForm.slug ||
                categoryForm.name.toLowerCase().replace(/\s+/g, "-"),
              description: categoryForm.description,
              iconName: categoryForm.iconName,
              displayOrder: parseInt(categoryForm.displayOrder, 10) || 1,
            }
          : c,
      );
      setState({ ...state, categories: updated });
      setEditingCategory(null);
      showToast(`Updated "${categoryForm.name}"`);
    } else {
      const newCat: TaxonomyCategory = {
        id: createSequentialId("cat"),
        name: categoryForm.name,
        slug:
          categoryForm.slug ||
          categoryForm.name.toLowerCase().replace(/\s+/g, "-"),
        description:
          categoryForm.description || "General salon and styling services.",
        iconName: categoryForm.iconName || "Scissors",
        displayOrder:
          parseInt(categoryForm.displayOrder, 10) ||
          state.categories.length + 1,
        status: "ACTIVE",
        servicesCount: 0,
      };
      setState({ ...state, categories: [...state.categories, newCat] });
      setIsAddCategoryOpen(false);
      showToast(`Added "${newCat.name}"`);
    }

    setCategoryForm(EMPTY_CATEGORY_FORM);
  };

  const handleToggleCategoryStatus = (catId: string) => {
    const updated = state.categories.map((c) =>
      c.id === catId
        ? {
            ...c,
            status: (c.status === "ACTIVE" ? "HIDDEN" : "ACTIVE") as
              | "ACTIVE"
              | "HIDDEN",
          }
        : c,
    );
    setState({ ...state, categories: updated });
    showToast("Visibility updated");
  };

  const handleDeleteCategory = () => {
    if (!deletingCategory) return;
    setState({
      ...state,
      categories: state.categories.filter((c) => c.id !== deletingCategory.id),
    });
    setDeletingCategory(null);
    showToast(`Removed "${deletingCategory.name}"`);
  };

  const handleInviteUser = (event: React.FormEvent) => {
    event.preventDefault();
    if (!userForm.name || !userForm.email) return;

    const newUser: PlatformUser = {
      id: createSequentialId("usr"),
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      status: "ACTIVE",
      avatar: `https://picsum.photos/seed/${Date.now()}/200/200`,
      lastActive: "Just invited",
    };

    setState({ ...state, platformUsers: [...state.platformUsers, newUser] });
    setIsInviteUserOpen(false);
    setUserForm(EMPTY_STAFF_FORM);
    showToast(`Invited "${newUser.name}"`);
  };

  const handleToggleUserStatus = (userId: string) => {
    const target = state.platformUsers.find((u) => u.id === userId);
    if (!target) return;
    if (target.id === state.currentUser.id) {
      showToast("Cannot revoke your own account");
      return;
    }

    const updated = state.platformUsers.map((u) =>
      u.id === userId
        ? {
            ...u,
            status: (u.status === "ACTIVE" ? "REVOKED" : "ACTIVE") as
              | "ACTIVE"
              | "REVOKED",
          }
        : u,
    );
    setState({ ...state, platformUsers: updated });
    showToast(`Updated "${target.name}"`);
  };

  const handleDeleteUser = () => {
    if (!deletingUser) return;
    if (deletingUser.id === state.currentUser.id) {
      showToast("Cannot delete the signed-in account");
      setDeletingUser(null);
      return;
    }
    setState({
      ...state,
      platformUsers: state.platformUsers.filter(
        (u) => u.id !== deletingUser.id,
      ),
    });
    setDeletingUser(null);
    showToast(`Removed "${deletingUser.name}"`);
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      ...EMPTY_CATEGORY_FORM,
      displayOrder: String(state.categories.length + 1),
    });
    setIsAddCategoryOpen(true);
  };

  const openEditCategory = (category: TaxonomyCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      iconName: category.iconName,
      displayOrder: String(category.displayOrder),
    });
    setIsAddCategoryOpen(true);
  };

  if (!state.authenticated) {
    return (
      <AuthGate
        title="Admin sign-in"
        subtitle="Manage salons, approvals, fees, and staff."
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
            activeTab={activeTab}
            onTabChange={setActiveTab}
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
            activeTab={activeTab}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onResetDemo={handleResetData}
            isResetting={isResetting}
          />
        }
      >
        {activeTab === "overview" && (
          <OverviewTab
            totalVolume={metrics.totalVolume}
            totalHolds={metrics.totalHolds}
            activeCount={metrics.activeCount}
            pendingCount={metrics.pendingCount}
            suspendedCount={metrics.suspendedCount}
            organizationCount={state.organizations.length}
            pendingCrCount={metrics.pendingCrCount}
            onNavigate={setActiveTab}
            onAddSalon={() => setIsAddSalonOpen(true)}
            onReviewPolicy={() => setCrSubTab("POLICY")}
            onAddOverride={() => setIsAddOverrideOpen(true)}
          />
        )}

        {activeTab === "salons" && (
          <SalonsTab
            salons={filteredSalons}
            search={salonSearch}
            onSearchChange={setSalonSearch}
            statusFilter={salonStatusFilter}
            onStatusFilterChange={setSalonStatusFilter}
            onAddSalon={() => setIsAddSalonOpen(true)}
            onApprove={handleApproveSalon}
            onEdit={setEditingSalon}
            onSuspend={setSuspendingSalon}
            onDelete={setDeletingSalon}
          />
        )}

        {activeTab === "requests" && (
          <RequestsTab
            changeRequests={state.changeRequests}
            subTab={crSubTab}
            onSubTabChange={setCrSubTab}
            onApprove={handleApproveChangeRequest}
            onReject={setRejectingCr}
          />
        )}

        {activeTab === "commission" && (
          <CommissionTab
            globalRateInput={globalRateInput}
            onGlobalRateInputChange={setGlobalRateInput}
            onSaveGlobalRate={handleSaveGlobalRate}
            overrides={state.commissionOverrides}
            transactions={state.commissionTransactions}
            onAddOverride={() => setIsAddOverrideOpen(true)}
            onDeleteOverride={handleDeleteOverride}
          />
        )}

        {activeTab === "taxonomy" && (
          <TaxonomyTab
            categories={state.categories}
            onAddCategory={openAddCategory}
            onEditCategory={openEditCategory}
            onToggleStatus={handleToggleCategoryStatus}
            onDeleteCategory={setDeletingCategory}
          />
        )}

        {activeTab === "staff" && (
          <StaffTab
            users={state.platformUsers}
            currentUserId={state.currentUser.id}
            onInvite={() => setIsInviteUserOpen(true)}
            onToggleStatus={handleToggleUserStatus}
            onDelete={setDeletingUser}
          />
        )}
      </ConsoleShell>

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
