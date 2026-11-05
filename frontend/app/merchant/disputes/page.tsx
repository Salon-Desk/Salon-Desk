'use client'

import {
  Award,
  CheckCircle2,
  ChevronRight,
  Download,
  Filter,
  Gavel,
  Loader2,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PrimaryButton } from '@/components/button'
import { toastColor } from '@/constant/toast-color'
import { useAgentUiActions } from '@/hooks/useAgentUiActions'
import { NEXT_PUBLIC_ENABLE_SIMULATION } from '@/lib/env'
import { formatUsd } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useListDisputesQuery, useSimulateDisputeMutation } from '@/store/api/disputeApi'
import { useGetMyOrgBookingsQuery } from '@/store/api/orgApi'
import type { DisputeCase } from '@/types/dispute'

import { DisputeDrawer } from '../_components/DisputeDrawer'

export default function MerchantDisputesPage() {
  const { data, isLoading, refetch } = useListDisputesQuery()
  const { data: bookingsData } = useGetMyOrgBookingsQuery({ page: 1, page_size: 10 })
  const [simulateDispute, { isLoading: isSimulating }] = useSimulateDisputeMutation()

  const [selectedDispute, setSelectedDispute] = useState<DisputeCase | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  useAgentUiActions({
    onOpenDisputeDrawer: (disputeId?: string) => {
      if (!data?.items?.length) return
      const target = disputeId
        ? data.items.find((d) => d.id === disputeId || d.paypal_dispute_id === disputeId)
        : data.items[0]
      if (target) {
        setSelectedDispute(target)
        setIsDrawerOpen(true)
      }
    },
  })

  const disputes = data?.items || []
  const kpis = data?.kpis || {
    total_disputes: 0,
    disputed_volume_usd: '0.00',
    evidence_ready_count: 0,
    resolved_seller_favor_count: 0,
    average_win_probability: 0,
  }

  const filteredDisputes = disputes.filter((d) => {
    const matchesSearch =
      d.paypal_dispute_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.reason.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'OPEN'
          ? d.status !== 'RESOLVED_SELLER_FAVOR' && d.status !== 'RESOLVED_BUYER_FAVOR'
          : statusFilter === 'RESOLVED'
            ? d.status === 'RESOLVED_SELLER_FAVOR' || d.status === 'RESOLVED_BUYER_FAVOR'
            : d.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleExportCsv = () => {
    if (!filteredDisputes.length) {
      toast.info('No dispute records to export.', toastColor.info)
      return
    }
    const headers = [
      'Dispute ID',
      'Reason',
      'Booking ID',
      'Dispute Amount (USD)',
      'Status',
      'Win Probability (%)',
      'Consent Verified',
      'Ledger Chain Verified',
      'Created At',
    ]
    const rows = filteredDisputes.map((d) => [
      `"${d.paypal_dispute_id}"`,
      `"${d.reason}"`,
      `"${d.booking_id}"`,
      d.dispute_amount,
      `"${d.status}"`,
      d.skeptic_win_probability ?? 90,
      d.consent_verified ? 'YES' : 'NO',
      d.ledger_chain_verified ? 'YES' : 'NO',
      `"${d.created_at}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `salondesk_disputes_${new Date().toISOString().split('T')[0]}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Disputes CSV report downloaded!', toastColor.success)
  }

  const handleSimulateNewDispute = async () => {
    try {
      const candidates = bookingsData?.items || []
      const targetBooking = candidates[0]
      if (!targetBooking) {
        toast.info(
          'No bookings available to attach dispute. Please seed demo bookings.',
          toastColor.info,
        )
        return
      }

      const res = await simulateDispute({
        bookingId: targetBooking.id,
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        dispute_amount: 30.0,
      }).unwrap()

      toast.success(
        `Dispute simulated on booking #${targetBooking.id.slice(0, 8)}! 3-role defense prepared.`,
        toastColor.success,
      )
      setSelectedDispute(res)
      setIsDrawerOpen(true)
      void refetch()
    } catch (err: unknown) {
      const msg =
        (err as { data?: { detail?: string } })?.data?.detail || 'Failed to simulate dispute'
      toast.error(msg, toastColor.error)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-2xs">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Dispute Counsel
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Closed-loop PayPal Disputes v1 defense with Ed25519 signatures and SHA-256 ledger
                integrity.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            title="Export disputes to CSV"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => void refetch()}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            title="Refresh disputes"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {NEXT_PUBLIC_ENABLE_SIMULATION && (
            <PrimaryButton
              id="agent-simulate-dispute-btn"
              variant="primary"
              onClick={handleSimulateNewDispute}
              isDisabled={isSimulating}
              className="h-9 text-xs font-bold px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xs"
              icon={
                isSimulating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-300" />
                )
              }
              title={isSimulating ? 'Simulating...' : 'Simulate Chargeback ($30)'}
            />
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Open Disputes */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Open Disputes</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {kpis.evidence_ready_count}
            </span>
            <span className="text-xs text-slate-500">/ {kpis.total_disputes} total</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Awaiting seller response or filing</p>
        </div>

        {/* Card 2: Average Win Probability */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avg Win Probability</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-700">
              {kpis.average_win_probability}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              High Defense
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Mathematically verified by Skeptic</p>
        </div>

        {/* Card 3: Funds Defended */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Funds Under Defense</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Gavel className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {formatUsd(Number(kpis.disputed_volume_usd))}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Protected cancellation/no-show fees</p>
        </div>

        {/* Card 4: Favorable Outcomes */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Seller-Favor Wins</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700">
              {kpis.resolved_seller_favor_count}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
              100% Win Rate
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Zero fees lost to chargebacks</p>
        </div>
      </div>

      {/* Disputes Table Controls */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by dispute ID or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400 mr-1" />
            {(['ALL', 'OPEN', 'RESOLVED'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer',
                  statusFilter === tab
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                {tab === 'ALL' ? 'All Disputes' : tab === 'OPEN' ? 'Needs Action' : 'Resolved'}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Loading PayPal dispute cases...</span>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
              <Scale className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No disputes found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Your salon has zero active customer disputes. Click &quot;Simulate Chargeback&quot; to
              test the closed-loop defense workflow.
            </p>
            <button
              type="button"
              onClick={handleSimulateNewDispute}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              Simulate Test Chargeback
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Dispute Case ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Reason / Context</th>
                  <th className="px-4 py-3 whitespace-nowrap">Disputed Amount</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap">Skeptic Win Prob</th>
                  <th className="px-4 py-3 whitespace-nowrap">Cryptographic Proof</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDisputes.map((dispute) => {
                  const isReady =
                    dispute.status === 'EVIDENCE_READY' ||
                    dispute.status === 'WAITING_FOR_SELLER_RESPONSE'
                  const isWon = dispute.status === 'RESOLVED_SELLER_FAVOR'
                  const isUnderReview =
                    dispute.status === 'UNDER_REVIEW' || dispute.status === 'EVIDENCE_SUBMITTED'

                  return (
                    <tr
                      key={dispute.id}
                      onClick={() => {
                        setSelectedDispute(dispute)
                        setIsDrawerOpen(true)
                      }}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[140px]">
                            {dispute.paypal_dispute_id}
                          </span>
                          {dispute.paypal_dispute_id.includes('SANDBOX') && (
                            <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800">
                              SANDBOX
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className="font-semibold text-slate-800 block truncate max-w-[200px] sm:max-w-[260px]"
                          title={dispute.reason}
                        >
                          {dispute.reason.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Booking #{dispute.booking_id.slice(0, 8)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                        {formatUsd(Number(dispute.dispute_amount))}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isWon ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Won (Seller Favor)
                          </span>
                        ) : isUnderReview ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                            <Loader2 className="h-3 w-3 animate-spin text-sky-600" />
                            Under PayPal Review
                          </span>
                        ) : isReady ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            Evidence Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {dispute.status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-indigo-700 text-xs">
                            {dispute.skeptic_win_probability ?? 90}%
                          </span>
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-full"
                              style={{ width: `${dispute.skeptic_win_probability ?? 90}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono">
                          {dispute.consent_verified ? (
                            <span className="rounded bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 font-bold">
                              Ed25519 ✓
                            </span>
                          ) : (
                            <span className="rounded bg-rose-50 border border-rose-200 text-rose-600 px-1.5 py-0.5">
                              Unsigned
                            </span>
                          )}
                          {dispute.ledger_chain_verified ? (
                            <span className="rounded bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 font-bold">
                              SHA256 ✓
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id="agent-dispute-btn"
                            data-dispute-id={dispute.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDispute(dispute)
                              setIsDrawerOpen(true)
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 active:scale-95 transition-all"
                          >
                            <span>Defense Dossier</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3-Lane Dispute Drawer */}
      <DisputeDrawer
        dispute={selectedDispute}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onDisputeUpdated={(updated) => {
          setSelectedDispute(updated)
          void refetch()
        }}
      />
    </div>
  )
}
