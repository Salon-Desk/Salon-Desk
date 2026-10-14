'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import {
  loadStoredAdminState,
  saveStoredAdminState,
  getInitialAdminState,
  AdminDashboardState,
} from '@/lib/admin-store';
import {
  Organization,
  ChangeRequest,
  CommissionOverride,
  TaxonomyCategory,
  PlatformUser,
} from '@/types';
import {
  ShieldCheck,
  Building2,
  PieChart,
  Layers,
  Sparkles,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  ChevronDown,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Lock,
  Unlock,
  Percent,
  TrendingUp,
  Clock,
  Check,
  X,
  CreditCard,
  Sliders,
  DollarSign,
  Palette,
  Flower2,
  Crown,
  HeartHandshake,
  Scissors,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Zap,
  Menu,
} from 'lucide-react';

export default function PlatformAdminDashboard() {
  const [state, setState] = useState<AdminDashboardState>(() => loadStoredAdminState());
  const [activeTab, setActiveTab] = useState<
    'overview' | 'salons' | 'requests' | 'commission' | 'taxonomy' | 'staff'
  >('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Drawers
  const [isAddSalonOpen, setIsAddSalonOpen] = useState(false);
  const [editingSalon, setEditingSalon] = useState<Organization | null>(null);
  const [suspendingSalon, setSuspendingSalon] = useState<Organization | null>(null);
  const [suspensionReasonInput, setSuspensionReasonInput] = useState('');
  const [deletingSalon, setDeletingSalon] = useState<Organization | null>(null);

  // Change Requests tab state
  const [crSubTab, setCrSubTab] = useState<'PAYPAL' | 'POLICY'>('POLICY');
  const [rejectingCr, setRejectingCr] = useState<ChangeRequest | null>(null);
  const [crRejectReason, setCrRejectReason] = useState('');

  // Commission Modal
  const [isAddOverrideOpen, setIsAddOverrideOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ salonId: '', customRate: '1.8', note: '' });
  const [globalRateInput, setGlobalRateInput] = useState({
    percentage: state.globalRate.percentage.toString(),
    flatFee: state.globalRate.flatFee.toString(),
  });

  // Taxonomy Modal
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TaxonomyCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    iconName: 'Scissors',
    displayOrder: '1',
  });
  const [deletingCategory, setDeletingCategory] = useState<TaxonomyCategory | null>(null);

  // Staff Modal
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'Support Agent' as 'Super Admin' | 'Compliance Officer' | 'Support Agent',
  });
  const [deletingUser, setDeletingUser] = useState<PlatformUser | null>(null);

  // Salon search & filter
  const [salonSearch, setSalonSearch] = useState('');
  const [salonStatusFilter, setSalonStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING_REVIEW' | 'SUSPENDED'>('ALL');

  // New salon form
  const [salonForm, setSalonForm] = useState({
    name: '',
    category: 'Luxury Barber & Grooming Lounge',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: 'New York, NY',
    paypalMerchantId: '',
  });

  useEffect(() => {
    const handleUpdate = () => setState(loadStoredAdminState());
    window.addEventListener('salondesk_admin_state_updated', handleUpdate);
    return () => window.removeEventListener('salondesk_admin_state_updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const updateState = (newState: AdminDashboardState) => {
    setState(newState);
    saveStoredAdminState(newState);
  };

  const handleResetData = () => {
    const fresh = getInitialAdminState();
    updateState(fresh);
    setGlobalRateInput({
      percentage: fresh.globalRate.percentage.toString(),
      flatFee: fresh.globalRate.flatFee.toString(),
    });
    showToast('Platform Admin Demo State Re-seeded Successfully!');
  };

  // Auth toggle
  const handleToggleAuth = () => {
    const nextAuth = !state.authenticated;
    updateState({ ...state, authenticated: nextAuth });
    showToast(nextAuth ? 'Signed in as Elena Rostova (Super Admin)' : 'Signed out of Platform Admin');
  };

  // 1-Click Judge Sign-In
  const handleJudgeSignIn = () => {
    updateState({ ...state, authenticated: true });
    showToast('⚡ Instant Judge Access Granted! Welcome to Platform Admin.');
  };

  // -------------------------------------------------------------
  // MODULE B: Salon Directory CRUD
  // -------------------------------------------------------------
  const handleCreateSalon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonForm.name || !salonForm.email) return;

    const newOrg: Organization = {
      id: `org-${Date.now().toString().slice(-4)}`,
      name: salonForm.name,
      category: salonForm.category,
      ownerName: salonForm.ownerName || 'Partner Owner',
      email: salonForm.email,
      phone: salonForm.phone || '+1 (212) 555-0100',
      address: salonForm.address || '100 Broadway',
      city: salonForm.city,
      status: 'APPROVED',
      paypalMerchantId: salonForm.paypalMerchantId || `MERCHANT_${Date.now().toString().slice(-4)}`,
      verified: true,
      cancellationPolicyHours: 24,
      activeHoldsCount: 0,
      totalVolume: 0,
      stylistsCount: 2,
      joinedAt: 'Just now',
    };

    updateState({
      ...state,
      organizations: [newOrg, ...state.organizations],
    });

    setIsAddSalonOpen(false);
    setSalonForm({
      name: '',
      category: 'Luxury Barber & Grooming Lounge',
      ownerName: '',
      email: '',
      phone: '',
      address: '',
      city: 'New York, NY',
      paypalMerchantId: '',
    });
    showToast(`Salon "${newOrg.name}" registered and onboarded.`);
  };

  const handleUpdateSalon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalon) return;

    const updated = state.organizations.map((org) =>
      org.id === editingSalon.id ? editingSalon : org
    );
    updateState({ ...state, organizations: updated });
    setEditingSalon(null);
    showToast(`Updated settings for "${editingSalon.name}".`);
  };

  const handleApproveSalon = (orgId: string) => {
    const updated = state.organizations.map((org) => {
      if (org.id === orgId) {
        return { ...org, status: 'APPROVED' as const, verified: true };
      }
      return org;
    });
    updateState({ ...state, organizations: updated });
    showToast('Salon approved and activated on PayPal live hold rails.');
  };

  const handleConfirmSuspension = () => {
    if (!suspendingSalon) return;
    const isCurrentlySuspended = suspendingSalon.status === 'SUSPENDED';
    const nextStatus = isCurrentlySuspended ? ('APPROVED' as const) : ('SUSPENDED' as const);

    const updated = state.organizations.map((org) => {
      if (org.id === suspendingSalon.id) {
        return {
          ...org,
          status: nextStatus,
          suspensionReason: isCurrentlySuspended ? undefined : suspensionReasonInput || 'Compliance review pending.',
        };
      }
      return org;
    });

    updateState({ ...state, organizations: updated });
    setSuspendingSalon(null);
    setSuspensionReasonInput('');
    showToast(
      isCurrentlySuspended
        ? `Reinstated "${suspendingSalon.name}".`
        : `Suspended "${suspendingSalon.name}". Holds paused.`
    );
  };

  const handleDeleteSalon = () => {
    if (!deletingSalon) return;
    const updated = state.organizations.filter((o) => o.id !== deletingSalon.id);
    updateState({ ...state, organizations: updated });
    setDeletingSalon(null);
    showToast(`Offboarded and deleted salon "${deletingSalon.name}".`);
  };

  // -------------------------------------------------------------
  // MODULE C: Change Requests Queue
  // -------------------------------------------------------------
  const handleApproveChangeRequest = (cr: ChangeRequest) => {
    const updatedCRs = state.changeRequests.map((item) => {
      if (item.id === cr.id) {
        return { ...item, status: 'APPROVED' as const };
      }
      return item;
    });

    // If PayPal Account change, update salon record too
    let updatedOrgs = [...state.organizations];
    if (cr.type === 'PAYPAL_ACCOUNT' && cr.proposedData.paypalMerchantId) {
      updatedOrgs = updatedOrgs.map((org) => {
        if (org.id === cr.salonId) {
          return {
            ...org,
            paypalMerchantId: cr.proposedData.paypalMerchantId!,
            verified: true,
          };
        }
        return org;
      });
    } else if (cr.type === 'CANCELLATION_POLICY' && cr.proposedData.policyHours) {
      updatedOrgs = updatedOrgs.map((org) => {
        if (org.id === cr.salonId) {
          return {
            ...org,
            cancellationPolicyHours: cr.proposedData.policyHours!,
          };
        }
        return org;
      });
    }

    updateState({
      ...state,
      changeRequests: updatedCRs,
      organizations: updatedOrgs,
    });
    showToast(`Approved request ${cr.id} for "${cr.salonName}". Record updated.`);
  };

  const handleConfirmRejectCR = () => {
    if (!rejectingCr) return;
    const updatedCRs = state.changeRequests.map((item) => {
      if (item.id === rejectingCr.id) {
        return {
          ...item,
          status: 'REJECTED' as const,
          rejectionReason: crRejectReason || 'Did not meet compliance criteria.',
        };
      }
      return item;
    });
    updateState({ ...state, changeRequests: updatedCRs });
    setRejectingCr(null);
    setCrRejectReason('');
    showToast(`Rejected request ${rejectingCr.id}. Salon notified.`);
  };

  // -------------------------------------------------------------
  // MODULE D: Commission Settings CRUD
  // -------------------------------------------------------------
  const handleSaveGlobalRate = (e: React.FormEvent) => {
    e.preventDefault();
    const pct = parseFloat(globalRateInput.percentage);
    const flat = parseFloat(globalRateInput.flatFee);
    if (isNaN(pct) || isNaN(flat)) return;

    updateState({
      ...state,
      globalRate: {
        percentage: pct,
        flatFee: flat,
      },
    });
    showToast(`Global rate updated to ${pct}% + $${flat.toFixed(2)} per transaction.`);
  };

  const handleCreateOverride = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedSalon = state.organizations.find((o) => o.id === overrideForm.salonId);
    if (!matchedSalon) return;

    const rate = parseFloat(overrideForm.customRate);
    if (isNaN(rate)) return;

    const newOverride: CommissionOverride = {
      salonId: matchedSalon.id,
      salonName: matchedSalon.name,
      customRate: rate,
      note: overrideForm.note || 'Custom partner agreement',
      updatedAt: 'Just now',
    };

    const filtered = state.commissionOverrides.filter((ov) => ov.salonId !== matchedSalon.id);
    updateState({
      ...state,
      commissionOverrides: [newOverride, ...filtered],
    });
    setIsAddOverrideOpen(false);
    setOverrideForm({ salonId: '', customRate: '1.8', note: '' });
    showToast(`Custom rate of ${rate}% set for "${matchedSalon.name}".`);
  };

  const handleDeleteOverride = (salonId: string) => {
    const updated = state.commissionOverrides.filter((ov) => ov.salonId !== salonId);
    updateState({ ...state, commissionOverrides: updated });
    showToast('Custom override removed; salon reverted to global rate tier.');
  };

  // -------------------------------------------------------------
  // MODULE E: Taxonomy Categories CRUD
  // -------------------------------------------------------------
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name) return;

    if (editingCategory) {
      const updated = state.categories.map((c) =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: categoryForm.name,
              slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
              description: categoryForm.description,
              iconName: categoryForm.iconName,
              displayOrder: parseInt(categoryForm.displayOrder) || 1,
            }
          : c
      );
      updateState({ ...state, categories: updated });
      setEditingCategory(null);
      showToast(`Category "${categoryForm.name}" updated.`);
    } else {
      const newCat: TaxonomyCategory = {
        id: `cat-${Date.now().toString().slice(-4)}`,
        name: categoryForm.name,
        slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
        description: categoryForm.description || 'General salon and styling services.',
        iconName: categoryForm.iconName || 'Scissors',
        displayOrder: parseInt(categoryForm.displayOrder) || state.categories.length + 1,
        status: 'ACTIVE',
        servicesCount: 0,
      };
      updateState({ ...state, categories: [...state.categories, newCat] });
      setIsAddCategoryOpen(false);
      showToast(`Category "${newCat.name}" added to public taxonomy.`);
    }

    setCategoryForm({ name: '', slug: '', description: '', iconName: 'Scissors', displayOrder: '1' });
  };

  const handleToggleCategoryStatus = (catId: string) => {
    const updated = state.categories.map((c) => {
      if (c.id === catId) {
        return {
          ...c,
          status: (c.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE') as 'ACTIVE' | 'HIDDEN',
        };
      }
      return c;
    });
    updateState({ ...state, categories: updated });
    showToast('Category visibility toggled.');
  };

  const handleDeleteCategory = () => {
    if (!deletingCategory) return;
    const updated = state.categories.filter((c) => c.id !== deletingCategory.id);
    updateState({ ...state, categories: updated });
    setDeletingCategory(null);
    showToast(`Category "${deletingCategory.name}" removed.`);
  };

  // -------------------------------------------------------------
  // MODULE F: Platform Staff CRUD
  // -------------------------------------------------------------
  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) return;

    const newUser: PlatformUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      status: 'ACTIVE',
      avatar: `https://picsum.photos/seed/${Date.now()}/200/200`,
      lastActive: 'Just invited',
    };

    updateState({ ...state, platformUsers: [...state.platformUsers, newUser] });
    setIsInviteUserOpen(false);
    setUserForm({ name: '', email: '', role: 'Support Agent' });
    showToast(`Staff member "${newUser.name}" invited with ${newUser.role} credentials.`);
  };

  const handleToggleUserStatus = (userId: string) => {
    const target = state.platformUsers.find((u) => u.id === userId);
    if (!target) return;
    if (target.id === state.currentUser.id) {
      showToast('Cannot revoke your own active administrator account.');
      return;
    }

    const updated = state.platformUsers.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          status: (u.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE') as 'ACTIVE' | 'REVOKED',
        };
      }
      return u;
    });
    updateState({ ...state, platformUsers: updated });
    showToast(`Admin account status updated for "${target.name}".`);
  };

  const handleDeleteUser = () => {
    if (!deletingUser) return;
    if (deletingUser.id === state.currentUser.id) {
      showToast('Cannot delete the logged-in demo judge account.');
      setDeletingUser(null);
      return;
    }
    const updated = state.platformUsers.filter((u) => u.id !== deletingUser.id);
    updateState({ ...state, platformUsers: updated });
    setDeletingUser(null);
    showToast(`Removed administrator "${deletingUser.name}".`);
  };

  // Filtered salons
  const filteredSalons = state.organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(salonSearch.toLowerCase()) ||
      org.ownerName.toLowerCase().includes(salonSearch.toLowerCase()) ||
      (org.city && org.city.toLowerCase().includes(salonSearch.toLowerCase()));
    const matchesStatus = salonStatusFilter === 'ALL' || org.status === salonStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalVolume = state.organizations.reduce((acc, o) => acc + o.totalVolume, 0);
  const totalHolds = state.organizations.reduce((acc, o) => acc + o.activeHoldsCount, 0);
  const activeCount = state.organizations.filter((o) => o.status === 'APPROVED').length;
  const pendingCount = state.organizations.filter((o) => o.status === 'PENDING_REVIEW').length;
  const suspendedCount = state.organizations.filter((o) => o.status === 'SUSPENDED').length;

  // RENDER: Demo Gate Screen (If Logged Out)
  if (!state.authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl text-center space-y-6">
          <div className="flex justify-center mb-2">
            <Logo size="md" showTagline={false} linkToHome={false} theme="light" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Platform Operator Gateway</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Platform Admin Sign-In</h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Super Admin management for salon compliance, PayPal authorization reconciliation, fee overrides, and multi-tenant governance.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs font-mono space-y-2 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Demo Account:</span>
              <span className="text-amber-700 font-bold">admin@salondesk.io</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Access Tier:</span>
              <span className="text-emerald-700 font-bold">Super Admin (All Privileges)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Environment:</span>
              <span className="text-slate-700">PayPal Orders v2 Sandbox</span>
            </div>
          </div>

          <button
            onClick={handleJudgeSignIn}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>⚡ 1-Click Judge Sign-In</span>
          </button>

          <div className="pt-2">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to App Hub</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  interface NavTabItem {
    id: 'overview' | 'salons' | 'requests' | 'commission' | 'taxonomy' | 'staff';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    isAlert?: boolean;
    group: 'CORE ANALYTICS' | 'SALON OPERATIONS' | 'FINANCIAL RAILS' | 'GOVERNANCE & SYSTEM';
  }

  const navTabs: NavTabItem[] = [
    {
      id: 'overview',
      label: 'Platform KPIs',
      icon: PieChart,
      group: 'CORE ANALYTICS',
    },
    {
      id: 'salons',
      label: 'Salon Directory',
      icon: Building2,
      badge: state.organizations.length,
      group: 'SALON OPERATIONS',
    },
    {
      id: 'requests',
      label: 'Approval Queue',
      icon: Sliders,
      badge: state.changeRequests.filter((r) => r.status === 'PENDING_REVIEW').length,
      isAlert: true,
      group: 'SALON OPERATIONS',
    },
    {
      id: 'commission',
      label: 'Commission Rails',
      icon: Percent,
      group: 'FINANCIAL RAILS',
    },
    {
      id: 'taxonomy',
      label: 'Service Taxonomy',
      icon: Layers,
      badge: state.categories.length,
      group: 'GOVERNANCE & SYSTEM',
    },
    {
      id: 'staff',
      label: 'Admin Staff & RBAC',
      icon: Users,
      badge: state.platformUsers.length,
      group: 'GOVERNANCE & SYSTEM',
    },
  ];

  const activeTabTitle = {
    overview: 'Platform Overview & Financial KPIs',
    salons: 'Multi-Tenant Salon Directory',
    requests: 'Merchant Change Request Queue',
    commission: 'Platform Commission & Fee Rails',
    taxonomy: 'Central Service Category Taxonomy',
    staff: 'Platform Staff & RBAC Access',
  }[activeTab];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-amber-500/20 relative overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* REGULAR ADMIN DASHBOARD LEFT SIDEBAR */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 w-64 lg:w-72 h-screen bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out select-none shadow-sm ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top: Logo, Workspace Switcher & Navigation */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" showTagline={false} linkToHome={true} theme="light" />
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                Admin
              </span>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Workspace Pill */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold text-slate-800">SalonDesk HQ Global</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
              Live Sandbox
            </span>
          </div>

          {/* Scrollable Navigation Tree */}
          <nav className="flex-1 p-3 space-y-5 overflow-y-auto custom-scrollbar">
            {/* Group 1: CORE */}
            <div className="space-y-1">
              <span className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Analytics &amp; KPIs
              </span>
              {navTabs
                .filter((t) => t.group === 'CORE ANALYTICS')
                .map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as typeof activeTab);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-500'}`} />
                        <span>{tab.label}</span>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Group 2: SALON OPERATIONS */}
            <div className="space-y-1">
              <span className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Salon Management
              </span>
              {navTabs
                .filter((t) => t.group === 'SALON OPERATIONS')
                .map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as typeof activeTab);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-500'}`} />
                        <span>{tab.label}</span>
                      </div>

                      {tab.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isActive
                              ? 'bg-amber-200 text-amber-900'
                              : tab.isAlert
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Group 3: FINANCIAL RAILS */}
            <div className="space-y-1">
              <span className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Financial Rails
              </span>
              {navTabs
                .filter((t) => t.group === 'FINANCIAL RAILS')
                .map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as typeof activeTab);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-500'}`} />
                        <span>{tab.label}</span>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Group 4: GOVERNANCE */}
            <div className="space-y-1">
              <span className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Governance &amp; Staff
              </span>
              {navTabs
                .filter((t) => t.group === 'GOVERNANCE & SYSTEM')
                .map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as typeof activeTab);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-500'}`} />
                        <span>{tab.label}</span>
                      </div>

                      {tab.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isActive
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Group 5: PORTAL SWITCHER */}
            <div className="space-y-1 pt-3 border-t border-slate-200">
              <span className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                App Ecosystem Portals
              </span>
              <Link
                href="/merchant"
                className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <span>Salon Console</span>
                <span className="text-[10px] text-amber-700 font-mono font-semibold">/merchant →</span>
              </Link>
              <Link
                href="/client"
                className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <span>Client Experience</span>
                <span className="text-[10px] text-sky-700 font-mono font-semibold">/client →</span>
              </Link>
              <Link
                href="/"
                className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <span>App Hub Gateway</span>
                <span className="text-[10px] text-slate-500 font-mono">/ →</span>
              </Link>
            </div>
          </nav>

          {/* Bottom Profile & Session Panel */}
          <div className="p-3.5 border-t border-slate-200 bg-slate-50 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-amber-800 text-xs">
                    ER
                  </div>
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="text-left overflow-hidden">
                  <div className="text-xs font-bold text-slate-900 truncate">Elena Rostova</div>
                  <div className="text-[10px] text-amber-800 font-mono font-semibold truncate">Super Admin</div>
                </div>
              </div>
              <button
                onClick={handleToggleAuth}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors border border-slate-200 shadow-sm"
                title="Lock/Sign Out Demo Session"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleResetData}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-amber-800 border border-slate-200 text-xs font-semibold transition-colors shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sandbox Data</span>
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase">
                Platform Admin / {activeTab}
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {activeTabTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit to Hub</span>
            </Link>

            <button
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-amber-800 border border-slate-200 text-xs font-semibold transition-colors shadow-xs"
              title="Reset all admin state to initial PRD seed data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Reset Sandbox</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW & FINANCIAL KPIS (PRD 2.1.3) */}
          {/* ========================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Platform Hold Volume */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Active Holds Volume</span>
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    ${(totalVolume * 0.28).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-amber-800 flex items-center gap-1 mt-1 font-semibold">
                    <span>{totalHolds} active holds reserved on PayPal network</span>
                  </div>
                </div>

                {/* Card 2: Net Platform Commission Earned */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Net Commission Earned</span>
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                      <Percent className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-700 tabular-nums">
                    ${(totalVolume * 0.025).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+18.4% month-over-month yield</span>
                  </div>
                </div>

                {/* Card 3: Registered Salons */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Registered Salons</span>
                    <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    {state.organizations.length}
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-1">
                    <span className="text-emerald-700 font-semibold">{activeCount} Active</span>
                    <span>·</span>
                    <span className="text-amber-700 font-semibold">{pendingCount} Pending</span>
                    <span>·</span>
                    <span className="text-rose-700 font-semibold">{suspendedCount} Suspended</span>
                  </div>
                </div>

                {/* Card 4: No-Show Fees Captured */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">No-Show Fees Captured</span>
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    $1,890.00
                  </div>
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1 font-semibold">
                    <span>100% partial capture recovery · 0 chargebacks</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Live Activity Stream */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions Panel */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Admin Operator Controls
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Direct shortcuts to perform critical administrative tasks on the multi-tenant salon network.
                  </p>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => {
                        setActiveTab('salons');
                        setIsAddSalonOpen(true);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-400 text-xs font-semibold text-slate-800 transition-colors hover:bg-amber-50/50"
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-amber-600" />
                        <span>Onboard New Salon Partner</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Add Salon →</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('requests');
                        setCrSubTab('POLICY');
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-400 text-xs font-semibold text-slate-800 transition-colors hover:bg-amber-50/50"
                    >
                      <span className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-amber-600" />
                        <span>Review Policy Change Requests</span>
                      </span>
                      <span className="text-[10px] text-amber-800 font-mono font-bold">
                        {state.changeRequests.filter((r) => r.status === 'PENDING_REVIEW').length} Pending
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('commission');
                        setIsAddOverrideOpen(true);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-400 text-xs font-semibold text-slate-800 transition-colors hover:bg-amber-50/50"
                    >
                      <span className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-emerald-600" />
                        <span>Configure VIP Commission Override</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Overrides →</span>
                    </button>
                  </div>
                </div>

                {/* Live Activity Stream (PRD 2.1.3) */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Live Platform Activity &amp; Audit Feed
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Real-time Audit
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        id: 'ACT-1',
                        title: 'PayPal Authorization Hold Captured',
                        desc: 'Crown & Blade Atelier completed appointment SD-8488 ($65.00 ticket captured via Orders v2).',
                        time: '12 mins ago',
                        type: 'capture',
                      },
                      {
                        id: 'ACT-2',
                        title: 'Policy Change Request Submitted',
                        desc: 'Velvet Mane Color Studio requested amending free cancellation window from 24h to 12h.',
                        time: '45 mins ago',
                        type: 'policy',
                      },
                      {
                        id: 'ACT-3',
                        title: 'No-Show Fee Retained (Partial Capture)',
                        desc: 'Brandon Walsh missed slot; $20.00 fee captured with final_capture: true; remaining hold balance released.',
                        time: '2 hours ago',
                        type: 'noshow',
                      },
                      {
                        id: 'ACT-4',
                        title: 'PayPal Merchant Verified',
                        desc: 'Selam Hair Studio sandbox merchant ID MERCHANT_SELAM_4412 validated and approved.',
                        time: '5 hours ago',
                        type: 'merchant',
                      },
                    ].map((evt) => (
                      <div
                        key={evt.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                evt.type === 'capture'
                                  ? 'bg-emerald-500'
                                  : evt.type === 'policy'
                                  ? 'bg-amber-500'
                                  : evt.type === 'noshow'
                                  ? 'bg-rose-500'
                                  : 'bg-sky-500'
                              }`}
                            />
                            <span className="font-bold text-slate-900">{evt.title}</span>
                          </div>
                          <p className="text-slate-600 leading-snug">{evt.desc}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                          {evt.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ORGANIZATION DIRECTORY CRUD (PRD 2.1.2) */}
          {/* ========================================================= */}
          {activeTab === 'salons' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Controls: Search, Filter & Add Button */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Multi-Tenant Salon Directory</h2>
                  <p className="text-xs text-slate-600">
                    Manage salon partners, approve pending onboarding requests, configure custom rates, or suspend accounts.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={salonSearch}
                      onChange={(e) => setSalonSearch(e.target.value)}
                      placeholder="Search salon or city..."
                      className="pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>

                  {/* Filter pills */}
                  <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-200 shadow-xs">
                    {(['ALL', 'APPROVED', 'PENDING_REVIEW', 'SUSPENDED'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setSalonStatusFilter(st)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          salonStatusFilter === st
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {st === 'ALL'
                          ? 'All'
                          : st === 'APPROVED'
                          ? 'Active'
                          : st === 'PENDING_REVIEW'
                          ? 'Pending'
                          : 'Suspended'}
                      </button>
                    ))}
                  </div>

                  {/* Add Salon Button */}
                  <button
                    onClick={() => setIsAddSalonOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Onboard Salon</span>
                  </button>
                </div>
              </div>

              {/* Salons Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                      <th className="py-3 px-4">Salon &amp; Location</th>
                      <th className="py-3 px-4">Owner Contact</th>
                      <th className="py-3 px-4">PayPal Merchant ID</th>
                      <th className="py-3 px-4">Policy</th>
                      <th className="py-3 px-4">Rate Override</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSalons.map((salon) => (
                      <tr key={salon.id} className="hover:bg-slate-50 transition-colors">
                        {/* Name & Location */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{salon.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {salon.address}{salon.city ? `, ${salon.city}` : ''}
                          </div>
                        </td>

                        {/* Owner Contact */}
                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="font-medium">{salon.ownerName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{salon.email}</div>
                        </td>

                        {/* PayPal Merchant ID */}
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <span>{salon.paypalMerchantId}</span>
                            {salon.verified && (
                              <span className="text-emerald-700 font-bold" title="Verified PayPal Sandbox Merchant">
                                ✓
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Policy */}
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          ≥ {salon.cancellationPolicyHours}h free
                        </td>

                        {/* Commission override */}
                        <td className="py-3.5 px-4">
                          {salon.customCommissionRate ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold">
                              {salon.customCommissionRate}% VIP
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">Standard (2.5%)</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              salon.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : salon.status === 'PENDING_REVIEW'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {salon.status === 'APPROVED' ? 'Active' : salon.status === 'PENDING_REVIEW' ? 'Pending' : 'Suspended'}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {salon.status === 'PENDING_REVIEW' && (
                              <button
                                onClick={() => handleApproveSalon(salon.id)}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
                              >
                                Approve
                              </button>
                            )}

                            <button
                              onClick={() => setEditingSalon(salon)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs"
                              title="Edit Salon Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setSuspendingSalon(salon)}
                              className={`p-1.5 rounded-lg border text-xs shadow-xs ${
                                salon.status === 'SUSPENDED'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                              }`}
                              title={salon.status === 'SUSPENDED' ? 'Reinstate Salon' : 'Suspend Salon'}
                            >
                              {salon.status === 'SUSPENDED' ? (
                                <Unlock className="w-3.5 h-3.5" />
                              ) : (
                                <Lock className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              onClick={() => setDeletingSalon(salon)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs"
                              title="Offboard Salon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: CHANGE REQUEST APPROVAL QUEUE (PRD 2.1.2) */}
          {/* ========================================================= */}
          {activeTab === 'requests' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Merchant Change Request Queue</h2>
                  <p className="text-xs text-slate-600">
                    Review side-by-side diffs for PayPal sandbox merchant account transitions and cancellation policy updates.
                  </p>
                </div>

                {/* Subtab Switcher */}
                <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <button
                    onClick={() => setCrSubTab('POLICY')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      crSubTab === 'POLICY'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Cancellation Policy Diffs ({state.changeRequests.filter((r) => r.type === 'CANCELLATION_POLICY').length})
                  </button>
                  <button
                    onClick={() => setCrSubTab('PAYPAL')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      crSubTab === 'PAYPAL'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    PayPal Merchant ID Changes ({state.changeRequests.filter((r) => r.type === 'PAYPAL_ACCOUNT').length})
                  </button>
                </div>
              </div>

              {/* Change Requests List */}
              <div className="space-y-4">
                {state.changeRequests
                  .filter((r) => (crSubTab === 'POLICY' ? r.type === 'CANCELLATION_POLICY' : r.type === 'PAYPAL_ACCOUNT'))
                  .map((cr) => {
                    const isPending = cr.status === 'PENDING_REVIEW';
                    const isApproved = cr.status === 'APPROVED';
                    const isRejected = cr.status === 'REJECTED';

                    return (
                      <div
                        key={cr.id}
                        className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-700">{cr.id}</span>
                              <span className="text-slate-300">·</span>
                              <span className="font-bold text-slate-900 text-base">{cr.salonName}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Submitted: {cr.submittedAt} · Type:{' '}
                              {cr.type === 'PAYPAL_ACCOUNT' ? 'PayPal Merchant ID Change' : 'Cancellation Policy Adjustment'}
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : isPending
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {cr.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* DIFF DISPLAY */}
                        {cr.type === 'CANCELLATION_POLICY' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Current */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                                Current Active Policy
                              </span>
                              <div className="text-slate-700">
                                Free Cancel Window: <strong className="text-slate-900">{cr.currentData.policyHours} hours</strong>
                              </div>
                              <div className="text-slate-700">
                                No-Show Fee: <strong className="text-slate-900">${cr.currentData.noShowFee}.00</strong>
                              </div>
                              <div className="text-slate-700">
                                Deposit Hold: <strong className="text-slate-900">{cr.currentData.holdPercent}% of ticket</strong>
                              </div>
                            </div>

                            {/* Proposed */}
                            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5 text-xs">
                              <span className="text-[10px] font-bold uppercase text-amber-800 block">
                                Proposed Requested Policy (Diff)
                              </span>
                              <div className="text-slate-800">
                                Free Cancel Window:{' '}
                                <strong className="text-amber-800 font-bold">{cr.proposedData.policyHours} hours</strong>
                              </div>
                              <div className="text-slate-800">
                                No-Show Fee:{' '}
                                <strong className="text-amber-800 font-bold">${cr.proposedData.noShowFee}.00</strong>
                              </div>
                              <div className="text-slate-800">
                                Deposit Hold:{' '}
                                <strong className="text-amber-800 font-bold">{cr.proposedData.holdPercent}% of ticket</strong>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                              <span className="text-[10px] font-sans font-bold uppercase text-slate-500 block">
                                Current PayPal Merchant ID
                              </span>
                              <div className="text-slate-800 truncate">{cr.currentData.paypalMerchantId}</div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                              <span className="text-[10px] font-sans font-bold uppercase text-amber-800 block">
                                Proposed PayPal Merchant ID
                              </span>
                              <div className="text-amber-800 font-bold truncate">{cr.proposedData.paypalMerchantId}</div>
                            </div>
                          </div>
                        )}

                        {/* Rejection notice if rejected */}
                        {isRejected && cr.rejectionReason && (
                          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                            <strong>Rejection Reason:</strong> {cr.rejectionReason}
                          </div>
                        )}

                        {/* Approval / Rejection Actions */}
                        {isPending && (
                          <div className="pt-2 flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => setRejectingCr(cr)}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
                            >
                              Reject Request
                            </button>
                            <button
                              onClick={() => handleApproveChangeRequest(cr)}
                              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
                            >
                              Approve Change &amp; Update Record →
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: COMMISSION MANAGEMENT CRUD (PRD 2.1.4) */}
          {/* ========================================================= */}
          {activeTab === 'commission' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Platform Commission &amp; Fee Rails</h2>
                <p className="text-xs text-slate-600">
                  Configure global platform fee parameters, grant custom VIP salon partner rate overrides, and audit fee capture.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Global Fee Rate Editor */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Global Platform Fee Tier
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Default fee assessed on completed tickets and captured no-show deposits.
                  </p>

                  <form onSubmit={handleSaveGlobalRate} className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600 font-semibold">Percentage Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={globalRateInput.percentage}
                        onChange={(e) =>
                          setGlobalRateInput({ ...globalRateInput, percentage: e.target.value })
                        }
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono font-bold shadow-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-600 font-semibold">Fixed Fee Per Transaction ($)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={globalRateInput.flatFee}
                        onChange={(e) =>
                          setGlobalRateInput({ ...globalRateInput, flatFee: e.target.value })
                        }
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono font-bold shadow-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                    >
                      Save Global Rate
                    </button>
                  </form>
                </div>

                {/* Custom Overrides Table (PRD 2.1.4) */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Partner Commission Overrides
                      </h3>
                      <p className="text-xs text-slate-600">
                        Tailored fee agreements for high-volume franchises or VIP pilot salons.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddOverrideOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-900 transition-colors shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Override</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                          <th className="py-2.5 px-4">Salon Partner</th>
                          <th className="py-2.5 px-4">Custom Rate</th>
                          <th className="py-2.5 px-4">Agreement Notes</th>
                          <th className="py-2.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {state.commissionOverrides.map((ov) => (
                          <tr key={ov.salonId} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 text-slate-900 font-sans font-bold">{ov.salonName}</td>
                            <td className="py-3 px-4 font-bold text-emerald-700">{ov.customRate}%</td>
                            <td className="py-3 px-4 text-slate-600 font-sans text-[11px]">{ov.note}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteOverride(ov.salonId)}
                                className="text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete override"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Commission Revenue Ledger */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Platform Commission Ledger
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-sans font-semibold">
                        <th className="py-2.5 px-4">Txn ID</th>
                        <th className="py-2.5 px-4">Salon</th>
                        <th className="py-2.5 px-4">Ticket Amount</th>
                        <th className="py-2.5 px-4">Captured</th>
                        <th className="py-2.5 px-4">Platform Fee Cut</th>
                        <th className="py-2.5 px-4">Net Payout to Salon</th>
                        <th className="py-2.5 px-4">PayPal Ref</th>
                        <th className="py-2.5 px-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {state.commissionTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-amber-700 font-bold">{tx.id}</td>
                          <td className="py-3 px-4 text-slate-900 font-sans font-medium">{tx.salonName}</td>
                          <td className="py-3 px-4 text-slate-700">${tx.bookingAmount.toFixed(2)}</td>
                          <td className="py-3 px-4 text-slate-700">${tx.capturedFee.toFixed(2)}</td>
                          <td className="py-3 px-4 text-emerald-700 font-bold">+${tx.platformCut.toFixed(2)}</td>
                          <td className="py-3 px-4 text-slate-900 font-bold">${tx.netPayout.toFixed(2)}</td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">{tx.paypalRef}</td>
                          <td className="py-3 px-4 text-slate-500 text-[11px] font-sans">{tx.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: CENTRAL TAXONOMY CRUD (PRD 2.1.5) */}
          {/* ========================================================= */}
          {activeTab === 'taxonomy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Central Service Category Taxonomy</h2>
                  <p className="text-xs text-slate-600">
                    Global catalog tags applied across all salon discovery searches and AI booking matchers.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ name: '', slug: '', description: '', iconName: 'Scissors', displayOrder: (state.categories.length + 1).toString() });
                    setIsAddCategoryOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Category</span>
                </button>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.categories.map((cat) => {
                  const isActive = cat.status === 'ACTIVE';

                  return (
                    <div
                      key={cat.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-amber-700">
                              <Scissors className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase">
                                Order #{cat.displayOrder}
                              </span>
                              <h3 className="text-base font-bold text-slate-900">{cat.name}</h3>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {cat.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-4">
                          {cat.description}
                        </p>

                        <div className="text-[11px] text-slate-500 font-mono">
                          Slug: <span className="text-slate-800 font-semibold">/{cat.slug}</span> · Services:{' '}
                          <strong className="text-amber-800">{cat.servicesCount} registered</strong>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                        <button
                          onClick={() => handleToggleCategoryStatus(cat.id)}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          {isActive ? 'Hide Category' : 'Activate Category'}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setCategoryForm({
                                name: cat.name,
                                slug: cat.slug,
                                description: cat.description,
                                iconName: cat.iconName,
                                displayOrder: cat.displayOrder.toString(),
                              });
                              setIsAddCategoryOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-xs"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCategory(cat)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: PLATFORM STAFF & USER MANAGEMENT (PRD 2.1.1) */}
          {/* ========================================================= */}
          {activeTab === 'staff' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Platform Staff &amp; RBAC Access</h2>
                  <p className="text-xs text-slate-600">
                    Manage administrator privileges across Super Admin, Compliance Officer, and Support Agent roles.
                  </p>
                </div>

                <button
                  onClick={() => setIsInviteUserOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Invite Admin</span>
                </button>
              </div>

              {/* Staff Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                      <th className="py-3 px-4">Administrator</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role Tier</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Last Activity</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {state.platformUsers.map((u) => {
                      const isActive = u.status === 'ACTIVE';
                      const isCurrent = u.id === state.currentUser.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-amber-800">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div>{u.name}</div>
                              {isCurrent && (
                                <span className="text-[10px] text-amber-800 font-mono font-semibold">(Your Current Session)</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-700">{u.email}</td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.role === 'Super Admin'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : u.role === 'Compliance Officer'
                                  ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{u.lastActive}</td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleUserStatus(u.id)}
                                disabled={isCurrent}
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded border transition-colors shadow-xs ${
                                  isCurrent
                                    ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
                                    : isActive
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {isActive ? 'Revoke Access' : 'Reactivate'}
                              </button>

                              <button
                                onClick={() => setDeletingUser(u)}
                                disabled={isCurrent}
                                className={`p-1.5 rounded-lg border text-rose-700 shadow-xs ${
                                  isCurrent
                                    ? 'opacity-30 cursor-not-allowed border-slate-200'
                                    : 'bg-rose-50 hover:bg-rose-100 border-rose-200'
                                }`}
                                title={isCurrent ? 'Cannot delete logged in user' : 'Delete Administrator'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD SALON PARTNER */}
      {/* ========================================================= */}
      {isAddSalonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Onboard New Salon Partner</h3>
              </div>
              <button onClick={() => setIsAddSalonOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSalon} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Salon Business Name *</label>
                <input
                  type="text"
                  required
                  value={salonForm.name}
                  onChange={(e) => setSalonForm({ ...salonForm, name: e.target.value })}
                  placeholder="e.g. Saffron &amp; Comb Studio"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Owner Full Name</label>
                  <input
                    type="text"
                    value={salonForm.ownerName}
                    onChange={(e) => setSalonForm({ ...salonForm, ownerName: e.target.value })}
                    placeholder="e.g. Maya Lin"
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={salonForm.email}
                    onChange={(e) => setSalonForm({ ...salonForm, email: e.target.value })}
                    placeholder="owner@salon.com"
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Street Address</label>
                  <input
                    type="text"
                    value={salonForm.address}
                    onChange={(e) => setSalonForm({ ...salonForm, address: e.target.value })}
                    placeholder="e.g. 55 Mercer St"
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">City &amp; State</label>
                  <input
                    type="text"
                    value={salonForm.city}
                    onChange={(e) => setSalonForm({ ...salonForm, city: e.target.value })}
                    placeholder="New York, NY"
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">PayPal Merchant Sandbox ID</label>
                <input
                  type="text"
                  value={salonForm.paypalMerchantId}
                  onChange={(e) => setSalonForm({ ...salonForm, paypalMerchantId: e.target.value })}
                  placeholder="e.g. MERCHANT_SAFFRON_8801"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSalonOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm"
                >
                  Onboard Salon &amp; Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT SALON DRAWER */}
      {/* ========================================================= */}
      {editingSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Salon: {editingSalon.name}</h3>
              <button onClick={() => setEditingSalon(null)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSalon} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Salon Name</label>
                <input
                  type="text"
                  value={editingSalon.name}
                  onChange={(e) => setEditingSalon({ ...editingSalon, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Contact Email</label>
                  <input
                    type="email"
                    value={editingSalon.email}
                    onChange={(e) => setEditingSalon({ ...editingSalon, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Cancellation Window (Hours)</label>
                  <input
                    type="number"
                    value={editingSalon.cancellationPolicyHours}
                    onChange={(e) =>
                      setEditingSalon({ ...editingSalon, cancellationPolicyHours: parseInt(e.target.value) || 24 })
                    }
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Custom Commission Rate Override (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingSalon.customCommissionRate || ''}
                  placeholder="Leave empty for standard 2.5%"
                  onChange={(e) =>
                    setEditingSalon({
                      ...editingSalon,
                      customCommissionRate: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSalon(null)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: SUSPEND / REINSTATE AUDIT PROMPT */}
      {/* ========================================================= */}
      {suspendingSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                {suspendingSalon.status === 'SUSPENDED' ? 'Reinstate Salon Account' : 'Suspend Salon Account'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {suspendingSalon.status === 'SUSPENDED'
                ? `Reinstating "${suspendingSalon.name}" will unlock new PayPal authorization holds and restore their stylist chairs to customer booking.`
                : `Suspending "${suspendingSalon.name}" halts authorization processing and hides their service catalog from discovery.`}
            </p>

            {suspendingSalon.status !== 'SUSPENDED' && (
              <div className="space-y-1 text-xs">
                <label className="text-slate-700 font-semibold">Audit Suspension Reason</label>
                <textarea
                  rows={3}
                  value={suspensionReasonInput}
                  onChange={(e) => setSuspensionReasonInput(e.target.value)}
                  placeholder="e.g. Consecutive customer complaints regarding disputed cancellation windows..."
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSuspendingSalon(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConfirmSuspensionHelper(suspendingSalon, handleConfirmSuspension)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm ${
                  suspendingSalon.status === 'SUSPENDED'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                Confirm {suspendingSalon.status === 'SUSPENDED' ? 'Reinstatement' : 'Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: DELETE SALON CONFIRMATION */}
      {/* ========================================================= */}
      {deletingSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-rose-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">Permanently Offboard Salon</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">{deletingSalon.name}</strong>? All pending authorization holds will be voided and staff access terminated.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingSalon(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSalon}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Delete &amp; Offboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: REJECT CHANGE REQUEST PROMPT */}
      {/* ========================================================= */}
      {rejectingCr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reject Request {rejectingCr.id}</h3>
            <p className="text-xs text-slate-600">
              Please enter the compliance reason for rejecting this change for {rejectingCr.salonName}.
            </p>

            <textarea
              rows={3}
              value={crRejectReason}
              onChange={(e) => setCrRejectReason(e.target.value)}
              placeholder="e.g. Policy fee exceeds maximum platform ceiling or merchant ID verification failed..."
              className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingCr(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectCR}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: ADD COMMISSION OVERRIDE */}
      {/* ========================================================= */}
      {isAddOverrideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Partner Commission Override</h3>
            <form onSubmit={handleCreateOverride} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Select Salon Partner</label>
                <select
                  required
                  value={overrideForm.salonId}
                  onChange={(e) => setOverrideForm({ ...overrideForm, salonId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                >
                  <option value="">Choose a salon...</option>
                  {state.organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Custom Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={overrideForm.customRate}
                  onChange={(e) => setOverrideForm({ ...overrideForm, customRate: e.target.value })}
                  placeholder="e.g. 1.8"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Notes / Agreement Reason</label>
                <input
                  type="text"
                  value={overrideForm.note}
                  onChange={(e) => setOverrideForm({ ...overrideForm, note: e.target.value })}
                  placeholder="e.g. VIP pilot partner agreement"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOverrideOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: ADD / EDIT TAXONOMY CATEGORY */}
      {/* ========================================================= */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create Taxonomy Category'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Bridal &amp; Event Styling"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">URL Slug</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="e.g. bridal-event-styling"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Summary of service offerings covered under this tag..."
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Display Priority</label>
                  <input
                    type="number"
                    value={categoryForm.displayOrder}
                    onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Icon Identifier</label>
                  <select
                    value={categoryForm.iconName}
                    onChange={(e) => setCategoryForm({ ...categoryForm, iconName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  >
                    <option value="Scissors">Scissors</option>
                    <option value="Sparkles">Sparkles</option>
                    <option value="Palette">Palette</option>
                    <option value="Flower2">Flower / Spa</option>
                    <option value="Crown">Crown / Shave</option>
                    <option value="HeartHandshake">Heart / Bridal</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 8: DELETE CATEGORY CONFIRMATION */}
      {/* ========================================================= */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-rose-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Category: {deletingCategory.name}</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove this category? Salons mapped to this tag will fall back to general styling.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingCategory(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 9: INVITE STAFF MEMBER */}
      {/* ========================================================= */}
      {isInviteUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Invite Platform Administrator</h3>
            <form onSubmit={handleInviteUser} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Staff Member Name *</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. Jordan Lee"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Corporate Email Address *</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="jordan.l@salondesk.io"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Role Tier (RBAC Privileges)</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as typeof userForm.role })}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                >
                  <option value="Super Admin">Super Admin (All Privileges &amp; Commission Changes)</option>
                  <option value="Compliance Officer">Compliance Officer (Policy &amp; Merchant Approvals)</option>
                  <option value="Support Agent">Support Agent (Directory &amp; Inquiry Read-Write)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteUserOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm"
                >
                  Send Admin Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 10: DELETE USER CONFIRMATION */}
      {/* ========================================================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-rose-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Administrator: {deletingUser.name}</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove this staff account? All admin session tokens will be permanently revoked.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper outside component
function handleConfirmConfirmSuspensionHelper(
  _salon: Organization,
  handler: () => void
) {
  return () => {
    handler();
  };
}
