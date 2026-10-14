"use client";

import { Percent, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  FormActions,
  NumberField,
  SectionHeading,
} from "@/components/ui";
import { formatUsd } from "@/lib/format";
import type { CommissionOverride, CommissionTransaction } from "@/types";

interface CommissionTabProps {
  globalRateInput: { percentage: string; flatFee: string };
  onGlobalRateInputChange: (next: {
    percentage: string;
    flatFee: string;
  }) => void;
  onSaveGlobalRate: (event: React.FormEvent) => void;
  overrides: CommissionOverride[];
  transactions: CommissionTransaction[];
  onAddOverride: () => void;
  onDeleteOverride: (salonId: string) => void;
}

export function CommissionTab({
  globalRateInput,
  onGlobalRateInputChange,
  onSaveGlobalRate,
  overrides,
  transactions,
  onAddOverride,
  onDeleteOverride,
}: CommissionTabProps) {
  return (
    <div className="mx-auto w-full max-w-7xl animate-in space-y-8 duration-200 fade-in">
      <div>
        <h2 className="font-bold text-slate-900 text-xl">
          Platform Commission &amp; Fee Rails
        </h2>
        <p className="text-slate-600 text-xs">
          Configure global platform fee parameters, grant custom VIP salon
          partner rate overrides, and audit fee capture.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-amber-600" />
            <SectionHeading size="sm" title="Global Platform Fee Tier" />
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Default fee assessed on completed tickets and captured no-show
            deposits.
          </p>

          <form onSubmit={onSaveGlobalRate} className="space-y-3 pt-2">
            <NumberField
              label="Percentage Rate (%)"
              step={0.1}
              value={parseFloat(globalRateInput.percentage) || 0}
              onChange={(value) =>
                onGlobalRateInputChange({
                  ...globalRateInput,
                  percentage: String(value),
                })
              }
            />

            <NumberField
              label="Fixed Fee Per Transaction ($)"
              step={0.05}
              value={parseFloat(globalRateInput.flatFee) || 0}
              onChange={(value) =>
                onGlobalRateInputChange({
                  ...globalRateInput,
                  flatFee: String(value),
                })
              }
            />

            <FormActions>
              <Button type="submit" fullWidth>
                Save Global Rate
              </Button>
            </FormActions>
          </form>
        </Card>

        <Card padding="lg" className="space-y-4 lg:col-span-2">
          <SectionHeading
            size="sm"
            title="Partner Commission Overrides"
            description="Tailored fee agreements for high-volume franchises or VIP pilot salons."
            action={
              <Button variant="secondary" onClick={onAddOverride}>
                <Plus className="h-3.5 w-3.5" />
                <span>Add Custom Override</span>
              </Button>
            }
          />

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-slate-200 border-b bg-slate-50 font-semibold text-slate-700">
                  <th className="px-4 py-2.5">Salon Partner</th>
                  <th className="px-4 py-2.5">Custom Rate</th>
                  <th className="px-4 py-2.5">Agreement Notes</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {overrides.map((ov) => (
                  <tr
                    key={ov.salonId}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-bold font-sans text-slate-900">
                      {ov.salonName}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      {ov.customRate}%
                    </td>
                    <td className="px-4 py-3 font-sans text-[11px] text-slate-600">
                      {ov.note}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteOverride(ov.salonId)}
                        className="text-slate-400 transition-colors hover:text-rose-600"
                        title="Delete override"
                      >
                        <Trash2 className="inline h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card padding="lg" className="space-y-4">
        <SectionHeading size="sm" title="Platform Commission Ledger" />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-slate-200 border-b bg-slate-50 font-sans font-semibold text-slate-700">
                <th className="px-4 py-2.5">Txn ID</th>
                <th className="px-4 py-2.5">Salon</th>
                <th className="px-4 py-2.5">Ticket Amount</th>
                <th className="px-4 py-2.5">Captured</th>
                <th className="px-4 py-2.5">Platform Fee Cut</th>
                <th className="px-4 py-2.5">Net Payout to Salon</th>
                <th className="px-4 py-2.5">PayPal Ref</th>
                <th className="px-4 py-2.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-amber-700">
                    {tx.id}
                  </td>
                  <td className="px-4 py-3 font-medium font-sans text-slate-900">
                    {tx.salonName}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatUsd(tx.bookingAmount)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatUsd(tx.capturedFee)}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-700">
                    +{formatUsd(tx.platformCut)}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {formatUsd(tx.netPayout)}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-500">
                    {tx.paypalRef}
                  </td>
                  <td className="px-4 py-3 font-sans text-[11px] text-slate-500">
                    {tx.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
