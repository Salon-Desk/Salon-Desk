'use client'

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Image as ImageIcon,
  Info,
  Link2,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Store,
  Trash2,
  Type,
  UploadCloud,
} from 'lucide-react'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Card, SearchableSelect } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import type { ApiOrganization, UpdateHeroSettingsRequest } from '@/types/api-org'
import type { SearchableListControls } from '@/types/searchable-list-controls'

import { HERO_PRESETS, type HeroPreset } from '../_constants/hero-presets'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

interface HeroControllerSectionProps {
  heroForm: UpdateHeroSettingsRequest
  setHeroForm: React.Dispatch<React.SetStateAction<UpdateHeroSettingsRequest>>
  approvedOrgs: ApiOrganization[]
  salonCount: number
  serviceCount: number
  isSaving: boolean
  isUploadingImage?: boolean
  onUploadImage?: (file: File) => Promise<void>
  onSave: () => Promise<void>
  orgListControls?: SearchableListControls
}

export function HeroControllerSection({
  heroForm,
  setHeroForm,
  approvedOrgs,
  salonCount,
  serviceCount,
  isSaving,
  isUploadingImage = false,
  onUploadImage,
  onSave,
  orgListControls,
}: HeroControllerSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showUrlFallback, setShowUrlFallback] = useState(false)
  const [localUploading, setLocalUploading] = useState(false)

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
    toast.success(`Applied "${preset.name}" preset`, toastColor.info)
  }

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP, or AVIF)', toastColor.error)
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('Image file must be 10MB or smaller', toastColor.error)
      return
    }

    if (!onUploadImage) {
      // Create local object URL for preview if no upload handler
      const previewUrl = URL.createObjectURL(file)
      setHeroForm((prev) => ({ ...prev, image_url: previewUrl }))
      return
    }

    try {
      setLocalUploading(true)
      await onUploadImage(file)
    } finally {
      setLocalUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      void handleProcessFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      void handleProcessFile(file)
    }
  }

  const handleRemoveImage = () => {
    setHeroForm((prev) => ({ ...prev, image_url: '' }))
    toast.info('Reverted to dynamic salon cover image', toastColor.info)
  }

  const isUploading = isUploadingImage || localUploading
  const subtitleLength = (heroForm.subtitle || '').length

  return (
    <div className="space-y-6">
      {/* 1. Live Visual Preview */}
      <Card className="overflow-hidden border border-slate-200/80 bg-white p-0 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-700">
              <Eye className="h-3.5 w-3.5" />
            </span>
            <span className="font-bold text-slate-800 text-xs sm:text-sm">
              Live Hero Banner Preview
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-[10px] ${
                heroForm.is_active
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 ring-1 ring-slate-300'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  heroForm.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              {heroForm.is_active ? 'Published' : 'Draft / Fallback Mode'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Real-time reflection of client landing hero
          </span>
        </div>

        <div className="p-4 sm:p-6">
          <div className="relative grid grid-cols-1 items-center gap-6 overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-50/90 p-6 shadow-inner lg:grid-cols-12 lg:gap-8">
            <div className="flex flex-col justify-center lg:col-span-7">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="truncate text-[11px] font-bold uppercase tracking-widest text-stone-500">
                  {heroForm.eyebrow || 'SalonDesk Marketplace'}
                </span>
              </div>

              <h2 className="font-extrabold text-2xl text-stone-950 leading-tight sm:text-3xl">
                {heroForm.headline || 'Book salon services with'}{' '}
                <span className="font-normal font-serif italic text-amber-700">
                  {heroForm.highlight || 'zero upfront charge.'}
                </span>
              </h2>

              <p className="mt-2 text-xs text-stone-600 leading-relaxed sm:text-sm">
                {heroForm.subtitle ||
                  'Reserve appointments with PayPal authorization holds. $0 debited today.'}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium text-[11px] text-stone-700 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  $0 Debited Today
                </span>
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 font-medium text-[11px] text-stone-700 shadow-2xs">
                  {salonCount} {salonCount === 1 ? 'salon' : 'salons'}
                </span>
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 font-medium text-[11px] text-stone-700 shadow-2xs">
                  {serviceCount} {serviceCount === 1 ? 'service' : 'services'}
                </span>
              </div>
            </div>

            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-stone-200 shadow-md lg:col-span-5">
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
                  <span className="mt-2 font-medium text-stone-600 text-xs">
                    Dynamic Salon Cover Photo
                  </span>
                  <span className="mt-0.5 text-[10px] text-stone-400">
                    Falling back to partner picture
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent" />
              <div className="absolute bottom-3 left-3 text-white">
                <span className="font-bold text-xs drop-shadow-xs">{spotlightSalonName}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid: Quick Presets on Left, Form Configuration on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Presets Column */}
        <div className="space-y-4 lg:col-span-4">
          <Card className="border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Marketing Presets</h3>
            </div>
            <p className="mb-4 text-slate-500 text-xs leading-relaxed">
              Curated messaging patterns optimized for consumer trust, zero-upfront holds, and
              conversions.
            </p>

            <div className="space-y-2.5">
              {HERO_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="group relative w-full cursor-pointer rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 text-left transition-all hover:border-amber-400 hover:bg-amber-50/30 hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs group-hover:text-amber-900">
                      {preset.name}
                    </span>
                    <span className="rounded-md bg-white px-2 py-0.5 font-semibold text-[10px] text-amber-700 shadow-2xs group-hover:bg-amber-100">
                      Apply
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[11px] text-slate-500 leading-normal">
                    <span className="font-medium text-slate-700">{preset.headline}</span>{' '}
                    <span className="italic text-amber-700">{preset.highlight}</span>
                  </p>
                </button>
              ))}
            </div>
          </Card>

          {/* Tips card */}
          <Card className="border border-amber-200/60 bg-amber-50/40 p-4 text-xs text-amber-900">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold text-[11px] text-amber-950 uppercase tracking-wide">
                  Image Best Practice
                </p>
                <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
                  Use landscape imagery with a clean background. The client landing page adds a soft
                  darkening gradient for readability.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Form Controls Column */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card: Hero Visual Asset (File Upload Zone) */}
          <Card className="space-y-4 border border-slate-200/90 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-50 text-sky-600">
                  <ImageIcon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Hero Background Visual</h3>
                  <p className="text-[11px] text-slate-500">
                    Upload a high-resolution banner photo for the customer landing view.
                  </p>
                </div>
              </div>

              {heroForm.image_url && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1 font-semibold text-[11px] text-red-600 hover:bg-red-100/60"
                  title="Revert to dynamic partner salon cover"
                >
                  <Trash2 className="h-3 w-3" />
                  Revert to Default
                </button>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                isDragOver
                  ? 'border-amber-500 bg-amber-50/50 ring-4 ring-amber-100'
                  : heroForm.image_url
                    ? 'border-slate-200/80 bg-slate-50/40 hover:border-amber-400 hover:bg-amber-50/20'
                    : 'border-slate-300 bg-slate-50/60 hover:border-amber-500 hover:bg-amber-50/30'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                  <p className="mt-2 font-bold text-slate-800 text-xs">
                    Uploading hero image to storage…
                  </p>
                  <p className="text-[11px] text-slate-400">Processing file</p>
                </div>
              ) : heroForm.image_url ? (
                <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-2xs">
                      <Image
                        src={heroForm.image_url}
                        alt="Current hero"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="font-bold text-slate-800 text-xs">
                          Custom Banner Active
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 max-w-xs text-[11px] text-slate-400">
                        {heroForm.image_url}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 text-xs shadow-2xs hover:border-amber-400 hover:bg-slate-50"
                    >
                      <RefreshCw className="mr-1 inline h-3 w-3 text-slate-500" />
                      Replace
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-2">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100/70 text-amber-700 shadow-2xs">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <p className="font-bold text-slate-800 text-xs">
                    <span className="text-amber-700 underline decoration-amber-400 underline-offset-2">
                      Click to browse
                    </span>{' '}
                    or drag &amp; drop your image here
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    PNG, JPG, WebP, or AVIF (up to 10MB). Recommended: 1920×1080 (16:9).
                  </p>
                </div>
              )}
            </div>

            {/* Manual Image URL override & Image Alt */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <button
                type="button"
                onClick={() => setShowUrlFallback((prev) => !prev)}
                className="flex w-full cursor-pointer items-center justify-between text-left font-semibold text-[11px] text-slate-600 hover:text-slate-900"
              >
                <span className="flex items-center gap-1.5">
                  <Link2 className="h-3 w-3 text-slate-400" />
                  Advanced: Manual URL &amp; Accessibility (Alt Text)
                </span>
                {showUrlFallback ? (
                  <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>

              {showUrlFallback && (
                <div className="mt-3 space-y-3 pt-2">
                  <div>
                    <label className="mb-1 block font-semibold text-[11px] text-slate-700">
                      External Image URL Override
                    </label>
                    <input
                      type="url"
                      value={heroForm.image_url || ''}
                      onChange={(e) => setHeroForm((p) => ({ ...p, image_url: e.target.value }))}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-hidden"
                    />
                    <p className="mt-1 text-[10px] text-slate-400">
                      Optionally paste an image hosted on an external CDN or image provider.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-[11px] text-slate-700">
                      Image Alt Text (for SEO &amp; Screen Readers)
                    </label>
                    <input
                      type="text"
                      value={heroForm.image_alt || ''}
                      onChange={(e) => setHeroForm((p) => ({ ...p, image_alt: e.target.value }))}
                      placeholder="e.g. Modern luxury salon interior with stylist station"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Card: Messaging & Copywriting */}
          <Card className="space-y-4 border border-slate-200/90 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                <Type className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Copywriting &amp; Value Pitch</h3>
                <p className="text-[11px] text-slate-500">
                  Fine-tune the brand story, zero-upfront policy, and primary headline.
                </p>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="font-semibold text-slate-700 text-xs">
                  Eyebrow Category Label
                </label>
                <span className="text-[10px] text-slate-400">Top-level badge</span>
              </div>
              <input
                type="text"
                value={heroForm.eyebrow || ''}
                onChange={(e) => setHeroForm((p) => ({ ...p, eyebrow: e.target.value }))}
                placeholder="e.g. SalonDesk Marketplace"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-semibold text-slate-700 text-xs">
                    Headline Primary Text
                  </label>
                  <span className="text-[10px] text-slate-400">Regular bold</span>
                </div>
                <input
                  type="text"
                  value={heroForm.headline || ''}
                  onChange={(e) => setHeroForm((p) => ({ ...p, headline: e.target.value }))}
                  placeholder="e.g. Book salon services with"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-semibold text-slate-700 text-xs">
                    Accent Highlight Word(s)
                  </label>
                  <span className="rounded-sm bg-amber-50 px-1.5 py-0.5 font-semibold text-[10px] text-amber-700">
                    Italic Serif
                  </span>
                </div>
                <input
                  type="text"
                  value={heroForm.highlight || ''}
                  onChange={(e) => setHeroForm((p) => ({ ...p, highlight: e.target.value }))}
                  placeholder="e.g. zero upfront charge."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-serif italic text-amber-800 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="font-semibold text-slate-700 text-xs">
                  Hero Subtitle / Value Pitch
                </label>
                <span
                  className={`text-[10px] ${
                    subtitleLength > 150 ? 'font-bold text-amber-600' : 'text-slate-400'
                  }`}
                >
                  {subtitleLength} characters (recommended ~80–120)
                </span>
              </div>
              <textarea
                rows={3}
                value={heroForm.subtitle || ''}
                onChange={(e) => setHeroForm((p) => ({ ...p, subtitle: e.target.value }))}
                placeholder="Reserve appointments with PayPal authorization holds. $0 debited today."
                className="w-full rounded-lg border border-slate-200 p-3 text-xs leading-relaxed text-slate-800 focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </Card>

          {/* Card: Partner Spotlight & Publication Settings */}
          <Card className="space-y-5 border border-slate-200/90 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                <Store className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Partner Spotlight &amp; Publication
                </h3>
                <p className="text-[11px] text-slate-500">
                  Target a specific partner salon for the spotlight card and toggle live
                  availability.
                </p>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="font-semibold text-slate-700 text-xs">
                  Featured Salon Override
                </label>
                <span className="text-[10px] text-slate-400">Searchable dropdown</span>
              </div>
              <SearchableSelect
                value={heroForm.organization_id || ''}
                onChange={(val) => setHeroForm((p) => ({ ...p, organization_id: val || null }))}
                options={approvedOrgs.map((org) => ({
                  value: org.id,
                  label: org.name,
                  description: org.description || undefined,
                }))}
                placeholder="Dynamic (Top Rated / Alphabetical)"
                clearLabel="Dynamic (Top Rated / Alphabetical)"
                allowClear
                searchPlaceholder="Search approved partner salons..."
                emptyText="No matching salons found."
                triggerClassName="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 hover:border-slate-300 focus:border-amber-500"
                contentClassName="w-[min(calc(100vw-2rem),24rem)]"
                onSearchChange={orgListControls?.onSearchChange}
                hasMore={orgListControls?.hasMore}
                onLoadMore={orgListControls?.onLoadMore}
                isLoadingMore={orgListControls?.isLoadingMore}
                loadMoreLabel="Load more salons"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                When selected, the spotlight badge will highlight this specific salon. If no custom
                image is uploaded, its cover photo will be featured.
              </p>
            </div>

            <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={heroForm.is_active ?? true}
                  onChange={(e) => setHeroForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded-sm border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="block font-bold text-slate-800 text-xs">
                    Publish Custom Hero Banner
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    When active, client landing page displays this configured hero. When inactive,
                    it falls back to standard marketplace defaults.
                  </span>
                </div>
              </label>

              <PrimaryButton
                title="Save Hero Settings"
                size="sm"
                fullWidth={false}
                isLoading={isSaving}
                icon={<Save className="h-4 w-4" />}
                onClick={() => void onSave()}
                className="h-9 shrink-0 rounded-lg px-5 font-bold text-xs shadow-xs"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
