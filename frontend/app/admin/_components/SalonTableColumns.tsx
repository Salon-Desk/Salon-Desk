import { CheckCircle2, Copy, Eye, PauseCircle, Sparkles } from 'lucide-react'

import { StatusBadge } from '@/components/badge/StatusBadge'
import PrimaryButton from '@/components/ui/primary-button'
import type { ApiOrganization } from '@/types/api-org'
import type { ColumnDefinition } from '@/types/table'

import { formatRegistrationDate } from '../_utils'
import { SalonAvatar } from './SalonAvatar'

interface SalonTableColumnsProps {
  onApprove: (org: ApiOrganization) => void
  onSuspend: (org: ApiOrganization) => void
  onViewDetail: (org: ApiOrganization) => void
  onCopy: (text: string, label: string) => void
  copiedKey: string | null
  actioningOrgId: string | null
  approving: boolean
  suspending: boolean
}

export function getSalonTableColumns({
  onApprove,
  onSuspend,
  onViewDetail,
  onCopy,
  copiedKey,
  actioningOrgId,
  approving,
  suspending,
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
    {
      id: 'actions',
      header: 'Actions',
      cell: (org) => {
        const isActioning = actioningOrgId === org.id
        const isApproved = org.status === 'approved'

        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onViewDetail(org)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
              title="View salon details"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>Detail</span>
            </button>
            {!isApproved ? (
              <PrimaryButton
                title={isActioning && approving ? 'Approving…' : 'Approve'}
                size="sm"
                fullWidth={false}
                icon={<Sparkles className="h-3.5 w-3.5" />}
                className="h-8 rounded-lg px-3 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
                isLoading={isActioning && approving}
                isDisabled={isActioning}
                onClick={() => onApprove(org)}
              />
            ) : (
              <PrimaryButton
                title={isActioning && suspending ? 'Suspending…' : 'Suspend'}
                variant="outline"
                size="sm"
                fullWidth={false}
                icon={<PauseCircle className="h-3.5 w-3.5 text-rose-600" />}
                className="h-8 rounded-lg px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 border-rose-200 transition-all active:scale-[0.98]"
                isLoading={isActioning && suspending}
                isDisabled={isActioning}
                onClick={() => onSuspend(org)}
              />
            )}
          </div>
        )
      },
    },
  ]
}
