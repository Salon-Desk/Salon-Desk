'use client'

import { Clock, Edit2, Loader2, Plus, Scissors } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import PrimaryButton from '@/components/button/PrimaryButton'
import { Card, IconButton, SearchInput } from '@/components/ui'
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

  const categoryFilters = useMemo(() => {
    const ids = new Set(services.map((s) => s.service_category_id))
    return ['ALL', ...Array.from(ids)]
  }, [services])

  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase()
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
      toast.success('Service marked inactive', toastColor.success)
      void refetch()
    } catch (err) {
      const message =
        (err as { data?: { detail?: string } })?.data?.detail || 'Could not update service'
      toast.error(String(message), toastColor.error)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Services &amp; Pricing
          </h1>
          <p className="text-slate-500 text-xs">
            {isLoading ? 'Loading…' : `${services.length} services from your organization`}
          </p>
        </div>
        <PrimaryButton
          title="Add service"
          size="sm"
          fullWidth={false}
          icon={<Plus className="h-4 w-4" />}
          className="h-9 rounded-xl px-3.5 text-xs"
          onClick={() => {
            setEditing(null)
            setIsFormOpen(true)
          }}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search services…"
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedCategory(id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCategory === id
                  ? 'bg-stone-950 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {id === 'ALL' ? 'All' : categoryNameById.get(id) || 'Category'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          Loading services…
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          <p>Could not load services.</p>
          <PrimaryButton
            title="Retry"
            variant="outline"
            size="sm"
            fullWidth={false}
            className="mt-3 h-9 rounded-xl px-4"
            onClick={() => void refetch()}
          />
        </div>
      ) : null}

      {!isLoading && !isError && filteredServices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <Scissors className="mx-auto h-7 w-7 text-slate-300" />
          <p className="mt-2.5 text-sm font-medium text-slate-700">No services found</p>
          <p className="mt-1 text-xs text-slate-500">
            {services.length === 0
              ? 'Get started by creating your first service menu item.'
              : 'Try clearing your search query or choosing another category filter.'}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((service) => (
          <Card
            key={service.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-slate-900">{service.name}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-700">
                  {service.status}
                </span>
              </div>
              <p className="text-xs text-amber-800">
                {categoryNameById.get(service.service_category_id) || 'Uncategorized'}
              </p>
              <p className="line-clamp-2 text-xs text-slate-500">
                {service.description || 'No description'}
              </p>
              <div className="flex items-center justify-between pt-2 text-xs font-semibold text-slate-800">
                <span>{formatUsd(Number(service.base_price))}</span>
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  {service.duration_minutes} min
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-1 border-t border-slate-100 pt-3">
              <IconButton
                aria-label="Edit service"
                onClick={() => {
                  setEditing(service)
                  setIsFormOpen(true)
                }}
              >
                <Edit2 className="h-4 w-4" />
              </IconButton>
              {service.status !== 'inactive' ? (
                <PrimaryButton
                  title="Deactivate"
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  isDisabled={deactivating}
                  className="h-8 rounded-lg px-2 text-xs"
                  onClick={() => void handleDeactivate(service)}
                />
              ) : null}
            </div>
          </Card>
        ))}
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
