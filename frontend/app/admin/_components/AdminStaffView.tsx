'use client'

import { KeyRound, Mail, Plus, Shield, ShieldCheck, Trash2, Users } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PrimaryButton } from '@/components/button'
import { StatCard } from '@/components/card'
import { DeleteConfirmationDialog } from '@/components/dialog'
import { EmptyState } from '@/components/empty/EmptyState'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { PageHeader } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { AdminQueryState } from '@/components/ui/query-state-view'
import { toastColor } from '@/constant/toast-color'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useListingParams } from '@/hooks/useListingParams'
import {
  type AdminStaffListParams,
  AdminStaffListParamsSchema,
} from '@/lib/listing-params/admin-staff-list-params'
import {
  useDeleteAdminStaffMutation,
  useGetAdminStaffQuery,
  useResendAdminStaffInviteMutation,
  useResetAdminStaffPasswordMutation,
} from '@/store/api/platformApi'
import type { User } from '@/types/user'

import { getAdminStaffColumns } from './AdminStaffColumns'
import { AdminStaffFormModal } from './AdminStaffFormModal'
import { StaffActionConfirmDialog } from './StaffActionConfirmDialog'

export function AdminStaffView() {
  const { user, skipAdminApi } = useAdminSession()
  const { params, displayParams, setParam, setParams } = useListingParams<
    AdminStaffListParams,
    typeof AdminStaffListParamsSchema
  >(AdminStaffListParamsSchema)

  const {
    data: staffList,
    isLoading,
    isError,
    refetch,
  } = useGetAdminStaffQuery(params, { skip: skipAdminApi })
  const { data: allStaffData } = useGetAdminStaffQuery(undefined, { skip: skipAdminApi })
  const [deleteStaff] = useDeleteAdminStaffMutation()
  const [resendInvite] = useResendAdminStaffInviteMutation()
  const [resetPassword] = useResetAdminStaffPasswordMutation()

  const [isOpen, setIsOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [memberToDeactivate, setMemberToDeactivate] = useState<User | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const [staffActionTarget, setStaffActionTarget] = useState<User | null>(null)
  const [staffActionType, setStaffActionType] = useState<'resend_invite' | 'reset_password'>(
    'resend_invite',
  )
  const [isActionLoading, setIsActionLoading] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Staff directory updated', toastColor.info)
    } finally {
      setIsRefreshing(false)
    }
  }

  const staff = useMemo(() => staffList ?? [], [staffList])
  const allStaff = useMemo(() => allStaffData ?? staffList ?? [], [allStaffData, staffList])

  const stats = useMemo(() => {
    let admins = 0
    let support = 0
    let active = 0

    allStaff.forEach((s) => {
      if (s.role === 'platform_admin') admins += 1
      if (s.role === 'platform_staff') support += 1
      if (s.status === 'ACTIVE' || s.status === 'active') active += 1
    })

    return { total: allStaff.length, admins, support, active }
  }, [allStaff])

  const filteredStaff = useMemo(() => {
    let result = staff

    if (displayParams.role !== 'all') {
      result = result.filter((s) => s.role === displayParams.role)
    }

    if (displayParams.search.trim()) {
      const q = displayParams.search.trim().toLowerCase()
      result = result.filter((s) => {
        const name = `${s.profile?.first_name || ''} ${s.profile?.last_name || ''}`.toLowerCase()
        const email = (s.email || '').toLowerCase()
        return name.includes(q) || email.includes(q)
      })
    }

    return result
  }, [staff, displayParams.role, displayParams.search])

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / displayParams.limit))
  const paginatedStaff = useMemo(() => {
    const start = (displayParams.page - 1) * displayParams.limit
    return filteredStaff.slice(start, start + displayParams.limit)
  }, [filteredStaff, displayParams.page, displayParams.limit])

  const handleInitiateDeactivate = (member: User) => {
    if (user?.id && member.id === user.id) {
      toast.error(
        'You cannot delete your own account. Platform admins may only remove other users.',
        toastColor.error,
      )
      return
    }
    if (member.status?.toUpperCase() === 'INACTIVE') {
      toast.info('Staff account is already inactive', toastColor.info)
      return
    }
    setMemberToDeactivate(member)
  }

  const handleConfirmDeactivate = async () => {
    if (!memberToDeactivate) return
    setIsDeactivating(true)
    try {
      await deleteStaff(memberToDeactivate.id).unwrap()
      toast.success(
        `Platform account for ${memberToDeactivate.email} deactivated`,
        toastColor.success,
      )
      setMemberToDeactivate(null)
      void refetch()
    } catch (err) {
      const message = (err as { data?: { detail?: string } })?.data?.detail || 'Deactivation failed'
      toast.error(String(message), toastColor.error)
    } finally {
      setIsDeactivating(false)
    }
  }

  const handleConfirmStaffAction = async () => {
    if (!staffActionTarget) return
    setIsActionLoading(true)
    try {
      if (staffActionType === 'resend_invite') {
        const res = await resendInvite(staffActionTarget.id).unwrap()
        toast.success(
          res.detail || `Invitation resent to ${staffActionTarget.email}`,
          toastColor.success,
        )
      } else {
        const res = await resetPassword(staffActionTarget.id).unwrap()
        toast.success(
          res.detail || `Temporary password emailed to ${staffActionTarget.email}`,
          toastColor.success,
        )
      }
      setStaffActionTarget(null)
    } catch (err) {
      const message = (err as { data?: { detail?: string } })?.data?.detail || 'Operation failed'
      toast.error(String(message), toastColor.error)
    } finally {
      setIsActionLoading(false)
    }
  }

  const columns = useMemo(() => getAdminStaffColumns(user?.id), [user?.id])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <PageHeader
        eyebrow="Platform Administration · Team & Access Control"
        title="Platform Administrators & Staff"
        badge={`${stats.total} Members`}
        description="Manage internal platform operators, grant support permissions, and onboard new staff accounts with scoped administrator access."
        onRefresh={() => void handleRefresh()}
        isRefreshing={isRefreshing}
        refreshTitle="Refresh staff list"
        actions={
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 text-amber-400" />
            <span>Invite Staff</span>
          </button>
        }
      />

      {/* 3 Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Total Internal Staff"
          value={String(stats.total)}
          footnote={`${stats.active} active accounts`}
          icon={Users}
          tone="amber"
          className="hover:border-amber-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Super Administrators"
          value={String(stats.admins)}
          footnote="Full platform permissions"
          icon={ShieldCheck}
          tone="emerald"
          className="hover:border-emerald-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Support Agents"
          value={String(stats.support)}
          footnote="Operational and moderation staff"
          icon={Shield}
          tone="sky"
          className="hover:border-sky-200 hover:shadow-xs transition-all"
        />
      </div>

      {/* Role Filter Tabs */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all' as const, label: 'All Staff', count: stats.total },
            { id: 'platform_admin' as const, label: 'Super Admins', count: stats.admins },
            { id: 'platform_staff' as const, label: 'Support Agents', count: stats.support },
          ].map((tab) => {
            const isActive = displayParams.role === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setParams({ role: tab.id, page: 1 })
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
        <span className="text-xs font-medium text-slate-500">
          Showing <strong className="font-bold text-slate-900">{filteredStaff.length}</strong>{' '}
          {filteredStaff.length === 1 ? 'member' : 'members'}
        </span>
      </div>

      <AdminQueryState isLoading={isLoading} isError={isError} onRetry={() => void refetch()}>
        {staff.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff accounts found"
            description="Invite support agents and super administrators to manage the platform."
            action={
              <PrimaryButton
                title="Invite first member"
                size="sm"
                fullWidth={false}
                icon={<Plus className="h-4 w-4" />}
                className="h-9.5 rounded-xl px-4 text-xs font-bold"
                onClick={() => setIsOpen(true)}
              />
            }
          />
        ) : (
          <BasicDataGridTable
            data={paginatedStaff}
            columns={columns}
            currentPage={displayParams.page}
            totalPages={totalPages}
            totalItems={filteredStaff.length}
            itemsPerPage={displayParams.limit}
            onPageChange={(p) => setParam('page', p)}
            onItemPerPageChange={(size) => {
              setParams({ limit: size, page: 1 })
            }}
            showPagination={filteredStaff.length > 0}
            showSearch={true}
            searchPlaceholder="Search staff by name or email…"
            initialSearchValue={displayParams.search}
            onSearch={(val) => {
              setParams({ search: val, page: 1 })
            }}
            showItemsPerPage={true}
            showColumnSelector={true}
            showActions={true}
            renderRowActions={(member) => {
              const isSelf = Boolean(user?.id && member.id === user.id)
              return (
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:bg-sky-50 hover:text-sky-700 transition-all cursor-pointer"
                    onClick={() => {
                      setStaffActionTarget(member)
                      setStaffActionType('resend_invite')
                    }}
                    title={`Resend invitation to ${member.email}`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span className="sr-only">Resend Invite</span>
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:bg-amber-50 hover:text-amber-700 transition-all cursor-pointer"
                    onClick={() => {
                      setStaffActionTarget(member)
                      setStaffActionType('reset_password')
                    }}
                    title={`Reset password for ${member.email}`}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span className="sr-only">Reset Password</span>
                  </Button>

                  {isSelf ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled
                      className="h-7 w-7 opacity-30 cursor-not-allowed text-slate-400"
                      title="You cannot delete your own account"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Cannot delete own account</span>
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
                      onClick={() => handleInitiateDeactivate(member)}
                      title={`Deactivate ${member.email}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Deactivate</span>
                    </Button>
                  )}
                </div>
              )
            }}
            refetch={() => void handleRefresh()}
            isFetching={isLoading || isRefreshing}
            customButtons={[
              <PrimaryButton
                key="invite-staff"
                title="Invite Staff Member"
                size="sm"
                fullWidth={false}
                icon={<Plus className="h-3.5 w-3.5" />}
                className="h-9 rounded-xl px-4 text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
                onClick={() => setIsOpen(true)}
              />,
            ]}
            tableClassName="border-slate-200/80"
            headerClassName="bg-slate-50/70"
          />
        )}
      </AdminQueryState>

      <AdminStaffFormModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onCreated={() => void refetch()}
      />

      <StaffActionConfirmDialog
        open={Boolean(staffActionTarget)}
        onClose={() => setStaffActionTarget(null)}
        onConfirm={() => void handleConfirmStaffAction()}
        member={staffActionTarget}
        actionType={staffActionType}
        isLoading={isActionLoading}
      />

      <DeleteConfirmationDialog
        open={Boolean(memberToDeactivate)}
        setOpen={(open) => {
          if (!open) setMemberToDeactivate(null)
        }}
        onConfirm={() => void handleConfirmDeactivate()}
        isLoading={isDeactivating}
        title="Deactivate Staff Account"
        description={
          memberToDeactivate
            ? `Are you sure you want to deactivate administrative access for ${memberToDeactivate.email}? They will no longer be able to log in to the admin portal.`
            : 'Are you sure you want to deactivate this account?'
        }
        confirmLabel="Deactivate Access"
        deletingLabel="Deactivating…"
      />
    </div>
  )
}
