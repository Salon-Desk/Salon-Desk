'use client'

import { Eye, Save, Sparkles } from 'lucide-react'
import Image from 'next/image'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Card } from '@/components/ui'
import type { ApiOrganization, UpdateHeroSettingsRequest } from '@/types/api-org'

import { HERO_PRESETS, type HeroPreset } from '../_constants/hero-presets'

interface HeroControllerSectionProps {
  heroForm: UpdateHeroSettingsRequest
  setHeroForm: React.Dispatch<React.SetStateAction<UpdateHeroSettingsRequest>>
  approvedOrgs: ApiOrganization[]
  salonCount: number
  serviceCount: number
  isSaving: boolean
  onSave: () => Promise<void>
}

export function HeroControllerSection({
  heroForm,
  setHeroForm,
  approvedOrgs,
  salonCount,
  serviceCount,
  isSaving,
  onSave,
}: HeroControllerSectionProps) {
  const selectedOrg = approvedOrgs.find((o) => o.id === heroForm.organization_id)
  const spotlightSalonName = selectedOrg?.name ?? (approvedOrgs[0]?.name || 'Partner Salons')

  const handleApplyPreset = (preset: HeroPreset) => {
    setHeroForm((prev) => ({
      ...prev,
      eyebrow: preset.eyebrow,
      headline: preset.headline,
      highlight: preset.highlight,
      subtitle: preset.subtitle,
    }))
  }

  return (
    <div className="space-y-6">
      {/* Live Visual Preview */}
      <Card className="overflow-hidden border border-slate-200 bg-white p-0 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Eye className="h-3.5 w-3.5 text-amber-600" />
            Live Hero Banner Preview
          </span>
          <span className="text-[11px] text-slate-500">Reflects client homepage view</span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 items-center gap-6 rounded-2xl border border-stone-200/60 bg-stone-50/80 p-6 lg:grid-cols-12 lg:gap-8">
            <div className="flex flex-col justify-center lg:col-span-7">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="truncate text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  {heroForm.eyebrow || 'SalonDesk Marketplace'}
                </span>
              </div>

              <h2 className="text-2xl font-extrabold leading-tight text-stone-950 sm:text-3xl">
                {heroForm.headline || 'Book salon services with'}{' '}
                <span className="font-serif font-normal italic text-amber-700">
                  {heroForm.highlight || 'zero upfront charge.'}
                </span>
              </h2>

              <p className="mt-2 text-xs leading-relaxed text-stone-600 sm:text-sm">
                {heroForm.subtitle ||
                  'Reserve appointments with PayPal authorization holds. $0 debited today.'}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium text-stone-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  $0 Debited Today
                </span>
                <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium text-stone-700">
                  {salonCount} {salonCount === 1 ? 'salon' : 'salons'}
                </span>
                <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium text-stone-700">
                  {serviceCount} {serviceCount === 1 ? 'service' : 'services'}
                </span>
              </div>
            </div>

            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-stone-200 lg:col-span-5">
              {heroForm.image_url ? (
                <Image
                  src={heroForm.image_url}
                  alt={heroForm.image_alt || 'Hero preview'}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-200 via-stone-100 to-amber-100/50 p-4 text-center">
                  <Sparkles className="h-8 w-8 text-amber-600/60" />
                  <span className="mt-2 text-xs font-medium text-stone-500">
                    Cover photo preview
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 text-white">
                <span className="text-xs font-bold">{spotlightSalonName}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Presets and Editor Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Presets Column */}
        <div className="space-y-4 lg:col-span-4">
          <Card className="border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="mb-2 font-bold text-sm text-slate-900">Quick Presets</h3>
            <p className="mb-4 text-xs text-slate-500">
              Apply proven copy styles tailored for conversion and transparency.
            </p>

            <div className="space-y-2.5">
              {HERO_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-left transition-colors hover:border-amber-400 hover:bg-amber-50/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{preset.name}</span>
                    <span className="font-semibold text-[10px] text-amber-600">Apply</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                    {preset.headline} {preset.highlight}
                  </p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Form Controls Column */}
        <div className="space-y-4 lg:col-span-8">
          <Card className="space-y-4 border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900">Hero Content Configuration</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-semibold text-xs text-slate-700">
                  Eyebrow Label
                </label>
                <input
                  type="text"
                  value={heroForm.eyebrow || ''}
                  onChange={(e) => setHeroForm((p) => ({ ...p, eyebrow: e.target.value }))}
                  placeholder="e.g. SalonDesk Marketplace"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-xs text-slate-700">
                  Featured Salon Override
                </label>
                <select
                  value={heroForm.organization_id || ''}
                  onChange={(e) =>
                    setHeroForm((p) => ({ ...p, organization_id: e.target.value || null }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
                >
                  <option value="">Dynamic (Top Rated / Alphabetical)</option>
                  {approvedOrgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-semibold text-xs text-slate-700">
                  Headline Primary Text
                </label>
                <input
                  type="text"
                  value={heroForm.headline || ''}
                  onChange={(e) => setHeroForm((p) => ({ ...p, headline: e.target.value }))}
                  placeholder="e.g. Book salon services with"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-xs text-slate-700">
                  Headline Accent Highlight (Gold / Italic)
                </label>
                <input
                  type="text"
                  value={heroForm.highlight || ''}
                  onChange={(e) => setHeroForm((p) => ({ ...p, highlight: e.target.value }))}
                  placeholder="e.g. zero upfront charge."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-xs text-slate-700">
                Hero Subtitle / Value Pitch
              </label>
              <textarea
                rows={3}
                value={heroForm.subtitle || ''}
                onChange={(e) => setHeroForm((p) => ({ ...p, subtitle: e.target.value }))}
                placeholder="Explain authorization holds and zero debit policy..."
                className="w-full rounded-lg border border-slate-200 p-3 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-xs text-slate-700">
                Hero Banner Image URL
              </label>
              <input
                type="url"
                value={heroForm.image_url || ''}
                onChange={(e) => setHeroForm((p) => ({ ...p, image_url: e.target.value }))}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Leave empty to use the featured salon&apos;s profile cover image automatically.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <label className="flex cursor-pointer items-center gap-2 font-semibold text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={heroForm.is_active ?? true}
                  onChange={(e) => setHeroForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                Custom Hero Active (override standard marketplace fallback)
              </label>

              <PrimaryButton
                title="Save Hero Settings"
                size="sm"
                fullWidth={false}
                isLoading={isSaving}
                icon={<Save className="h-4 w-4" />}
                onClick={() => void onSave()}
                className="h-9 rounded-lg px-4 font-bold text-xs shadow-xs"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
