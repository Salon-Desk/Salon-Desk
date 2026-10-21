import { CheckCircle2, Copy, Edit2, Trash2, UserRound } from 'lucide-react'

import { StatusBadge } from '@/components/badge/StatusBadge'
import { IconButton } from '@/components/ui'
import {
  staffAvatarGradient,
  staffDisplayName,
  staffInitials,
  staffPhone,
  staffPicture,
} from '@/lib/util/staff-display'
import type { ColumnDefinition } from '@/types/table'
import type { User } from '@/types/user'

interface StaffTableColumnsProps {
  onCopyId: (id: string) => void
  copiedId: string | null
  onEdit: (member: User) => void
  onDelete: (member: User) => void
}

export function getStaffTableColumns({
  onCopyId,
  copiedId,
  onEdit,
  onDelete,
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
    {
      id: 'actions',
      header: 'Actions',
      cell: (member) => {
        const isOwner = member.role === 'org_owner'
        return (
          <div className="flex items-center justify-end gap-1.5">
            <IconButton
              aria-label="Edit team member"
              onClick={() => onEdit(member)}
              className="h-8 w-8 rounded-lg border border-slate-200/80 bg-white text-slate-600 shadow-2xs transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 active:scale-95"
              title="Edit details"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </IconButton>

            {!isOwner ? (
              <IconButton
                aria-label="Remove team member"
                onClick={() => onDelete(member)}
                className="h-8 w-8 rounded-lg border border-slate-200/80 bg-white text-rose-600 shadow-2xs transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 active:scale-95"
                title="Remove member"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            ) : (
              <span className="w-8" />
            )}
          </div>
        )
      },
    },
  ]
}
