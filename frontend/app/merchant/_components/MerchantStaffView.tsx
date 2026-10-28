'use client'

import {
  Calendar,
  CheckCircle2,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Search,
  UserCheck,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'

import { PrimaryButton } from '@/components/button'
import { StatCard } from '@/components/card'
import { DeleteConfirmationDialog } from '@/components/dialog/DeleteConfirmationDialog'
import { EmptyState } from '@/components/empty'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { SegmentedControl } from '@/components/ui'
import { Pagination } from '@/components/ui/pagination'
import { toastColor } from '@/constant/toast-color'
import { useListingParams } from '@/hooks/use-listing-params'
import { useAgentUiActions } from '@/hooks/useAgentUiActions'
import {
  buildMerchantStaffCountApiParams,
  merchantStaffListDefaults,
  type MerchantStaffListParams,
  MerchantStaffListParamsSchema,
} from '@/lib/listing-params/merchant-staff-list-params'
import { hasMerchantPermission } from '@/lib/permissions/permissions'
import { staffDisplayName } from '@/lib/util/staff-display'
import { cn } from '@/lib/utils'
import {
  useDeleteMyEmployeeMutation,
  useGetMyEmployeeShiftsQuery,
  useGetMyEmployeesQuery,
} from '@/store/api/orgApi'
import { userSelector } from '@/store/authSlice'
import type { User } from '@/types/user'

import { EditEmployeeModal } from './EditEmployeeModal'
import { EmployeeFormModal } from './EmployeeFormModal'
import { MerchantStaffCard } from './MerchantStaffCard'
import { MerchantStaffHeader } from './MerchantStaffHeader'
import { StaffShiftsModal } from './StaffShiftsModal'
import { getStaffTableColumns } from './StaffTableColumns'

export function MerchantStaffView() {
  const user = useSelector(userSelector)
  const canManageStaff = hasMerchantPermission(user?.role, 'merchant:staff:manage')
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
        employeeShifts,
        onManageShifts: canManageStaff
          ? (m) => {
              setSelectedStaffForShift(m.id)
              setIsShiftsOpen(true)
            }
          : undefined,
      }),
    [canManageStaff, copiedId, employeeShifts],
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-12 animate-in fade-in duration-300 sm:space-y-6">
      {/* Header Banner */}
      <MerchantStaffHeader
        totalMembers={stats.total}
        isFetching={isFetching}
        onRefresh={() => void refetch()}
        onOpenShifts={() => {
          setSelectedStaffForShift(null)
          setIsShiftsOpen(true)
        }}
        onAddStaff={canManageStaff ? () => setIsAddOpen(true) : undefined}
      />

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

      {/* Role Filter & View Switcher Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:justify-between">
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

      {/* Empty State when no employees at all */}
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

      {/* Grid / Cards View */}
      {!isLoading && !isError && stats.total > 0 && viewMode === 'grid' ? (
        <div className="space-y-4">
          {/* Grid Toolbar with Search and Actions matching table toolbar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full lg:mr-1 lg:max-w-xl lg:flex-1">
              <div className="relative w-full">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]"
                  aria-hidden
                />
                <input
                  type="search"
                  placeholder="Search team by name, email, or phone…"
                  value={displayParams.search}
                  onChange={(e) => setParams({ search: e.target.value, page: 1 })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 py-0 pl-10 pr-4 text-[13px] text-slate-900 placeholder:text-slate-400 transition-all focus-visible:border-amber-500 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <span className="mr-auto text-[11px] font-medium text-slate-500 lg:mr-1">
                {totalItems} {totalItems === 1 ? 'record' : 'records'}
              </span>
              {canManageStaff && (
                <PrimaryButton
                  key="add-staff-grid"
                  title="Add team member"
                  size="sm"
                  fullWidth={false}
                  icon={<Plus className="h-3.5 w-3.5" />}
                  className="h-9 rounded-xl px-3.5 text-xs font-semibold shadow-none"
                  onClick={() => setIsAddOpen(true)}
                />
              )}
            </div>
          </div>

          {paginatedEmployees.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedEmployees.map((member) => (
                <MerchantStaffCard
                  key={member.id}
                  member={member}
                  shifts={employeeShifts.filter((es) => es.user_id === member.id)}
                  onCopyId={handleCopyId}
                  isCopied={copiedId === member.id}
                  onEdit={canManageStaff ? (m) => setEditingEmployee(m) : undefined}
                  onDelete={
                    canManageStaff && member.role !== 'org_owner'
                      ? (m) => setDeleting(m)
                      : undefined
                  }
                  onManageShifts={
                    canManageStaff
                      ? (m) => {
                          setSelectedStaffForShift(m.id)
                          setIsShiftsOpen(true)
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-xs">
              <Filter className="mb-2 h-8 w-8 text-slate-300" />
              <h3 className="font-semibold text-sm text-slate-800">No matching team members</h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                No employees match your filter
                {settledSearch ? ` “${settledSearch}”` : ''}. Try clearing filters or searching
                another keyword.
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
          )}

          {paginatedEmployees.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              setCurrentPage={(page) => setParam('page', page)}
              onPageSizeChange={(size) => setParams({ limit: size, page: 1 })}
              pageSizeOptions={[6, 9, 15, 30]}
            />
          )}
        </div>
      ) : null}

      {/* Table / Roster View: uses BasicDataGridTable's dedicated search section and action column */}
      {!isLoading && !isError && stats.total > 0 && viewMode === 'table' ? (
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
          showSearch={true}
          searchPlaceholder="Search team by name, email, or phone…"
          initialSearchValue={displayParams.search}
          onSearch={(search) => setParams({ search, page: 1 })}
          showItemsPerPage={true}
          showColumnSelector={true}
          showActions={true}
          onEdit={(member) => setEditingEmployee(member)}
          onDelete={(member) => {
            if (member.role === 'org_owner') {
              toast.error('The organization owner cannot be removed', toastColor.error)
              return
            }
            setDeleting(member)
          }}
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
