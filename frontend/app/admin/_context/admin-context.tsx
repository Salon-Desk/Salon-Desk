'use client'

import type { FormEvent, ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { useAdminStore, useDemoReset, useToast } from '@/hooks'
import { createSequentialId } from '@/lib/ids'
import type { AdminDashboardState } from '@/lib/store/admin-store'
import type {
  ChangeRequest,
  CommissionOverride,
  Organization,
  PlatformUser,
  TaxonomyCategory,
} from '@/types'

import type { SalonFormState } from '../_components/salon-modals'
import type { StaffInviteFormState } from '../_components/staff-modals'
import type { CategoryFormState } from '../_components/taxonomy-modals'
import { EMPTY_CATEGORY_FORM, EMPTY_SALON_FORM, EMPTY_STAFF_FORM } from '../_constants/admin-forms'
import type { CrSubTab, SalonStatusFilter } from '../_types/admin-types'
import { type AdminMetrics, computeAdminMetrics } from '../_utils/compute-admin-metrics'

export interface AdminContextValue {
  state: AdminDashboardState
  metrics: AdminMetrics
  isResetting: boolean
  message: string | null
  showToast: (msg: string) => void

  // Salon modals & state
  salonSearch: string
  setSalonSearch: (q: string) => void
  salonStatusFilter: SalonStatusFilter
  setSalonStatusFilter: (f: SalonStatusFilter) => void
  filteredSalons: Organization[]
  isAddSalonOpen: boolean
  setIsAddSalonOpen: (open: boolean) => void
  salonForm: SalonFormState
  setSalonForm: React.Dispatch<React.SetStateAction<SalonFormState>>
  editingSalon: Organization | null
  setEditingSalon: (s: Organization | null) => void
  suspendingSalon: Organization | null
  setSuspendingSalon: (s: Organization | null) => void
  suspensionReasonInput: string
  setSuspensionReasonInput: (r: string) => void
  deletingSalon: Organization | null
  setDeletingSalon: (s: Organization | null) => void
  handleCreateSalon: (e: FormEvent) => void
  handleUpdateSalon: (e: FormEvent) => void
  handleApproveSalon: (orgId: string) => void
  handleConfirmSuspension: () => void
  handleDeleteSalon: () => void

  // Requests state
  crSubTab: CrSubTab
  setCrSubTab: (tab: CrSubTab) => void
  rejectingCr: ChangeRequest | null
  setRejectingCr: (cr: ChangeRequest | null) => void
  crRejectReason: string
  setCrRejectReason: (r: string) => void
  handleApproveChangeRequest: (cr: ChangeRequest) => void
  handleConfirmRejectCR: () => void

  // Commission state
  isAddOverrideOpen: boolean
  setIsAddOverrideOpen: (open: boolean) => void
  overrideForm: { salonId: string; customRate: string; note: string }
  setOverrideForm: React.Dispatch<
    React.SetStateAction<{ salonId: string; customRate: string; note: string }>
  >
  globalRateInput: { percentage: string; flatFee: string }
  setGlobalRateInput: React.Dispatch<React.SetStateAction<{ percentage: string; flatFee: string }>>
  handleSaveGlobalRate: (e: FormEvent) => void
  handleCreateOverride: (e: FormEvent) => void
  handleDeleteOverride: (salonId: string) => void

  // Taxonomy state
  isAddCategoryOpen: boolean
  setIsAddCategoryOpen: (open: boolean) => void
  editingCategory: TaxonomyCategory | null
  setEditingCategory: (c: TaxonomyCategory | null) => void
  categoryForm: CategoryFormState
  setCategoryForm: React.Dispatch<React.SetStateAction<CategoryFormState>>
  deletingCategory: TaxonomyCategory | null
  setDeletingCategory: (c: TaxonomyCategory | null) => void
  openAddCategory: () => void
  openEditCategory: (c: TaxonomyCategory) => void
  handleSaveCategory: (e: FormEvent) => void
  handleToggleCategoryStatus: (id: string) => void
  handleDeleteCategory: () => void

  // Staff state
  isInviteUserOpen: boolean
  setIsInviteUserOpen: (open: boolean) => void
  userForm: StaffInviteFormState
  setUserForm: React.Dispatch<React.SetStateAction<StaffInviteFormState>>
  deletingUser: PlatformUser | null
  setDeletingUser: (u: PlatformUser | null) => void
  handleInviteUser: (e: FormEvent) => void
  handleToggleUserStatus: (id: string) => void
  handleDeleteUser: () => void

  // Auth & System actions
  handleResetData: () => Promise<void>
  handleJudgeSignIn: () => void
  handleLockSession: () => void
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const { state, setState, resetState } = useAdminStore()
  const { message, show: showToast } = useToast(3800)
  const { isResetting, reset: resetDemo } = useDemoReset(resetState)

  const [isAddSalonOpen, setIsAddSalonOpen] = useState(false)
  const [editingSalon, setEditingSalon] = useState<Organization | null>(null)
  const [suspendingSalon, setSuspendingSalon] = useState<Organization | null>(null)
  const [suspensionReasonInput, setSuspensionReasonInput] = useState('')
  const [deletingSalon, setDeletingSalon] = useState<Organization | null>(null)

  const [crSubTab, setCrSubTab] = useState<CrSubTab>('POLICY')
  const [rejectingCr, setRejectingCr] = useState<ChangeRequest | null>(null)
  const [crRejectReason, setCrRejectReason] = useState('')

  const [isAddOverrideOpen, setIsAddOverrideOpen] = useState(false)
  const [overrideForm, setOverrideForm] = useState({
    salonId: '',
    customRate: '1.8',
    note: '',
  })
  const [globalRateInput, setGlobalRateInput] = useState({
    percentage: state.globalRate.percentage.toString(),
    flatFee: state.globalRate.flatFee.toString(),
  })

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<TaxonomyCategory | null>(null)
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM)
  const [deletingCategory, setDeletingCategory] = useState<TaxonomyCategory | null>(null)

  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false)
  const [userForm, setUserForm] = useState<StaffInviteFormState>(EMPTY_STAFF_FORM)
  const [deletingUser, setDeletingUser] = useState<PlatformUser | null>(null)

  const [salonSearch, setSalonSearch] = useState('')
  const [salonStatusFilter, setSalonStatusFilter] = useState<SalonStatusFilter>('ALL')
  const [salonForm, setSalonForm] = useState<SalonFormState>(EMPTY_SALON_FORM)

  useEffect(() => {
    setGlobalRateInput({
      percentage: state.globalRate.percentage.toString(),
      flatFee: state.globalRate.flatFee.toString(),
    })
  }, [state.globalRate.percentage, state.globalRate.flatFee])

  const metrics = computeAdminMetrics(state)

  const filteredSalons = useMemo(
    () =>
      state.organizations.filter((org) => {
        const query = salonSearch.toLowerCase()
        const matchesSearch =
          org.name.toLowerCase().includes(query) ||
          org.ownerName.toLowerCase().includes(query) ||
          (org.city?.toLowerCase().includes(query) ?? false)
        const matchesStatus = salonStatusFilter === 'ALL' || org.status === salonStatusFilter
        return matchesSearch && matchesStatus
      }),
    [state.organizations, salonSearch, salonStatusFilter],
  )

  const handleResetData = async () => {
    await resetDemo()
    showToast('Demo data reset')
  }

  const handleJudgeSignIn = () => {
    setState({ ...state, authenticated: true })
    showToast('Signed in as Platform Admin')
  }

  const handleLockSession = () => {
    setState({ ...state, authenticated: false })
    showToast('Session locked')
  }

  const handleCreateSalon = (event: FormEvent) => {
    event.preventDefault()
    if (!salonForm.name || !salonForm.email) return

    const newOrg: Organization = {
      id: createSequentialId('org'),
      name: salonForm.name,
      category: salonForm.category,
      ownerName: salonForm.ownerName || 'Partner Owner',
      email: salonForm.email,
      phone: salonForm.phone || '+1 (212) 555-0100',
      address: salonForm.address || '100 Broadway',
      city: salonForm.city,
      status: 'APPROVED',
      paypalMerchantId:
        salonForm.paypalMerchantId || `MERCHANT_${createSequentialId('NEW').slice(-4)}`,
      verified: true,
      cancellationPolicyHours: 24,
      activeHoldsCount: 0,
      totalVolume: 0,
      stylistsCount: 2,
      joinedAt: 'Just now',
    }

    setState({
      ...state,
      organizations: [newOrg, ...state.organizations],
    })
    setIsAddSalonOpen(false)
    setSalonForm(EMPTY_SALON_FORM)
    showToast(`Added "${newOrg.name}" to platform salon directory`)
  }

  const handleUpdateSalon = (event: FormEvent) => {
    event.preventDefault()
    if (!editingSalon) return

    const updated = state.organizations.map((org) =>
      org.id === editingSalon.id ? editingSalon : org,
    )
    setState({ ...state, organizations: updated })
    setEditingSalon(null)
    showToast(`Updated "${editingSalon.name}"`)
  }

  const handleApproveSalon = (orgId: string) => {
    const updated = state.organizations.map((org) =>
      org.id === orgId ? { ...org, status: 'APPROVED' as const, verified: true } : org,
    )
    setState({ ...state, organizations: updated })
    showToast('Salon approved and activated')
  }

  const handleConfirmSuspension = () => {
    if (!suspendingSalon) return
    const isCurrentlySuspended = suspendingSalon.status === 'SUSPENDED'
    const nextStatus = isCurrentlySuspended ? ('APPROVED' as const) : ('SUSPENDED' as const)

    const updated = state.organizations.map((org) => {
      if (org.id === suspendingSalon.id) {
        return {
          ...org,
          status: nextStatus,
          suspensionReason: isCurrentlySuspended
            ? undefined
            : suspensionReasonInput || 'Compliance review pending.',
        }
      }
      return org
    })

    setState({ ...state, organizations: updated })
    setSuspendingSalon(null)
    setSuspensionReasonInput('')
    showToast(
      isCurrentlySuspended
        ? `Reinstated "${suspendingSalon.name}"`
        : `Suspended "${suspendingSalon.name}"`,
    )
  }

  const handleDeleteSalon = () => {
    if (!deletingSalon) return
    const name = deletingSalon.name
    setState({
      ...state,
      organizations: state.organizations.filter((o) => o.id !== deletingSalon.id),
    })
    setDeletingSalon(null)
    showToast(`Removed "${name}" from platform`)
  }

  const handleApproveChangeRequest = (cr: ChangeRequest) => {
    const updatedCRs = state.changeRequests.map((item) =>
      item.id === cr.id ? { ...item, status: 'APPROVED' as const } : item,
    )

    let updatedOrgs = [...state.organizations]
    if (cr.type === 'PAYPAL_ACCOUNT' && cr.proposedData.paypalMerchantId) {
      updatedOrgs = updatedOrgs.map((org) =>
        org.id === cr.salonId
          ? {
              ...org,
              paypalMerchantId: cr.proposedData.paypalMerchantId!,
              verified: true,
            }
          : org,
      )
    } else if (cr.type === 'CANCELLATION_POLICY' && cr.proposedData.policyHours) {
      updatedOrgs = updatedOrgs.map((org) =>
        org.id === cr.salonId
          ? {
              ...org,
              cancellationPolicyHours: cr.proposedData.policyHours!,
            }
          : org,
      )
    }

    setState({
      ...state,
      changeRequests: updatedCRs,
      organizations: updatedOrgs,
    })
    showToast(`Approved change request ${cr.id}`)
  }

  const handleConfirmRejectCR = () => {
    if (!rejectingCr) return
    const updatedCRs = state.changeRequests.map((item) =>
      item.id === rejectingCr.id
        ? {
            ...item,
            status: 'REJECTED' as const,
            rejectionReason: crRejectReason || 'Did not meet compliance criteria.',
          }
        : item,
    )
    setState({ ...state, changeRequests: updatedCRs })
    const rejectedId = rejectingCr.id
    setRejectingCr(null)
    setCrRejectReason('')
    showToast(`Rejected change request ${rejectedId}`)
  }

  const handleSaveGlobalRate = (event: FormEvent) => {
    event.preventDefault()
    const pct = parseFloat(globalRateInput.percentage)
    const flat = parseFloat(globalRateInput.flatFee)
    if (Number.isNaN(pct) || Number.isNaN(flat)) return

    setState({
      ...state,
      globalRate: { percentage: pct, flatFee: flat },
    })
    showToast(`Global commission rate updated: ${pct}% + $${flat.toFixed(2)}`)
  }

  const handleCreateOverride = (event: FormEvent) => {
    event.preventDefault()
    const matchedSalon = state.organizations.find((o) => o.id === overrideForm.salonId)
    if (!matchedSalon) return

    const rate = parseFloat(overrideForm.customRate)
    if (Number.isNaN(rate)) return

    const newOverride: CommissionOverride = {
      salonId: matchedSalon.id,
      salonName: matchedSalon.name,
      customRate: rate,
      note: overrideForm.note || 'Custom partner agreement',
      updatedAt: 'Just now',
    }

    const filtered = state.commissionOverrides.filter((ov) => ov.salonId !== matchedSalon.id)
    setState({
      ...state,
      commissionOverrides: [newOverride, ...filtered],
    })
    setIsAddOverrideOpen(false)
    setOverrideForm({ salonId: '', customRate: '1.8', note: '' })
    showToast(`${rate}% commission override applied for "${matchedSalon.name}"`)
  }

  const handleDeleteOverride = (salonId: string) => {
    setState({
      ...state,
      commissionOverrides: state.commissionOverrides.filter((ov) => ov.salonId !== salonId),
    })
    showToast('Override removed; reverted to global tier')
  }

  const openAddCategory = () => {
    setEditingCategory(null)
    setCategoryForm({
      ...EMPTY_CATEGORY_FORM,
      displayOrder: String(state.categories.length + 1),
    })
    setIsAddCategoryOpen(true)
  }

  const openEditCategory = (category: TaxonomyCategory) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      iconName: category.iconName,
      displayOrder: String(category.displayOrder),
    })
    setIsAddCategoryOpen(true)
  }

  const handleSaveCategory = (event: FormEvent) => {
    event.preventDefault()
    if (!categoryForm.name) return

    if (editingCategory) {
      const updated = state.categories.map((c) =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: categoryForm.name,
              slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
              description: categoryForm.description,
              iconName: categoryForm.iconName,
              displayOrder: parseInt(categoryForm.displayOrder, 10) || 1,
            }
          : c,
      )
      setState({ ...state, categories: updated })
      setEditingCategory(null)
      showToast(`Updated category "${categoryForm.name}"`)
    } else {
      const newCat: TaxonomyCategory = {
        id: createSequentialId('cat'),
        name: categoryForm.name,
        slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
        description: categoryForm.description || 'General salon and styling services.',
        iconName: categoryForm.iconName || 'Scissors',
        displayOrder: parseInt(categoryForm.displayOrder, 10) || state.categories.length + 1,
        status: 'ACTIVE',
        servicesCount: 0,
      }
      setState({ ...state, categories: [...state.categories, newCat] })
      setIsAddCategoryOpen(false)
      showToast(`Added category "${newCat.name}"`)
    }

    setCategoryForm(EMPTY_CATEGORY_FORM)
  }

  const handleToggleCategoryStatus = (catId: string) => {
    const updated = state.categories.map((c) =>
      c.id === catId
        ? {
            ...c,
            status: (c.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE') as 'ACTIVE' | 'HIDDEN',
          }
        : c,
    )
    setState({ ...state, categories: updated })
    showToast('Category visibility updated')
  }

  const handleDeleteCategory = () => {
    if (!deletingCategory) return
    const name = deletingCategory.name
    setState({
      ...state,
      categories: state.categories.filter((c) => c.id !== deletingCategory.id),
    })
    setDeletingCategory(null)
    showToast(`Removed category "${name}"`)
  }

  const handleInviteUser = (event: FormEvent) => {
    event.preventDefault()
    if (!userForm.name || !userForm.email) return

    const newUser: PlatformUser = {
      id: createSequentialId('usr'),
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      status: 'ACTIVE',
      avatar: `https://picsum.photos/seed/${Date.now()}/200/200`,
      lastActive: 'Just invited',
    }

    setState({ ...state, platformUsers: [...state.platformUsers, newUser] })
    setIsInviteUserOpen(false)
    setUserForm(EMPTY_STAFF_FORM)
    showToast(`Invited "${newUser.name}" to platform team`)
  }

  const handleToggleUserStatus = (userId: string) => {
    const target = state.platformUsers.find((u) => u.id === userId)
    if (!target) return
    if (target.id === state.currentUser.id) {
      showToast('Cannot revoke your own administrator account')
      return
    }

    const updated = state.platformUsers.map((u) =>
      u.id === userId
        ? {
            ...u,
            status: (u.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE') as 'ACTIVE' | 'REVOKED',
          }
        : u,
    )
    setState({ ...state, platformUsers: updated })
    showToast(`Updated status for "${target.name}"`)
  }

  const handleDeleteUser = () => {
    if (!deletingUser) return
    if (deletingUser.id === state.currentUser.id) {
      showToast('Cannot delete the active signed-in account')
      setDeletingUser(null)
      return
    }
    const name = deletingUser.name
    setState({
      ...state,
      platformUsers: state.platformUsers.filter((u) => u.id !== deletingUser.id),
    })
    setDeletingUser(null)
    showToast(`Removed "${name}" from team`)
  }

  const value: AdminContextValue = {
    state,
    metrics,
    isResetting,
    message,
    showToast,

    salonSearch,
    setSalonSearch,
    salonStatusFilter,
    setSalonStatusFilter,
    filteredSalons,
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
    handleApproveSalon,
    handleConfirmSuspension,
    handleDeleteSalon,

    crSubTab,
    setCrSubTab,
    rejectingCr,
    setRejectingCr,
    crRejectReason,
    setCrRejectReason,
    handleApproveChangeRequest,
    handleConfirmRejectCR,

    isAddOverrideOpen,
    setIsAddOverrideOpen,
    overrideForm,
    setOverrideForm,
    globalRateInput,
    setGlobalRateInput,
    handleSaveGlobalRate,
    handleCreateOverride,
    handleDeleteOverride,

    isAddCategoryOpen,
    setIsAddCategoryOpen,
    editingCategory,
    setEditingCategory,
    categoryForm,
    setCategoryForm,
    deletingCategory,
    setDeletingCategory,
    openAddCategory,
    openEditCategory,
    handleSaveCategory,
    handleToggleCategoryStatus,
    handleDeleteCategory,

    isInviteUserOpen,
    setIsInviteUserOpen,
    userForm,
    setUserForm,
    deletingUser,
    setDeletingUser,
    handleInviteUser,
    handleToggleUserStatus,
    handleDeleteUser,

    handleResetData,
    handleJudgeSignIn,
    handleLockSession,
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdminContext() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdminContext must be used within an <AdminProvider>')
  }
  return context
}
