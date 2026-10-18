'use client'

import { CheckCircle2, Clock, Copy, CreditCard, ShieldCheck, Sliders } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Pagination } from '@/components/table/Pagination'
import { Badge, Card, EmptyState, SearchInput } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useGetAdminChangeRequestsQuery } from '@/store/api/platformApi'
import type { ApiChangeRequest } from '@/types/api-org'

import { AdminQueryState } from '../_components/admin-query-state'
import { ChangeRequestReviewActions } from '../_components/change-request-review-actions'

type CrFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'all'

const FILTER_LABELS: Record<CrFilter, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  all: 'All',
}

function PayloadParameterCard({ cr }: { cr: ApiChangeRequest }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const payload = cr.payload_json as Record<string, unknown>

  const handleCopy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success('Value copied to clipboard', toastColor.success)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  if (cr.request_type === 'PAYPAL_ACCOUNT') {
    const merchantId = String(payload.merchant_id || '—')
    const currency = String(payload.currency || 'USD')

    return (
      <div className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50/60 to-slate-50/40 p-4 text-xs text-slate-700 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-sky-100 pb-2">
          <div className="font-bold text-sky-950 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-100 text-sky-700">
              <CreditCard className="h-3.5 w-3.5" />
            </div>
            <span>Proposed PayPal Merchant Payout Configuration</span>
          </div>
          <span className="rounded-md bg-sky-100 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-800">
            Orders v2 Direct
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-xs">
            <span className="text-[10px] uppercase text-slate-400 block font-sans">
              Merchant Payer ID
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold text-slate-900 text-xs">{merchantId}</span>
              <button
                type="button"
                onClick={() => handleCopy(merchantId, 'merchantId')}
                className="text-slate-400 hover:text-slate-700 p-0.5 transition-colors"
                title="Copy merchant ID"
              >
                {copiedKey === 'merchantId' ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-xs">
            <span className="text-[10px] uppercase text-slate-400 block font-sans">
              Settlement Currency
            </span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-900">
              <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-1.5 py-0.2 text-[11px]">
                {currency}
              </span>
              <span className="text-slate-500 font-sans text-xs">· US Dollar Payouts</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (cr.request_type === 'CANCELLATION_POLICY') {
    const data = (payload.data as Record<string, unknown>) || {}
    const freeCancelHours = String(data.free_cancel_hours || '24')
    const noShowFee = String(data.no_show_fee || '0')
    const holdPercent = String(data.hold_percent || '100')

    return (
      <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-slate-50/40 p-4 text-xs text-slate-700 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-amber-100 pb-2">
          <div className="font-bold text-amber-950 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-800">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <span>Proposed Cancellation &amp; No-Show Policy Amendment</span>
          </div>
          <span className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-900">
            Escrow Guarded
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
          <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-xs">
            <span className="text-[10px] uppercase text-slate-400 block font-sans">
              Notice Window
            </span>
            <div className="mt-1 font-bold text-slate-900 text-sm tabular-nums tracking-tight">
              {freeCancelHours}
              <span className="text-xs font-normal text-slate-500 ml-0.5">hrs</span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
              Free cancel cutoff
            </span>
          </div>

          <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-xs">
            <span className="text-[10px] uppercase text-slate-400 block font-sans">
              No-Show Penalty
            </span>
            <div className="mt-1 font-bold text-rose-800 text-sm tabular-nums tracking-tight">
              ${noShowFee}
            </div>
            <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
              Captured on missed slot
            </span>
          </div>

          <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-xs">
            <span className="text-[10px] uppercase text-slate-400 block font-sans">
              Authorization Hold
            </span>
            <div className="mt-1 font-bold text-amber-900 text-sm tabular-nums tracking-tight">
              {holdPercent}%
            </div>
            <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
              Zero-debit hold share
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <pre className="overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-[11px] text-slate-600 font-mono shadow-xs">
      {JSON.stringify(cr.payload_json, null, 2)}
    </pre>
  )
}

export default function AdminRequestsPage() {
  const { skipAdminApi } = useAdminSession()
  const [status, setStatus] = useState<CrFilter>('PENDING')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const {
    data: allRequestsData,
    isLoading,
    isError,
    refetch,
  } = useGetAdminChangeRequestsQuery(undefined, {
    skip: skipAdminApi,
  })
  const allRequests = allRequestsData?.items ?? []

  const counts = useMemo(
    () => ({
      all: allRequests.length,
      PENDING: allRequests.filter((r) => r.status.toUpperCase() === 'PENDING').length,
      APPROVED: allRequests.filter((r) => r.status.toUpperCase() === 'APPROVED').length,
      REJECTED: allRequests.filter((r) => r.status.toUpperCase() === 'REJECTED').length,
    }),
    [allRequests],
  )

  const filteredRequests = useMemo(() => {
    let list =
      status === 'all' ? allRequests : allRequests.filter((r) => r.status.toUpperCase() === status)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (r) =>
          r.org_id.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.request_type.toLowerCase().includes(q) ||
          JSON.stringify(r.payload_json).toLowerCase().includes(q),
      )
    }
    return list
  }, [allRequests, status, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize))
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRequests.slice(start, start + pageSize)
  }, [filteredRequests, currentPage, pageSize])

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-extrabold text-xl text-slate-900 tracking-tight sm:text-2xl">
          Change Request Governance
        </h1>
        <p className="text-xs text-slate-500">
          Review, approve, and audit merchant policy amendments and PayPal payout configuration
          changes.
        </p>
      </div>

      {/* Toolbar: Search & Tabbed Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <SearchInput
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val)
            setCurrentPage(1)
          }}
          placeholder="Search by org ID, request ID, or payload details…"
          className="w-full sm:max-w-xs text-xs"
        />

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(['PENDING', 'APPROVED', 'REJECTED', 'all'] as const).map((key) => {
            const isActive = status === key
            const count = counts[key]

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setStatus(key)
                  setCurrentPage(1)
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{FILTER_LABELS[key]}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <AdminQueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loadingLabel="Loading change requests…"
        errorLabel="Could not load change requests."
      >
        <div className="space-y-3.5">
          {paginatedRequests.map((cr) => {
            const isPending = cr.status.toUpperCase() === 'PENDING'
            const isApproved = cr.status.toUpperCase() === 'APPROVED'
            const statusTone = isApproved ? 'emerald' : isPending ? 'amber' : 'rose'

            return (
              <Card
                key={cr.id}
                className="space-y-3.5 rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 capitalize">
                        {cr.request_type.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-xs text-slate-500">
                        Salon: {cr.org_id.slice(0, 8)}…
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>Submitted {new Date(cr.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <Badge tone={statusTone} size="sm">
                    {cr.status.toLowerCase()}
                  </Badge>
                </div>

                <PayloadParameterCard cr={cr} />

                {isPending && (
                  <div className="pt-2 border-t border-slate-100">
                    <ChangeRequestReviewActions request={cr} />
                  </div>
                )}
              </Card>
            )
          })}

          {filteredRequests.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredRequests.length}
              pageSize={pageSize}
              setCurrentPage={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setCurrentPage(1)
              }}
              pageSizeOptions={[5, 10, 20]}
            />
          )}

          {filteredRequests.length === 0 && (
            <EmptyState
              icon={Sliders}
              title="No requests in this category"
              description="All merchant policy and PayPal payout configuration requests for this status view have been resolved."
            />
          )}
        </div>
      </AdminQueryState>
    </div>
  )
}
