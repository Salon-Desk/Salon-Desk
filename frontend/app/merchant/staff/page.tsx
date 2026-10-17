'use client'

import { CheckCircle2, Copy, Loader2, Plus, Trash2, UserRound, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Badge, Card, ConfirmDialog, EmptyState, IconButton } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import {
  staffAvatarGradient,
  staffDisplayName,
  staffInitials,
  staffPicture,
} from '@/lib/util/staff-display'
import { useDeleteMyEmployeeMutation, useGetMyEmployeesQuery } from '@/store/slice/organizationApi'
import type { User } from '@/types/user'

import { EmployeeFormModal } from '../_components/employee-form-modal'

export default function MerchantStaffPage() {
  const { data: employees = [], isLoading, isError, refetch } = useGetMyEmployeesQuery()
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteMyEmployeeMutation()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Stylists &amp; Staff Directory
          </h1>
          <p className="text-slate-500 text-xs">
            {isLoading
              ? 'Loading…'
              : `${employees.length} team members managing schedule and appointment fulfillment`}
          </p>
        </div>

        <PrimaryButton
          title="Add team member"
          size="sm"
          fullWidth={false}
          icon={<Plus className="h-4 w-4" />}
          className="h-9 rounded-lg px-4 text-xs font-semibold shadow-xs"
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
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <p>Could not load employees. Sign in as an org owner and try again.</p>
          <PrimaryButton
            title="Retry"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="mt-3 h-8.5 rounded-lg px-4"
            onClick={() => void refetch()}
          />
        </div>
      ) : null}

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
              icon={<Plus className="h-3.5 w-3.5" />}
              className="h-8.5 rounded-lg px-4 text-xs"
              onClick={() => setIsAddOpen(true)}
            />
          }
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((member) => {
          const name = staffDisplayName(member)
          const initials = staffInitials(name)
          const gradient = staffAvatarGradient(member.id || name)
          const picture = staffPicture(member)
          const roleTone =
            member.role === 'org_owner' ? 'amber' : member.role === 'reception' ? 'sky' : 'emerald'

          return (
            <Card
              key={member.id}
              className="flex flex-col justify-between space-y-4 rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  {picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={picture}
                      alt={name}
                      className="h-11 w-11 rounded-xl border border-slate-200 object-cover shadow-xs"
                    />
                  ) : (
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-sm font-bold text-white shadow-xs`}
                    >
                      {initials || <UserRound className="h-5 w-5" />}
                    </div>
                  )}
                  <Badge tone="emerald" size="sm">
                    {member.status || 'Active'}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 tracking-tight">{name}</h3>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge tone={roleTone} size="sm">
                      {member.role.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 font-mono truncate">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <span>ID: {member.id.slice(0, 8)}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyId(member.id)}
                    className="p-0.5 hover:text-slate-700 transition-colors"
                    title="Copy user ID"
                  >
                    {copiedId === member.id ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <IconButton
                  aria-label="Remove team member"
                  onClick={() => setDeleting(member)}
                  className="rounded-lg text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            </Card>
          )
        })}
      </div>

      <EmployeeFormModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {deleting ? (
        <ConfirmDialog
          title="Remove team member?"
          description={`Are you sure you want to remove ${staffDisplayName(deleting)} (${deleting.email}) from your salon roster?`}
          confirmLabel={isDeleting ? 'Removing…' : 'Remove Team Member'}
          onConfirm={() => void handleConfirmDelete()}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </div>
  )
}
