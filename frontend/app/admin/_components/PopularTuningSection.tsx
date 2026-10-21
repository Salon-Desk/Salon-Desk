'use client'

import { Sliders, Star } from 'lucide-react'

import { Card } from '@/components/ui'
import PrimaryButton from '@/components/ui/primary-button'
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
      <Card className="space-y-6 border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900">
            Popular Ranking Algorithm Weights &amp; Scoring
          </h3>
          <p className="text-xs text-slate-500">
            The Popular catalog section ranks services dynamically based on authentic customer
            ratings and review volume rather than arbitrary price gates.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-900">Service Rating Weight</label>
              <span className="font-bold font-mono text-amber-600 text-xs">{servicePct}%</span>
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
            <p className="text-[11px] text-slate-500">
              Weight assigned to specific client reviews for the treatment.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-900">Salon Rating Weight</label>
              <span className="font-bold font-mono text-amber-600 text-xs">{orgPct}%</span>
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
            <p className="text-[11px] text-slate-500">
              Weight assigned to overall salon organization reputation.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-900">Min Rating Threshold</label>
              <span className="font-bold font-mono text-amber-600 text-xs">{minRating} ★</span>
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
            <p className="text-[11px] text-slate-500">
              Threshold required for prime placement in popular badges.
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-slate-600 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            How Popular Ranking Works in the API
          </div>
          <p className="leading-relaxed">
            When clients browse the Popular section, the backend queries approved post-visit reviews
            from verified visits. Scores are calculated as{' '}
            <code className="rounded-sm bg-slate-200/80 px-1.5 py-0.5 font-mono text-[11px]">
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
            className="h-9 rounded-lg px-4 font-bold text-xs shadow-xs"
          />
        </div>
      </Card>
    </div>
  )
}
