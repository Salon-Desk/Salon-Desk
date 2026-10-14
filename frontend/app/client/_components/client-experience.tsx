'use client'

import { Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Toast } from '@/components/ui'
import { useClientStore, useDemoReset, useToast } from '@/hooks'
import { BUYER_PERSONAS, type BuyerPersonaId, FLAGSHIP_SALON } from '@/lib/constants'
import {
  INITIAL_SERVICES,
  INITIAL_STAFF,
  SERVICE_CATEGORIES,
  stylistForCategory,
} from '@/lib/data/catalog'
import { DEFAULT_TIME_SLOT } from '@/lib/data/service-content'
import { formatClockTimeWithSeconds } from '@/lib/format'
import {
  createBookingId,
  createConsentHash,
  createIdempotencyKey,
  createLedgerId,
  createPaypalAuthId,
  createPaypalDebugId,
} from '@/lib/ids'
import type { Booking, SalonService, StaffMember } from '@/types'

import { useAiConcierge } from '../_hooks/use-ai-concierge'
import { AiConcierge } from './ai-concierge'
import { BookingsPanel } from './bookings-panel'
import { CatalogFilters, type ServiceSort } from './catalog-filters'
import { CatalogHero } from './catalog-hero'
import { ClientFooter } from './client-footer'
import { ClientHeader, type ClientTab } from './client-header'
import { type AuthStep, PaypalAuthModal } from './paypal-auth-modal'
import { ProtocolModal } from './protocol-modal'
import { ReceiptModal } from './receipt-modal'
import { ServiceCard } from './service-card'

export function ClientExperience() {
  const { state, setState, resetState } = useClientStore()
  const { isResetting, reset } = useDemoReset(resetState)
  const { message: toastMessage, show: showToast, dismiss } = useToast()
  const concierge = useAiConcierge()

  const [activeTab, setActiveTab] = useState<ClientTab>('catalog')
  const [buyerPersona, setBuyerPersona] = useState<BuyerPersonaId>('hana')
  const [selectedCategory, setSelectedCategory] = useState<string>(SERVICE_CATEGORIES[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<ServiceSort>('popular')

  const [selectedService, setSelectedService] = useState<SalonService | null>(null)
  const [protocolService, setProtocolService] = useState<SalonService | null>(null)
  const [selectedStylist, setSelectedStylist] = useState<StaffMember>(INITIAL_STAFF[0])
  const [selectedSlot, setSelectedSlot] = useState(DEFAULT_TIME_SLOT)
  const [isPayPalOpen, setIsPayPalOpen] = useState(false)
  const [authStep, setAuthStep] = useState<AuthStep>('review')
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null)

  const buyer = BUYER_PERSONAS[buyerPersona]

  const filteredServices = useMemo(() => {
    return INITIAL_SERVICES.filter((service) => {
      const matchCategory = selectedCategory === 'All' || service.category === selectedCategory
      const matchSearch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchSearch
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price
      if (sortBy === 'duration') return a.durationMin - b.durationMin
      if (sortBy === 'popular') return Number(b.popular) - Number(a.popular)
      return 0
    })
  }, [selectedCategory, searchQuery, sortBy])

  const activeHolds = state.bookings.filter((b) => b.status === 'HELD')
  const pastBookings = state.bookings.filter((b) => b.status !== 'HELD')

  const openCheckout = (service: SalonService, stylist?: StaffMember, slot?: string) => {
    setSelectedService(service)
    setSelectedStylist(stylist ?? stylistForCategory(service.category))
    if (slot) setSelectedSlot(slot)
    setAuthStep('review')
    setIsPayPalOpen(true)
  }

  const handleStartBooking = (service: SalonService) => {
    openCheckout(service)
  }

  const handleAskAi = (service: SalonService) => {
    setSelectedService(service)
    concierge.setIsOpen(true)
    concierge.setMode('chat')
    void concierge.send(
      `I'm interested in the "${service.name}". Can you find me the next available time slot and explain the hold policy?`,
      service,
    )
  }

  const handleApproveHold = () => {
    if (!selectedService) return
    setAuthStep('authorizing')

    window.setTimeout(() => {
      const bookingId = createBookingId()
      const newBooking: Booking = {
        id: bookingId,
        clientName: buyer.name,
        clientEmail: buyer.email,
        clientPhone: buyer.phone,
        salonId: FLAGSHIP_SALON.id,
        salonName: FLAGSHIP_SALON.name,
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
        paypalAuthId: createPaypalAuthId(),
        authExpiresAt: 'In 6 days, 23 hours',
        idempotencyKey: createIdempotencyKey(bookingId, 'AUTH_INTENT'),
        consentHash: createConsentHash(bookingId),
        createdAt: 'Just now',
      }

      setState((prev) => ({
        ...prev,
        bookings: [newBooking, ...prev.bookings],
        auditLedger: [
          {
            id: createLedgerId(),
            bookingId,
            clientName: buyer.name,
            serviceName: selectedService.name,
            action: 'AUTHORIZATION_CREATED',
            amount: selectedService.holdDeposit,
            currency: 'USD',
            paypalDebugId: createPaypalDebugId('REQ'),
            webhookVerified: true,
            timestamp: formatClockTimeWithSeconds(),
            details: `PayPal SDK v6 Authorization hold created (intent: AUTHORIZE). Funds reserved: $${selectedService.holdDeposit}. Zero money charged today. Free cancellation window: 24h.`,
          },
          ...prev.auditLedger,
        ],
      }))

      setConfirmedBooking(newBooking)
      setAuthStep('success')
      showToast(
        `Appointment confirmed! PayPal authorization hold of $${selectedService.holdDeposit} placed. $0 debited today.`,
      )
    }, 1400)
  }

  const handleCancelBooking = (bookingId: string) => {
    const booking = state.bookings.find((b) => b.id === bookingId)
    if (!booking) return

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'VOIDED' as const,
              settledAt: 'Just now',
              settlementNote:
                'Client self-service cancellation; PayPal authorization voided immediately ($0 debited).',
            }
          : b,
      ),
      auditLedger: [
        {
          id: createLedgerId(),
          bookingId,
          clientName: booking.clientName,
          serviceName: booking.serviceName,
          action: 'AUTHORIZATION_VOIDED',
          amount: booking.holdAmount,
          currency: 'USD',
          paypalDebugId: createPaypalDebugId('REQ'),
          webhookVerified: true,
          timestamp: formatClockTimeWithSeconds(),
          details: `Client voided appointment in self-service portal. PayPal authorization voided, $${booking.holdAmount} hold lifted instantly. $0 charged.`,
        },
        ...prev.auditLedger,
      ],
    }))

    showToast(
      `Appointment ${bookingId} cancelled. PayPal hold of $${booking.holdAmount} has been completely released ($0 charged).`,
    )
  }

  const handleReset = async () => {
    await reset()
    showToast('Sandbox successfully reset to pristine demo seed state.')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fbfbfa] font-sans text-stone-900 selection:bg-amber-500/20">
      {toastMessage && <Toast message={toastMessage} onDismiss={dismiss} position="bottom-right" />}

      <ClientHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeHoldsCount={activeHolds.length}
        conciergeOpen={concierge.isOpen}
        onToggleConcierge={() => concierge.setIsOpen((open) => !open)}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-28 md:pb-16">
        {activeTab === 'catalog' ? (
          <div>
            <CatalogHero />
            <CatalogFilters
              category={selectedCategory}
              onCategoryChange={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
            {filteredServices.length === 0 ? (
              <div className="rounded-3xl bg-stone-100/60 p-12 text-center">
                <p className="text-sm font-semibold text-stone-900">
                  No services match your search
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Try adjusting your search query or selecting a different category.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(SERVICE_CATEGORIES[0])
                    setSearchQuery('')
                  }}
                  className="mt-4 rounded-full bg-stone-950 px-5 py-2 font-bold text-xs text-white transition-colors hover:bg-stone-800 cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 sm:gap-y-14">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onAskAi={handleAskAi}
                    onQuickBook={handleStartBooking}
                    onOpenProtocol={setProtocolService}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <BookingsPanel
            activeHolds={activeHolds}
            pastBookings={pastBookings}
            onBrowseCatalog={() => setActiveTab('catalog')}
            onCancel={handleCancelBooking}
            onViewReceipt={setReceiptBooking}
          />
        )}
      </main>

      <ClientFooter
        buyerPersona={buyerPersona}
        onTogglePersona={() =>
          setBuyerPersona((current) => (current === 'hana' ? 'guest' : 'hana'))
        }
        onReset={handleReset}
        isResetting={isResetting}
      />

      {/* Mobile Floating Action Dock - Minimalist Pill */}
      <nav
        aria-label="Mobile quick actions"
        className="fixed bottom-4 inset-x-4 z-30 md:hidden flex items-center justify-between gap-1 rounded-full bg-stone-950/90 text-white p-1.5 backdrop-blur-xl"
      >
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'catalog' ? 'bg-white text-stone-950' : 'text-stone-400 hover:text-white'
          }`}
        >
          <span>Catalog</span>
        </button>

        <button
          type="button"
          onClick={() => concierge.setIsOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-amber-500 text-stone-950 font-bold text-xs cursor-pointer active:scale-95 transition-all"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Ask AI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my-bookings')}
          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'my-bookings'
              ? 'bg-white text-stone-950'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            Bookings
            {activeHolds.length > 0 && (
              <span className="h-4 min-w-4 px-1 rounded-full bg-amber-500 text-stone-950 font-mono text-[9px] font-bold flex items-center justify-center">
                {activeHolds.length}
              </span>
            )}
          </span>
        </button>
      </nav>

      {concierge.isOpen && (
        <AiConcierge
          mode={concierge.mode}
          onModeChange={concierge.setMode}
          prompt={concierge.prompt}
          onPromptChange={concierge.setPrompt}
          isThinking={concierge.isThinking}
          isListening={concierge.isListening}
          isSpeaking={concierge.isSpeaking}
          volumeLevel={concierge.volumeLevel}
          messages={concierge.messages}
          messagesEndRef={concierge.messagesEndRef}
          onSend={concierge.send}
          onVoiceTrigger={concierge.triggerVoice}
          onToggleListen={() => {
            if (concierge.isListening) {
              concierge.setIsListening(false)
              return
            }
            concierge.setIsListening(true)
            window.setTimeout(() => {
              concierge.triggerVoice('Book Precision Fade tomorrow at 2:00 PM with Marcus')
            }, 2500)
          }}
          onAuthorize={({ service, stylist, slot }) => openCheckout(service, stylist, slot)}
          onClose={() => concierge.setIsOpen(false)}
        />
      )}

      {isPayPalOpen && selectedService && (
        <PaypalAuthModal
          service={selectedService}
          stylist={selectedStylist}
          slot={selectedSlot}
          step={authStep}
          confirmedBooking={confirmedBooking}
          buyerPersona={buyerPersona}
          onSelectStylist={setSelectedStylist}
          onSelectSlot={setSelectedSlot}
          onApprove={handleApproveHold}
          onClose={() => setIsPayPalOpen(false)}
          onViewBookings={() => {
            setIsPayPalOpen(false)
            setActiveTab('my-bookings')
          }}
        />
      )}

      {protocolService && (
        <ProtocolModal
          service={protocolService}
          onClose={() => setProtocolService(null)}
          onBook={(service) => {
            setProtocolService(null)
            handleStartBooking(service)
          }}
        />
      )}

      {receiptBooking && (
        <ReceiptModal booking={receiptBooking} onClose={() => setReceiptBooking(null)} />
      )}
    </div>
  )
}
