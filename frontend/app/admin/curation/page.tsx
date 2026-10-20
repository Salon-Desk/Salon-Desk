'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { toastColor } from '@/constant/toast-color'
import { useAdminSession } from '@/hooks/use-admin-session'
import { useGetCatalogServicesQuery } from '@/store/api/clientApi'
import {
  useCreateFeaturedItemMutation,
  useDeleteFeaturedItemMutation,
  useGetAdminCurationQuery,
  useGetAdminOrganizationsQuery,
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

import { AdminQueryState } from '../_components/admin-query-state'
import { FeaturedManagerSection } from './_components/featured-manager-section'
import { HeroControllerSection } from './_components/hero-controller-section'
import { PopularTuningSection } from './_components/popular-tuning-section'

type CurationSection = 'hero' | 'featured' | 'popular'

export default function AdminCurationPage() {
  const { skipAdminApi } = useAdminSession()

  const {
    data: curation,
    isLoading,
    isError,
    refetch,
  } = useGetAdminCurationQuery(undefined, { skip: skipAdminApi })

  const { data: orgsData } = useGetAdminOrganizationsQuery(
    { page_size: 100 },
    { skip: skipAdminApi },
  )
  const approvedOrgs = (orgsData?.items ?? []).filter((o) => o.status.toLowerCase() === 'approved')

  const { data: servicesData } = useGetCatalogServicesQuery(
    { page_size: 50 },
    { skip: skipAdminApi },
  )
  const catalogServices = servicesData?.items ?? []

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

  const totalFeaturedCount =
    (curation?.featured_organizations.length ?? 0) + (curation?.featured_services.length ?? 0)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Discovery &amp; Merchandising Controller
          </h1>
          <p className="text-slate-500 text-xs">
            Control the client landing hero banner, featured showcases, and rating-based popular
            rankings.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-200/70 p-1">
          <button
            type="button"
            onClick={() => setActiveSection('hero')}
            className={`cursor-pointer rounded-lg px-3 py-1.5 font-semibold text-xs transition-all ${
              activeSection === 'hero'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Landing Hero
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('featured')}
            className={`cursor-pointer rounded-lg px-3 py-1.5 font-semibold text-xs transition-all ${
              activeSection === 'featured'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Featured Items ({totalFeaturedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('popular')}
            className={`cursor-pointer rounded-lg px-3 py-1.5 font-semibold text-xs transition-all ${
              activeSection === 'popular'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Popular Tuning
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
            salonCount={curation?.hero.salon_count ?? approvedOrgs.length}
            serviceCount={curation?.hero.service_count ?? catalogServices.length}
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
