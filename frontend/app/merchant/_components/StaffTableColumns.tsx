import { CheckCircle2, Clock, Copy, UserRound } from 'lucide-react'

import { StatusBadge } from '@/components/badge/StatusBadge'
import {
  staffAvatarGradient,
  staffDisplayName,
  staffInitials,
  staffPhone,
  staffPicture,
} from '@/lib/util/staff-display'
import type { ApiOrgEmployeeShift } from '@/types/api-org'
import type { ColumnDefinition } from '@/types/table'
import type { User } from '@/types/user'

interface StaffTableColumnsProps {
  onCopyId: (id: string) => void
  copiedId: string | null
  employeeShifts?: ApiOrgEmployeeShift[]
  onManageShifts?: (member: User) => void
}

export function getStaffTableColumns({
  onCopyId,
  copiedId,
  employeeShifts = [],
  onManageShifts,
}: StaffTableColumnsProps): ColumnDefinition<User>[] {
  return [
    {
      id: 'member',
      header: 'Team Member',
      cell: (member) => {
        const name = staffDisplayName(member)
        const initials = staffInitials(name)
        const gradient = staffAvatarGradient(member.id || name)
        const picture = staffPicture(member)

        return (
          <div className="flex items-center gap-3">
            {picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={picture}
                alt={name}
                className="h-9 w-9 rounded-xl border border-slate-200 object-cover shadow-2xs"
              />
            ) : (
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-xs font-bold text-white shadow-2xs`}
              >
                {initials || <UserRound className="h-4 w-4" />}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-xs truncate">{name}</div>
              <a
                href={`mailto:${member.email}`}
                className="block truncate font-mono text-[11px] text-slate-500 transition-colors hover:text-amber-700 hover:underline"
                title="Send email"
              >
                {member.email}
              </a>
            </div>
          </div>
        )
      },
    },
    {
      id: 'role',
      header: 'Role',
      cell: (member) => {
        const roleTone =
          member.role === 'org_owner' ? 'amber' : member.role === 'reception' ? 'sky' : 'emerald'
        const roleLabel =
          member.role === 'org_owner'
            ? 'Owner'
            : member.role === 'reception'
              ? 'Receptionist'
              : 'Stylist'

        return (
          <StatusBadge tone={roleTone} size="sm">
            {roleLabel}
          </StatusBadge>
        )
      },
    },
    {
      id: 'phone',
      header: 'Contact',
      cell: (member) => {
        const phone = staffPhone(member)
        return phone ? (
          <a
            href={`tel:${phone}`}
            className="font-mono text-xs text-slate-700 transition-colors hover:text-amber-700 hover:underline"
            title="Call phone"
          >
            {phone}
          </a>
        ) : (
          <span className="italic text-[11px] text-slate-400">—</span>
        )
      },
    },
    {
      id: 'shifts',
      header: 'Schedule / Shifts',
      cell: (member) => {
        const memberShifts = employeeShifts.filter((es) => es.user_id === member.id)

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {memberShifts.length > 0 ? (
              memberShifts.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 rounded-md border border-amber-200/90 bg-amber-50/80 px-2 py-0.5 text-[10.5px] font-semibold text-amber-900 shadow-2xs"
                >
                  <Clock className="h-2.5 w-2.5 text-amber-600" />
                  <span>{s.shift_name || 'Shift'}</span>
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400 italic">Default hours</span>
            )}
            {onManageShifts && (
              <button
                type="button"
                onClick={() => onManageShifts(member)}
                className="cursor-pointer text-[10px] font-semibold text-amber-700 hover:text-amber-900 hover:underline ml-1"
                title="Manage shifts"
              >
                Edit
              </button>
            )}
          </div>
        )
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: (member) => {
        const isActive = (member.status || 'active').toLowerCase() === 'active'
        return (
          <StatusBadge tone={isActive ? 'emerald' : 'slate'} size="sm" dot>
            {member.status || 'Active'}
          </StatusBadge>
        )
      },
    },
    {
      id: 'staffId',
      header: 'Staff ID',
      cell: (member) => {
        const isCopied = copiedId === member.id
        return (
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
            <span>{member.id.slice(0, 8)}</span>
            <button
              type="button"
              onClick={() => onCopyId(member.id)}
              className="cursor-pointer rounded-md p-1 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95"
              title="Copy ID"
            >
              {isCopied ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        )
      },
    },
  ]
}
