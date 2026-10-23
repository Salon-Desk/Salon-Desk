'use client'

import { Plus, RefreshCw, Shield, ShieldCheck, Sparkles, Users } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/badge'
import { StatCard } from '@/components/card'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { EmptyState } from '@/components/ui'
import PrimaryButton from '@/components/ui/primary-button'
import { AdminQueryState } from '@/components/ui/query-state-view'
import { toastColor } from '@/constant/toast-color'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useListingParams } from '@/hooks/useListingParams'
import {
  type AdminStaffListParams,
  AdminStaffListParamsSchema,
} from '@/lib/listing-params/admin-staff-list-params'
import { useDeleteAdminStaffMutation, useGetAdminStaffQuery } from '@/store/api/platformApi'
import type { ColumnDefinition } from '@/types/table'
import type { User } from '@/types/user'

import { AdminStaffFormModal } from './AdminStaffFormModal'

export function AdminStaffView() {
  const { skipAdminApi } = useAdminSession()
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

  const [isOpen, setIsOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  const handleDeactivate = async (member: User) => {
    if (member.role === 'platform_admin') {
      toast.error('Platform administrators cannot be removed', toastColor.error)
      return
    }
    if (member.status?.toUpperCase() === 'INACTIVE') {
      toast.info('Staff account is already inactive', toastColor.info)
      return
    }
    if (!window.confirm(`Deactivate access for ${member.email}?`)) return
    try {
      await deleteStaff(member.id).unwrap()
      toast.success(`Platform account for ${member.email} deactivated`, toastColor.success)
      void refetch()
    } catch (err) {
      const message = (err as { data?: { detail?: string } })?.data?.detail || 'Deactivation failed'
      toast.error(String(message), toastColor.error)
    }
  }

  const columns = useMemo<ColumnDefinition<User>[]>(
    () => [
      {
        id: 'member',
        header: 'Staff Member',
        cell: (member) => {
          const fullName =
            [member.profile?.first_name, member.profile?.last_name].filter(Boolean).join(' ') ||
            'Platform Administrator'
          const initials = fullName
            .split(' ')
            .map((p) => p.charAt(0))
            .join('')
            .slice(0, 2)
            .toUpperCase()

          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 font-bold text-xs text-amber-800 ring-1 ring-amber-500/20">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-xs truncate max-w-[200px]">
                  {fullName}
                </div>
                <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                  {member.email}
                </div>
              </div>
            </div>
          )
        },
      },
      {
        id: 'role',
        header: 'Platform Role',
        cell: (member) => {
          const isSuper = member.role === 'platform_admin'
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                isSuper
                  ? 'border border-amber-300/80 bg-amber-50 text-amber-900 shadow-2xs'
                  : 'border border-sky-300/80 bg-sky-50 text-sky-900'
              }`}
            >
              <Shield className={`h-3 w-3 ${isSuper ? 'text-amber-600' : 'text-sky-600'}`} />
              <span>{isSuper ? 'Super Admin' : 'Support Agent'}</span>
            </span>
          )
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: (member) => {
          const isActive = member.status?.toUpperCase() === 'ACTIVE'
          return (
            <StatusBadge tone={isActive ? 'emerald' : 'slate'} size="sm" dot>
              {member.status}
            </StatusBadge>
          )
        },
      },
      {
        id: 'phone',
        header: 'Contact',
        cell: (member) => (
          <span className="font-mono text-xs text-slate-600">{member.profile?.phone || '—'}</span>
        ),
      },
      {
        id: 'created',
        header: 'Joined',
        cell: (member) => (
          <span className="font-mono text-xs text-slate-500">
            {member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12 animate-in fade-in duration-300">
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
              <span>Platform Administration · Team &amp; Access Control</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-extrabold text-slate-900 text-2xl tracking-tight sm:text-3xl">
                Platform Administrators &amp; Staff
              </h1>
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-2xs">
                {stats.total} Members
              </span>
            </div>

            <p className="max-w-2xl text-xs text-slate-600 sm:text-sm leading-relaxed">
              Manage internal platform operators, grant support permissions, and onboard new staff
              accounts with scoped administrator access.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-xs backdrop-blur-sm">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-700 text-xs shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.94] disabled:opacity-50"
              title="Refresh staff list"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`}
              />
              <span>Sync</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5 text-amber-400" />
              <span>Invite Staff</span>
            </button>
          </div>
        </div>
      </div>

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
            onDelete={(member) => void handleDeactivate(member)}
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
    </div>
  )
}
