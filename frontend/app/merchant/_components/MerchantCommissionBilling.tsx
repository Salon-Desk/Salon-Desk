'use client'

import {
  ArrowRight,
  Check,
  Clock,
  CreditCard,
  FileText,
  Info,
  Loader2,
  Percent,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Sliders,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { PrimaryButton } from '@/components/button'
import { EmptyState } from '@/components/empty/EmptyState'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { PageHeader } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { useListingParams } from '@/hooks/useListingParams'
import { formatUsd } from '@/lib/format'
import {
  type MerchantBillingListParams,
  MerchantBillingListParamsSchema,
} from '@/lib/listing-params/merchant-billing-list-params'
import { cn } from '@/lib/utils'
import {
  useGetMyCommissionInvoicesQuery,
  useGetMyCommissionRecordsQuery,
  usePayMyCommissionInvoiceMutation,
} from '@/store/api/orgApi'
import type { CommissionRecord, OrgCommissionInvoice } from '@/types/api-org'

import { MerchantBillingKpiCards } from './MerchantBillingKpiCards'
import { MerchantCommissionRecordDetailsModal } from './MerchantCommissionRecordDetailsModal'
import { getMerchantCommissionTableColumns } from './MerchantCommissionTableColumns'
import { getMerchantInvoiceTableColumns } from './MerchantInvoiceTableColumns'

export function MerchantCommissionBilling() {
  const { params, displayParams, setParam, setParams } = useListingParams<
    MerchantBillingListParams,
    typeof MerchantBillingListParamsSchema
  >(MerchantBillingListParamsSchema)

  const activeTab = displayParams.tab
  const recordStatusFilter = displayParams.status
  const searchTerm = displayParams.search
  const debouncedSearch = typeof params.q === 'string' ? params.q : ''

  const [inspectingRecord, setInspectingRecord] = useState<CommissionRecord | null>(null)
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null)

  // API Queries & Mutations
  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    isFetching: invoicesFetching,
    isError: invoicesError,
    refetch: refetchInvoices,
  } = useGetMyCommissionInvoicesQuery()

  const {
    data: recordsData,
    isLoading: recordsLoading,
    isFetching: recordsFetching,
    isError: recordsError,
    refetch: refetchRecords,
  } = useGetMyCommissionRecordsQuery()

  const [payInvoice, { isLoading: isPayingMutation }] = usePayMyCommissionInvoiceMutation()

  const invoices = invoicesData?.items ?? []
  const records = recordsData?.items ?? []
  const isRefreshing = invoicesFetching || recordsFetching

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([refetchInvoices(), refetchRecords()])
      toast.success('Billing data refreshed', toastColor.success)
    } catch {
      toast.error('Failed to refresh billing data', toastColor.error)
    }
  }, [refetchInvoices, refetchRecords])

  // Filter records by status and debounced search
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (recordStatusFilter !== 'ALL') {
        if (rec.status?.toUpperCase() !== recordStatusFilter.toUpperCase()) {
          return false
        }
      }

      const query = debouncedSearch.trim().toLowerCase()
      if (!query) return true

      return (
        (rec.booking_id || '').toLowerCase().includes(query) ||
        (rec.capture_id || '').toLowerCase().includes(query) ||
        (rec.id || '').toLowerCase().includes(query) ||
        String(rec.gross_captured_amount || '').includes(query) ||
        String(rec.platform_commission_amount || '').includes(query) ||
        String(rec.net_org_amount || '').includes(query)
      )
    })
  }, [records, recordStatusFilter, debouncedSearch])

  // Aggregate counts for status filter pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: records.length,
      ACCRUED: 0,
      INVOICED: 0,
      PAID: 0,
    }
    records.forEach((r) => {
      const s = r.status?.toUpperCase() || 'ACCRUED'
      counts[s] = (counts[s] || 0) + 1
    })
    return counts
  }, [records])

  const accruedAmount = useMemo(() => {
    return records
      .filter((r) => r.status?.toUpperCase() === 'ACCRUED')
      .reduce((sum, r) => sum + Number(r.platform_commission_amount || 0), 0)
  }, [records])

  // Invoice settlement
  const handlePay = useCallback(
    async (invoice: OrgCommissionInvoice) => {
      setPayingInvoiceId(invoice.id)
      try {
        await payInvoice({ invoiceId: invoice.id }).unwrap()
        toast.success('Commission invoice settled successfully', toastColor.success)
        void refetchInvoices()
        void refetchRecords()
      } catch (err) {
        const message =
          (err as { data?: { detail?: string } })?.data?.detail || 'Could not settle invoice'
        toast.error(String(message), toastColor.error)
      } finally {
        setPayingInvoiceId(null)
      }
    },
    [payInvoice, refetchInvoices, refetchRecords],
  )

  // Table columns with visible Detail column
  const recordColumns = useMemo(
    () =>
      getMerchantCommissionTableColumns({
        onInspect: (rec) => setInspectingRecord(rec),
      }),
    [],
  )

  const invoiceColumns = useMemo(() => getMerchantInvoiceTableColumns(), [])

  const isLoading = invoicesLoading || recordsLoading
  const isError = invoicesError || recordsError

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Page Header */}
      <PageHeader
        variant="card"
        accent="amber"
        eyebrow={
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Direct PayPal Settlements Active</span>
          </div>
        }
        title="Platform Billing & Commission Ledger"
        description="Client payments settle 100% directly to your PayPal merchant account. SalonDesk tracks booking-time commission (5.0%) in your ledger, billed periodically."
        actions={
          <>
            <Link
              href="/merchant/settings"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
              <span>Finance Settings</span>
            </Link>
            <Link
              href="/merchant/settings/paypal"
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300/80 bg-gradient-to-r from-sky-500 to-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:from-sky-600 hover:to-sky-700 transition-all"
            >
              <CreditCard className="h-3.5 w-3.5 text-white" />
              <span>PayPal Credentials</span>
            </Link>
          </>
        }
      />

      {/* 1. Financial KPI Cards */}
      <MerchantBillingKpiCards
        records={records}
        invoices={invoices}
        activeTab={activeTab}
        onSelectTab={(tab) => setParam('tab', tab)}
        onFilterRecordsStatus={(status) => {
          setParams({
            status: status as MerchantBillingListParams['status'],
            tab: 'records',
            page: 1,
          })
        }}
      />

      {/* 2. Error Banner */}
      {isError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Could not load your latest commission records or invoices.</span>
          </div>
          <PrimaryButton
            title="Retry"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="h-8 rounded-lg px-3 text-xs"
            onClick={() => void handleRefresh()}
          />
        </div>
      )}

      {/* 3. Tab Bar with Refresh Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-2">
        <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100/80 p-1 text-xs">
          <button
            type="button"
            onClick={() => setParam('tab', 'records')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-semibold transition-all cursor-pointer',
              activeTab === 'records'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            <Receipt className="h-4 w-4 text-amber-700" />
            <span>Accrual Ledger</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold',
                activeTab === 'records'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-slate-200/80 text-slate-600',
              )}
            >
              {records.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setParam('tab', 'invoices')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-semibold transition-all cursor-pointer',
              activeTab === 'invoices'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            <FileText className="h-4 w-4 text-sky-700" />
            <span>SaaS Invoices</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold',
                activeTab === 'invoices'
                  ? 'bg-sky-100 text-sky-900'
                  : 'bg-slate-200/80 text-slate-600',
              )}
            >
              {invoices.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'records' && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 mr-1">
              <span>Commission Rate:</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono font-bold text-amber-800">
                <Percent className="h-3 w-3" />
                <span>5.0%</span>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60 transition-all cursor-pointer"
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin text-amber-600')}
            />
            <span>{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 4. Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          <span>Loading platform commission billing ledger…</span>
        </div>
      )}

      {/* 5. TAB 1: Accrual Ledger */}
      {!isLoading && activeTab === 'records' && (
        <div className="space-y-4">
          {/* Search & Status Filters */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input with Debounce */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setParam('search', e.target.value)}
                placeholder="Search by booking or capture ID…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setParam('search', '')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(['ALL', 'ACCRUED', 'INVOICED', 'PAID'] as const).map((st) => {
                const count = statusCounts[st] ?? 0
                const isActive = recordStatusFilter === st

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setParams({ status: st, page: 1 })}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0',
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200/70 bg-white text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    <span>{st === 'ALL' ? 'All Records' : st}</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold',
                        isActive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Records Table with visible Detail column */}
          {records.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No commission records yet"
              description="Records are generated automatically when a client appointment hold or no-show fee is captured."
            />
          ) : filteredRecords.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center">
              <Receipt className="mx-auto h-8 w-8 text-slate-300" />
              <div className="mt-2 text-sm font-semibold text-slate-800">
                No matching commission records found
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Try clearing your search query or switching your status filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setParams({ search: '', status: 'ALL', page: 1 })
                }}
                className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
              <BasicDataGridTable
                data={filteredRecords}
                columns={recordColumns}
                isLoading={recordsLoading}
                refetch={() => void refetchRecords()}
                showPagination={filteredRecords.length > 10}
                showSearch={false}
                showItemsPerPage={false}
                showColumnSelector
                showActions={false}
                tableClassName="border-slate-100"
                headerClassName="bg-slate-50/80 text-slate-700"
              />
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 2: Commission Invoices */}
      {!isLoading && activeTab === 'invoices' && (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8">
              <div className="mx-auto max-w-xl text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <Receipt className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 sm:text-lg">
                  No Commission Invoices Issued Yet
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
                  Your accrued commission fees ({formatUsd(accruedAmount)}) are accumulating in your
                  ledger. SalonDesk compiles these fees into periodic invoices.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 text-left">
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Wallet className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Direct PayPal</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                      100% of client deposits arrive in your PayPal merchant account directly.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Consolidated</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                      Fees accumulate in the ledger and are billed in a single periodic SaaS
                      statement.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0" />
                      <span>1-Click Pay</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                      When an invoice is issued, review lines and settle in 1 click.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setParam('tab', 'records')}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 cursor-pointer"
                  >
                    <span>View Accrued Ledger Transactions</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
              <BasicDataGridTable
                data={invoices}
                columns={invoiceColumns}
                isLoading={invoicesLoading}
                refetch={() => void refetchInvoices()}
                showPagination={invoices.length > 10}
                showSearch={false}
                showItemsPerPage={false}
                showColumnSelector
                showActions={true}
                renderRowActions={(inv) => {
                  const canPay =
                    inv.status?.toUpperCase() === 'ISSUED' ||
                    inv.status?.toUpperCase() === 'OVERDUE'
                  if (!canPay) {
                    if (inv.status?.toUpperCase() === 'PAID') {
                      return (
                        <div className="flex justify-end">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                            <Check className="h-3 w-3" />
                            <span>Settled</span>
                          </span>
                        </div>
                      )
                    }
                    return null
                  }

                  const isThisPaying = payingInvoiceId === inv.id || Boolean(isPayingMutation)

                  return (
                    <div className="flex justify-end">
                      <PrimaryButton
                        title={isThisPaying ? 'Processing…' : 'Pay via PayPal'}
                        size="sm"
                        fullWidth={false}
                        isDisabled={payingInvoiceId === inv.id}
                        className="h-8 rounded-lg px-3 text-xs bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => void handlePay(inv)}
                      />
                    </div>
                  )
                }}
                tableClassName="border-slate-100"
                headerClassName="bg-slate-50/80 text-slate-700"
              />
            </div>
          )}
        </div>
      )}

      {/* 7. Commission Record Details Inspection Modal */}
      <MerchantCommissionRecordDetailsModal
        record={inspectingRecord}
        open={Boolean(inspectingRecord)}
        onClose={() => setInspectingRecord(null)}
      />
    </div>
  )
}
