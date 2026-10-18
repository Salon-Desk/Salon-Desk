'use client'

import { FileText, Loader2, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Badge, Card, EmptyState, Modal } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { formatUsd } from '@/lib/format'
import {
  useCreateAdminCommissionInvoiceMutation,
  useGetAdminCommissionInvoicesQuery,
  useGetAdminOrganizationsQuery,
  useIssueAdminCommissionInvoiceMutation,
  useVoidAdminCommissionInvoiceMutation,
} from '@/store/api/platformApi'
import type { OrgCommissionInvoice } from '@/types/api-org'

function invoiceTone(status: string): 'slate' | 'amber' | 'emerald' | 'rose' | 'sky' {
  switch (status.toUpperCase()) {
    case 'PAID':
      return 'emerald'
    case 'ISSUED':
      return 'sky'
    case 'OVERDUE':
      return 'rose'
    case 'DRAFT':
      return 'slate'
    case 'VOID':
      return 'amber'
    default:
      return 'slate'
  }
}

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
  const { data: orgsData } = useGetAdminOrganizationsQuery(
    { page: 1, page_size: 100, status: 'approved' },
    { skip },
  )
  const [createInvoice, { isLoading: creating }] = useCreateAdminCommissionInvoiceMutation()
  const [issueInvoice, { isLoading: issuing }] = useIssueAdminCommissionInvoiceMutation()
  const [voidInvoice, { isLoading: voiding }] = useVoidAdminCommissionInvoiceMutation()

  const [generateOpen, setGenerateOpen] = useState(false)
  const periodDefaults = useMemo(() => defaultPeriod(), [])
  const [orgId, setOrgId] = useState('')
  const [periodStart, setPeriodStart] = useState(periodDefaults.period_start)
  const [periodEnd, setPeriodEnd] = useState(periodDefaults.period_end)

  const invoices = invoicesData?.items ?? []
  const orgs = orgsData?.items ?? []
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

  return (
    <Card
      padding="none"
      className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
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
          className="h-9 rounded-lg px-3.5 text-xs font-semibold"
          onClick={() => setGenerateOpen(true)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          Loading invoices…
        </div>
      ) : null}

      {isError ? (
        <div className="flex items-center justify-between p-4 text-xs text-rose-800">
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-slate-200/80 border-b bg-slate-50/80 font-semibold text-slate-700">
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Commission due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {orgNameById.get(inv.org_id) || inv.org_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                    {inv.period_start} → {inv.period_end}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-800 tabular-nums">
                    {formatUsd(Number(inv.total_commission_due))}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={invoiceTone(inv.status)} size="sm">
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{inv.due_date}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {inv.status?.toUpperCase() === 'DRAFT' ? (
                      <button
                        type="button"
                        disabled={issuing}
                        onClick={() => void handleIssue(inv)}
                        className="text-xs font-semibold text-sky-700 hover:text-sky-900 disabled:opacity-50"
                      >
                        Issue
                      </button>
                    ) : null}
                    {inv.status?.toUpperCase() !== 'PAID' &&
                    inv.status?.toUpperCase() !== 'VOID' ? (
                      <button
                        type="button"
                        disabled={voiding}
                        onClick={() => void handleVoid(inv)}
                        className="text-xs font-semibold text-rose-700 hover:text-rose-900 disabled:opacity-50"
                      >
                        Void
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {generateOpen ? (
        <Modal
          onClose={() => setGenerateOpen(false)}
          title="Generate commission invoice"
          description="Aggregate ACCRUED commission records for the selected org and period into a DRAFT invoice."
        >
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">Organization</span>
              <select
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
              >
                <option value="">Select salon…</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Period start</span>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Period end</span>
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
        </Modal>
      ) : null}
    </Card>
  )
}
