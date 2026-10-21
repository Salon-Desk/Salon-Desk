'use client'

import { Clock, CreditCard, FileText, Shield, ShieldAlert, Sliders } from 'lucide-react'

import { Card } from '@/components/ui'
import PrimaryButton from '@/components/ui/primary-button'
import { formatUsd } from '@/lib/format'
import type { ApiCancellationPolicy } from '@/types/api-org'

interface MerchantPolicyCardProps {
  policies: ApiCancellationPolicy[]
  activePolicy?: ApiCancellationPolicy
  orgName?: string
  policyHours: number
  noShowFeePercent: number
  lateCancelFeePercent: number
  holdPercent: number
  flatNoShowFee?: number
  submitting: boolean
  onRequestChange: () => void
}

export function MerchantPolicyCard({
  policies,
  activePolicy,
  orgName,
  policyHours,
  noShowFeePercent,
  lateCancelFeePercent,
  holdPercent,
  flatNoShowFee,
  submitting,
  onRequestChange,
}: MerchantPolicyCardProps) {
  const resolvedOrgName = activePolicy?.org_name || orgName || 'Salon'

  return (
    <div className="space-y-6">
      <Card
        padding="lg"
        className="space-y-5 rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-900 shadow-2xs">
              <Shield className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {activePolicy?.name || 'Standard 24h Policy'}
              </h2>
              <p className="text-xs text-slate-500">
                Enforced cancellation window &amp; no-show guarantee terms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-800">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              {activePolicy?.status || 'active'}
            </span>
          </div>
        </div>

        {/* Organization & Policy Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Salon:</span>
            <span className="font-bold text-slate-900">{resolvedOrgName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Policy ID:</span>
            <span className="font-mono text-slate-600">
              {activePolicy?.id ? activePolicy.id.slice(0, 13) + '…' : '—'}
            </span>
          </div>
          {activePolicy?.created_at ? (
            <div className="flex items-center gap-2 text-slate-400">
              <span>Effective:</span>
              <span className="text-slate-700">
                {new Date(activePolicy.created_at).toLocaleDateString()}
              </span>
            </div>
          ) : null}
        </div>

        {/* 4-Item Policy Rule Metric Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-slate-500">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>Free Notice</span>
            </div>
            <div className="font-mono text-base font-bold text-slate-900">≥ {policyHours}h</div>
            <span className="block text-[10px] leading-tight text-slate-500">
              Cutoff for 100% free cancellation
            </span>
          </div>

          <div className="space-y-1 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-slate-500">
              <ShieldAlert className="h-3 w-3 text-rose-500" />
              <span>No-Show Fee</span>
            </div>
            <div className="font-mono text-base font-bold text-rose-800">
              {flatNoShowFee ? formatUsd(flatNoShowFee) : `${noShowFeePercent}%`}
            </div>
            <span className="block text-[10px] leading-tight text-slate-500">
              Retained on unannounced missed slot
            </span>
          </div>

          <div className="space-y-1 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-slate-500">
              <Sliders className="h-3 w-3 text-amber-600" />
              <span>Late Cancel</span>
            </div>
            <div className="font-mono text-base font-bold text-amber-900">
              {lateCancelFeePercent}%
            </div>
            <span className="block text-[10px] leading-tight text-slate-500">
              Captured if cancelled past notice window
            </span>
          </div>

          <div className="space-y-1 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-slate-500">
              <CreditCard className="h-3 w-3 text-emerald-600" />
              <span>Hold Share</span>
            </div>
            <div className="font-mono text-base font-bold text-emerald-800">{holdPercent}%</div>
            <span className="block text-[10px] leading-tight text-slate-500">
              Zero-debit hold capacity at checkout
            </span>
          </div>
        </div>

        {/* Sample Customer Agreement Card */}
        <div className="space-y-2 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-4 text-xs">
          <div className="flex items-center gap-2 font-semibold text-amber-950">
            <FileText className="h-4 w-4 text-amber-700" />
            <span>Client Checkout Consent Agreement</span>
          </div>
          <p className="rounded-lg border border-amber-200/60 bg-white/70 p-3 font-serif text-[11px] italic leading-relaxed text-amber-900/90">
            &ldquo;I authorize a {holdPercent}% zero-debit PayPal hold for this reservation at{' '}
            {resolvedOrgName}. I understand cancellations made at least {policyHours} hours prior
            incur no charge. Cancellations within {policyHours} hours incur a {lateCancelFeePercent}
            % late cancellation fee. Missed appointments incur a{' '}
            {flatNoShowFee ? formatUsd(flatNoShowFee) : `${noShowFeePercent}%`} no-show fee settled
            to the salon.&rdquo;
          </p>
        </div>

        {/* All Policies List if multiple exist */}
        {policies.length > 1 ? (
          <div className="space-y-2 border-t border-slate-100 pt-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
              All Configured Salon Policies ({policies.length})
            </span>
            <div className="space-y-2">
              {policies.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/60 p-2.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{p.name}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">
                      {Number(p.data?.free_cancel_hours || 24)}h notice ·{' '}
                      {Number(p.data?.no_show_fee_percent || 50)}% no-show
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                      p.status?.toLowerCase() === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col items-center justify-between gap-1 pt-2 md:flex-row">
          <PrimaryButton
            title="Request Policy Amendment"
            variant="outline"
            size="sm"
            isDisabled={submitting}
            onClick={onRequestChange}
            icon={<Sliders className="h-3.5 w-3.5" />}
            className="h-10 rounded-xl text-xs font-semibold w-1/2"
          />
          <span className="text-[11px] text-slate-400">Requires platform compliance review</span>
        </div>
      </Card>
    </div>
  )
}
