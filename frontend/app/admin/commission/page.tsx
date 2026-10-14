'use client'

import { CheckCircle2, Copy, Percent, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button, Card, NumberField } from '@/components/ui'
import { formatUsd } from '@/lib/format'

import { useAdminContext } from '../_context/admin-context'

export default function AdminCommissionPage() {
  const {
    state,
    globalRateInput,
    setGlobalRateInput,
    handleSaveGlobalRate,
    setIsAddOverrideOpen,
    handleDeleteOverride,
  } = useAdminContext()

  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const totalCommissionRevenue = state.commissionTransactions.reduce(
    (acc, tx) => acc + tx.platformCut,
    0,
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Commission &amp; Fees
          </h1>
          <p className="text-slate-500 text-xs">
            Global take-rate tiers, VIP custom overrides, and fee ledger.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white px-3.5 py-1.5 shadow-xs">
          <span className="text-slate-400 text-[10px] block uppercase font-medium">
            Platform Cut (MTD)
          </span>
          <span className="text-emerald-800 font-bold text-sm">
            {formatUsd(totalCommissionRevenue)}
          </span>
        </div>
      </div>

      {/* Global Take-Rate & Custom Overrides Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Global Rate Form */}
        <Card
          padding="lg"
          className="space-y-4 rounded-3xl border border-slate-200/90 bg-white shadow-xs"
        >
          <div className="flex items-center justify-between border-slate-100 border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80">
                <Percent className="h-4 w-4 text-amber-700" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Global Rate</h2>
                <span className="text-slate-400 text-[11px]">Default Tier</span>
              </div>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700">
              Active
            </span>
          </div>

          <form onSubmit={handleSaveGlobalRate} className="space-y-3">
            <NumberField
              label="Platform Take-Rate (%)"
              step={0.1}
              value={parseFloat(globalRateInput.percentage) || 0}
              onChange={(value) =>
                setGlobalRateInput({
                  ...globalRateInput,
                  percentage: String(value),
                })
              }
            />

            <NumberField
              label="Fixed Transaction Fee ($)"
              step={0.05}
              value={parseFloat(globalRateInput.flatFee) || 0}
              onChange={(value) =>
                setGlobalRateInput({
                  ...globalRateInput,
                  flatFee: String(value),
                })
              }
            />

            <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-2.5 text-xs text-slate-600">
              Deducted at capture:{' '}
              <strong className="text-slate-900">
                {globalRateInput.percentage}% + $
                {parseFloat(globalRateInput.flatFee || '0').toFixed(2)}
              </strong>
            </div>

            <Button
              type="submit"
              fullWidth
              className="rounded-xl py-2 font-medium text-xs shadow-xs"
            >
              Save Global Rate
            </Button>
          </form>
        </Card>

        {/* Custom Overrides Table */}
        <Card
          padding="lg"
          className="space-y-4 rounded-3xl border border-slate-200/90 bg-white shadow-xs lg:col-span-2"
        >
          <div className="flex items-center justify-between border-slate-100 border-b pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">VIP Partner Overrides</h2>
              <p className="text-slate-500 text-xs">Custom negotiated commission agreements</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddOverrideOpen(true)}
              className="rounded-xl font-medium text-xs h-8 px-3"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Add Override</span>
            </Button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/90">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-slate-200 border-b bg-slate-50 font-semibold text-slate-700">
                  <th className="px-4 py-2.5">Salon</th>
                  <th className="px-4 py-2.5">Rate</th>
                  <th className="px-4 py-2.5">Note</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {state.commissionOverrides.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-400 text-xs font-sans"
                    >
                      No custom overrides configured. All partners use the global tier.
                    </td>
                  </tr>
                ) : (
                  state.commissionOverrides.map((ov) => (
                    <tr key={ov.salonId} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold font-sans text-slate-900">
                        {ov.salonName}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-800">
                        <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px]">
                          {ov.customRate}% VIP
                        </span>
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-600 text-xs">{ov.note}</td>
                      <td className="px-4 py-3 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => handleDeleteOverride(ov.salonId)}
                          className="rounded-lg p-1 text-slate-400 transition-colors hover:text-rose-600"
                          title="Remove override"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Live Commission Transactions Ledger */}
      <Card
        padding="lg"
        className="space-y-4 rounded-3xl border border-slate-200/90 bg-white shadow-xs"
      >
        <div className="flex items-center justify-between border-slate-100 border-b pb-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Fee Split Ledger</h2>
            <p className="text-slate-500 text-xs">
              Platform fees retained on captured reservations
            </p>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {state.commissionTransactions.length} settled
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/90">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-slate-200 border-b bg-slate-50 font-sans font-semibold text-slate-700">
                <th className="px-4 py-2.5">Txn Ref</th>
                <th className="px-4 py-2.5">Salon</th>
                <th className="px-4 py-2.5">Ticket</th>
                <th className="px-4 py-2.5">Hold</th>
                <th className="px-4 py-2.5">Platform Cut</th>
                <th className="px-4 py-2.5">Net Payout</th>
                <th className="px-4 py-2.5">PayPal Ref</th>
                <th className="px-4 py-2.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.commissionTransactions.map((tx) => (
                <tr key={tx.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-900 font-sans">{tx.id}</td>
                  <td className="px-4 py-3 font-sans text-slate-700">{tx.salonName}</td>
                  <td className="px-4 py-3 text-slate-700">{formatUsd(tx.bookingAmount)}</td>
                  <td className="px-4 py-3 text-amber-800 font-semibold">
                    {formatUsd(tx.capturedFee)}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-800">
                    {formatUsd(tx.platformCut)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {formatUsd(tx.netPayout)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] truncate max-w-[130px]">{tx.paypalRef}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(tx.id, tx.paypalRef)}
                        className="text-slate-400 hover:text-slate-700"
                        title="Copy PayPal Ref"
                      >
                        {copiedId === tx.id ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-400 font-sans">{tx.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
