'use client'

import { ShieldCheck } from 'lucide-react'
import type { Control } from 'react-hook-form'
import { useWatch } from 'react-hook-form'

import type { PolicyChangeFormData } from '../_schemas/settings.schema'

interface PolicyPreviewSummaryProps {
  control: Control<PolicyChangeFormData>
}

export function PolicyPreviewSummary({ control }: PolicyPreviewSummaryProps) {
  const watchedHours = useWatch({ control, name: 'policyHours', defaultValue: '24' })
  const watchedNoShow = useWatch({ control, name: 'noShowFeePercent', defaultValue: 50 })
  const watchedLate = useWatch({ control, name: 'lateCancelFeePercent', defaultValue: 25 })

  return (
    <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
        <ShieldCheck className="h-4 w-4 text-amber-700" />
        <span>Live Customer Consent Terms Preview</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-white/80 p-2 border border-amber-200/60 shadow-2xs">
          <span className="block text-[10px] text-slate-500 uppercase">Notice Cutoff</span>
          <span className="font-bold text-slate-900 text-xs">{watchedHours}h Notice</span>
        </div>
        <div className="rounded-lg bg-white/80 p-2 border border-amber-200/60 shadow-2xs">
          <span className="block text-[10px] text-slate-500 uppercase">Late Cancel</span>
          <span className="font-bold text-amber-900 text-xs">{watchedLate}% Penalty</span>
        </div>
        <div className="rounded-lg bg-white/80 p-2 border border-amber-200/60 shadow-2xs">
          <span className="block text-[10px] text-slate-500 uppercase">No-Show Fee</span>
          <span className="font-bold text-rose-800 text-xs">{watchedNoShow}% Charge</span>
        </div>
      </div>
      <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
        Clients will be required to digitally authorize these terms prior to confirming their
        booking hold via PayPal.
      </p>
    </div>
  )
}
