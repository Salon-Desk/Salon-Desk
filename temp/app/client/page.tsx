'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/brand/Logo';
import {
  INITIAL_SERVICES,
  INITIAL_STAFF,
  getStoredState,
  saveStoredState,
  resetDemoState,
  AppStoreData,
} from '@/lib/store';
import { SalonService, StaffMember, Booking, AuditLedgerEntry } from '@/types';
import {
  Sparkles,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  Bot,
  User,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Info,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Search,
  Filter,
  SlidersHorizontal,
  Lock,
  RotateCcw,
  AlertCircle,
  CalendarDays,
  FileText,
  CreditCard,
  Send,
  X,
  Star,
  Check,
  Zap,
  ShoppingBag,
  ArrowRight,
  Clock3,
  Scissors,
  ChevronDown,
} from 'lucide-react';

// Service imagery matching luxury hair & grooming catalog
const SERVICE_IMAGES: Record<string, string> = {
  'srv-1': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
  'srv-2': 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&auto=format&fit=crop&q=80',
  'srv-3': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
  'srv-4': 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&auto=format&fit=crop&q=80',
  'srv-5': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
};

const SERVICE_PROTOCOLS: Record<string, { steps: string[]; products: string; idealFor: string }> = {
  'srv-1': {
    steps: [
      '1. Custom Consultation & Facial Geometry Mapping (5 mins)',
      '2. Precision Scissor & Clipper Skin/Taper Fade Sculpting (25 mins)',
      '3. Essential Oil Organic Eucalyptus Hot Towel Treatment (10 mins)',
      '4. Straight-Razor Lineup & Sandalwood Beard Hydration (10 mins)',
    ],
    products: 'Organic Tea Tree Cleanser, Moroccan Argan Beard Elixir, Eucalyptus Steamed Compress',
    idealFor: 'Gentlemen seeking a sharp, pristine executive taper with restorative skin care.',
  },
  'srv-2': {
    steps: [
      '1. Shade & Dimension Consultation with Color Swatches (15 mins)',
      '2. Hand-Painted Artisan French Balayage & Foil Separation (50 mins)',
      '3. Olaplex Bond-Building Regenerative Wash (25 mins)',
      '4. Custom High-Gloss Glaze Toner & Editorial Round-Brush Blowout (30 mins)',
    ],
    products: 'L’Oréal Professionnel Blond Studio, Olaplex No. 1 & 2, Kerastase Nutritive Gloss',
    idealFor: 'Natural multidimensional lightness, seamlessly blended grow-out, and supreme hair health.',
  },
  'srv-3': {
    steps: [
      '1. Detoxifying Scalp Clarification & Residue Removal (15 mins)',
      '2. Nano-Steam Hydro Moisture Deep Conditioning Mask (25 mins)',
      '3. Precision Split-End Dusting & Thermal Heat Shielding (20 mins)',
      '4. Ceramic Silk Wrap Smoothing & Glass-Sheen Feather Finish (30 mins)',
    ],
    products: 'Amino-Acid Moisture Infusion, Jamaican Black Castor Oil, Thermal Silk Serum',
    idealFor: 'Textured and natural hair seeking maximum softness, featherweight movement, and zero damage.',
  },
  'srv-4': {
    steps: [
      '1. Scalp Cleansing & Botanical Tea Tree Conditioning (20 mins)',
      '2. Scalp Sectioning & Precision Stitch Cornrow Parting (30 mins)',
      '3. Artisan Braid Weaving with Knotless Tension Relief (80 mins)',
      '4. Soothing Peppermint Edge Sculpting & Mousse Set (20 mins)',
    ],
    products: 'Organic Rosemary Mint Oil, Edge Control Wax, Flaxseed Sculpting Jelly',
    idealFor: 'Protective crown styling with exquisite symmetry, longevity, and comfortable scalp tension.',
  },
  'srv-5': {
    steps: [
      '1. Ultrasonic Hydro-Dermabrasion & Deep Pore Extraction (20 mins)',
      '2. Vitamin C & Hyaluronic Peptide Jet Infusion (15 mins)',
      '3. High-Frequency Anti-Microbial Beard Root Therapy (15 mins)',
      '4. Cryo-Cooling Collagen Sheet Mask & Neck Massage (10 mins)',
    ],
    products: 'Pure Hyaluronic Acid, Marine Collagen Peptides, Cold-Pressed Jojoba',
    idealFor: 'Decongesting urban skin, smoothing rough beard follicles, and instant radiant complexion.',
  },
};

const TIME_SLOTS = [
  { label: '10:00 AM', period: 'Morning', day: 'Tomorrow' },
  { label: '11:30 AM', period: 'Morning', day: 'Tomorrow' },
  { label: '2:00 PM', period: 'Afternoon', day: 'Tomorrow' },
  { label: '3:30 PM', period: 'Afternoon', day: 'Tomorrow' },
  { label: '5:00 PM', period: 'Evening', day: 'Tomorrow' },
  { label: '6:30 PM', period: 'Evening', day: 'Tomorrow' },
  { label: '11:00 AM', period: 'Morning', day: 'Saturday' },
  { label: '2:30 PM', period: 'Afternoon', day: 'Saturday' },
];

let clientMsgSeq = 0;
function createMessageId(prefix: string) {
  clientMsgSeq += 1;
  return `${prefix}-${clientMsgSeq}`;
}

function getFormattedTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function generateBookingId() {
  return `SD-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateLedgerId() {
  return `LEDGER-${Math.floor(100 + Math.random() * 900)}`;
}

function generateDebugReqId() {
  return `DEBUG_REQ_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

export default function ClientExperiencePage() {
  // Store & Global State
  const [store, setStore] = useState<AppStoreData>(() => getStoredState());
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-bookings'>('catalog');
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Buyer Persona State (Judge Sandbox)
  const [buyerPersona, setBuyerPersona] = useState<'hana' | 'guest'>('hana');
  const buyerProfile = {
    name: buyerPersona === 'hana' ? 'Hana Sterling (Verified Sandbox Buyer)' : 'Guest Client (Unverified)',
    email: buyerPersona === 'hana' ? 'hana.buyer@sandbox.salondesk.io' : 'guest@example.com',
    phone: '+1 (555) 789-0123',
    card: buyerPersona === 'hana' ? 'Visa •••• 4242' : 'Mastercard •••• 1099',
  };

  // E-Commerce Catalog Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'duration' | 'rating'>('popular');

  // Service Detail / Booking Flow State
  const [selectedService, setSelectedService] = useState<SalonService | null>(null);
  const [protocolModalService, setProtocolModalService] = useState<SalonService | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<StaffMember>(INITIAL_STAFF[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>('Tomorrow · 2:00 PM');

  // PayPal Authorization Modal State
  const [isPayPalModalOpen, setIsPayPalModalOpen] = useState(false);
  const [authStep, setAuthStep] = useState<'review' | 'authorizing' | 'success'>('review');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [receiptModalBooking, setReceiptModalBooking] = useState<Booking | null>(null);

  // Next-Gen Voice & Chat AI Concierge State
  const [isAiConciergeOpen, setIsAiConciergeOpen] = useState(false);
  const [aiMode, setAiMode] = useState<'voice' | 'chat'>('chat');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [voiceVolumeLevel, setVoiceVolumeLevel] = useState(4);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      sender: 'user' | 'assistant';
      text: string;
      time: string;
      proposedService?: SalonService;
      proposedStylist?: StaffMember;
      proposedSlot?: string;
      hasProposal?: boolean;
    }>
  >([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: 'Hello! I am your SalonDesk AI Concierge at Crown & Blade Atelier. With our PayPal authorization hold guarantee, $0 is debited today to lock in your appointment. How may I style you today?',
      time: 'Just now',
      proposedService: INITIAL_SERVICES[0],
      proposedStylist: INITIAL_STAFF[0],
      proposedSlot: 'Tomorrow · 2:00 PM',
      hasProposal: true,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync Store State Across Tabs
  useEffect(() => {
    const handleUpdate = () => setStore(getStoredState());
    window.addEventListener('salondesk_store_updated', handleUpdate);
    return () => window.removeEventListener('salondesk_store_updated', handleUpdate);
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (isAiConciergeOpen && aiMode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAiConciergeOpen, aiMode]);

  // Audio wave animation for simulated voice mode
  useEffect(() => {
    if (!isVoiceListening && !isVoiceSpeaking) return;
    const interval = setInterval(() => {
      setVoiceVolumeLevel(Math.floor(2 + Math.random() * 8));
    }, 150);
    return () => {
      clearInterval(interval);
      setVoiceVolumeLevel(2);
    };
  }, [isVoiceListening, isVoiceSpeaking]);

  // Toast Notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Demo Reset Handler
  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
    } catch {
      // fallback
    }
    const fresh = resetDemoState();
    setStore(fresh);
    setIsResetting(false);
    showToast('Sandbox successfully reset to pristine demo seed state.');
  };

  // Filter & Sort Logic for Services
  const categories = ['All', 'Haircuts', 'Styling & Color', 'Braids & Locs', 'Spa & Facial'];

  const filteredServices = INITIAL_SERVICES.filter((srv) => {
    const matchCategory = selectedCategory === 'All' || srv.category === selectedCategory;
    const matchSearch =
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'duration') return a.durationMin - b.durationMin;
    if (sortBy === 'popular') return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
    return 0;
  });

  // Start booking directly from card
  const handleStartBooking = (service: SalonService) => {
    setSelectedService(service);
    // Assign best stylist match
    if (service.category === 'Styling & Color') {
      setSelectedStylist(INITIAL_STAFF[1]);
    } else if (service.category === 'Braids & Locs') {
      setSelectedStylist(INITIAL_STAFF[2]);
    } else {
      setSelectedStylist(INITIAL_STAFF[0]);
    }
    setAuthStep('review');
    setIsPayPalModalOpen(true);
  };

  // Start AI Concierge pre-loaded with service
  const handleAskAiAboutService = (service: SalonService) => {
    setSelectedService(service);
    setIsAiConciergeOpen(true);
    setAiMode('chat');
    const prompt = `I'm interested in the "${service.name}". Can you find me the next available time slot and explain the hold policy?`;
    sendAiMessage(prompt, service);
  };

  // Send message to AI Concierge
  const sendAiMessage = async (customPrompt?: string, serviceOverride?: SalonService) => {
    const query = customPrompt || aiPrompt;
    if (!query.trim()) return;

    const srv = serviceOverride || selectedService || INITIAL_SERVICES[0];

    const userMsg = {
      id: createMessageId('usr'),
      sender: 'user' as const,
      text: query,
      time: getFormattedTime(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setAiPrompt('');
    setIsAiThinking(true);

    try {
      const res = await fetch('/api/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          selectedServiceId: srv.id,
        }),
      });
      const data = await res.json();

      const assistantMsg = {
        id: createMessageId('ast'),
        sender: 'assistant' as const,
        text: data.replyText,
        time: getFormattedTime(),
        proposedService: data.matchedService || srv,
        proposedStylist: data.matchedStylist || INITIAL_STAFF[0],
        proposedSlot: data.proposedTimeSlot || 'Tomorrow · 2:00 PM',
        hasProposal: data.hasProposal ?? true,
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const fallbackMsg = {
        id: createMessageId('ast'),
        sender: 'assistant' as const,
        text: `I have reserved ${srv.name} with ${INITIAL_STAFF[0].name} for Tomorrow at 2:00 PM. Remember: $0 leaves your account today—only an authorization hold of $${srv.holdDeposit} is created via PayPal.`,
        time: getFormattedTime(),
        proposedService: srv,
        proposedStylist: INITIAL_STAFF[0],
        proposedSlot: 'Tomorrow · 2:00 PM',
        hasProposal: true,
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Simulated Voice Trigger
  const handleVoiceTrigger = (text: string) => {
    setIsVoiceListening(false);
    setIsVoiceSpeaking(true);
    sendAiMessage(text);
    setTimeout(() => {
      setIsVoiceSpeaking(false);
    }, 2800);
  };

  // Execute PayPal Authorization Hold (intent: AUTHORIZE)
  const handleApprovePayPalHold = () => {
    if (!selectedService) return;
    setAuthStep('authorizing');

    setTimeout(() => {
      const bookingId = generateBookingId();
      const authId = `AUTH-PP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const consentHash = `sha256:${Math.random().toString(36).substring(2)}${bookingId.toLowerCase()}99f2b8`;

      const newBooking: Booking = {
        id: bookingId,
        clientName: buyerProfile.name,
        clientEmail: buyerProfile.email,
        clientPhone: buyerProfile.phone,
        salonId: 'org-1',
        salonName: 'Crown & Blade Atelier (SoHo Flagship)',
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        stylistId: selectedStylist.id,
        stylistName: selectedStylist.name,
        appointmentTime: selectedSlot,
        durationMin: selectedService.durationMin,
        servicePrice: selectedService.price,
        holdAmount: selectedService.holdDeposit,
        noShowFee: selectedService.noShowFee,
        status: 'HELD',
        paypalAuthId: authId,
        authExpiresAt: 'In 6 days, 23 hours',
        idempotencyKey: `IDEMP_${bookingId}_AUTH_INTENT`,
        consentHash,
        createdAt: 'Just now',
      };

      const ledgerEntry: AuditLedgerEntry = {
        id: generateLedgerId(),
        bookingId,
        clientName: buyerProfile.name,
        serviceName: selectedService.name,
        action: 'AUTHORIZATION_CREATED',
        amount: selectedService.holdDeposit,
        currency: 'USD',
        paypalDebugId: generateDebugReqId(),
        webhookVerified: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        details: `PayPal SDK v6 Authorization hold created (intent: AUTHORIZE). Funds reserved: $${selectedService.holdDeposit}. Zero money charged today. Free cancellation window: 24h.`,
      };

      const updatedState: AppStoreData = {
        ...store,
        bookings: [newBooking, ...store.bookings],
        auditLedger: [ledgerEntry, ...store.auditLedger],
      };

      saveStoredState(updatedState);
      setStore(updatedState);
      setConfirmedBooking(newBooking);
      setAuthStep('success');
      showToast(`Appointment confirmed! PayPal authorization hold of $${selectedService.holdDeposit} placed. $0 debited today.`);
    }, 1400);
  };

  // Client 1-Click Cancel Booking & Void Hold
  const handleCancelBooking = (bookingId: string) => {
    const bookingToCancel = store.bookings.find((b) => b.id === bookingId);
    if (!bookingToCancel) return;

    const updatedBookings = store.bookings.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'VOIDED' as const,
          settledAt: 'Just now',
          settlementNote: 'Client self-service cancellation; PayPal authorization voided immediately ($0 debited).',
        };
      }
      return b;
    });

    const voidLedgerEntry: AuditLedgerEntry = {
      id: generateLedgerId(),
      bookingId,
      clientName: bookingToCancel.clientName,
      serviceName: bookingToCancel.serviceName,
      action: 'AUTHORIZATION_VOIDED',
      amount: bookingToCancel.holdAmount,
      currency: 'USD',
      paypalDebugId: generateDebugReqId(),
      webhookVerified: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      details: `Client voided appointment in self-service portal. PayPal authorization voided, $${bookingToCancel.holdAmount} hold lifted instantly. $0 charged.`,
    };

    const updatedState: AppStoreData = {
      ...store,
      bookings: updatedBookings,
      auditLedger: [voidLedgerEntry, ...store.auditLedger],
    };

    saveStoredState(updatedState);
    setStore(updatedState);
    showToast(`Appointment ${bookingId} cancelled. PayPal hold of $${bookingToCancel.holdAmount} has been completely released ($0 charged).`);
  };

  // Active bookings count
  const activeHolds = store.bookings.filter((b) => b.status === 'HELD');
  const pastBookings = store.bookings.filter((b) => b.status !== 'HELD');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-500/20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white border border-amber-300 shadow-2xl rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 text-sm text-slate-800 font-medium leading-relaxed">
            {toastMessage}
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP BAR HUB NAVIGATION & ECOSYSTEM GATEWAY */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Back to Hub */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>App Hub</span>
            </Link>

            <div className="h-4 w-px bg-slate-200" />

            <Link href="/client" className="flex items-center gap-2">
              <Logo theme="light" />
              <span className="hidden sm:inline-block text-[11px] font-bold tracking-widest uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                Client Discovery
              </span>
            </Link>
          </div>

          {/* Center Tabs: Discover vs My Bookings */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
              <span>Explore Services</span>
            </button>
            <button
              onClick={() => setActiveTab('my-bookings')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === 'my-bookings'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
              <span>My Bookings</span>
              {activeHolds.length > 0 && (
                <span className="bg-amber-500 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {activeHolds.length}
                </span>
              )}
            </button>
          </div>

          {/* Right Tools: Persona Switcher, AI Concierge, Reset, Ecosystem Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Judge Persona Switcher */}
            <div className="relative group">
              <button
                onClick={() => setBuyerPersona(buyerPersona === 'hana' ? 'guest' : 'hana')}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 transition-colors"
                title="Toggle Judge Sandbox Persona"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden lg:inline text-slate-500">Buyer:</span>
                <span className="font-semibold text-slate-900">
                  {buyerPersona === 'hana' ? 'Hana (Sandbox)' : 'Guest'}
                </span>
                <span className="text-[10px] bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-500">
                  Switch
                </span>
              </button>
            </div>

            {/* AI Concierge Toggle Button */}
            <button
              onClick={() => setIsAiConciergeOpen(!isAiConciergeOpen)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs hover:shadow transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden sm:inline">AI Concierge</span>
            </button>

            {/* Ecosystem Switcher Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors">
                <span className="hidden sm:inline">Switch Portal</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Ecosystem Navigation
                </div>
                <Link
                  href="/merchant"
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-amber-600 font-medium"
                >
                  <Scissors className="w-3.5 h-3.5 text-amber-500" />
                  <span>Salon Console (/merchant)</span>
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-amber-600 font-medium"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span>Platform Admin (/admin)</span>
                </Link>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={handleResetDemo}
                  disabled={isResetting}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>Reset Demo State</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile View Switcher */}
        <div className="flex md:hidden items-center justify-center bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
              activeTab === 'catalog' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Explore Services
          </button>
          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all relative ${
              activeTab === 'my-bookings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            My Bookings ({activeHolds.length})
          </button>
        </div>

        {activeTab === 'catalog' ? (
          <div>
            {/* 2. LUXURY EDITORIAL HERO & TRANSPARENCY MOTTO */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-10 mb-8 shadow-md border border-slate-800">
              {/* Subtle ambient gold glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold mb-4 backdrop-blur-xs">
                  <Lock className="w-3.5 h-3.5" />
                  <span>A Hold, Not a Charge • Powered by PayPal</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
                  Crown & Blade Atelier{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200 font-serif italic">
                    SoHo Flagship
                  </span>
                </h1>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                  Experience bespoke hair design, skin fades, balayage, and restorative spa treatments.
                  Reserve your preferred master stylist with{' '}
                  <span className="text-white font-bold underline decoration-amber-400 underline-offset-4">
                    zero dollars charged today
                  </span>
                  . Funds are simply held and release instantly if you cancel on time.
                </p>

                {/* 3 Value Proposition Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>$0 Upfront Payment</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Free Cancel ≥ 24 Hours</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200">
                    <Shield className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Cryptographic Consent Hash</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. STICKY CLEAN FILTER BAR (Two Core Dimensions) */}
            <div className="sticky top-16 z-30 bg-slate-50/95 backdrop-blur-md py-3 mb-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Dimension 1: Category Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        selectedCategory === cat
                          ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Dimension 2: Search & Sort Controls */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {/* Search Input */}
                  <div className="relative flex-1 md:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search services or cuts..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      aria-label="Sort services catalog"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-amber-500 cursor-pointer"
                    >
                      <option value="popular">Most Popular</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="duration">Fastest Duration</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. HIGH-CONVERTING E-COMMERCE SERVICE CATALOG */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => {
                const assignedStylist =
                  service.category === 'Styling & Color'
                    ? INITIAL_STAFF[1]
                    : service.category === 'Braids & Locs'
                    ? INITIAL_STAFF[2]
                    : INITIAL_STAFF[0];

                const imgUrl =
                  SERVICE_IMAGES[service.id] ||
                  'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&auto=format&fit=crop&q=80';

                return (
                  <div
                    key={service.id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:border-amber-400/80 transition-all duration-200 flex flex-col group"
                  >
                    {/* Visual Photography Banner */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <Image
                        src={imgUrl}
                        alt={service.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

                      {/* Floating Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 bg-amber-500/95 backdrop-blur-xs text-slate-950 text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-xs">
                          <Lock className="w-3 h-3 text-slate-950" />
                          ${service.holdDeposit} Hold Only
                        </span>
                        {service.popular && (
                          <span className="inline-flex items-center gap-1 bg-slate-900/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                            <Star className="w-3 h-3 fill-amber-300" />
                            Popular
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
                        <span className="bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {service.durationMin} mins
                        </span>
                        <span className="bg-emerald-500/90 text-slate-950 font-bold px-2 py-0.5 rounded-md text-[11px]">
                          Free 24h Cancel
                        </span>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                            {service.category}
                          </span>
                          <span className="text-lg font-black text-slate-900">
                            ${service.price}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors mb-2">
                          {service.name}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                          {service.description}
                        </p>

                        {/* Stylist Mini Card */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden relative border border-slate-300">
                              <Image
                                src={assignedStylist.avatar}
                                alt={assignedStylist.name}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                {assignedStylist.name}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {assignedStylist.role.split('&')[0]}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{assignedStylist.rating}</span>
                          </div>
                        </div>

                        {/* Transparency Breakdown Box */}
                        <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-2.5 text-xs text-slate-700 mb-4 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                              Deposit Hold Rule
                            </span>
                            <span className="font-semibold text-slate-900">
                              $0 charged today • ${service.holdDeposit} held
                            </span>
                          </div>
                          <button
                            onClick={() => setProtocolModalService(service)}
                            className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline underline-offset-2 flex items-center gap-1"
                          >
                            <Info className="w-3 h-3" />
                            <span>Protocol</span>
                          </button>
                        </div>
                      </div>

                      {/* Card Action CTAs */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleAskAiAboutService(service)}
                          className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2 px-3 rounded-xl text-xs transition-colors border border-slate-200"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Ask AI</span>
                        </button>
                        <button
                          onClick={() => handleStartBooking(service)}
                          className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-3 rounded-xl text-xs shadow-xs hover:shadow transition-all"
                        >
                          <span>Quick Book</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 5. SELF-SERVICE CLIENT BOOKING MANAGEMENT ("My Bookings") */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">My Appointments & Deposits</h2>
                <p className="text-xs text-slate-500">
                  Manage active holds, view cryptographic receipts, or cancel before the 24-hour cutoff for a $0 charge.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('catalog')}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <span>+ Book Another Service</span>
              </button>
            </div>

            {/* Active Holds Section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Active Authorization Holds ({activeHolds.length})
                </h3>
              </div>

              {activeHolds.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">No Active Holds</h4>
                  <p className="text-xs text-slate-500 mb-4">
                    You currently have no pending appointment holds. Explore services and book with zero upfront charges.
                  </p>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                  >
                    Explore Service Catalog
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activeHolds.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white border border-amber-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />

                      <div>
                        {/* Header with Badges */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest block">
                              {booking.id} • {booking.salonName}
                            </span>
                            <h4 className="text-base font-extrabold text-slate-900">
                              {booking.serviceName}
                            </h4>
                          </div>
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">
                            <Lock className="w-3 h-3" />
                            HELD (${booking.holdAmount})
                          </span>
                        </div>

                        {/* Stylist & Time */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              Master Stylist
                            </span>
                            <span className="font-bold text-slate-800">{booking.stylistName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              Appointment Slot
                            </span>
                            <span className="font-bold text-slate-800">{booking.appointmentTime}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              Full Service Value
                            </span>
                            <span className="font-semibold text-slate-700">${booking.servicePrice}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">
                              Free Cancel Window
                            </span>
                            <span className="font-bold text-emerald-600">≥ 24 hrs prior ($0)</span>
                          </div>
                        </div>

                        {/* Consent Hash & PayPal Info */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-4 bg-amber-50/40 px-3 py-2 rounded-lg border border-amber-100">
                          <div className="flex items-center gap-1.5 font-mono truncate max-w-[220px]">
                            <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">{booking.consentHash}</span>
                          </div>
                          <span className="text-slate-400 shrink-0 font-medium">PayPal v6</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setReceiptModalBooking(booking)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-xl text-xs transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span>View Receipt</span>
                        </button>

                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 px-3 rounded-xl text-xs transition-colors border border-rose-200 flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Cancel & Void ($0)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past & Settled Appointments */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">
                Past & Settled Appointments ({pastBookings.length})
              </h3>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">Service & Stylist</th>
                        <th className="py-3 px-4">Slot</th>
                        <th className="py-3 px-4">Final Settlement</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pastBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.id}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{b.serviceName}</div>
                            <div className="text-[11px] text-slate-500">{b.stylistName}</div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">{b.appointmentTime}</td>
                          <td className="py-3 px-4">
                            {b.status === 'CAPTURED' && (
                              <span className="font-bold text-emerald-600">
                                ${b.servicePrice} Full Captured
                              </span>
                            )}
                            {b.status === 'NO_SHOW_CAPTURED' && (
                              <span className="font-bold text-rose-600">
                                ${b.noShowFee} No-Show Fee
                              </span>
                            )}
                            {b.status === 'VOIDED' && (
                              <span className="font-medium text-slate-500">$0 (Hold Voided)</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                b.status === 'CAPTURED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : b.status === 'NO_SHOW_CAPTURED'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setReceiptModalBooking(b)}
                              className="text-amber-600 hover:text-amber-700 font-bold underline"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 6. NEXT-GEN VOICE & CHAT AI CONCIERGE DRAWER */}
      {isAiConciergeOpen && (
        <aside className="fixed bottom-0 right-0 top-0 sm:top-16 z-50 w-full sm:w-[440px] bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-200">
          {/* Concierge Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-md">
                <Sparkles className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>AI Booking Concierge</span>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-1.5 py-0.2 rounded border border-amber-400/30">
                    Gemini 2.5
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {aiMode === 'voice' ? 'Voice Mode Active' : 'Chat & Instant Proposal Mode'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Voice vs Chat Mode Toggle */}
              <button
                onClick={() => setAiMode(aiMode === 'chat' ? 'voice' : 'chat')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  aiMode === 'voice'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Toggle Voice / Chat Mode"
              >
                {aiMode === 'voice' ? <Mic className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                <span className="text-[11px]">{aiMode === 'voice' ? 'Voice' : 'Chat'}</span>
              </button>

              <button
                onClick={() => setIsAiConciergeOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Voice Mode Surface */}
          {aiMode === 'voice' ? (
            <div className="flex-1 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
              <div className="text-center mt-6">
                <span className="inline-block bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30 mb-3">
                  {isVoiceSpeaking ? 'AI Speaking...' : isVoiceListening ? 'Listening...' : 'Voice Ready'}
                </span>
                <h4 className="text-lg font-bold text-white mb-1">Speak Naturally</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Say what you want: &quot;Book a balayage Saturday with Elena&quot; or &quot;How does the $0 hold work?&quot;
                </p>
              </div>

              {/* Dynamic Audio Waveform Visualizer */}
              <div className="my-8 flex items-center justify-center gap-1.5 h-24">
                {[...Array(16)].map((_, i) => {
                  const barHeight =
                    isVoiceListening || isVoiceSpeaking
                      ? Math.max(12, Math.min(80, (i % 4 + 1) * voiceVolumeLevel * 2.5))
                      : 8;
                  return (
                    <div
                      key={i}
                      style={{ height: `${barHeight}px` }}
                      className="w-1.5 rounded-full bg-gradient-to-t from-amber-500 to-amber-300 transition-all duration-150"
                    />
                  );
                })}
              </div>

              {/* Voice Quick Triggers */}
              <div className="w-full space-y-2 mb-6">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block text-center">
                  Quick Voice Prompts
                </span>
                <button
                  onClick={() => handleVoiceTrigger('Book Signature Balayage with Elena for Saturday')}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 text-left transition-colors flex items-center justify-between"
                >
                  <span>&quot;Book Signature Balayage with Elena for Saturday&quot;</span>
                  <Mic className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </button>
                <button
                  onClick={() => handleVoiceTrigger('Book Precision Fade with Marcus tomorrow afternoon')}
                  className="w-full bg-white/10 hover:white/20 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 text-left transition-colors flex items-center justify-between"
                >
                  <span>&quot;Book Precision Fade with Marcus tomorrow&quot;</span>
                  <Mic className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </button>
                <button
                  onClick={() => handleVoiceTrigger('Explain how the $0 hold policy works')}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 text-left transition-colors flex items-center justify-between"
                >
                  <span>&quot;Explain the $0 hold policy&quot;</span>
                  <Mic className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </button>
              </div>

              {/* Push-to-Talk Mic Button */}
              <div className="mb-4 text-center">
                <button
                  onClick={() => {
                    if (isVoiceListening) {
                      setIsVoiceListening(false);
                    } else {
                      setIsVoiceListening(true);
                      setTimeout(() => {
                        handleVoiceTrigger('Book Precision Fade tomorrow at 2:00 PM with Marcus');
                      }, 2500);
                    }
                  }}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isVoiceListening
                      ? 'bg-rose-500 text-white ring-8 ring-rose-500/30 animate-pulse'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xl'
                  }`}
                >
                  <Mic className="w-7 h-7" />
                </button>
                <span className="text-[11px] text-slate-400 block mt-2">
                  {isVoiceListening ? 'Listening... Tap to stop' : 'Tap to Speak'}
                </span>
              </div>
            </div>
          ) : (
            /* Chat Mode Surface */
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50">
              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-slate-900 text-white rounded-tr-xs'
                          : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-xs'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span
                        className={`text-[9px] block mt-1.5 font-medium ${
                          msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'
                        }`}
                      >
                        {msg.time}
                      </span>
                    </div>

                    {/* Rich Inline Interactive Proposal Card */}
                    {msg.sender === 'assistant' && msg.hasProposal && msg.proposedService && (
                      <div className="w-full max-w-[94%] bg-white border border-amber-200 rounded-2xl p-3.5 mt-2 shadow-xs">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                            Proposed Reservation
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h5 className="text-xs font-bold text-slate-900">
                            {msg.proposedService.name}
                          </h5>
                          <span className="text-xs font-black text-slate-900">
                            ${msg.proposedService.price}
                          </span>
                        </div>

                        {/* Stylist & Slot chips */}
                        <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] space-y-1 mb-3 border border-slate-100">
                          <div className="flex justify-between text-slate-600">
                            <span>Stylist:</span>
                            <span className="font-bold text-slate-900">
                              {msg.proposedStylist?.name || INITIAL_STAFF[0].name}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Time Slot:</span>
                            <span className="font-bold text-slate-900">
                              {msg.proposedSlot || 'Tomorrow · 2:00 PM'}
                            </span>
                          </div>
                          <div className="flex justify-between text-emerald-600 font-semibold pt-1 border-t border-slate-200">
                            <span>Upfront Today:</span>
                            <span>$0.00 (Zero Charge)</span>
                          </div>
                          <div className="flex justify-between text-amber-700 font-semibold">
                            <span>Deposit Hold:</span>
                            <span>${msg.proposedService.holdDeposit} (PayPal Authorization)</span>
                          </div>
                        </div>

                        {/* Direct Button inside AI Stream */}
                        <button
                          onClick={() => {
                            if (msg.proposedService) {
                              setSelectedService(msg.proposedService);
                            }
                            if (msg.proposedStylist) {
                              setSelectedStylist(msg.proposedStylist);
                            }
                            if (msg.proposedSlot) {
                              setSelectedSlot(msg.proposedSlot);
                            }
                            setAuthStep('review');
                            setIsPayPalModalOpen(true);
                          }}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-950" />
                          <span>Authorize Hold with PayPal →</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {isAiThinking && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    <span>AI Concierge is selecting the best stylist & slot...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Quick Prompts */}
              <div className="px-3 py-2 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => sendAiMessage('Book Precision Fade with Marcus tomorrow')}
                  className="whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200"
                >
                  Fade with Marcus
                </button>
                <button
                  onClick={() => sendAiMessage('I want Balayage with Elena this weekend')}
                  className="whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200"
                >
                  Balayage with Elena
                </button>
                <button
                  onClick={() => sendAiMessage('How does the $0 hold protect me?')}
                  className="whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200"
                >
                  How hold works
                </button>
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                  placeholder="Ask to book, check stylists, or policy..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                />
                <button
                  onClick={() => sendAiMessage()}
                  disabled={!aiPrompt.trim() || isAiThinking}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white p-2 rounded-xl text-xs transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* 7. PAYPAL AUTHORIZATION MODAL (intent: AUTHORIZE) */}
      {isPayPalModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsPayPalModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {authStep === 'review' && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      PayPal Authorization Hold
                    </h3>
                    <p className="text-xs text-slate-500">
                      Reserve chair with intent: AUTHORIZE ($0 debited today)
                    </p>
                  </div>
                </div>

                {/* Service Recap Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">
                        {selectedService.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        {selectedService.name}
                      </h4>
                    </div>
                    <span className="text-base font-black text-slate-900">
                      ${selectedService.price}
                    </span>
                  </div>

                  {/* Stylist Selector */}
                  <div className="mb-3">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Choose Master Stylist:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {INITIAL_STAFF.map((staff) => (
                        <button
                          key={staff.id}
                          onClick={() => setSelectedStylist(staff)}
                          className={`p-2 rounded-xl text-left border transition-all ${
                            selectedStylist.id === staff.id
                              ? 'bg-white border-amber-500 shadow-xs ring-1 ring-amber-500'
                              : 'bg-white/60 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <div className="text-[11px] font-bold text-slate-900 truncate">
                            {staff.name}
                          </div>
                          <div className="text-[9px] text-slate-500 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            <span>{staff.rating}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slot Selector */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Select Time Slot:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {TIME_SLOTS.slice(0, 4).map((slot, idx) => {
                        const slotStr = `${slot.day} · ${slot.label}`;
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedSlot(slotStr)}
                            className={`py-1.5 px-2 text-[10px] font-semibold rounded-lg border text-center transition-all ${
                              selectedSlot === slotStr
                                ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Transparency Hold Breakdown */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>Transparent Deposit Policy</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>Total Service Price (Settled at Salon):</span>
                      <span className="font-bold text-slate-900">${selectedService.price}.00</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Due Today at Checkout:</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between text-amber-800 font-bold pt-1 border-t border-amber-200/60">
                      <span>Temporary Authorization Hold:</span>
                      <span>${selectedService.holdDeposit}.00</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>No-Show Protection Fee:</span>
                      <span>${selectedService.noShowFee}.00 (Only charged if missed without notice)</span>
                    </div>
                  </div>
                </div>

                {/* Sandbox Buyer Profile Recap */}
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{buyerProfile.name}</div>
                      <div className="text-[10px] text-slate-500">{buyerProfile.card}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Sandbox Ready
                  </span>
                </div>

                {/* PayPal Action Button */}
                <button
                  onClick={handleApprovePayPalHold}
                  className="w-full bg-[#FFC439] hover:bg-[#F4B41A] text-[#003087] font-extrabold py-3 px-4 rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-[#003087]" />
                  <span>Authorize ${selectedService.holdDeposit} Hold with PayPal ($0 Today)</span>
                </button>

                <p className="text-[11px] text-slate-400 text-center mt-2.5">
                  Authorization Hold: No money leaves your account today. Free cancellation ≥ 24 hours.
                </p>
              </div>
            )}

            {authStep === 'authorizing' && (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200 animate-spin">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">
                  Contacting PayPal Payments v2 Engine...
                </h4>
                <div className="max-w-xs mx-auto text-xs text-slate-500 space-y-1.5 font-mono">
                  <p>• Setting payment intent to AUTHORIZE...</p>
                  <p>• Verifying card authorization availability...</p>
                  <p>• Generating cryptographic consent hash...</p>
                </div>
              </div>
            )}

            {authStep === 'success' && confirmedBooking && (
              <div className="py-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <span className="inline-block bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-200 mb-2">
                  HELD • ${confirmedBooking.holdAmount} Authorization Placed
                </span>
                <h3 className="text-lg font-black text-slate-900 mb-1">
                  Appointment Confirmed!
                </h3>
                <p className="text-xs text-slate-500 mb-5">
                  Zero dollars charged today. Your stylist {confirmedBooking.stylistName} is reserved for {confirmedBooking.appointmentTime}.
                </p>

                {/* Cryptographic Receipt Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking Reference:</span>
                    <span className="font-mono font-bold text-slate-900">{confirmedBooking.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PayPal Auth ID:</span>
                    <span className="font-mono font-bold text-slate-900">{confirmedBooking.paypalAuthId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consent Hash:</span>
                    <span className="font-mono text-[10px] text-slate-600 truncate max-w-[200px]">
                      {confirmedBooking.consentHash}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold pt-1 border-t border-slate-200">
                    <span>Charged Today:</span>
                    <span>$0.00</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setIsPayPalModalOpen(false);
                      setActiveTab('my-bookings');
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
                  >
                    View in My Bookings
                  </button>
                  <button
                    onClick={() => setIsPayPalModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. SERVICE PROTOCOL & INGREDIENTS MODAL */}
      {protocolModalService && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setProtocolModalService(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider block mb-1">
              {protocolModalService.category} Protocol
            </span>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {protocolModalService.name}
            </h3>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {protocolModalService.description}
            </p>

            {/* Protocol Steps */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2.5">
                Step-by-Step Experience
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {(SERVICE_PROTOCOLS[protocolModalService.id]?.steps || []).map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Products & Ideal For */}
            <div className="space-y-3 text-xs mb-6">
              <div>
                <span className="font-bold text-slate-900 block">Featured Formulations:</span>
                <span className="text-slate-600">
                  {SERVICE_PROTOCOLS[protocolModalService.id]?.products}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Ideal For:</span>
                <span className="text-slate-600">
                  {SERVICE_PROTOCOLS[protocolModalService.id]?.idealFor}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                const srv = protocolModalService;
                setProtocolModalService(null);
                handleStartBooking(srv);
              }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-xs"
            >
              Proceed to Book & Authorize Hold
            </button>
          </div>
        </div>
      )}

      {/* 9. CRYPTOGRAPHIC CONSENT RECEIPT MODAL */}
      {receiptModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setReceiptModalBooking(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                PayPal Authorization Receipt
              </h3>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Cryptographically verified consent record generated under the PayPal Authorization-Hold standard.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5 font-mono mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking ID:</span>
                <span className="font-bold text-slate-900">{receiptModalBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-amber-700">{receiptModalBooking.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PayPal Auth ID:</span>
                <span className="font-bold text-slate-900">{receiptModalBooking.paypalAuthId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Idempotency Key:</span>
                <span className="text-slate-800">{receiptModalBooking.idempotencyKey}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block mb-1">Consent Hash (SHA-256):</span>
                <span className="text-[10px] break-all text-slate-700 bg-white p-2 rounded border border-slate-200 block">
                  {receiptModalBooking.consentHash}
                </span>
              </div>
            </div>

            <button
              onClick={() => setReceiptModalBooking(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
