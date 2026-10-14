'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import {
  loadStoredMerchantState,
  saveStoredMerchantState,
  getInitialMerchantState,
  MerchantConsoleState,
} from '@/lib/merchant-store';
import {
  Booking,
  StaffMember,
  SalonService,
  AuditLedgerEntry,
  ChangeRequest,
  HoldState,
} from '@/types';
import {
  Scissors,
  Calendar,
  Clock,
  ShieldCheck,
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
  Percent,
  TrendingUp,
  Check,
  X,
  CreditCard,
  Sliders,
  DollarSign,
  Users,
  Sparkles,
  Bot,
  Send,
  Zap,
  Menu,
  Activity,
  FileText,
  KeyRound,
  RefreshCw,
  Settings,
} from 'lucide-react';

// Counter for unique generated IDs outside React component to maintain purity
let merchantGlobalCounter = 5000;
function getNextId(prefix: string): string {
  merchantGlobalCounter += 1;
  return `${prefix}-${merchantGlobalCounter}`;
}

function getNextDebugId(prefix: string): string {
  merchantGlobalCounter += 1;
  return `DEBUG_${prefix}_${merchantGlobalCounter.toString(36).toUpperCase()}`;
}

export default function MerchantConsolePage() {
  const [state, setState] = useState<MerchantConsoleState>(() => loadStoredMerchantState());
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'calendar' | 'appointments' | 'staff' | 'services' | 'settings'
  >('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Notifications & Alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [idempotencyToast, setIdempotencyToast] = useState<string | null>(null);

  // Calendar Controls
  const [calendarDay, setCalendarDay] = useState<'TODAY' | 'TOMORROW'>('TODAY');

  // Appointment Drawer & Modals
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isSettlementProcessing, setIsSettlementProcessing] = useState(false);
  const [inspectConsentBooking, setInspectConsentBooking] = useState<Booking | null>(null);

  // Staff Modal
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'Senior Braider & Texture Specialist',
    workingHours: '9:00 AM - 6:00 PM',
    breakPeriod: '1:00 PM - 2:00 PM',
    specialties: 'Knotless Braids, Silk Press, Locs Retwist',
    maxSimultaneousClients: 2,
    status: 'ACTIVE' as 'ACTIVE' | 'ON_LEAVE',
  });
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);

  // Service Modal
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [editingService, setEditingService] = useState<SalonService | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'Braids & Locs' as SalonService['category'],
    durationMin: 120,
    price: 120,
    holdDeposit: 120,
    noShowFee: 30,
    description: '',
  });
  const [deletingService, setDeletingService] = useState<SalonService | null>(null);

  // Settings & Change Requests Modal
  const [isChangePaypalOpen, setIsChangePaypalOpen] = useState(false);
  const [paypalChangeInput, setPaypalChangeInput] = useState('');
  const [isChangePolicyOpen, setIsChangePolicyOpen] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    policyHours: 24,
    noShowFee: 30,
  });

  // Owner AI Assistant Panel (PayPal Agent Toolkit)
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotChat, setCopilotChat] = useState<
    Array<{
      role: 'user' | 'assistant';
      content: string;
      hasProposal?: boolean;
      proposalData?: {
        bookingId: string;
        clientName: string;
        refundAmount: number;
        reason: string;
      };
    }>
  >([
    {
      role: 'assistant',
      content:
        '👋 Hello Selamawit! I am your Salon AI Assistant powered by PayPal Agent Toolkit 1.11.0.\n\nI can verify client authorization holds, query appointment breakdowns, or propose goodwill partial refunds for emergencies.',
    },
  ]);
  const [pendingRefundProposal, setPendingRefundProposal] = useState<{
    targetBookingId: string;
    clientName: string;
    amount: number;
    reason: string;
  } | null>(null);

  // Appointments search & filter
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentFilter, setAppointmentFilter] = useState<string>('ALL');

  useEffect(() => {
    const handleUpdate = () => setState(loadStoredMerchantState());
    window.addEventListener('salondesk_merchant_state_updated', handleUpdate);
    return () => window.removeEventListener('salondesk_merchant_state_updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const showIdempotencyNotice = (msg: string) => {
    setIdempotencyToast(msg);
    setTimeout(() => setIdempotencyToast(null), 4500);
  };

  const updateState = (newState: MerchantConsoleState) => {
    setState(newState);
    saveStoredMerchantState(newState);
  };

  const handleResetDemoData = () => {
    const fresh = getInitialMerchantState();
    updateState(fresh);
    showToast('Merchant Console Demo Data Re-seeded Successfully!');
  };

  // Auth toggle
  const handleToggleAuth = () => {
    const nextAuth = !state.authenticated;
    updateState({ ...state, authenticated: nextAuth });
    showToast(nextAuth ? 'Signed in as Selamawit (Salon Owner)' : 'Signed out of Merchant Console');
  };

  // 1-Click Judge Sign-In
  const handleJudgeSignIn = () => {
    updateState({ ...state, authenticated: true });
    showToast('⚡ Instant Salon Owner Demo Access Granted! Welcome to Selam Hair Studio.');
  };

  // Simulate reconciliation drift toggle
  const handleToggleDrift = () => {
    const nextDrift = !state.simulatedDrift;
    updateState({
      ...state,
      simulatedDrift: nextDrift,
      lastReconciledAt: nextDrift ? 'Pending Drift (1 unmatched webhook)' : 'Reconciled 100% · Live',
    });
    showToast(nextDrift ? 'Simulated hold drift injected for judge inspection.' : 'Drift cleared; 100% reconciled.');
  };

  // -------------------------------------------------------------
  // HUMAN IN THE LOOP (HITL) SETTLEMENT ACTIONS
  // -------------------------------------------------------------
  const handleMarkShow = (booking: Booking) => {
    if (isSettlementProcessing) return;
    setIsSettlementProcessing(true);

    const idempotencyKey = `REQ_${booking.id}_CAPTURE_SHOW`;
    showIdempotencyNotice(`Idempotency Check: Key ${idempotencyKey} locked. Sending Capture request to PayPal Orders v2...`);

    setTimeout(() => {
      const updatedBookings = state.bookings.map((b) => {
        if (b.id === booking.id) {
          return {
            ...b,
            status: 'CAPTURED' as HoldState,
            settledAt: 'Just now',
            settlementNote: `Client attended appointment. Full ticket price ($${b.servicePrice}.00) captured via PayPal Orders v2.`,
          };
        }
        return b;
      });

      const newLedgerEntry: AuditLedgerEntry = {
        id: getNextId('LEDGER'),
        bookingId: booking.id,
        clientName: booking.clientName,
        serviceName: booking.serviceName,
        action: 'FULL_PAYMENT_CAPTURED',
        amount: booking.servicePrice,
        currency: 'USD',
        paypalDebugId: getNextDebugId('CAPTURE'),
        webhookVerified: true,
        timestamp: 'Just now',
        details: `Mark Show: Full ticket capture of $${booking.servicePrice}.00 executed. Authorization hold converted to final settlement.`,
      };

      const updated = {
        ...state,
        bookings: updatedBookings,
        auditLedger: [newLedgerEntry, ...state.auditLedger],
      };

      updateState(updated);
      setSelectedBooking(updatedBookings.find((b) => b.id === booking.id) || null);
      setIsSettlementProcessing(false);
      showToast(`Appointment ${booking.id} marked SHOW: $${booking.servicePrice}.00 captured successfully!`);
    }, 600);
  };

  const handleMarkNoShow = (booking: Booking) => {
    if (isSettlementProcessing) return;
    setIsSettlementProcessing(true);

    const idempotencyKey = `REQ_${booking.id}_CAPTURE_NOSHOW`;
    showIdempotencyNotice(
      `Idempotency Guard: Key ${idempotencyKey} engaged. Capturing no-show fee ($${booking.noShowFee}) with final_capture: true; releasing remainder ($${booking.holdAmount - booking.noShowFee})...`
    );

    setTimeout(() => {
      const remainderReleased = booking.holdAmount - booking.noShowFee;
      const updatedBookings = state.bookings.map((b) => {
        if (b.id === booking.id) {
          return {
            ...b,
            status: 'NO_SHOW_CAPTURED' as HoldState,
            settledAt: 'Just now',
            settlementNote: `Client missed slot. Partial no-show fee of $${b.noShowFee}.00 captured with final_capture: true. Remaining $${remainderReleased}.00 hold balance released immediately.`,
          };
        }
        return b;
      });

      const newLedgerEntry: AuditLedgerEntry = {
        id: getNextId('LEDGER'),
        bookingId: booking.id,
        clientName: booking.clientName,
        serviceName: booking.serviceName,
        action: 'NO_SHOW_FEE_CAPTURED',
        amount: booking.noShowFee,
        currency: 'USD',
        paypalDebugId: getNextDebugId('NOSHOW'),
        webhookVerified: true,
        timestamp: 'Just now',
        details: `Mark No-Show: $${booking.noShowFee}.00 fee captured. Remainder of $${remainderReleased}.00 released back to buyer card.`,
      };

      const updated = {
        ...state,
        bookings: updatedBookings,
        auditLedger: [newLedgerEntry, ...state.auditLedger],
      };

      updateState(updated);
      setSelectedBooking(updatedBookings.find((b) => b.id === booking.id) || null);
      setIsSettlementProcessing(false);
      showToast(`No-Show fee ($${booking.noShowFee}.00) captured; remaining $${remainderReleased}.00 hold released.`);
    }, 650);
  };

  const handleCancelAndVoid = (booking: Booking) => {
    if (isSettlementProcessing) return;
    setIsSettlementProcessing(true);

    const idempotencyKey = `REQ_${booking.id}_VOID`;
    showIdempotencyNotice(`Idempotency Check: Key ${idempotencyKey}. Voiding PayPal authorization hold immediately ($0 charged)...`);

    setTimeout(() => {
      const updatedBookings = state.bookings.map((b) => {
        if (b.id === booking.id) {
          return {
            ...b,
            status: 'VOIDED' as HoldState,
            settledAt: 'Just now',
            settlementNote: 'Appointment cancelled within policy window. PayPal authorization hold voided ($0 charged).',
          };
        }
        return b;
      });

      const newLedgerEntry: AuditLedgerEntry = {
        id: getNextId('LEDGER'),
        bookingId: booking.id,
        clientName: booking.clientName,
        serviceName: booking.serviceName,
        action: 'AUTHORIZATION_VOIDED',
        amount: booking.holdAmount,
        currency: 'USD',
        paypalDebugId: getNextDebugId('VOID'),
        webhookVerified: true,
        timestamp: 'Just now',
        details: `Appointment cancelled in policy window. PayPal authorization voided immediately, hold released with zero penalties.`,
      };

      const updated = {
        ...state,
        bookings: updatedBookings,
        auditLedger: [newLedgerEntry, ...state.auditLedger],
      };

      updateState(updated);
      setSelectedBooking(updatedBookings.find((b) => b.id === booking.id) || null);
      setIsSettlementProcessing(false);
      showToast(`Appointment ${booking.id} cancelled. Authorization hold voided with $0 penalty.`);
    }, 550);
  };

  const handleReauthorizeHold = (booking: Booking) => {
    const updatedBookings = state.bookings.map((b) => {
      if (b.id === booking.id) {
        return {
          ...b,
          status: 'REAUTHORIZED' as HoldState,
          honorPeriodEndsInHours: 72,
        };
      }
      return b;
    });

    const newLedgerEntry: AuditLedgerEntry = {
      id: getNextId('LEDGER'),
      bookingId: booking.id,
      clientName: booking.clientName,
      serviceName: booking.serviceName,
      action: 'HONOR_PERIOD_REAUTHORIZED',
      amount: booking.holdAmount,
      currency: 'USD',
      paypalDebugId: getNextDebugId('REAUTH'),
      webhookVerified: true,
      timestamp: 'Just now',
      details: `PayPal honor period extended for 72 hours via PayPal reauthorization API.`,
    };

    const updated = {
      ...state,
      bookings: updatedBookings,
      auditLedger: [newLedgerEntry, ...state.auditLedger],
    };

    updateState(updated);
    setSelectedBooking(updatedBookings.find((b) => b.id === booking.id) || null);
    showToast(`Honor period refreshed for ${booking.clientName}! 72 hours active.`);
  };

  // -------------------------------------------------------------
  // STAFF CRUD
  // -------------------------------------------------------------
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name) return;

    const specsArray = staffForm.specialties
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingStaff) {
      const updated = state.staff.map((s) =>
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
          : s
      );
      updateState({ ...state, staff: updated });
      showToast(`Stylist "${staffForm.name}" updated.`);
    } else {
      const newStaffId = getNextId('stf');
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
      };
      updateState({ ...state, staff: [...state.staff, newStaff] });
      showToast(`Stylist "${newStaff.name}" added to salon staff roster.`);
    }

    setIsAddStaffOpen(false);
    setEditingStaff(null);
  };

  const handleDeleteStaff = () => {
    if (!deletingStaff) return;
    const updated = state.staff.filter((s) => s.id !== deletingStaff.id);
    updateState({ ...state, staff: updated });
    setDeletingStaff(null);
    showToast(`Stylist "${deletingStaff.name}" removed from salon directory.`);
  };

  // -------------------------------------------------------------
  // SERVICE CATALOG CRUD
  // -------------------------------------------------------------
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name) return;

    if (editingService) {
      const updated = state.services.map((srv) =>
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
          : srv
      );
      updateState({ ...state, services: updated });
      showToast(`Service "${serviceForm.name}" updated.`);
    } else {
      const newService: SalonService = {
        id: getNextId('srv'),
        name: serviceForm.name,
        category: serviceForm.category,
        durationMin: Number(serviceForm.durationMin) || 60,
        price: Number(serviceForm.price) || 50,
        holdDeposit: Number(serviceForm.holdDeposit) || Number(serviceForm.price),
        noShowFee: Number(serviceForm.noShowFee) || 25,
        description: serviceForm.description || 'Premium salon styling with authorization hold protection.',
      };
      updateState({ ...state, services: [...state.services, newService] });
      showToast(`Service "${newService.name}" created.`);
    }

    setIsAddServiceOpen(false);
    setEditingService(null);
  };

  const handleDeleteService = () => {
    if (!deletingService) return;
    const updated = state.services.filter((s) => s.id !== deletingService.id);
    updateState({ ...state, services: updated });
    setDeletingService(null);
    showToast(`Service "${deletingService.name}" removed.`);
  };

  // -------------------------------------------------------------
  // SETTINGS & CHANGE REQUESTS
  // -------------------------------------------------------------
  const handleSubmitPaypalChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paypalChangeInput) return;

    const newCr: ChangeRequest = {
      id: getNextId('CR-PAYPAL'),
      type: 'PAYPAL_ACCOUNT',
      salonId: state.salon.id,
      salonName: state.salon.name,
      submittedAt: 'Just now',
      status: 'PENDING_REVIEW',
      currentData: {
        paypalMerchantId: state.salon.paypalMerchantId,
      },
      proposedData: {
        paypalMerchantId: paypalChangeInput,
      },
    };

    updateState({
      ...state,
      changeRequests: [newCr, ...state.changeRequests],
    });
    setIsChangePaypalOpen(false);
    setPaypalChangeInput('');
    showToast(`PayPal account change request submitted to Platform Admins for verification.`);
  };

  const handleSubmitPolicyChange = (e: React.FormEvent) => {
    e.preventDefault();

    const newCr: ChangeRequest = {
      id: getNextId('CR-POLICY'),
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
        policyHours: policyForm.policyHours,
        noShowFee: policyForm.noShowFee,
        holdPercent: 100,
      },
    };

    updateState({
      ...state,
      changeRequests: [newCr, ...state.changeRequests],
    });
    setIsChangePolicyOpen(false);
    showToast(`Cancellation policy amendment submitted for compliance review.`);
  };

  // -------------------------------------------------------------
  // OWNER AI ASSISTANT (PAYPAL AGENT TOOLKIT)
  // -------------------------------------------------------------
  const handleCopilotSend = (prefilledText?: string) => {
    const text = prefilledText || copilotQuery;
    if (!text.trim()) return;

    const userMsg = { role: 'user' as const, content: text };
    setCopilotChat((prev) => [...prev, userMsg]);
    setCopilotQuery('');

    const lower = text.toLowerCase();

    // Check for "Hana" query
    if (lower.includes('hana') || lower.includes('status of hana')) {
      const hanaBooking = state.bookings.find((b) => b.clientName.toLowerCase().includes('hana'));
      const response = hanaBooking
        ? `⚡ [toolkit.get_authorization("${hanaBooking.paypalAuthId}")]\n` +
          `Hana Bekele has an active authorization hold for $${hanaBooking.holdAmount}.00 for "${hanaBooking.serviceName}" scheduled for ${hanaBooking.appointmentTime}.\n` +
          `• Status: HELD (Intent: AUTHORIZE)\n` +
          `• Honor Period: ${hanaBooking.honorPeriodEndsInHours || 38} hours remaining\n` +
          `• $0.00 debited from client account today\n` +
          `• Stylist: ${hanaBooking.stylistName}`
        : 'Could not find an active booking for Hana.';

      setCopilotChat((prev) => [...prev, userMsg, { role: 'assistant', content: response }]);
      return;
    }

    // Check for "summarize" or volume query
    if (lower.includes('summarize') || lower.includes('hold volume') || lower.includes('transactions')) {
      const activeHolds = state.bookings.filter((b) => b.status === 'HELD' || b.status === 'REAUTHORIZED');
      const totalProtected = activeHolds.reduce((acc, b) => acc + b.holdAmount, 0);
      const captured = state.bookings.filter((b) => b.status === 'CAPTURED');
      const totalCaptured = captured.reduce((acc, b) => acc + b.servicePrice, 0);

      const response =
        `⚡ [toolkit.list_transactions & get_portfolio_summary]\n` +
        `• Active Protected Holds: ${activeHolds.length} bookings ($${totalProtected}.00 reserved on PayPal)\n` +
        `• Settled Revenue Today: $${totalCaptured}.00\n` +
        `• No-Show Protected Recoveries: $30.00 captured with zero chargebacks\n` +
        `• Next upcoming appointment: Hana Bekele (Today at 10:00 AM)`;

      setCopilotChat((prev) => [...prev, userMsg, { role: 'assistant', content: response }]);
      return;
    }

    // Check for partial refund intent (family emergency)
    if (lower.includes('emergency') || lower.includes('refund') || lower.includes('goodwill')) {
      const jamalBooking = state.bookings.find((b) => b.id === 'SD-8461');
      const refundAmount = 15.0;

      const response =
        `⚡ [toolkit.create_refund Proposal]\n` +
        `I recognized intent for a goodwill partial refund. The $30.00 no-show fee for Jamal Crawford (SD-8461) can be partially refunded by $15.00.\n` +
        `Human-in-the-Loop Safeguard: This transaction requires your explicit confirmation below.`;

      const proposal = {
        bookingId: jamalBooking?.id || 'SD-8461',
        clientName: jamalBooking?.clientName || 'Jamal Crawford',
        refundAmount: refundAmount,
        reason: 'Client Family Emergency - Goodwill 50% No-Show Waiver',
      };

      setPendingRefundProposal({
        targetBookingId: proposal.bookingId,
        clientName: proposal.clientName,
        amount: proposal.refundAmount,
        reason: proposal.reason,
      });

      setCopilotChat((prev) => [
        ...prev,
        userMsg,
        {
          role: 'assistant',
          content: response,
          hasProposal: true,
          proposalData: proposal,
        },
      ]);
      return;
    }

    // Default response
    const defaultResponse =
      `⚡ [PayPal Agent Toolkit 1.11.0]\n` +
      `I can query bookings, verify authorizations, or create refund proposals. Try asking: "What is the status of Hana's hold?" or "Client had a family emergency, refund half the $30 no-show fee."`;

    setCopilotChat((prev) => [...prev, userMsg, { role: 'assistant', content: defaultResponse }]);
  };

  const handleExecuteRefundProposal = (proposal: {
    bookingId: string;
    clientName: string;
    refundAmount: number;
    reason: string;
  }) => {
    const newLedgerEntry: AuditLedgerEntry = {
      id: getNextId('LEDGER-REFUND'),
      bookingId: proposal.bookingId,
      clientName: proposal.clientName,
      serviceName: 'No-Show Fee Goodwill Adjustment',
      action: 'GOODWILL_PARTIAL_REFUND',
      amount: proposal.refundAmount,
      currency: 'USD',
      paypalDebugId: getNextDebugId('REFUND'),
      webhookVerified: true,
      timestamp: 'Just now',
      details: `Owner confirmed $${proposal.refundAmount.toFixed(2)} goodwill partial refund via PayPal Agent Copilot. Reason: ${proposal.reason}.`,
    };

    updateState({
      ...state,
      auditLedger: [newLedgerEntry, ...state.auditLedger],
    });

    setPendingRefundProposal(null);
    setCopilotChat((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: `✅ Refund of $${proposal.refundAmount.toFixed(2)} successfully executed via PayPal Orders v2 API. Audit ledger entry #${newLedgerEntry.id} recorded.`,
      },
    ]);
    showToast(`$${proposal.refundAmount.toFixed(2)} refund issued to ${proposal.clientName}.`);
  };

  // Calculations for KPI Cards
  const activeHolds = state.bookings.filter((b) => b.status === 'HELD' || b.status === 'REAUTHORIZED');
  const activeHoldsVolume = activeHolds.reduce((acc, b) => acc + b.holdAmount, 0);
  const capturedBookings = state.bookings.filter((b) => b.status === 'CAPTURED');
  const capturedRevenue = capturedBookings.reduce((acc, b) => acc + b.servicePrice, 0) + 6775; // Adding MTD baseline
  const noShowRecovered = state.bookings.filter((b) => b.status === 'NO_SHOW_CAPTURED').reduce((acc, b) => acc + b.noShowFee, 0) + 390;

  // Filtered Appointments
  const filteredAppointments = state.bookings.filter((b) => {
    const matchesFilter = appointmentFilter === 'ALL' || b.status === appointmentFilter;
    const matchesSearch =
      b.clientName.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      b.id.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      b.serviceName.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      b.stylistName.toLowerCase().includes(appointmentSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // DEMO GATE SCREEN (IF LOGGED OUT)
  if (!state.authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl text-center space-y-6">
          <div className="flex justify-center mb-2">
            <Logo size="md" showTagline={false} linkToHome={false} theme="light" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <Scissors className="w-3.5 h-3.5 text-amber-600" />
              <span>Salon Management Gateway</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Merchant Console Sign-In</h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Operational portal for salon owners, stylists, and receptionists. Manage calendar appointments, execute HITL settlements, and configure deposit policies.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs font-mono space-y-2 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Salon Name:</span>
              <span className="text-amber-800 font-bold">Selam Hair Studio</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Owner Email:</span>
              <span className="text-slate-900">selam@selamhairstudio.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Demo Passcode:</span>
              <span className="text-emerald-700 font-bold">1234 (Pre-filled)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">PayPal Account:</span>
              <span className="text-slate-700">SELAM-BIZ-SANDBOX-01</span>
            </div>
          </div>

          <button
            onClick={handleJudgeSignIn}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>⚡ 1-Click Salon Owner Demo Login</span>
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-amber-500/20 relative overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Idempotency Alert Banner */}
      {idempotencyToast && (
        <div className="fixed top-20 right-5 z-50 max-w-md p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs shadow-2xl backdrop-blur-md animate-in fade-in space-y-1">
          <div className="flex items-center gap-2 font-bold text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Idempotency Guarantee Enforced</span>
          </div>
          <p className="text-[11px] text-emerald-100 leading-snug">{idempotencyToast}</p>
        </div>
      )}

      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* REGULAR LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 w-64 lg:w-72 h-screen bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out select-none shadow-sm ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" showTagline={false} linkToHome={true} theme="light" />
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                Salon
              </span>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Salon Pill */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 truncate">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <div className="text-left truncate">
                <div className="text-xs font-bold text-slate-900 truncate">{state.salon.name}</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">{state.salon.city}</div>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
              VIP 1.8%
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-5 overflow-y-auto custom-scrollbar">
            {/* Core Operations */}
            <div className="space-y-1">
              <span className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Salon Operations
              </span>

              {[
                { id: 'dashboard', label: 'Dashboard & KPIs', icon: Activity },
                {
                  id: 'calendar',
                  label: 'Calendar & Schedule',
                  icon: Calendar,
                  badge: activeHolds.length,
                  isAlert: true,
                },
                {
                  id: 'appointments',
                  label: 'Appointments & Ledger',
                  icon: FileText,
                  badge: state.bookings.length,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as typeof activeTab);
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
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          item.isAlert && item.badge > 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : isActive
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Management Modules */}
            <div className="space-y-1">
              <span className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Salon Configuration
              </span>

              {[
                { id: 'staff', label: 'Staff & Stylists', icon: Users, badge: state.staff.length },
                { id: 'services', label: 'Services & Pricing', icon: Scissors, badge: state.services.length },
                {
                  id: 'settings',
                  label: 'PayPal & Policy Settings',
                  icon: Settings,
                  badge: state.changeRequests.filter((r) => r.status === 'PENDING_REVIEW').length,
                  isAlert: true,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as typeof activeTab);
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
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          item.isAlert && item.badge > 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : isActive
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* AI Assistant Quick Trigger */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span className="flex items-center gap-1.5 text-amber-800">
                  <Bot className="w-4 h-4 text-amber-600" />
                  <span>Owner AI Assistant</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold">
                  v1.11
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Ask questions or propose goodwill partial refunds using PayPal Agent Toolkit.
              </p>
              <button
                onClick={() => setIsCopilotOpen(true)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                <span>Open Assistant</span>
              </button>
            </div>

            {/* Ecosystem Portals Jump */}
            <div className="space-y-1 pt-3 border-t border-slate-200">
              <span className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Ecosystem Jump
              </span>
              <Link
                href="/admin"
                className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <span>Platform Admin</span>
                <span className="text-[10px] text-amber-800 font-mono font-semibold">/admin →</span>
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
                    ST
                  </div>
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="text-left overflow-hidden">
                  <div className="text-xs font-bold text-slate-900 truncate">{state.salon.ownerName}</div>
                  <div className="text-[10px] text-amber-800 font-mono font-semibold truncate">Salon Owner</div>
                </div>
              </div>
              <button
                onClick={handleToggleAuth}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors border border-slate-200 shadow-xs"
                title="Lock Session"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleResetDemoData}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-amber-800 border border-slate-200 text-xs font-semibold transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Salon Demo Data</span>
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE */}
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
                Salon Console / {activeTab}
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>
                  {activeTab === 'dashboard' && 'Salon Overview & Financial KPIs'}
                  {activeTab === 'calendar' && 'Visual Appointment Schedule & Timeline'}
                  {activeTab === 'appointments' && 'Bookings & Cryptographic Audit Ledger'}
                  {activeTab === 'staff' && 'Salon Staff & Stylist Management'}
                  {activeTab === 'services' && 'Service Catalog & Deposit Policies'}
                  {activeTab === 'settings' && 'PayPal Account & Cancellation Settings'}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Reconciliation Status Pill */}
            <button
              onClick={handleToggleDrift}
              title="Click to toggle settlement drift simulation"
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                state.simulatedDrift
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  state.simulatedDrift ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <span>{state.lastReconciledAt}</span>
            </button>

            {/* Exit to Hub */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit to Hub</span>
            </Link>

            {/* Owner AI Assistant Button */}
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
            >
              <Bot className="w-4 h-4 fill-white" />
              <span className="hidden md:inline">AI Copilot</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* ========================================================= */}
          {/* TAB 1: SALON DASHBOARD & KPIS */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Active Authorization Holds */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Active Holds</span>
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    ${activeHoldsVolume.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-amber-800 flex items-center gap-1 mt-1 font-semibold">
                    <span>{activeHolds.length} upcoming appointments protected</span>
                  </div>
                </div>

                {/* Metric 2: Captured Revenue (MTD) */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Captured Revenue (MTD)</span>
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-700 tabular-nums">
                    ${capturedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1 font-semibold">
                    <span>100% settled via PayPal Orders v2</span>
                  </div>
                </div>

                {/* Metric 3: Protected No-Show Recoveries */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-rose-400 hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">No-Show Recoveries</span>
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    ${noShowRecovered.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1 font-semibold">
                    <span>0 card chargebacks · 100% recovered</span>
                  </div>
                </div>

                {/* Metric 4: Cancellation Window Notice */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Avg Cancellation Notice</span>
                    <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    28.4 hours
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-1">
                    <span>Policy requires ≥ {state.salon.cancellationPolicyHours}h notice</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Upcoming Appointments Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Today's Appointments */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Today&apos;s Upcoming Appointments
                      </h3>
                      <p className="text-xs text-slate-600">
                        Protected by PayPal authorization holds. Settle or mark no-show when client arrives.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('calendar')}
                      className="text-xs text-amber-800 hover:underline font-bold"
                    >
                      Open Calendar →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {state.bookings
                      .filter((b) => b.appointmentTime.includes('Today'))
                      .map((b) => (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBooking(b)}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-amber-50/40"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{b.clientName}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                  b.status === 'HELD'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : b.status === 'CAPTURED'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : b.status === 'REAUTHORIZED'
                                    ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {b.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600">
                              {b.serviceName} · <span className="text-amber-800 font-semibold">{b.appointmentTime}</span> · Stylist: {b.stylistName}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-bold text-slate-900">${b.servicePrice}.00</div>
                              <div className="text-[10px] text-slate-500">Hold: ${b.holdAmount}.00</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBooking(b);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-amber-800 border border-slate-300 text-xs font-semibold transition-colors shadow-xs"
                            >
                              Settlement Drawer →
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Salon Information & Quick Policy */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 flex flex-col justify-between shadow-sm">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Salon Account Status
                    </h3>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-mono">PayPal Merchant ID</span>
                        <div className="font-mono text-amber-800 font-bold flex items-center justify-between">
                          <span>{state.salon.paypalMerchantId}</span>
                          <span className="text-emerald-700 text-[10px] font-bold">VERIFIED ✓</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-mono">Cancellation Policy</span>
                        <div className="text-slate-800 font-medium">
                          ≥ {state.salon.cancellationPolicyHours} hours free notice
                        </div>
                        <div className="text-[11px] text-slate-600">
                          No-show fee: <strong className="text-slate-900">${state.salon.defaultNoShowFee}.00</strong>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-mono">Platform Commission Tier</span>
                        <div className="text-emerald-700 font-bold">
                          {state.salon.commissionRate}% VIP Rate
                        </div>
                        <div className="text-[10px] text-slate-500">Includes PayPal Orders v2 authorization rails</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-300 transition-colors shadow-xs"
                  >
                    Manage PayPal &amp; Policies →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: VISUAL CALENDAR & TIMELINE (PRD 2.2.5) */}
          {/* ========================================================= */}
          {activeTab === 'calendar' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Calendar Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Visual Appointment Schedule</h2>
                  <p className="text-xs text-slate-600">
                    Hold-colored appointment timeline. Click any slot to trigger HITL settlement (Mark Show, Mark No-Show, or Void).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Day Picker */}
                  <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <button
                      onClick={() => setCalendarDay('TODAY')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        calendarDay === 'TODAY'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Today (Wed)
                    </button>
                    <button
                      onClick={() => setCalendarDay('TOMORROW')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        calendarDay === 'TOMORROW'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Tomorrow (Thu)
                    </button>
                  </div>

                  {/* Legend Indicator */}
                  <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] shadow-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-amber-800 font-semibold">Active Hold</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      <span className="text-sky-800 font-semibold">Day 4+ Reauth</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-emerald-800 font-semibold">Captured</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-rose-800 font-semibold">No-Show Fee</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* STYLIST COLUMNS SCHEDULE GRID */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="min-w-[900px]">
                  {/* Stylist Headers */}
                  <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50">
                    {state.staff.map((stylist) => (
                      <div key={stylist.id} className="p-4 border-r border-slate-200 last:border-r-0">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={stylist.avatar}
                            alt={stylist.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-amber-300"
                          />
                          <div>
                            <div className="text-sm font-bold text-slate-900">{stylist.name}</div>
                            <div className="text-[11px] text-slate-500">{stylist.role}</div>
                            <div className="text-[10px] text-amber-800 font-mono font-semibold">
                              ★ {stylist.rating.toFixed(1)} · {stylist.workingHours}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Schedule Slots Canvas */}
                  <div className="grid grid-cols-4 min-h-[500px] divide-x divide-slate-100 p-4 gap-4 bg-slate-50/30">
                    {state.staff.map((stylist) => {
                      const stylistBookings = state.bookings.filter(
                        (b) =>
                          b.stylistId === stylist.id &&
                          (calendarDay === 'TODAY'
                            ? b.appointmentTime.includes('Today') || b.appointmentTime.includes('AM') || b.appointmentTime.includes('PM')
                            : b.appointmentTime.includes('Tomorrow'))
                      );

                      return (
                        <div key={stylist.id} className="space-y-3">
                          {stylistBookings.length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">
                              No scheduled appointments for this shift.
                            </div>
                          ) : (
                            stylistBookings.map((b) => {
                              const isHeld = b.status === 'HELD';
                              const isCaptured = b.status === 'CAPTURED';
                              const isNoShow = b.status === 'NO_SHOW_CAPTURED';
                              const isReauth = b.status === 'REAUTHORIZED';
                              const isVoided = b.status === 'VOIDED';

                              return (
                                <div
                                  key={b.id}
                                  onClick={() => setSelectedBooking(b)}
                                  className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs group relative overflow-hidden ${
                                    isHeld
                                      ? 'bg-amber-50/80 border-amber-300 hover:border-amber-500'
                                      : isReauth
                                      ? 'bg-sky-50 border-sky-300 hover:border-sky-500'
                                      : isCaptured
                                      ? 'bg-emerald-50 border-emerald-300 hover:border-emerald-500'
                                      : isNoShow
                                      ? 'bg-rose-50 border-rose-300 hover:border-rose-500'
                                      : 'bg-slate-100 border-slate-200 opacity-60'
                                  }`}
                                >
                                  {/* Top Row: Time & Badge */}
                                  <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      {b.appointmentTime}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                        isHeld
                                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                                          : isReauth
                                          ? 'bg-sky-100 text-sky-900 border-sky-300'
                                          : isCaptured
                                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                          : isNoShow
                                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                                          : 'bg-slate-200 text-slate-700 border-slate-300'
                                      }`}
                                    >
                                      {b.status}
                                    </span>
                                  </div>

                                  {/* Client & Service */}
                                  <div className="font-bold text-slate-900 text-sm group-hover:text-amber-800 transition-colors">
                                    {b.clientName}
                                  </div>
                                  <div className="text-xs text-slate-600 leading-snug line-clamp-1 mb-2">
                                    {b.serviceName}
                                  </div>

                                  {/* Hold Amount & Honor Period Pill */}
                                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                                    <span className="font-mono text-slate-700 font-bold">
                                      ${b.servicePrice}.00 ticket
                                    </span>
                                    <span className="font-mono text-amber-800 font-semibold">
                                      Hold: ${b.holdAmount}.00
                                    </span>
                                  </div>

                                  {/* Special Indicator Footers */}
                                  {isHeld && b.honorPeriodEndsInHours && (
                                    <div className="mt-2 text-[10px] text-amber-800 font-mono font-medium flex items-center gap-1">
                                      <span>⚡ Honor period ends in {b.honorPeriodEndsInHours}h</span>
                                    </div>
                                  )}

                                  {isReauth && (
                                    <div className="mt-2 text-[10px] text-sky-800 font-mono font-medium flex items-center gap-1">
                                      <span>🔄 Day 4+ Reauthorized Hold</span>
                                    </div>
                                  )}

                                  {isNoShow && (
                                    <div className="mt-2 text-[10px] text-rose-800 font-mono font-medium">
                                      Fee: ${b.noShowFee} retained · remainder released
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: APPOINTMENTS & AUDIT LEDGER */}
          {/* ========================================================= */}
          {activeTab === 'appointments' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Appointments &amp; Audit Ledger</h2>
                  <p className="text-xs text-slate-600">
                    Real-time transaction table with server-signed Ed25519 consent receipts, sha256 hashes, and PayPal debug IDs.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={appointmentSearch}
                      onChange={(e) => setAppointmentSearch(e.target.value)}
                      placeholder="Search client, ID, service..."
                      className="pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>

                  {/* Filter pills */}
                  <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-200 shadow-xs">
                    {['ALL', 'HELD', 'CAPTURED', 'NO_SHOW_CAPTURED', 'REAUTHORIZED', 'VOIDED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setAppointmentFilter(st)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          appointmentFilter === st
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {st === 'ALL'
                          ? 'All'
                          : st === 'NO_SHOW_CAPTURED'
                          ? 'No-Show'
                          : st === 'REAUTHORIZED'
                          ? 'Reauth'
                          : st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bookings Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                      <th className="py-3 px-4">Booking Ref</th>
                      <th className="py-3 px-4">Client &amp; Contact</th>
                      <th className="py-3 px-4">Service &amp; Stylist</th>
                      <th className="py-3 px-4">Scheduled Slot</th>
                      <th className="py-3 px-4">Hold Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Consent Receipt</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-700">{b.id}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{b.clientName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{b.clientPhone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-900 font-medium">{b.serviceName}</div>
                          <div className="text-[11px] text-amber-800 font-mono font-semibold">Stylist: {b.stylistName}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{b.appointmentTime}</td>
                        <td className="py-3.5 px-4 font-mono">
                          <div className="text-slate-900 font-bold">${b.servicePrice}.00</div>
                          <div className="text-[11px] text-amber-800">Hold: ${b.holdAmount}.00</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              b.status === 'HELD'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : b.status === 'CAPTURED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : b.status === 'REAUTHORIZED'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : b.status === 'NO_SHOW_CAPTURED'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => setInspectConsentBooking(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700 hover:text-amber-800 hover:border-amber-300 transition-colors shadow-xs"
                          >
                            <KeyRound className="w-3 h-3 text-amber-600" />
                            <span>Inspect Hash</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-colors shadow-xs"
                          >
                            Settle / Details →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* AUDIT LEDGER TABLE */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Cryptographic Audit Ledger (PayPal Orders v2)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    100% Webhook Verified
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-sans font-semibold">
                        <th className="py-2.5 px-4">Ledger ID</th>
                        <th className="py-2.5 px-4">Booking Ref</th>
                        <th className="py-2.5 px-4">Client</th>
                        <th className="py-2.5 px-4">Action</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4">PayPal Debug ID</th>
                        <th className="py-2.5 px-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {state.auditLedger.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-amber-700 font-bold">{entry.id}</td>
                          <td className="py-3 px-4 text-slate-600">{entry.bookingId}</td>
                          <td className="py-3 px-4 text-slate-900 font-sans font-medium">{entry.clientName}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                entry.action === 'FULL_PAYMENT_CAPTURED'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : entry.action === 'NO_SHOW_FEE_CAPTURED'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : entry.action === 'AUTHORIZATION_CREATED'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : entry.action === 'GOODWILL_PARTIAL_REFUND'
                                  ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                  : 'bg-sky-50 text-sky-800 border border-sky-200'
                              }`}
                            >
                              {entry.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-900 font-bold">${entry.amount}.00</td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">{entry.paypalDebugId}</td>
                          <td className="py-3 px-4 text-slate-500 text-[11px] font-sans">{entry.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: STAFF & STYLISTS CRUD */}
          {/* ========================================================= */}
          {activeTab === 'staff' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Staff &amp; Stylist Management</h2>
                  <p className="text-xs text-slate-600">
                    Configure staff working hours, breaks, specialties, and client capacity for authorization hold bookings.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingStaff(null);
                    setStaffForm({
                      name: '',
                      role: 'Lead Stylist',
                      workingHours: '9:00 AM - 6:00 PM',
                      breakPeriod: '1:00 PM - 2:00 PM',
                      specialties: 'Knotless Braids, Silk Press',
                      maxSimultaneousClients: 2,
                      status: 'ACTIVE',
                    });
                    setIsAddStaffOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Stylist</span>
                </button>
              </div>

              {/* Staff Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {state.staff.map((stylist) => (
                  <div
                    key={stylist.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between shadow-sm space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={stylist.avatar}
                          alt={stylist.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-amber-300"
                        />
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            stylist.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {stylist.status || 'ACTIVE'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900">{stylist.name}</h3>
                        <p className="text-xs text-amber-800 font-semibold">{stylist.role}</p>
                        <div className="text-[11px] text-slate-500 font-mono mt-1">
                          ★ {stylist.rating.toFixed(1)} ({stylist.reviewsCount} reviews)
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                        <div className="text-slate-700">
                          Hours: <strong className="text-slate-900">{stylist.workingHours}</strong>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Break: {stylist.breakPeriod}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Max Clients: {stylist.maxSimultaneousClients || 1} at a time
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {stylist.specialties.map((spec, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-medium"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingStaff(stylist);
                          setStaffForm({
                            name: stylist.name,
                            role: stylist.role,
                            workingHours: stylist.workingHours || '9:00 AM - 6:00 PM',
                            breakPeriod: stylist.breakPeriod || '1:00 PM - 2:00 PM',
                            specialties: stylist.specialties.join(', '),
                            maxSimultaneousClients: stylist.maxSimultaneousClients || 1,
                            status: stylist.status || 'ACTIVE',
                          });
                          setIsAddStaffOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-xs"
                        title="Edit Stylist"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingStaff(stylist)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs"
                        title="Remove Stylist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: SERVICE CATALOG & DEPOSIT POLICIES */}
          {/* ========================================================= */}
          {activeTab === 'services' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Services &amp; Deposit Policy Catalog</h2>
                  <p className="text-xs text-slate-600">
                    Define service pricing, required hold deposits, and customizable no-show retention fees.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingService(null);
                    setServiceForm({
                      name: '',
                      category: 'Braids & Locs',
                      durationMin: 120,
                      price: 120,
                      holdDeposit: 120,
                      noShowFee: 30,
                      description: '',
                    });
                    setIsAddServiceOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Service</span>
                </button>
              </div>

              {/* Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between shadow-sm space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                          {srv.category}
                        </span>
                        <span className="font-mono text-xs text-slate-500">{srv.durationMin} mins</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mb-1">{srv.name}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                        {srv.description}
                      </p>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between text-slate-700">
                          <span>Service Price:</span>
                          <strong className="text-slate-900">${srv.price}.00</strong>
                        </div>
                        <div className="flex justify-between text-amber-800 font-bold">
                          <span>PayPal Hold Deposit:</span>
                          <span>${srv.holdDeposit}.00</span>
                        </div>
                        <div className="flex justify-between text-rose-700">
                          <span>No-Show Retained Fee:</span>
                          <span>${srv.noShowFee}.00</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 font-mono">
                        24h free cancellation
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingService(srv);
                            setServiceForm({
                              name: srv.name,
                              category: srv.category,
                              durationMin: srv.durationMin,
                              price: srv.price,
                              holdDeposit: srv.holdDeposit,
                              noShowFee: srv.noShowFee,
                              description: srv.description,
                            });
                            setIsAddServiceOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-xs"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingService(srv)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs"
                          title="Delete Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: SETTINGS & CHANGE REQUESTS (PRD 2.2.6) */}
          {/* ========================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">PayPal Account &amp; Cancellation Settings</h2>
                <p className="text-xs text-slate-600">
                  Manage payout credentials and submit formal policy amendment requests to the Platform Operator.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Panel 1: Current Approved PayPal Account */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-amber-600" />
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        PayPal Merchant Credentials
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      VERIFIED_ACTIVE
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Client authorization holds and captured deposits route directly to your connected PayPal business wallet.
                  </p>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Merchant Account ID:</span>
                      <span className="text-slate-900 font-bold">{state.salon.paypalMerchantId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">API Gateway Version:</span>
                      <span className="text-slate-700">PayPal Orders v2 (intent: AUTHORIZE)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Commission Tier:</span>
                      <span className="text-amber-800 font-bold">{state.salon.commissionRate}% VIP Partner</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPaypalChangeInput('');
                      setIsChangePaypalOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 hover:border-amber-400 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Submit Change Request for PayPal ID</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Panel 2: Cancellation Policy Settings */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-600" />
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Default Cancellation Policy
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      ENFORCED ON PAYPAL
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Clients are guaranteed 100% free cancellation if cancelled prior to the cutoff window. After cutoff, no-show fees are captured.
                  </p>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Free Notice Window:</span>
                      <span className="text-slate-900 font-bold">≥ {state.salon.cancellationPolicyHours} hours prior</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Default No-Show Fee:</span>
                      <span className="text-rose-700 font-bold">${state.salon.defaultNoShowFee}.00 USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hold Policy:</span>
                      <span className="text-emerald-700 font-semibold">100% non-debit authorization</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPolicyForm({
                        policyHours: state.salon.cancellationPolicyHours,
                        noShowFee: state.salon.defaultNoShowFee,
                      });
                      setIsChangePolicyOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 hover:border-amber-400 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Propose Cancellation Policy Amendment</span>
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Change Requests History Table */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Submitted Change Requests (Admin Review Queue)
                  </h3>
                  <span className="text-xs text-slate-500">Requires Platform Operator Verification</span>
                </div>

                <div className="space-y-3">
                  {state.changeRequests.map((cr) => (
                    <div
                      key={cr.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-700 font-bold">{cr.id}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-bold text-slate-900">
                            {cr.type === 'PAYPAL_ACCOUNT'
                              ? 'PayPal Account ID Transition'
                              : 'Cancellation Policy Adjustment'}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Submitted {cr.submittedAt} · Status:{' '}
                          <span className="text-amber-800 font-bold">{cr.status.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          Under Admin Review
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* DRAWER 1: APPOINTMENT DETAIL & HITL SETTLEMENT DRAWER */}
      {/* ========================================================= */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md h-full bg-white border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto space-y-6 shadow-2xl">
            {/* Top Close */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-bold text-slate-900">Appointment Settlement</h3>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  selectedBooking.status === 'HELD'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : selectedBooking.status === 'CAPTURED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : selectedBooking.status === 'REAUTHORIZED'
                    ? 'bg-sky-50 border-sky-200 text-sky-800'
                    : selectedBooking.status === 'NO_SHOW_CAPTURED'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Status: {selectedBooking.status}</span>
                </div>
                <span className="text-[10px] font-mono font-bold">
                  Ref: {selectedBooking.id}
                </span>
              </div>

              {/* Client & Service Info */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Client Details</div>
                  <div className="font-bold text-slate-900 text-sm">{selectedBooking.clientName}</div>
                  <div className="text-slate-600">{selectedBooking.clientEmail}</div>
                  <div className="text-slate-600 font-mono">{selectedBooking.clientPhone}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Service &amp; Stylist</div>
                  <div className="font-bold text-slate-900 text-sm">{selectedBooking.serviceName}</div>
                  <div className="text-amber-800 font-semibold">Stylist: {selectedBooking.stylistName}</div>
                  <div className="text-slate-600">Scheduled: {selectedBooking.appointmentTime}</div>
                </div>

                {/* Financial breakdown */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono">
                  <div className="text-[10px] text-slate-500 uppercase font-sans">Payment &amp; Hold Policy</div>
                  <div className="flex justify-between text-slate-700">
                    <span>Full Ticket Price:</span>
                    <strong className="text-slate-900">${selectedBooking.servicePrice}.00</strong>
                  </div>
                  <div className="flex justify-between text-amber-800 font-bold">
                    <span>Active PayPal Hold:</span>
                    <span>${selectedBooking.holdAmount}.00</span>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>No-Show Cutoff Fee:</span>
                    <span>${selectedBooking.noShowFee}.00</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                    <span>Upfront Debited Today:</span>
                    <strong className="text-emerald-700 font-bold">$0.00</strong>
                  </div>
                </div>

                {/* Cryptographic Consent & PayPal ID */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5 font-mono text-[11px]">
                  <div className="text-[10px] text-amber-800 font-sans font-bold uppercase">
                    PayPal Authorization Record
                  </div>
                  <div className="text-slate-700 truncate">
                    Auth ID: <span className="text-slate-900 font-bold">{selectedBooking.paypalAuthId}</span>
                  </div>
                  <div className="text-slate-700 truncate">
                    Idempotency Key: <span className="text-slate-600">{selectedBooking.idempotencyKey}</span>
                  </div>
                  <div className="text-slate-500 truncate text-[10px]">
                    Consent Hash: {selectedBooking.consentHash}
                  </div>
                </div>

                {/* Settlement Note if already settled */}
                {selectedBooking.settlementNote && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 space-y-1">
                    <span className="font-bold text-amber-800 block">Settlement Record:</span>
                    <p>{selectedBooking.settlementNote}</p>
                  </div>
                )}
              </div>
            </div>

            {/* HUMAN IN THE LOOP (HITL) SETTLEMENT BUTTONS */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Staff HITL Settlement Controls
              </span>

              {/* Button 1: Mark Show / Complete */}
              <button
                onClick={() => handleMarkShow(selectedBooking)}
                disabled={isSettlementProcessing || selectedBooking.status === 'CAPTURED'}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  selectedBooking.status === 'CAPTURED'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm active:scale-98'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {selectedBooking.status === 'CAPTURED'
                    ? 'Full Ticket Already Captured'
                    : `Mark Show & Capture Full ($${selectedBooking.servicePrice}.00)`}
                </span>
              </button>

              {/* Button 2: Mark No-Show */}
              <button
                onClick={() => handleMarkNoShow(selectedBooking)}
                disabled={isSettlementProcessing || selectedBooking.status === 'NO_SHOW_CAPTURED' || selectedBooking.status === 'CAPTURED'}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  selectedBooking.status === 'NO_SHOW_CAPTURED'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200 cursor-not-allowed'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-98'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>
                  {selectedBooking.status === 'NO_SHOW_CAPTURED'
                    ? 'No-Show Fee Captured ($30.00)'
                    : `Mark No-Show (Fee Only $${selectedBooking.noShowFee}.00 · Release Rest)`}
                </span>
              </button>

              {/* Button 3: Reauthorize Hold (For Day 4+) */}
              {selectedBooking.status === 'HELD' && (
                <button
                  onClick={() => handleReauthorizeHold(selectedBooking)}
                  className="w-full py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                  <span>Reauthorize Hold (Extend 72h Window)</span>
                </button>
              )}

              {/* Button 4: Cancel and Void Hold */}
              <button
                onClick={() => handleCancelAndVoid(selectedBooking)}
                disabled={isSettlementProcessing || selectedBooking.status === 'VOIDED' || selectedBooking.status === 'CAPTURED'}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  selectedBooking.status === 'VOIDED'
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Cancel Appointment &amp; Void Authorization ($0)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER 2: OWNER AI ASSISTANT (PAYPAL AGENT TOOLKIT) */}
      {/* ========================================================= */}
      {isCopilotOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md h-full bg-white border-l border-slate-200 flex flex-col justify-between shadow-2xl">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 border border-amber-300">
                  <Bot className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Owner AI Assistant</h3>
                  <p className="text-[10px] text-amber-800 font-mono font-semibold">PayPal Agent Toolkit 1.11.0</p>
                </div>
              </div>
              <button
                onClick={() => setIsCopilotOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="p-3 bg-white border-b border-slate-100 flex flex-wrap gap-1.5 shrink-0">
              <button
                onClick={() => handleCopilotSend("What is the status of Hana's hold?")}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 hover:border-amber-400 text-[10px] text-slate-700 hover:text-amber-800 transition-colors"
              >
                🔍 Hana&apos;s hold status?
              </button>
              <button
                onClick={() => handleCopilotSend("Summarize today's hold volume and transactions")}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 hover:border-amber-400 text-[10px] text-slate-700 hover:text-amber-800 transition-colors"
              >
                📊 Today&apos;s volume summary
              </button>
              <button
                onClick={() =>
                  handleCopilotSend('Client had a family emergency, refund half the $30 no-show fee.')
                }
                className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 hover:border-rose-300 text-[10px] text-rose-700 transition-colors"
              >
                ⚡ Propose emergency refund
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {copilotChat.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col space-y-2 ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl max-w-[88%] whitespace-pre-line leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-800'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* PROPOSED ACTION CARD (HITL REQUIREMENT) */}
                  {msg.hasProposal && msg.proposalData && (
                    <div className="w-full p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-purple-900 font-bold uppercase tracking-wider">
                          ProposedAction: create_refund
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          HITL Confirmation Required
                        </span>
                      </div>

                      <div className="space-y-1 font-mono text-xs">
                        <div className="text-slate-900 font-bold">
                          Client: {msg.proposalData.clientName} ({msg.proposalData.bookingId})
                        </div>
                        <div className="text-emerald-700 font-bold text-sm">
                          Refund Amount: ${msg.proposalData.refundAmount.toFixed(2)} USD
                        </div>
                        <div className="text-slate-600 text-[11px] font-sans">
                          Reason: {msg.proposalData.reason}
                        </div>
                      </div>

                      <button
                        onClick={() => handleExecuteRefundProposal(msg.proposalData!)}
                        className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm ${msg.proposalData.refundAmount.toFixed(2)} Partial Refund via PayPal</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCopilotSend();
              }}
              className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2"
            >
              <input
                type="text"
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                placeholder="Ask assistant about holds or settlements..."
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs flex items-center justify-center transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: INSPECT ED25519 CONSENT RECEIPT & SHA256 HASH */}
      {/* ========================================================= */}
      {inspectConsentBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-sans font-bold text-slate-900">Cryptographic Consent Record</h3>
              </div>
              <button
                onClick={() => setInspectConsentBooking(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-600 font-sans leading-relaxed">
              Client explicitly authorized PayPal deposit hold with zero upfront charge, agreeing to the 24h cancellation window and $30 no-show fee.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-slate-500 text-[10px] uppercase">Client Signature Hash</div>
              <div className="text-amber-800 break-all font-semibold">{inspectConsentBooking.consentHash}</div>

              <div className="text-slate-500 text-[10px] uppercase pt-1">PayPal Authorization ID</div>
              <div className="text-emerald-700 font-bold">{inspectConsentBooking.paypalAuthId}</div>

              <div className="text-slate-500 text-[10px] uppercase pt-1">Idempotency Request Key</div>
              <div className="text-slate-800">{inspectConsentBooking.idempotencyKey}</div>

              <div className="text-slate-500 text-[10px] uppercase pt-1">Signing Standard</div>
              <div className="text-slate-700">Ed25519 SHA-256 Nonce Verification</div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectConsentBooking(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-bold border border-slate-300"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT STYLIST */}
      {/* ========================================================= */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingStaff ? `Edit Stylist: ${editingStaff.name}` : 'Add New Salon Stylist'}
              </h3>
              <button onClick={() => setIsAddStaffOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Stylist Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Jordan Vance"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Role / Title</label>
                <input
                  type="text"
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  placeholder="e.g. Senior Braider &amp; Texture Specialist"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Working Hours</label>
                  <input
                    type="text"
                    value={staffForm.workingHours}
                    onChange={(e) => setStaffForm({ ...staffForm, workingHours: e.target.value })}
                    placeholder="9:00 AM - 6:00 PM"
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Break Period</label>
                  <input
                    type="text"
                    value={staffForm.breakPeriod}
                    onChange={(e) => setStaffForm({ ...staffForm, breakPeriod: e.target.value })}
                    placeholder="1:00 PM - 2:00 PM"
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Specialties (comma-separated)</label>
                <input
                  type="text"
                  value={staffForm.specialties}
                  onChange={(e) => setStaffForm({ ...staffForm, specialties: e.target.value })}
                  placeholder="Knotless Braids, Silk Press, Locs"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Max Simultaneous Clients</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={staffForm.maxSimultaneousClients}
                    onChange={(e) => setStaffForm({ ...staffForm, maxSimultaneousClients: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Availability Status</label>
                  <select
                    value={staffForm.status}
                    onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value as 'ACTIVE' | 'ON_LEAVE' })}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  >
                    <option value="ACTIVE">ACTIVE (On Schedule)</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-sm"
                >
                  {editingStaff ? 'Update Stylist' : 'Save Stylist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE STYLIST CONFIRMATION */}
      {/* ========================================================= */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-rose-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Remove Stylist: {deletingStaff.name}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove this stylist from the salon directory? Any open appointments must be reassigned before removal.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingStaff(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStaff}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT SERVICE */}
      {/* ========================================================= */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingService ? `Edit Service: ${editingService.name}` : 'Create New Salon Service'}
              </h3>
              <button onClick={() => setIsAddServiceOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Service Name *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="e.g. Knotless Micro Braids"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Category</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, category: e.target.value as SalonService['category'] })
                    }
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  >
                    <option value="Braids & Locs">Braids &amp; Locs</option>
                    <option value="Styling & Color">Styling &amp; Color</option>
                    <option value="Haircuts">Haircuts</option>
                    <option value="Beard & Grooming">Beard &amp; Grooming</option>
                    <option value="Spa & Facial">Spa &amp; Facial</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Duration (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={serviceForm.durationMin}
                    onChange={(e) => setServiceForm({ ...serviceForm, durationMin: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Price ($)</label>
                  <input
                    type="number"
                    min="10"
                    value={serviceForm.price}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setServiceForm({ ...serviceForm, price: val, holdDeposit: val });
                    }}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Hold Deposit ($)</label>
                  <input
                    type="number"
                    min="10"
                    value={serviceForm.holdDeposit}
                    onChange={(e) => setServiceForm({ ...serviceForm, holdDeposit: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">No-Show Fee ($)</label>
                  <input
                    type="number"
                    min="5"
                    value={serviceForm.noShowFee}
                    onChange={(e) => setServiceForm({ ...serviceForm, noShowFee: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Service Description</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Includes hair prep and botanical steam rinse..."
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-sm"
                >
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE SERVICE CONFIRMATION */}
      {/* ========================================================= */}
      {deletingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-rose-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Service: {deletingService.name}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove this service offering? Existing bookings will retain their original price and hold terms.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingService(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteService}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Delete Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SUBMIT PAYPAL CHANGE REQUEST */}
      {/* ========================================================= */}
      {isChangePaypalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Request PayPal Merchant ID Change</h3>
              <button onClick={() => setIsChangePaypalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPaypalChange} className="space-y-3.5 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Platform Admin approval is required before changing the payout account. Payouts will continue routing to your verified ID until approved.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] space-y-1">
                <span className="text-slate-500 uppercase font-sans">Current Approved ID:</span>
                <div className="text-slate-900 font-bold">{state.salon.paypalMerchantId}</div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">New Proposed PayPal Merchant ID *</label>
                <input
                  type="text"
                  required
                  value={paypalChangeInput}
                  onChange={(e) => setPaypalChangeInput(e.target.value)}
                  placeholder="e.g. SELAM-EXPANSION-8812"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 font-mono font-bold shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChangePaypalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-sm"
                >
                  Submit Change Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PROPOSE POLICY AMENDMENT */}
      {/* ========================================================= */}
      {isChangePolicyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Propose Cancellation Policy Amendment</h3>
              <button onClick={() => setIsChangePolicyOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPolicyChange} className="space-y-3.5 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Policy changes undergo compliance review to prevent deceptive booking terms for salon customers.
              </p>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Proposed Free Cancellation Notice (Hours) *</label>
                <select
                  value={policyForm.policyHours}
                  onChange={(e) => setPolicyForm({ ...policyForm, policyHours: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 font-bold shadow-xs"
                >
                  <option value={12}>12 Hours Prior</option>
                  <option value={24}>24 Hours Prior (Industry Standard)</option>
                  <option value={48}>48 Hours Prior</option>
                  <option value={72}>72 Hours Prior</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Default No-Show Fee ($) *</label>
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={policyForm.noShowFee}
                  onChange={(e) => setPolicyForm({ ...policyForm, noShowFee: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 font-bold shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChangePolicyOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-sm"
                >
                  Submit Policy Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
