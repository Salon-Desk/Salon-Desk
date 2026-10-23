'use client'

import {
  Check,
  CheckCircle2,
  Clock,
  MessageSquareQuote,
  RefreshCw,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { StatCard } from '@/components/card'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { EmptyState } from '@/components/ui'
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
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-amber-50/25 to-amber-100/20 p-6 shadow-xs backdrop-blur-md sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-amber-200/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-900 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Catalog Quality · Client Review Moderation</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-extrabold text-slate-900 text-2xl tracking-tight sm:text-3xl">
                Client Review Moderation
              </h1>
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white shadow-2xs">
                {stats.pendingCount} Actionable
              </span>
            </div>

            <p className="max-w-2xl text-xs text-slate-600 sm:text-sm leading-relaxed">
              Verify customer reviews and feedback before they appear publicly on salon profiles and
              service booking menus. Maintain network authenticity and quality.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-xs backdrop-blur-sm">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-semibold text-slate-700 text-xs shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.94] disabled:opacity-50"
              title="Refresh reviews"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`}
              />
              <span>Sync</span>
            </button>
          </div>
        </div>
      </div>

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
