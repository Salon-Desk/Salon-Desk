import { CheckCircle2, Copy } from 'lucide-react'

import { StatusBadge } from '@/components/badge/StatusBadge'
import type { ApiOrganization } from '@/types/api-org'
import type { ColumnDefinition } from '@/types/table'

import { formatRegistrationDate } from '../_utils'
import { SalonAvatar } from './SalonAvatar'

interface SalonTableColumnsProps {
  onCopy: (text: string, label: string) => void
  copiedKey: string | null
}

export function getSalonTableColumns({
  onCopy,
  copiedKey,
}: SalonTableColumnsProps): ColumnDefinition<ApiOrganization>[] {
  return [
    {
      id: 'salon',
      header: 'Salon Organization',
      cell: (org) => (
        <div className="flex items-center gap-3">
          <SalonAvatar name={org.name} picture={org.picture} className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-xs truncate max-w-[200px]">
              {org.name}
            </div>
            {org.description ? (
              <div className="line-clamp-1 text-[11px] text-slate-500 max-w-[200px]">
                {org.description}
              </div>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (org) => {
        const isApproved = org.status === 'approved'
        const isPending = org.status === 'pending'
        const tone = isApproved ? 'emerald' : isPending ? 'amber' : 'rose'

        return (
          <StatusBadge tone={tone} size="sm" dot>
            {org.status}
          </StatusBadge>
        )
      },
    },
    {
      id: 'registered',
      header: 'Registered',
      cell: (org) => (
        <span className="font-mono text-xs text-slate-600">
          {formatRegistrationDate(org.created_at)}
        </span>
      ),
    },
    {
      id: 'orgId',
      header: 'Org ID',
      cell: (org) => {
        const isCopied = copiedKey === org.id
        return (
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
            <span>{org.id.slice(0, 8)}</span>
            <button
              type="button"
              onClick={() => onCopy(org.id, 'Organization ID')}
              className="p-1 hover:text-slate-700 transition-colors rounded-md hover:bg-slate-100 cursor-pointer"
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
