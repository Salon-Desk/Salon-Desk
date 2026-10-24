import { Clock, DollarSign, FileCheck2, Wallet } from 'lucide-react'
import { useMemo } from 'react'

import { StatCard } from '@/components/card'
import { formatUsd } from '@/lib/format'
import type { CommissionRecord, OrgCommissionInvoice } from '@/types/api-org'

interface MerchantBillingKpiCardsProps {
  records: CommissionRecord[]
  invoices: OrgCommissionInvoice[]
  activeTab: 'records' | 'invoices'
  onSelectTab: (tab: 'records' | 'invoices') => void
  onFilterRecordsStatus?: (status: string) => void
}

export function MerchantBillingKpiCards({
  records,
  invoices,
  activeTab,
  onSelectTab,
  onFilterRecordsStatus,
}: MerchantBillingKpiCardsProps) {
  // Total Gross Volume Settled directly to salon's PayPal
  const grossVolume = useMemo(() => {
    return records.reduce((sum, r) => sum + Number(r.gross_captured_amount || 0), 0)
  }, [records])

  // Net earnings retained by organization
  const netOrgEarnings = useMemo(() => {
    return records.reduce((sum, r) => sum + Number(r.net_org_amount || 0), 0)
  }, [records])

  // Accrued unbilled commission
  const accruedUnbilled = useMemo(() => {
    return records
      .filter((r) => r.status?.toUpperCase() === 'ACCRUED')
      .reduce((sum, r) => sum + Number(r.platform_commission_amount || 0), 0)
  }, [records])

  const accruedCount = useMemo(() => {
    return records.filter((r) => r.status?.toUpperCase() === 'ACCRUED').length
  }, [records])

  // Invoiced commission due (from unpaid invoices: ISSUED or OVERDUE)
  const invoicesDue = useMemo(() => {
    return invoices
      .filter((inv) => {
        const s = inv.status?.toUpperCase()
        return s === 'ISSUED' || s === 'OVERDUE'
      })
      .reduce((sum, inv) => sum + Number(inv.total_commission_due || 0), 0)
  }, [invoices])

  const unpaidInvoicesCount = useMemo(() => {
    return invoices.filter((inv) => {
      const s = inv.status?.toUpperCase()
      return s === 'ISSUED' || s === 'OVERDUE'
    }).length
  }, [invoices])

  // Effective retention percentage
  const retentionPct = grossVolume > 0 ? ((netOrgEarnings / grossVolume) * 100).toFixed(1) : '95.0'

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Gross Volume Settled */}
      <StatCard
        label="Gross Settled Volume"
        value={formatUsd(grossVolume)}
        icon={DollarSign}
        tone="emerald"
        emphasizeValue={false}
        footnote="100% direct PayPal settlement"
        trend={{
          value: `${records.length} captures`,
          isPositive: true,
          label: 'total processed',
        }}
        onClick={() => {
          onSelectTab('records')
          onFilterRecordsStatus?.('ALL')
        }}
        className="cursor-pointer"
      />

      {/* 2. Net Merchant Earnings */}
      <StatCard
        label="Net Salon Earnings"
        value={formatUsd(netOrgEarnings)}
        icon={Wallet}
        tone="slate"
        emphasizeValue={false}
        footnote={`${retentionPct}% kept after platform fees`}
        trend={{
          value: `${retentionPct}%`,
          isPositive: true,
          label: 'net retention',
        }}
        onClick={() => {
          onSelectTab('records')
          onFilterRecordsStatus?.('ALL')
        }}
        className="cursor-pointer"
      />

      {/* 3. Accrued Commission (Unbilled) */}
      <StatCard
        label="Accrued Unbilled Fees"
        value={formatUsd(accruedUnbilled)}
        icon={Clock}
        tone="amber"
        emphasizeValue={true}
        footnote={`${accruedCount} pending billing cycle invoice`}
        trend={{
          value: `${accruedCount} accrued`,
          isPositive: false,
          label: 'uninvoiced',
        }}
        onClick={() => {
          onSelectTab('records')
          onFilterRecordsStatus?.('ACCRUED')
        }}
        className={activeTab === 'records' ? 'ring-1 ring-amber-400/40' : undefined}
      />

      {/* 4. Invoices Due */}
      <StatCard
        label="Invoices Outstanding"
        value={formatUsd(invoicesDue)}
        icon={FileCheck2}
        tone={invoicesDue > 0 ? 'rose' : 'sky'}
        emphasizeValue={invoicesDue > 0}
        footnote={
          unpaidInvoicesCount === 0
            ? '0 unpaid invoices · Account in good standing'
            : `${unpaidInvoicesCount} invoice${unpaidInvoicesCount === 1 ? '' : 's'} pending payment`
        }
        onClick={() => onSelectTab('invoices')}
        className={activeTab === 'invoices' ? 'ring-1 ring-sky-400/40' : undefined}
      />
    </div>
  )
}
