'use client'

import { Sliders, Sparkles, Star } from 'lucide-react'

import { PrimaryButton } from '@/components/button'
import { Card } from '@/components/ui'
import type { UpdatePopularSettingsRequest } from '@/types/api-org'

interface PopularTuningSectionProps {
  popularForm: UpdatePopularSettingsRequest
  setPopularForm: React.Dispatch<React.SetStateAction<UpdatePopularSettingsRequest>>
  isSaving: boolean
  onSave: () => Promise<void>
}

export function PopularTuningSection({
  popularForm,
  setPopularForm,
  isSaving,
  onSave,
}: PopularTuningSectionProps) {
  const servicePct = ((popularForm.service_weight ?? 0.6) * 100).toFixed(0)
  const orgPct = ((popularForm.org_weight ?? 0.4) * 100).toFixed(0)
  const minRating = (popularForm.min_rating ?? 4.0).toFixed(1)

  return (
    <div className="space-y-6">
      <Card className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
              <Sparkles className="h-3 w-3 text-amber-600" />
              <span>Algorithmic Quality Engine</span>
            </div>
            <h3 className="font-bold text-base text-slate-900">
              Popular Ranking Algorithm Weights &amp; Scoring
            </h3>
            <p className="text-xs text-slate-500">
              The Popular catalog section ranks services dynamically based on authentic customer
              ratings and review volume rather than arbitrary price gates.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-3.5 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-900">Service Rating Weight</label>
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-bold font-mono text-amber-800 text-xs">
                {servicePct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={popularForm.service_weight ?? 0.6}
              onChange={(e) =>
                setPopularForm((p: UpdatePopularSettingsRequest) => ({
                  ...p,
                  service_weight: parseFloat(e.target.value),
                }))
              }
              className="w-full cursor-pointer accent-amber-600"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Weight assigned to specific client reviews for the individual treatment.
            </p>
          </div>

          <div className="space-y-3.5 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-900">Salon Rating Weight</label>
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-bold font-mono text-amber-800 text-xs">
                {orgPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={popularForm.org_weight ?? 0.4}
              onChange={(e) =>
                setPopularForm((p: UpdatePopularSettingsRequest) => ({
                  ...p,
                  org_weight: parseFloat(e.target.value),
                }))
              }
              className="w-full cursor-pointer accent-amber-600"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Weight assigned to overall salon organization reputation and consistency.
            </p>
          </div>

          <div className="space-y-3.5 rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-900">Min Rating Threshold</label>
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-bold font-mono text-amber-800 text-xs">
                {minRating} ★
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={popularForm.min_rating ?? 4.0}
              onChange={(e) =>
                setPopularForm((p: UpdatePopularSettingsRequest) => ({
                  ...p,
                  min_rating: parseFloat(e.target.value),
                }))
              }
              className="w-full cursor-pointer accent-amber-600"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Threshold required for prime placement in consumer popular badges.
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30 p-5 text-slate-700 text-xs shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span>How Popular Ranking Works in the API</span>
          </div>
          <p className="leading-relaxed text-slate-600">
            When clients browse the Popular section, the backend queries approved post-visit reviews
            from verified visits. Scores are calculated as{' '}
            <code className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono font-bold text-[11px] text-amber-900 shadow-2xs">
              (Service Rating × {servicePct}%) + (Salon Rating × {orgPct}%)
            </code>{' '}
            with log volume smoothing so that both top-rated boutique stylists and high-volume
            flagship salons receive fair, balanced representation.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <PrimaryButton
            title="Update Algorithm Tuning"
            size="sm"
            fullWidth={false}
            isLoading={isSaving}
            icon={<Sliders className="h-4 w-4" />}
            onClick={() => void onSave()}
            className="h-10 rounded-xl px-5 font-bold text-xs shadow-xs transition-all hover:shadow-md active:scale-[0.98]"
          />
        </div>
      </Card>
    </div>
  )
}
