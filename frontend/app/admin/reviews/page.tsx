'use client'

import { MessageSquareQuote, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Pagination } from '@/components/table/Pagination'
import { Badge, Button, Card, EmptyState, SearchInput } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useListingParams } from '@/hooks/useListingParams'
import {
  type AdminReviewsListParams,
  AdminReviewsListParamsSchema,
} from '@/lib/listing-params/admin-reviews-list-params'
import {
  useApproveAdminClientFeedbackMutation,
  useGetAdminClientFeedbackQuery,
  useRejectAdminClientFeedbackMutation,
} from '@/store/api/platformApi'
import type { ClientFeedbackItem } from '@/types/api-feedback'

import { AdminQueryState } from '../_components/admin-query-state'

const FILTER_LABELS: Record<AdminReviewsListParams['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  all: 'All',
}

function ReviewModerationCard({ item }: { item: ClientFeedbackItem }) {
  const [notes, setNotes] = useState('')
  const [approve, { isLoading: approving }] = useApproveAdminClientFeedbackMutation()
  const [reject, { isLoading: rejecting }] = useRejectAdminClientFeedbackMutation()

  const targetLabel = item.stylist_id
    ? `Stylist · ${item.stylist_name || 'Professional'}`
    : `Salon · ${item.organization_name || 'Organization'}`

  const run = async (action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await approve({ feedbackId: item.id, moderation_notes: notes || null }).unwrap()
        toast.success('Review approved and published', toastColor.success)
      } else {
        await reject({ feedbackId: item.id, moderation_notes: notes || null }).unwrap()
        toast.success('Review rejected', toastColor.success)
      }
    } catch (err) {
      const message = (err as { data?: { detail?: string } })?.data?.detail || 'Moderation failed'
      toast.error(String(message), toastColor.error)
    }
  }

  return (
    <Card className="space-y-3 border-slate-200/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{targetLabel}</p>
          <p className="text-xs text-slate-500">
            {item.client_name || 'Client'} · {item.service_name || 'Service'} ·{' '}
            {new Date(item.created_at).toLocaleString()}
          </p>
        </div>
        <Badge variant="soft">{item.status ?? 'pending'}</Badge>
      </div>
      <div className="flex items-center gap-1 text-amber-600">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={
              i < item.rating ? 'h-4 w-4 fill-amber-400 text-amber-400' : 'h-4 w-4 text-slate-200'
            }
          />
        ))}
        <span className="ml-1 text-xs font-semibold text-slate-700">{item.rating}/5</span>
      </div>
      {item.comment ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
          {item.comment}
        </p>
      ) : (
        <p className="text-sm italic text-slate-400">No comment provided.</p>
      )}
      {item.status === 'pending' ? (
        <>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Moderation notes (optional)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="success"
              size="sm"
              disabled={approving || rejecting}
              onClick={() => void run('approve')}
            >
              Approve & publish
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={approving || rejecting}
              onClick={() => void run('reject')}
            >
              Reject
            </Button>
          </div>
        </>
      ) : item.moderation_notes ? (
        <p className="text-xs text-slate-500">Moderator note: {item.moderation_notes}</p>
      ) : null}
    </Card>
  )
}

export default function AdminReviewsPage() {
  const { skipAdminApi } = useAdminSession()
  const { params, displayParams, setParam, setParams } = useListingParams<
    AdminReviewsListParams,
    typeof AdminReviewsListParamsSchema
  >(AdminReviewsListParamsSchema)

  const { data, isLoading, isError, refetch } = useGetAdminClientFeedbackQuery(params, {
    skip: skipAdminApi,
  })

  const settledSearch = typeof params.q === 'string' ? params.q : ''
  const pageSize = displayParams.limit
  const page = displayParams.page

  const items = useMemo(() => {
    const rows = data?.items ?? []
    if (!settledSearch.trim()) return rows
    const term = settledSearch.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (r.comment && r.comment.toLowerCase().includes(term)) ||
        (r.client_name && r.client_name.toLowerCase().includes(term)) ||
        (r.organization_name && r.organization_name.toLowerCase().includes(term)) ||
        (r.stylist_name && r.stylist_name.toLowerCase().includes(term)),
    )
  }, [data?.items, settledSearch])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-slate-950">Client review moderation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Approve or reject salon and stylist feedback before it appears on the public catalog.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FILTER_LABELS) as AdminReviewsListParams['status'][]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setParams({ status: key, page: 1 })}
              className={
                displayParams.status === key
                  ? 'rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white'
                  : 'rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600'
              }
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>
        <SearchInput
          value={displayParams.search}
          onChange={(val) => setParams({ search: val, page: 1 })}
          placeholder="Search reviews…"
        />
      </div>

      <AdminQueryState isLoading={isLoading} isError={isError} onRetry={() => void refetch()}>
        {items.length === 0 ? (
          <EmptyState
            icon={MessageSquareQuote}
            title="No reviews in this queue"
            description="Client submissions appear here after completed appointments."
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <ReviewModerationCard key={item.id} item={item} />
            ))}
          </div>
        )}
        {data && data.total > pageSize ? (
          <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={data.total}
            totalPages={Math.max(1, Math.ceil(data.total / pageSize))}
            onPageChange={(next) => setParam('page', next)}
          />
        ) : null}
      </AdminQueryState>
    </div>
  )
}
