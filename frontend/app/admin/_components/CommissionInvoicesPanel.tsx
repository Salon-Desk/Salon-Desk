'use client'

import { FileText, Loader2, Plus } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { CustomResponsiveDialog } from '@/components/dialog/CustomResponsiveDialog'
import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { Card, EmptyState, SearchableSelect } from '@/components/ui'
import PrimaryButton from '@/components/ui/primary-button'
import { toastColor } from '@/constant/toast-color'
import { useSearchableAdminOrganizations } from '@/hooks/use-searchable-admin-organizations'
import {
  useCreateAdminCommissionInvoiceMutation,
  useGetAdminCommissionInvoicesQuery,
  useIssueAdminCommissionInvoiceMutation,
  useVoidAdminCommissionInvoiceMutation,
} from '@/store/api/platformApi'
import type { OrgCommissionInvoice } from '@/types/api-org'

import { getAdminInvoiceTableColumns } from './AdminInvoiceTableColumns'

function defaultPeriod() {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  const yyyyMmDd = (d: Date) => d.toISOString().slice(0, 10)
  return { period_start: yyyyMmDd(start), period_end: yyyyMmDd(end) }
}

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
  const periodDefaults = useMemo(() => defaultPeriod(), [])
  const [orgId, setOrgId] = useState('')
  const [periodStart, setPeriodStart] = useState(periodDefaults.period_start)
  const [periodEnd, setPeriodEnd] = useState(periodDefaults.period_end)

  const invoices = invoicesData?.items ?? []
  const orgs = orgPicker.items
  const orgNameById = useMemo(() => {
    const map = new Map<string, string>()
    orgs.forEach((o) => map.set(o.id, o.name))
    return map
  }, [orgs])

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
        onIssue: (inv) => void handleIssue(inv),
        onVoid: (inv) => void handleVoid(inv),
        issuing,
        voiding,
      }),
    [orgNameById, issuing, voiding],
  )

  return (
    <Card
      padding="none"
      className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
    >
      <div className="flex flex-col gap-3 border-slate-100 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <FileText className="h-4 w-4 text-slate-400" />
            SaaS commission invoices
          </h2>
          <p className="text-slate-500 text-xs">
            Aggregate ACCRUED commission records into periodic org invoices (DRAFT → ISSUED → PAID).
          </p>
        </div>
        <PrimaryButton
          title="Generate invoice"
          size="sm"
          fullWidth={false}
          icon={<Plus className="h-3.5 w-3.5" />}
          className="h-9 rounded-lg px-3.5 font-semibold text-xs"
          onClick={() => setGenerateOpen(true)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-500 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          Loading invoices…
        </div>
      ) : null}

      {isError ? (
        <div className="flex items-center justify-between p-4 text-rose-800 text-xs">
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

      {!isLoading && !isError && invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No commission invoices"
          description="Generate a draft invoice for an organization to bill accrued platform fees for a period."
        />
      ) : null}

      {!isLoading && !isError && invoices.length > 0 ? (
        <BasicDataGridTable
          data={invoices}
          columns={columns}
          showSearch={false}
          showPagination={false}
        />
      ) : null}

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
              className="h-9 rounded-lg px-3 text-xs"
              onClick={() => setGenerateOpen(false)}
            />
            <PrimaryButton
              title={creating ? 'Generating…' : 'Generate draft'}
              size="sm"
              fullWidth={false}
              isDisabled={creating}
              className="h-9 rounded-lg px-3.5 text-xs"
              onClick={() => void handleGenerate()}
            />
          </div>
        </div>
      </CustomResponsiveDialog>
    </Card>
  )
}
