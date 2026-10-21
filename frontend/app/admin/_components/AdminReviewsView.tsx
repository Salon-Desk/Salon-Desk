'use client'

import { MessageSquareQuote } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { Card, EmptyState, SearchInput } from '@/components/ui'
import { AdminQueryState } from '@/components/ui/query-state-view'
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

import { getReviewTableColumns } from './ReviewTableColumns'

const FILTER_LABELS: Record<AdminReviewsListParams['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  all: 'All',
}

export function AdminReviewsView() {
  const { skipAdminApi } = useAdminSession()
  const { params, displayParams, setParam, setParams } = useListingParams<
    AdminReviewsListParams,
    typeof AdminReviewsListParamsSchema
  >(AdminReviewsListParamsSchema)

  const { data, isLoading, isError, refetch } = useGetAdminClientFeedbackQuery(params, {
    skip: skipAdminApi,
  })

  const [approve] = useApproveAdminClientFeedbackMutation()
  const [reject] = useRejectAdminClientFeedbackMutation()
  const [processingId, setProcessingId] = useState<string | null>(null)

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

  const totalItems = data?.total ?? items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const handleApprove = async (item: ClientFeedbackItem) => {
    setProcessingId(item.id)
    try {
      await approve({ feedbackId: item.id, moderation_notes: null }).unwrap()
      toast.success('Review approved and published', toastColor.success)
    } catch (err) {
      const message = (err as { data?: { detail?: string } })?.data?.detail || 'Moderation failed'
      toast.error(String(message), toastColor.error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (item: ClientFeedbackItem) => {
    setProcessingId(item.id)
    try {
      await reject({ feedbackId: item.id, moderation_notes: null }).unwrap()
      toast.success('Review rejected', toastColor.success)
    } catch (err) {
      const message = (err as { data?: { detail?: string } })?.data?.detail || 'Moderation failed'
      toast.error(String(message), toastColor.error)
    } finally {
      setProcessingId(null)
    }
  }

  const columns = useMemo(
    () =>
      getReviewTableColumns({
        onApprove: handleApprove,
        onReject: handleReject,
        isProcessingId: processingId,
      }),
    [processingId],
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-serif text-2xl text-slate-950">Client review moderation</h1>
        <p className="mt-1 text-slate-500 text-sm">
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
                  ? 'rounded-full bg-slate-900 px-3 py-1.5 font-semibold text-white text-xs'
                  : 'rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-600 text-xs'
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
          <Card
            padding="none"
            className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <BasicDataGridTable
              data={items}
              columns={columns}
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={pageSize}
              onPageChange={(p: number) => setParam('page', p)}
              onItemPerPageChange={(limit: number) => setParams({ limit, page: 1 })}
              showPagination={totalItems > 0}
              showSearch={false}
              showItemsPerPage={true}
            />
          </Card>
        )}
      </AdminQueryState>
    </div>
  )
}
