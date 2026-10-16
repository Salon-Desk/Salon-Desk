'use client'

import { Clock, Edit2, Loader2, Plus, Scissors } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Badge, Card, EmptyState, IconButton, SearchInput } from '@/components/ui'
import { toastColor } from '@/constant/toast-color'
import { formatUsd } from '@/lib/format'
import { useGetCatalogCategoriesQuery } from '@/store/slice/catalogApi'
import { useGetMyServicesQuery, useUpdateMyServiceMutation } from '@/store/slice/organizationApi'
import type { ApiOrgService } from '@/types/api-org'

import { OrgServiceFormModal } from '../_components/org-service-form-modal'

export default function MerchantServicesPage() {
  const { data: services = [], isLoading, isError, refetch } = useGetMyServicesQuery()
  const { data: categories = [] } = useGetCatalogCategoriesQuery()
  const [deactivateService, { isLoading: deactivating }] = useUpdateMyServiceMutation()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<ApiOrgService | null>(null)

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((c) => map.set(c.id, c.name))
    return map
  }, [categories])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: services.length }
    services.forEach((s) => {
      counts[s.service_category_id] = (counts[s.service_category_id] || 0) + 1
    })
    return counts
  }, [services])

  const categoryFilters = useMemo(() => {
    const ids = new Set(services.map((s) => s.service_category_id))
    return ['ALL', ...Array.from(ids)]
  }, [services])

  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return services.filter((s) => {
      const matchesCat = selectedCategory === 'ALL' || s.service_category_id === selectedCategory
      const catName = categoryNameById.get(s.service_category_id) || ''
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      return matchesCat && matchesQuery
    })
  }, [services, selectedCategory, searchQuery, categoryNameById])

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
              : `${services.length} services configured for client online booking`}
          </p>
        </div>
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

      {/* Search and Category Filter Tabs */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by service name or description…"
          shortcut="⌘K"
          className="w-full sm:max-w-xs text-xs"
        />

        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categoryFilters.map((id) => {
            const label = id === 'ALL' ? 'All Services' : categoryNameById.get(id) || 'Category'
            const count = categoryCounts[id] ?? 0
            const isActive = selectedCategory === id

            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedCategory(id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
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

      {!isLoading && !isError && filteredServices.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="No services found"
          description={
            searchQuery
              ? `No services match "${searchQuery}". Clear your search query or switch categories.`
              : 'You have not added any services in this category yet.'
          }
          action={
            searchQuery ? (
              <PrimaryButton
                title="Clear filter"
                size="sm"
                fullWidth={false}
                className="h-8 rounded-lg px-3.5 text-xs"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('ALL')
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((service) => {
          const isActive = service.status === 'active'

          return (
            <Card
              key={service.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            >
              <div className="space-y-2.5">
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
