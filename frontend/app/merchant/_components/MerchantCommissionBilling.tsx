'use client'

import { FileText, Loader2, Receipt } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { BasicDataGridTable } from '@/components/table/BasicDataGridTable'
import { Badge, Card, EmptyState } from '@/components/ui'
import PrimaryButton from '@/components/ui/primary-button'
import { toastColor } from '@/constant/toast-color'
import { formatUsd } from '@/lib/format'
import {
  useGetMyCommissionInvoicesQuery,
  useGetMyCommissionRecordsQuery,
  usePayMyCommissionInvoiceMutation,
} from '@/store/api/orgApi'
import type { OrgCommissionInvoice } from '@/types/api-org'

import { getMerchantInvoiceTableColumns } from './MerchantInvoiceTableColumns'

function recordTone(status: string): 'slate' | 'amber' | 'emerald' | 'sky' {
  switch (status.toUpperCase()) {
    case 'PAID':
      return 'emerald'
    case 'INVOICED':
      return 'sky'
    case 'ACCRUED':
      return 'amber'
    default:
      return 'slate'
  }
}

export function MerchantCommissionBilling() {
  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    isError: invoicesError,
    refetch: refetchInvoices,
  } = useGetMyCommissionInvoicesQuery()
  const {
    data: recordsData,
    isLoading: recordsLoading,
    isError: recordsError,
    refetch: refetchRecords,
  } = useGetMyCommissionRecordsQuery()
  const [payInvoice, { isLoading: payingId }] = usePayMyCommissionInvoiceMutation()
  const [paying, setPaying] = useState<string | null>(null)

  const invoices = invoicesData?.items ?? []
  const records = recordsData?.items ?? []

  const accruedDue = useMemo(
    () =>
      records
        .filter((r) => r.status?.toUpperCase() === 'ACCRUED')
        .reduce((sum, r) => sum + Number(r.platform_commission_amount || 0), 0),
    [records],
  )

  const handlePay = async (invoice: OrgCommissionInvoice) => {
    setPaying(invoice.id)
    try {
      await payInvoice({ invoiceId: invoice.id }).unwrap()
      toast.success('Commission invoice marked paid', toastColor.success)
      void refetchInvoices()
      void refetchRecords()
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not pay invoice'
      toast.error(String(message), toastColor.error)
    } finally {
      setPaying(null)
    }
  }

  const invoiceColumns = useMemo(
    () =>
      getMerchantInvoiceTableColumns({
        onPay: (inv) => void handlePay(inv),
        payingId: paying,
        isPaying: Boolean(payingId),
      }),
    [paying, payingId],
  )

  const isLoading = invoicesLoading || recordsLoading
  const isError = invoicesError || recordsError

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900 text-sm">Platform commission billing</h2>
          <p className="text-slate-500 text-xs">
            Accrued SaaS fees from booking-time commission snapshots. Client captures settle 100% to
            your PayPal; SalonDesk bills you periodically via these invoices.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <span className="text-slate-400 uppercase font-mono text-[10px]">Accrued unpaid · </span>
          <span className="font-bold text-amber-900 tabular-nums">{formatUsd(accruedDue)}</span>
        </div>
      </div>

      {isError ? (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800">
          <span>Could not load commission ledger or invoices.</span>
          <PrimaryButton
            title="Retry"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="h-8 rounded-lg px-3 text-xs"
            onClick={() => {
              void refetchInvoices()
              void refetchRecords()
            }}
          />
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
          Loading commission billing…
        </div>
      ) : null}

      {!isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <FileText className="h-4 w-4 text-slate-400" />
              <h3 className="font-bold text-sm text-slate-900">Commission invoices</h3>
            </div>
            <BasicDataGridTable
              data={invoices}
              columns={invoiceColumns}
              isLoading={invoicesLoading}
              refetch={() => void refetchInvoices()}
              showPagination={invoices.length > 10}
              showSearch={false}
              showItemsPerPage={false}
            />
          </div>

          <Card
            padding="none"
            className="rounded-xl border border-slate-200/80 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <div className="border-b border-slate-100 px-4 py-3 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-slate-400" />
              <h3 className="font-bold text-sm text-slate-900">Accrual ledger</h3>
            </div>
            {records.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No accrued commissions"
                description="Records appear automatically when you capture a show or no-show fee."
              />
            ) : (
              <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {records.slice(0, 20).map((rec) => (
                  <li key={rec.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge tone={recordTone(rec.status)} size="sm">
                          {rec.status}
                        </Badge>
                        <span className="font-mono text-[10px] text-slate-400 truncate">
                          {rec.booking_id.slice(0, 8)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Gross {formatUsd(Number(rec.gross_captured_amount))}
                      </p>
                    </div>
                    <span className="font-bold text-xs text-amber-900 tabular-nums shrink-0">
                      {formatUsd(Number(rec.platform_commission_amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  )
}
