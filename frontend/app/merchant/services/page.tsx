'use client'

import { Clock, Edit2, Loader2, Plus, Scissors } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Pagination } from '@/components/table/Pagination'
import { Badge, Card, EmptyState, IconButton, SearchInput } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { useAgentUiActions } from '@/hooks/useAgentUiActions'
import { useListingParams } from '@/hooks/useListingParams'
import { formatUsd } from '@/lib/format'
import { buildClientCatalogCategoriesApiParams } from '@/lib/listing-params/client-catalog-categories-list-params'
import {
  buildMerchantServicesCategoryCountsApiParams,
  merchantServicesListDefaults,
  type MerchantServicesListParams,
  MerchantServicesListParamsSchema,
} from '@/lib/listing-params/merchant-services-list-params'
import { resolveImageSrc, shouldUnoptimizeImage } from '@/lib/util/remoteImage'
import { useGetCatalogCategoriesQuery } from '@/store/api/clientApi'
import { useGetMyServicesQuery, useUpdateMyServiceMutation } from '@/store/api/orgApi'
import type { ApiOrgService } from '@/types/api-org'

import { OrgServiceFormModal } from '../_components/org-service-form-modal'

export default function MerchantServicesPage() {
  const { params, displayParams, setParam, setParams } = useListingParams<
    MerchantServicesListParams,
    typeof MerchantServicesListParamsSchema
  >(MerchantServicesListParamsSchema)

  const { data: allServicesData } = useGetMyServicesQuery(
    buildMerchantServicesCategoryCountsApiParams(),
  )
  const { data: servicesData, isLoading, isError, refetch } = useGetMyServicesQuery(params)
  const { data: categoriesData } = useGetCatalogCategoriesQuery(
    buildClientCatalogCategoriesApiParams(),
  )
  const services = servicesData?.items ?? []
  const allServices = allServicesData?.items ?? []
  const totalItems = servicesData?.total ?? services.length
  const categories = categoriesData?.items ?? []
  const [deactivateService, { isLoading: deactivating }] = useUpdateMyServiceMutation()

  const settledSearch = typeof params.q === 'string' ? params.q : ''
  const selectedCategory = displayParams.categoryId
  const currentPage = displayParams.page
  const pageSize = displayParams.limit

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<ApiOrgService | null>(null)

  useAgentUiActions({
    onOpenAddService: () => {
      setEditing(null)
      setIsFormOpen(true)
    },
  })

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((c) => map.set(c.id, c.name))
    return map
  }, [categories])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: allServices.length }
    allServices.forEach((s) => {
      counts[s.service_category_id] = (counts[s.service_category_id] || 0) + 1
    })
    return counts
  }, [allServices])

  const categoryFilters = useMemo(() => {
    const ids = new Set(allServices.map((s) => s.service_category_id))
    return ['ALL', ...Array.from(ids)]
  }, [allServices])

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedServices = services

  const handleDeactivate = async (service: ApiOrgService) => {
    try {
      await deactivateService({
        serviceId: service.id,
        body: { status: 'inactive' },
      }).unwrap()
      toast.success(`${service.name} marked inactive`, toastColor.success)
      void refetch()
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not update service'
      toast.error(String(message), toastColor.error)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Service Catalog &amp; Menus
          </h1>
          <p className="text-slate-500 text-xs">
            {isLoading
              ? 'Loading…'
              : `${allServices.length} services configured for client online booking`}
          </p>
        </div>
        <div data-agent-action="add-service">
          <PrimaryButton
            title="Add new service"
            size="sm"
            fullWidth={false}
            icon={<Plus className="h-4 w-4" />}
            className="h-9 rounded-lg px-3.5 text-xs font-semibold shadow-xs"
            onClick={() => {
              setEditing(null)
              setIsFormOpen(true)
            }}
          />
        </div>
      </div>

      {/* Search and Category Filter Tabs */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={displayParams.search}
          onChange={(q) => setParams({ search: q, page: 1 })}
          placeholder="Search by service name or description…"
          shortcut="⌘K"
          className="w-full sm:max-w-xs text-xs"
        />

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categoryFilters.map((id) => {
            const label = id === 'ALL' ? 'All Services' : categoryNameById.get(id) || 'Category'
            const count = categoryCounts[id] ?? 0
            const isActive = selectedCategory === id

            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setParams({ categoryId: id, page: 1 })
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading services…
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <p>Could not load services.</p>
          <PrimaryButton
            title="Retry"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="mt-3 h-8.5 rounded-lg px-4"
            onClick={() => void refetch()}
          />
        </div>
      ) : null}

      {!isLoading && !isError && paginatedServices.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="No services found"
          description={
            settledSearch
              ? `No services match "${settledSearch}". Clear your search query or switch categories.`
              : 'You have not added any services in this category yet.'
          }
          action={
            settledSearch ? (
              <PrimaryButton
                title="Clear filter"
                size="sm"
                fullWidth={false}
                className="h-8 rounded-lg px-3.5 text-xs"
                onClick={() => {
                  setParams(merchantServicesListDefaults)
                }}
              />
            ) : (
              <PrimaryButton
                title="Create service"
                size="sm"
                fullWidth={false}
                icon={<Plus className="h-3.5 w-3.5" />}
                className="h-8 rounded-lg px-3.5 text-xs"
                onClick={() => {
                  setEditing(null)
                  setIsFormOpen(true)
                }}
              />
            )
          }
        />
      ) : null}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedServices.map((service) => {
            const isActive = service.status === 'active'

            return (
              <Card
                key={service.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
              >
                <div className="space-y-2.5">
                  {/* Cover Image */}
                  {service.images &&
                  typeof service.images === 'object' &&
                  'cover' in service.images &&
                  service.images.cover ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
                      <Image
                        src={resolveImageSrc(service.images.cover as string)}
                        alt={service.name}
                        fill
                        className="object-cover"
                        unoptimized={shouldUnoptimizeImage(service.images.cover as string)}
                      />
                    </div>
                  ) : null}

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 tracking-tight">
                        {service.name}
                      </h3>
                      <p className="text-xs font-medium text-amber-800">
                        {categoryNameById.get(service.service_category_id) || 'General Service'}
                      </p>
                    </div>
                    <Badge tone={isActive ? 'emerald' : 'slate'} size="sm">
                      {service.status || 'Active'}
                    </Badge>
                  </div>

                  <p className="line-clamp-2 text-xs text-slate-500 leading-relaxed">
                    {service.description ||
                      'Professional salon service with zero-debit deposit protection.'}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <div className="text-base font-extrabold text-slate-900 font-mono">
                      {formatUsd(Number(service.base_price))}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-600 border border-slate-200/70">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {service.duration_minutes}m duration
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="font-mono text-[11px] text-slate-400">
                    ID: {service.id.slice(0, 8)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <IconButton
                      aria-label="Edit service"
                      onClick={() => {
                        setEditing(service)
                        setIsFormOpen(true)
                      }}
                      className="rounded-lg"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </IconButton>
                    {service.status !== 'inactive' ? (
                      <PrimaryButton
                        title="Deactivate"
                        variant="ghost"
                        size="sm"
                        fullWidth={false}
                        isDisabled={deactivating}
                        className="h-7.5 rounded-lg px-2.5 text-xs text-slate-500 hover:text-rose-700"
                        onClick={() => void handleDeactivate(service)}
                      />
                    ) : null}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {paginatedServices.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            setCurrentPage={(page) => setParam('page', page)}
            onPageSizeChange={(size) => setParams({ limit: size, page: 1 })}
            pageSizeOptions={[6, 9, 15, 30]}
          />
        )}
      </div>

      <OrgServiceFormModal
        open={isFormOpen}
        editing={editing}
        onClose={() => {
          setIsFormOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}
