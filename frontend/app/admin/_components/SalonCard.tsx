'use client'

import { Calendar, CheckCircle2, Copy, Eye, PauseCircle, Sparkles } from 'lucide-react'

import { PrimaryButton } from '@/components/button'
import { Badge, Card } from '@/components/ui'
import type { ApiOrganization } from '@/types/api-org'

import { formatRegistrationDate } from '../_utils'
import { SalonAvatar } from './SalonAvatar'

interface SalonCardProps {
  org: ApiOrganization
  isActioning: boolean
  approving: boolean
  suspending: boolean
  copiedKey: string | null
  canManage?: boolean
  onApprove: (org: ApiOrganization) => void
  onSuspend: (org: ApiOrganization) => void
  onViewDetail: (org: ApiOrganization) => void
  onCopy: (text: string, label: string) => void
}

export function SalonCard({
  org,
  isActioning,
  approving,
  suspending,
  copiedKey,
  canManage = true,
  onApprove,
  onSuspend,
  onViewDetail,
  onCopy,
}: SalonCardProps) {
  const isApproved = org.status === 'approved'
  const isPending = org.status === 'pending'
  const isSuspended = org.status === 'suspended'
  const statusTone = isApproved ? 'emerald' : isPending ? 'amber' : 'rose'

  return (
    <Card className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all hover:border-slate-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <SalonAvatar name={org.name} picture={org.picture} />

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-base text-slate-900 tracking-tight group-hover:text-amber-700 transition-colors truncate max-w-sm sm:max-w-md">
              {org.name}
            </h3>
            <Badge tone={statusTone} size="sm" dot pulsing={isPending}>
              {org.status}
            </Badge>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              <Sparkles className="h-2.5 w-2.5 text-amber-600" />
              Zero-Debit Holds
            </span>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed max-w-2xl">
            {org.description ||
              'Modern multi-tenant boutique salon operating with PayPal zero-debit authorization holds and integrated booking management.'}
          </p>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1 text-[11px] text-slate-500">
            {/* Registered Date */}
            <div className="inline-flex items-center gap-1 text-slate-500 font-medium">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span>Registered {formatRegistrationDate(org.created_at)}</span>
            </div>

            <span className="text-slate-300">·</span>

            {/* Interactive UUID copy chip */}
            <button
              type="button"
              onClick={() => onCopy(org.id, 'Salon UUID')}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer shadow-2xs"
              title="Copy full Salon UUID"
            >
              <span>UUID: {org.id.slice(0, 8)}…</span>
              {copiedKey === org.id ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3 text-slate-400" />
              )}
            </button>

            {org.owner_id && (
              <>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => onCopy(org.owner_id!, 'Owner UUID')}
                  className="inline-flex items-center gap-1 font-mono text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                  title="Copy Owner UUID"
                >
                  <span>Owner: {org.owner_id.slice(0, 8)}…</span>
                  {copiedKey === org.owner_id ? (
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-2.5 w-2.5 text-slate-400" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
        <button
          type="button"
          onClick={() => onViewDetail(org)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
          title="View salon details"
        >
          <Eye className="h-3.5 w-3.5 text-slate-500" />
          <span>Detail</span>
        </button>
        {canManage && !isApproved && (
          <PrimaryButton
            title={isActioning && approving ? 'Approving…' : 'Approve Salon'}
            size="sm"
            fullWidth={false}
            isLoading={isActioning && approving}
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            className="h-9 rounded-xl px-4 text-xs font-semibold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white border-transparent transition-all active:scale-[0.98]"
            onClick={() => onApprove(org)}
          />
        )}
        {canManage && !isSuspended && (
          <PrimaryButton
            title={isActioning && suspending ? 'Suspending…' : 'Suspend'}
            variant="destructive"
            size="sm"
            fullWidth={false}
            isLoading={isActioning && suspending}
            icon={<PauseCircle className="h-3.5 w-3.5" />}
            className="h-9 rounded-xl px-4 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
            onClick={() => onSuspend(org)}
          />
        )}
      </div>
    </Card>
  )
}
