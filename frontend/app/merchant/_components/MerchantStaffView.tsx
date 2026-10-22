'use client'

import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  UserRound,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { StatCard } from '@/components/card'
import { DeleteConfirmationDialog } from '@/components/dialog/DeleteConfirmationDialog'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { Badge, Card, EmptyState, IconButton, SegmentedControl } from '@/components/ui'
import { Pagination } from '@/components/ui/pagination'
import PrimaryButton from '@/components/ui/primary-button'
import { toastColor } from '@/constant/toast-color'
import { useAgentUiActions } from '@/hooks/useAgentUiActions'
import { useListingParams } from '@/hooks/useListingParams'
import {
  buildMerchantStaffCountApiParams,
  merchantStaffListDefaults,
  type MerchantStaffListParams,
  MerchantStaffListParamsSchema,
} from '@/lib/listing-params/merchant-staff-list-params'
import {
  staffAvatarGradient,
  staffDisplayName,
  staffInitials,
  staffPhone,
  staffPicture,
} from '@/lib/util/staff-display'
import { cn } from '@/lib/utils'
import {
  useDeleteMyEmployeeMutation,
  useGetMyEmployeeShiftsQuery,
  useGetMyEmployeesQuery,
} from '@/store/api/orgApi'
import type { User } from '@/types/user'

import { EditEmployeeModal } from './EditEmployeeModal'
import { EmployeeFormModal } from './EmployeeFormModal'
import { StaffShiftsModal } from './StaffShiftsModal'
import { getStaffTableColumns } from './StaffTableColumns'

export function MerchantStaffView() {
  const { params, displayParams, setParam, setParams } = useListingParams<
    MerchantStaffListParams,
    typeof MerchantStaffListParamsSchema
  >(MerchantStaffListParamsSchema)

  const { data: allStaffCount } = useGetMyEmployeesQuery(buildMerchantStaffCountApiParams('all'))
  const { data: stylistCount } = useGetMyEmployeesQuery(buildMerchantStaffCountApiParams('stylist'))
  const { data: receptionCount } = useGetMyEmployeesQuery(
    buildMerchantStaffCountApiParams('reception'),
  )

  const {
    data: employeesData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetMyEmployeesQuery(params)
  const employees = employeesData?.items ?? []
  const totalItems = employeesData?.total ?? employees.length
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteMyEmployeeMutation()

  const { data: employeeShifts = [] } = useGetMyEmployeeShiftsQuery()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isShiftsOpen, setIsShiftsOpen] = useState(false)
  const [selectedStaffForShift, setSelectedStaffForShift] = useState<string | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useAgentUiActions({
    onOpenAddStaff: () => setIsAddOpen(true),
  })

  const settledSearch = typeof params.q === 'string' ? params.q : ''
  const roleFilter = displayParams.role
  const viewMode = displayParams.viewMode
  const currentPage = displayParams.page
  const pageSize = displayParams.limit

  const handleCopyId = (id: string) => {
    void navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast.success('Staff ID copied to clipboard', toastColor.success)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleConfirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteEmployee(deleting.id).unwrap()
      toast.success('Team member removed', toastColor.success)
      setDeleting(null)
      void refetch()
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not remove employee'
      toast.error(String(message), toastColor.error)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedEmployees = employees

  const stats = useMemo(
    () => ({
      total: allStaffCount?.total ?? 0,
      stylists: stylistCount?.total ?? 0,
      reception: receptionCount?.total ?? 0,
      active: allStaffCount?.total ?? 0,
    }),
    [allStaffCount?.total, stylistCount?.total, receptionCount?.total],
  )

  const roleFilterOptions = [
    { value: 'all' as const, label: `All (${stats.total})` },
    { value: 'stylist' as const, label: `Stylists (${stats.stylists})` },
    { value: 'reception' as const, label: `Front Desk (${stats.reception})` },
    { value: 'org_owner' as const, label: 'Owners' },
  ]

  const viewModeOptions = [
    { value: 'grid' as const, label: 'Cards', icon: LayoutGrid },
    { value: 'table' as const, label: 'Roster', icon: List },
  ]

  const staffColumns = useMemo(
    () =>
      getStaffTableColumns({
        onCopyId: handleCopyId,
        copiedId,
        onEdit: (m) => setEditingEmployee(m),
        onDelete: (m) => setDeleting(m),
        onManageShifts: (m) => {
          setSelectedStaffForShift(m.id)
          setIsShiftsOpen(true)
        },
      }),
    [copiedId],
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-12 animate-in fade-in duration-300 sm:space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-amber-50/25 to-amber-100/20 p-6 shadow-xs backdrop-blur-md sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-amber-200/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-900 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Salon Team Management</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-extrabold text-slate-900 text-2xl tracking-tight sm:text-3xl">
                Stylists &amp; Staff Directory
              </h1>
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-2xs">
                {stats.total} {stats.total === 1 ? 'Member' : 'Members'}
              </span>
            </div>

            <p className="max-w-2xl text-xs text-slate-600 sm:text-sm leading-relaxed">
              Manage your verified roster, assign schedule permissions, track contact details, and
              organize your front desk and stylist team.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-xs backdrop-blur-sm">
            <IconButton
              aria-label="Refresh roster"
              onClick={() => void refetch()}
              className="h-10 w-10 cursor-pointer rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.92]"
              title="Refresh staff"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-amber-600' : ''}`} />
            </IconButton>

            <button
              type="button"
              onClick={() => {
                setSelectedStaffForShift(null)
                setIsShiftsOpen(true)
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-300/80 bg-amber-50/70 px-3.5 text-xs font-bold text-amber-900 shadow-2xs transition-all hover:bg-amber-100/90 hover:text-amber-950 active:scale-[0.98] cursor-pointer"
              title="Manage staff shifts and schedules"
            >
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="hidden sm:inline">Shifts &amp; Schedules</span>
            </button>

            <div data-agent-action="add-staff">
              <PrimaryButton
                title="Add team member"
                size="sm"
                fullWidth={false}
                icon={<Plus className="h-4 w-4" />}
                className="h-10 rounded-xl px-5 text-xs font-bold shadow-xs transition-all hover:shadow-md active:scale-[0.98]"
                onClick={() => setIsAddOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Metric Stat Cards with Quick Filtering */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          label="Total Staff"
          value={stats.total}
          icon={Users}
          tone="amber"
          footnote="Registered team profiles"
          onClick={() => setParams({ role: 'all', page: 1 })}
          className={cn(
            'cursor-pointer transition-all duration-200',
            roleFilter === 'all'
              ? 'border-amber-400 bg-amber-50/20 shadow-xs ring-2 ring-amber-500/40'
              : 'hover:border-amber-200 hover:shadow-xs',
          )}
        />
        <StatCard
          label="Active Stylists"
          value={stats.stylists}
          icon={UserCheck}
          tone="emerald"
          footnote="Available for bookings"
          onClick={() => setParams({ role: 'stylist', page: 1 })}
          className={cn(
            'cursor-pointer transition-all duration-200',
            roleFilter === 'stylist'
              ? 'border-emerald-400 bg-emerald-50/20 shadow-xs ring-2 ring-emerald-500/40'
              : 'hover:border-emerald-200 hover:shadow-xs',
          )}
        />
        <StatCard
          label="Receptionists"
          value={stats.reception}
          icon={Calendar}
          tone="sky"
          footnote="Front desk & check-in"
          onClick={() => setParams({ role: 'reception', page: 1 })}
          className={cn(
            'cursor-pointer transition-all duration-200',
            roleFilter === 'reception'
              ? 'border-sky-400 bg-sky-50/20 shadow-xs ring-2 ring-sky-500/40'
              : 'hover:border-sky-200 hover:shadow-xs',
          )}
        />
        <StatCard
          label="Operational"
          value={stats.active}
          icon={CheckCircle2}
          tone="purple"
          footnote="Active status accounts"
          className="border-purple-100/80 hover:border-purple-200/90 hover:shadow-xs transition-all"
        />
      </div>

      {/* Filter and View Command Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone…"
              value={displayParams.search}
              onChange={(e) => {
                setParams({ search: e.target.value, page: 1 })
              }}
              className="h-9.5 w-full rounded-xl border border-slate-200/90 bg-slate-50/70 pr-4 pl-9 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs transition-all focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Role filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100/80 p-1">
            <SegmentedControl
              options={roleFilterOptions}
              value={roleFilter}
              onChange={(val) => {
                setParams({ role: val, page: 1 })
              }}
              variant="pills"
              className="h-8.5"
            />
          </div>
        </div>

        {/* View Switcher & Roster Count */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5 sm:justify-end sm:border-t-0 sm:pt-0">
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/70 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
            Total: <strong className="font-bold text-slate-900">{totalItems}</strong>
          </span>
          <SegmentedControl
            options={viewModeOptions}
            value={viewMode}
            onChange={(mode) => setParam('viewMode', mode)}
            variant="tabs"
            className="h-8.5"
          />
        </div>
      </div>

      {/* Active Filter Strip if query or role filter is applied */}
      {(settledSearch || roleFilter !== 'all') && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-2.5 text-xs text-amber-900 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-amber-950">Active filters:</span>
            {roleFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/80 bg-white px-2 py-0.5 font-medium shadow-2xs">
                Role:{' '}
                <strong className="capitalize">
                  {roleFilter === 'org_owner' ? 'Owner' : roleFilter}
                </strong>
              </span>
            )}
            {settledSearch.trim() && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/80 bg-white px-2 py-0.5 font-medium shadow-2xs">
                Search: &ldquo;<strong>{settledSearch}</strong>&rdquo;
              </span>
            )}
            <span className="text-amber-700">· {totalItems} matching</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setParams(merchantStaffListDefaults)
            }}
            className="inline-flex cursor-pointer items-center gap-1 font-semibold text-amber-800 transition-all hover:text-amber-950 hover:underline active:scale-[0.98]"
          >
            <span>Reset filters</span>
          </button>
        </div>
      )}

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/70 bg-white py-20 text-slate-500 text-sm shadow-xs">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          <p className="font-medium text-slate-700">Loading roster directory…</p>
          <p className="text-xs text-slate-400">Fetching team members and service schedules</p>
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/80 p-8 text-center text-rose-800 shadow-xs">
          <h3 className="font-bold text-base">Could not load employees</h3>
          <p className="mt-1 text-xs text-rose-600">
            Sign in as an organization owner or check your server connection and try again.
          </p>
          <PrimaryButton
            title="Retry"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="mt-4 h-9 rounded-lg border-rose-200 bg-white px-5 text-rose-700 hover:bg-rose-100 transition-all active:scale-[0.98]"
            onClick={() => void refetch()}
          />
        </div>
      ) : null}

      {/* Empty State */}
      {!isLoading &&
      !isError &&
      employees.length === 0 &&
      !settledSearch &&
      roleFilter === 'all' ? (
        <EmptyState
          icon={Users}
          title="No staff members registered yet"
          description="Add a stylist, receptionist, or manager account to assign appointments and configure schedule availability."
          action={
            <PrimaryButton
              title="Add first team member"
              size="sm"
              fullWidth={false}
              icon={<Plus className="h-4 w-4" />}
              className="h-9.5 rounded-lg px-5 text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
              onClick={() => setIsAddOpen(true)}
            />
          }
        />
      ) : null}

      {/* Empty Search Results */}
      {!isLoading && !isError && totalItems === 0 && (settledSearch || roleFilter !== 'all') ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-xs">
          <Filter className="mb-2 h-8 w-8 text-slate-300" />
          <h3 className="font-semibold text-sm text-slate-800">No matching team members</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            No employees match your filter
            {settledSearch ? ` “${settledSearch}”` : ''}. Try clearing filters or searching another
            keyword.
          </p>
          <button
            type="button"
            onClick={() => {
              setParams(merchantStaffListDefaults)
            }}
            className="mt-3.5 cursor-pointer text-xs font-bold text-amber-700 underline underline-offset-2 transition-all hover:text-amber-800 active:scale-[0.98]"
          >
            Clear all filters
          </button>
        </div>
      ) : null}

      {/* Grid View */}
      {!isLoading && !isError && paginatedEmployees.length > 0 && viewMode === 'grid' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedEmployees.map((member) => {
              const name = staffDisplayName(member)
              const initials = staffInitials(name)
              const gradient = staffAvatarGradient(member.id || name)
              const picture = staffPicture(member)
              const phone = staffPhone(member)
              const roleTone =
                member.role === 'org_owner'
                  ? 'amber'
                  : member.role === 'reception'
                    ? 'sky'
                    : 'emerald'
              const roleLabel =
                member.role === 'org_owner'
                  ? 'Owner'
                  : member.role === 'reception'
                    ? 'Receptionist'
                    : 'Stylist'

              const isOwner = member.role === 'org_owner'
              const isActive = (member.status || 'active').toLowerCase() === 'active'

              return (
                <Card
                  key={member.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_12px_24px_-8px_rgba(245,158,11,0.12),0_4px_12px_-2px_rgba(0,0,0,0.03)]"
                >
                  {/* Decorative top accent line with role-based gradient */}
                  <div
                    className={cn(
                      'pointer-events-none absolute inset-x-0 top-0 h-1 transition-opacity duration-200 opacity-60 group-hover:opacity-100',
                      member.role === 'org_owner'
                        ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600'
                        : member.role === 'reception'
                          ? 'bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600'
                          : 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600',
                    )}
                  />

                  <div className="space-y-4">
                    {/* Top bar: Avatar + Status + Badges */}
                    <div className="flex items-start justify-between">
                      <div className="relative">
                        {picture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={picture}
                            alt={name}
                            className="h-14 w-14 rounded-2xl border-2 border-white object-cover shadow-sm ring-1 ring-slate-200/80 transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className={cn(
                              'flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-base font-bold text-white shadow-sm ring-1 ring-white/40 transition-transform duration-200 group-hover:scale-105',
                              gradient,
                            )}
                          >
                            {initials || <UserRound className="h-6 w-6" />}
                          </div>
                        )}
                        <span
                          className={cn(
                            'absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs',
                            isActive ? 'bg-emerald-500' : 'bg-slate-400',
                          )}
                          title={isActive ? 'Active Member' : 'Inactive Member'}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-1.5 pl-3">
                        <Badge tone={roleTone} size="sm" variant="soft" className="font-semibold">
                          {roleLabel}
                        </Badge>
                        <Badge
                          tone={isActive ? 'emerald' : 'slate'}
                          size="sm"
                          variant="soft"
                          dot
                          pulsing={isActive}
                          className="font-medium"
                        >
                          {member.status || 'Active'}
                        </Badge>
                      </div>
                    </div>

                    {/* Name and Contact details */}
                    <div>
                      <h3 className="font-bold text-base text-slate-900 tracking-tight transition-colors group-hover:text-amber-800">
                        {name}
                      </h3>

                      <div className="mt-3 space-y-2 text-xs text-slate-500">
                        <a
                          href={`mailto:${member.email}`}
                          className="flex items-center gap-2 truncate text-slate-600 transition-colors hover:text-amber-700 hover:underline"
                          title="Send email"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-amber-600" />
                          <span className="truncate font-mono text-[11.5px]">{member.email}</span>
                        </a>

                        {phone ? (
                          <a
                            href={`tel:${phone}`}
                            className="flex items-center gap-2 font-mono text-[11.5px] text-slate-600 transition-colors hover:text-amber-700 hover:underline"
                            title="Call phone number"
                          >
                            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-amber-600" />
                            <span>{phone}</span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                            <span className="italic text-[11px]">No phone provided</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shift assignment badges */}
                    {(() => {
                      const memberShifts = employeeShifts.filter((es) => es.user_id === member.id)
                      return (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {memberShifts.length > 0 ? (
                            memberShifts.map((s) => (
                              <span
                                key={s.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-200/90 bg-amber-50/70 px-2 py-0.5 text-[10.5px] font-semibold text-amber-900 shadow-2xs"
                              >
                                <Clock className="h-2.5 w-2.5 text-amber-600" />
                                <span>{s.shift_name || 'Shift'}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Default salon hours
                            </span>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                      <span>ID: {member.id.slice(0, 8)}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(member.id)}
                        className="cursor-pointer rounded-md p-1 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95"
                        title="Copy staff ID"
                      >
                        {copiedId === member.id ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <IconButton
                        aria-label="Manage work hours and shifts"
                        onClick={() => {
                          setSelectedStaffForShift(member.id)
                          setIsShiftsOpen(true)
                        }}
                        className="h-8 w-8 rounded-lg border border-slate-200/80 bg-white text-slate-600 shadow-2xs transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 active:scale-95"
                        title="Manage employee shifts"
                      >
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                      </IconButton>

                      <IconButton
                        aria-label="Edit team member"
                        onClick={() => setEditingEmployee(member)}
                        className="h-8 w-8 rounded-lg border border-slate-200/80 bg-white text-slate-600 shadow-2xs transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 active:scale-95"
                        title="Edit details"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </IconButton>

                      {!isOwner ? (
                        <IconButton
                          aria-label="Remove team member"
                          onClick={() => setDeleting(member)}
                          className="h-8 w-8 rounded-lg border border-slate-200/80 bg-white text-rose-600 shadow-2xs transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 active:scale-95"
                          title="Remove member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconButton>
                      ) : null}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            setCurrentPage={(page) => setParam('page', page)}
            onPageSizeChange={(size) => setParams({ limit: size, page: 1 })}
            pageSizeOptions={[6, 9, 15, 30]}
          />
        </div>
      ) : null}

      {/* Table / Roster View */}
      {!isLoading && !isError && paginatedEmployees.length > 0 && viewMode === 'table' ? (
        <BasicDataGridTable
          data={paginatedEmployees}
          columns={staffColumns}
          isLoading={isLoading}
          isFetching={isFetching}
          refetch={() => void refetch()}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={pageSize}
          onPageChange={(page) => setParam('page', page)}
          onItemPerPageChange={(size) => setParams({ limit: size, page: 1 })}
          showPagination={true}
          showSearch={false}
          showItemsPerPage={true}
          showColumnSelector
          tableClassName="border-slate-200/80"
          headerClassName="bg-slate-50/70"
          customButtons={[
            <PrimaryButton
              key="add-staff"
              title="Add team member"
              size="sm"
              fullWidth={false}
              icon={<Plus className="h-3.5 w-3.5" />}
              className="h-9 rounded-xl px-4 text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
              onClick={() => setIsAddOpen(true)}
            />,
          ]}
        />
      ) : null}

      {/* Add Modal */}
      <EmployeeFormModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {/* Edit Modal */}
      <EditEmployeeModal
        employee={editingEmployee}
        open={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
      />

      {/* Staff Shifts & Scheduling Modal */}
      <StaffShiftsModal
        open={isShiftsOpen}
        onClose={() => {
          setIsShiftsOpen(false)
          setSelectedStaffForShift(null)
        }}
        initialEmployeeId={selectedStaffForShift}
      />

      {/* Delete Confirmation */}
      {deleting ? (
        <DeleteConfirmationDialog
          open={Boolean(deleting)}
          setOpen={(open) => {
            if (!open) setDeleting(null)
          }}
          title="Remove team member?"
          description={`Are you sure you want to remove ${staffDisplayName(deleting)} (${deleting.email}) from your salon roster?`}
          confirmLabel={isDeleting ? 'Removing…' : 'Remove Team Member'}
          isLoading={isDeleting}
          onConfirm={() => void handleConfirmDelete()}
        />
      ) : null}
    </div>
  )
}
