'use client'

import { Loader2, Plus, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Card, ConfirmDialog, IconButton } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { useDeleteMyEmployeeMutation, useGetMyEmployeesQuery } from '@/store/slice/organizationApi'
import type { User } from '@/types/user'

import { EmployeeFormModal } from '../_components/employee-form-modal'

function displayName(user: User): string {
  const first = user.profile?.first_name || user.first_name
  const last = user.profile?.last_name || user.last_name
  if (first || last) return [first, last].filter(Boolean).join(' ')
  return user.email
}

export default function MerchantStaffPage() {
  const { data: employees = [], isLoading, isError, refetch } = useGetMyEmployeesQuery()
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteMyEmployeeMutation()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [deleting, setDeleting] = useState<User | null>(null)

  const handleConfirmDelete = async () => {
    if (!deleting) return
    try {
      await deleteEmployee(deleting.id).unwrap()
      toast.success('Team member removed', toastColor.success)
      setDeleting(null)
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not remove employee'
      toast.error(String(message), toastColor.error)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Staff &amp; Stylists
          </h1>
          <p className="text-slate-500 text-xs">
            {isLoading ? 'Loading…' : `${employees.length} team members from your organization`}
          </p>
        </div>

        <PrimaryButton
          title="Add team member"
          size="sm"
          fullWidth={false}
          icon={<Plus className="h-4 w-4" />}
          className="h-9 rounded-xl px-3.5 text-xs shadow-xs"
          onClick={() => setIsAddOpen(true)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading staff…
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          <p>Could not load employees. Sign in as an org owner and try again.</p>
          <PrimaryButton
            title="Retry"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="mt-3 h-9 rounded-xl px-4"
            onClick={() => void refetch()}
          />
        </div>
      ) : null}

      {!isLoading && !isError && employees.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <UserRound className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">No team members yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Add a stylist or reception account to get started.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((member) => (
          <Card
            key={member.id}
            hoverTone="amber"
            className="flex flex-col justify-between space-y-4 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                  <UserRound className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-medium text-[11px] text-emerald-800 capitalize">
                  {member.status || 'active'}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">{displayName(member)}</h3>
                <p className="text-xs font-medium text-amber-800 capitalize">
                  {member.role.replace('_', ' ')}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">{member.email}</p>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-3">
              <IconButton
                aria-label="Remove team member"
                onClick={() => setDeleting(member)}
                className="text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          </Card>
        ))}
      </div>

      <EmployeeFormModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {deleting ? (
        <ConfirmDialog
          title="Remove team member?"
          description={`Remove ${displayName(deleting)} (${deleting.email}) from your salon?`}
          confirmLabel={isDeleting ? 'Removing…' : 'Remove'}
          onConfirm={() => void handleConfirmDelete()}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </div>
  )
}
