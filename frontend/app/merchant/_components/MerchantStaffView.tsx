'use client'

import {
  Calendar,
  CheckCircle2,
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
import { useDeleteMyEmployeeMutation, useGetMyEmployeesQuery } from '@/store/api/orgApi'
import type { User } from '@/types/user'

import { EditEmployeeModal } from './EditEmployeeModal'
import { EmployeeFormModal } from './EmployeeFormModal'
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

  const [isAddOpen, setIsAddOpen] = useState(false)
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
      }),
    [copiedId],
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 shadow-xs backdrop-blur-sm sm:p-7">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-100/70 px-3 py-0.5 text-xs font-semibold text-amber-800">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Salon Team Management</span>
            </div>
            <h1 className="font-extrabold text-slate-900 text-2xl tracking-tight sm:text-3xl">
              Stylists &amp; Staff Directory
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-600">
              Manage your verified roster, assign schedule permissions, track contact details, and
              organize your front desk and stylist team.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <IconButton
              aria-label="Refresh roster"
              onClick={() => void refetch()}
              className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 hover:text-slate-900"
              title="Refresh staff"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-amber-600' : ''}`} />
            </IconButton>

            <div data-agent-action="add-staff">
              <PrimaryButton
                title="Add team member"
                size="sm"
                fullWidth={false}
                icon={<Plus className="h-4 w-4" />}
                className="h-10 rounded-xl px-5 text-xs font-semibold shadow-sm transition-transform active:scale-[0.98]"
                onClick={() => setIsAddOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          label="Total Staff"
          value={stats.total}
          icon={Users}
          tone="amber"
          footnote="Registered team profiles"
        />
        <StatCard
          label="Active Stylists"
          value={stats.stylists}
          icon={UserCheck}
          tone="emerald"
          footnote="Available for bookings"
        />
        <StatCard
          label="Receptionists"
          value={stats.reception}
          icon={Calendar}
          tone="sky"
          footnote="Front desk & check-in"
        />
        <StatCard
          label="Operational"
          value={stats.active}
          icon={CheckCircle2}
          tone="purple"
          footnote="Active status accounts"
        />
      </div>

      {/* Filter and View Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search bar */}
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone…"
              value={displayParams.search}
              onChange={(e) => {
                setParams({ search: e.target.value, page: 1 })
              }}
              className="h-9.5 w-full rounded-lg border border-slate-200/80 bg-slate-50/50 pr-4 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          {/* Role pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <SegmentedControl
              options={roleFilterOptions}
              value={roleFilter}
              onChange={(val) => {
                setParams({ role: val, page: 1 })
              }}
              variant="pills"
              className="h-9.5"
            />
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center justify-between sm:justify-end gap-2 border-t border-slate-100 pt-2 sm:border-t-0 sm:pt-0">
          <span className="text-[11px] font-medium text-slate-500">
            Showing <strong className="text-slate-800">{employees.length}</strong> of{' '}
            {employees.length}
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

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white py-20 text-slate-500 text-sm shadow-xs">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          <p className="font-medium text-slate-700">Loading roster directory…</p>
          <p className="text-xs text-slate-400">Fetching team members and service schedules</p>
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-8 text-center text-rose-800 shadow-xs">
          <h3 className="font-bold text-base">Could not load employees</h3>
          <p className="mt-1 text-xs text-rose-600">
            Sign in as an organization owner or check your server connection and try again.
          </p>
          <PrimaryButton
            title="Retry"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="mt-4 h-9 rounded-lg px-5 bg-white text-rose-700 border-rose-200 hover:bg-rose-100"
            onClick={() => void refetch()}
          />
        </div>
      ) : null}

      {/* Empty State */}
      {!isLoading && !isError && employees.length === 0 ? (
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
              className="h-9.5 rounded-lg px-5 text-xs font-semibold"
              onClick={() => setIsAddOpen(true)}
            />
          }
        />
      ) : null}

      {/* Empty Search Results */}
      {!isLoading && !isError && totalItems === 0 && (settledSearch || roleFilter !== 'all') ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-xs">
          <Filter className="h-8 w-8 text-slate-300 mb-2" />
          <h3 className="font-semibold text-sm text-slate-800">No matching team members</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            No employees match your filter
            {settledSearch ? ` “${settledSearch}”` : ''}. Try clearing filters or searching another
            keyword.
          </p>
          <button
            type="button"
            onClick={() => {
              setParams(merchantStaffListDefaults)
            }}
            className="mt-3.5 text-xs font-semibold text-amber-700 hover:text-amber-800 underline underline-offset-2"
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
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Top bar: Avatar + Status */}
                    <div className="flex items-start justify-between">
                      <div className="relative">
                        {picture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={picture}
                            alt={name}
                            className="h-14 w-14 rounded-2xl border-2 border-white object-cover shadow-sm ring-1 ring-slate-200/80"
                          />
                        ) : (
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-base font-bold text-white shadow-sm ring-1 ring-slate-200/50`}
                          >
                            {initials || <UserRound className="h-6 w-6" />}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                          title={isActive ? 'Active' : 'Inactive'}
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Badge tone={roleTone} size="sm" variant="soft">
                          {roleLabel}
                        </Badge>
                        <Badge
                          tone={isActive ? 'emerald' : 'slate'}
                          size="sm"
                          variant={isActive ? 'soft' : 'soft'}
                          dot
                        >
                          {member.status || 'Active'}
                        </Badge>
                      </div>
                    </div>

                    {/* Name and Contact details */}
                    <div>
                      <h3 className="font-bold text-base text-slate-900 tracking-tight group-hover:text-amber-800 transition-colors">
                        {name}
                      </h3>

                      <div className="mt-2.5 space-y-1.5 text-xs text-slate-500">
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate font-mono text-[11.5px]">{member.email}</span>
                        </div>

                        {phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="font-mono text-[11.5px] text-slate-600">{phone}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-[11px] italic">No phone provided</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                      <span>ID: {member.id.slice(0, 8)}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(member.id)}
                        className="p-1 hover:text-slate-700 transition-colors rounded-md hover:bg-slate-100"
                        title="Copy staff ID"
                      >
                        {copiedId === member.id ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <IconButton
                        aria-label="Edit team member"
                        onClick={() => setEditingEmployee(member)}
                        className="h-8 w-8 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                        title="Edit details"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </IconButton>

                      {!isOwner ? (
                        <IconButton
                          aria-label="Remove team member"
                          onClick={() => setDeleting(member)}
                          className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-50 hover:border-rose-200"
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
