'use client'

import type { FormEvent, ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useMerchantStore, useToast } from '@/hooks'
import { createSequentialId } from '@/lib/ids'
import type { MerchantConsoleState } from '@/lib/store/merchant-store'
import type { Booking, ChangeRequest, SalonService, StaffMember } from '@/types'

import {
  DEFAULT_SERVICE_FORM,
  DEFAULT_STAFF_FORM,
  type ServiceFormState,
  type StaffFormState,
} from '../_constants/merchant-forms'
import { useMerchantSettlement } from '../_hooks/use-merchant-settlement'

export interface MerchantContextValue {
  state: MerchantConsoleState
  activeHolds: Booking[]
  activeHoldsCount: number
  activeHoldsVolume: number
  capturedRevenue: number
  noShowRecovered: number
  pendingChangeRequests: number
  isSettlementProcessing: boolean
  idempotencyToast: string | null
  toastMessage: string | null
  dismissToast: () => void

  // Selected items & drawers
  selectedBooking: Booking | null
  setSelectedBooking: (b: Booking | null) => void
  inspectConsentBooking: Booking | null
  setInspectConsentBooking: (b: Booking | null) => void

  // Staff modals
  isAddStaffOpen: boolean
  setIsAddStaffOpen: (open: boolean) => void
  editingStaff: StaffMember | null
  staffForm: StaffFormState
  setStaffForm: React.Dispatch<React.SetStateAction<StaffFormState>>
  deletingStaff: StaffMember | null
  setDeletingStaff: (s: StaffMember | null) => void
  openAddStaff: () => void
  openEditStaff: (s: StaffMember) => void
  openDeleteStaff: (s: StaffMember) => void
  handleSaveStaff: (e: FormEvent) => void
  handleDeleteStaff: () => void

  // Service modals
  isAddServiceOpen: boolean
  setIsAddServiceOpen: (open: boolean) => void
  editingService: SalonService | null
  serviceForm: ServiceFormState
  setServiceForm: React.Dispatch<React.SetStateAction<ServiceFormState>>
  deletingService: SalonService | null
  setDeletingService: (s: SalonService | null) => void
  openAddService: () => void
  openEditService: (s: SalonService) => void
  openDeleteService: (s: SalonService) => void
  handleSaveService: (e: FormEvent) => void
  handleDeleteService: () => void

  // Settings modals
  isChangePaypalOpen: boolean
  setIsChangePaypalOpen: (open: boolean) => void
  paypalChangeInput: string
  setPaypalChangeInput: (v: string) => void
  openChangePaypal: () => void
  handleSubmitPaypalChange: (e: FormEvent) => void

  isChangePolicyOpen: boolean
  setIsChangePolicyOpen: (open: boolean) => void
  policyForm: { policyHours: number; noShowFee: number }
  setPolicyForm: React.Dispatch<React.SetStateAction<{ policyHours: number; noShowFee: number }>>
  openChangePolicy: () => void
  handleSubmitPolicyChange: (e: FormEvent) => void

  // Mobile sidebar
  isMobileSidebarOpen: boolean
  setIsMobileSidebarOpen: (open: boolean) => void

  // Actions
  settlement: ReturnType<typeof useMerchantSettlement>
  handleSignIn: () => void
  handleLockSession: () => void
  handleToggleDrift: () => void
}

const MerchantContext = createContext<MerchantContextValue | null>(null)

export function MerchantProvider({ children }: { children: ReactNode }) {
  const { state, setState } = useMerchantStore()
  const { message: toastMessage, show: showToast, dismiss: dismissToast } = useToast(3800)

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
  const [paypalChangeInput, setPaypalChangeInput] = useState('')
  const [isChangePolicyOpen, setIsChangePolicyOpen] = useState(false)
  const [policyForm, setPolicyForm] = useState({
    policyHours: 24,
    noShowFee: 30,
  })
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

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
  const capturedRevenue = state.bookings
    .filter((b) => b.status === 'CAPTURED')
    .reduce((acc, b) => acc + b.servicePrice, 0)
  const noShowRecovered = state.bookings
    .filter((b) => b.status === 'NO_SHOW_CAPTURED')
    .reduce((acc, b) => acc + b.noShowFee, 0)

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

  const openAddStaff = () => {
    setEditingStaff(null)
    setStaffForm({
      ...DEFAULT_STAFF_FORM,
      role: 'Lead Stylist',
      specialties: 'Knotless Braids, Silk Press',
    })
    setIsAddStaffOpen(true)
  }

  const openEditStaff = (stylist: StaffMember) => {
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
  }

  const openDeleteStaff = (stylist: StaffMember) => {
    setDeletingStaff(stylist)
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

  const openAddService = () => {
    setEditingService(null)
    setServiceForm(DEFAULT_SERVICE_FORM)
    setIsAddServiceOpen(true)
  }

  const openEditService = (srv: SalonService) => {
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
  }

  const openDeleteService = (srv: SalonService) => {
    setDeletingService(srv)
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

  const openChangePaypal = () => {
    setPaypalChangeInput('')
    setIsChangePaypalOpen(true)
  }

  const handleSubmitPaypalChange = (event: FormEvent) => {
    event.preventDefault()
    if (!paypalChangeInput) return

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
        paypalMerchantId: paypalChangeInput,
      },
    }

    setState((prev) => ({
      ...prev,
      changeRequests: [newCr, ...prev.changeRequests],
    }))
    setIsChangePaypalOpen(false)
    setPaypalChangeInput('')
    showToast('PayPal account change request submitted to Platform Admins for verification.')
  }

  const openChangePolicy = () => {
    setPolicyForm({
      policyHours: state.salon.cancellationPolicyHours,
      noShowFee: state.salon.defaultNoShowFee,
    })
    setIsChangePolicyOpen(true)
  }

  const handleSubmitPolicyChange = (event: FormEvent) => {
    event.preventDefault()

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
        policyHours: policyForm.policyHours,
        noShowFee: policyForm.noShowFee,
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

  useEffect(() => {
    if (!selectedBooking) return
    const fresh = state.bookings.find((b) => b.id === selectedBooking.id)
    if (fresh && fresh !== selectedBooking) {
      setSelectedBooking(fresh)
    }
  }, [selectedBooking, state.bookings])

  const value: MerchantContextValue = {
    state,
    activeHolds,
    activeHoldsCount: activeHolds.length,
    activeHoldsVolume,
    capturedRevenue,
    noShowRecovered,
    pendingChangeRequests,
    isSettlementProcessing,
    idempotencyToast,
    toastMessage,
    dismissToast,

    selectedBooking,
    setSelectedBooking,
    inspectConsentBooking,
    setInspectConsentBooking,

    isAddStaffOpen,
    setIsAddStaffOpen,
    editingStaff,
    staffForm,
    setStaffForm,
    deletingStaff,
    setDeletingStaff,
    openAddStaff,
    openEditStaff,
    openDeleteStaff,
    handleSaveStaff,
    handleDeleteStaff,

    isAddServiceOpen,
    setIsAddServiceOpen,
    editingService,
    serviceForm,
    setServiceForm,
    deletingService,
    setDeletingService,
    openAddService,
    openEditService,
    openDeleteService,
    handleSaveService,
    handleDeleteService,

    isChangePaypalOpen,
    setIsChangePaypalOpen,
    paypalChangeInput,
    setPaypalChangeInput,
    openChangePaypal,
    handleSubmitPaypalChange,

    isChangePolicyOpen,
    setIsChangePolicyOpen,
    policyForm,
    setPolicyForm,
    openChangePolicy,
    handleSubmitPolicyChange,

    isMobileSidebarOpen,
    setIsMobileSidebarOpen,

    settlement,
    handleSignIn,
    handleLockSession,
    handleToggleDrift,
  }

  return <MerchantContext.Provider value={value}>{children}</MerchantContext.Provider>
}

export function useMerchantContext() {
  const context = useContext(MerchantContext)
  if (!context) {
    throw new Error('useMerchantContext must be used within a <MerchantProvider>')
  }
  return context
}
