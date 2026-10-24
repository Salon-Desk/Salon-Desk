'use client'

import { Check, CheckCircle2, Clock, MessageSquareQuote, Star, X } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { StatCard } from '@/components/card'
import { EmptyState } from '@/components/empty'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { PageHeader } from '@/components/ui'
import { Button } from '@/components/ui/button'
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

import { ReviewDetailsModal } from './ReviewDetailsModal'
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
  const [selectedReview, setSelectedReview] = useState<ClientFeedbackItem | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Reviews queue updated', toastColor.info)
    } finally {
      setIsRefreshing(false)
    }
  }

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

  const stats = useMemo(() => {
    const all = data?.items ?? []
    let pendingCount = 0
    let approvedCount = 0
    let ratingSum = 0
    let ratedCount = 0

    all.forEach((r) => {
      if (r.status === 'pending') pendingCount += 1
      if (r.status === 'approved') approvedCount += 1
      if (r.rating > 0) {
        ratingSum += r.rating
        ratedCount += 1
      }
    })

    const avgRating = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(1) : '5.0'
    return { pendingCount, approvedCount, avgRating, totalCount: all.length }
  }, [data?.items])

  const totalItems = data?.total ?? items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const handleApprove = async (item: ClientFeedbackItem) => {
    setProcessingId(item.id)
    try {
      await approve({ feedbackId: item.id, moderation_notes: null }).unwrap()
      toast.success('Review approved and published to catalog', toastColor.success)
      void refetch()
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
      void refetch()
    } catch (err) {
      const message = (err as { data?: { detail?: string } })?.data?.detail || 'Moderation failed'
      toast.error(String(message), toastColor.error)
    } finally {
      setProcessingId(null)
    }
  }

  const columns = useMemo(() => getReviewTableColumns(), [])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <PageHeader
        eyebrow="Catalog Quality · Client Review Moderation"
        title="Client Review Moderation"
        badge={`${stats.pendingCount} Actionable`}
        description="Verify customer reviews and feedback before they appear publicly on salon profiles and service booking menus. Maintain network authenticity and quality."
        onRefresh={() => void handleRefresh()}
        isRefreshing={isRefreshing}
        refreshTitle="Refresh reviews"
      />

      {/* 3 Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          label="Pending Moderation"
          value={String(stats.pendingCount)}
          footnote="Client reviews awaiting decision"
          icon={Clock}
          tone={stats.pendingCount > 0 ? 'amber' : 'slate'}
          className="hover:border-amber-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Approved &amp; Published"
          value={String(stats.approvedCount)}
          footnote="Live on consumer search &amp; menus"
          icon={CheckCircle2}
          tone="emerald"
          className="hover:border-emerald-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Average Network Rating"
          value={`${stats.avgRating} / 5`}
          footnote="Overall client satisfaction score"
          icon={Star}
          tone="amber"
          className="hover:border-amber-200 hover:shadow-xs transition-all"
        />
      </div>

      {/* Moderation Status Tabs */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FILTER_LABELS) as AdminReviewsListParams['status'][]).map((key) => {
            const isActive = displayParams.status === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setParams({ status: key, page: 1 })}
                className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.98] ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'border border-slate-200/80 bg-white text-slate-600 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {FILTER_LABELS[key]}
              </button>
            )
          })}
        </div>
        <span className="text-xs font-medium text-slate-500">
          Showing <strong className="font-bold text-slate-900">{totalItems}</strong> reviews
        </span>
      </div>

      <AdminQueryState isLoading={isLoading} isError={isError} onRetry={() => void refetch()}>
        {items.length === 0 && !displayParams.search ? (
          <EmptyState
            icon={MessageSquareQuote}
            title="No reviews in this queue"
            description="Client submissions appear here after completed appointments."
          />
        ) : (
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
            showSearch={true}
            searchPlaceholder="Search by client, salon, stylist, or comment…"
            initialSearchValue={displayParams.search}
            onSearch={(val) => setParams({ search: val, page: 1 })}
            showItemsPerPage={true}
            showColumnSelector={true}
            showActions={true}
            onView={(item) => setSelectedReview(item)}
            renderRowActions={(item) => {
              const isBusy = processingId === item.id
              const isPending = item.status === 'pending'
              if (!isPending) {
                return (
                  <span className="font-mono text-[11px] text-slate-400 pl-1 self-center">
                    Resolved
                  </span>
                )
              }
              return (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={isBusy}
                    className="h-7 w-7 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-all duration-200 cursor-pointer"
                    onClick={() => void handleApprove(item)}
                    title="Approve review"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span className="sr-only">Approve</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={isBusy}
                    className="h-7 w-7 hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-all duration-200 cursor-pointer"
                    onClick={() => void handleReject(item)}
                    title="Reject review"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span className="sr-only">Reject</span>
                  </Button>
                </>
              )
            }}
            refetch={() => void handleRefresh()}
            isFetching={isLoading || isRefreshing}
            tableClassName="border-slate-100"
            headerClassName="bg-slate-50/80 text-slate-700"
          />
        )}
      </AdminQueryState>

      {/* Full Review Detail Modal */}
      <ReviewDetailsModal
        item={selectedReview}
        open={Boolean(selectedReview)}
        onClose={() => setSelectedReview(null)}
        onApprove={(item) => void handleApprove(item)}
        onReject={(item) => void handleReject(item)}
        isProcessing={processingId === selectedReview?.id}
      />
    </div>
  )
}
