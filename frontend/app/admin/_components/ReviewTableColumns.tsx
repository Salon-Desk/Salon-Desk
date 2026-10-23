import { Check, Eye, Star, X } from 'lucide-react'
import React from 'react'

import { StatusBadge } from '@/components/badge'
import PrimaryButton from '@/components/ui/primary-button'
import type { ClientFeedbackItem } from '@/types/api-feedback'
import type { ColumnDefinition } from '@/types/table'

interface ReviewColumnOptions {
  onViewDetail: (item: ClientFeedbackItem) => void
  onApprove: (item: ClientFeedbackItem) => void
  onReject: (item: ClientFeedbackItem) => void
  isProcessingId: string | null
}

export function getReviewTableColumns({
  onViewDetail,
  onApprove,
  onReject,
  isProcessingId,
}: ReviewColumnOptions): ColumnDefinition<ClientFeedbackItem>[] {
  return [
    {
      id: 'target',
      header: 'Target / Client',
      cell: (item) => {
        const targetLabel = item.stylist_id
          ? `Stylist · ${item.stylist_name || 'Professional'}`
          : `Salon · ${item.organization_name || 'Organization'}`

        return (
          <div className="space-y-1">
            <div className="font-semibold text-slate-900 text-sm">{targetLabel}</div>
            <div className="text-slate-500 text-xs">
              {item.client_name || 'Client'} · {item.service_name || 'Service'} ·{' '}
              {new Date(item.created_at).toLocaleDateString()}
            </div>
          </div>
        )
      },
    },
    {
      id: 'rating',
      header: 'Rating',
      cell: (item) => (
        <div className="flex items-center gap-1 text-amber-600">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={
                  i < item.rating
                    ? 'h-3.5 w-3.5 fill-amber-400 text-amber-400'
                    : 'h-3.5 w-3.5 text-slate-200'
                }
              />
            ))}
          </div>
          <span className="ml-1 font-semibold text-slate-700 text-xs">{item.rating}/5</span>
        </div>
      ),
    },
    {
      id: 'comment',
      header: 'Feedback / Comment',
      cell: (item) => (
        <div className="max-w-md">
          {item.comment ? (
            <p className="line-clamp-2 text-slate-700 text-xs leading-relaxed">{item.comment}</p>
          ) : (
            <span className="italic text-slate-400 text-xs">No comment provided.</span>
          )}
          {item.moderation_notes && (
            <p className="mt-1 text-[11px] text-slate-400">Note: {item.moderation_notes}</p>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (item) => {
        const tone =
          item.status === 'approved' ? 'emerald' : item.status === 'rejected' ? 'rose' : 'amber'
        return (
          <StatusBadge tone={tone} size="sm">
            {item.status ?? 'pending'}
          </StatusBadge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Moderation',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (item) => {
        const isBusy = isProcessingId === item.id
        const isPending = item.status === 'pending'

        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onViewDetail(item)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
              title="View full review"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>Detail</span>
            </button>
            {isPending ? (
              <>
                <PrimaryButton
                  title="Approve"
                  variant="success"
                  size="sm"
                  fullWidth={false}
                  icon={<Check className="h-3 w-3" />}
                  className="h-8 rounded-lg px-2.5 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
                  isLoading={isBusy}
                  isDisabled={isBusy}
                  onClick={() => onApprove(item)}
                />
                <PrimaryButton
                  title="Reject"
                  variant="danger"
                  size="sm"
                  fullWidth={false}
                  icon={<X className="h-3 w-3" />}
                  className="h-8 rounded-lg px-2.5 text-xs font-semibold transition-all active:scale-[0.98]"
                  isLoading={isBusy}
                  isDisabled={isBusy}
                  onClick={() => onReject(item)}
                />
              </>
            ) : (
              <span className="font-mono text-[11px] text-slate-400 pl-1">Resolved</span>
            )}
          </div>
        )
      },
    },
  ]
}
