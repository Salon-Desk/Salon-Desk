'use client'

import { FileText, Loader2, Plus, Receipt } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { Card, EmptyState, SearchableSelect, SearchInput } from '@/components/ui'
import PrimaryButton from '@/components/ui/primary-button'
import { toastColor } from '@/constant/toast-color'
import { useDebounce } from '@/hooks/use-debounce'
import { useSearchableAdminOrganizations } from '@/hooks/use-searchable-admin-organizations'
import {
  useCreateAdminCommissionInvoiceMutation,
  useGetAdminCommissionInvoicesQuery,
  useIssueAdminCommissionInvoiceMutation,
  useVoidAdminCommissionInvoiceMutation,
} from '@/store/api/platformApi'
import type { OrgCommissionInvoice } from '@/types/api-org'

import { AdminBillingKpiCards } from './AdminBillingKpiCards'
import { AdminInvoiceDetailsModal } from './AdminInvoiceDetailsModal'
import { getAdminInvoiceTableColumns } from './AdminInvoiceTableColumns'

function defaultPeriod() {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  const yyyyMmDd = (d: Date) => d.toISOString().slice(0, 10)
  return { period_start: yyyyMmDd(start), period_end: yyyyMmDd(end) }
}

const STATUS_FILTERS = ['all', 'DRAFT', 'ISSUED', 'PAID', 'VOID'] as const
type StatusFilterKey = (typeof STATUS_FILTERS)[number]

interface CommissionInvoicesPanelProps {
  skip?: boolean
}

export function CommissionInvoicesPanel({ skip = false }: CommissionInvoicesPanelProps) {
  const {
    data: invoicesData,
    isLoading,
    isError,
    refetch,
  } = useGetAdminCommissionInvoicesQuery(undefined, { skip })
  const orgPicker = useSearchableAdminOrganizations({ skip, status: 'approved' })
  const [createInvoice, { isLoading: creating }] = useCreateAdminCommissionInvoiceMutation()
  const [issueInvoice, { isLoading: issuing }] = useIssueAdminCommissionInvoiceMutation()
  const [voidInvoice, { isLoading: voiding }] = useVoidAdminCommissionInvoiceMutation()

  const [generateOpen, setGenerateOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<OrgCommissionInvoice | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const periodDefaults = useMemo(() => defaultPeriod(), [])
  const [orgId, setOrgId] = useState('')
  const [periodStart, setPeriodStart] = useState(periodDefaults.period_start)
  const [periodEnd, setPeriodEnd] = useState(periodDefaults.period_end)

  const invoices = useMemo(() => invoicesData?.items ?? [], [invoicesData?.items])
  const orgs = orgPicker.items
  const orgNameById = useMemo(() => {
    const map = new Map<string, string>()
    orgs.forEach((o) => map.set(o.id, o.name))
    return map
  }, [orgs])

  const countsByStatus = useMemo(() => {
    const counts: Record<StatusFilterKey, number> = {
      all: invoices.length,
      DRAFT: 0,
      ISSUED: 0,
      PAID: 0,
      VOID: 0,
    }
    invoices.forEach((inv) => {
      const st = (inv.status || '').toUpperCase() as StatusFilterKey
      if (st in counts) {
        counts[st] += 1
      }
    })
    return counts
  }, [invoices])

  const filteredInvoices = useMemo(() => {
    let result = invoices

    if (statusFilter !== 'all') {
      result = result.filter((inv) => (inv.status || '').toUpperCase() === statusFilter)
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase()
      result = result.filter((inv) => {
        const orgName = (orgNameById.get(inv.org_id) || '').toLowerCase()
        const orgIdStr = inv.org_id.toLowerCase()
        const invIdStr = inv.id.toLowerCase()
        return orgName.includes(q) || orgIdStr.includes(q) || invIdStr.includes(q)
      })
    }

    return result
  }, [invoices, statusFilter, debouncedSearch, orgNameById])

  const totalFiltered = filteredInvoices.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredInvoices.slice(start, start + pageSize)
  }, [filteredInvoices, page, pageSize])

  const handleGenerate = async () => {
    if (!orgId) {
      toast.error('Select an organization', toastColor.error)
      return
    }
    try {
      await createInvoice({
        org_id: orgId,
        period_start: periodStart,
        period_end: periodEnd,
        currency: 'USD',
      }).unwrap()
      toast.success('Draft commission invoice generated', toastColor.success)
      setGenerateOpen(false)
      void refetch()
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not generate invoice'
      toast.error(String(message), toastColor.error)
    }
  }

  const handleIssue = async (invoice: OrgCommissionInvoice) => {
    try {
      await issueInvoice(invoice.id).unwrap()
      toast.success('Invoice issued to organization', toastColor.success)
      void refetch()
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not issue invoice'
      toast.error(String(message), toastColor.error)
    }
  }

  const handleVoid = async (invoice: OrgCommissionInvoice) => {
    try {
      await voidInvoice(invoice.id).unwrap()
      toast.success('Invoice voided; accruals restored', toastColor.success)
      void refetch()
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not void invoice'
      toast.error(String(message), toastColor.error)
    }
  }

  const columns = useMemo(
    () =>
      getAdminInvoiceTableColumns({
        orgNameById,
        onViewDetail: (inv) => setSelectedInvoice(inv),
        onIssue: (inv) => void handleIssue(inv),
        onVoid: (inv) => void handleVoid(inv),
        issuing,
        voiding,
      }),
    [orgNameById, issuing, voiding],
  )

  return (
    <div className="space-y-6">
      {/* 4 Summary KPI Cards */}
      <AdminBillingKpiCards invoices={invoices} />

      {/* Main Table Card */}
      <Card
        padding="none"
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs"
      >
        {/* Header & Generate Button */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Receipt className="h-4 w-4 text-amber-600" />
              SaaS Commission Invoices
            </h2>
            <p className="text-slate-500 text-xs">
              Aggregate ACCRUED transaction records into periodic salon invoices (DRAFT → ISSUED →
              PAID).
            </p>
          </div>
          <PrimaryButton
            title="Generate invoice"
            size="sm"
            fullWidth={false}
            icon={<Plus className="h-3.5 w-3.5" />}
            className="h-9 rounded-xl px-4 font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
            onClick={() => setGenerateOpen(true)}
          />
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {STATUS_FILTERS.map((st) => {
              const isActive = statusFilter === st
              const count = countsByStatus[st]
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st)
                    setPage(1)
                  }}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold uppercase transition-all cursor-pointer active:scale-[0.98] ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{st}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="w-full sm:w-72">
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val)
                setPage(1)
              }}
              placeholder="Search salon or invoice ID…"
              className="w-full text-xs"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
            Loading invoices…
          </div>
        ) : null}

        {/* Error State */}
        {isError ? (
          <div className="flex items-center justify-between p-5 text-rose-800 text-xs">
            <span>Could not load commission invoices.</span>
            <PrimaryButton
              title="Retry"
              variant="outline"
              size="sm"
              fullWidth={false}
              className="h-8 rounded-lg px-3 text-xs"
              onClick={() => void refetch()}
            />
          </div>
        ) : null}

        {/* Empty State */}
        {!isLoading && !isError && filteredInvoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={debouncedSearch ? 'No matching invoices' : 'No commission invoices'}
            description={
              debouncedSearch
                ? `No invoices matched "${debouncedSearch}". Clear your search query.`
                : 'Generate a draft invoice for an organization to bill accrued platform fees.'
            }
          />
        ) : null}

        {/* Data Grid Table */}
        {!isLoading && !isError && filteredInvoices.length > 0 ? (
          <BasicDataGridTable
            data={paginatedInvoices}
            columns={columns}
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalFiltered}
            itemsPerPage={pageSize}
            onPageChange={(p) => setPage(p)}
            onItemPerPageChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
            showPagination={totalFiltered > pageSize}
            showSearch={false}
            showItemsPerPage={true}
          />
        ) : null}

        {/* Generate Invoice Modal */}
        <CustomResponsiveDialog
          open={generateOpen}
          setOpen={setGenerateOpen}
          header={
            <div>
              <h3 className="font-bold text-slate-900 text-base">Generate commission invoice</h3>
              <p className="mt-0.5 text-slate-500 text-xs">
                Aggregate ACCRUED commission records for the selected org and period into a DRAFT
                invoice.
              </p>
            </div>
          }
        >
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="font-semibold text-slate-700 text-xs">Organization</span>
              <SearchableSelect
                value={orgId}
                onChange={setOrgId}
                options={orgs.map((o) => ({
                  value: o.id,
                  label: o.name,
                  description: o.description || undefined,
                }))}
                placeholder="Select salon…"
                searchPlaceholder="Search approved salons…"
                emptyText="No matching salons."
                triggerClassName="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 hover:border-slate-300 focus:border-amber-500"
                onSearchChange={orgPicker.setSearch}
                hasMore={orgPicker.hasMore}
                onLoadMore={orgPicker.loadMore}
                isLoadingMore={orgPicker.isFetching}
                loadMoreLabel="Load more salons"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="font-semibold text-slate-700 text-xs">Period start</span>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="font-semibold text-slate-700 text-xs">Period end</span>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <PrimaryButton
                title="Cancel"
                variant="outline"
                size="sm"
                fullWidth={false}
                className="h-9 rounded-lg px-3 text-xs transition-all active:scale-[0.98]"
                onClick={() => setGenerateOpen(false)}
              />
              <PrimaryButton
                title={creating ? 'Generating…' : 'Generate draft'}
                size="sm"
                fullWidth={false}
                isLoading={creating}
                isDisabled={creating}
                className="h-9 rounded-lg px-3.5 text-xs shadow-xs transition-all active:scale-[0.98]"
                onClick={() => void handleGenerate()}
              />
            </div>
          </div>
        </CustomResponsiveDialog>

        {/* Invoice Inspection Modal */}
        <AdminInvoiceDetailsModal
          invoice={selectedInvoice}
          orgName={selectedInvoice ? orgNameById.get(selectedInvoice.org_id) : undefined}
          open={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          onIssue={handleIssue}
          onVoid={handleVoid}
          issuing={issuing}
          voiding={voiding}
        />
      </Card>
    </div>
  )
}
