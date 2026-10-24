'use client'

import { Building2, Eye, Scissors, Sliders, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { StatCard } from '@/components/card'
import { PageHeader } from '@/components/ui'
import { AdminQueryState } from '@/components/ui/query-state-view'
import { toastColor } from '@/constant/toast-color'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useSearchableAdminOrganizations } from '@/hooks/use-searchable-admin-organizations'
import { useSearchableCatalogServices } from '@/hooks/use-searchable-catalog-options'
import {
  useCreateFeaturedItemMutation,
  useDeleteFeaturedItemMutation,
  useGetAdminCurationQuery,
  useUpdateFeaturedItemMutation,
  useUpdateHeroSettingsMutation,
  useUpdatePopularAlgorithmMutation,
  useUploadHeroImageMutation,
} from '@/store/api/platformApi'
import type {
  CreateFeaturedItemRequest,
  FeaturedOrganization,
  FeaturedService,
  UpdateHeroSettingsRequest,
  UpdatePopularSettingsRequest,
} from '@/types/api-org'

import { FeaturedManagerSection } from './FeaturedManagerSection'
import { HeroControllerSection } from './HeroControllerSection'
import { PopularTuningSection } from './PopularTuningSection'

type CurationSection = 'hero' | 'featured' | 'popular'

export function AdminCurationView() {
  const { skipAdminApi } = useAdminSession()

  const {
    data: curation,
    isLoading,
    isError,
    refetch,
  } = useGetAdminCurationQuery(undefined, { skip: skipAdminApi })

  const orgPicker = useSearchableAdminOrganizations({ skip: skipAdminApi, status: 'approved' })
  const servicePicker = useSearchableCatalogServices({ skip: skipAdminApi })
  const approvedOrgs = orgPicker.items
  const catalogServices = servicePicker.items

  const orgListControls = useMemo(
    () => ({
      onSearchChange: orgPicker.setSearch,
      hasMore: orgPicker.hasMore,
      onLoadMore: orgPicker.loadMore,
      isLoadingMore: orgPicker.isFetching,
      total: orgPicker.total,
    }),
    [orgPicker],
  )

  const serviceListControls = useMemo(
    () => ({
      onSearchChange: servicePicker.setSearch,
      hasMore: servicePicker.hasMore,
      onLoadMore: servicePicker.loadMore,
      isLoadingMore: servicePicker.isFetching,
      total: servicePicker.total,
    }),
    [servicePicker],
  )

  // Mutations
  const [updateHero, { isLoading: isSavingHero }] = useUpdateHeroSettingsMutation()
  const [uploadHeroImage, { isLoading: isUploadingHeroImage }] = useUploadHeroImageMutation()
  const [updatePopular, { isLoading: isSavingPopular }] = useUpdatePopularAlgorithmMutation()
  const [createFeatured, { isLoading: isCreatingFeatured }] = useCreateFeaturedItemMutation()
  const [updateFeatured] = useUpdateFeaturedItemMutation()
  const [deleteFeatured] = useDeleteFeaturedItemMutation()

  // Active top-level navigation section
  const [activeSection, setActiveSection] = useState<CurationSection>('hero')

  // Hero form state
  const [heroForm, setHeroForm] = useState<UpdateHeroSettingsRequest>({
    eyebrow: '',
    headline: '',
    highlight: '',
    subtitle: '',
    image_url: '',
    image_alt: '',
    organization_id: '',
    is_active: true,
  })

  // Popular algorithm form state
  const [popularForm, setPopularForm] = useState<UpdatePopularSettingsRequest>({
    min_rating: 4.0,
    org_weight: 0.4,
    service_weight: 0.6,
  })

  // Hydrate local form state when server curation data loads
  useEffect(() => {
    if (curation?.hero) {
      setHeroForm({
        eyebrow: curation.hero.eyebrow,
        headline: curation.hero.headline,
        highlight: curation.hero.highlight,
        subtitle: curation.hero.subtitle,
        image_url: curation.hero.image_url || '',
        image_alt: curation.hero.image_alt || 'Salon services',
        organization_id: curation.hero.organization_id || '',
        is_active: curation.hero.is_active,
      })
    }
    if (curation?.popular_settings) {
      setPopularForm({
        min_rating: curation.popular_settings.min_rating,
        org_weight: curation.popular_settings.org_weight,
        service_weight: curation.popular_settings.service_weight,
      })
    }
  }, [curation])

  // Handlers
  const handleSaveHero = async () => {
    try {
      await updateHero(heroForm).unwrap()
      toast.success('Landing hero banner updated successfully', toastColor.success)
    } catch {
      toast.error('Failed to update hero settings', toastColor.error)
    }
  }

  const handleUploadHeroImage = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await uploadHeroImage(formData).unwrap()
      setHeroForm((prev) => ({
        ...prev,
        image_url: res.image_url,
      }))
      toast.success('Hero image uploaded successfully', toastColor.success)
    } catch (err) {
      const detail = (err as { data?: { detail?: string } })?.data?.detail
      toast.error(detail || 'Failed to upload hero image', toastColor.error)
      throw err
    }
  }

  const handleSavePopular = async () => {
    try {
      await updatePopular(popularForm).unwrap()
      toast.success('Popular ranking algorithm tuned successfully', toastColor.success)
    } catch {
      toast.error('Failed to update popular algorithm settings', toastColor.error)
    }
  }

  const handleCreateFeatured = async (req: CreateFeaturedItemRequest) => {
    try {
      await createFeatured(req).unwrap()
      toast.success(
        req.target_type === 'organization'
          ? 'Salon added to featured showcase'
          : 'Service added to featured showcase',
        toastColor.success,
      )
    } catch {
      toast.error('Failed to feature item', toastColor.error)
    }
  }

  const handleToggleActive = async (item: FeaturedOrganization | FeaturedService) => {
    try {
      await updateFeatured({
        id: item.id,
        body: { is_active: !item.is_active },
      }).unwrap()
      toast.success(
        item.is_active
          ? 'Item paused from featured display'
          : 'Item activated for featured display',
        toastColor.success,
      )
    } catch {
      toast.error('Could not update featured item', toastColor.error)
    }
  }

  const handleDeleteFeatured = async (id: string) => {
    try {
      await deleteFeatured(id).unwrap()
      toast.success('Removed from featured showcase', toastColor.success)
    } catch {
      toast.error('Could not remove featured item', toastColor.error)
    }
  }

  const featuredOrgsCount = curation?.featured_organizations.length ?? 0
  const featuredServicesCount = curation?.featured_services.length ?? 0
  const totalFeaturedCount = featuredOrgsCount + featuredServicesCount

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-12 animate-in fade-in duration-300 sm:space-y-6">
      {/* Header Banner */}
      <PageHeader
        eyebrow="Discovery & Merchandising · Editorial & Algorithm Control"
        title="Marketplace Merchandising & Curation"
        badge={`${totalFeaturedCount} Featured`}
        description="Curate the customer landing hero showcase, spotlight premier partner salons and signature treatments, and fine-tune rating weights for the algorithmic Popular rankings."
        onRefresh={() => void refetch()}
        refreshTitle="Refresh curation configuration"
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          label="Hero Status"
          value={heroForm.is_active ? 'Live Banner' : 'Fallback'}
          icon={Eye}
          tone={heroForm.is_active ? 'emerald' : 'slate'}
          footnote={heroForm.is_active ? 'Published on landing' : 'Standard default mode'}
          className="hover:border-emerald-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Featured Salons"
          value={featuredOrgsCount}
          icon={Building2}
          tone="amber"
          footnote="Spotlight partners"
          className="hover:border-amber-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Featured Services"
          value={featuredServicesCount}
          icon={Scissors}
          tone="purple"
          footnote="Signature treatments"
          className="hover:border-purple-200 hover:shadow-xs transition-all"
        />
        <StatCard
          label="Popular Min Rating"
          value={`${(popularForm.min_rating ?? 4.0).toFixed(1)} ★`}
          icon={Sliders}
          tone="sky"
          footnote="Algorithm quality floor"
          className="hover:border-sky-200 hover:shadow-xs transition-all"
        />
      </div>

      {/* Segmented Section Navigation Tabs */}
      <div className="flex w-full items-center justify-start overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1.5 shadow-2xs backdrop-blur-xs">
        <div className="flex w-full items-center gap-1 sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveSection('hero')}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 font-bold text-xs transition-all active:scale-[0.98] ${
              activeSection === 'hero'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Sparkles
              className={`h-3.5 w-3.5 ${activeSection === 'hero' ? 'text-amber-600' : 'text-slate-400'}`}
            />
            <span>Landing Hero Banner</span>
            <span
              className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                heroForm.is_active
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {heroForm.is_active ? 'Live' : 'Draft'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('featured')}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 font-bold text-xs transition-all active:scale-[0.98] ${
              activeSection === 'featured'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Building2
              className={`h-3.5 w-3.5 ${activeSection === 'featured' ? 'text-amber-600' : 'text-slate-400'}`}
            />
            <span>Featured Showcase</span>
            <span className="rounded-full bg-amber-100 px-1.5 py-0.2 font-mono text-[10px] text-amber-800">
              {totalFeaturedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('popular')}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 font-bold text-xs transition-all active:scale-[0.98] ${
              activeSection === 'popular'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Sliders
              className={`h-3.5 w-3.5 ${activeSection === 'popular' ? 'text-amber-600' : 'text-slate-400'}`}
            />
            <span>Popular Tuning</span>
          </button>
        </div>
      </div>

      <AdminQueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loadingLabel="Loading merchandising configuration…"
        errorLabel="Could not load platform curation settings."
      >
        {activeSection === 'hero' && (
          <HeroControllerSection
            heroForm={heroForm}
            setHeroForm={setHeroForm}
            approvedOrgs={approvedOrgs}
            orgListControls={orgListControls}
            salonCount={curation?.hero.salon_count ?? orgPicker.total}
            serviceCount={curation?.hero.service_count ?? servicePicker.total}
            isSaving={isSavingHero}
            isUploadingImage={isUploadingHeroImage}
            onUploadImage={handleUploadHeroImage}
            onSave={handleSaveHero}
          />
        )}

        {activeSection === 'featured' && (
          <FeaturedManagerSection
            featuredOrgs={curation?.featured_organizations ?? []}
            featuredServices={curation?.featured_services ?? []}
            approvedOrgs={approvedOrgs}
            catalogServices={catalogServices}
            orgListControls={orgListControls}
            serviceListControls={serviceListControls}
            isCreating={isCreatingFeatured}
            onCreate={handleCreateFeatured}
            onToggleActive={handleToggleActive}
            onDelete={handleDeleteFeatured}
          />
        )}

        {activeSection === 'popular' && (
          <PopularTuningSection
            popularForm={popularForm}
            setPopularForm={setPopularForm}
            isSaving={isSavingPopular}
            onSave={handleSavePopular}
          />
        )}
      </AdminQueryState>
    </div>
  )
}
