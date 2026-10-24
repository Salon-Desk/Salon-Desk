import { Star } from 'lucide-react'
import React from 'react'

import { StatusBadge } from '@/components/badge'
import type { ClientFeedbackItem } from '@/types/api-feedback'
import type { ColumnDefinition } from '@/types/table'

export function getReviewTableColumns(): ColumnDefinition<ClientFeedbackItem>[] {
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
  ]
}
