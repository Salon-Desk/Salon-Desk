'use client'

import { Building2, Plus, Scissors, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Badge, Card, EmptyState, IconButton, SearchableSelect } from '@/components/ui'
import type {
  ApiOrganization,
  CatalogService,
  CreateFeaturedItemRequest,
  FeaturedOrganization,
  FeaturedService,
} from '@/types/api-org'
import type { SearchableListControls } from '@/types/searchable-list-controls'

export type FeaturedTab = 'organizations' | 'services'

interface FeaturedManagerSectionProps {
  featuredOrgs: FeaturedOrganization[]
  featuredServices: FeaturedService[]
  approvedOrgs: ApiOrganization[]
  catalogServices: CatalogService[]
  isCreating: boolean
  onCreate: (req: CreateFeaturedItemRequest) => Promise<void>
  onToggleActive: (item: FeaturedOrganization | FeaturedService) => Promise<void>
  onDelete: (id: string) => Promise<void>
  orgListControls?: SearchableListControls
  serviceListControls?: SearchableListControls
}

export function FeaturedManagerSection({
  featuredOrgs,
  featuredServices,
  approvedOrgs,
  catalogServices,
  isCreating,
  onCreate,
  onToggleActive,
  onDelete,
  orgListControls,
  serviceListControls,
}: FeaturedManagerSectionProps) {
  const [tab, setTab] = useState<FeaturedTab>('organizations')
  const [targetId, setTargetId] = useState('')
  const [badgeText, setBadgeText] = useState('Premier Partner')
  const [displayOrder, setDisplayOrder] = useState(0)

  const handleTabChange = (nextTab: FeaturedTab) => {
    setTab(nextTab)
    setTargetId('')
    setBadgeText(nextTab === 'organizations' ? 'Premier Partner' : "Editor's Choice")
    setDisplayOrder(0)
  }

  const handleSubmit = async () => {
    if (!targetId) return
    await onCreate({
      target_type: tab === 'organizations' ? 'organization' : 'service',
      target_id: targetId,
      badge_text: badgeText.trim() || 'Featured',
      display_order: Number(displayOrder) || 0,
      is_active: true,
    })
    setTargetId('')
    setDisplayOrder(0)
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 border border-slate-200 bg-white p-6 shadow-xs">
        {/* Header & Sub-Tabs */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Featured Showcase Manager</h3>
            <p className="text-xs text-slate-500">
              Curate spotlight salons or specific signature services on the client landing page.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTabChange('organizations')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold text-xs transition-all ${
                tab === 'organizations'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Featured Salons ({featuredOrgs.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('services')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold text-xs transition-all ${
                tab === 'services'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Scissors className="h-3.5 w-3.5" />
              Featured Services ({featuredServices.length})
            </button>
          </div>
        </div>

        {/* Add New Featured Item Form */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
          <h4 className="mb-3 flex items-center gap-1.5 font-bold text-amber-950 text-xs">
            <Plus className="h-4 w-4 text-amber-600" />
            {tab === 'organizations' ? 'Add Featured Salon' : 'Add Featured Single Service'}
          </h4>

          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <label className="mb-1 block font-semibold text-[11px] text-slate-700">
                {tab === 'organizations' ? 'Select Salon' : 'Select Service'}
              </label>
              <SearchableSelect
                value={targetId}
                onChange={setTargetId}
                options={
                  tab === 'organizations'
                    ? approvedOrgs.map((org) => ({
                        value: org.id,
                        label: org.name,
                        description: org.description || undefined,
                      }))
                    : catalogServices.map((svc) => ({
                        value: svc.id,
                        label: svc.name,
                        badge: `$${svc.base_price}`,
                        description: `${svc.organization_name || 'Salon'} • ${svc.duration_minutes}m`,
                      }))
                }
                placeholder={
                  tab === 'organizations'
                    ? '-- Choose Approved Salon --'
                    : '-- Choose Active Service --'
                }
                searchPlaceholder={
                  tab === 'organizations'
                    ? 'Search salons by name or address...'
                    : 'Search services by title or salon...'
                }
                emptyText={
                  tab === 'organizations'
                    ? 'No approved salons found.'
                    : 'No active services found.'
                }
                triggerClassName="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 hover:border-slate-300 focus:border-amber-500"
                contentClassName="w-[min(calc(100vw-2rem),24rem)]"
                onSearchChange={
                  tab === 'organizations'
                    ? orgListControls?.onSearchChange
                    : serviceListControls?.onSearchChange
                }
                hasMore={
                  tab === 'organizations' ? orgListControls?.hasMore : serviceListControls?.hasMore
                }
                onLoadMore={
                  tab === 'organizations'
                    ? orgListControls?.onLoadMore
                    : serviceListControls?.onLoadMore
                }
                isLoadingMore={
                  tab === 'organizations'
                    ? orgListControls?.isLoadingMore
                    : serviceListControls?.isLoadingMore
                }
                loadMoreLabel={tab === 'organizations' ? 'Load more salons' : 'Load more services'}
              />
            </div>

            <div className="sm:col-span-4">
              <label className="mb-1 block font-semibold text-[11px] text-slate-700">
                Badge Text / Tag
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g. Editor's Choice, Trending, Staff Pick"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="mb-1 block font-semibold text-[11px] text-slate-700">Order</label>
              <input
                type="number"
                min={0}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <PrimaryButton
                title="Add to Spotlight"
                size="sm"
                fullWidth
                isDisabled={!targetId}
                isLoading={isCreating}
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => void handleSubmit()}
                className="h-9 rounded-lg font-bold text-xs shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3 pt-2">
          {tab === 'organizations' ? (
            featuredOrgs.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No featured salons yet"
                description="Feature partner salons above to give them priority placement on the client discovery feed."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {featuredOrgs.map((item) => {
                  const hasRating =
                    typeof item.organization.rating_avg === 'number' &&
                    item.organization.rating_avg > 0
                  const reviewCount = item.organization.review_count ?? 0

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs transition-all hover:border-slate-300"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {item.organization.picture ? (
                            <Image
                              src={item.organization.picture}
                              alt={item.organization.name}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <Building2 className="m-auto mt-3 h-6 w-6 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-bold text-xs text-slate-900">
                              {item.organization.name}
                            </span>
                            <Badge tone="amber" className="px-1.5 py-0 text-[10px]">
                              {item.badge_text}
                            </Badge>
                          </div>
                          <p className="truncate text-[11px] text-slate-500">
                            {item.organization.physical_address || 'Partner location'}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                            <span>Order #{item.display_order}</span>
                            <span>•</span>
                            {hasRating ? (
                              <span className="flex items-center font-medium text-amber-600">
                                ★ {item.organization.rating_avg?.toFixed(1)}{' '}
                                {reviewCount > 0 ? `(${reviewCount})` : ''}
                              </span>
                            ) : (
                              <span className="text-slate-400">New Partner</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="ml-2 flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void onToggleActive(item)}
                          title={
                            item.is_active
                              ? 'Active — click to pause'
                              : 'Paused — click to activate'
                          }
                          className={`cursor-pointer rounded-full px-2 py-0.5 font-bold text-[10px] transition-colors ${
                            item.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {item.is_active ? 'Active' : 'Paused'}
                        </button>
                        <IconButton
                          tone="danger"
                          aria-label="Remove featured salon"
                          onClick={() => void onDelete(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        </IconButton>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : featuredServices.length === 0 ? (
            <EmptyState
              icon={Scissors}
              title="No featured services yet"
              description="Spotlight signature treatments from any salon to feature on the client homepage hero showcase."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {featuredServices.map((item) => {
                const hasRating =
                  typeof item.service.rating_avg === 'number' && item.service.rating_avg > 0

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs transition-all hover:border-slate-300"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {item.service.images?.cover ? (
                          <Image
                            src={String(item.service.images.cover)}
                            alt={item.service.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <Scissors className="m-auto mt-3 h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-bold text-xs text-slate-900">
                            {item.service.name}
                          </span>
                          <Badge tone="purple" className="px-1.5 py-0 text-[10px]">
                            {item.badge_text}
                          </Badge>
                        </div>
                        <p className="truncate text-[11px] text-slate-500">
                          {item.service.organization_name || 'Salon service'} • $
                          {item.service.base_price}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                          <span>Order #{item.display_order}</span>
                          <span>•</span>
                          <span>{item.service.duration_minutes}m</span>
                          {hasRating && (
                            <>
                              <span>•</span>
                              <span className="flex items-center font-medium text-amber-600">
                                ★ {item.service.rating_avg?.toFixed(1)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ml-2 flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void onToggleActive(item)}
                        title={
                          item.is_active ? 'Active — click to pause' : 'Paused — click to activate'
                        }
                        className={`cursor-pointer rounded-full px-2 py-0.5 font-bold text-[10px] transition-colors ${
                          item.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {item.is_active ? 'Active' : 'Paused'}
                      </button>
                      <IconButton
                        tone="danger"
                        aria-label="Remove featured service"
                        onClick={() => void onDelete(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      </IconButton>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
