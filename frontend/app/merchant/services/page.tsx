'use client'

import { Clock, Edit2, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button, Card, IconButton, SearchInput } from '@/components/ui'
import { formatUsd } from '@/lib/format'

import { useMerchantContext } from '../_context/merchant-context'

export default function MerchantServicesPage() {
  const { state, openAddService, openEditService, openDeleteService } = useMerchantContext()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  const categories = useMemo(() => {
    const cats = new Set<string>()
    state.services.forEach((s) => {
      if (s.category) cats.add(s.category)
    })
    return ['ALL', ...Array.from(cats)]
  }, [state.services])

  const filteredServices = useMemo(() => {
    return state.services.filter((s) => {
      const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory
      const query = searchQuery.toLowerCase()
      const matchesQuery =
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
      return matchesCat && matchesQuery
    })
  }, [selectedCategory, searchQuery, state.services])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-extrabold text-slate-900 text-xl tracking-tight sm:text-2xl">
            Services &amp; Pricing
          </h1>
          <p className="text-slate-500 text-xs">
            {state.services.length} services · Client authorization hold rates
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openAddService}
          className="rounded-xl px-3.5 py-2 font-medium text-xs shadow-xs"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Service
        </Button>
      </div>

      {/* Filter & Category Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search services..."
            className="w-full text-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-2.5 py-1 font-medium text-xs transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {cat === 'ALL' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((srv) => (
          <Card
            key={srv.id}
            hoverTone="amber"
            className="flex flex-col justify-between space-y-4 rounded-3xl p-5 border border-slate-200/90 bg-white shadow-xs transition-all hover:shadow-sm"
          >
            <div>
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 font-medium text-[10px] text-amber-900">
                  {srv.category}
                </span>
                <span className="flex items-center gap-1 font-mono text-slate-500 text-[11px]">
                  <Clock className="h-3 w-3 text-slate-400" />
                  {srv.durationMin}m
                </span>
              </div>

              <h3 className="mb-1 font-bold text-base text-slate-900">{srv.name}</h3>
              <p className="mb-3 line-clamp-2 text-slate-500 text-xs leading-relaxed">
                {srv.description || 'Styling service.'}
              </p>

              {/* Price & Hold Box */}
              <div className="space-y-1.5 rounded-xl border border-slate-200/70 bg-slate-50/60 p-3 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Price:</span>
                  <span className="text-slate-900 font-bold">{formatUsd(srv.price)}</span>
                </div>
                <div className="flex justify-between items-center text-amber-900 font-medium border-slate-200/60 border-t pt-1">
                  <span>PayPal Hold:</span>
                  <span>{formatUsd(srv.holdDeposit)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px] border-slate-200/60 border-t pt-1">
                  <span>No-Show Retention:</span>
                  <span>{formatUsd(srv.noShowFee)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-slate-100 border-t pt-3 text-xs">
              <span className="font-mono text-[10px] text-slate-400">{srv.id}</span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEditService(srv)}
                  className="rounded-xl font-medium text-xs h-7 px-2.5"
                >
                  <Edit2 className="h-3 w-3 mr-1 text-slate-500" />
                  Edit
                </Button>
                <IconButton
                  aria-label="Delete service"
                  onClick={() => openDeleteService(srv)}
                  className="rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 h-7 w-7"
                >
                  <Trash2 className="h-3 w-3" />
                </IconButton>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
