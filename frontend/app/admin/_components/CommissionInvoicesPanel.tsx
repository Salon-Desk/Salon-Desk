'use client'

import { FileText, Plus } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { LoadingSpinner } from '@/components/loader/LoadingSpinner'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { EmptyState, SearchableSelect } from '@/components/ui'
import PrimaryButton from '@/components/ui/primary-button'
import { toastColor } from '@/constant/toast-color'
import { useSearchableAdminOrganizations } from '@/hooks/use-searchable-admin-organizations'
import { useListingParams } from '@/hooks/useListingParams'
import {
  type AdminInvoicesListParams,
  AdminInvoicesListParamsSchema,
} from '@/lib/listing-params/admin-invoices-list-params'
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
  const { params, displayParams, setParam, setParams } = useListingParams<
    AdminInvoicesListParams,
    typeof AdminInvoicesListParamsSchema
  >(AdminInvoicesListParamsSchema)

  const {
    data: invoicesData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAdminCommissionInvoicesQuery(params, { skip })
  const { data: allInvoicesData } = useGetAdminCommissionInvoicesQuery(undefined, { skip })
  const orgPicker = useSearchableAdminOrganizations({ skip, status: 'approved' })
  const [createInvoice, { isLoading: creating }] = useCreateAdminCommissionInvoiceMutation()
  const [issueInvoice, { isLoading: issuing }] = useIssueAdminCommissionInvoiceMutation()
  const [voidInvoice, { isLoading: voiding }] = useVoidAdminCommissionInvoiceMutation()

  const [generateOpen, setGenerateOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<OrgCommissionInvoice | null>(null)

  const periodDefaults = useMemo(() => defaultPeriod(), [])
  const [orgId, setOrgId] = useState('')
  const [periodStart, setPeriodStart] = useState(periodDefaults.period_start)
  const [periodEnd, setPeriodEnd] = useState(periodDefaults.period_end)

  const invoices = useMemo(() => invoicesData?.items ?? [], [invoicesData?.items])
  const allInvoices = useMemo(
    () => allInvoicesData?.items ?? invoices,
    [allInvoicesData?.items, invoices],
  )
  const orgs = orgPicker.items
  const orgNameById = useMemo(() => {
    const map = new Map<string, string>()
    orgs.forEach((o) => map.set(o.id, o.name))
    return map
  }, [orgs])

  const countsByStatus = useMemo(() => {
    const counts: Record<StatusFilterKey, number> = {
      all: allInvoices.length,
      DRAFT: 0,
      ISSUED: 0,
      PAID: 0,
      VOID: 0,
    }
    allInvoices.forEach((inv) => {
      const st = (inv.status || '').toUpperCase() as StatusFilterKey
      if (st in counts) {
        counts[st] += 1
      }
    })
    return counts
  }, [allInvoices])

  const totalItems = invoicesData?.total ?? invoices.length
  const totalPages = Math.max(1, Math.ceil(totalItems / displayParams.limit))

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
      }),
    [orgNameById],
  )

  return (
    <div className="space-y-6">
      {/* 4 Summary KPI Cards */}
      <AdminBillingKpiCards invoices={allInvoices} />

      {/* Status Filter Tabs */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {STATUS_FILTERS.map((st) => {
            const isActive = displayParams.status === st
            const count = countsByStatus[st]
            return (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setParams({ status: st, page: 1 })
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
        <span className="text-xs font-medium text-slate-500">
          Showing <strong className="font-bold text-slate-900">{totalItems}</strong>{' '}
          {totalItems === 1 ? 'invoice' : 'invoices'}
        </span>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="md" text="Loading invoices…" />
        </div>
      ) : null}

      {/* Error State */}
      {isError ? (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800">
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
      {!isLoading && !isError && invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No commission invoices"
          description="Generate a draft invoice for an organization to bill accrued platform fees."
          action={
            <PrimaryButton
              title="Generate first invoice"
              size="sm"
              fullWidth={false}
              icon={<Plus className="h-4 w-4" />}
              className="h-9.5 rounded-xl px-4 text-xs font-bold"
              onClick={() => setGenerateOpen(true)}
            />
          }
        />
      ) : null}

      {/* Data Grid Table */}
      {!isLoading && !isError && invoices.length > 0 ? (
        <BasicDataGridTable
          data={invoices}
          columns={columns}
          currentPage={displayParams.page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={displayParams.limit}
          onPageChange={(p) => setParam('page', p)}
          onItemPerPageChange={(size) => {
            setParams({ limit: size, page: 1 })
          }}
          showPagination={totalItems > 0}
          showSearch={true}
          searchPlaceholder="Search salon name, org UUID, or invoice ID…"
          initialSearchValue={displayParams.search}
          onSearch={(val) => {
            setParams({ search: val, page: 1 })
          }}
          showColumnSelector={true}
          showItemsPerPage={true}
          showActions={true}
          onView={(inv) => setSelectedInvoice(inv)}
          renderRowActions={(inv) => {
            const isDraft = inv.status?.toUpperCase() === 'DRAFT'
            const canVoid =
              inv.status?.toUpperCase() !== 'PAID' && inv.status?.toUpperCase() !== 'VOID'

            return (
              <>
                {isDraft ? (
                  <button
                    type="button"
                    disabled={issuing}
                    onClick={() => void handleIssue(inv)}
                    className="cursor-pointer rounded-lg border border-sky-200 bg-sky-50 px-2 py-0.5 font-semibold text-sky-800 text-xs transition-all hover:bg-sky-100 active:scale-[0.98] disabled:opacity-50"
                  >
                    Issue
                  </button>
                ) : null}
                {canVoid ? (
                  <button
                    type="button"
                    disabled={voiding}
                    onClick={() => void handleVoid(inv)}
                    className="cursor-pointer rounded-lg border border-rose-200 bg-rose-50 px-2 py-0.5 font-semibold text-rose-800 text-xs transition-all hover:bg-rose-100 active:scale-[0.98] disabled:opacity-50"
                  >
                    Void
                  </button>
                ) : null}
              </>
            )
          }}
          refetch={() => void refetch()}
          isFetching={isLoading || isFetching}
          tableClassName="border-slate-100"
          headerClassName="bg-slate-50/80 text-slate-700"
          customButtons={[
            <PrimaryButton
              key="generate-invoice"
              title="Generate invoice"
              size="sm"
              fullWidth={false}
              icon={<Plus className="h-3.5 w-3.5" />}
              className="h-9 rounded-xl px-4 font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
              onClick={() => setGenerateOpen(true)}
            />,
          ]}
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
    </div>
  )
}
