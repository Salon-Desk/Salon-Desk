import { Shield } from 'lucide-react'
import type React from 'react'

import { StatusBadge } from '@/components/badge'
import type { ColumnDefinition } from '@/types/table'
import type { User } from '@/types/user'

export function getAdminStaffColumns(currentUserId?: string): ColumnDefinition<User>[] {
  return [
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
        const isSelf = Boolean(currentUserId && member.id === currentUserId)

        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 font-bold text-xs text-amber-800 ring-1 ring-amber-500/20">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-xs truncate max-w-[180px]">
                  {fullName}
                </span>
                {isSelf && (
                  <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-500/20">
                    You
                  </span>
                )}
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
  ]
}
